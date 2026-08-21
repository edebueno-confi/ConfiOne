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

export function normalizeAnalyticsScopeValue(value: unknown): string;
export function selectedAnalyticsPipelineIds(configs: Array<{ pipelineId: string; groupCompany?: string | null }>, operation: string, excludedPipelineIds?: string[]): string[];
export function readAnalyticsStageScope(rows: unknown[], selectedPipelineIds: string[]): AnalyticsStageScopeReading;
export function hasCompatibleAnalyticsStage(rows: unknown[], selectedPipelineIds: string[], stageId: string): boolean;
export function applyCommercialStageScope(snapshot: unknown, payload: unknown): unknown;
