import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { firstValueFrom, Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ProjectsService } from './projects.service';
import { ProjectSummary } from './projects.types';
import { ProjectCreateDialogComponent } from './project-create-dialog.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../core/language.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DataTableComponent, DataTableColumn, DataTableAction } from '../../shared/components/data-table/data-table.component';

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
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatButtonModule, MatDialogModule, MatSnackBarModule, MatProgressSpinnerModule, TranslateModule, DataTableComponent],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit, OnDestroy {
  readonly searchControl = new FormControl('', { nonNullable: true });

  projects: ProjectListItem[] = [];
  filteredProjects: ProjectListItem[] = [];
  loading = false;
  errorMessage?: string;
  private readonly deletingProjects = new Set<number>();
  private clientsById = new Map<number, string>();
  private errorMessageKey?: string;

  tableColumns: DataTableColumn<ProjectListItem>[] = [];
  tableActions: DataTableAction<ProjectListItem>[] = [];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly translate: TranslateService,
    private readonly language: LanguageService
  ) {
    this.language.languageChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (this.projects.length > 0) {
          this.projects = this.projects.map(item => this.toListItem(item.summary, this.clientsById));
        }

        this.initializeTableConfig();

        if (this.errorMessageKey) {
          this.errorMessage = this.translate.instant(this.errorMessageKey);
        }
      });
  }

  async ngOnInit(): Promise<void> {
    this.initializeTableConfig();
    await this.loadProjects();

    this.searchControl.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(value => this.applyFilter(value));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeTableConfig(): void {
    this.tableColumns = [
      { key: 'name', label: this.translate.instant('pages.projects.table.name') },
      { key: 'clientLabel', label: this.translate.instant('pages.projects.table.client') },
      { key: 'startDateLabel', label: this.translate.instant('pages.projects.table.start') },
      { key: 'endDateLabel', label: this.translate.instant('pages.projects.table.end') },
      { key: 'statusLabel', label: this.translate.instant('pages.projects.table.status') },
      { key: 'priceLabel', label: this.translate.instant('pages.projects.table.price') },
      { key: 'description', label: this.translate.instant('pages.projects.table.description') }
    ];

    this.tableActions = [
      {
        label: this.translate.instant('pages.projects.table.actions'),
        icon: 'delete',
        action: (project) => this.confirmDelete(project),
        disabled: (project) => this.isDeleting(project.id),
        ariaLabel: (project) => `Delete project ${project.name}`
      }
    ];
  }

  async reload(): Promise<void> {
    await this.loadProjects();
  }

  isDeleting(projectId: number): boolean {
    return this.deletingProjects.has(projectId);
  }

  isItemBusy = (project: ProjectListItem): boolean => {
    return this.isDeleting(project.id);
  };

  trackByProject = (_: number, project: ProjectListItem): number => project.id;

  getRowClass = (project: ProjectListItem): string => {
    return 'projects__row';
  };

  async openCreateDialog(): Promise<void> {
    const dialogRef = this.dialog.open(ProjectCreateDialogComponent, {
      disableClose: true,
      data: { mode: 'create', defaultStartDate: new Date() }
    });

    const result = await firstValueFrom(dialogRef.afterClosed());

    if (result?.created) {
      await this.loadProjects();
      this.snackBar.open(this.translate.instant('pages.projects.notifications.createSuccess'), undefined, { duration: 3000 });
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
      this.snackBar.open(this.translate.instant('pages.projects.notifications.updateSuccess'), undefined, { duration: 3000 });
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
      this.snackBar.open(this.translate.instant('pages.projects.notifications.deleteSuccess'), undefined, { duration: 3000 });
      await this.loadProjects();
    } catch (error) {
      const message = this.resolveError(error) ?? this.translate.instant('pages.projects.notifications.deleteError');
      this.snackBar.open(message, this.translate.instant('app.actions.ok'), { duration: 4000 });
    } finally {
      this.deletingProjects.delete(projectId);
    }
  }

  private async loadProjects(): Promise<void> {
    this.loading = true;
    this.clearErrorMessage();

    try {
      const [projects, clients] = await Promise.all([
        firstValueFrom(this.projectsService.getProjects()),
        firstValueFrom(this.projectsService.getClients())
      ]);

      this.clientsById = new Map(clients.map(client => [client.id, client.name]));
      this.projects = projects.map(project => this.toListItem(project, this.clientsById));
      this.filteredProjects = [...this.projects];
      this.applyFilter(this.searchControl.value);
    } catch (error) {
      console.error('Failed to load projects', error);
      const resolved = this.resolveError(error);
      if (resolved) {
        this.errorMessage = resolved;
      } else {
        this.setErrorMessage('pages.projects.errors.unexpected');
      }
      this.projects = [];
      this.filteredProjects = [];
    } finally {
      this.loading = false;
    }
  }

  private applyFilter(rawTerm: string): void {
    const term = rawTerm.trim().toLowerCase();

    if (!term) {
      this.filteredProjects = [...this.projects];
      return;
    }

    this.filteredProjects = this.projects.filter(project => {
      const haystack = [
        project.name,
        project.clientLabel,
        project.statusLabel,
        project.description
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }

  private toListItem(project: ProjectSummary, clientsById: Map<number, string>): ProjectListItem {
    return {
      id: project.id,
      name: project.name,
      clientLabel: clientsById.get(project.clientId) ?? this.translate.instant('pages.projects.fallback.client', { id: project.clientId }),
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
        return this.translate.instant('pages.projects.status.planned');
      case 'completed':
        return this.translate.instant('pages.projects.status.completed');
      default:
        return this.translate.instant('pages.projects.status.inProgress');
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

    return new Intl.DateTimeFormat(this.language.locale, { dateStyle: 'medium' }).format(date);
  }

  private resolveError(error: unknown): string | undefined {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        this.setErrorMessage('pages.projects.errors.unauthorized');
        return this.errorMessage;
      }

      if (error.status === 403) {
        this.setErrorMessage('pages.projects.errors.forbidden');
        return this.errorMessage;
      }

      return error.error?.message ?? error.message;
    }

    return undefined;
  }

  private formatPrice(value: number): string {
    if (value == null || Number.isNaN(value)) {
      return '—';
    }

    return new Intl.NumberFormat(this.language.locale, {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

    private setErrorMessage(key: string): void {
      this.errorMessageKey = key;
      this.errorMessage = this.translate.instant(key);
    }

    private clearErrorMessage(): void {
      this.errorMessageKey = undefined;
      this.errorMessage = undefined;
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
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, TranslateModule],
  template: `
    <h2 mat-dialog-title class="dialog__title">
      <mat-icon aria-hidden="true">delete</mat-icon>
      {{ 'pages.projects.dialog.deleteTitle' | translate }}
    </h2>

    <mat-dialog-content class="dialog__content">
      <p>
        {{ 'pages.projects.dialog.deleteQuestion' | translate:{ projectName: data.projectName } }}
      </p>
      <p class="dialog__warning">
        {{ 'pages.projects.dialog.deleteWarning' | translate }}
      </p>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog__actions">
      <button mat-stroked-button type="button" (click)="cancel()">
        {{ 'pages.projects.actions.cancel' | translate }}
      </button>
      <button mat-raised-button color="primary" type="button" class="dialog__confirm" (click)="confirm()">
        {{ 'pages.projects.actions.delete' | translate }}
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
