import type { AnalyticsSyncHistoryRow } from '../../analytics/analytics-model';

export type HistoryStatusBucket = 'success' | 'partial' | 'failed' | 'running' | 'empty';
export type HistoryTone = 'success' | 'warning' | 'danger' | 'info' | 'muted';

export interface HistoryFilters {
  period: string;
  source: string;
  status: string;
  trigger: string;
}

export interface HistoryOption {
  readonly value: string;
  readonly label: string;
}

export interface HistoryPeriodOption extends HistoryOption {
  readonly days: number | null;
}

export interface HistoryCounts {
  readonly total: number;
  readonly success: number;
  readonly partial: number;
  readonly failed: number;
  readonly running: number;
  readonly processed: number;
}

export interface HistoryPage<T> {
  readonly slice: T[];
  readonly page: number;
  readonly pageCount: number;
  readonly from: number;
  readonly to: number;
  readonly total: number;
}

export const UNAVAILABLE_LABEL: string;
export const PERIOD_OPTIONS: readonly HistoryPeriodOption[];
export const SOURCE_OPTIONS: readonly HistoryOption[];
export const STATUS_OPTIONS: readonly HistoryOption[];
export const TRIGGER_OPTIONS: readonly HistoryOption[];
export const DEFAULT_HISTORY_FILTERS: HistoryFilters;

export function statusLabel(value: string): string;
export function statusBucket(value: string): HistoryStatusBucket;
export function bucketTone(bucket: HistoryStatusBucket): HistoryTone;
export function cycleRowOf(rows: readonly AnalyticsSyncHistoryRow[]): AnalyticsSyncHistoryRow;
export function resolveGroupStatus(rows: readonly AnalyticsSyncHistoryRow[]): string;
export function groupHistoryRows(rows: readonly AnalyticsSyncHistoryRow[]): AnalyticsSyncHistoryRow[][];
export function summarizeHistoryGroups(groups: readonly AnalyticsSyncHistoryRow[][]): HistoryCounts;
export function filterHistoryGroups(
  groups: readonly AnalyticsSyncHistoryRow[][],
  filters: Partial<HistoryFilters>,
  nowMs: number,
): AnalyticsSyncHistoryRow[][];
export function hasActiveHistoryFilters(filters: Partial<HistoryFilters>): boolean;
export function paginate<T>(items: readonly T[], page: number, pageSize: number): HistoryPage<T>;
