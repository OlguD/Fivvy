import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { API_BASE_URL } from '../../core/api.config';
import { ClientDto, ClientPayload, UpdateClientRequest } from './clients.types';

@Injectable({ providedIn: 'root' })
export class ClientsService {
  private readonly endpoint = `${API_BASE_URL}/client`;

  constructor(private readonly http: HttpClient, private readonly authService: AuthService) {}

  getClients(): Observable<ClientDto[]> {
    return this.http.get<ClientDto[]>(`${this.endpoint}/clients`, { headers: this.buildHeaders() });
  }

  addClient(payload: ClientPayload): Observable<void> {
    return this.http.post<void>(`${this.endpoint}/add-client`, payload, {
      headers: this.buildHeaders()
    });
  }

  updateClient(clientId: number, payload: ClientPayload): Observable<void> {
    const body = {
      ClientId: clientId,
      ClientModel: payload
    } satisfies UpdateClientRequest;

    return this.http.put<void>(`${this.endpoint}/update-client`, body, {
      headers: this.buildHeaders()
    });
  }

  removeClient(clientId: number): Observable<void> {
    const headers = this.buildHeaders().set('Content-Type', 'application/json');

    return this.http.request<void>('delete', `${this.endpoint}/remove-client`, {
      headers,
      body: { ClientId: clientId }
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
