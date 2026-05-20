import { Injectable, inject } from '@angular/core';
import { QueryClient, InfiniteData } from '@tanstack/angular-query-experimental';
import { RealtimeQueryRegistry } from './realtime-query-registry.service';
import { campaignKeys } from './campaign-keys';
import { Campaign } from '@data/model/campaign.model';
import { CampaignNotification } from '@data/model/campaign-notification.model';
import { PagedResponse } from '@data/model/paged-response.model';

// Generic incremental page shifting normalizer
export function incrementalNormalizePages<T extends { id: any; version?: number; updatedAt?: string }>(
  oldData: InfiniteData<PagedResponse<T>> | undefined,
  newItem: T,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  pageSize: number,
  comparator: (a: T, b: T) => number
): InfiniteData<PagedResponse<T>> {
  if (!oldData || !oldData.pages || oldData.pages.length === 0) {
    if (action === 'DELETE') return { pages: [], pageParams: [] };
    const initialPage: PagedResponse<T> = {
      content: [newItem],
      totalElements: 1,
      totalPages: 1,
      size: pageSize,
      number: 0,
      last: true,
      first: true
    };
    return { pages: [initialPage], pageParams: [0] };
  }

  const pages = oldData.pages.map(page => ({
    ...page,
    content: [...page.content]
  }));

  const findItemCoords = (itemId: any): { pageIdx: number; itemIdx: number } | null => {
    for (let p = 0; p < pages.length; p++) {
      const idx = pages[p].content.findIndex(x => String(x.id) === String(itemId));
      if (idx !== -1) return { pageIdx: p, itemIdx: idx };
    }
    return null;
  };

  const coords = findItemCoords(newItem.id);

  if (action === 'DELETE') {
    if (!coords) return oldData;
    pages[coords.pageIdx].content.splice(coords.itemIdx, 1);
    shiftUpChain(pages, coords.pageIdx, pageSize);
    
    // Decrement total elements
    pages.forEach(p => {
      if (p.totalElements > 0) p.totalElements--;
    });

    return { ...oldData, pages };
  }

  // CREATE / UPDATE
  if (coords) {
    const existing = pages[coords.pageIdx].content[coords.itemIdx];
    
    // Monotonic timestamp conflict check
    if (newItem.updatedAt && existing.updatedAt && new Date(newItem.updatedAt).getTime() < new Date(existing.updatedAt).getTime()) {
      console.warn(`[Projection] Discarded out-of-order stale update for ID ${newItem.id}`);
      return oldData;
    }

    const merged = { ...existing, ...newItem };
    pages[coords.pageIdx].content.splice(coords.itemIdx, 1);
    insertAndShiftDownChain(pages, merged, pageSize, comparator);
  } else {
    insertAndShiftDownChain(pages, newItem, pageSize, comparator);
    // Increment total elements
    pages.forEach(p => p.totalElements++);
  }

  return { ...oldData, pages };
}

function insertAndShiftDownChain<T>(
  pages: PagedResponse<T>[],
  item: T,
  pageSize: number,
  comparator: (a: T, b: T) => number
) {
  let targetPageIdx = pages.length - 1;
  for (let p = 0; p < pages.length; p++) {
    const content = pages[p].content;
    if (content.length === 0 || comparator(item, content[content.length - 1]) <= 0) {
      targetPageIdx = p;
      break;
    }
  }

  pages[targetPageIdx].content.push(item);
  pages[targetPageIdx].content.sort(comparator);

  let carryOver: T | null = null;
  for (let p = targetPageIdx; p < pages.length; p++) {
    if (carryOver) {
      pages[p].content.unshift(carryOver);
      pages[p].content.sort(comparator);
      carryOver = null;
    }

    if (pages[p].content.length > pageSize) {
      carryOver = pages[p].content.pop()!;
    }
  }

  if (carryOver && pages.length < 10) {
    pages.push({
      content: [carryOver],
      totalElements: pages[0]?.totalElements ?? 1,
      totalPages: pages.length + 1,
      size: pageSize,
      number: pages.length,
      last: true,
      first: false
    });
  }
}

function shiftUpChain<T>(pages: PagedResponse<T>[], startPageIdx: number, pageSize: number) {
  for (let p = startPageIdx; p < pages.length - 1; p++) {
    if (pages[p + 1].content.length > 0) {
      const pulledItem = pages[p + 1].content.shift()!;
      pages[p].content.push(pulledItem);
    }
  }
  if (pages.length > 1 && pages[pages.length - 1].content.length === 0) {
    pages.pop();
  }
}

@Injectable({
  providedIn: 'root'
})
export class CacheProjectionService {
  private readonly queryClient = inject(QueryClient);
  private readonly registry = inject(RealtimeQueryRegistry);

  getActiveCampaignIds(): string[] {
    return this.registry.getActiveCampaignIds();
  }

  projectNotificationCreated(campaignId: string, notification: CampaignNotification): void {
    // 1. Surgically insert into active notification lists
    const queryKeys = this.registry.getNotificationQueryKeys(campaignId);
    
    queryKeys.forEach(key => {
      this.queryClient.setQueryData<InfiniteData<PagedResponse<CampaignNotification>>>(key, (old) => {
        return incrementalNormalizePages(
          old,
          notification,
          'CREATE',
          key[4]?.size || 20,
          (a, b) => new Date(b.sentAt || b.updatedAt || 0).getTime() - new Date(a.sentAt || a.updatedAt || 0).getTime()
        );
      });
    });

    // 2. Project stats to campaign details query cache
    this.projectStatsOnNewRecipient(campaignId);
  }

  projectNotificationUpdated(campaignId: string, notification: CampaignNotification, oldStatus?: 'SENT' | 'FAILED' | 'PENDING'): void {
    // 1. Patch notification list queries
    const queryKeys = this.registry.getNotificationQueryKeys(campaignId);

    queryKeys.forEach(key => {
      this.queryClient.setQueryData<InfiniteData<PagedResponse<CampaignNotification>>>(key, (old) => {
        return incrementalNormalizePages(
          old,
          notification,
          'UPDATE',
          key[4]?.size || 20,
          (a, b) => new Date(b.sentAt || b.updatedAt || 0).getTime() - new Date(a.sentAt || a.updatedAt || 0).getTime()
        );
      });
    });

    // 2. Project stats transitions
    if (oldStatus && oldStatus !== notification.status) {
      this.projectStatsTransition(campaignId, oldStatus, notification.status);
    }
  }

  projectCampaignCreated(campaign: Campaign): void {
    // 1. Prepends to active campaign list queries
    const listKeys = this.registry.getListQueryKeys();
    
    listKeys.forEach(key => {
      this.queryClient.setQueryData<InfiniteData<PagedResponse<Campaign>>>(key, (old) => {
        return incrementalNormalizePages(
          old,
          campaign,
          'CREATE',
          key[2]?.size || 50,
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    });

    // 2. Seed campaign detail cache
    const detailKey = campaignKeys.detail(campaign.id);
    this.queryClient.setQueryData(detailKey, campaign);
  }

  projectCampaignStatus(campaignId: string, status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED'): void {
    // 1. Update in active lists
    const listKeys = this.registry.getListQueryKeys();

    listKeys.forEach(key => {
      this.queryClient.setQueryData<InfiniteData<PagedResponse<Campaign>>>(key, (old) => {
        if (!old) return old;
        const newPages = old.pages.map(page => {
          const content = page.content.map(c => {
            if (String(c.id) === String(campaignId)) {
              return { ...c, status };
            }
            return c;
          });
          return { ...page, content };
        });
        return { ...old, pages: newPages };
      });
    });

    // 2. Update detail cache
    const detailKey = campaignKeys.detail(campaignId);
    const detailState = this.queryClient.getQueryState(detailKey);
    if (detailState && detailState.status === 'success') {
      this.queryClient.setQueryData<Campaign>(detailKey, (old) => {
        if (!old) return old;
        return { ...old, status };
      });
    }
  }

  private projectStatsOnNewRecipient(campaignId: string): void {
    const detailKey = campaignKeys.detail(campaignId);
    const detailState = this.queryClient.getQueryState(detailKey);
    if (!detailState || detailState.status !== 'success') return;

    this.queryClient.setQueryData<Campaign>(detailKey, (old) => {
      if (!old) return old;
      return {
        ...old,
        totalTarget: (old.totalTarget || 0) + 1,
        sentStatus: {
          ...old.sentStatus,
          pending: (old.sentStatus?.pending || 0) + 1
        }
      };
    });
  }

  private projectStatsTransition(
    campaignId: string, 
    oldStatus: 'SENT' | 'FAILED' | 'PENDING', 
    newStatus: 'SENT' | 'FAILED' | 'PENDING'
  ): void {
    const detailKey = campaignKeys.detail(campaignId);
    const detailState = this.queryClient.getQueryState(detailKey);
    if (!detailState || detailState.status !== 'success') return;

    this.queryClient.setQueryData<Campaign>(detailKey, (old) => {
      if (!old) return old;
      
      const sentStatus = { ...old.sentStatus };
      const prevKey = oldStatus.toLowerCase() as 'sent' | 'failed' | 'pending';
      const nextKey = newStatus.toLowerCase() as 'sent' | 'failed' | 'pending';

      if (sentStatus[prevKey] > 0) {
        sentStatus[prevKey]--;
      }
      sentStatus[nextKey]++;

      return {
        ...old,
        sentStatus
      };
    });
  }
}
