export interface AnalyticsStageScopeOption {
  value: string;
  label: string;
}

export interface AnalyticsStageScopeReading {
  options: AnalyticsStageScopeOption[];
  partial: boolean;
  omitted: number;
  notice: string | null;
}

import type { AnalyticsBlockState } from '@genius-support-os/contracts';

export function normalizeAnalyticsScopeValue(value: unknown): string;
export function selectedAnalyticsPipelineIds(configs: Array<{ pipelineId: string; groupCompany?: string | null }>, operation: string, excludedPipelineIds?: string[]): string[];
export function commercialStageCatalogFilters<T extends object>(filters: T): T;
export function buildCommercialStageQueryPlan<T extends object>(filters: T, excludedPipelineIds?: string[], groupCompany?: string | null): {
  data: { filters: T; excludedPipelineIds: string[]; groupCompany: string | null };
  catalog: { filters: T; excludedPipelineIds: string[]; groupCompany: string | null } | null;
};
export function readAnalyticsStageScope(rows: unknown[], selectedPipelineIds: string[]): AnalyticsStageScopeReading;
export function hasCompatibleAnalyticsStage(rows: unknown[], selectedPipelineIds: string[], stageId: string): boolean;
export function composeCommercialStageView(dataSnapshot: { funnel?: unknown[]; state?: AnalyticsBlockState }, catalogSnapshot: { funnel?: unknown[] } | null, selectedPipelineIds: string[]): { stageScope: AnalyticsStageScopeReading; dataState?: AnalyticsBlockState };
export function applyCommercialStageScope(snapshot: unknown, payload: unknown): unknown;
