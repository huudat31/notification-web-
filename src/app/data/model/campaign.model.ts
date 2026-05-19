

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
  targetType: 'ACTIVE' | 'ALL' | 'INACTIVE' | 'SPECIFIC' | 'RULE_BASED';
  baseRule?: 'ACTIVE' | 'ALL' | 'INACTIVE';
  targetUserIds?: number[];
  includedUserIds?: number[];
  excludedUserIds?: number[];
  channel: Array<'EMAIL' | 'PUSH' | 'SMS'>;
  ratePerHour: number;
  templateName?: string | null;
  pushTitle?: string;
  pushBody?: string;
  pushActionUrl?: string | null;
  scheduledTime: string;
  endTime?: string | null;
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
