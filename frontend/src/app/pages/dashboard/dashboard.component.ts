import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { firstValueFrom } from 'rxjs';
import { DashboardService } from './dashboard.service';
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
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  summaryStats: SummaryStat[] = [];
  revenueInsights: InsightItemView[] = [];
  revenueTrend: RevenueTrendPoint[] = [];
  activities: ActivityListItem[] = [];
  revenueChart?: RevenueChartView;

  loading = false;
  errorMessage?: string;
  readonly revenueGradientId = `revenue-gradient-${Math.random().toString(36).slice(2, 8)}`;
  private readonly chartPaddingTop = 10;
  private readonly chartPaddingBottom = 10;


  constructor(
    private readonly dashboardService: DashboardService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  // Returns bar height as percent of max value
  public getBarHeight(point: RevenueTrendPoint): number {
    if (!this.revenueTrend || !this.revenueTrend.length) return 0;
    const max = Math.max(...this.revenueTrend.map((p: any) => {
      // Try to parse number from displayValue, fallback to 1
      const num = Number((p.displayValue || '').replace(/[^\d.\-]/g, ''));
      return isNaN(num) ? 1 : num;
    }));
    const val = Number((point.displayValue || '').replace(/[^\d.\-]/g, ''));
    if (!max || isNaN(val)) return 0;
    return Math.max(6, (val / max) * 100); // min 6% for visibility
  }

  async ngOnInit(): Promise<void> {
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
    this.activities = overview.activityFeed.map(activity => this.mapActivity(activity)).slice(0, 6);
  }

  private mapSummaryCard(card: DashboardSummaryCard): SummaryStat {
    const { text, trend } = this.formatChange(card.change);

    return {
      label: card.label,
      value: this.formatAmount(card.value.amount, card.value.currency),
      change: text,
      trend
    };
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
