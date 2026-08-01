export const CS_SOURCE_STATES = Object.freeze([
  'empty_authoritative',
  'empty_unverified',
  'failed',
  'partial',
  'complete',
]);

export function classifyCsSource({
  statusCode = 200,
  total,
  recordsReceived,
  pagesComplete = true,
  scopeValidated = true,
  fullLoad = true,
} = {}) {
  if (statusCode === 403 || statusCode < 200 || statusCode >= 300 || !scopeValidated) return 'failed';
  if (!pagesComplete) return 'partial';
  // In an initial/full read, a positive source total with no equivalent
  // records received is evidence of an incomplete snapshot, never success/0.
  if (fullLoad && Number.isFinite(total) && total > 0 && Number.isFinite(recordsReceived) && recordsReceived < total) {
    return 'partial';
  }
  // An incremental query is scoped to a time window, so zero changed records
  // is valid and must not be confused with an empty authoritative source.
  if (!fullLoad) return 'complete';
  if (Number.isFinite(total) && total === 0) return 'empty_authoritative';
  if (Number.isFinite(total) && total > 0) return 'complete';
  return 'empty_unverified';
}

export function hasValidCsIncrementalBoundary(run) {
  if (!run || run.status !== 'success') return false;
  if (run.domain_key !== 'cs') return false;
  if (run.source_state === 'complete' || run.source_state === 'empty_authoritative') return true;
  // Legacy success/0 rows were created without authoritative source evidence.
  return Number(run.source_total) > 0;
}

export function resolveCsLoadMode(run, requestedFull = false) {
  if (requestedFull || !hasValidCsIncrementalBoundary(run)) return 'full';
  return 'incremental';
}

export function shouldAdvanceCsWatermark(sourceState) {
  return sourceState === 'complete' || sourceState === 'empty_authoritative';
}
