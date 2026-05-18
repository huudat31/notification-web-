import { Injectable, inject, signal } from '@angular/core';
import { injectQuery, keepPreviousData } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { CampaignApi } from '@data/api/campaign.api';
import { campaignKeys } from '@data/store/campaign/campaign-keys';
import { CampaignUiStore } from '@data/store/campaign/campaign-ui.store';
import { CampaignNotificationFilter } from '@data/model/campaign-notification.model';

@Injectable({
  providedIn: 'root'
})
export class CampaignQueryFacade {
  private readonly api = inject(CampaignApi);
  private readonly uiStore = inject(CampaignUiStore);

  readonly activeCampaignId = signal<string | null>(null);
  readonly notificationCampaignId = signal<string | null>(null);
  readonly notificationFilters = signal<CampaignNotificationFilter>({ page: 0, size: 10 });

  readonly campaignsQuery = injectQuery(() => {
    const filters = this.uiStore.listFilters();
    return {
      queryKey: campaignKeys.list(filters),
      queryFn: () => lastValueFrom(this.api.searchCampaigns(filters)),
      placeholderData: keepPreviousData,
    };
  });

  readonly templatesQuery = injectQuery(() => ({
    queryKey: campaignKeys.templates(),
    queryFn: () => lastValueFrom(this.api.getAllTemplates()),
    staleTime: 5 * 60 * 1000, 
  }));

  readonly campaignDetailsQuery = injectQuery(() => {
    const id = this.activeCampaignId();
    return {
      queryKey: campaignKeys.detail(id || ''),
      queryFn: () => lastValueFrom(this.api.getCampaignById(id || '')),
      enabled: !!id,
    };
  });

  readonly notificationsQuery = injectQuery(() => {
    const id = this.notificationCampaignId();
    const filters = this.notificationFilters();
    return {
      queryKey: campaignKeys.notifications(id || '', filters),
      queryFn: () => lastValueFrom(this.api.getCampaignNotifications(id || '', filters)),
      enabled: !!id,
      placeholderData: keepPreviousData,
    };
  });

  readonly notificationDetailsQuery = injectQuery(() => {
    const id = this.uiStore.selectedNotificationId();
    return {
      queryKey: ['notification-details', id || 0],
      queryFn: () => lastValueFrom(this.api.getNotificationDetails(id || 0)),
      enabled: !!id,
    };
  });

  setActiveCampaignId(id: string | null): void {
    this.activeCampaignId.set(id);
  }

  setNotificationParams(campaignId: string, filters: CampaignNotificationFilter): void {
    this.notificationCampaignId.set(campaignId);
    this.notificationFilters.set(filters);
    
    this.uiStore.setNotificationFilters(campaignId, filters);
  }
}
