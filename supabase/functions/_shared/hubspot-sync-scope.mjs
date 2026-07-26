export const HUBSPOT_SYNC_SCOPES = Object.freeze([
  'all',
  'companies',
  'commercial',
  'cs',
]);

export function normalizeHubspotSyncScope(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  return HUBSPOT_SYNC_SCOPES.includes(normalized) ? normalized : 'all';
}

export function syncsCompanies(scope) {
  return scope === 'all' || scope === 'companies';
}

export function syncsPipelines(scope) {
  return scope !== 'companies';
}

export function scopeObjectType(scope) {
  if (scope === 'commercial') return 'deal';
  if (scope === 'cs') return 'ticket';
  return null;
}

// Cada domínio precisa de seu próprio marco incremental. Uma execução de
// Comercial não pode fazer a primeira carga de CS parecer incremental.
export function usesDomainSyncWatermark(scope) {
  return scope === 'companies' || scope === 'commercial' || scope === 'cs';
}
