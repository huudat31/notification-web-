import { Injectable, inject } from '@angular/core';
import { EventParser } from './event-parser.interface';
import { BaseRealtimeEvent } from '../models/realtime-event.model';
import { RealtimeEventParserService } from '../services/realtime-event-parser.service';

@Injectable({
  providedIn: 'root'
})
export class EventRegistry {
  private readonly legacyParser = inject(RealtimeEventParserService);
  private readonly registry = new Map<string, EventParser<any>>();

  constructor() {
    this.registerDefaultParsers();
  }

  register<T extends BaseRealtimeEvent>(eventType: string, parser: EventParser<T>): void {
    this.registry.set(eventType, parser);
  }

  getParser<T extends BaseRealtimeEvent>(eventType: string): EventParser<T> | undefined {
    return this.registry.get(eventType);
  }

  private registerDefaultParsers(): void {
    this.register('CAMPAIGN_STATUS_CHANGED', {
      parse: (payload: string) => {
        const parsed = this.legacyParser.parseCampaignEvent(payload);
        if (!parsed) return null;
        return {
          type: 'CAMPAIGN_STATUS_CHANGED',
          campaignId: String(parsed.campaignId),
          status: parsed.status,
          timestamp: new Date().toISOString()
        };
      }
    });

    this.register('NOTIFICATION_STATUS_CHANGED', {
      parse: (payload: string) => {
        const parsed = this.legacyParser.parseNotificationEvent(payload);
        if (!parsed) return null;
        return {
          type: 'NOTIFICATION_STATUS_CHANGED',
          action: parsed.action,
          data: parsed.data,
          campaignId: '', // Populated by EventBus using topic if applicable
          timestamp: new Date().toISOString()
        };
      }
    });
  }
}
