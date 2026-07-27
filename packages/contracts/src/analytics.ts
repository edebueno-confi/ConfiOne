export const ANALYTICS_DATA_STATUSES = [
  'fresh',
  'stale',
  'partial',
  'empty',
  'zero',
  'not_configured',
  'syncing',
  'unavailable',
  'error',
] as const;

export type AnalyticsDataStatus = (typeof ANALYTICS_DATA_STATUSES)[number];

export type AnalyticsTemporalType = 'period_flow' | 'current_position' | 'snapshot' | 'accumulated';

export interface AnalyticsCoverage {
  expected: number | null;
  received: number | null;
}

export interface AnalyticsMetricResult<T> {
  value: T | null;
  status: AnalyticsDataStatus;
  source: string;
  asOf: string | null;
  lastSuccessfulSyncAt: string | null;
  syncRunId: string | null;
  coverage?: AnalyticsCoverage;
  reason?: string | null;
  temporalType?: AnalyticsTemporalType;
}

export interface AnalyticsBlockState {
  status: AnalyticsDataStatus;
  source: string;
  asOf: string | null;
  lastSuccessfulSyncAt: string | null;
  syncRunId: string | null;
  coverage: AnalyticsCoverage;
  reason: string | null;
}

export interface AnalyticsMetricDefinition {
  key: string;
  label: string;
  domain: 'executive' | 'commercial' | 'cs' | 'finance';
  temporalType: AnalyticsTemporalType;
  source: string;
  periodFilter: boolean;
  expectedFreshnessMinutes: number | null;
  currentStatus: AnalyticsDataStatus;
}
