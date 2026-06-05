import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, lastValueFrom, shareReplay } from 'rxjs';
import { injectQuery, keepPreviousData, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { environment } from '../../../environments/environment';
import { ToastService } from '@core/services/toast.service';
import {
  Campaign,
  CampaignSearchParams,
  CampaignSearchResponse,
  CreateCampaignRequest,
  TemplatePreviewResponse,
  CampaignTemplate,
  CampaignNotification,
  CampaignNotificationFilter,
  PagedResponse
} from '@data/models/campaign.model';

export const campaignKeys = {
  all: ['campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: (filters: CampaignSearchParams) => [...campaignKeys.lists(), filters] as const,
  details: () => [...campaignKeys.all, 'detail'] as const,
  detail: (id: string) => [...campaignKeys.details(), id] as const,
  notificationsAll: (id: string) => [...campaignKeys.detail(id), 'notifications'] as const,
  notifications: (id: string, filters: CampaignNotificationFilter) => [...campaignKeys.notificationsAll(id), filters] as const,
  templates: () => [...campaignKeys.all, 'templates'] as const,
};

@Injectable()
export class CampaignService {
  private readonly http = inject(HttpClient);
  private readonly queryClient = injectQueryClient();
  private readonly toast = inject(ToastService);
  private readonly BASE_URL = `${environment.apiBaseUrl}/api/admin/campaigns`;
  private templatesCache$?: Observable<CampaignTemplate[]>;

  createCampaign(payload: CreateCampaignRequest): Observable<unknown> {
    return this.http.post(`${this.BASE_URL}/create`, payload);
  }

  previewTemplate(templateName: string): Observable<TemplatePreviewResponse> {
    return this.http.post<TemplatePreviewResponse>(`${this.BASE_URL}/templates/preview`, { templateName });
  }

  getAllTemplates(): Observable<CampaignTemplate[]> {
    if (!this.templatesCache$) {
      this.templatesCache$ = this.http.get<CampaignTemplate[]>(`${this.BASE_URL}/templates/all`).pipe(
        shareReplay(1)
      );
    }
    return this.templatesCache$;
  }

  searchCampaigns(params: CampaignSearchParams): Observable<CampaignSearchResponse> {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('size', params.size.toString());

    if (params.campaignName) {
      httpParams = httpParams.set('campaignName', params.campaignName);
    }
    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params.sortDirection) {
      httpParams = httpParams.set('sortDirection', params.sortDirection);
    }

    return this.http.get<CampaignSearchResponse>(`${this.BASE_URL}/search`, { params: httpParams });
  }

  getCampaignById(campaignId: string): Observable<Campaign> {
    return this.http.get<Campaign>(`${this.BASE_URL}/${campaignId}`);
  }

  getCampaignNotifications(
    campaignId: string,
    params: CampaignNotificationFilter
  ): Observable<PagedResponse<CampaignNotification>> {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('size', params.size.toString());

    if (params.channel) httpParams = httpParams.set('channel', params.channel);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.keyword) httpParams = httpParams.set('keyword', params.keyword);

    return this.http.get<PagedResponse<CampaignNotification>>(
      `${this.BASE_URL}/${campaignId}/notifications`,
      { params: httpParams }
    );
  }

  retryNotification(notificationId: number): Observable<unknown> {
    return this.http.post(`${this.BASE_URL}/${notificationId}/retry`, {});
  }

  getNotificationDetails(notificationId: number): Observable<any> {
    return this.http.get(`${this.BASE_URL}/notifications/${notificationId}/details`);
  }

  // --- UI STORE STATE & SIGNALS ---
  readonly listFilters = signal<CampaignSearchParams>({
    campaignName: '',
    status: '',
    sortDirection: 'DESC',
    page: 0,
    size: 50
  });

  readonly selectedNotificationId = signal<number | null>(null);
  readonly drawerOpen = signal<boolean>(false);
  
  private readonly notificationFiltersMap = signal<Record<string, CampaignNotificationFilter>>({});

  getNotificationFilters(campaignId: string): CampaignNotificationFilter {
    return this.notificationFiltersMap()[campaignId] || { page: 0, size: 10 };
  }

  setNotificationFilters(campaignId: string, filters: CampaignNotificationFilter): void {
    this.notificationFiltersMap.update(prev => ({
      ...prev,
      [campaignId]: filters
    }));
  }

  openDrawer(notificationId: number): void {
    this.selectedNotificationId.set(notificationId);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.selectedNotificationId.set(null);
  }

  resetListFilters(): void {
    this.listFilters.set({
      campaignName: '',
      status: '',
      sortDirection: 'DESC',
      page: 0,
      size: 50
    });
  }

  // --- QUERY STATE & SIGNALS ---
  readonly activeCampaignId = signal<string | null>(null);
  readonly notificationCampaignId = signal<string | null>(null);
  readonly notificationFilters = signal<CampaignNotificationFilter>({ page: 0, size: 10 });

  readonly campaignsQuery = injectQuery(() => {
    const filters = this.listFilters();
    return {
      queryKey: campaignKeys.list(filters),
      queryFn: () => lastValueFrom(this.searchCampaigns(filters)),
      placeholderData: keepPreviousData,
    };
  });

  readonly templatesQuery = injectQuery(() => ({
    queryKey: campaignKeys.templates(),
    queryFn: () => lastValueFrom(this.getAllTemplates()),
    staleTime: 5 * 60 * 1000, 
  }));

  readonly campaignDetailsQuery = injectQuery(() => {
    const id = this.activeCampaignId();
    return {
      queryKey: campaignKeys.detail(id || ''),
      queryFn: () => lastValueFrom(this.getCampaignById(id || '')),
      enabled: !!id,
    };
  });

  readonly notificationsQuery = injectQuery(() => {
    const id = this.notificationCampaignId();
    const filters = this.notificationFilters();
    return {
      queryKey: campaignKeys.notifications(id || '', filters),
      queryFn: () => lastValueFrom(this.getCampaignNotifications(id || '', filters)),
      enabled: !!id,
      placeholderData: keepPreviousData,
    };
  });

  readonly notificationDetailsQuery = injectQuery(() => {
    const id = this.selectedNotificationId();
    return {
      queryKey: ['notification-details', id || 0],
      queryFn: () => lastValueFrom(this.getNotificationDetails(id || 0)),
      enabled: !!id,
    };
  });

  setActiveCampaignId(id: string | null): void {
    this.activeCampaignId.set(id);
  }

  setNotificationParams(campaignId: string, filters: CampaignNotificationFilter): void {
    this.notificationCampaignId.set(campaignId);
    this.notificationFilters.set(filters);
    
    this.setNotificationFilters(campaignId, filters);
  }

  // --- COMMAND MUTATIONS ---
  readonly createCampaignMutation = injectMutation(() => ({
    mutationFn: (request: CreateCampaignRequest) => lastValueFrom(this.createCampaign(request)),
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
      lastValueFrom(this.retryNotification(notificationId)),
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
    mutationFn: (templateName: string) => lastValueFrom(this.previewTemplate(templateName)),
  }));
}
