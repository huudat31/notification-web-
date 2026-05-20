import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RealtimeQueryRegistry {
  // Map of campaignId -> Set of JSON stringified query keys
  private readonly notificationQueries = new Map<string, Set<string>>();
  
  // Set of JSON stringified campaign list query keys
  private readonly listQueries = new Set<string>();

  registerNotificationQuery(campaignId: string, queryKey: readonly any[]): void {
    if (!this.notificationQueries.has(campaignId)) {
      this.notificationQueries.set(campaignId, new Set());
    }
    this.notificationQueries.get(campaignId)!.add(JSON.stringify(queryKey));
  }

  unregisterNotificationQuery(campaignId: string, queryKey: readonly any[]): void {
    const set = this.notificationQueries.get(campaignId);
    if (set) {
      set.delete(JSON.stringify(queryKey));
      if (set.size === 0) {
        this.notificationQueries.delete(campaignId);
      }
    }
  }

  getNotificationQueryKeys(campaignId: string): any[][] {
    const set = this.notificationQueries.get(campaignId);
    if (!set) return [];
    return Array.from(set).map(k => JSON.parse(k));
  }

  getActiveCampaignIds(): string[] {
    return Array.from(this.notificationQueries.keys());
  }

  registerListQuery(queryKey: readonly any[]): void {
    this.listQueries.add(JSON.stringify(queryKey));
  }

  unregisterListQuery(queryKey: readonly any[]): void {
    this.listQueries.delete(JSON.stringify(queryKey));
  }

  getListQueryKeys(): any[][] {
    return Array.from(this.listQueries).map(k => JSON.parse(k));
  }
}
