export declare const UNCLASSIFIED_LABEL: string;

export interface StageBreakdownPipeline {
  pipelineLabel: string;
  openTickets: number;
}

export interface StageBreakdownRow {
  stage: string;
  order: number;
  openTickets: number;
  totalTickets: number;
  byPipeline: StageBreakdownPipeline[];
}

export interface StageBreakdownReading {
  available: boolean;
  rows: StageBreakdownRow[];
  unmapped: number;
  pendingReview: number;
  notice: string | null;
}

export declare function readStageBreakdown(payload: unknown): StageBreakdownReading;

export declare function consolidatedStages(rows: StageBreakdownRow[]): string[];
