import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { CampaignStore, CampaignState } from './campaign.store';
import { Campaign } from '@data/model/campaign.model';

@Injectable({
  providedIn: 'root'
})
export class CampaignQuery extends QueryEntity<CampaignState> {
  constructor(protected override store: CampaignStore) {
    super(store);
  }

  selectCurrentPage() {
    return this.select(state => state.currentPage);
  }

  selectTotalPages() {
    return this.select(state => state.totalPages);
  }

  selectTotalElements() {
    return this.select(state => state.totalElements);
  }

  selectIsLastPage() {
    return this.select(state => state.isLastPage);
  }

  selectCurrentStatusFilter() {
    return this.select(state => state.currentStatusFilter);
  }

  selectCurrentSortDirection() {
    return this.select(state => state.currentSortDirection);
  }
}
