export interface ProjectDto {
  id: number;
  projectName: string;
  description: string;
  startDate: string;
  endDate?: string | null;
  clientId: number;
  isActive: boolean;
  projectPrice: number;
}

export interface ProjectSummary {
  id: number;
  name: string;
  description: string;
  startDate: Date;
  endDate?: Date | null;
  clientId: number;
  isActive: boolean;
  status: ProjectStatus;
  progress: number;
  durationDays?: number;
  projectPrice: number;
}

export type ProjectStatus = 'planned' | 'active' | 'completed';

export interface ClientOption {
  id: number;
  name: string;
}

export interface BoardPreferences {
  visibleStatuses: Record<ProjectStatus, boolean>;
}

export interface CreateProjectRequest {
  projectName: string;
  description: string;
  startDate: string;
  endDate?: string | null;
  clientId: number;
  projectPrice: number;
}

export interface UpdateProjectRequest extends CreateProjectRequest {
  projectId: number;
}
