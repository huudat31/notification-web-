import { Injectable, inject } from '@angular/core';
import { Observable, animationFrameScheduler, of } from 'rxjs';
import { filter, map, catchError, bufferTime, observeOn, shareReplay } from 'rxjs/operators';
import { WebsocketService } from './websocket.service';
import { EventRegistry } from '../event-registry/event-registry.service';
import { BaseRealtimeEvent } from '../models/realtime-event.model';

@Injectable({
  providedIn: 'root'
})
export class RealtimeEventBus {
  private readonly websocketService = inject(WebsocketService);
  private readonly registry = inject(EventRegistry);

  observeTopic(topic: string): Observable<BaseRealtimeEvent[]> {
    return this.websocketService.watchTopic(topic).pipe(
      map((payload): BaseRealtimeEvent | null => {
        const isCampaign = topic.includes('/campaign');
        const parserType = isCampaign ? 'CAMPAIGN_STATUS_CHANGED' : 'NOTIFICATION_STATUS_CHANGED';
        const parser = this.registry.getParser(parserType);

        if (parser) {
          const parsed = parser.parse(payload);
          if (parsed && !isCampaign) {
            (parsed as any).campaignId = topic.split('/').pop() || '';
          }
          return parsed;
        }
        return null;
      }),
      filter((e): e is BaseRealtimeEvent => e !== null),
      // --- BACKPRESSURE & BATCHING LAYER ---
      bufferTime(200), // Wait 200ms to collect events into a batch
      filter(batch => batch.length > 0), // Ignore empty batches
      observeOn(animationFrameScheduler), // Prevent rapid sync rendering
      catchError(err => {
        console.error(`[EventBus] Error on topic: ${topic}`, err);
        return of([]);
      }),
      shareReplay({ bufferSize: 1, refCount: true }) // Dedupe subscribers and retain the latest batch
    );
  }
}
