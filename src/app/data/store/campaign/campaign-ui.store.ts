import { Injectable, signal } from '@angular/core';
import { CampaignSearchParams } from '@data/model/campaign.model';
import { CampaignNotificationFilter } from '@data/model/campaign-notification.model';

@Injectable({
  providedIn: 'root'
})
export class CampaignUiStore {
  readonly listFilters = signal<CampaignSearchParams>({
    campaignName: '',
    status: '',
    sortDirection: 'DESC',
    page: 0,
    size: 50
  });

  readonly selectedNotificationId = signal<number | null>(null);
  readonly drawerOpen = signal<boolean>(false);
  
  private readonly notificationFiltersMap = signal<Record<string, CampaignNotificationFilter>>({});

  getNotificationFilters(campaignId: string): CampaignNotificationFilter {
    return this.notificationFiltersMap()[campaignId] || { page: 0, size: 10 };
  }

  setNotificationFilters(campaignId: string, filters: CampaignNotificationFilter): void {
    this.notificationFiltersMap.update(prev => ({
      ...prev,
      [campaignId]: filters
    }));
  }

  openDrawer(notificationId: number): void {
    this.selectedNotificationId.set(notificationId);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.selectedNotificationId.set(null);
  }

  resetListFilters(): void {
    this.listFilters.set({
      campaignName: '',
      status: '',
      sortDirection: 'DESC',
      page: 0,
      size: 50
    });
  }
}
