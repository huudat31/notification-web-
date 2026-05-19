import { Injectable } from '@angular/core';
import { CampaignRealtimeEvent } from '../models/campaign-event.model';
import { NotificationRealtimeEvent } from '../models/notification-event.model';

@Injectable({
  providedIn: 'root'
})
export class RealtimeEventParserService {
  parseCampaignEvent(payload: string): CampaignRealtimeEvent | null {
    if (!payload) return null;

    // Future proof: try JSON first
    try {
      const obj = JSON.parse(payload);
      if (obj && obj.campaignId && obj.status) {
        return obj as CampaignRealtimeEvent;
      }
    } catch {
      // Fallback to string split
    }

    const parts = payload.split(':');
    if (parts.length === 2) {
      return {
        campaignId: parts[0],
        status: parts[1] as 'ACTIVE' | 'COMPLETED' | 'EXPIRED'
      };
    }
    return null;
  }

  parseNotificationEvent(payload: string): NotificationRealtimeEvent | null {
    if (!payload) return null;
    try {
      const obj = JSON.parse(payload);
      if (obj && obj.action && obj.data && obj.data.id) {
        return obj as NotificationRealtimeEvent;
      }
    } catch {
      console.error('[EventParser] Failed to parse notification payload', payload);
    }
    return null;
  }
}
