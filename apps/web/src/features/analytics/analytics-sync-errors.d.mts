export interface AnalyticsSyncErrorPayload {
  code?: string;
  error?: string;
  message?: string;
}

export interface AnalyticsSyncErrorInput {
  operation: string;
  status: number;
  payload: AnalyticsSyncErrorPayload | null;
}

/** Mensagem de produto exibida na interface. Sem termo de infraestrutura. */
export function formatAnalyticsSyncError(input: AnalyticsSyncErrorInput): string;

/** Detalhe técnico da falha; usado apenas para diagnóstico fora da interface. */
export function describeAnalyticsSyncFailure(input: AnalyticsSyncErrorInput): string;

/** `Error` com copy de produto em `message` e detalhe técnico em `cause`. */
export function analyticsSyncError(input: AnalyticsSyncErrorInput): Error;
