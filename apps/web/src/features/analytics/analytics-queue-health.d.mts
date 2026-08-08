export type QueueRole = 'trabalhada' | 'caixa_de_entrada' | 'a_classificar';

export interface QueuePipeline {
  pipelineId: string;
  label: string;
  role: QueueRole;
  inQueue: number;
  stagnant: number;
  unknownActivity: number;
  stagnantRate: number | null;
  arrived30d: number;
  medianAgeDays: number | null;
}

export interface QueueHealthReading {
  available: boolean;
  threshold: number | null;
  inQueue: number;
  stagnant: number;
  unknown: number;
  measured: number;
  stagnantRate: number | null;
  moving: number;
  partial: boolean;
  coverageWarning: string | null;
  pipelines: QueuePipeline[];
  classified: number;
  total: number;
  notice: string | null;
}

export declare function queueRoleLabel(role: string): string;
export declare function readQueueHealth(payload: unknown): QueueHealthReading;
export declare function suggestsInbox(pipeline: QueuePipeline, threshold?: number): boolean;
