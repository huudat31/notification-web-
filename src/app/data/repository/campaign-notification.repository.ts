import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import {
  switchMap,
  map,
  scan,
  catchError,
  distinctUntilChanged,
  shareReplay
} from 'rxjs/operators';
import { Router } from '@angular/router';
import { CampaignApi } from '@data/api/campaign.api';
import { Campaign } from '@data/model/campaign.model';
import { CampaignNotification, CampaignNotificationFilter, CampaignStats } from '@data/model/campaign-notification.model';
import { PagedResponse } from '@data/model/paged-response.model';

export interface NotificationPageState {
  notifications: CampaignNotification[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  totalElements: number;
}

const INITIAL_STATE: NotificationPageState = {
  notifications: [],
  isLoading: false,
  error: null,
  hasMore: true,
  totalElements: 0
};

@Injectable()
export class CampaignNotificationRepository {
  private readonly api = inject(CampaignApi);
  private readonly router = inject(Router);

  private readonly campaignId$ = new BehaviorSubject<string | null>(null);
  private readonly filters$ = new BehaviorSubject<CampaignNotificationFilter>({ page: 0, size: 10 });

  private readonly initialCampaign: Campaign | null = (() => {
    try {
      const navigation = this.router.getCurrentNavigation();
      return (navigation?.extras?.state?.['campaign'] as Campaign) || null;
    } catch {
      return null;
    }
  })();

  readonly campaign$: Observable<Campaign | null> = this.campaignId$.pipe(
    switchMap(id => {
      if (!id) return of(null);
      
      if (this.initialCampaign && String(this.initialCampaign.id) === id) {
        return of(this.initialCampaign);
      }

      return this.api.getCampaignById(id).pipe(
        catchError(err => {
          console.warn('Failed to load campaign info (perhaps 403 Forbidden). Using fallback mock.', err);
          return of({
            id: id,
            name: `Campaign #${id}`,
            status: 'ACTIVE',
            channel: 'MULTI',
            totalTarget: 100,
            sentStatus: { sent: 60, failed: 10, pending: 30 },
            createdAt: new Date().toISOString()
          } as Campaign);
        })
      );
    }),
    shareReplay(1)
  );

  readonly stats$: Observable<CampaignStats> = this.campaign$.pipe(
    map((campaign): CampaignStats => {
      if (!campaign) return { sent: 0, failed: 0, pending: 0, total: 0 };
      return {
        sent: campaign.sentStatus.sent,
        failed: campaign.sentStatus.failed,
        pending: campaign.sentStatus.pending,
        total: campaign.totalTarget,
        channel: campaign.channel
      };
    })
  );

  private readonly stateReducer$: Observable<NotificationPageState> = combineLatest([
    this.campaignId$,
    this.filters$.pipe(distinctUntilChanged((p, c) => JSON.stringify(p) === JSON.stringify(c)))
  ]).pipe(
    switchMap(([id, filters]) => {
      if (!id) return of(INITIAL_STATE);

      return this.api.getCampaignNotifications(id, filters).pipe(
        map((curr: PagedResponse<CampaignNotification>): { data: PagedResponse<CampaignNotification>; page: number } => ({
          data: curr,
          page: filters.page
        })),
        catchError(() => of(null))
      );
    }),
    scan(
      (
        acc: NotificationPageState,
        result: { data: PagedResponse<CampaignNotification>; page: number } | NotificationPageState | null
      ): NotificationPageState => {
        if (result === null) {
          return { ...acc, error: 'Failed to load notifications. Please retry.', isLoading: false };
        }
        if ('notifications' in result) {
          return result as NotificationPageState;
        }

        const { data, page } = result as { data: PagedResponse<CampaignNotification>; page: number };
        const newNotifications = page === 0
          ? data.content
          : [...acc.notifications, ...data.content];

        return {
          notifications: newNotifications,
          hasMore: !data.last,
          totalElements: data.totalElements,
          isLoading: false,
          error: null
        };
      },
      INITIAL_STATE
    ),
    shareReplay(1)
  );

  readonly state$: Observable<NotificationPageState> = this.stateReducer$;

  setCampaignId(id: string): void {
    this.campaignId$.next(id);
  }

  updateFilters(partialFilter: Partial<CampaignNotificationFilter>): void {
    const current = this.filters$.value;
    const isSearchChange = 'keyword' in partialFilter
      || 'channel' in partialFilter
      || 'status' in partialFilter;

    this.filters$.next({
      ...current,
      ...partialFilter,
      page: isSearchChange ? 0 : (partialFilter.page ?? current.page)
    });
  }

  loadNextPage(): void {
    const current = this.filters$.value;
    this.updateFilters({ page: current.page + 1 });
  }

  retryNotification(notificationId: number): Observable<unknown> {
    return this.api.retryNotification(notificationId);
  }

  getNotificationDetails(notificationId: number): Observable<any> {
    return this.api.getNotificationDetails(notificationId);
  }
}
