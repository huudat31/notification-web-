import { Injectable, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { WebsocketService } from './websocket.service';
import { RealtimeEventParserService } from './realtime-event-parser.service';
import { CampaignSearchResponse, CampaignNotification, PagedResponse } from '@data/models/campaign.model';
import { CampaignService, campaignKeys } from '@core/campaign/campaign.service';

@Injectable({
  providedIn: 'root'
})
export class RealtimeSyncService {
  private readonly websocketService = inject(WebsocketService);
  private readonly parserService = inject(RealtimeEventParserService);
  private readonly queryClient = inject(QueryClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly campaignService = inject(CampaignService);

  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.websocketService.activate();

    this.websocketService.watchCampaignEvents()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(payload => {
        const event = this.parserService.parseCampaignEvent(payload);
        if (event) {
          this.updateCampaignCache(event);
        }
      });

    this.websocketService.watchNotificationEvents()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(payload => {
        const event = this.parserService.parseNotificationEvent(payload);
        if (event) {
          this.updateNotificationCache(event);
        }
      });
  }

  private updateCampaignCache(event: any): void {
    const queryCache = this.queryClient.getQueryCache();
    const activeQueries = queryCache.findAll({ queryKey: campaignKeys.lists() });

    activeQueries.forEach(query => {
      const state = this.queryClient.getQueryState(query.queryKey);
      if (!state || state.status !== 'success') return;

      const oldData = this.queryClient.getQueryData<CampaignSearchResponse>(query.queryKey);
      if (!oldData || !oldData.content) return;

      let changed = false;
      const updatedContent = oldData.content.map(item => {
        if (item.id === event.campaignId) {
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

  private updateNotificationCache(event: any): void {
    const campaignId = this.campaignService.notificationCampaignId();
    if (!campaignId) return;

    const queryCache = this.queryClient.getQueryCache();
    const activeQueries = queryCache.findAll({ queryKey: campaignKeys.notificationsAll(campaignId) });

    activeQueries.forEach(query => {
      const state = this.queryClient.getQueryState(query.queryKey);
      if (!state || state.status !== 'success') return;

      const oldData = this.queryClient.getQueryData<PagedResponse<CampaignNotification>>(query.queryKey);
      if (!oldData || !oldData.content) return;

      let changed = false;
      const updatedContent = oldData.content.map(item => {
        if (item.id === event.notificationId) {
          if (item.status.toUpperCase() === event.status.toUpperCase()) return item;
          changed = true;
          return { ...item, status: event.status.toUpperCase() };
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
  }
}
