export function buildOverviewSnapshotQueryPlan<T extends object>(filters: T): { period: T; current: T };
export function buildUnavailableOperationKpiPayload(): { kpis: Record<string, { state: 'unavailable'; value: null; reason: string }> };
export function buildOperationPeriodMetrics(periodCommercial: unknown, periodSupport: unknown): {
  commercial: { wonDeals: number | null; lostDeals: number | null; wonRevenue: number | null; conversionRate: number | null };
  support: { createdTickets: number | null };
};
export function mergeExecutiveKpiPayload<T>(periodPayload: T, currentPayload: unknown): T;
export function mergeOperationKpiPayload<T>(basePayload: T, periodPayloads: unknown, currentPayloads: unknown): T;
export function composeCeoSnapshot<T>(periodSnapshot: T, currentSnapshot: unknown): T;
