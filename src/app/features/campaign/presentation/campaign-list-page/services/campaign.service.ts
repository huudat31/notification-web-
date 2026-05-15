import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import {
  switchMap,
  scan,
  catchError,
  distinctUntilChanged,
  shareReplay,
  map,
  startWith
} from 'rxjs/operators';
import { CampaignApiService } from '../../../infrastructure/api/campaign-api.service';
import { Campaign, CampaignSearchParams, CampaignSearchResponse } from '../../../domain/models/campaign.model';

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
export class CampaignPageService {
  private readonly api = inject(CampaignApiService);

  private readonly filtersSubject = new BehaviorSubject<FilterState>(INITIAL_FILTER);

  readonly state$: Observable<CampaignPageState> = this.filtersSubject.pipe(
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
        map((response): { response: CampaignSearchResponse; page: number } => ({
          response,
          page: filters.page
        })),
        catchError(() => of(null))
      );
    }),
    scan(
      (
        acc: CampaignPageState,
        result: { response: CampaignSearchResponse; page: number } | null
      ): CampaignPageState => {
        if (result === null) {
          return {
            ...acc,
            isLoading: false,
            error: 'Không thể tải dữ liệu. Vui lòng thử lại.'
          };
        }

        const { response, page } = result;
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
      },
      INITIAL_STATE
    ),
    startWith(INITIAL_STATE),
    shareReplay(1)
  );

  /**
   * Update filters. Non-page changes auto-reset to page=0.
   */
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
    // Re-emit current filters to trigger a new API call
    this.filtersSubject.next({ ...this.filtersSubject.value });
  }
}
