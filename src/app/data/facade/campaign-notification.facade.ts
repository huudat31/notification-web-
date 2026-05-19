import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Observable, combineLatest, of } from 'rxjs';
import { switchMap, distinctUntilChanged } from 'rxjs/operators';
import { QueryClient } from '@tanstack/angular-query-experimental';

import { CampaignApi } from '@data/api/campaign.api';
import { CampaignUiStore } from '../stores/campaign-ui.store';
import { RealtimeTopicFactory } from '@core/realtime/topics/realtime-topic.factory';
import { RealtimeEventBus } from '@core/realtime/services/realtime-event-bus.service';
import { NotificationCacheService } from '../store/campaign/notification-cache.service';
import { CampaignCacheService } from '../store/campaign/campaign-cache.service';
import { NotificationStatusEvent, CampaignStatusEvent } from '@core/realtime/models/realtime-event.model';
import { HealthMonitorService } from '@core/realtime/health/health-monitor.service';

@Injectable()
export class CampaignNotificationFacade {
  private readonly api = inject(CampaignApi);
  private readonly uiStore = inject(CampaignUiStore);
  private readonly topicFactory = inject(RealtimeTopicFactory);
  private readonly eventBus = inject(RealtimeEventBus);
  private readonly notifCacheService = inject(NotificationCacheService);
  private readonly campaignCacheService = inject(CampaignCacheService);
  private readonly healthMonitor = inject(HealthMonitorService);
  private readonly destroyRef = inject(DestroyRef);

  private campaignId: string | null = null;
  private readonly activeNotificationId$ = toObservable(this.uiStore.activeNotificationId);

  readonly healthState = this.healthMonitor.healthState;
  readonly latencyMs = this.healthMonitor.latencyMs;

  readonly filters = this.uiStore.filters;
  readonly activeNotificationId = this.uiStore.activeNotificationId;

  setCampaignId(id: string): void {
    this.campaignId = id;
    this.initRealtimeSubscription();
  }

  setActiveNotificationId(id: number | null): void {
    this.uiStore.setActiveNotificationId(id);
  }

  updateFilters(partial: any): void {
    this.uiStore.updateFilters(partial);
  }

  loadNextPage(): void {
    this.uiStore.nextPage();
  }

  private initRealtimeSubscription(): void {
    const activeTopic$ = new Observable<string | null>(subscriber => {
      const unsub = combineLatest([
        this.campaignId ? of(this.campaignId) : of(null),
        this.activeNotificationId$
      ]).subscribe(([campaignId, notificationId]) => {
        if (notificationId) {
          subscriber.next(this.topicFactory.getNotificationDetailTopic(notificationId));
        } else if (campaignId) {
          subscriber.next(this.topicFactory.getCampaignDetailTopic(campaignId));
        } else {
          subscriber.next(null);
        }
      });
      return () => unsub.unsubscribe();
    }).pipe(distinctUntilChanged());

    activeTopic$.pipe(
      switchMap(topic => {
        if (!topic) return of(null);
        console.log(`[Facade] Subscribing dynamically via EventBus to: ${topic}`);
        return this.eventBus.observeTopic(topic);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (event) => {
        if (event) this.handleIncomingRealtimeEvent(event);
      },
      error: (err) => console.error('[Facade] Event Bus stream error:', err)
    });
  }

  private handleIncomingRealtimeEvent(event: any): void {
    if (event.type === 'NOTIFICATION_STATUS_CHANGED') {
      const notifEvent = event as NotificationStatusEvent;
      if (this.campaignId) {
        this.notifCacheService.updateNotificationsBatch(this.campaignId, [notifEvent]);
      }
    } else if (event.type === 'CAMPAIGN_STATUS_CHANGED') {
      const campaignEvent = event as CampaignStatusEvent;
      this.campaignCacheService.updateCampaignStatusInCache(campaignEvent);
    }
  }

  triggerOfflineRecovery(): void {
    if (this.campaignId) {
      this.notifCacheService.recoverOfflineState(this.campaignId);
    }
  }
}
