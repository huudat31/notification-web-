import { Injectable } from '@angular/core';
import { EntityState, ActiveState, StoreConfig, EntityStore } from '@datorama/akita';
import { Campaign } from '@data/model/campaign.model';

export interface CampaignState extends EntityState<Campaign, string>, ActiveState<string> {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  isLastPage: boolean;
  currentStatusFilter: string;
  currentSortDirection: string;
}

export function createInitialState(): CampaignState {
  return {
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    isLastPage: false,
    currentStatusFilter: '',
    currentSortDirection: 'DESC',
    active: null
  };
}

@Injectable({
  providedIn: 'root'
})
@StoreConfig({ name: 'campaigns' })
export class CampaignStore extends EntityStore<CampaignState> {
  constructor() {
    super(createInitialState());
  }
}
