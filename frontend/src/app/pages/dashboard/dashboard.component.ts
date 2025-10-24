import { CommonModule } from '@angular/common';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { firstValueFrom } from 'rxjs';
import { DashboardService } from './dashboard.service';
import { ThemeService } from '../../core/theme.service';
import { AuthService } from '../../core/auth.service';
import {
  ActivityItem as DashboardActivityItem,
  DashboardChangeIndicator,
  DashboardOverviewResponse,
  DashboardPipelineInsight,
  DashboardRevenuePoint,
  DashboardSummaryCard
} from './dashboard.types';

interface SummaryStat {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

interface InsightItemView {
  title: string;
  value: string;
  meta: string;
}

interface RevenueTrendPoint {
  label: string;
  displayValue: string;
  x: number;
  y: number;
}

interface ActivityListItem {
  title: string;
  description: string;
  avatar: string;
  timestamp: string;
  type: 'client' | 'invoice' | 'project';
}

interface RevenueChartView {
  path: string;
  area: string;
  points: RevenueTrendPoint[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, BaseChartDirective, MatFormFieldModule, MatSelectModule, TranslateModule],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  summaryStats: SummaryStat[] = [];
  revenueInsights: InsightItemView[] = [];
  revenueTrend: RevenueTrendPoint[] = [];
  activities: ActivityListItem[] = [];
  revenueChart?: RevenueChartView;

  // Chart.js bar chart config
  barChartData: any = { labels: [], datasets: [] };
  barChartOptions: any = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (ctx: any) => {
            // Show full formatted value in tooltip
            const idx = ctx.dataIndex;
            const point = this.revenueTrend[idx];
            return point ? point.displayValue : ctx.formattedValue;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#222', // will be updated in refreshChartColors()
          font: { weight: 'bold', size: 16 },
          opacity: 1
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148,163,184,0.18)'
        },
        ticks: {
          color: '#222', // will be updated in refreshChartColors()
          font: { weight: 'bold', size: 15 },
          opacity: 1
        }
      }
    }
  };

  // reference to the chart directive to trigger updates when theme changes
  // will be set via ViewChild when available
  @ViewChild(BaseChartDirective) chartRef?: BaseChartDirective;

  getTotalRevenue(): string {
    if (!this.revenueTrend.length) return '—';
    // Toplamı hesapla (ilk para birimini kullan)
    const total = this.revenueTrend.reduce((sum, p) => {
      const num = Number((p.displayValue || '').replace(/[^\d.\-]/g, ''));
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
    // Para birimini ilk noktadan al
    const currency = this.revenueTrend[0]?.displayValue?.replace(/[\d.,\s-]/g, '').trim() || '';
    return this.formatAmount(total, currency);
  }

  loading = false;
  errorMessage?: string;
  readonly revenueGradientId = `revenue-gradient-${Math.random().toString(36).slice(2, 8)}`;
  private readonly chartPaddingTop = 10;
  private readonly chartPaddingBottom = 10;



  currentLang = 'tr';

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly translate: TranslateService,
    private readonly themeService: ThemeService
  ) {
    this.currentLang = this.translate.currentLang || this.translate.getDefaultLang() || 'tr';
  }

  // helper: read computed CSS variable from root, fallback if not present
  private getCssVar(name: string, fallback = ''): string {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name)?.trim();
      return v || fallback;
    } catch {
      return fallback;
    }
  }

  // Refresh dynamic colors used by charts (call when theme changes)
  private refreshChartColors(): void {
    const primary = this.getCssVar('--primary', '#2563eb');
    const btnText = this.getCssVar('--btn-text', '#fff');
    const appText = this.getCssVar('--app-text', '#222');
    const gridDark = 'rgba(255,255,255,0.22)';
    const gridLight = 'rgba(148,163,184,0.18)';

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // update scale tick colors
    if (this.barChartOptions?.scales?.x?.ticks) {
      this.barChartOptions.scales.x.ticks.color = isDark ? btnText : appText;
    }
    if (this.barChartOptions?.scales?.y?.ticks) {
      this.barChartOptions.scales.y.ticks.color = isDark ? btnText : appText;
    }
    if (this.barChartOptions?.scales?.y?.grid) {
      this.barChartOptions.scales.y.grid.color = isDark ? gridDark : gridLight;
    }

    // update dataset colors
    if (this.barChartData?.datasets?.length) {
      const rgbaPrimary = this.toRgba(primary, isDark ? 0.9 : 0.85);
      this.barChartData.datasets[0].backgroundColor = rgbaPrimary;
      // small shadow effect via borderColor if desired
      this.barChartData.datasets[0].borderColor = this.toRgba(primary, isDark ? 0.9 : 0.95);
    }

    // request chart update when available
    try {
      this.chartRef?.chart?.update();
    } catch {
      // ignore if chart not yet initialized
    }
  }

  private toRgba(color: string, alpha = 1): string {
    // accept hex or rgb/rgba or var() — attempt basic conversions
    if (!color) return `rgba(37,99,235,${alpha})`;
    color = color.trim();
    if (color.startsWith('rgba') || color.startsWith('rgb')) {
      // replace existing alpha if rgba
      if (color.startsWith('rgba')) {
        return color.replace(/rgba\(([^)]+)\)/, `rgba($1)`);
      }
      // rgb(...) -> rgba
      return color.replace(/rgb\(([^)]+)\)/, `rgba($1, ${alpha})`);
    }
    if (color.startsWith('#')) {
      // hex to rgba
      const hex = color.replace('#', '');
      const normalized = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
      const bigint = parseInt(normalized, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return `rgba(${r},${g},${b},${alpha})`;
    }
    // fallback: return color directly (may be var(...))
    return color;
  }

  switchLang(lang: string) {
    this.currentLang = lang;
    this.translate.use(lang);
  }

  private updateBarChartData(): void {
    if (!this.revenueTrend?.length) {
      this.barChartData = { labels: [], datasets: [] };
      return;
    }

    const labels = this.revenueTrend.map(p => p.label);
    const data = this.revenueTrend.map(p => {
      // Try to parse number from displayValue
      const num = Number((p.displayValue || '').replace(/[^\d.\-]/g, ''));
      return isNaN(num) ? 0 : num;
    });

    // resolve primary color from CSS so it adapts to theme
    const primary = this.getCssVar('--primary', '#2563eb');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const bg = this.toRgba(primary, isDark ? 0.9 : 0.85);
    const border = this.toRgba(primary, isDark ? 0.95 : 1);

    this.barChartData = {
      labels,
      datasets: [
        {
          data,
          backgroundColor: bg,
          borderColor: border,
          borderRadius: 8,
          maxBarThickness: 38
        }
      ]
    };

  }

  async ngOnInit(): Promise<void> {
    // refresh colors initially and when theme changes
    this.refreshChartColors();
    this.themeService.theme$.subscribe(() => this.refreshChartColors());

    await this.loadOverview();
  }

  async reload(): Promise<void> {
    await this.loadOverview();
  }

  private async loadOverview(): Promise<void> {
    this.loading = true;
    this.errorMessage = undefined;

    try {
      const overview = await firstValueFrom(this.dashboardService.getOverview());
      this.applyOverview(overview);
    } catch (error) {
      console.error('Failed to load dashboard overview', error);
      this.handleError(error);
    } finally {
      this.loading = false;
    }
  }

  private handleError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        this.errorMessage = 'Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapın.';
        this.authService.logout();
        void this.router.navigate(['/auth/login'], {
          queryParams: { redirect: '/dashboard' }
        });
        return;
      }

      this.errorMessage = error.message ?? 'Dashboard verileri yüklenirken bir sorun oluştu.';
      return;
    }

    this.errorMessage = 'Dashboard verileri yüklenirken bir sorun oluştu.';
  }

  private applyOverview(overview: DashboardOverviewResponse): void {
    this.summaryStats = overview.summary.map(card => this.mapSummaryCard(card));
    this.revenueInsights = overview.pipelineInsights.slice(0, 3).map(insight => this.mapPipelineInsight(insight));
    this.revenueTrend = this.mapRevenueTrend(overview.revenueTrend);
    this.revenueChart = this.buildRevenueChart(this.revenueTrend);
  this.updateBarChartData();
  this.refreshChartColors();
    this.activities = overview.activityFeed.map(activity => this.mapActivity(activity)).slice(0, 6);
  }

  private mapSummaryCard(card: DashboardSummaryCard): SummaryStat {
    const { text, trend } = this.formatChange(card.change);

    // Map known backend labels to i18n keys
    const labelKey = this.getMetricLabelKey(card.label);

    return {
      label: labelKey,
      value: this.formatAmount(card.value.amount, card.value.currency),
      change: text,
      trend
    };
  }

  /**
   * Maps backend metric labels to i18n keys for translation.
   * Add new mappings as needed.
   */
  private getMetricLabelKey(label: string): string {
    const map: Record<string, string> = {
      // Turkish
      'Toplam Gelir': 'dashboard.metrics.totalRevenue',
      'Fatura Sayısı': 'dashboard.metrics.invoiceCount',
      'Aktif Proje': 'dashboard.metrics.activeProject',
      'Müşteri Sayısı': 'dashboard.metrics.clientCount',
      'Ay bazlı gelir': 'dashboard.metrics.monthlyRevenue',
      'Aktif projeler': 'dashboard.metrics.activeProjects',
      'Yaklaşan faturalar': 'dashboard.metrics.upcomingInvoices',
      'Ortalama teslim süresi': 'dashboard.metrics.avgDeliveryTime',
      // English
      'Total Revenue': 'dashboard.metrics.totalRevenue',
      'Invoice Count': 'dashboard.metrics.invoiceCount',
      'Active Project': 'dashboard.metrics.activeProject',
      'Client Count': 'dashboard.metrics.clientCount',
      'Monthly Revenue': 'dashboard.metrics.monthlyRevenue',
      'Active Projects': 'dashboard.metrics.activeProjects',
      'Upcoming Invoices': 'dashboard.metrics.upcomingInvoices',
      'Average Delivery Time': 'dashboard.metrics.avgDeliveryTime',
    };
    return map[label] || label;
  }

  private formatAmount(amount: number, currency?: string | null): string {
    if (!Number.isFinite(amount)) {
      return '—';
    }

    if (!currency) {
      return this.formatNumber(amount);
    }

    const normalizedCurrency = currency.trim();
    if (!normalizedCurrency) {
      return this.formatNumber(amount);
    }

    const isoCurrency = normalizedCurrency.toUpperCase();
    const isIsoCurrency = /^[A-Z]{3}$/.test(isoCurrency);

    if (isIsoCurrency) {
      const formatter = new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: isoCurrency,
        maximumFractionDigits: Math.abs(amount) < 1000 ? 2 : 0
      });

      if (Math.abs(amount) >= 1_000_000) {
        return `${formatter.format(amount / 1_000_000)}M`;
      }

      if (Math.abs(amount) >= 1_000) {
        return `${formatter.format(amount / 1_000)}K`;
      }

      return formatter.format(amount);
    }

    const localizedUnit = this.localizeUnit(normalizedCurrency);
    return `${this.formatNumber(amount)} ${localizedUnit}`.trim();
  }

  private localizeUnit(unit: string): string {
    const key = unit.toLowerCase();

    switch (key) {
      case 'days':
        return 'gün';
      case 'hours':
        return 'saat';
      case 'percent':
        return '%';
      default:
        return unit;
    }
  }

  private formatNumber(amount: number): string {
    return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(amount);
  }

  private formatChange(change?: DashboardChangeIndicator): { text: string; trend: SummaryStat['trend']; } {
    if (!change) {
      return { text: '—', trend: 'neutral' };
    }

    const percent = Math.round((change.percent ?? 0) * 10) / 10;
    const sign = percent > 0 ? '+' : '';
    const text = `${sign}${percent.toFixed(1)}%`;

    switch (change.trend) {
      case 'up':
        return { text, trend: 'up' };
      case 'down':
        return { text, trend: 'down' };
      default:
        return { text, trend: 'neutral' };
    }
  }

  private mapPipelineInsight(insight: DashboardPipelineInsight): InsightItemView {
    return {
      title: insight.title,
      value: this.formatNumber(insight.value),
      meta: insight.meta ?? 'Detay bulunmuyor'
    };
  }

  private mapRevenueTrend(points: DashboardRevenuePoint[]): RevenueTrendPoint[] {
    if (!points.length) {
      return [];
    }

    const maxAmount = Math.max(...points.map(point => point.value.amount));
    const baseline = this.getChartBaseline();
    const availableHeight = 100 - this.chartPaddingTop - this.chartPaddingBottom;
    const step = points.length > 1 ? 100 / (points.length - 1) : 0;

    return points.map((point, index) => {
      const normalized = maxAmount > 0 ? point.value.amount / maxAmount : 0;
      const x = points.length === 1 ? 50 : this.round(step * index);
      const y = this.round(baseline - normalized * availableHeight);

      return {
        label: point.label,
        displayValue: this.formatAmount(point.value.amount, point.value.currency),
        x,
        y
      };
    });
  }

  private buildRevenueChart(points: RevenueTrendPoint[]): RevenueChartView | undefined {
    if (!points.length) {
      return undefined;
    }

    const baseline = this.getChartBaseline();
    const commands = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');

    if (!commands) {
      return undefined;
    }

    const first = points[0];
    const last = points[points.length - 1];
    const areaPath = `${commands} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;

    return {
      path: commands,
      area: areaPath,
      points
    };
  }

  private mapActivity(activity: DashboardActivityItem): ActivityListItem {
    return {
      title: activity.title,
      description: activity.description ?? 'Detay bulunmuyor',
      avatar: this.buildAvatar(activity.actor?.initials, activity.actor?.name ?? activity.title),
      timestamp: this.formatTimestamp(activity.timestamp),
      type: activity.type
    };
  }

  private formatTimestamp(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('tr-TR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(date);
  }

  private buildAvatar(initials?: string | null, fallback?: string | null): string {
    if (initials && initials.trim().length > 0) {
      return initials.trim().slice(0, 2).toUpperCase();
    }

    if (!fallback) {
      return '??';
    }

    const parts = fallback.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return parts[0].slice(0, 2).toUpperCase();
  }

  private getChartBaseline(): number {
    return 100 - this.chartPaddingBottom;
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
