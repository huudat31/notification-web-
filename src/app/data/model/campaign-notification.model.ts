export interface CampaignNotification {
  id: number;
  userId: string;
  userName: string;
  channel: 'PUSH' | 'EMAIL' | 'SMS';
  status: 'SENT' | 'FAILED' | 'PENDING';
  title: string;
  body: string;
  sentAt: string;
  isRead: boolean;
  isDeleted: boolean;
  count: number;
}

export interface CampaignNotificationFilter {
  channel?: 'PUSH' | 'EMAIL' | 'SMS' | '';
  status?: 'SENT' | 'FAILED' | 'PENDING' | '';
  keyword?: string;
  page: number;
  size: number;
}

export interface CampaignStats {
  sent: number;
  failed: number;
  pending: number;
  total: number;
  channel?: 'PUSH' | 'EMAIL' | 'SMS' | 'MULTI';
}

export interface PushNotificationDetail {
  id: number;
  address: string;
  deviceName: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  retryCount: number;
  errorMessage: string | null;
  updatedAt: string;
}

export interface EmailNotificationDetail {
  id: number;
  target: string;
  deviceName: null;
  status: 'SENT' | 'FAILED' | 'PENDING';
  retryCount: number;
  errorMessage: string | null;
  updatedAt: string;
}

export interface SmsNotificationDetail {
  id: number;
  target: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  retryCount: number;
  errorMessage: string | null;
  updatedAt: string;
}

export type NotificationDetail = PushNotificationDetail[] | EmailNotificationDetail | SmsNotificationDetail;
