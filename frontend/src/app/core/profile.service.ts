import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { AuthService } from './auth.service';

export interface UserProfile {
  id: number;
  username: string;
  name: string;
  surname: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface UpdateProfilePayload {
  username: string;
  name: string;
  surname: string;
  email: string;
}

export interface UpdatePasswordPayload {
  newPassword: string;
  confirmPassword: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly profileUrl = `${API_BASE_URL}/profile`;

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {}

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.profileUrl}/me`, {
      headers: this.createAuthHeaders()
    });
  }

  updateProfile(payload: UpdateProfilePayload): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.profileUrl}/me/update-profile`, payload, {
      headers: this.createAuthHeaders()
    });
  }

  updatePassword(payload: UpdatePasswordPayload): Observable<void> {
    return this.http.put<void>(`${this.profileUrl}/me/update-password`, payload, {
      headers: this.createAuthHeaders()
    });
  }

  private createAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
