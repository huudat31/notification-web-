import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import {
  CreateCampaignRequest,
  TemplatePreviewResponse,
  CampaignTemplate,
  CampaignSearchParams,
  CampaignSearchResponse,
  Campaign
} from '@data/model/campaign.model';
import { CampaignNotification, CampaignNotificationFilter } from '@data/model/campaign-notification.model';
import { PagedResponse } from '@data/model/paged-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CampaignApi {
  private readonly http = inject(HttpClient);
  private templatesCache$?: Observable<CampaignTemplate[]>;
  private readonly BASE_URL = `${environment.apiBaseUrl}/api/admin/campaigns`;

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

  getCampaignNotificationsDelta(campaignId: string, sinceSequence: number): Observable<CampaignNotification[]> {
    const params = new HttpParams().set('sinceSequence', sinceSequence.toString());
    return this.http.get<CampaignNotification[]>(`${this.BASE_URL}/${campaignId}/notifications/delta`, { params });
  }
}
