export interface AnalyticsSyncErrorPayload {
  code?: string;
  error?: string;
  message?: string;
}

export function formatAnalyticsSyncError(input: {
  operation: string;
  status: number;
  payload: AnalyticsSyncErrorPayload | null;
}): string;
