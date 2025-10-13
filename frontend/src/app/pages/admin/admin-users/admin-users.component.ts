import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/auth.service';
import { API_BASE_URL } from '../../../core/api.config';

interface AdminSummaryStat {
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down' | 'steady';
}

interface AdminUserRecord {
  id: number;
  fullName: string;
  email: string;
  username: string;
  role: string;
  clientCount: number;
  createdAt: string;
  isTopPerformer: boolean;
}

interface AdminFilterOption {
  key: 'all' | 'admin' | 'member';
  label: string;
}

interface AdminDashboardResponse {
  generatedAt: string;
  totalUsers: number;
  newUsersLast30Days: number;
  roleDistribution: Array<{ role: string; count: number }>;
  topUsersByClient: Array<{ userId: number; fullName: string | null; email: string; clientCount: number }>;
  entityTotals: { clients: number; projects: number; invoices: number };
  users: Array<{
    userId: number;
    fullName: string;
    username: string;
    email: string;
    role: string;
    clientCount: number;
    createdAt: string;
  }>;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatChipsModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly summaryStats = signal<AdminSummaryStat[]>([]);
  readonly filters: AdminFilterOption[] = [
    { key: 'all', label: 'Tümü' },
    { key: 'admin', label: 'Yöneticiler' },
    { key: 'member', label: 'Standart kullanıcılar' }
  ];

  private readonly users = signal<AdminUserRecord[]>([]);
  readonly selectedFilter = signal<AdminFilterOption['key']>('all');
  readonly searchTerm = signal('');
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  readonly filteredUsers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const filter = this.selectedFilter();

    return this.users().filter(user => {
      const matchesTerm =
        !term ||
        user.fullName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term);

      if (!matchesTerm) {
        return false;
      }

      switch (filter) {
        case 'admin':
          return user.role.toLowerCase() === 'admin';
        case 'member':
          return user.role.toLowerCase() !== 'admin';
        default:
          return true;
      }
    });
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  setFilter(filter: AdminFilterOption['key']): void {
    this.selectedFilter.set(filter);
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  getInitials(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    const first = parts[0]?.charAt(0) ?? '';
    const second = parts[1]?.charAt(0) ?? '';
    return `${first}${second}`.toUpperCase();
  }

  private loadDashboard(): void {
    const token = this.authService.getToken();

    if (!token) {
      this.error.set('Yönetici verilerine erişebilmek için oturum açmanız gerekiyor.');
      this.isLoading.set(false);
      return;
    }

    this.http
      .get<AdminDashboardResponse>(`${API_BASE_URL}/admin/get-user-stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Token: token
        }
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.error.set(null);
          this.applyDashboardResponse(response);
          this.isLoading.set(false);
        },
        error: err => {
          const message = err?.error ?? err?.message ?? 'Admin verileri alınırken bir sorun oluştu.';
          this.error.set(typeof message === 'string' ? message : 'Admin verileri alınırken bir sorun oluştu.');
          this.isLoading.set(false);
        }
      });
  }

  private applyDashboardResponse(response: AdminDashboardResponse): void {
    const formatter = Intl.NumberFormat('tr-TR');
    const totalUsers = response.totalUsers;
    const newUsers = response.newUsersLast30Days;

    const adminCount = response.roleDistribution
      .filter(role => role.role)
      .find(role => role.role.toLowerCase() == 'admin')?.count ?? 0;
    const standardUsers = Math.max(totalUsers - adminCount, 0);

    const topPerformer = response.topUsersByClient.at(0);

    const summary: AdminSummaryStat[] = [
      {
        label: 'Toplam kullanıcı',
        value: formatter.format(totalUsers),
        delta: newUsers > 0 ? `Son 30 günde +${formatter.format(newUsers)}` : 'Son 30 günde yeni kayıt yok',
        trend: newUsers > 0 ? 'up' : 'steady'
      },
      {
        label: 'Yönetici sayısı',
        value: formatter.format(adminCount),
        delta: `Standart kullanıcılar: ${formatter.format(standardUsers)}`,
        trend: adminCount > 0 ? 'up' : 'steady'
      },
      {
        label: 'Toplam müşteri',
        value: formatter.format(response.entityTotals.clients),
        delta: `Projeler: ${formatter.format(response.entityTotals.projects)}`,
        trend: response.entityTotals.clients > 0 ? 'up' : 'steady'
      },
      {
        label: 'Fatura adedi',
        value: formatter.format(response.entityTotals.invoices),
        delta: topPerformer
          ? `${topPerformer.fullName ?? 'Bilinmeyen'} · ${formatter.format(topPerformer.clientCount)} müşteri`
          : 'Henüz öne çıkan kullanıcı yok',
        trend: response.entityTotals.invoices > 0 ? 'up' : 'steady'
      }
    ];

    const topPerformerIds = new Set(response.topUsersByClient.map(user => user.userId));

    const mappedUsers: AdminUserRecord[] = response.users.map(user => ({
      id: user.userId,
      fullName: user.fullName ?? 'İsimsiz Kullanıcı',
      email: user.email,
      username: user.username,
      role: user.role,
      clientCount: user.clientCount,
      createdAt: user.createdAt,
      isTopPerformer: topPerformerIds.has(user.userId)
    }));

    this.summaryStats.set(summary);
    this.users.set(mappedUsers);
  }
}
