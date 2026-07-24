import type {
  AnalyticsBlockState,
  AnalyticsCoverage,
  AnalyticsDataStatus,
  AnalyticsMetricResult,
} from '@genius-support-os/contracts';

export type AnalyticsStateInput = {
  source: string;
  sourceConfigured?: boolean;
  queried?: boolean;
  received?: number | null;
  expected?: number | null;
  lastSuccessfulSyncAt?: string | null;
  now?: string;
  staleAfterMinutes?: number | null;
  syncing?: boolean;
  unavailable?: boolean;
  partial?: boolean;
  error?: boolean;
  reason?: string | null;
};

export function classifyAnalyticsState(input: AnalyticsStateInput): AnalyticsDataStatus {
  if (input.syncing) return 'syncing';
  if (input.error) return 'error';
  if (input.unavailable) return 'unavailable';
  if (input.sourceConfigured === false) return 'not_configured';
  if (input.partial) return 'partial';
  if (input.lastSuccessfulSyncAt && input.staleAfterMinutes != null) {
    const now = Date.parse(input.now ?? new Date().toISOString());
    const last = Date.parse(input.lastSuccessfulSyncAt);
    if (Number.isFinite(now) && Number.isFinite(last) && now - last > input.staleAfterMinutes * 60_000) return 'stale';
  }
  if (input.queried && input.received === 0) return 'empty';
  return 'fresh';
}

export function createAnalyticsBlockState(input: AnalyticsStateInput): AnalyticsBlockState {
  const coverage: AnalyticsCoverage = {
    expected: input.expected ?? null,
    received: input.received ?? null,
  };
  return {
    status: classifyAnalyticsState(input),
    source: input.source,
    asOf: input.lastSuccessfulSyncAt ?? null,
    lastSuccessfulSyncAt: input.lastSuccessfulSyncAt ?? null,
    syncRunId: null,
    coverage,
    reason: input.reason ?? null,
  };
}

export function createAnalyticsMetricResult<T>(value: T | null, input: AnalyticsStateInput & { syncRunId?: string | null }): AnalyticsMetricResult<T> {
  const state = createAnalyticsBlockState(input);
  return { value, ...state, syncRunId: input.syncRunId ?? null };
}

export function parseAnalyticsNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function hasInvalidAnalyticsNumber(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '' && parseAnalyticsNumber(value) === null;
}
