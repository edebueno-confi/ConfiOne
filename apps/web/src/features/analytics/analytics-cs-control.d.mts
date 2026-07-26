export function resolveCsSyncMode(latestRun: { status?: string } | null): 'full' | 'incremental';
export function buildCsSyncPayload(latestRun: { status?: string } | null): { scope: 'cs'; full?: true };
export function sanitizeCsSyncResult(payload: Record<string, unknown> | null): {
  status: 'success' | 'partial';
  correlationId: string | null;
  tickets: number;
  owners: number;
  stages: number;
  mode: 'full' | 'incremental';
};
