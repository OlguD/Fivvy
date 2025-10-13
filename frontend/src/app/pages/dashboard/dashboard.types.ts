export interface DashboardDateRange {
  start: string;
  end: string;
}

export interface DashboardRange {
  current: DashboardDateRange;
  comparison: DashboardDateRange;
}

export interface DashboardValue {
  amount: number;
  currency?: string | null;
}

export interface DashboardChangeIndicator {
  absolute: number;
  percent: number;
  trend: 'up' | 'down' | 'steady';
}

export interface DashboardSummaryCard {
  key: string;
  label: string;
  value: DashboardValue;
  change?: DashboardChangeIndicator;
}

export interface DashboardRevenuePoint {
  label: string;
  value: DashboardValue;
}

export interface DashboardPipelineInsight {
  key: string;
  title: string;
  value: number;
  meta?: string | null;
}

export interface ActivityActor {
  initials?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
}

export interface ActivityItem {
  id: string;
  type: 'client' | 'project' | 'invoice';
  title: string;
  description?: string | null;
  actor: ActivityActor;
  timestamp: string;
}

export interface DashboardOverviewResponse {
  range: DashboardRange;
  summary: DashboardSummaryCard[];
  revenueTrend: DashboardRevenuePoint[];
  pipelineInsights: DashboardPipelineInsight[];
  activityFeed: ActivityItem[];
}

export interface DashboardActivitiesResponse {
  items: ActivityItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface DashboardOverviewParams {
  from?: Date;
  to?: Date;
  compareFrom?: Date;
  compareTo?: Date;
  currency?: string;
}

export interface DashboardActivitiesParams {
  page?: number;
  pageSize?: number;
}
