import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface InvoiceDeleteDialogData {
  invoiceId: number;
  invoiceNumber: string;
}

export interface InvoiceDeleteDialogResult {
  confirmed: boolean;
  invoiceId: number;
}

@Component({
  selector: 'app-invoice-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="dialog__title">
      <mat-icon aria-hidden="true">delete</mat-icon>
      Delete Invoice
    </h2>
    <mat-dialog-content class="dialog__content">
      <p>
        Are you sure you want to delete invoice {{ data.invoiceNumber }}?
      </p>
      <p class="dialog__warning">
        This action cannot be undone.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="dialog__actions">
      <button mat-stroked-button type="button" (click)="cancel()">
        Cancel
      </button>
      <button mat-raised-button color="primary" type="button" class="dialog__confirm" (click)="confirm()">
        Delete
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
      }
      .dialog__warning {
        margin: 0;
        padding: 0.75rem 1rem;
        border-radius: 0.8rem;
        background: #ffeaea;
  border: 1px solid var(--divider);
        color: #d32f2f;
        font-weight: 600;
      }
      .dialog__actions {
        gap: 0.75rem;
      }
      .dialog__confirm {
        background: var(--btn-gradient, #d32f2f);
  color: var(--btn-text);
      }
    `
  ]
})
export class InvoiceDeleteDialogComponent {
  constructor(
    private readonly dialogRef: MatDialogRef<InvoiceDeleteDialogComponent, InvoiceDeleteDialogResult>,
    @Inject(MAT_DIALOG_DATA) public readonly data: InvoiceDeleteDialogData
  ) {}

  cancel(): void {
    this.dialogRef.close({ confirmed: false, invoiceId: this.data.invoiceId });
  }

  confirm(): void {
    this.dialogRef.close({ confirmed: true, invoiceId: this.data.invoiceId });
  }
}
