import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoicesService } from '../invoices/invoices.service';
import { InvoiceDto, InvoiceStatus } from '../invoices/invoices.types';
import { ClientsService } from '../clients/clients.service';
import { AuthService } from '../../core/auth.service';
import { ProjectsService } from '../projects/projects.service';
import { ProjectSummary } from '../projects/projects.types';
import { ClientPortalService, PortalDataDto, PortalInvoiceDto } from './client-portal.service';
import { normalizeInvoiceStatus } from '../invoices/invoices.types';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-client-portal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-portal.component.html',
  styleUrls: ['./client-portal.component.css']
})
export class ClientPortalComponent implements OnInit {
  invoices: InvoiceDto[] = [];
  projects: ProjectSummary[] = [];
  loading = false;
  error: string | null = null;
  selectedInvoice: InvoiceDto | null = null;
  approvalsKey = 'fivvy.clientPortal.approvedInvoices';
  approvedInvoiceIds = new Set<number>();
  miniPortalLink: string | null = null;
  token: string | null = null;
  clientInfo: any | null = null;
  downloadBusy = false;
  approveBusy = false;
  private inferredClientId?: number;

  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly clientsService: ClientsService,
    private readonly authService: AuthService
    ,
    private readonly projectsService: ProjectsService
    ,
    private readonly portalService: ClientPortalService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    // initialize approval cache
    this.loadApprovalsFromStorage();

    // Watch for route changes. If clientId param exists we operate in portal mode.
    this.route.paramMap.subscribe(pm => {
      const cid = pm.get('clientId');
      if (cid) {
        const clientId = Number(cid);
        // Watch for token in query params. Only update in-memory token when provided.
        this.route.queryParamMap.subscribe(qm => {
          const tokenParam = qm.get('token');
          if (tokenParam) {
            this.token = tokenParam;
            this.loadPortalData(clientId, this.token);
            // remove token from url for security (replaceUrl avoids extra history entry)
            this.router.navigate([], { queryParams: { token: null }, queryParamsHandling: 'merge', replaceUrl: true });
          } else if (this.token) {
            // already have token in memory from earlier navigation
            this.loadPortalData(clientId, this.token);
          }
        });
        this.inferredClientId = clientId;
        // Don't call authenticated project list when in portal mode — portal data provides projects
      } else {
        // No explicit clientId in route. Try to infer clientId from JWT (if available)
        const inferred = this.getClientIdFromAuthToken();
        if (inferred) {
          this.inferredClientId = inferred;
          // Best-effort: fetch invoices and projects for the inferred client id
          this.invoicesService.getInvoices().subscribe({
            next: (data) => {
              this.invoices = data.filter(i => i.clientId === inferred);
              this.buildMiniPortalLink(inferred);
              this.loading = false;
            },
            error: (err) => {
              console.error(err);
              this.error = 'Fatura yüklenirken bir hata oluştu.';
              this.loading = false;
            }
          });
          this.loadProjectsForClient();
        } else {
          // fallback: load all invoices (admin/support view)
          this.invoicesService.getInvoices().subscribe({
            next: (data) => {
              this.invoices = data;
              this.loading = false;
            }
            ,
            error: (err) => {
              console.error(err);
              this.error = 'Fatura yüklenirken bir hata oluştu.';

              this.loading = false;
            }
          });
        }
      }
    });
  }
  private loadProjectsForClient(): void {
    // similar approach: fetch all projects then filter by clientId
    let clientId: number | undefined;
    try {
      const token = this.authService.getToken?.();
      if (token) {
        const parts = token.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          clientId = (payload?.clientId ?? payload?.ClientId ?? payload?.clientID) as number | undefined;
        }
      }
    } catch {}

    this.projectsService.getProjects().subscribe({
      next: (data) => {
        if (clientId) {
          this.projects = data.filter(p => p.clientId === clientId);
        } else {
          this.projects = data;
        }
      },
      error: (err) => console.error('Projects load failed', err)
    });
  }

  private loadApprovalsFromStorage(): void {
    const raw = localStorage.getItem(this.approvalsKey);
    if (!raw) return;
    try {
      const arr = JSON.parse(raw) as number[];
      arr.forEach(id => this.approvedInvoiceIds.add(id));
    } catch {}
  }

  private saveApprovalsToStorage(): void {
    const arr = Array.from(this.approvedInvoiceIds);
    localStorage.setItem(this.approvalsKey, JSON.stringify(arr));
  }

  approveInvoice(invoice: InvoiceDto) {
    if (!invoice || !this.token) return;
    if (this.approveBusy) return;
    this.approveBusy = true;
    const clientId = invoice.clientId;
    this.portalService.approveInvoice(clientId, invoice.id, this.token).subscribe({
      next: () => {
        // Mark approved locally. We avoid reloading portal data with the same portal token
        // because the backend marks the token as used when performing approve operations;
        // a subsequent GetPortalDataAsync would then return Unauthorized. Update local
        // state so the UI reflects the approval immediately.
        this.approvedInvoiceIds.add(invoice.id);
        try {
          invoice.status = InvoiceStatus.Approved as any;
        } catch {}
        // If this invoice is linked to a project, reflect activation in UI
        try {
          // find matching project and mark active
          const proj = this.projects.find(p => p.id === (invoice as any).projectId);
          if (proj) {
            proj.isActive = true;
          }
        } catch {}
        this.saveApprovalsToStorage();
        this.approveBusy = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Onay işlemi başarısız.';
        this.approveBusy = false;
      }
    });
  }

  isApproved(invoice: InvoiceDto): boolean {
    // Consider server-side status authoritative; local cache is a fallback for recently-approved UI state
    try {
      if (invoice && invoice.status === InvoiceStatus.Approved) return true;
    } catch {}
    return this.approvedInvoiceIds.has(invoice.id);
  }

  private buildMiniPortalLink(clientId?: number) {
    // If we have a clientId, create a short link to open the portal in client-mode.
    // We'll just provide a direct route with a query param `clientId` (read-only) — usage is informational.
    if (!clientId) {
      // attempt to read from token one more time
      try {
        const token = this.authService.getToken?.();
        if (token) {
          const parts = token.split('.');
          if (parts.length >= 2) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            clientId = (payload?.clientId ?? payload?.ClientId ?? payload?.clientID) as number | undefined;
          }
        }
      } catch {}
    }

    if (clientId) {
      const base = window.location.origin || '';
      this.miniPortalLink = `${base}/client/${clientId}/portal`;
    }
  }

  private loadPortalData(clientId: number, token: string | null) {
    if (!token) {
      this.error = 'Token gerekli.';
      return;
    }
    // Clear any previous errors before loading
    this.error = null;
    this.loading = true;
    this.portalService.getPortalData(clientId, token).subscribe({
      next: (data: PortalDataDto) => {
        // clear any lingering errors now that data arrived
        this.error = null;
        this.clientInfo = data.client;
        // map projects into ProjectSummary minimal shape
        this.projects = data.projects.map(p => ({ id: p.id, name: p.projectName, description: '', startDate: new Date(), endDate: null, clientId, isActive: p.isActive, progress: 0, durationDays: undefined, projectPrice: p.projectPrice } as ProjectSummary));
        // map invoices into existing InvoiceDto shape used in component
        this.invoices = data.invoices.map(i => ({ id: i.id, invoiceNumber: i.invoiceNumber, clientId, invoiceDate: i.invoiceDate, dueDate: i.dueDate, status: normalizeInvoiceStatus(i.status) as any, subTotal: 0, tax: 0, total: i.total, notes: '', lineItems: [] } as InvoiceDto));

        // Sync local approvals cache with server state: remove any locally-stored approvals
        // for invoices that the server still reports as unapproved. Server-side status is
        // authoritative.
        const serverApprovedIds = new Set<number>(this.invoices.filter(inv => inv.status === InvoiceStatus.Approved).map(inv => inv.id));
        // Keep only ids that are approved on server
        this.approvedInvoiceIds = new Set<number>([...this.approvedInvoiceIds].filter(id => serverApprovedIds.has(id)));
        // Also ensure any server-approved ids are present in the cache (so UI updates immediately)
        serverApprovedIds.forEach(id => this.approvedInvoiceIds.add(id));
        this.saveApprovalsToStorage();

        this.loading = false;
        this.buildMiniPortalLink(clientId);
        // remove token from url for security
        this.router.navigate([], { queryParams: { token: null }, queryParamsHandling: 'merge', replaceUrl: true });
      },
      error: err => {
        console.error(err);
        this.error = 'Portal verisi alınamadı. Token geçersiz veya süresi dolmuş olabilir.';
        this.loading = false;
      }
    });
  }

  copyLink(): void {
    if (!this.miniPortalLink) return;
    try {
      navigator.clipboard.writeText(this.miniPortalLink);
      // small feedback placeholder; host app could show a toast
      console.log('Mini portal link copied');
    } catch (e) {
      console.warn('Clipboard write failed', e);
    }
  }

  openInvoice(invoice: InvoiceDto) {
    this.selectedInvoice = invoice;
  }

  closeInvoice() {
    this.selectedInvoice = null;
  }

  downloadPdf(invoice: InvoiceDto | null) {
    if (!invoice) {
      return;
    }
    if (this.downloadBusy) return;
    this.downloadBusy = true;
    // Prefer portal download when we have a portal token available for the client
    if (this.token) {
      this.portalService.downloadInvoicePdf(invoice.clientId, invoice.id, this.token).subscribe({
        next: (blob: any) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = invoice.invoiceNumber ? `${invoice.invoiceNumber}.pdf` : `invoice-${invoice.id}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
          this.downloadBusy = false;
        },
        error: (err) => {
          console.error(err);
          this.error = 'PDF indirilemedi.';
          this.downloadBusy = false;
        }
      });
      return;
    }

    // Fallback to authenticated download
    this.invoicesService.downloadInvoicePdf(invoice.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = invoice.invoiceNumber ? `${invoice.invoiceNumber}.pdf` : `invoice-${invoice.id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.downloadBusy = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'PDF indirilemedi.';
        this.downloadBusy = false;
      }
    });
  }

  statusLabel(status: any): string {
    // status may be enum or string - try to show user friendly label
    if (!status) return 'Onaylanmadı';
    if (typeof status === 'string') {
      const s = status.toLowerCase();
      if (s === 'approved' || s === 'paid') return 'Onaylandı';
      return 'Onaylanmadı';
    }
    // fallback to numeric mapping handled by normalizeInvoiceStatus in mapping
    return String(status);
  }

  private getClientIdFromAuthToken(): number | undefined {
    try {
      const token = this.authService.getToken?.();
      if (token) {
        const parts = token.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          return (payload?.clientId ?? payload?.ClientId ?? payload?.clientID) as number | undefined;
        }
      }
    } catch {}
    return undefined;
  }
}
