import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateCampaignRequest, TemplatePreviewResponse } from '../../domain/models/campaign.model';

@Injectable({
  providedIn: 'root'
})
export class CampaignApiService {
  private readonly http = inject(HttpClient);

  createCampaign(payload: CreateCampaignRequest): Observable<any> {
    return this.http.post('/api/admin/campaigns/create', payload);
  }

  previewTemplate(templateName: string): Observable<TemplatePreviewResponse> {
    return this.http.post<TemplatePreviewResponse>('/api/admin/campaigns/templates/preview', { templateName });
  }
}
