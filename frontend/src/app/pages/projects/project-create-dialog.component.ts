import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import { ProjectsService } from './projects.service';
import { ClientOption, CreateProjectRequest, ProjectSummary, UpdateProjectRequest } from './projects.types';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface DialogData {
  mode: 'create' | 'edit';
  defaultStartDate?: Date;
  project?: ProjectSummary;
}

@Component({
  selector: 'app-project-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon aria-hidden="true">{{ isEditMode ? 'edit' : 'add_circle' }}</mat-icon>
      {{ (isEditMode ? 'pages.projects.dialog.editTitle' : 'pages.projects.dialog.createTitle') | translate }}
    </h2>

    <form [formGroup]="form" (ngSubmit)="submit()" class="dialog__form" mat-dialog-content>
      <mat-form-field appearance="outline">
        <input
          matInput
          formControlName="projectName"
          [placeholder]="'pages.projects.form.projectNamePlaceholder' | translate"
        />
        <mat-error *ngIf="form.get('projectName')?.hasError('required')">
          {{ 'pages.projects.form.projectNameRequired' | translate }}
        </mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <textarea
          matInput
          formControlName="description"
          rows="3"
          [placeholder]="'pages.projects.form.descriptionPlaceholder' | translate"
        ></textarea>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>{{ 'pages.projects.form.price' | translate }}</mat-label>
        <input matInput type="number" formControlName="projectPrice" min="0" step="0.01" />
        <span matTextSuffix>₺</span>
        <mat-error *ngIf="form.get('projectPrice')?.hasError('required')">
          {{ 'pages.projects.form.priceRequired' | translate }}
        </mat-error>
        <mat-error *ngIf="form.get('projectPrice')?.hasError('min')">
          {{ 'pages.projects.form.priceMin' | translate }}
        </mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>{{ 'pages.projects.form.client' | translate }}</mat-label>
        <mat-select formControlName="clientId">
          <mat-option *ngFor="let client of clients" [value]="client.id">
            {{ client.name }}
          </mat-option>
        </mat-select>
        <mat-error *ngIf="form.get('clientId')?.hasError('required')">
          {{ 'pages.projects.form.clientRequired' | translate }}
        </mat-error>
      </mat-form-field>

      <div class="dialog__row">
        <mat-form-field appearance="outline">
          <mat-label>{{ 'pages.projects.form.startDate' | translate }}</mat-label>
          <input matInput [matDatepicker]="startPicker" formControlName="startDate" />
          <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
          <mat-datepicker #startPicker></mat-datepicker>
          <mat-error *ngIf="form.get('startDate')?.hasError('required')">
            {{ 'pages.projects.form.startDateRequired' | translate }}
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'pages.projects.form.endDate' | translate }}</mat-label>
          <input matInput [matDatepicker]="endPicker" formControlName="endDate" />
          <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
          <mat-datepicker #endPicker></mat-datepicker>
          <mat-error *ngIf="form.hasError('dateRange')">
            {{ 'pages.projects.form.dateRangeError' | translate }}
          </mat-error>
        </mat-form-field>
      </div>

      <div class="dialog__error" *ngIf="errorMessage">
        <mat-icon aria-hidden="true">error_outline</mat-icon>
        <span>{{ errorMessage }}</span>
      </div>

      <div mat-dialog-actions class="dialog__actions">
        <button mat-stroked-button type="button" (click)="close()" [disabled]="saving">
          {{ 'pages.projects.actions.cancel' | translate }}
        </button>
        <button mat-raised-button color="primary" type="submit" [disabled]="saving || form.invalid">
          <mat-progress-spinner
            *ngIf="saving"
            mode="indeterminate"
            diameter="18"
            strokeWidth="3"
          ></mat-progress-spinner>
          <span *ngIf="!saving">
            {{ (isEditMode ? 'pages.projects.dialog.submitUpdate' : 'pages.projects.dialog.submitCreate') | translate }}
          </span>
        </button>
      </div>
    </form>
  `,
  styles: [
    `
      :host {
        display: block;
        width: min(520px, calc(100vw - 3.6rem));
        max-width: 100%;
        box-sizing: border-box;
      }

      h2 {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin: 0 0 1rem;
        font-size: 1.35rem;
        font-weight: 700;
        color: var(--app-text);
      }

      h2 mat-icon {
        font-size: 1.45rem;
        color: var(--primary);
      }

      form.dialog__form {
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
        margin-top: 0.5rem;
        color: var(--app-text);
      }

      .dialog__row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }

      .dialog__actions {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.75rem;
        padding-top: 0.5rem;
      }

      .dialog__error {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 0.9rem;
        border-radius: 0.75rem;
        background: color-mix(in srgb, var(--field-error-border) 15%, transparent);
        border: 1px solid color-mix(in srgb, var(--field-error-border) 45%, transparent);
        color: var(--field-error-text);
        font-weight: 600;
      }

      mat-progress-spinner {
        margin-right: 0.6rem;
      }
    `
  ]
})
export class ProjectCreateDialogComponent {
  form: FormGroup;
  clients: ClientOption[] = [];
  saving = false;
  errorMessage?: string;
  private readonly mode: 'create' | 'edit';

  constructor(
    private readonly dialogRef: MatDialogRef<ProjectCreateDialogComponent>,
    private readonly projectsService: ProjectsService,
    private readonly fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) private readonly data: DialogData,
    private readonly translate: TranslateService
  ) {
    this.mode = data?.mode ?? 'create';
    const project = data?.project;

    this.form = this.fb.group(
      {
        projectName: [project?.name ?? '', Validators.required],
        description: [project?.description ?? ''],
        clientId: [project?.clientId ?? null, Validators.required],
        startDate: [project?.startDate ?? data?.defaultStartDate ?? new Date(), Validators.required],
        endDate: [project?.endDate ?? null],
        projectPrice: [project?.projectPrice ?? null, [Validators.required, Validators.min(0)]]
      },
      { validators: [this.validateDateRange] }
    );

    void this.loadClients();
  }

  get isEditMode(): boolean {
    return this.mode === 'edit';
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.saving) {
      return;
    }

    this.saving = true;
    this.errorMessage = undefined;

    try {
      if (this.isEditMode && this.data.project) {
        const request = this.buildUpdateRequest(this.data.project.id);
        await firstValueFrom(this.projectsService.updateProject(request));
        this.dialogRef.close({ updated: true });
      } else {
    const request = this.buildCreateRequest();
        await firstValueFrom(this.projectsService.createProject(request));
        this.dialogRef.close({ created: true });
      }
    } catch (error) {
      console.error('Failed to save project', error);
      this.errorMessage = (error as Error)?.message ?? this.translate.instant('pages.projects.errors.save');
    } finally {
      this.saving = false;
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  private async loadClients(): Promise<void> {
    try {
      this.clients = await firstValueFrom(this.projectsService.getClients());
      if (!this.form.get('clientId')?.value && this.clients.length > 0) {
        this.form.patchValue({ clientId: this.clients[0].id });
      }
    } catch (error) {
      console.error('Failed to load clients', error);
      this.errorMessage = this.translate.instant('pages.projects.errors.clients');
    }
  }

  private buildCreateRequest(): CreateProjectRequest {
    const { projectName, description, clientId, startDate, endDate, projectPrice } = this.form.value;
    return {
      projectName,
      description,
      clientId,
      startDate: this.toIsoDate(startDate),
      endDate: endDate ? this.toIsoDate(endDate) : null,
      projectPrice: Number(projectPrice)
    };
  }

  private buildUpdateRequest(projectId: number): UpdateProjectRequest {
    const base = this.buildCreateRequest();
    return {
      ...base,
      projectId
    };
  }

  private toIsoDate(value: Date): string {
    const date = new Date(value);
    const offsetMinutes = date.getTimezoneOffset();
    const localTime = new Date(date.getTime() - offsetMinutes * 60_000);
    return localTime.toISOString().slice(0, 19);
  }

  private validateDateRange(group: FormGroup) {
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;

    if (start && end && new Date(end) < new Date(start)) {
      return { dateRange: true };
    }

    return null;
  }
}
