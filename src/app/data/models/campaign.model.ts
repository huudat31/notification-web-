

export interface Campaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  channel: 'PUSH' | 'EMAIL' | 'SMS' | 'MULTI';
  totalTarget: number;
  sentStatus: {
    pending: number;
    failed: number;
    sent: number;
  };
  scheduledTime?: string;  
  createdAt: string;
}

export interface CampaignSearchParams {
  campaignName?: string;
  status?: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | '';
  sortDirection?: 'ASC' | 'DESC';
  page: number;
  size: number;
}

export interface CampaignSearchResponse {
  content: Campaign[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  last: boolean;
  first: boolean;
}



export interface CreateCampaignRequest {
  name: string;
  targetType: 'ACTIVE' | 'ALL' | 'INACTIVE';
  channel: Array<'EMAIL' | 'PUSH'>;
  ratePerHour: number;
  templateName: string;
  pushTitle: string;
  pushBody: string;
  pushActionUrl: string | null;
  scheduledTime: string;
  endTime: string | null;
}



export interface TemplatePreviewResponse {
  templateName: string;
  subject: string;
  content: string;
}

export interface CampaignTemplate {
  templateName: string;
  subject: string;
  content: string;
}

export interface PagedResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

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
