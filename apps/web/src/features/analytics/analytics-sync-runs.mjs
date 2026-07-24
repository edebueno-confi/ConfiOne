const PHASED_WINDOW_MS = 2 * 60 * 1000;

function timestamp(run) {
  const value = Date.parse(String(run?.startedAt ?? ''));
  return Number.isFinite(value) ? value : null;
}

function sum(runs, field) {
  return runs.reduce((total, run) => total + Number(run?.[field] ?? 0), 0);
}

/**
 * Retorna o último run visualizável do Dashboard.
 *
 * A UI dispara companies -> commercial -> cs. Como o schema histórico não tem
 * batch_id, o fechamento da etapa cs funciona como marcador do lote quando as
 * três etapas bem-sucedidas ocorreram em uma janela curta e ordenada.
 */
export function aggregateLatestHubspotSyncRuns(runs) {
  const latest = Array.isArray(runs) ? runs[0] : null;
  if (!latest || latest.status !== 'success' || latest.domainKey !== 'cs') return latest;

  const csTime = timestamp(latest);
  if (csTime === null) return latest;

  const commercial = runs.find((run) => run.status === 'success' && run.domainKey === 'commercial' && (timestamp(run) ?? Infinity) <= csTime);
  const commercialTime = timestamp(commercial);
  const companies = runs.find((run) => run.status === 'success' && run.domainKey === 'companies' && (timestamp(run) ?? Infinity) <= (commercialTime ?? Infinity));
  if (!commercial || commercialTime === null || !companies) return latest;

  const phaseRuns = [companies, commercial, latest];
  const times = phaseRuns.map(timestamp);
  if (times.some((value) => value === null) || Math.max(...times) - Math.min(...times) > PHASED_WINDOW_MS) return latest;

  return {
    ...latest,
    id: `phased-${latest.id}`,
    domainKey: 'phased',
    startedAt: new Date(Math.min(...times)).toISOString(),
    dealsSynced: sum(phaseRuns, 'dealsSynced'),
    ticketsSynced: sum(phaseRuns, 'ticketsSynced'),
    ownersSynced: sum(phaseRuns, 'ownersSynced'),
    stagesSynced: sum(phaseRuns, 'stagesSynced'),
    companiesSynced: sum(phaseRuns, 'companiesSynced'),
  };
}
