// Contrato de apresentação da saúde da fila.

const PAPEIS = {
  trabalhada: 'Fila de trabalho',
  caixa_de_entrada: 'Caixa de entrada',
  a_classificar: 'A classificar',
};

export function queueRoleLabel(role) {
  return PAPEIS[role] ?? PAPEIS.a_classificar;
}

/**
 * Normaliza o read model publicado pelo backend para o formato usado pela UI.
 * Todas as classificações, agregados e avisos vêm prontos do servidor.
 */
export function readQueueHealth(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      available: false, threshold: null, inQueue: 0, stagnant: 0, stagnantRate: null,
      pipelines: [], classified: 0, total: 0, notice: null, ageBuckets: [],
      unknown: 0, measured: 0, moving: 0, partial: false, coverageWarning: null,
      byGroupCompany: [], waitingThirdParty: 0, unowned: 0, waitingUndecided: 0,
    };
  }

  const threshold = Number(payload.stagnation_threshold_days ?? 0) || null;
  const inQueue = Number(payload.total_in_queue ?? 0);
  const stagnant = Number(payload.total_stagnant ?? 0);
  const unknown = Number(payload.total_unknown_activity ?? 0);
  const classified = Number(payload.classified_pipelines ?? 0);
  const total = Number(payload.total_pipelines ?? 0);

  const pipelines = (Array.isArray(payload.pipelines) ? payload.pipelines : [])
    .map((row) => ({
      pipelineId: String(row?.pipeline_id ?? ''),
      label: String(row?.pipeline_name ?? row?.pipeline_label ?? ''),
      alias: row?.pipeline_alias ? String(row.pipeline_alias) : null,
      groupCompany: String(row?.group_company ?? 'a_definir'),
      groupCompanyConfirmed: row?.group_company_source === 'confirmed',
      waitingThirdParty: Number(row?.waiting_third_party ?? 0),
      unowned: Number(row?.unowned ?? 0),
      waitingUndecided: Number(row?.waiting_undecided ?? 0),
      role: typeof row?.queue_role === 'string' ? row.queue_role : 'a_classificar',
      inQueue: Number(row?.in_queue ?? 0),
      stagnant: Number(row?.stagnant ?? 0),
      unknownActivity: Number(row?.unknown_activity ?? 0),
      stagnantRate: row?.stagnant_rate === null || row?.stagnant_rate === undefined
        ? null
        : Number(row.stagnant_rate),
      suggestsInbox: row?.suggests_inbox === true,
      arrived30d: Number(row?.arrived_30d ?? 0),
      medianAgeDays: row?.median_age_days === null || row?.median_age_days === undefined
        ? null
        : Number(row.median_age_days),
    }));

  const ageBuckets = (Array.isArray(payload.age_buckets) ? payload.age_buckets : [])
    .map((row) => ({
      bucket: String(row?.bucket ?? ''),
      tickets: Number(row?.tickets ?? 0),
      order: Number(row?.sort_order ?? 99),
    }))
    .filter((row) => row.bucket !== '' && row.tickets > 0)
    .sort((a, b) => a.order - b.order);

  const byGroupCompany = (Array.isArray(payload.by_group_company) ? payload.by_group_company : [])
    .map((row) => ({
      company: String(row?.group_company ?? 'a_definir'),
      pipelines: Number(row?.pipelines ?? 0),
      inQueue: Number(row?.in_queue ?? 0),
      unowned: Number(row?.unowned ?? 0),
      waitingThirdParty: Number(row?.waiting_third_party ?? 0),
      confirmedPipelines: Number(row?.confirmed_pipelines ?? 0),
    }));

  return {
    ageBuckets,
    byGroupCompany,
    waitingThirdParty: Number(payload.total_waiting_third_party ?? 0),
    unowned: Number(payload.total_unowned ?? 0),
    waitingUndecided: Number(payload.total_waiting_undecided ?? 0),
    available: payload.available === true,
    threshold,
    inQueue,
    stagnant,
    unknown,
    measured: Number(payload.measured ?? 0),
    stagnantRate: payload.stagnant_rate === null || payload.stagnant_rate === undefined
      ? null
      : Number(payload.stagnant_rate),
    moving: Number(payload.moving ?? 0),
    partial: payload.partial === true,
    coverageWarning: typeof payload.coverage_warning === 'string' ? payload.coverage_warning : null,
    pipelines,
    classified,
    total,
    notice: typeof payload.notice === 'string' ? payload.notice : null,
  };
}
