import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RealtimeTopicFactory {
  getCampaignsTopic(): string {
    return '/topic/campaigns';
  }

  getCampaignDetailTopic(campaignId: string | number): string {
    return `/topic/campaign/${campaignId}`;
  }

  getNotificationDetailTopic(notificationId: string | number): string {
    return `/topic/notification/${notificationId}`;
  }
}
