import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { API_BASE_URL } from '../../core/api.config';
import {
  BoardPreferences,
  ClientOption,
  CreateProjectRequest,
  ProjectDto,
  ProjectStatus,
  ProjectSummary,
  UpdateProjectRequest
} from './projects.types';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly endpoint = `${API_BASE_URL}/project`;
  private readonly clientsEndpoint = `${API_BASE_URL}/client/clients`;
  private readonly preferencesKey = 'fivvy.projects.boardPreferences';

  constructor(private readonly http: HttpClient, private readonly authService: AuthService) {}

  getProjects(): Observable<ProjectSummary[]> {
    return this.http
      .get<ProjectDto[]>(`${this.endpoint}/all-projects`, { headers: this.buildHeaders() })
      .pipe(map(projects => projects.map(project => this.mapProject(project))));
  }

  createProject(request: CreateProjectRequest): Observable<void> {
    return this.http.post<void>(`${this.endpoint}/add-project`, request, {
      headers: this.buildHeaders()
    });
  }

  updateProject(request: UpdateProjectRequest): Observable<void> {
    return this.http.put<void>(`${this.endpoint}/update-project`, request, {
      headers: this.buildHeaders()
    });
  }

  deleteProject(projectId: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/remove-project/${projectId}`, {
      headers: this.buildHeaders()
    });
  }

  getClients(): Observable<ClientOption[]> {
    return this.http
      .get<ClientDto[]>(this.clientsEndpoint, { headers: this.buildHeaders() })
      .pipe(map(clients => clients.map(client => this.mapClient(client))));
  }

  getBoardPreferences(): BoardPreferences {
    const raw = localStorage.getItem(this.preferencesKey);

    if (!raw) {
      return {
        visibleStatuses: {
          planned: true,
          active: true,
          completed: true
        }
      };
    }

    try {
      const parsed = JSON.parse(raw) as BoardPreferences;
      if (!parsed?.visibleStatuses) {
        throw new Error('missing preferences');
      }
      return parsed;
    } catch {
      return {
        visibleStatuses: {
          planned: true,
          active: true,
          completed: true
        }
      };
    }
  }

  saveBoardPreferences(preferences: BoardPreferences): void {
    localStorage.setItem(this.preferencesKey, JSON.stringify(preferences));
  }

  private mapProject(dto: ProjectDto): ProjectSummary {
    const startDate = new Date(dto.startDate);
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;
    const status = this.deriveStatus(startDate, endDate, dto.isActive);

    return {
      id: dto.id,
      name: dto.projectName,
      description: dto.description,
      startDate,
      endDate: endDate ?? null,
      clientId: dto.clientId,
      isActive: dto.isActive,
      status,
      progress: this.estimateProgress(startDate, endDate, status),
      durationDays: this.calculateDuration(startDate, endDate),
      projectPrice: dto.projectPrice
    };
  }

  private mapClient(dto: ClientDto): ClientOption {
    return {
      id: dto.id,
      name: dto.contactName || dto.companyName || `Müşteri #${dto.id}`
    };
  }

  private deriveStatus(start: Date, end: Date | undefined, isActive: boolean): ProjectStatus {
    const now = new Date();

    if (end && end < now) {
      return 'completed';
    }

    if (start > now) {
      return 'planned';
    }

    return isActive ? 'active' : 'completed';
  }

  private estimateProgress(start: Date, end: Date | undefined, status: ProjectStatus): number {
    if (status === 'completed') {
      return 100;
    }

    const now = new Date();

    if (!end || end <= start) {
      const daysElapsed = Math.max(0, (now.getTime() - start.getTime()) / 86_400_000);
      return Math.max(0, Math.min(95, Math.round(daysElapsed * 5)));
    }

    const total = end.getTime() - start.getTime();
    const elapsed = Math.min(Math.max(now.getTime() - start.getTime(), 0), total);
    const ratio = total === 0 ? 1 : elapsed / total;
    return Math.round(Math.max(0, Math.min(ratio, 1)) * 100);
  }

  private calculateDuration(start: Date, end: Date | undefined): number | undefined {
    if (!end) {
      return undefined;
    }

    const milliseconds = end.getTime() - start.getTime();
    if (milliseconds <= 0) {
      return undefined;
    }

    return Math.round(milliseconds / 86_400_000);
  }

  private buildHeaders(): HttpHeaders {
    const token = this.authService.getToken();

    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}

interface ClientDto {
  id: number;
  companyName?: string | null;
  contactName?: string | null;
}
