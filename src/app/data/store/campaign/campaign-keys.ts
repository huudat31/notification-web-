import { CampaignSearchParams } from '@data/model/campaign.model';
import { CampaignNotificationFilter } from '@data/model/campaign-notification.model';

export const campaignKeys = {
  all: ['campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: (filters: CampaignSearchParams) => [...campaignKeys.lists(), filters] as const,
  details: () => [...campaignKeys.all, 'detail'] as const,
  detail: (id: string) => [...campaignKeys.details(), id] as const,
  notificationsAll: (id: string) => [...campaignKeys.detail(id), 'notifications'] as const,
  notifications: (id: string, filters: CampaignNotificationFilter) => [...campaignKeys.notificationsAll(id), filters] as const,
  templates: () => [...campaignKeys.all, 'templates'] as const,
};
