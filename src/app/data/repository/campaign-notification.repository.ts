import { Injectable, inject, DestroyRef, signal, computed, effect } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Observable, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { CampaignApi } from '../../data/api/campaign.api';
import { Campaign } from '../../data/model/campaign.model';
import { CampaignNotification, CampaignNotificationFilter, CampaignStats } from '../../data/model/campaign-notification.model';
import { QueryClient, injectQuery, injectInfiniteQuery } from '@tanstack/angular-query-experimental';
import { campaignKeys } from '../store/campaign/campaign-keys';
import { WebsocketGateway } from '@core/realtime/services/websocket-gateway.service';
import { RealtimeQueryRegistry } from '../store/campaign/realtime-query-registry.service';

export interface CampaignOverviewVM {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  successRate: number;
  health: {
    level: 'healthy' | 'warning' | 'critical';
    message: string;
    description: string;
  };
  activeStatus: 'SENT' | 'FAILED' | 'PENDING' | '';
  isEmpty: boolean;
}

export interface NotificationPageState {
  notifications: CampaignNotification[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  error: string | null;
  hasMore: boolean;
  totalElements: number;
}

@Injectable({
  providedIn: 'root'
})
export class CampaignNotificationRepository {
  private readonly api = inject(CampaignApi);
  private readonly router = inject(Router);
  private readonly queryClient = inject(QueryClient);
  private readonly websocketGateway = inject(WebsocketGateway);
  private readonly registry = inject(RealtimeQueryRegistry);
  private readonly destroyRef = inject(DestroyRef);

  // --- UI State (Signals) ---
  readonly campaignId = signal<string | null>(null);
  readonly filters = signal<Omit<CampaignNotificationFilter, 'page'>>({ size: 20 });
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
      staleTime: 0, // Always refetch campaign to get fresh stats
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
      maxPages: 10, // Prevent memory leak for large notification sets
      staleTime: 1000 * 60 * 2, // 2 minutes before background refetch
      gcTime: 1000 * 60 * 15, // 15 minutes before garbage collection
      queryFn: async ({ pageParam }) => {
        const fullFilters = { ...filterParams, page: pageParam as number };
        return await firstValueFrom(this.api.getCampaignNotifications(id!, fullFilters as CampaignNotificationFilter));
      },
      getNextPageParam: (lastPage, allPages) => {
        if (!lastPage || lastPage.last) return undefined;
        return allPages.length;
      }
    };
  });

  // --- Derived UI State computed cleanly from TanStack Query Cache ---
  readonly state = computed<NotificationPageState>(() => {
    const id = this.campaignId();
    if (!id) {
      return {
        notifications: [],
        isLoading: false,
        isFetchingNextPage: false,
        error: null,
        hasMore: false,
        totalElements: 0
      };
    }

    const query = this.notificationsQuery;
    const data = query.data();
    const notifications = data?.pages.flatMap(page => page.content) ?? [];

    const isFetchingFirstPage = (query.isLoading() || query.isFetching()) && !query.isFetchingNextPage();
    const isLoading = notifications.length === 0 ? isFetchingFirstPage : false;
    const hasMore = query.hasNextPage();
    const totalElements = data?.pages[0]?.totalElements ?? notifications.length;

    return {
      notifications,
      isLoading,
      isFetchingNextPage: query.isFetchingNextPage(),
      error: query.isError() ? 'Failed to load notifications. Please retry.' : null,
      hasMore,
      totalElements
    };
  });

  readonly overviewVM = computed<CampaignOverviewVM>(() => {
    const campaign = this.campaignQuery.data();
    const filters = this.filters();
    const notifications = this.state().notifications;

    if (!campaign) {
      return {
        total: 0,
        sent: 0,
        failed: 0,
        pending: 0,
        successRate: 0,
        health: {
          level: 'healthy',
          message: 'No Campaign Selected',
          description: 'Please select a campaign to view details.'
        },
        activeStatus: '',
        isEmpty: true
      };
    }

    // --- Compute live stats reactively from the state notifications ---
    let liveSent = 0;
    let liveFailed = 0;
    let livePending = 0;
    const hasLiveData = notifications.length > 0;

    if (hasLiveData) {
      notifications.forEach(notification => {
        if (!notification) return;
        const status = notification.status?.trim().toUpperCase();
        if (status === 'SENT') liveSent++;
        else if (status === 'FAILED') liveFailed++;
        else if (status === 'PENDING') livePending++;
      });
    }

    // Use live store counts when available; fall back to backend campaign.sentStatus
    const sent = hasLiveData ? liveSent : (campaign.sentStatus?.sent ?? 0);
    const failed = hasLiveData ? liveFailed : (campaign.sentStatus?.failed ?? 0);
    const pending = hasLiveData ? livePending : (campaign.sentStatus?.pending ?? 0);

    // Total: prefer backend totalTarget (all recipients), supplement with store counts
    const total = campaign.totalTarget || (campaign.sentStatus?.sent ?? 0) + (campaign.sentStatus?.failed ?? 0) + (campaign.sentStatus?.pending ?? 0) || (sent + failed + pending);
    const successRate = total > 0 ? Math.round((sent / total) * 100) : 0;

    // Domain-aware Health Calculation
    let level: 'healthy' | 'warning' | 'critical' = 'healthy';
    let message = 'Campaign is Healthy';
    let description = `${successRate}% notifications delivered successfully.`;

    const failureRate = total > 0 ? failed / total : 0;

    if (total === 0) {
      level = 'healthy';
      message = 'No notifications sent yet';
      description = 'Create your first notification to start tracking delivery health.';
    } else if (failureRate > 0.05) {
      level = 'critical';
      message = 'Critical failure rate detected';
      description = `${failed} failed deliveries (${Math.round(failureRate * 100)}%) require immediate operational attention.`;
    } else if (failed > 0) {
      level = 'warning';
      message = 'Failed deliveries detected';
      description = `${failed} delivery issue${failed > 1 ? 's' : ''} require review. Success rate is at ${successRate}%.`;
    } else if (pending > 0) {
      // Check if scheduled time or creation is stale (e.g. 10 minutes staleness threshold)
      const scheduledTimeStr = campaign.scheduledTime || campaign.createdAt;
      const scheduledTime = new Date(scheduledTimeStr).getTime();
      const isStale = (Date.now() - scheduledTime) > 10 * 60 * 1000;

      if (isStale) {
        level = 'warning';
        message = 'Transmission stalling detected';
        description = `${pending} notification${pending > 1 ? 's' : ''} stuck in queue for more than 10 minutes.`;
      } else {
        level = 'healthy';
        message = 'Deliveries in progress';
        description = `${pending} notification${pending > 1 ? 's' : ''} currently in processing queue.`;
      }
    } else {
      level = 'healthy';
      message = 'All deliveries completed';
      description = `Campaign successfully processed all ${total} notifications with a ${successRate}% delivery rate.`;
    }

    return {
      total,
      sent,
      failed,
      pending,
      successRate,
      health: {
        level,
        message,
        description
      },
      activeStatus: (filters.status as any) || '',
      isEmpty: total === 0
    };
  });

  // Backward compatible observable wrappers for OnPush / components
  readonly campaign$ = toObservable(this.campaignQuery.data);
  readonly state$ = toObservable(this.state);
  readonly overviewVM$ = toObservable(this.overviewVM);

  constructor() {
    // Register active notification query key in the registry reactively
    effect((onCleanup) => {
      const id = this.campaignId();
      const filterParams = this.filters();
      if (id) {
        const queryKey = campaignKeys.notifications(id, filterParams);
        this.registry.registerNotificationQuery(id, queryKey);
        onCleanup(() => {
          this.registry.unregisterNotificationQuery(id, queryKey);
        });
      }
    });
  }

  setCampaignId(id: string): void {
    const previousId = this.campaignId();

    // Unsubscribe from previous campaign topic when switching campaigns
    if (previousId && previousId !== id) {
      this.websocketGateway.unsubscribeFromCampaign(previousId);
    }

    this.campaignId.set(id);

    // Subscribe to the campaign-specific WS topic for real-time notification updates
    this.websocketGateway.subscribeToCampaign(id);
  }

  setActiveNotificationId(id: number | null): void {
    this.activeNotificationId.set(id);
  }

  /** Called by component OnDestroy to clean up campaign WS topic subscription */
  cleanupCampaign(id: string): void {
    this.websocketGateway.unsubscribeFromCampaign(id);
  }

  updateFilters(partialFilter: Partial<CampaignNotificationFilter>): void {
    const current = this.filters();
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

  /**
   * Transactional Optimistic status patching with rollback support
   */
  applyOptimisticStatus(notificationId: number, status: 'PENDING' | 'SENT' | 'FAILED'): CampaignNotification | null {
    const id = this.campaignId();
    if (!id) return null;

    let snapshot: CampaignNotification | null = null;
    
    // Find the item first
    const activeQueries = this.queryClient.getQueryCache().findAll({
      predicate: (query) =>
        query.queryKey[0] === 'campaigns' &&
        query.queryKey[1] === 'detail' &&
        query.queryKey[2] === id &&
        query.queryKey[3] === 'notifications'
    });

    for (const query of activeQueries) {
      const data = this.queryClient.getQueryData<any>(query.queryKey);
      if (data && data.pages) {
        for (const page of data.pages) {
          const found = page.content.find((x: CampaignNotification) => x.id === notificationId);
          if (found) {
            snapshot = { ...found };
            break;
          }
        }
      }
      if (snapshot) break;
    }

    // Also update TanStack Query cache to stay in sync
    this.updateQueryCacheItem(notificationId, status);

    return snapshot;
  }

  rollbackStatus(notificationId: number, snapshot: CampaignNotification | null) {
    const id = this.campaignId();
    if (!id || !snapshot) return;

    this.updateQueryCacheItem(notificationId, snapshot.status);
  }

  private updateQueryCacheItem(notificationId: number, status: 'PENDING' | 'SENT' | 'FAILED') {
    const campaignId = this.campaignId();
    if (!campaignId) return;

    const activeQueries = this.queryClient.getQueryCache().findAll({
      predicate: (query) =>
        query.queryKey[0] === 'campaigns' &&
        query.queryKey[1] === 'detail' &&
        query.queryKey[2] === campaignId &&
        query.queryKey[3] === 'notifications'
    });

    activeQueries.forEach(query => {
      this.queryClient.setQueryData<any>(query.queryKey, (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        const newPages = oldData.pages.map((page: any) => {
          const newContent = page.content.map((item: CampaignNotification) => {
            if (item.id === notificationId) {
              return { ...item, status, updatedAt: new Date().toISOString() };
            }
            return item;
          });
          return { ...page, content: newContent };
        });
        return { ...oldData, pages: newPages };
      });
    });
  }

  retryNotification(notificationId: number): Observable<unknown> {
    return this.api.retryNotification(notificationId);
  }

  getNotificationDetails(notificationId: number): Observable<any> {
    return this.api.getNotificationDetails(notificationId);
  }
}
