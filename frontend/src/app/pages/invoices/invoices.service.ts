import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api.config';
import { AuthService } from '../../core/auth.service';
import { InvoiceDto, SaveInvoicePayload } from './invoices.types';

@Injectable({ providedIn: 'root' })
export class InvoicesService {
  private readonly endpoint = `${API_BASE_URL}/invoice`;

  constructor(private readonly http: HttpClient, private readonly authService: AuthService) {}

  getInvoices(): Observable<InvoiceDto[]> {
    return this.http.get<InvoiceDto[]>(`${this.endpoint}/get-all-invoices`, {
      headers: this.buildHeaders()
    });
  }

  getInvoice(invoiceId: number): Observable<InvoiceDto> {
    const params = new HttpParams().set('invoiceId', invoiceId);

    return this.http.get<InvoiceDto>(`${this.endpoint}/get-invoice`, {
      headers: this.buildHeaders(),
      params
    });
  }

  createInvoice(payload: SaveInvoicePayload): Observable<void> {
    return this.http.post<void>(`${this.endpoint}/create-invoice`, payload, {
      headers: this.buildHeaders().set('Content-Type', 'application/json')
    });
  }

  updateInvoice(payload: SaveInvoicePayload): Observable<void> {
    return this.http.put<void>(`${this.endpoint}/update-invoice`, payload, {
      headers: this.buildHeaders().set('Content-Type', 'application/json')
    });
  }

  deleteInvoice(invoiceId: number): Observable<void> {
    const params = new HttpParams().set('invoiceId', invoiceId);

    return this.http.delete<void>(`${this.endpoint}/delete-invoice`, {
      headers: this.buildHeaders(),
      params
    });
  }

  private buildHeaders(): HttpHeaders {
    const token = this.authService.getToken();

    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
