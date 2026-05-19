import { Injectable, inject, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Observable, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { CampaignApi } from '@data/api/campaign.api';
import { Campaign } from '@data/model/campaign.model';
import { CampaignNotification, CampaignNotificationFilter, CampaignStats } from '@data/model/campaign-notification.model';
import { RealtimeEventBus } from '@core/realtime/services/realtime-event-bus.service';
import { WebsocketService } from '@core/realtime/services/websocket.service';
import { RealtimeEventParserService } from '@core/realtime/services/realtime-event-parser.service';
import { NotificationStatusEvent, CampaignStatusEvent, BaseRealtimeEvent } from '@core/realtime/models/realtime-event.model';
import { QueryClient, injectQuery, injectInfiniteQuery } from '@tanstack/angular-query-experimental';
import { campaignKeys } from '@data/store/campaign/campaign-keys';
import { NotificationCacheService } from '@data/store/campaign/notification-cache.service';
import { CampaignCacheService } from '@data/store/campaign/campaign-cache.service';

export interface NotificationPageState {
  notifications: CampaignNotification[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  error: string | null;
  hasMore: boolean;
  totalElements: number;
}

@Injectable()
export class CampaignNotificationRepository {
  private readonly api = inject(CampaignApi);
  private readonly router = inject(Router);
  private readonly eventBus = inject(RealtimeEventBus);
  private readonly websocketService = inject(WebsocketService);
  private readonly queryClient = inject(QueryClient);
  private readonly notifCacheService = inject(NotificationCacheService);
  private readonly campaignCacheService = inject(CampaignCacheService);
  private readonly destroyRef = inject(DestroyRef);

  // --- UI State (Signals) ---
  readonly campaignId = signal<string | null>(null);

  // page is now managed by TanStack Query, so filter state only needs business filters
  readonly filters = signal<Omit<CampaignNotificationFilter, 'page'>>({ size: 10 });
  readonly activeNotificationId = signal<number | null>(null);

  // --- Initial Navigation State ---
  private readonly initialCampaign: Campaign | null = (() => {
    try {
      const navigation = this.router.getCurrentNavigation();
      return (navigation?.extras?.state?.['campaign'] as Campaign) || null;
    } catch {
      return null;
    }
  })();

  // --- Server State (TanStack Query) ---
  readonly campaignQuery = injectQuery(() => {
    const id = this.campaignId();
    return {
      queryKey: id ? campaignKeys.detail(id) : [],
      enabled: !!id,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      queryFn: async () => {
        if (this.initialCampaign && String(this.initialCampaign.id) === id) {
          return this.initialCampaign;
        }
        try {
          return await firstValueFrom(this.api.getCampaignById(id!));
        } catch (err) {
          console.warn('Failed to load campaign info. Returning default.', err);
          return {
            id: id,
            name: `Campaign #${id}`,
            status: 'ACTIVE',
            channel: 'MULTI',
            totalTarget: 0,
            sentStatus: { sent: 0, failed: 0, pending: 0 },
            createdAt: new Date().toISOString()
          } as Campaign;
        }
      }
    };
  });

  readonly notificationsQuery = injectInfiniteQuery(() => {
    const id = this.campaignId();
    const filterParams = this.filters();
    return {
      queryKey: id ? campaignKeys.notifications(id, filterParams) : [],
      enabled: !!id,
      initialPageParam: 0,
      maxPages: 5, // Prevent memory leak for 100k+ notifications
      staleTime: 1000 * 60 * 2, // 2 minutes before background refetch
      gcTime: 1000 * 60 * 15, // 15 minutes before garbage collection
      queryFn: async ({ pageParam }) => {
        const fullFilters = { ...filterParams, page: pageParam as number };
        const response = await firstValueFrom(this.api.getCampaignNotifications(id!, fullFilters as CampaignNotificationFilter));
        return this.notifCacheService.patchWithRealtime(response);
      },
      getNextPageParam: (lastPage, allPages) => {
        if (!lastPage || lastPage.last) return undefined;
        return allPages.length;
      }
    };
  });

  // --- Derived Observables/Signals for backward compatibility ---
  readonly state = computed<NotificationPageState>(() => {
    const q = this.notificationsQuery;
    const data = q.data();

    // Flatten accumulated pages
    const flattenedNotifications = data?.pages.flatMap(page => page.content) || [];
    // Total elements from the most recent page
    const totalElements = data?.pages.length ? data.pages[data.pages.length - 1].totalElements : 0;

    return {
      notifications: flattenedNotifications,
      isLoading: q.isLoading(),
      isFetchingNextPage: q.isFetchingNextPage(),
      error: q.isError() ? 'Failed to load notifications. Please retry.' : null,
      hasMore: q.hasNextPage(),
      totalElements
    };
  });

  readonly stats = computed<CampaignStats>(() => {
    const notifications = this.state().notifications;
    let sent = 0, failed = 0, pending = 0;
    let push = 0, email = 0, sms = 0;

    notifications.forEach(n => {
      const status = n.status.toUpperCase().trim();
      if (status === 'SENT') sent++;
      else if (status === 'FAILED') failed++;
      else if (status === 'PENDING') pending++;

      const ch = n.channel.toUpperCase().trim();
      if (ch === 'PUSH') push++;
      else if (ch === 'EMAIL') email++;
      else if (ch === 'SMS') sms++;
    });

    const total = notifications.length;
    let detectedChannel: 'PUSH' | 'EMAIL' | 'SMS' | 'MULTI' = 'MULTI';
    if (total > 0) {
      const hasPush = push > 0;
      const hasEmail = email > 0;
      const hasSms = sms > 0;
      if (hasPush && !hasEmail && !hasSms) detectedChannel = 'PUSH';
      else if (!hasPush && hasEmail && !hasSms) detectedChannel = 'EMAIL';
      else if (!hasPush && !hasEmail && hasSms) detectedChannel = 'SMS';
    }

    return { sent, failed, pending, total, channel: detectedChannel, push, email, sms };
  });

  // Backward compatible observable wrappers for the component
  readonly campaign$ = toObservable(this.campaignQuery.data);
  readonly state$ = toObservable(this.state);
  readonly stats$ = toObservable(this.stats);

  constructor() {
    this.initRealtimeSubscription();
    this.initReconnectRecovery();
  }

  private initRealtimeSubscription(): void {
    // 1. Subscribe to Global Notifications Topic (Batch Mode)
    this.eventBus.observeTopic('/topic/notifications')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (eventsBatch: BaseRealtimeEvent[]) => {
          const currentCampaignId = this.campaignId();
          if (currentCampaignId && eventsBatch.length > 0) {
            // Filter only NOTIFICATION_STATUS_CHANGED events
            const notifEvents = eventsBatch.filter(e => e.type === 'NOTIFICATION_STATUS_CHANGED') as NotificationStatusEvent[];
            if (notifEvents.length > 0) {
              this.notifCacheService.updateNotificationsBatch(currentCampaignId, notifEvents);
            }
          }
        },
        error: (err) => console.error('[Realtime] Subscription error in global notifications topic:', err)
      });

    // 2. Subscribe to Dynamic Campaign Topic (Batch Mode)
    toObservable(this.campaignId).subscribe(id => {
      if (id) {
        this.eventBus.observeTopic(`/topic/campaign/${id}`)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (eventsBatch: BaseRealtimeEvent[]) => {
              const campEvents = eventsBatch.filter(e => e.type === 'CAMPAIGN_STATUS_CHANGED') as CampaignStatusEvent[];
              // Process the last campaign event in the batch (status updates overwrite each other)
              if (campEvents.length > 0) {
                const latestCampEvent = campEvents[campEvents.length - 1];
                console.log('[Realtime] Campaign update received:', latestCampEvent);
                this.campaignCacheService.updateCampaignStatusInCache(latestCampEvent);
              }
            }
          });
      }
    });
  }

  private initReconnectRecovery(): void {
    // 3. Offline Recovery
    this.websocketService.reconnect$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const id = this.campaignId();
        if (id) {
          console.warn('[Repository] Reconnected! Triggering query invalidation to sync gap events.');
          this.notifCacheService.recoverOfflineState(id);
        }
      });
  }

  setCampaignId(id: string): void {
    this.campaignId.set(id);
  }

  setActiveNotificationId(id: number | null): void {
    this.activeNotificationId.set(id);
  }

  updateFilters(partialFilter: Partial<CampaignNotificationFilter>): void {
    const current = this.filters();

    // Create new filter without the page property since it's handled by infinite query
    const { page, ...filteredPartial } = partialFilter as any;

    this.filters.set({
      ...current,
      ...filteredPartial
    });
  }

  loadNextPage(): void {
    if (this.notificationsQuery.hasNextPage() && !this.notificationsQuery.isFetchingNextPage()) {
      this.notificationsQuery.fetchNextPage();
    }
  }

  retryNotification(notificationId: number): Observable<unknown> {
    return this.api.retryNotification(notificationId);
  }

  getNotificationDetails(notificationId: number): Observable<any> {
    return this.api.getNotificationDetails(notificationId);
  }
}
