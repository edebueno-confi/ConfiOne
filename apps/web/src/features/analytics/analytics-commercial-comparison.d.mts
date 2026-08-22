import type { KpiEntry, KpiValueKind } from './analytics-kpi-contract.mjs';

export interface AnalyticsPeriod {
  from: string;
  to: string;
}

export interface ComparisonDelta {
  absolute: number;
  relativePercent: number | null;
}

export interface CommercialComparison {
  key: string;
  label: string;
  kind: KpiValueKind;
  isRate?: boolean;
  current: KpiEntry & { comparable: boolean };
  previous: KpiEntry & { comparable: boolean };
  delta: ComparisonDelta | null;
}

export declare const COMMERCIAL_COMPARISON_METRICS: Array<{
  key: string;
  label: string;
  kind: KpiValueKind;
  isRate?: boolean;
}>;

export declare function resolvePreviousComparablePeriod(period: Partial<AnalyticsPeriod>): AnalyticsPeriod | null;

export declare function calculateComparisonDelta(current: number, previous: number): ComparisonDelta | null;

export declare function buildCommercialComparisons(currentPayload: unknown, previousPayload: unknown): CommercialComparison[];
