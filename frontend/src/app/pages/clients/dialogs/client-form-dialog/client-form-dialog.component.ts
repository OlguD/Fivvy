import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ClientsService } from '../../clients.service';
import { ClientDto, ClientPayload } from '../../clients.types';

export type ClientFormDialogMode = 'create' | 'edit';

export interface ClientFormDialogData {
  mode: ClientFormDialogMode;
  client?: ClientDto;
}

export interface ClientFormDialogResult {
  success: boolean;
  mode: ClientFormDialogMode;
}

@Component({
  selector: 'app-client-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
  MatInputModule,
  MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './client-form-dialog.component.html',
  styleUrls: ['./client-form-dialog.component.css']
})
export class ClientFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly clientsService = inject(ClientsService);
  private readonly dialogRef = inject(MatDialogRef<ClientFormDialogComponent, ClientFormDialogResult>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly injectedData =
    inject<ClientFormDialogData | null>(MAT_DIALOG_DATA, { optional: true }) ?? ({ mode: 'create' } as ClientFormDialogData);

  readonly mode: ClientFormDialogMode = this.injectedData.mode;
  readonly title = this.mode === 'create' ? 'Add new client' : 'Update client details';
  readonly actionLabel = this.mode === 'create' ? 'Create client' : 'Save changes';
  readonly client = this.injectedData.client ?? null;
  readonly form = this.fb.nonNullable.group({
    companyName: ['', [Validators.required, Validators.maxLength(150)]],
    contactName: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.email, Validators.maxLength(160)]],
    phone: ['', [Validators.maxLength(60)]],
    address: ['', [Validators.maxLength(250)]]
  });

  private readonly clientId?: number = this.injectedData.client?.id;

  isSubmitting = false;

  constructor() {
    if (this.injectedData.client) {
      this.form.patchValue({
        companyName: this.injectedData.client.companyName ?? '',
        contactName: this.injectedData.client.contactName ?? '',
        email: this.injectedData.client.email ?? '',
        phone: this.injectedData.client.phone ?? '',
        address: this.injectedData.client.address ?? ''
      });
    }
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      return;
    }

    const payload = this.mapToPayload();
    this.isSubmitting = true;

    const request$ = this.mode === 'edit' && this.clientId
      ? this.clientsService.updateClient(this.clientId, payload)
      : this.clientsService.addClient(payload);

    request$
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => this.dialogRef.close({ success: true, mode: this.mode }),
        error: error => {
          const message = this.resolveErrorMessage(error);
          this.snackBar.open(message, 'Dismiss', { duration: 4000 });
        }
      });
  }

  cancel(): void {
    this.dialogRef.close({ success: false, mode: this.mode });
  }

  get companyNameInvalid(): boolean {
    const control = this.form.controls.companyName;
    return control.invalid && (control.dirty || control.touched);
  }

  get contactNameInvalid(): boolean {
    const control = this.form.controls.contactName;
    return control.invalid && (control.dirty || control.touched);
  }

  get emailInvalid(): boolean {
    const control = this.form.controls.email;
    return control.invalid && (control.dirty || control.touched);
  }

  private mapToPayload(): ClientPayload {
    const value = this.form.getRawValue();

    return {
      CompanyName: value.companyName.trim(),
      ContactName: value.contactName.trim(),
      Email: value.email?.trim() || undefined,
      Phone: value.phone?.trim() || undefined,
      Address: value.address?.trim() || undefined
    };
  }

  private resolveErrorMessage(error: unknown): string {
    if (!error) {
      return 'Unable to save client. Please try again.';
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof HttpErrorResponse) {
      const payload = error.error;
      if (typeof payload === 'string' && payload.trim().length > 0) {
        return payload;
      }
      if (payload && typeof payload === 'object' && 'message' in payload) {
        const message = String((payload as { message?: unknown }).message ?? '').trim();
        if (message) {
          return message;
        }
      }
    }

    if (typeof (error as { message?: unknown }).message === 'string') {
      const message = ((error as { message?: unknown }).message as string).trim();
      if (message) {
        return message;
      }
    }

    return 'Unable to save client. Please try again.';
  }
}
