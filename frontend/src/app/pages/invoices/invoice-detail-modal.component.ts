import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InvoicesService } from './invoices.service';

@Component({
  selector: 'app-invoice-detail-modal',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule, ReactiveFormsModule],
  template: `
    <div class="invoice-modal">
      <header class="invoice-modal__header">
        <div class="invoice-modal__logo">Your Company Logo</div>
        <div class="invoice-modal__title">
          <h2>{{ invoiceForm.get('invoiceNumber')?.value || ('Invoice #' + data.invoice.id) }}</h2>
        </div>
      </header>

      <form [formGroup]="invoiceForm" class="invoice-modal__form">
        <section class="invoice-modal__details">
          <div class="invoice-modal__client">
            <h3>Client Information</h3>
            <p><strong>Name:</strong> {{ data.getClientName(invoiceForm.get('clientId')?.value) }}</p>
          </div>
          <div class="invoice-modal__info">
            <h3>Invoice Details</h3>
            <p>
              <strong>Status:</strong>
              <span *ngIf="!isEditMode" [class]="'status-badge status-' + getStatusClass(invoiceForm.get('status')?.value)">
                {{ getStatusLabel(invoiceForm.get('status')?.value) }}
              </span>
              <select *ngIf="isEditMode" formControlName="status" class="form-input">
                <option *ngFor="let status of statuses" [value]="status.value">{{ status.label }}</option>
              </select>
            </p>
            <p>
              <strong>Invoice Date:</strong>
              <span *ngIf="!isEditMode">{{ invoiceForm.get('invoiceDate')?.value | date: 'dd/MM/yyyy' }}</span>
              <input *ngIf="isEditMode" type="date" formControlName="invoiceDate" class="form-input" />
            </p>
            <p>
              <strong>Due Date:</strong>
              <span *ngIf="!isEditMode">{{ invoiceForm.get('dueDate')?.value | date: 'dd/MM/yyyy' }}</span>
              <input *ngIf="isEditMode" type="date" formControlName="dueDate" class="form-input" />
            </p>
          </div>
        </section>

        <section class="invoice-modal__items">
          <h3>Line Items</h3>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of invoiceForm.get('lineItems')?.value; let i = index">
                <td>
                  <span *ngIf="!isEditMode">{{ item.description }}</span>
                  <input *ngIf="isEditMode" type="text" [value]="item.description" 
                         (input)="updateLineItem(i, 'description', $event)" class="form-input" />
                </td>
                <td>
                  <span *ngIf="!isEditMode">{{ item.quantity }}</span>
                  <input *ngIf="isEditMode" type="number" [value]="item.quantity" 
                         (input)="updateLineItem(i, 'quantity', $event)" class="form-input form-input--number" />
                </td>
                <td>
                  <span *ngIf="!isEditMode">{{ item.unitPrice | currency: 'TRY':'symbol':'1.0-2' }}</span>
                  <input *ngIf="isEditMode" type="number" [value]="item.unitPrice" 
                         (input)="updateLineItem(i, 'unitPrice', $event)" class="form-input form-input--number" />
                </td>
                <td>{{ item.quantity * item.unitPrice | currency: 'TRY':'symbol':'1.0-2' }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="invoice-modal__summary">
          <h3>Summary</h3>
          <p><strong>Subtotal:</strong> {{ calculateSubTotal() | currency: 'TRY':'symbol':'1.0-2' }}</p>
          <p>
            <strong>Tax:</strong> 
            <span *ngIf="!isEditMode">{{ invoiceForm.get('tax')?.value | currency: 'TRY':'symbol':'1.0-2' }}</span>
            <input *ngIf="isEditMode" type="number" formControlName="tax" class="form-input form-input--number" />
          </p>
          <p><strong>Total:</strong> {{ calculateTotal() | currency: 'TRY':'symbol':'1.0-2' }}</p>
        </section>

        <mat-dialog-actions align="end">
          <button *ngIf="!isEditMode" mat-raised-button color="primary" (click)="toggleEditMode()">
            Edit
          </button>
          <button *ngIf="isEditMode" mat-raised-button color="primary" (click)="saveChanges()">
            Save
          </button>
          <button *ngIf="isEditMode" mat-stroked-button (click)="cancelEdit()">Cancel</button>
          <button mat-stroked-button mat-dialog-close>Close</button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [
    `
      .invoice-modal {
        font-family: Arial, sans-serif;
        color: #333;
        width: 100%;
        max-width: 1200px;
        min-width: 320px;
      }

      @media (max-width: 768px) {
        .invoice-modal {
          max-width: 100%;
          font-size: 0.9rem;
        }
      }

      .invoice-modal__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #ccc;
        padding-bottom: 1rem;
        margin-bottom: 1rem;
      }

      .invoice-modal__logo {
        font-size: 1.5rem;
        font-weight: bold;
        color: #2196F3;
      }

      .invoice-modal__title h1 {
        margin: 0;
        font-size: 1.75rem;
      }

      .invoice-modal__title h2 {
        margin: 0;
        font-size: 1.25rem;
        color: #555;
      }

      .invoice-modal__details {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1.5rem;
        gap: 2rem;
      }

      @media (max-width: 768px) {
        .invoice-modal__details {
          flex-direction: column;
          gap: 1rem;
        }
      }

      .invoice-modal__client,
      .invoice-modal__info {
        flex: 1;
      }

      .invoice-modal__details h3 {
        margin-top: 0;
        color: #2196F3;
        font-size: 1.1rem;
        margin-bottom: 0.75rem;
      }

      .invoice-modal__details p {
        margin: 0.5rem 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .invoice-modal__details strong {
        min-width: 100px;
        display: inline-block;
      }

      .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.875rem;
        font-weight: 500;
        text-transform: uppercase;
      }

      .status-draft {
        background-color: #e3f2fd;
        color: #1976d2;
      }

      .status-sent {
        background-color: #fff3e0;
        color: #f57c00;
      }

      .status-paid {
        background-color: #e8f5e9;
        color: #388e3c;
      }

      .status-overdue {
        background-color: #ffebee;
        color: #d32f2f;
      }

      .form-input {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.875rem;
        font-family: inherit;
        transition: border-color 0.3s, box-shadow 0.3s;
        background-color: #fff;
      }

      .form-input:focus {
        outline: none;
        border-color: #2196F3;
        box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
      }

      .form-input--number {
        width: 100px;
      }

      select.form-input {
        cursor: pointer;
        padding-right: 2rem;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.5rem center;
        appearance: none;
      }

      .invoice-modal__items h3 {
        color: #2196F3;
        font-size: 1.1rem;
        margin-bottom: 0.75rem;
      }

      .invoice-modal__items table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 1.5rem;
      }

      @media (max-width: 768px) {
        .invoice-modal__items table {
          font-size: 0.85rem;
        }

        .invoice-modal__items th,
        .invoice-modal__items td {
          padding: 0.5rem;
        }
      }

      @media (max-width: 480px) {
        .invoice-modal__items table {
          display: block;
          overflow-x: auto;
          white-space: nowrap;
        }
      }

      .invoice-modal__items th,
      .invoice-modal__items td {
        border: 1px solid #e0e0e0;
        padding: 0.75rem;
        text-align: left;
      }

      .invoice-modal__items th {
        background-color: #f5f5f5;
        font-weight: 600;
        color: #555;
      }

      .invoice-modal__items td {
        background-color: #fff;
      }

      .invoice-modal__items td input {
        width: 100%;
      }

      .invoice-modal__summary {
        text-align: right;
        padding: 1rem;
        background-color: #f9f9f9;
        border-radius: 4px;
        margin-bottom: 1rem;
      }

      .invoice-modal__summary h3 {
        color: #2196F3;
        font-size: 1.1rem;
        margin-top: 0;
        margin-bottom: 0.75rem;
      }

      .invoice-modal__summary p {
        margin: 0.5rem 0;
        font-size: 1rem;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 1rem;
      }

      .invoice-modal__summary strong {
        min-width: 100px;
      }

      .invoice-modal__summary p:last-child {
        font-size: 1.25rem;
        font-weight: bold;
        color: #2196F3;
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 2px solid #ddd;
      }

      mat-dialog-actions {
        padding: 1rem 0 0 0;
        margin: 0;
        border-top: 1px solid #e0e0e0;
      }

      mat-dialog-actions button {
        margin-left: 0.5rem;
      }

      @media (max-width: 768px) {
        .invoice-modal__header {
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
        }

        .invoice-modal__logo {
          font-size: 1.25rem;
        }

        .invoice-modal__title h1 {
          font-size: 1.5rem;
        }

        .invoice-modal__title h2 {
          font-size: 1.1rem;
        }

        mat-dialog-actions {
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        mat-dialog-actions button {
          margin-left: 0;
          flex: 1;
          min-width: 100px;
        }
      }
    `
  ]
})
export class InvoiceDetailModalComponent {
  invoiceForm: FormGroup;
  isEditMode = false;
  originalFormValue: any;
  
  statuses = [
    { value: 'Draft', label: 'Draft' },
    { value: 'Sent', label: 'Sent' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Overdue', label: 'Overdue' }
  ];

  constructor(
    public dialogRef: MatDialogRef<InvoiceDetailModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
  private invoicesService: InvoicesService
  ) {
    this.invoiceForm = this.fb.group({
      id: [data.invoice.id],
      invoiceNumber: [data.invoice.invoiceNumber],
      clientId: [data.invoice.clientId],
      invoiceDate: [this.formatDateForInput(data.invoice.invoiceDate)],
      dueDate: [this.formatDateForInput(data.invoice.dueDate)],
      status: [data.invoice.status],
      tax: [data.invoice.tax || 0],
      lineItems: [data.invoice.lineItems || []]
    });
    this.originalFormValue = { ...this.invoiceForm.value };
  }

  formatDateForInput(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  toggleEditMode(): void {
    this.isEditMode = true;
    this.originalFormValue = { ...this.invoiceForm.value };
  }

  getStatusLabel(statusValue: any): string {
    // Sayısal veya string değer olabilir, == ile karşılaştır
    const status = this.statuses.find(s => s.value == statusValue);
    return status ? status.label : String(statusValue || 'Draft');
  }

  getStatusClass(statusValue: any): string {
    const status = this.statuses.find(s => s.value == statusValue);
    return status ? status.value.toString().toLowerCase() : 'draft';
  }

  cancelEdit(): void {
    this.invoiceForm.patchValue(this.originalFormValue);
    this.isEditMode = false;
  }

  updateLineItem(index: number, field: string, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const value = field === 'description' ? inputElement?.value : parseFloat(inputElement?.value) || 0;
    const lineItems = [...(this.invoiceForm.get('lineItems')?.value || [])];
    if (lineItems[index]) {
      lineItems[index] = { ...lineItems[index], [field]: value };
      this.invoiceForm.get('lineItems')?.setValue(lineItems);
    }
  }

  calculateSubTotal(): number {
    const lineItems = this.invoiceForm.get('lineItems')?.value || [];
    if (!lineItems || lineItems.length === 0) return 0;
    return lineItems.reduce((sum: number, item: any) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0);
  }

  calculateTotal(): number {
    return this.calculateSubTotal() + (parseFloat(this.invoiceForm.get('tax')?.value) || 0);
  }

  saveChanges(): void {
    const updatedInvoice = {
      ...this.invoiceForm.value,
      invoiceDate: this.invoiceForm.value.invoiceDate,
      dueDate: this.invoiceForm.value.dueDate
    };
    this.invoicesService.updateInvoice(updatedInvoice).subscribe({
      next: () => {
        this.isEditMode = false;
        this.dialogRef.close({ edit: true, invoice: updatedInvoice });
      },
      error: (err) => {
        alert('Güncelleme başarısız: ' + (err?.error?.message || err.statusText));
      }
    });
  }
}