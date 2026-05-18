import { Campaign } from '@data/model/campaign.model';

export class CampaignMapper {
  static toUIModel(dto: any): Campaign {
    return {
      id: dto.id || '',
      name: dto.name || '',
      status: dto.status || 'ACTIVE',
      channel: dto.channel || 'PUSH',
      totalTarget: dto.totalTarget || 0,
      sentStatus: {
        pending: dto.sentStatus?.pending || 0,
        failed: dto.sentStatus?.failed || 0,
        sent: dto.sentStatus?.sent || 0,
      },
      scheduledTime: dto.scheduledTime,
      createdAt: dto.createdAt || new Date().toISOString(),
    };
  }

  static toUIList(dtos: any[]): Campaign[] {
    if (!dtos) return [];
    return dtos.map(dto => this.toUIModel(dto));
  }
}
