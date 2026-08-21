export function normalizeAnalyticsScopeValue(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
}

export function selectedAnalyticsPipelineIds(configs, operation, excludedPipelineIds = []) {
  const excluded = new Set(excludedPipelineIds);
  const normalizedOperation = normalizeAnalyticsScopeValue(operation);
  return configs
    .filter((config) => !normalizedOperation || normalizeAnalyticsScopeValue(config.groupCompany) === normalizedOperation)
    .map((config) => config.pipelineId)
    .filter((pipelineId) => pipelineId && !excluded.has(pipelineId));
}

export function commercialStageCatalogFilters(filters) {
  const value = filters && typeof filters === 'object' ? filters : {};
  return { ...value, ownerId: '', stageId: '' };
}

export function buildCommercialStageQueryPlan(filters, excludedPipelineIds = [], groupCompany = null) {
  const dataFilters = { ...(filters && typeof filters === 'object' ? filters : {}) };
  const catalogFilters = dataFilters.ownerId || dataFilters.stageId
    ? commercialStageCatalogFilters(dataFilters)
    : null;
  const buildRequest = (requestFilters) => ({
    filters: requestFilters,
    excludedPipelineIds: [...excludedPipelineIds],
    groupCompany,
  });
  return {
    data: buildRequest(dataFilters),
    catalog: catalogFilters ? buildRequest(catalogFilters) : null,
  };
}

export function readAnalyticsStageScope(rows, selectedPipelineIds) {
  const selected = new Set(selectedPipelineIds.filter(Boolean));
  const options = [];
  let partial = false;
  let omitted = 0;

  for (const row of Array.isArray(rows) ? rows : []) {
    const breakdown = Array.isArray(row?.pipelineBreakdown) ? row.pipelineBreakdown : null;
    if (!breakdown) {
      partial = true;
      omitted += 1;
      continue;
    }

    const compatible = breakdown.filter((item) => selected.has(String(item?.pipelineId ?? '')) && String(item?.stageId ?? ''));
    if (compatible.length === 0) continue;

    const stageIds = [...new Set(compatible.map((item) => String(item.stageId)))];
    options.push({
      value: stageIds.join(','),
      label: String(row?.label ?? 'Etapa sem nome'),
    });
  }

  const deduped = [...new Map(options.map((option) => [option.value, option])).values()];
  return {
    options: deduped,
    partial,
    omitted,
    notice: partial
      ? 'Algumas etapas não puderam ser vinculadas aos pipelines deste recorte e foram mantidas fora do filtro.'
      : selected.size === 0
        ? 'Nenhum pipeline está selecionado para oferecer etapas compatíveis.'
        : null,
  };
}

export function hasCompatibleAnalyticsStage(rows, selectedPipelineIds, stageId) {
  if (!stageId) return true;
  return readAnalyticsStageScope(rows, selectedPipelineIds).options.some((option) => option.value === stageId);
}

export function composeCommercialStageView(dataSnapshot, catalogSnapshot, selectedPipelineIds) {
  const data = dataSnapshot && typeof dataSnapshot === 'object' ? dataSnapshot : {};
  const catalog = catalogSnapshot && typeof catalogSnapshot === 'object' ? catalogSnapshot : data;
  return {
    stageScope: readAnalyticsStageScope(catalog.funnel, selectedPipelineIds),
    dataState: data.state,
  };
}

export function applyCommercialStageScope(snapshot, payload) {
  const raw = payload && typeof payload === 'object' ? payload : {};
  const rawRows = Array.isArray(raw.funnel) ? raw.funnel : [];
  const breakdownByStage = new Map(
    rawRows.map((row) => {
      const item = row && typeof row === 'object' ? row : {};
      const key = `${String(item.stage_id ?? '')}\u0000${String(item.label ?? '')}`;
      const breakdown = Array.isArray(item.pipeline_breakdown)
        ? item.pipeline_breakdown.map((entry) => {
          const value = entry && typeof entry === 'object' ? entry : {};
          return {
            pipelineId: String(value.pipeline_id ?? ''),
            pipelineLabel: String(value.pipeline_label ?? ''),
            stageId: String(value.stage_id ?? ''),
            dealCount: Number(value.deal_count ?? 0),
          };
        })
        : null;
      return [key, breakdown];
    }),
  );

  return {
    ...snapshot,
    funnel: Array.isArray(snapshot?.funnel)
      ? snapshot.funnel.map((stage) => ({
        ...stage,
        pipelineBreakdown: breakdownByStage.get(`${stage.stageId}\u0000${stage.label}`),
      }))
      : [],
  };
}
