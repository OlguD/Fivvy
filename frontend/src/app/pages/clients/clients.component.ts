import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, debounceTime, distinctUntilChanged, filter, finalize, switchMap, takeUntil } from 'rxjs';
import { ClientsService } from './clients.service';
import { ClientDto } from './clients.types';
import {
  ClientFormDialogComponent,
  ClientFormDialogData,
  ClientFormDialogResult
} from './dialogs/client-form-dialog/client-form-dialog.component';
import { ClientRemoveDialogComponent } from './dialogs/client-remove-dialog/client-remove-dialog.component';
import { DataTableComponent, DataTableColumn, DataTableAction } from '../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  DataTableComponent,
  TranslateModule
  ],
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css']
})
export class ClientsComponent implements OnInit, OnDestroy {
  readonly searchControl = new FormControl('', { nonNullable: true });

  clients: ClientDto[] = [];
  filteredClients: ClientDto[] = [];

  isLoading = false;
  error: string | null = null;

  tableColumns: DataTableColumn<ClientDto>[] = [];
  tableActions: DataTableAction<ClientDto>[] = [];

  private readonly destroy$ = new Subject<void>();
  private readonly busyClients = new Set<number>();

  constructor(
    private readonly clientsService: ClientsService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    public readonly translate: TranslateService
  ) {
    this.setTranslatedTableColumnsAndActions();
    this.translate.onLangChange.subscribe(() => this.setTranslatedTableColumnsAndActions());
  }

  private setTranslatedTableColumnsAndActions() {
    this.tableColumns = [
      { key: 'id', label: this.translate.instant('pages.clients.table.id') },
      { key: 'companyName', label: this.translate.instant('pages.clients.table.company') },
      { key: 'contactName', label: this.translate.instant('pages.clients.table.contact') },
      { key: 'email', label: this.translate.instant('pages.clients.table.email') },
      { key: 'phone', label: this.translate.instant('pages.clients.table.phone') },
      { key: 'createdAt', label: this.translate.instant('pages.clients.table.createdAt'), type: 'date' }
    ];
    this.tableActions = [
      {
        label: this.translate.instant('pages.clients.actions.remove'),
        icon: 'delete',
        action: (client) => this.confirmRemove(client),
        disabled: (client) => this.isClientBusy(client.id),
        ariaLabel: (client) => `${this.translate.instant('pages.clients.actions.remove')} ${client.companyName}`
      }
    ];
  }

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(value => this.applyFilter(value));

    this.loadClients();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByClient = (_: number, client: ClientDto) => client.id;

  isClientBusy(clientId: number): boolean {
    return this.busyClients.has(clientId);
  }

  isItemBusy = (client: ClientDto): boolean => {
    return this.isClientBusy(client.id);
  };

  getRowClass = (client: ClientDto): string => {
    return 'clients__row';
  };

  onRowClick(client: ClientDto): void {
    // Row click handling can be added here if needed
    // For now, clients don't have row click functionality
  }

  reload(): void {
    this.loadClients();
  }

  openCreateDialog(): void {
    const data: ClientFormDialogData = { mode: 'create' };

    this.dialog
      .open<ClientFormDialogComponent, ClientFormDialogData, ClientFormDialogResult>(ClientFormDialogComponent, {
        width: '540px',
        data
      })
      .afterClosed()
      .pipe(filter(result => !!result?.success))
      .subscribe(() => {
        this.snackBar.open('Client created successfully', 'Dismiss', { duration: 3000 });
        this.loadClients();
      });
  }

  openEditDialog(client: ClientDto): void {
    const data: ClientFormDialogData = { mode: 'edit', client };

    this.dialog
      .open<ClientFormDialogComponent, ClientFormDialogData, ClientFormDialogResult>(ClientFormDialogComponent, {
        width: '540px',
        data
      })
      .afterClosed()
      .pipe(filter(result => !!result?.success))
      .subscribe(() => {
        this.snackBar.open('Client updated', 'Dismiss', { duration: 3000 });
        this.loadClients();
      });
  }

  confirmRemove(client: ClientDto): void {
    this.dialog
      .open<ClientRemoveDialogComponent, { client: ClientDto }, boolean>(ClientRemoveDialogComponent, {
        width: '420px',
        data: { client }
      })
      .afterClosed()
      .pipe(
        filter(confirmed => !!confirmed),
        switchMap(() => {
          this.busyClients.add(client.id);
          return this.clientsService.removeClient(client.id).pipe(
            finalize(() => this.busyClients.delete(client.id))
          );
        })
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Client removed', 'Dismiss', { duration: 3000 });
          this.loadClients();
        },
        error: error => {
          const message = this.extractErrorMessage(error);
          this.snackBar.open(message, 'Dismiss', { duration: 4000 });
        }
      });
  }

  private loadClients(): void {
    this.isLoading = true;
    this.error = null;

    this.clientsService
      .getClients()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: clients => {
          this.clients = clients;
          this.filteredClients = [...clients];
          this.applyFilter(this.searchControl.value);
          this.isLoading = false;
        },
        error: error => {
          this.error = this.extractErrorMessage(error);
          this.isLoading = false;
        }
      });
  }

  private applyFilter(rawTerm: string): void {
    const term = rawTerm.trim().toLowerCase();

    if (!term) {
      this.filteredClients = [...this.clients];
      return;
    }

    this.filteredClients = this.clients.filter(client => {
      const haystack = [
  client.companyName,
  client.contactName,
  client.email,
  client.phone ?? ''
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }

  private extractErrorMessage(error: unknown): string {
    if (!error) {
      return 'Something went wrong. Please try again.';
    }

    if (typeof error === 'string') {
      return error;
    }

    if (typeof (error as { message?: unknown }).message === 'string') {
      const message = ((error as { message?: unknown }).message as string).trim();
      if (message) {
        return message;
      }
    }

    const response = (error as { error?: unknown }).error;
    if (typeof response === 'string' && response.trim().length > 0) {
      return response;
    }

    if (response && typeof response === 'object' && 'message' in response) {
      const message = String((response as { message?: unknown }).message ?? '').trim();
      if (message) {
        return message;
      }
    }

    return 'Something went wrong. Please try again.';
  }
}
