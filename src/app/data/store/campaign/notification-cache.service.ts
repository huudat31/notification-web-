import { Injectable, inject } from '@angular/core';
import { QueryClient, InfiniteData } from '@tanstack/angular-query-experimental';
import { campaignKeys } from './campaign-keys';
import { PagedResponse } from '@data/model/paged-response.model';
import { CampaignNotification, CampaignNotificationFilter } from '@data/model/campaign-notification.model';
import { NotificationStatusEvent } from '@core/realtime/models/realtime-event.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationCacheService {
  private readonly queryClient = inject(QueryClient);

  private recentRealtimeEvents = new Map<number, { event: NotificationStatusEvent, timestamp: number }>();
  private readonly BUFFER_TTL_MS = 10000;

  updateNotificationsBatch(campaignId: string, events: NotificationStatusEvent[]): void {
    if (!campaignId || !events || events.length === 0) return;

    this.cleanupBuffer();

    const processedEvents = new Map<number, NotificationStatusEvent>();
    events.forEach(event => {
      if (event && event.data) {
        const id = event.data.id;
        const existing = processedEvents.get(id);

        if (!existing || this.isNewer(event.data, existing.data)) {
          processedEvents.set(id, event);
          this.recentRealtimeEvents.set(id, { event, timestamp: Date.now() });
        }
      }
    });

    if (processedEvents.size === 0) return;

    console.log(`[Realtime] Applying batch transaction of ${processedEvents.size} events`);

    const activeQueries = this.queryClient.getQueryCache().findAll({
      predicate: (query) =>
        query.queryKey[0] === 'campaigns' &&
        query.queryKey[1] === 'detail' &&
        query.queryKey[2] === campaignId &&
        query.queryKey[3] === 'notifications'
    });

    activeQueries.forEach(query => {
      const activeFilter = (query.queryKey[4] as CampaignNotificationFilter) || {};

      this.queryClient.setQueryData<InfiniteData<PagedResponse<CampaignNotification>>>(
        query.queryKey,
        (oldData) => {
          if (!oldData || !oldData.pages || oldData.pages.length === 0) return oldData;

          let dataChanged = false;

          const newPages = oldData.pages.map(page => {
            let newContent = [...page.content];
            let totalDelta = 0;

            processedEvents.forEach(incomingEvent => {
              const incomingData = incomingEvent.data;
              const existingIndex = newContent.findIndex(item => item.id === incomingData.id);

              const matchesFilter = this.matchesFilterRules(incomingData, activeFilter);

              if (existingIndex !== -1) {
                const existingItem = newContent[existingIndex];

                if (!this.isNewer(incomingData, existingItem)) {
                  return;
                }

                if (!matchesFilter) {
                  newContent.splice(existingIndex, 1);
                  totalDelta--;
                  dataChanged = true;
                } else {
                  newContent[existingIndex] = { ...existingItem, ...incomingData };
                  dataChanged = true;
                }
              } else if (matchesFilter) {
                const isFirstPage = oldData.pages.indexOf(page) === 0;

                if (isFirstPage) {
                  newContent = [incomingData, ...newContent];
                  totalDelta++;
                  dataChanged = true;
                }
              }
            });

            return {
              ...page,
              content: newContent,
              totalElements: page.totalElements + totalDelta
            };
          });

          if (!dataChanged) return oldData;
          return {
            ...oldData,
            pages: newPages
          };
        }
      );
    });
  }

  patchWithRealtime(response: PagedResponse<CampaignNotification>): PagedResponse<CampaignNotification> {
    if (!response || !response.content) return response;

    this.cleanupBuffer();
    if (this.recentRealtimeEvents.size === 0) return response;

    const patchedContent = response.content.map(item => {
      const recent = this.recentRealtimeEvents.get(item.id);
      if (recent && recent.event.action === 'UPDATE') {
        if (this.isNewer(recent.event.data, item)) {
          return { ...item, ...recent.event.data };
        }
      }
      return item;
    });

    return { ...response, content: patchedContent };
  }

  private isNewer(incoming: CampaignNotification, existing: CampaignNotification): boolean {
    if (incoming.updatedAt && existing.updatedAt) {
      return new Date(incoming.updatedAt).getTime() >= new Date(existing.updatedAt).getTime();
    }
    if (incoming.sentAt && existing.sentAt) {
      return new Date(incoming.sentAt).getTime() >= new Date(existing.sentAt).getTime();
    }
    return true;
  }

  private matchesFilterRules(item: CampaignNotification, filter: CampaignNotificationFilter): boolean {
    if (filter.status && item.status.toUpperCase() !== filter.status.toUpperCase()) {
      return false;
    }
    if (filter.channel && item.channel.toUpperCase() !== filter.channel.toUpperCase()) {
      return false;
    }
    if (filter.keyword && filter.keyword.trim() !== '') {
      const kw = filter.keyword.toLowerCase();
      if (!item.title.toLowerCase().includes(kw) &&
        !item.body.toLowerCase().includes(kw) &&
        !item.userName.toLowerCase().includes(kw)) {
        return false;
      }
    }
    return true;
  }

  private cleanupBuffer(): void {
    const now = Date.now();
    for (const [id, data] of this.recentRealtimeEvents.entries()) {
      if (now - data.timestamp > this.BUFFER_TTL_MS) {
        this.recentRealtimeEvents.delete(id);
      }
    }
  }

  recoverOfflineState(campaignId: string): void {
    console.log(`[Recovery] Invalidating notification queries for campaign: ${campaignId}`);
    this.queryClient.invalidateQueries({
      predicate: (query) =>
        query.queryKey[0] === 'campaigns' &&
        query.queryKey[1] === 'detail' &&
        query.queryKey[2] === campaignId &&
        query.queryKey[3] === 'notifications'
    });
  }
}
