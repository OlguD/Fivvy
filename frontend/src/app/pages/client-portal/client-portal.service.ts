import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api.config';

export interface PortalClientDto {
  id: number;
  contactName?: string;
  email?: string;
  companyName?: string;
}

export interface PortalProjectDto {
  id: number;
  projectName: string;
  isActive: boolean;
  projectPrice: number;
}

export interface PortalInvoiceDto {
  id: number;
  invoiceNumber?: string;
  status: string;
  total: number;
  dueDate: string;
  invoiceDate: string;
}

export interface PortalDataDto {
  client: PortalClientDto;
  projects: PortalProjectDto[];
  invoices: PortalInvoiceDto[];
}

@Injectable({ providedIn: 'root' })
export class ClientPortalService {
  private readonly endpoint = `${API_BASE_URL}/client`;

  constructor(private readonly http: HttpClient) {}

  getPortalData(clientId: number, token: string): Observable<PortalDataDto> {
    const params = new HttpParams().set('token', token);
    // Mark this request as portal/public so the interceptor will not attach auth headers or attempt refresh
    const headers = { 'X-Skip-Auth': '1' };
    return this.http.get<PortalDataDto>(`${this.endpoint}/${clientId}/portal`, { params, headers, withCredentials: false });
  }

  approveInvoice(clientId: number, invoiceId: number, token: string) {
    const params = new HttpParams().set('token', token);
    const headers = { 'X-Skip-Auth': '1' };
    return this.http.post(`${this.endpoint}/${clientId}/portal/invoices/${invoiceId}/approve`, {}, { params, headers, withCredentials: false });
  }

  downloadInvoicePdf(clientId: number, invoiceId: number, token: string) {
    // Use the invoice PDF endpoint and pass clientId + portalToken as query params.
    const params = new HttpParams().set('clientId', String(clientId)).set('portalToken', token);
    const headers = { 'X-Skip-Auth': '1' };
    return this.http.get(`${API_BASE_URL}/invoice/${invoiceId}/pdf`, { params, headers, withCredentials: false, responseType: 'blob' as 'json' });
  }
}
