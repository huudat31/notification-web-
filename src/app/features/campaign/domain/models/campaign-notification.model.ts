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
}
