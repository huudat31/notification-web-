import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResponse } from '../model/paged-response.model';

export interface UserSearchItem {
  id: number;
  name: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
}

@Injectable({ providedIn: 'root' })
export class UserSearchRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/admin/users`;

  searchUsers(params: { keyword?: string; status?: 'ACTIVE' | 'INACTIVE' | ''; page: number; size: number }): Observable<PagedResponse<UserSearchItem>> {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('size', params.size.toString());

    if (params.keyword) {
      httpParams = httpParams.set('keyword', params.keyword);
    }

    if (params.status && params.status.length > 0) {
      httpParams = httpParams.set('status', params.status);
    }

    return this.http.get<PagedResponse<UserSearchItem>>(`${this.baseUrl}/search`, { params: httpParams });
  }
}
