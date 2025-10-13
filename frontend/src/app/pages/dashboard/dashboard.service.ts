import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { API_BASE_URL } from '../../core/api.config';
import {
  DashboardActivitiesParams,
  DashboardActivitiesResponse,
  DashboardOverviewParams,
  DashboardOverviewResponse
} from './dashboard.types';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly endpoint = `${API_BASE_URL}/dashboard`;

  constructor(private readonly http: HttpClient, private readonly authService: AuthService) {}

  getOverview(params?: DashboardOverviewParams): Observable<DashboardOverviewResponse> {
    return this.http.get<DashboardOverviewResponse>(`${this.endpoint}/overview`, {
      headers: this.buildHeaders(),
      params: this.buildOverviewParams(params)
    });
  }

  getActivities(params?: DashboardActivitiesParams): Observable<DashboardActivitiesResponse> {
    return this.http.get<DashboardActivitiesResponse>(`${this.endpoint}/activities`, {
      headers: this.buildHeaders(),
      params: this.buildActivitiesParams(params)
    });
  }

  private buildHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private buildOverviewParams(params?: DashboardOverviewParams): HttpParams {
    let httpParams = new HttpParams();

    if (!params) {
      return httpParams;
    }

    if (params.from) {
      httpParams = httpParams.set('from', params.from.toISOString());
    }

    if (params.to) {
      httpParams = httpParams.set('to', params.to.toISOString());
    }

    if (params.compareFrom) {
      httpParams = httpParams.set('compareFrom', params.compareFrom.toISOString());
    }

    if (params.compareTo) {
      httpParams = httpParams.set('compareTo', params.compareTo.toISOString());
    }

    if (params.currency) {
      httpParams = httpParams.set('currency', params.currency);
    }

    return httpParams;
  }

  private buildActivitiesParams(params?: DashboardActivitiesParams): HttpParams {
    let httpParams = new HttpParams();

    if (!params) {
      return httpParams;
    }

    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }

    if (params.pageSize) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }

    return httpParams;
  }
}
