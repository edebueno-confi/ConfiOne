export const ANALYTICS_DATA_STATUSES = [
  'fresh',
  'stale',
  'partial',
  'never_synced',
  'empty',
  'zero',
  'not_configured',
  'syncing',
  'unavailable',
  'failed',
  'error',
  'unavailable_source',
  'unavailable_contract',
  'unavailable_period',
] as const;

export type AnalyticsDataStatus = (typeof ANALYTICS_DATA_STATUSES)[number];

export const ANALYTICS_SOURCE_STATUSES = [
  'never_synced',
  'syncing',
  'fresh',
  'stale',
  'partial',
  'failed',
  'unavailable',
] as const;

export type AnalyticsSourceStatus = (typeof ANALYTICS_SOURCE_STATUSES)[number];

export const ANALYTICS_EXECUTION_STATUSES = [
  'queued',
  'running',
  'succeeded',
  'failed',
  'partial',
  'cancelled',
  'timed_out',
  'abandoned',
] as const;

export type AnalyticsExecutionStatus = (typeof ANALYTICS_EXECUTION_STATUSES)[number];

export interface AnalyticsSourceState {
  key: string;
  label: string;
  status: AnalyticsSourceStatus;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  durationMs: number | null;
  processedCount: number | null;
  error: string | null;
  freshnessMinutes: number | null;
  runId: string | null;
  origin: string;
  currentRunId: string | null;
  currentRunStatus: AnalyticsExecutionStatus | null;
  publishedSourceStatus: AnalyticsSourceStatus;
  lastFailureAt: string | null;
  rejectedCount: number | null;
  sanitizedError: string | null;
  hasValidSnapshot: boolean;
}

export interface AnalyticsSourceStatusPayload {
  hubspot: AnalyticsSourceState;
  omie: AnalyticsSourceState;
  globalStatus: AnalyticsSourceStatus;
}

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
