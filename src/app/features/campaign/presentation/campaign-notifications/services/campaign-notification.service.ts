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
import { CampaignApiService } from '../../../infrastructure/api/campaign-api.service';
import { CampaignNotification, CampaignNotificationFilter, CampaignStats } from '../../../domain/models/campaign-notification.model';
import { PagedResponse } from '../../../domain/models/paged-response.model';
import { Campaign } from '../../../domain/models/campaign.model';

interface NotificationPageState {
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
export class CampaignNotificationPageService {
  private readonly api = inject(CampaignApiService);

  private readonly campaignId$ = new BehaviorSubject<string | null>(null);
  private readonly filters$ = new BehaviorSubject<CampaignNotificationFilter>({ page: 0, size: 10 });

  // Campaign Detail & Stats
  readonly campaign$: Observable<Campaign | null> = this.campaignId$.pipe(
    switchMap(id => id ? this.api.getCampaignById(id) : of(null)),
    shareReplay(1)
  );

  readonly stats$: Observable<CampaignStats> = this.campaign$.pipe(
    map((campaign): CampaignStats => {
      if (!campaign) return { sent: 0, failed: 0, pending: 0, total: 0 };
      return {
        sent: campaign.sentStatus.sent,
        failed: campaign.sentStatus.failed,
        pending: campaign.sentStatus.pending,
        total: campaign.totalTarget
      };
    })
  );

  // Notifications State
  private readonly stateReducer$ = combineLatest([
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
        // Handle returning initial state from of(INITIAL_STATE)
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

  readonly state$ = this.stateReducer$;

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
}
