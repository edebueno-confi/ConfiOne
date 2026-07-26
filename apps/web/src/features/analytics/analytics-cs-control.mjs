export function resolveCsSyncMode(latestRun) {
  return latestRun?.status === 'success' ? 'incremental' : 'full';
}

export function buildCsSyncPayload(latestRun) {
  const mode = resolveCsSyncMode(latestRun);
  return mode === 'full' ? { scope: 'cs', full: true } : { scope: 'cs' };
}

export function sanitizeCsSyncResult(payload) {
  return {
    status: payload?.status === 'partial' ? 'partial' : 'success',
    correlationId: typeof payload?.correlationId === 'string' && /^[0-9a-f-]{36}$/i.test(payload.correlationId)
      ? payload.correlationId
      : null,
    tickets: Number(payload?.tickets ?? 0),
    owners: Number(payload?.owners ?? 0),
    stages: Number(payload?.stages ?? 0),
    mode: payload?.mode === 'full' ? 'full' : 'incremental',
  };
}
