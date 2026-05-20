import { Injectable, inject } from '@angular/core';
import { injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { CampaignApi } from '@data/api/campaign.api';
import { campaignKeys } from '@data/store/campaign/campaign-keys';
import { CreateCampaignRequest, Campaign } from '@data/model/campaign.model';
import { ToastService } from '@core/services/toast.service';
import { CampaignRepository } from '@data/repository/campaign.repository';
import { CampaignLocalStorageService } from '@data/store/campaign/campaign-local-storage.service';
import { RealtimeQueryRegistry } from '@data/store/campaign/realtime-query-registry.service';
import { CacheProjectionService } from '@data/store/campaign/cache-projection.service';

const TAB_ID = `tab_${Math.random().toString(36).substring(2, 11)}`;

interface TabSyncMessage {
  type: 'CAMPAIGN_MUTATION';
  action: 'CREATE' | 'STATUS_CHANGED';
  campaign: Campaign;
  sourceTabId: string;
  eventId: string;
  reconcileId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CampaignCommandFacade {
  private readonly api = inject(CampaignApi);
  private readonly queryClient = injectQueryClient();
  private readonly toast = inject(ToastService);
  private readonly campaignRepository = inject(CampaignRepository);
  private readonly localStorage = inject(CampaignLocalStorageService);
  private readonly registry = inject(RealtimeQueryRegistry);
  private readonly projectionService = inject(CacheProjectionService);

  private readonly channelName = 'notification_campaign_sync_channel';
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    this.initTabSync();
  }

  private initTabSync() {
    if (typeof window !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel(this.channelName);
        this.broadcastChannel.onmessage = (event) => this.handleTabSyncMessage(event.data);
      } catch (e) {
        console.warn('[TabSync] BroadcastChannel not supported, falling back to localStorage');
        window.addEventListener('storage', (event) => {
          if (event.key === `_tab_sync_${this.channelName}` && event.newValue) {
            try {
              this.handleTabSyncMessage(JSON.parse(event.newValue));
            } catch (err) {
              console.error('[TabSync] Failed to parse storage sync message', err);
            }
          }
        });
      }
    }
  }

  private broadcastSync(message: TabSyncMessage) {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(message);
    } else if (typeof window !== 'undefined') {
      const msgStr = JSON.stringify(message);
      localStorage.setItem(`_tab_sync_${this.channelName}`, msgStr);
      localStorage.removeItem(`_tab_sync_${this.channelName}`); // Immediately clear
    }
  }

  private handleTabSyncMessage(msg: TabSyncMessage) {
    if (!msg || msg.sourceTabId === TAB_ID) return; // Ignore own tab messages

    console.log('[TabSync] Received cross-tab sync message:', msg);
    
    if (msg.type === 'CAMPAIGN_MUTATION') {
      if (msg.action === 'CREATE') {
        if (msg.reconcileId) {
          // Cross-tab reconciliation
          this.reconcileCampaign(msg.reconcileId, msg.campaign);
        } else {
          // Cross-tab optimistic insert
          this.projectionService.projectCampaignCreated(msg.campaign);
        }
      }
    }
  }

  readonly createCampaignMutation = injectMutation(() => ({
    mutationFn: (request: CreateCampaignRequest) => lastValueFrom(this.api.createCampaign(request)),
    onMutate: async (request: CreateCampaignRequest) => {
      // Create optimistic campaign object
      const optimisticCampaign: Campaign = {
        id: `opt_${Math.random().toString(36).substring(2, 11)}`,
        name: request.name,
        status: 'ACTIVE', // Default status for new campaign
        channel: (request.channel as any) || 'PUSH',
        totalTarget: 0,
        sentStatus: { sent: 0, failed: 0, pending: 0 },
        createdAt: new Date().toISOString(),
        scheduledTime: request.scheduledTime
      };

      // Invalidate and cancel outgoing list queries
      await this.queryClient.cancelQueries({ queryKey: campaignKeys.lists() });

      // Prepend to cache lists using CacheProjectionService
      this.projectionService.projectCampaignCreated(optimisticCampaign);
      
      // Save to IndexedDB/local storage
      await this.localStorage.saveCampaign(optimisticCampaign);

      // Broadcast optimistic creation to other tabs
      this.broadcastSync({
        type: 'CAMPAIGN_MUTATION',
        action: 'CREATE',
        campaign: optimisticCampaign,
        sourceTabId: TAB_ID,
        eventId: `evt_${Math.random().toString(36).substring(2, 11)}`
      });

      return { optimisticCampaign };
    },
    onSuccess: (serverCampaign: any, variables, context) => {
      this.toast.success('Chiến dịch đã được tạo thành công.');
      
      const optCampaign = context?.optimisticCampaign;
      if (optCampaign) {
        // Swap in optimistic for server Campaign
        this.reconcileCampaign(optCampaign.id, serverCampaign);
      }
      
      // Broadcast success reconciliation to other tabs
      this.broadcastSync({
        type: 'CAMPAIGN_MUTATION',
        action: 'CREATE',
        campaign: serverCampaign,
        sourceTabId: TAB_ID,
        eventId: `evt_${Math.random().toString(36).substring(2, 11)}`,
        reconcileId: optCampaign?.id
      });

      // Reload repositories/lists
      this.campaignRepository.forceReload();
    },
    onError: (error: any, variables, context) => {
      this.toast.error(error?.error?.message || 'Không thể tạo chiến dịch. Vui lòng thử lại.');
      
      const optCampaign = context?.optimisticCampaign;
      if (optCampaign) {
        // Rollback from cache and IndexedDB
        this.rollbackCampaign(optCampaign.id);
      }
    }
  }));

  private reconcileCampaign(optimisticId: string, serverCampaign: Campaign) {
    // 1. Remove optimistic from LocalStorage/IndexedDB
    this.localStorage.removeCampaign(optimisticId);
    // 2. Save server campaign
    this.localStorage.saveCampaign(serverCampaign);

    // 3. Swap in TanStack Query Cache list keys
    const listKeys = this.registry.getListQueryKeys();
    listKeys.forEach(key => {
      this.queryClient.setQueryData<any>(key, (old: any) => {
        if (!old || !old.pages) return old;
        const pages = old.pages.map((page: any) => {
          const content = page.content.map((c: Campaign) => {
            if (String(c.id) === String(optimisticId)) return serverCampaign;
            return c;
          });
          return { ...page, content };
        });
        return { ...old, pages };
      });
    });

    // 4. Invalidate details
    this.queryClient.setQueryData(campaignKeys.detail(serverCampaign.id), serverCampaign);
    this.queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
  }

  private rollbackCampaign(optimisticId: string) {
    // 1. Remove from LocalStorage/IndexedDB
    this.localStorage.removeCampaign(optimisticId);

    // 2. Remove from TanStack Cache lists
    const listKeys = this.registry.getListQueryKeys();
    listKeys.forEach(key => {
      this.queryClient.setQueryData<any>(key, (old: any) => {
        if (!old || !old.pages) return old;
        const pages = old.pages.map((page: any) => {
          const content = page.content.filter((c: Campaign) => String(c.id) !== String(optimisticId));
          return { ...page, content };
        });
        return { ...old, pages };
      });
    });

    this.queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
  }

  readonly retryNotificationMutation = injectMutation(() => ({
    mutationFn: ({ campaignId, notificationId }: { campaignId: string; notificationId: number }) => 
      lastValueFrom(this.api.retryNotification(notificationId)),
    onSuccess: (_, variables) => {
      this.toast.success('Đã gửi yêu cầu gửi lại thông báo.');
      this.queryClient.invalidateQueries({ queryKey: campaignKeys.notificationsAll(variables.campaignId) });
      this.queryClient.invalidateQueries({ queryKey: campaignKeys.detail(variables.campaignId) });
    },
    onError: (error: any) => {
      this.toast.error(error?.error?.message || 'Không thể gửi lại thông báo.');
    }
  }));

  readonly previewTemplateMutation = injectMutation(() => ({
    mutationFn: (templateName: string) => lastValueFrom(this.api.previewTemplate(templateName)),
  }));
}
