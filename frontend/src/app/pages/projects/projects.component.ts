import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { ProjectsService } from './projects.service';
import { ProjectSummary } from './projects.types';
import { ProjectCreateDialogComponent } from './project-create-dialog.component';

interface ProjectListItem {
  id: number;
  name: string;
  clientLabel: string;
  startDateLabel: string;
  endDateLabel: string;
  statusLabel: string;
  description: string;
  priceLabel: string;
  summary: ProjectSummary;
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDialogModule, MatSnackBarModule],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit {
  projects: ProjectListItem[] = [];
  loading = false;
  errorMessage?: string;
  private readonly deletingProjects = new Set<number>();

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadProjects();
  }

  async reload(): Promise<void> {
    await this.loadProjects();
  }

  isDeleting(projectId: number): boolean {
    return this.deletingProjects.has(projectId);
  }

  async openCreateDialog(): Promise<void> {
    const dialogRef = this.dialog.open(ProjectCreateDialogComponent, {
      disableClose: true,
      data: { mode: 'create', defaultStartDate: new Date() }
    });

    const result = await firstValueFrom(dialogRef.afterClosed());

    if (result?.created) {
      await this.loadProjects();
      this.snackBar.open('Proje başarıyla oluşturuldu.', undefined, { duration: 3000 });
    }
  }

  async openUpdateDialog(project: ProjectListItem): Promise<void> {
    const dialogRef = this.dialog.open(ProjectCreateDialogComponent, {
      disableClose: true,
      data: { mode: 'edit', project: project.summary }
    });

    const result = await firstValueFrom(dialogRef.afterClosed());

    if (result?.updated) {
      await this.loadProjects();
      this.snackBar.open('Proje güncellendi.', undefined, { duration: 3000 });
    }
  }

  confirmDelete(project: ProjectListItem): void {
    const dialogRef = this.dialog.open(ProjectDeleteDialogComponent, {
      width: '420px',
      data: {
        projectId: project.id,
        projectName: project.name
      }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (!result?.confirmed) {
        return;
      }

      await this.deleteProject(result.projectId);
    });
  }

  private async deleteProject(projectId: number): Promise<void> {
    if (this.deletingProjects.has(projectId)) {
      return;
    }

    this.deletingProjects.add(projectId);

    try {
      await firstValueFrom(this.projectsService.deleteProject(projectId));
      this.snackBar.open('Proje silindi.', undefined, { duration: 3000 });
      await this.loadProjects();
    } catch (error) {
      const message = this.resolveError(error) ?? 'Proje silinirken beklenmeyen bir hata oluştu.';
      this.snackBar.open(message, 'Tamam', { duration: 4000 });
    } finally {
      this.deletingProjects.delete(projectId);
    }
  }

  private async loadProjects(): Promise<void> {
    this.loading = true;
    this.errorMessage = undefined;

    try {
      const [projects, clients] = await Promise.all([
        firstValueFrom(this.projectsService.getProjects()),
        firstValueFrom(this.projectsService.getClients())
      ]);

      const clientsById = new Map(clients.map(client => [client.id, client.name]));
      this.projects = projects.map(project => this.toListItem(project, clientsById));
    } catch (error) {
      console.error('Failed to load projects', error);
      this.errorMessage = this.resolveError(error) ?? 'Projeler yüklenirken beklenmeyen bir hata oluştu.';
      this.projects = [];
    } finally {
      this.loading = false;
    }
  }

  private toListItem(project: ProjectSummary, clientsById: Map<number, string>): ProjectListItem {
    return {
      id: project.id,
      name: project.name,
      clientLabel: clientsById.get(project.clientId) ?? `Müşteri #${project.clientId}`,
      startDateLabel: this.formatDate(project.startDate),
      endDateLabel: this.formatDate(project.endDate),
      statusLabel: this.formatStatus(project.status),
      description: project.description ?? '',
      priceLabel: this.formatPrice(project.projectPrice),
      summary: project
    };
  }

  private formatStatus(status: ProjectSummary['status']): string {
    switch (status) {
      case 'planned':
        return 'Planlanan';
      case 'completed':
        return 'Tamamlandı';
      default:
        return 'Devam ediyor';
    }
  }

  private formatDate(value: Date | string | null | undefined): string {
    if (!value) {
      return '—';
    }

    const date = typeof value === 'string' ? new Date(value) : value;

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(date);
  }

  private resolveError(error: unknown): string | undefined {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        return 'Projeleri görmek için lütfen oturum açın.';
      }

      if (error.status === 403) {
        return 'Projeleri görüntüleme yetkiniz bulunmuyor.';
      }

      return error.error?.message ?? error.message;
    }

    return undefined;
  }

  private formatPrice(value: number): string {
    if (value == null || Number.isNaN(value)) {
      return '—';
    }

    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
}

interface ProjectDeleteDialogData {
  projectId: number;
  projectName: string;
}

interface ProjectDeleteDialogResult {
  confirmed: boolean;
  projectId: number;
}

@Component({
  selector: 'app-project-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="dialog__title">
      <mat-icon aria-hidden="true">delete</mat-icon>
      Projeyi sil
    </h2>

    <mat-dialog-content class="dialog__content">
      <p>
        <strong>{{ data.projectName }}</strong> projesini silmek istediğinizden emin misiniz?
      </p>
      <p class="dialog__warning">
        Bu işlem geri alınamaz ve proje verileri kalıcı olarak kaldırılır.
      </p>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog__actions">
      <button mat-stroked-button type="button" (click)="cancel()">Vazgeç</button>
      <button mat-raised-button color="primary" type="button" class="dialog__confirm" (click)="confirm()">
        Projeyi sil
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog__title {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin: 0 0 1rem;
        font-size: 1.35rem;
        font-weight: 700;
        color: var(--app-text);
      }

      .dialog__title mat-icon {
        font-size: 1.45rem;
        color: var(--primary);
      }

      .dialog__content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-width: min(480px, 90vw);
        color: var(--app-text);
      }

      .dialog__warning {
        margin: 0;
        padding: 0.75rem 1rem;
        border-radius: 0.8rem;
        background: color-mix(in srgb, var(--field-error-border) 18%, transparent);
        border: 1px solid color-mix(in srgb, var(--field-error-border) 45%, transparent);
        color: var(--field-error-text);
        font-weight: 600;
      }

      .dialog__actions {
        gap: 0.75rem;
      }

      .dialog__confirm {
        background: var(--btn-gradient);
        color: var(--btn-text);
        box-shadow: var(--btn-hover-shadow);
      }

      .dialog__confirm:hover {
        box-shadow: 0 18px 42px rgba(37, 99, 235, 0.3);
      }

      [data-theme='dark'] .dialog__confirm:hover {
        box-shadow: 0 20px 44px rgba(96, 165, 250, 0.32);
      }
    `
  ]
})
export class ProjectDeleteDialogComponent {
  constructor(
    private readonly dialogRef: MatDialogRef<ProjectDeleteDialogComponent, ProjectDeleteDialogResult>,
    @Inject(MAT_DIALOG_DATA) public readonly data: ProjectDeleteDialogData
  ) {}

  cancel(): void {
    this.dialogRef.close({ confirmed: false, projectId: this.data.projectId });
  }

  confirm(): void {
    this.dialogRef.close({ confirmed: true, projectId: this.data.projectId });
  }
}
