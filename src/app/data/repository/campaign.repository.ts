import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, firstValueFrom } from 'rxjs';
import { CampaignApi } from '@data/api/campaign.api';
import { Campaign, CampaignSearchParams, CampaignSearchResponse } from '@data/model/campaign.model';
import { QueryClient, injectInfiniteQuery } from '@tanstack/angular-query-experimental';
import { campaignKeys } from '@data/store/campaign/campaign-keys';
import { CampaignLocalStorageService } from '@data/store/campaign/campaign-local-storage.service';
import { RealtimeQueryRegistry } from '@data/store/campaign/realtime-query-registry.service';

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

@Injectable({
  providedIn: 'root'
})
export class CampaignRepository {
  private readonly api = inject(CampaignApi);
  private readonly queryClient = inject(QueryClient);
  private readonly localStorage = inject(CampaignLocalStorageService);
  private readonly registry = inject(RealtimeQueryRegistry);

  // --- UI State (Signals) ---
  readonly filters = signal<FilterState>(INITIAL_FILTER);

  readonly campaignsQuery = injectInfiniteQuery(() => {
    const filters = this.filters();
    const params: CampaignSearchParams = {
      page: filters.page,
      size: filters.size,
      sortDirection: filters.sortDirection,
      ...(filters.campaignName && { campaignName: filters.campaignName }),
      ...(filters.status && { status: filters.status })
    };

    return {
      queryKey: campaignKeys.list(params),
      initialPageParam: 0,
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 15, // 15 minutes
      queryFn: async ({ pageParam }) => {
        const fullParams = { ...params, page: pageParam as number };
        const response = await firstValueFrom(this.api.searchCampaigns(fullParams));
        
        // Save to IndexedDB/local storage for offline hydration
        if (pageParam === 0) {
          this.localStorage.saveCampaigns(response.content);
        } else {
          // Merge with existing campaigns in IndexedDB
          const existing = await this.localStorage.getAllCampaigns();
          const merged = [...existing, ...response.content];
          const uniqueMerged = merged.filter((c, i, self) => self.findIndex(x => x.id === c.id) === i);
          this.localStorage.saveCampaigns(uniqueMerged);
        }

        return response;
      },
      getNextPageParam: (lastPage, allPages) => {
        if (!lastPage || lastPage.last) return undefined;
        return allPages.length;
      }
    };
  });

  // --- Derived UI State computed cleanly from the TanStack Query Cache ---
  readonly campaignListVM = computed<CampaignPageState>(() => {
    const query = this.campaignsQuery;
    const data = query.data();
    
    const campaigns = data?.pages.flatMap(page => page.content) ?? [];
    const isLoading = query.isLoading() || (query.isFetching() && !query.isFetchingNextPage() && campaigns.length === 0);
    const hasMore = query.hasNextPage();
    const totalElements = data?.pages[0]?.totalElements ?? campaigns.length;
    
    return {
      campaigns,
      isLoading,
      error: query.isError() ? 'Không thể tải dữ liệu. Vui lòng thử lại.' : null,
      hasMore,
      totalElements
    };
  });

  // Backward compatible observable wrappers for OnPush / components
  readonly state$: Observable<CampaignPageState> = toObservable(this.campaignListVM);

  constructor() {
    this.hydrateFromOffline();
    
    // Register active list query key in the registry reactively
    effect((onCleanup) => {
      const filters = this.filters();
      const params: CampaignSearchParams = {
        page: filters.page,
        size: filters.size,
        sortDirection: filters.sortDirection,
        ...(filters.campaignName && { campaignName: filters.campaignName }),
        ...(filters.status && { status: filters.status })
      };
      const queryKey = campaignKeys.list(params);
      this.registry.registerListQuery(queryKey);
      onCleanup(() => {
        this.registry.unregisterListQuery(queryKey);
      });
    });
  }

  private async hydrateFromOffline() {
    try {
      const offlineCampaigns = await this.localStorage.getAllCampaigns();
      if (offlineCampaigns && offlineCampaigns.length > 0) {
        const queryKey = campaignKeys.list(INITIAL_FILTER);
        // Only set if there is no query data already loaded
        if (!this.queryClient.getQueryData(queryKey)) {
          this.queryClient.setQueryData(queryKey, {
            pages: [{
              content: offlineCampaigns,
              totalElements: offlineCampaigns.length,
              totalPages: 1,
              size: INITIAL_FILTER.size,
              number: 0,
              last: true,
              first: true
            }],
            pageParams: [0]
          });
        }
      }
    } catch (e) {
      console.warn('[Offline] Failed to hydrate campaigns from local storage:', e);
    }
  }

  /** Force reload the campaign list from the server */
  forceReload(): void {
    this.queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    this.filters.update(f => ({ ...f, page: 0 }));
    this.campaignsQuery.refetch();
  }

  updateFilters(partial: Partial<Omit<FilterState, 'size'>>): void {
    const current = this.filters();
    const isPaginationChange = 'page' in partial;

    this.filters.set({
      ...current,
      ...partial,
      page: isPaginationChange ? (partial.page ?? 0) : 0
    });
  }

  loadNextPage(): void {
    if (this.campaignsQuery.hasNextPage() && !this.campaignsQuery.isFetchingNextPage()) {
      this.campaignsQuery.fetchNextPage();
    }
  }

  retry(): void {
    this.campaignsQuery.refetch();
  }
}
