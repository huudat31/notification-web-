import { Injectable, inject } from '@angular/core';
import { injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { CampaignApi } from '@data/api/campaign.api';
import { campaignKeys } from '@data/store/campaign/campaign-keys';
import { CreateCampaignRequest } from '@data/model/campaign.model';
import { ToastService } from '@core/services/toast.service';

@Injectable({
  providedIn: 'root'
})
export class CampaignCommandFacade {
  private readonly api = inject(CampaignApi);
  private readonly queryClient = injectQueryClient();
  private readonly toast = inject(ToastService);

  readonly createCampaignMutation = injectMutation(() => ({
    mutationFn: (request: CreateCampaignRequest) => lastValueFrom(this.api.createCampaign(request)),
    onSuccess: () => {
      this.toast.success('Chiến dịch đã được tạo thành công.');
      this.queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
    onError: (error: any) => {
      this.toast.error(error?.error?.message || 'Không thể tạo chiến dịch. Vui lòng thử lại.');
    }
  }));

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
