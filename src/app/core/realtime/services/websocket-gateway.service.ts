import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { WebsocketService } from './websocket.service';
import { CacheProjectionService } from '../../../data/store/campaign/cache-projection.service';
import { RealtimeConnectionState } from '../enums/realtime-connection-state.enum';
import { CampaignNotification } from '../../../data/model/campaign-notification.model';
import { Campaign } from '../../../data/model/campaign.model';
import { bufferTime, filter } from 'rxjs/operators';
import { Subscription, interval } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebsocketGateway implements OnDestroy {
  private readonly websocketService = inject(WebsocketService);
  private readonly projectionService = inject(CacheProjectionService);
  private readonly http = inject(HttpClient);

  // --- Connection State Machine Signals ---
  readonly connectionState = signal<RealtimeConnectionState>(RealtimeConnectionState.CONNECTING);
  readonly latencyMs = signal<number>(0);

  private subscription?: Subscription;
  private reconnectSub?: Subscription;
  private networkStatusSub?: Subscription;
  private latencyInterval?: any;
  private rollingRtt = 0;

  // Track per-campaign topic subscriptions to avoid duplicate subscriptions
  private readonly campaignSubscriptions = new Map<string, Subscription>();

  constructor() {
    this.initConnectionStateMachine();
    this.initCentralGateway();
    this.startLatencyMonitor();
  }

  private initConnectionStateMachine() {
    // 1. Sync with WebsocketService state
    this.reconnectSub = this.websocketService.reconnect$.subscribe(() => {
      console.log('[WebsocketGateway] Socket reconnected!');
      this.connectionState.set(RealtimeConnectionState.CONNECTED);
    });

    // 2. Track browser online/offline status
    this.connectionState.set(navigator.onLine ? RealtimeConnectionState.CONNECTING : RealtimeConnectionState.OFFLINE);

    const updateOnlineStatus = () => {
      if (navigator.onLine) {
        this.connectionState.set(RealtimeConnectionState.CONNECTING);
        this.websocketService.activate();
      } else {
        this.connectionState.set(RealtimeConnectionState.OFFLINE);
        this.websocketService.deactivate();
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Capture cleanup logic
    this.networkStatusSub = new Subscription(() => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    });

    // 3. Listen to RX-Stomp connection status
    this.websocketService.connectionState; // Trigger service lazy initialization
  }

  private startLatencyMonitor() {
    // Redundant latency checks disabled to prevent CORS/403 console errors.
    // Connection health is fully monitored by passive HealthMonitorService.
  }

  subscribeToCampaign(campaignId: string): void {
    if (this.campaignSubscriptions.has(campaignId)) return;

    const campaignTopic = `/topic/campaigns/${campaignId}/notifications`;
    console.log(`[WebsocketGateway] Subscribing to campaign topic: ${campaignTopic}`);

    const sub = this.websocketService.watchTopic(campaignTopic)
      .pipe(
        filter(payload => !!payload),
        bufferTime(16) // 16ms buffering frame to batch updates
      )
      .subscribe(messages => {
        if (messages.length === 0) return;
        this.processNotificationMessages(messages, campaignId);
      });

    this.campaignSubscriptions.set(campaignId, sub);
  }

  unsubscribeFromCampaign(campaignId: string): void {
    const sub = this.campaignSubscriptions.get(campaignId);
    if (sub) {
      sub.unsubscribe();
      this.campaignSubscriptions.delete(campaignId);
      console.log(`[WebsocketGateway] Unsubscribed from campaign topic: /topic/campaigns/${campaignId}/notifications`);
    }
  }

  private initCentralGateway() {
    this.subscription = this.websocketService.watchNotificationEvents()
      .pipe(
        filter(payload => !!payload),
        bufferTime(16)
      )
      .subscribe(messages => {
        if (messages.length === 0) return;
        this.processNotificationMessages(messages);
      });

    // Also monitor global campaign topic
    this.websocketService.watchTopic('/topic/campaigns')
      .pipe(
        filter(payload => !!payload),
        bufferTime(16)
      )
      .subscribe(messages => {
        if (messages.length === 0) return;
        this.processCampaignMessages(messages);
      });
  }

  private processSingleNotificationEvent(
    event: any,
    campaignId: string,
    updatesList: Array<{ campaignId: string; notification: CampaignNotification; type: string; oldStatus?: 'SENT' | 'FAILED' | 'PENDING' }>
  ): void {
    if (event.type === 'USER_ADDED' || event.type === 'NOTIFICATION_CREATED') {
      const recipient: CampaignNotification = {
        ...(event.user || event.notification || event.data || event),
        status: (event.user?.notificationStatus || event.notification?.status || event.notificationStatus || 'PENDING') as 'PENDING' | 'SENT' | 'FAILED',
        id: Number(event.notification?.id || event.user?.id || event.recipientId || event.id),
        userId: String(event.user?.userId || event.notification?.userId || event.user?.id || event.userId || ''),
        userName: event.user?.userName || event.notification?.userName || event.user?.name || event.userName || '',
        channel: event.user?.channel || event.notification?.channel || event.channel || 'PUSH',
        title: event.notification?.title || event.user?.title || event.title || '',
        body: event.notification?.body || event.user?.body || event.body || '',
        sentAt: event.notification?.sentAt || event.user?.sentAt || event.sentAt || new Date().toISOString(),
        updatedAt: event.notification?.updatedAt || event.user?.updatedAt || event.updatedAt || new Date().toISOString(),
        isRead: false,
        isDeleted: false,
        count: 0
      };

      if (!recipient.id) return;
      updatesList.push({ campaignId, notification: recipient, type: 'CREATE' });

    } else if (
      event.type === 'STATUS_CHANGED' ||
      event.type === 'NOTIFICATION_STATUS_CHANGED' ||
      event.type === 'NOTIFICATION_UPDATED'
    ) {
      const recipientId = Number(event.recipientId || event.notificationId || (event.data && event.data.id) || (event.notification && event.notification.id) || event.id);
      if (!recipientId) return;

      const status = (event.status || (event.data && event.data.status) || (event.notification && event.notification.status)) as 'PENDING' | 'SENT' | 'FAILED';
      if (!status) return;

      const updatedRecipient: CampaignNotification = {
        id: recipientId,
        status,
        updatedAt: event.updatedAt || (event.data && event.data.updatedAt) || (event.notification && event.notification.updatedAt) || new Date().toISOString()
      } as CampaignNotification;

      updatesList.push({
        campaignId,
        notification: updatedRecipient,
        type: 'UPDATE',
        oldStatus: event.oldStatus // Passed if available
      });
    }
  }

  private processNotificationMessages(messages: string[], forcedCampaignId?: string): void {
    const updatesList: Array<{ campaignId: string; notification: CampaignNotification; type: string; oldStatus?: 'SENT' | 'FAILED' | 'PENDING' }> = [];

    messages.forEach(msg => {
      try {
        const event = JSON.parse(msg);
        
        // Robust campaign ID resolution checking multiple potential nested paths
        const rawCampaignId = forcedCampaignId || 
          event.campaignId || 
          event.data?.campaignId || 
          event.notification?.campaignId || 
          event.user?.campaignId || 
          event.recipient?.campaignId;
        
        const campaignId = rawCampaignId ? String(rawCampaignId) : '';

        if (campaignId && campaignId !== 'undefined') {
          this.processSingleNotificationEvent(event, campaignId, updatesList);
        } else {
          // Fallback logic to fetch active campaigns from projectionService when missing in payload
          const activeCampaignIds = this.projectionService.getActiveCampaignIds();
          activeCampaignIds.forEach(id => {
            this.processSingleNotificationEvent(event, id, updatesList);
          });
        }
      } catch (e) {
        console.error('[WebsocketGateway] Failed to parse notification message', e);
      }
    });

    // Batch apply projections in a single execution frame
    updatesList.forEach(update => {
      if (update.type === 'CREATE') {
        console.log(`[WebsocketGateway] Projecting CREATE notification for campaign ${update.campaignId}:`, update.notification);
        this.projectionService.projectNotificationCreated(update.campaignId, update.notification);
      } else {
        console.log(`[WebsocketGateway] Projecting UPDATE notification for campaign ${update.campaignId}:`, update.notification);
        this.projectionService.projectNotificationUpdated(update.campaignId, update.notification, update.oldStatus);
      }
    });
  }

  private processCampaignMessages(messages: string[]): void {
    messages.forEach(msg => {
      try {
        let event: any = null;
        try {
          event = JSON.parse(msg);
        } catch {
          // Fallback legacy "id:STATUS"
          const parts = msg.split(':');
          if (parts.length === 2) {
            event = { campaignId: parts[0], status: parts[1], type: 'CAMPAIGN_STATUS_CHANGED' };
          }
        }

        if (!event) return;

        const eventType = String(event.type || '').toUpperCase();
        if (eventType === 'CAMPAIGN_CREATED' || eventType === 'CREATED') {
          const campaign = event.campaign as Campaign;
          if (campaign) {
            this.projectionService.projectCampaignCreated(campaign);
          }
        } else if (event.campaignId && event.status) {
          const status = event.status as 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
          this.projectionService.projectCampaignStatus(String(event.campaignId), status);
        }
      } catch (e) {
        console.error('[WebsocketGateway] Failed to parse campaign event', e);
      }
    });
  }

  ngOnDestroy() {
    this.ngOnDestroyCleanup();
  }

  private ngOnDestroyCleanup() {
    this.subscription?.unsubscribe();
    this.reconnectSub?.unsubscribe();
    this.networkStatusSub?.unsubscribe();
    if (this.latencyInterval) clearInterval(this.latencyInterval);
    this.campaignSubscriptions.forEach(sub => sub.unsubscribe());
    this.campaignSubscriptions.clear();
  }
}
