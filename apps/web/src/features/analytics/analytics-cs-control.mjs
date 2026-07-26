export function resolveCsSyncMode(latestRun) {
  return latestRun?.status === 'success' ? 'incremental' : 'full';
}

export function buildCsSyncPayload(latestRun) {
  // O backend determina full/incremental com base na evidência persistida.
  // O frontend não pode transformar um success/0 legado em watermark.
  return { scope: 'cs' };
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
