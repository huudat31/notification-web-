import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, of, Subject, merge } from 'rxjs';
import {
  switchMap,
  scan,
  catchError,
  distinctUntilChanged,
  shareReplay,
  map,
  startWith
} from 'rxjs/operators';
import { CampaignApi } from '@data/api/campaign.api';
import { Campaign, CampaignSearchParams, CampaignSearchResponse } from '@data/model/campaign.model';
import { WebsocketService } from '@core/realtime/services/websocket.service';
import { RealtimeEventParserService } from '@core/realtime/services/realtime-event-parser.service';
import { CampaignRealtimeEvent } from '@core/realtime/models/campaign-event.model';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { campaignKeys } from '@data/store/campaign/campaign-keys';

export interface CampaignPageState {
  campaigns: Campaign[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  totalElements: number;
}

interface FilterState {
  campaignName: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | '';
  sortDirection: 'ASC' | 'DESC';
  page: number;
  size: number;
}

const INITIAL_FILTER: FilterState = {
  campaignName: '',
  status: '',
  sortDirection: 'DESC',
  page: 0,
  size: 50
};

const INITIAL_STATE: CampaignPageState = {
  campaigns: [],
  isLoading: true,
  error: null,
  hasMore: true,
  totalElements: 0
};

@Injectable()
export class CampaignRepository {
  private readonly api = inject(CampaignApi);
  private readonly websocketService = inject(WebsocketService);
  private readonly parserService = inject(RealtimeEventParserService);
  private readonly queryClient = inject(QueryClient);
  private readonly destroyRef = inject(DestroyRef);

  private readonly filtersSubject = new BehaviorSubject<FilterState>(INITIAL_FILTER);
  private readonly realtimeUpdate$ = new Subject<CampaignRealtimeEvent>();

  private readonly apiResponse$ = this.filtersSubject.pipe(
    distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
    switchMap((filters) => {
      const params: CampaignSearchParams = {
        page: filters.page,
        size: filters.size,
        sortDirection: filters.sortDirection,
        ...(filters.campaignName && { campaignName: filters.campaignName }),
        ...(filters.status && { status: filters.status })
      };

      return this.api.searchCampaigns(params).pipe(
        map((response): { type: 'API_RESPONSE'; response: CampaignSearchResponse; page: number } => ({
          type: 'API_RESPONSE',
          response,
          page: filters.page
        })),
        catchError(() => of({ type: 'API_RESPONSE' as const, response: null as any, page: 0 }))
      );
    })
  );

  readonly state$: Observable<CampaignPageState> = merge(
    this.apiResponse$,
    this.realtimeUpdate$.pipe(
      map((event): { type: 'REALTIME_UPDATE'; event: CampaignRealtimeEvent } => ({
        type: 'REALTIME_UPDATE',
        event
      }))
    )
  ).pipe(
    scan(
      (
        acc: CampaignPageState,
        action:
          | { type: 'API_RESPONSE'; response: CampaignSearchResponse | null; page: number }
          | { type: 'REALTIME_UPDATE'; event: CampaignRealtimeEvent }
      ): CampaignPageState => {
        if (action.type === 'API_RESPONSE') {
          const { response, page } = action;
          if (response === null || !response) {
            return {
              ...acc,
              isLoading: false,
              error: 'Không thể tải dữ liệu. Vui lòng thử lại.'
            };
          }

          const newCampaigns = page === 0
            ? response.content
            : [...acc.campaigns, ...response.content];

          return {
            campaigns: newCampaigns,
            isLoading: false,
            error: null,
            hasMore: !response.last,
            totalElements: response.totalElements
          };
        } else {
          // REALTIME_UPDATE
          const { event } = action;
          let changed = false;
          const updatedCampaigns = acc.campaigns.map(c => {
            if (String(c.id) === String(event.campaignId)) {
              if (c.status === event.status) return c;
              changed = true;
              return { ...c, status: event.status };
            }
            return c;
          });

          if (!changed) return acc;
          return {
            ...acc,
            campaigns: updatedCampaigns
          };
        }
      },
      INITIAL_STATE
    ),
    startWith(INITIAL_STATE),
    shareReplay(1)
  );

  constructor() {
    this.initRealtimeSubscription();
  }

  private initRealtimeSubscription(): void {
    console.log('[Realtime] CampaignListComponent active, subscribing to /topic/campaigns');
    this.websocketService.watchTopic('/topic/campaigns')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map(payload => this.parserService.parseCampaignEvent(payload))
      )
      .subscribe({
        next: (event) => {
          if (event) {
            console.log('[Realtime] Campaign update received:', event);
            // 1. Update local state
            this.realtimeUpdate$.next(event);
            // 2. Synchronize with TanStack Query Cache
            this.updateQueryCache(event);
          }
        },
        error: (err) => console.error('[Realtime] Subscription error in campaigns topic:', err)
      });
  }

  private updateQueryCache(event: CampaignRealtimeEvent): void {
    const queryCache = this.queryClient.getQueryCache();
    const activeQueries = queryCache.findAll({ queryKey: campaignKeys.lists() });

    activeQueries.forEach(query => {
      const state = this.queryClient.getQueryState(query.queryKey);
      if (!state || state.status !== 'success') return;

      const oldData = this.queryClient.getQueryData<CampaignSearchResponse>(query.queryKey);
      if (!oldData || !oldData.content) return;

      let changed = false;
      const updatedContent = oldData.content.map(item => {
        if (String(item.id) === String(event.campaignId)) {
          if (item.status === event.status) return item;
          changed = true;
          return { ...item, status: event.status };
        }
        return item;
      });

      if (changed) {
        this.queryClient.setQueryData(query.queryKey, {
          ...oldData,
          content: updatedContent
        });
      }
    });

    const detailKey = campaignKeys.detail(event.campaignId);
    const detailState = this.queryClient.getQueryState(detailKey);
    if (detailState && detailState.status === 'success') {
      const detailOldData = this.queryClient.getQueryData<any>(detailKey);
      if (detailOldData && detailOldData.status !== event.status) {
        this.queryClient.setQueryData(detailKey, {
          ...detailOldData,
          status: event.status
        });
      }
    }
  }

  updateFilters(partial: Partial<Omit<FilterState, 'size'>>): void {
    const current = this.filtersSubject.value;
    const isPaginationChange = 'page' in partial;

    this.filtersSubject.next({
      ...current,
      ...partial,
      page: isPaginationChange ? (partial.page ?? 0) : 0
    });
  }

  loadNextPage(): void {
    const current = this.filtersSubject.value;
    this.filtersSubject.next({
      ...current,
      page: current.page + 1
    });
  }

  retry(): void {
    this.filtersSubject.next({ ...this.filtersSubject.value });
  }
}
