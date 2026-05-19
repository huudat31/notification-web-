import { Injectable, inject } from '@angular/core';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { campaignKeys } from './campaign-keys';
import { CampaignSearchResponse } from '@data/model/campaign.model';
import { CampaignStatusEvent } from '@core/realtime/models/realtime-event.model';

@Injectable({
  providedIn: 'root'
})
export class CampaignCacheService {
  private readonly queryClient = inject(QueryClient);

  updateCampaignStatusInCache(event: CampaignStatusEvent): void {
    const queryCache = this.queryClient.getQueryCache();
    const activeQueries = queryCache.findAll({ queryKey: campaignKeys.lists() });

    activeQueries.forEach(query => {
      const state = this.queryClient.getQueryState(query.queryKey);
      if (!state || state.status !== 'success') return;

      const oldData = this.queryClient.getQueryData<CampaignSearchResponse>(query.queryKey);
      if (!oldData || !oldData.content) return;

      const updatedContent = oldData.content.map(item => {
        if (String(item.id) === String(event.campaignId)) {
          if (item.status === event.status) return item;
          return { ...item, status: event.status };
        }
        return item;
      });

      this.queryClient.setQueryData(query.queryKey, {
        ...oldData,
        content: updatedContent
      });
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
}
