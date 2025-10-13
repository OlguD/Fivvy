import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BoardPreferences, ProjectStatus } from './projects.types';

interface DialogData {
  preferences: BoardPreferences;
}

@Component({
  selector: 'app-pipeline-customize-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatCheckboxModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon aria-hidden="true">dashboard_customize</mat-icon>
      Panoyu özelleştir
    </h2>

    <div mat-dialog-content class="dialog">
      <p>Hangi proje aşamalarının panoda görüneceğini seçin.</p>

      <ul class="dialog__list">
        <li *ngFor="let option of options">
          <mat-checkbox
            [checked]="preferences.visibleStatuses[option.key]"
            (change)="toggle(option.key, $event)"
          >
            <span class="dialog__label">{{ option.label }}</span>
            <small>{{ option.description }}</small>
          </mat-checkbox>
        </li>
      </ul>

      <p class="dialog__hint" *ngIf="!hasAnySelected">En az bir aşama seçmelisiniz.</p>
    </div>

    <div mat-dialog-actions class="dialog__actions">
      <button mat-stroked-button type="button" (click)="close(false)">
        İptal
      </button>
      <button mat-raised-button color="primary" type="button" (click)="save()" [disabled]="!hasAnySelected">
        Kaydet
      </button>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: min(420px, calc(100vw - 3.6rem));
        max-width: 100%;
        box-sizing: border-box;
      }

      h2 {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin: 0 0 1rem;
        font-weight: 700;
        color: var(--app-text);
      }

      h2 mat-icon {
        font-size: 1.4rem;
        color: var(--primary);
      }

      .dialog {
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
        color: var(--app-text);
      }

      .dialog__list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      mat-checkbox {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.2rem;
        padding: 0.6rem 0.75rem;
        border-radius: 0.75rem;
        width: 100%;
        transition: background-color 0.2s ease;
      }

      mat-checkbox:hover {
        background: rgba(37, 99, 235, 0.12);
      }

      [data-theme='dark'] mat-checkbox:hover {
        background: rgba(96, 165, 250, 0.18);
      }

      .dialog__label {
        font-weight: 600;
        color: var(--app-text);
      }

      small {
        color: rgba(15, 23, 42, 0.65);
      }

      [data-theme='dark'] small {
        color: rgba(226, 232, 240, 0.72);
      }

      .dialog__hint {
        color: var(--field-error-text);
        font-weight: 600;
      }

      .dialog__actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
      }
    `
  ]
})
export class PipelineCustomizeDialogComponent {
  preferences: BoardPreferences;

  readonly options: Array<{ key: ProjectStatus; label: string; description: string }> = [
    { key: 'planned', label: 'Planlanan', description: 'Başlangıç tarihi yaklaşan projeler' },
    { key: 'active', label: 'Devam eden', description: 'Şu anda yürütülen projeler' },
    { key: 'completed', label: 'Tamamlanan', description: 'Kapanış raporu bekleyen projeler' }
  ];

  constructor(
    private readonly dialogRef: MatDialogRef<PipelineCustomizeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: DialogData
  ) {
    this.preferences = {
      visibleStatuses: { ...data.preferences.visibleStatuses }
    };
  }

  get hasAnySelected(): boolean {
    return Object.values(this.preferences.visibleStatuses).some(Boolean);
  }

  toggle(status: ProjectStatus, event: MatCheckboxChange): void {
    this.preferences.visibleStatuses[status] = event.checked;
  }

  save(): void {
    if (!this.hasAnySelected) {
      return;
    }

    this.dialogRef.close(this.preferences);
  }

  close(result: boolean): void {
    this.dialogRef.close(result ? this.preferences : undefined);
  }
}
