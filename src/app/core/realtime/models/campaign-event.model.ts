export interface CampaignRealtimeEvent {
  campaignId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
}
