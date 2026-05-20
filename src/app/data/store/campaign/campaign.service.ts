import { Injectable, inject } from '@angular/core';
import { CampaignApi } from '@data/api/campaign.api';
import { CampaignStore } from './campaign.store';
import { CampaignQuery } from './campaign.query';
import { Campaign } from '@data/model/campaign.model';
import { Observable, of } from 'rxjs';
import { tap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CampaignService {
  private readonly api = inject(CampaignApi);
  private readonly campaignStore = inject(CampaignStore);
  private readonly campaignQuery = inject(CampaignQuery);

  /**
   * Smart caching and pagination loader
   */
  loadCampaigns(
    status: string,
    sort: string,
    page: number,
    size: number,
    forceReload: boolean = false
  ): Observable<Campaign[]> {
    const currentState = this.campaignQuery.getValue();

    const isCached =
      !forceReload &&
      currentState.currentStatusFilter === status &&
      currentState.currentSortDirection === sort &&
      currentState.currentPage >= page &&
      this.campaignQuery.getCount() > 0;

    if (isCached) {
      console.log(`[CampaignService] Serving cached page ${page} from local memory.`);
      return of(this.campaignQuery.getAll());
    }

    console.log(`[CampaignService] Fetching page ${page} for filter: ${status}, sort: ${sort} from remote API.`);
    return this.api.searchCampaigns({
      campaignName: '',
      status: status as any,
      sortDirection: sort as any,
      page,
      size
    }).pipe(
      tap(response => {
        if (page === 0) {
          this.campaignStore.set(response.content);
        } else {
          this.campaignStore.upsertMany(response.content);
        }

        this.campaignStore.update({
          currentPage: page,
          totalPages: response.totalPages,
          totalElements: response.totalElements,
          isLastPage: response.last,
          currentStatusFilter: status,
          currentSortDirection: sort
        });
      }),
      map(response => response.content)
    );
  }
}
