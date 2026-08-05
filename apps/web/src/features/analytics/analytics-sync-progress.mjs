const ACTIVE_EXECUTION_STATUSES = new Set(['queued', 'running']);

export function isAnalyticsSourceActive(source) {
  return Boolean(source && (
    source.status === 'syncing'
    || ACTIVE_EXECUTION_STATUSES.has(source.currentRunStatus)
  ));
}

export function areAnalyticsSourcesActive(payload, kind = 'full') {
  if (!payload) return false;
  if (kind === 'hubspot') return isAnalyticsSourceActive(payload.hubspot);
  if (kind === 'omie') return isAnalyticsSourceActive(payload.omie);
  return isAnalyticsSourceActive(payload.hubspot) || isAnalyticsSourceActive(payload.omie);
}

export function syncProgressLabel(kind, timedOut = false) {
  if (timedOut) return 'A atualização continua no servidor; acompanhe o Histórico.';
  if (kind === 'hubspot') return 'HubSpot concluído; confirmando o estado publicado.';
  if (kind === 'omie') return 'OMIE concluído; confirmando o snapshot financeiro.';
  return 'HubSpot e OMIE concluídos; confirmando os dados publicados.';
}
