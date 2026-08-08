export type QueueRole = 'trabalhada' | 'caixa_de_entrada' | 'a_classificar';

export interface QueueGroupCompany {
  company: string;
  pipelines: number;
  inQueue: number;
  unowned: number;
  waitingThirdParty: number;
  confirmedPipelines: number;
}

export interface QueuePipeline {
  pipelineId: string;
  /** Nome oficial no HubSpot. */
  label: string;
  /** Apelido interno, quando existir. Nunca substitui o nome oficial. */
  alias: string | null;
  groupCompany: string;
  groupCompanyConfirmed: boolean;
  waitingThirdParty: number;
  unowned: number;
  waitingUndecided: number;
  role: QueueRole;
  inQueue: number;
  stagnant: number;
  unknownActivity: number;
  stagnantRate: number | null;
  arrived30d: number;
  medianAgeDays: number | null;
}

export interface QueueAgeBucket {
  bucket: string;
  tickets: number;
  order: number;
}

export interface QueueHealthReading {
  ageBuckets: QueueAgeBucket[];
  byGroupCompany: QueueGroupCompany[];
  waitingThirdParty: number;
  unowned: number;
  waitingUndecided: number;
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
