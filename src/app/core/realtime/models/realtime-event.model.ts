import { CampaignNotification } from '@data/model/campaign-notification.model';

export interface BaseRealtimeEvent {
  type: string;
  timestamp: string;
}

export interface CampaignStatusEvent extends BaseRealtimeEvent {
  type: 'CAMPAIGN_STATUS_CHANGED';
  campaignId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
}

export interface NotificationStatusEvent extends BaseRealtimeEvent {
  type: 'NOTIFICATION_STATUS_CHANGED';
  action: 'CREATE' | 'UPDATE';
  data: CampaignNotification;
  campaignId: string;
}

export interface ProcessingProgressEvent extends BaseRealtimeEvent {
  type: 'PROCESSING_PROGRESS_UPDATED';
  campaignId: string;
  processedCount: number;
  totalTarget: number;
  ratePerHour: number;
}

export type RealtimeEvent =
  | CampaignStatusEvent
  | NotificationStatusEvent
  | ProcessingProgressEvent;
