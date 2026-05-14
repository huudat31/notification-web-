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
