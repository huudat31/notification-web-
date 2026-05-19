import { CampaignNotification } from '@data/model/campaign-notification.model';

export interface NotificationRealtimeEvent {
  action: 'CREATE' | 'UPDATE';
  data: CampaignNotification;
}
