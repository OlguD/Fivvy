import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, Inject } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { forkJoin, Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ClientsService } from '../clients/clients.service';
import { ClientDto } from '../clients/clients.types';
import { InvoicesService } from './invoices.service';
import { InvoiceDto, InvoiceStatus, SaveInvoicePayload } from './invoices.types';
import { InvoiceDeleteDialogComponent, InvoiceDeleteDialogData, InvoiceDeleteDialogResult } from './invoice-delete-dialog.component';
import { InvoiceDetailModalComponent } from './invoice-detail-modal.component';
import { DataTableComponent, DataTableColumn, DataTableAction } from '../../shared/components/data-table/data-table.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  MatDialogModule,
  DataTableComponent,
  TranslateModule
  ],
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.css']
})
export class InvoicesComponent implements OnInit, OnDestroy {
  errorMessage?: string;

  openInvoiceModal(invoice: InvoiceDto): void {
    const dialogRef = this.dialog.open(InvoiceDetailModalComponent, {
      width: '90vw',
      maxWidth: '1200px',
      maxHeight: '90vh',
      data: {
        invoice,
        getClientName: (clientId: number) => this.getClientName(clientId),
        statusLabel: (status: InvoiceStatus) => this.statusLabel(status)
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.edit && result.invoice) {
        // Güncellenen invoice'ı invoices dizisinde bul ve değiştir
        const updated = result.invoice;
        // Eğer total alanı yoksa veya 0 ise, frontendde hesapla
        let total = updated.total;
        if (typeof total !== 'number' || isNaN(total) || total === 0) {
          const subTotal = (updated.lineItems || []).reduce((sum: number, item: any) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0);
          total = subTotal + (Number(updated.tax) || 0);
        }
        const idx = this.invoices.findIndex(inv => inv.id === updated.id);
        if (idx !== -1) {
          this.invoices[idx] = { ...this.invoices[idx], ...updated, total };
        }
        // Filtreyi tekrar uygula
        this.applyFilter(this.searchControl.value);
      }
    });
  }
  readonly searchControl = new FormControl('', { nonNullable: true });

  invoices: InvoiceDto[] = [];
  filteredInvoices: InvoiceDto[] = [];

  clients: ClientDto[] = [];
  private clientLookup = new Map<number, string>();

  selectedInvoice: InvoiceDto | null = null;

  isLoading = false;
  isSubmitting = false;
  error: string | null = null;
  isFormVisible = false;
  formMode: 'create' | 'edit' = 'create';

  readonly statuses = [
    { value: InvoiceStatus.Draft, label: 'Draft' },      // 'Draft'
    { value: InvoiceStatus.Sent, label: 'Sent' },        // 'Sent'
    { value: InvoiceStatus.Paid, label: 'Paid' },        // 'Paid'
    { value: InvoiceStatus.Overdue, label: 'Overdue' }   // 'Overdue'
  ];

  tableColumns: DataTableColumn<InvoiceDto>[] = [];
  tableActions: DataTableAction<InvoiceDto>[] = [];

  readonly invoiceForm: FormGroup;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly clientsService: ClientsService,
    private readonly fb: FormBuilder,
    private readonly snackBar: MatSnackBar,
    private readonly dialog: MatDialog,
    private readonly translate: TranslateService
  ) {
    this.invoiceForm = this.fb.group({
      id: this.fb.control<number | null>(null),
      invoiceNumber: this.fb.control<string>('', { validators: [Validators.maxLength(64)], nonNullable: true }),
      clientId: this.fb.control<number | null>(null, { validators: [Validators.required] }),
      invoiceDate: this.fb.control<string>('', { validators: [Validators.required], nonNullable: true }),
      dueDate: this.fb.control<string>('', { validators: [Validators.required], nonNullable: true }),
      status: this.fb.control<InvoiceStatus>(InvoiceStatus.Draft, { validators: [Validators.required], nonNullable: true }),
      tax: this.fb.control<number>(0, { validators: [Validators.min(0)], nonNullable: true }),
      notes: this.fb.control<string>('', { nonNullable: true }),
      lineItems: this.fb.array<FormGroup>([])
    });
  }

  private setErrorMessage(key: string): void {
    this.errorMessage = this.translate.instant(key);
  }

  private clearErrorMessage(): void {
    this.errorMessage = undefined;
  }

  ngOnInit(): void {
    this.initializeTableConfig();
    this.searchControl.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(value => this.applyFilter(value));

    if (this.lineItems.length === 0) {
      this.addLineItem();
    }

    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getStatusLabel(status: InvoiceStatus): string {
    // === yerine == kullan, sayısal değerler için
    const match = this.statuses.find(s => s.value == status);
    return match ? match.label : 'Unknown';
  }

  initializeTableConfig(): void {
    this.tableColumns = [
      { key: 'invoiceNumber', label: '#', format: (value, invoice) => value || ('#' + (invoice as InvoiceDto).id) },
      { key: 'clientId', label: 'Client', format: (value) => this.getClientName(value as number) },
      { key: 'status', label: 'Status', format: (value) => this.getStatusLabel(value as InvoiceStatus) },
      { key: 'invoiceDate', label: 'Invoice date', type: 'date' },
      { key: 'dueDate', label: 'Due date', type: 'date' },
      {
        key: 'total',
        label: 'Total',
        format: (value, invoice) => {
          if (!invoice) return '₺0,00';
          let total = value;
          if (typeof total !== 'number' || isNaN(total) || total === 0) {
            const subTotal = (invoice.lineItems || []).reduce((sum: number, item: any) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0);
            total = subTotal + (Number(invoice.tax) || 0);
          }
          return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(total);
        }
      }
    ];

    this.tableActions = [
      {
        label: 'Delete invoice',
        icon: 'delete',
        action: (invoice) => this.deleteInvoice(invoice),
        disabled: (invoice) => this.isSubmitting,
        ariaLabel: (invoice) => `Delete invoice ${invoice.invoiceNumber || '#' + invoice.id}`
      }
    ];
  }

  get lineItems(): FormArray<FormGroup> {
    return this.invoiceForm.get('lineItems') as FormArray<FormGroup>;
  }

  trackByInvoice = (_: number, invoice: InvoiceDto) => invoice.id;

  trackByLineItem = (index: number) => index;

  isInvoiceBusy = (invoice: InvoiceDto): boolean => this.isSubmitting;

  getRowClass = (invoice: InvoiceDto): string => {
    return '';
  };

  reload(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.error = null;

    forkJoin({
      clients: this.clientsService.getClients(),
      invoices: this.invoicesService.getInvoices()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ clients, invoices }) => {
          this.clients = clients;
          this.clientLookup = new Map(clients.map(client => [client.id, client.companyName]));

          this.invoices = invoices;
          this.filteredInvoices = [...invoices];
          this.applyFilter(this.searchControl.value);

          if (this.selectedInvoice) {
            const refreshed = invoices.find(invoice => invoice.id === this.selectedInvoice?.id);
            this.selectedInvoice = refreshed ?? null;
          }

          this.isLoading = false;
        },
        error: error => {
          this.error = this.extractErrorMessage(error);
          this.isLoading = false;
        }
      });
  }

  openCreateForm(): void {
    this.formMode = 'create';
    this.isFormVisible = true;
    this.isSubmitting = false;
    this.invoiceForm.reset({
      id: null,
      invoiceNumber: '',
      clientId: null,
      invoiceDate: '',
      dueDate: '',
      status: InvoiceStatus.Draft,
      tax: 0,
      notes: ''
    });
    this.clearLineItems();
    this.addLineItem();
  }

  openEditForm(invoice: InvoiceDto): void {
    this.formMode = 'edit';
    this.isFormVisible = true;
    this.isSubmitting = false;

    this.invoiceForm.patchValue({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber ?? '',
      clientId: invoice.clientId,
      invoiceDate: this.toDateInputValue(invoice.invoiceDate), // Ensure correct format
      dueDate: this.toDateInputValue(invoice.dueDate), // Ensure correct format
      status: invoice.status,
      tax: invoice.tax,
      notes: invoice.notes ?? ''
    });

    this.clearLineItems();
    if (invoice.lineItems?.length) {
      invoice.lineItems.forEach(item =>
        this.addLineItem({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })
      );
    } else {
      this.addLineItem();
    }
  }

  closeForm(): void {
    this.isFormVisible = false;
    this.invoiceForm.markAsPristine();
    this.invoiceForm.markAsUntouched();
  }

  addLineItem(item?: { id?: number; description?: string; quantity?: number; unitPrice?: number }): void {
    const group = this.fb.group({
      id: this.fb.control<number | null>(item?.id ?? null),
      description: this.fb.control<string>(item?.description ?? '', {
        validators: [Validators.required, Validators.maxLength(256)],
        nonNullable: true
      }),
      quantity: this.fb.control<number>(item?.quantity ?? 1, {
        validators: [Validators.required, Validators.min(0)],
        nonNullable: true
      }),
      unitPrice: this.fb.control<number>(item?.unitPrice ?? 0, {
        validators: [Validators.required, Validators.min(0)],
        nonNullable: true
      })
    });

    this.lineItems.push(group);
  }

  removeLineItem(index: number): void {
    if (this.lineItems.length <= 1) {
      this.lineItems.at(0).reset({ id: null, description: '', quantity: 1, unitPrice: 0 });
      return;
    }

    this.lineItems.removeAt(index);
  }

  getClientName(clientId: number): string {
    return this.clientLookup.get(clientId) ?? `Client #${clientId}`;
  }

  statusLabel(status: InvoiceStatus): string {
    // === yerine == kullan
    const match = this.statuses.find(s => s.value == status);
    return match ? match.label : 'Not Available';
  }

  saveInvoice(): void {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      return;
    }

    const value = this.invoiceForm.value;

    const lineItems = this.lineItems.controls.map(ctrl => {
      const lineValue = ctrl.value as { id: number | null; description: string; quantity: number; unitPrice: number };
      return {
        id: lineValue.id ?? undefined,
        description: lineValue.description.trim(),
        quantity: Number(lineValue.quantity),
        unitPrice: Number(lineValue.unitPrice)
      };
    });

    if (!lineItems.length || lineItems.some(item => !item.description)) {
      this.snackBar.open('Line items must include at least one description.', 'Dismiss', { duration: 4000 });
      return;
    }

    const invoiceDateIso = this.toIsoString(value.invoiceDate ?? '');
    const dueDateIso = this.toIsoString(value.dueDate ?? '');

    if (!invoiceDateIso || !dueDateIso) {
      this.snackBar.open('Invoice and due dates are required.', 'Dismiss', { duration: 4000 });
      return;
    }

    if (new Date(dueDateIso) < new Date(invoiceDateIso)) {
      this.snackBar.open('Due date cannot precede invoice date.', 'Dismiss', { duration: 4000 });
      return;
    }

    const subTotal = this.calculateSubTotal(lineItems);
    const tax = Number(value.tax ?? 0);
    const total = subTotal + tax;

    const payload: SaveInvoicePayload = {
      id: value.id ?? undefined,
      invoiceNumber: value.invoiceNumber?.trim() || undefined,
      clientId: Number(value.clientId),
      invoiceDate: invoiceDateIso,
      dueDate: dueDateIso,
      status: value.status ?? InvoiceStatus.Draft,
      subTotal,
      tax,
      total,
      notes: value.notes?.trim() || undefined,
      lineItems
    };

    const request$ = this.formMode === 'create'
      ? this.invoicesService.createInvoice(payload)
      : this.invoicesService.updateInvoice(payload);

    this.isSubmitting = true;

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        const message = this.formMode === 'create' ? 'Invoice created' : 'Invoice updated';
        this.snackBar.open(message, 'Dismiss', { duration: 3000 });
        this.closeForm();
        this.loadData();
        this.isSubmitting = false;
      },
      error: error => {
        this.isSubmitting = false;
        const message = this.extractErrorMessage(error);
        this.snackBar.open(message, 'Dismiss', { duration: 4000 });
      }
    });
  }

  deleteInvoice(invoice: InvoiceDto): void {
    const dialogRef = this.dialog.open(InvoiceDeleteDialogComponent, {
      width: '420px',
      data: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber || `#${invoice.id}`
      } as InvoiceDeleteDialogData
    });

    dialogRef.afterClosed().subscribe((result: InvoiceDeleteDialogResult | undefined) => {
      if (!result?.confirmed) {
        return;
      }

      this.isSubmitting = true;
      this.invoicesService
        .deleteInvoice(result.invoiceId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Invoice deleted', 'Dismiss', { duration: 3000 });
            if (this.selectedInvoice?.id === result.invoiceId) {
              this.selectedInvoice = null;
            }
            this.loadData();
            this.isSubmitting = false;
          },
          error: error => {
            this.isSubmitting = false;
            const message = this.extractErrorMessage(error);
            this.snackBar.open(message, 'Dismiss', { duration: 4000 });
          }
        });
    });
  }

  getLineItemTotal(group: FormGroup): number {
    const { quantity, unitPrice } = group.value as { quantity: number; unitPrice: number };
    return Number(quantity ?? 0) * Number(unitPrice ?? 0);
  }

  currentSubTotal(): number {
    return this.calculateSubTotal(
      this.lineItems.controls.map(ctrl => {
        const val = ctrl.value as { description: string; quantity: number; unitPrice: number };
        return {
          description: val.description,
          quantity: Number(val.quantity),
          unitPrice: Number(val.unitPrice)
        };
      })
    );
  }

  private calculateSubTotal(
    items: Array<{ description: string; quantity: number; unitPrice: number }>
  ): number {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }

  private applyFilter(rawTerm: string): void {
    const term = rawTerm?.trim().toLowerCase() ?? '';

    if (!term) {
      this.filteredInvoices = [...this.invoices];
      return;
    }

    this.filteredInvoices = this.invoices.filter(invoice => {
      const status = this.statusLabel(invoice.status).toLowerCase();
      const clientName = this.getClientName(invoice.clientId).toLowerCase();
      const number = invoice.invoiceNumber?.toLowerCase() ?? '';
      return [number, clientName, status].some(value => value.includes(term));
    });
  }

  private clearLineItems(): void {
    while (this.lineItems.length) {
      this.lineItems.removeAt(0);
    }
  }

  private toIsoString(value: string): string | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  private toDateInputValue(value: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // Ensure the format is yyyy-MM-dd
  }

  private extractErrorMessage(error: unknown): string {
    if (!error) {
      return 'Something went wrong. Please try again.';
    }

    if (typeof error === 'string') {
      return error;
    }

    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }

    const response = (error as { error?: unknown }).error;
    if (typeof response === 'string' && response.trim()) {
      return response.trim();
    }

    if (response && typeof response === 'object' && 'message' in response) {
      const nested = String((response as { message?: unknown }).message ?? '').trim();
      if (nested) {
        return nested;
      }
    }

    return 'Something went wrong. Please try again.';
  }
}
