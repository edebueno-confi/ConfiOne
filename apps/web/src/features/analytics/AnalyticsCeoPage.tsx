import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type {
  AnalyticsDataStatus,
  AnalyticsBlockState,
} from "@genius-support-os/contracts";
import { getAnalyticsSourceStatus, getCeoHistory, getCeoSnapshot } from "./analytics-api";
import type {
  AnalyticsFilters,
  AnalyticsPageProps,
  CeoHistory,
  CeoSnapshot,
} from "./analytics-model";
import type { AnalyticsSourceStatusPayload } from "@genius-support-os/contracts";
import {
  analyticsGlobalToBlockState,
  analyticsSourceToBlockState,
  DEFAULT_ANALYTICS_FILTERS,
} from "./analytics-model";
import { AnalyticsFilters as Filters } from "./AnalyticsFilters";
import {
  AnalyticsLoadingState,
  AnalyticsRetryAction,
  formatCountLabel,
} from "./analytics-ui";
import { resolveAnalyticsPeriod } from "./analytics-periods";
import {
  buildExecutiveExceptions,
  rankExecutivePipelines,
} from "./analytics-executive";
import { analyticsHref } from "./analytics-navigation";

const STATUS_LABELS: Record<AnalyticsDataStatus, string> = {
  fresh: "Dados atualizados",
  stale: "Dados podem estar atrasados",
  partial: "Cobertura parcial",
  never_synced: "Sincronização ainda não realizada",
  empty: "Sem registros no recorte",
  zero: "Zero real no recorte",
  not_configured: "Fonte não configurada",
  syncing: "Sincronização em andamento",
  unavailable: "Fonte indisponível",
  failed: "Falha na sincronização",
  error: "Falha na sincronização",
  unavailable_source: "Fonte indisponível",
  unavailable_contract: "Contrato indisponível",
  unavailable_period: "Período indisponível",
};

type MetricDelta = {
  label: string;
  tone: "positive" | "negative" | "neutral";
} | null;
export function AnalyticsCeoPage({
  sharedPeriod,
  onSharedPeriodChange,
  onRetry,
  isDashboardViewer = false,
  sourceStatus,
}: AnalyticsPageProps) {
  const period = sharedPeriod ?? resolveAnalyticsPeriod("month");
  const [filters, setFilters] = useState<AnalyticsFilters>({
    ...DEFAULT_ANALYTICS_FILTERS,
    ...period,
  });
  const [result, setResult] = useState<{
    loading: boolean;
    data?: CeoSnapshot;
    history?: CeoHistory;
    sourceStatus?: AnalyticsSourceStatusPayload;
    error?: boolean;
  }>({ loading: true });
  const [refreshing, setRefreshing] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(
    () => setFilters((current) => ({ ...current, ...period })),
    [period.from, period.to],
  );
  useEffect(() => {
    let cancelled = false;
    setRefreshing(true);
    setResult((current) =>
      current.data
        ? { ...current, loading: false, error: undefined }
        : { loading: true },
    );
    Promise.all([getCeoSnapshot(filters), getCeoHistory(filters), sourceStatus ? Promise.resolve(sourceStatus) : getAnalyticsSourceStatusSafe()])
      .then(([data, history, liveSourceStatus]) => {
        if (!cancelled) {
          setResult({ loading: false, data, history, sourceStatus: liveSourceStatus ?? sourceStatus });
          setRefreshing(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResult((current) => ({ ...current, loading: false, error: true }));
          setRefreshing(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  if (result.loading && !result.data)
    return (
      <AnalyticsLoadingState
        title="O Gênio está alinhando os sinais das fontes"
        description="Ele está cruzando as leituras publicadas; o cockpit volta assim que houver um estado confiável."
      />
    );
  if (result.error || !result.data)
    return (
      <StatePanel
        title="Não foi possível carregar a visão executiva"
        description="Os indicadores estão indisponíveis no momento. Tente novamente."
        onRetry={onRetry}
      />
    );

  const data = result.data;
  const currentSourceStatus = result.sourceStatus ?? sourceStatus;
  const state = currentSourceStatus ? analyticsGlobalToBlockState(currentSourceStatus) : data.state;
  const exceptions = buildExecutiveExceptions(data);
  const pipelines = rankExecutivePipelines(data.support.byPipeline);
  const snapshotUnavailable = [
    "empty",
    "never_synced",
    "syncing",
    "unavailable",
    "failed",
    "error",
    "not_configured",
  ].includes(state?.status ?? "unavailable");
  const hubspotUnavailable = currentSourceStatus ? !hasUsableSnapshot(currentSourceStatus.hubspot.status, currentSourceStatus.hubspot.lastSuccessAt, currentSourceStatus.hubspot.hasValidSnapshot) : snapshotUnavailable;
  const omieUnavailable = currentSourceStatus ? !hasUsableSnapshot(currentSourceStatus.omie.status, currentSourceStatus.omie.lastSuccessAt, currentSourceStatus.omie.hasValidSnapshot) : snapshotUnavailable;
  const history = result.history;
  const comparison =
    history && !hubspotUnavailable
      ? {
          revenue: buildDelta(
            data.commercial.wonRevenue,
            history.previous.commercial.wonRevenue,
            "currency",
          ),
          deals: buildDelta(
            data.commercial.wonDeals,
            history.previous.commercial.wonDeals,
            "count",
          ),
          conversion: buildPercentagePointDelta(
            data.commercial.conversionRate,
            history.previous.commercial.conversionRate,
            data.commercial.wonDeals + data.commercial.lostDeals,
            history.previous.commercial.wonDeals +
              history.previous.commercial.lostDeals,
          ),
          tickets: buildDelta(
            data.support.createdTickets,
            history.previous.support.createdTickets,
            "count",
          ),
        }
      : { revenue: null, deals: null, conversion: null, tickets: null };
  const applyFilters = (next: AnalyticsFilters) => {
    setFilters(next);
    onSharedPeriodChange?.({ from: next.from, to: next.to });
    setMobileFiltersOpen(false);
  };
  const domainCards = buildDomainCards(
    data,
    hubspotUnavailable,
    omieUnavailable,
    currentSourceStatus,
  );

  return (
    <ExecutiveHdCanvas
      data={data}
      state={state}
      filters={filters}
      domainCards={domainCards}
      exceptions={exceptions}
      pipelines={pipelines}
      comparison={comparison}
      unavailable={hubspotUnavailable}
      financeUnavailable={omieUnavailable}
      refreshing={refreshing}
      mobileFiltersOpen={mobileFiltersOpen}
      setMobileFiltersOpen={setMobileFiltersOpen}
      applyFilters={applyFilters}
      isDashboardViewer={isDashboardViewer}
    />
  );
}

type DomainCard = {
  key: string;
  title: string;
  description: string;
  value: string;
  details: string;
  href: string;
  state: AnalyticsBlockState | undefined;
  tone: "blue" | "cyan" | "pink" | "green" | "muted";
};

function buildDomainCards(
  data: CeoSnapshot,
  hubspotUnavailable: boolean,
  omieUnavailable: boolean,
  sourceStatus?: AnalyticsSourceStatusPayload,
): DomainCard[] {
  const hubspotState = sourceStatus
    ? analyticsSourceToBlockState(sourceStatus.hubspot)
    : data.state;
  const omieState = sourceStatus
    ? analyticsSourceToBlockState(sourceStatus.omie)
    : data.state;

  return [
    {
      key: "commercial",
      title: "Comercial",
      description: "Pipeline e conversão",
      value: hubspotUnavailable
        ? "Indisponível"
        : formatCurrency(data.commercial.openPipelineValue),
      details: hubspotUnavailable
        ? "Dados comerciais indisponíveis"
        : `${formatCountLabel(data.commercial.openDeals, "negócio aberto", "negócios abertos")} · ${data.commercial.avgSalesCycleDays > 0 ? `${Math.round(data.commercial.avgSalesCycleDays).toLocaleString("pt-BR")} dias de ciclo` : "ciclo indisponível"}`,
      href: analyticsHref("commercial"),
      state: hubspotState,
      tone: "blue",
    },
    {
      key: "customer_success",
      title: "Customer Success",
      description: "Carteira e cobertura",
      value: "Indisponível",
      details: "Dados de carteira ainda não consolidados",
      href: analyticsHref("customer-success"),
      state: { ...data.customerSuccess.state, status: "unavailable", reason: "O denominador de cliente ativo ainda não foi confirmado." },
      tone: "pink",
    },
    {
      key: "support",
      title: "Suporte",
      description: "Volume e risco da fila",
      value: hubspotUnavailable
        ? "Indisponível"
        : formatCountLabel(
            data.support.highPriorityOpen,
            "alta prioridade",
            "altas prioridades",
          ),
      details: hubspotUnavailable
        ? "Dados de suporte indisponíveis"
        : `${formatPercent(data.support.closedRate)} encerrados · ${formatCountLabel(data.support.closeSlaTracked, "SLA acompanhado", "SLAs acompanhados")}`,
      href: analyticsHref("support"),
      state: hubspotState,
      tone: "cyan",
    },
    {
      key: "finance",
      title: "Financeiro",
      description: "Fluxo e reconciliação",
      value: omieUnavailable
        ? "Indisponível"
        : formatCountLabel(
            data.finance.unmatchedTitles,
            "título sem correspondência",
            "títulos sem correspondência",
          ),
      details: omieUnavailable ? "Dados financeiros indisponíveis" : `${formatCurrency(data.finance.balance)} em posição atual`,
      href: analyticsHref("finance"),
      state: omieState,
      tone: "green",
    },
  ];
}

function ExecutiveHdCanvas({
  data,
  state,
  filters,
  domainCards,
  exceptions,
  pipelines,
  comparison,
  unavailable,
  financeUnavailable,
  refreshing,
  mobileFiltersOpen,
  setMobileFiltersOpen,
  applyFilters,
  isDashboardViewer,
}: {
  data: CeoSnapshot;
  state?: AnalyticsBlockState;
  filters: AnalyticsFilters;
  domainCards: DomainCard[];
  exceptions: ReturnType<typeof buildExecutiveExceptions>;
  pipelines: ReturnType<typeof rankExecutivePipelines>;
  comparison: {
    revenue: MetricDelta;
    deals: MetricDelta;
    conversion: MetricDelta;
    tickets: MetricDelta;
  };
  unavailable: boolean;
  financeUnavailable: boolean;
  refreshing: boolean;
  mobileFiltersOpen: boolean;
  setMobileFiltersOpen: (value: boolean) => void;
  applyFilters: (next: AnalyticsFilters) => void;
  isDashboardViewer: boolean;
}) {
  const periodLabel = formatPeriod(filters);
  const qualityExpected = state?.coverage.expected;
  const qualityReceived = state?.coverage.received;
  const qualityLabel =
    qualityExpected !== null &&
    qualityExpected !== undefined &&
    qualityReceived !== null &&
    qualityReceived !== undefined
      ? `${qualityReceived.toLocaleString("pt-BR")}/${qualityExpected.toLocaleString("pt-BR")} recebidos`
      : "Cobertura não informada";

  return (
    <div className="gso-hd-canvas gso-pilot-summary gso-executive-canvas gso-visual-v1-overview" data-testid="executive-dashboard">
      <section className="gso-hd-context" aria-labelledby="executive-heading">
        <div>
          <div className="gso-hd-title-row">
            <h2 id="executive-heading">Visão Geral</h2>
          </div>
          <p>
            Desempenho no período, posição atual e sinais que merecem contexto.
          </p>
        </div>
      </section>

          <div className="gso-hd-filter-bar gso-hd-pulse" aria-label="Filtros da análise">
        <div className="gso-hd-filter-context">
          <span>Recorte</span>
          <strong>{periodLabel}</strong>
        </div>
        <button
          type="button"
          className="gso-hd-mobile-filter-button"
          aria-expanded={mobileFiltersOpen}
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
        >
          Filtros <span>{mobileFiltersOpen ? "−" : "+"}</span>
        </button>
        <div className={`gso-hd-filters ${mobileFiltersOpen ? "is-open" : ""}`}>
          <Filters value={filters} onApply={applyFilters} stageOptions={[]} />
        </div>
      </div>
      {refreshing ? (
        <p className="gso-hd-inline-status" role="status">
          Atualizando o período selecionado…
        </p>
      ) : null}
      {state?.status === "empty" ? (
        <p className="gso-hd-inline-status is-warning" role="status">
          Não há registros no período selecionado. O painel mantém a posição
          atual separada e não transforma ausência em zero.
        </p>
      ) : null}

      <section className="gso-hd-ribbon" aria-labelledby="performance-heading">
        <HdSectionHeading
          id="performance-heading"
          title="Desempenho no período"
          description="Sinais afetados pelo recorte selecionado."
        />
        <div className="gso-hd-metric-grid">
          <HdMetric
            label="Receita ganha"
            value={
              unavailable
                ? "Indisponível"
                : formatCurrency(data.commercial.wonRevenue)
            }
            detail={unavailable
              ? data.commercial.wonDeals > 0
                ? `${formatCountLabel(data.commercial.wonDeals, "negócio ganho", "negócios ganhos")}; valor não disponível`
                : "Valor da receita indisponível"
              : formatCountLabel(data.commercial.wonDeals, "negócio ganho", "negócios ganhos")}
            comparison={comparison.revenue?.label}
          />
          <HdMetric
            label="Negócios ganhos"
            value={
              unavailable
                ? "Indisponível"
                : data.commercial.wonDeals.toLocaleString("pt-BR")
            }
            detail={unavailable
              ? "Dados comerciais indisponíveis"
              : formatCountLabel(data.commercial.lostDeals, "negócio perdido", "negócios perdidos")}
            comparison={comparison.deals?.label}
          />
          <HdMetric
            label="Conversão"
            value={
              unavailable ||
              data.commercial.wonDeals + data.commercial.lostDeals === 0
                ? "Indisponível"
                : formatPercent(data.commercial.conversionRate)
            }
            detail={unavailable ? "Dados comerciais indisponíveis" : "Ganhos sobre ganhos e perdas"}
            comparison={comparison.conversion?.label}
          />
          <HdMetric
            label="Tickets criados"
            value={
              unavailable
                ? "Indisponível"
                : data.support.createdTickets.toLocaleString("pt-BR")
            }
            detail={unavailable
              ? "Contagem de tickets indisponível"
              : formatCountLabel(data.support.closedTickets, "ticket encerrado", "tickets encerrados")}
            comparison={comparison.tickets?.label}
          />
        </div>
      </section>

      <section
        className="gso-hd-current-strip"
        aria-labelledby="current-heading"
      >
        <HdSectionHeading
          id="current-heading"
          title="Posição atual"
          description="Posição atual, não afetada pelo período selecionado."
        />
        <div className="gso-hd-current-line">
          <HdMetric
            label="Saldo vencido"
            value={
              financeUnavailable
                ? "Indisponível"
                : formatCurrency(data.finance.overdueBalance)
            }
            detail={financeUnavailable
              ? "Dados financeiros indisponíveis"
              : formatCountLabel(data.finance.overdueTitles, "título vencido", "títulos vencidos")}
          />
          <HdMetric
            label="Clientes com alerta"
            value={
              financeUnavailable || unavailable
                ? "Indisponível"
                : data.financialAlerts.length.toLocaleString("pt-BR")
            }
            detail={financeUnavailable || unavailable ? "Reconciliação financeira indisponível" : "Inadimplência reconciliada"}
          />
          <HdMetric
            label="Tickets em aberto"
            value={
              unavailable
                ? "Indisponível"
                : data.support.openTickets.toLocaleString("pt-BR")
            }
            detail={unavailable
              ? "Contagem de tickets indisponível"
              : formatCountLabel(data.support.highPriorityOpen, "alta prioridade aberta", "altas prioridades abertas")}
          />
        </div>
      </section>

      <section
        className="gso-hd-domain-matrix"
        aria-labelledby="domains-heading"
      >
        <HdSectionHeading
          id="domains-heading"
          title="Mapa das áreas"
          description="Cada indicador mostra sua fonte e o estado do último snapshot válido."
        />
        <div className="gso-hd-domain-grid">
          {domainCards.map((card) => (
            <HdDomain key={card.key} card={card} />
          ))}
        </div>
      </section>

      <div className="gso-hd-lower-grid">
        <section
          className="gso-hd-integrity"
          aria-labelledby="integrity-heading"
        >
          <HdSectionHeading
            id="integrity-heading"
            title="Trilho de integridade"
            description="Qualidade e cobertura sem uma caixa administrativa separada."
          />
          <div className="gso-hd-integrity-line">
            <div>
              <span className="gso-hd-integrity-value">{qualityLabel}</span>
              <small>Cobertura geral do contrato</small>
            </div>
            <div>
              <span className="gso-hd-integrity-value">
                {data.dataQuality.unmatchedFinanceTitles.toLocaleString(
                  "pt-BR",
                )}
              </span>
              <small>Títulos sem correspondência</small>
            </div>
            <div>
              <span className="gso-hd-integrity-value">
                {data.dataQuality.supportUnassigned.toLocaleString("pt-BR")}
              </span>
              <small>Tickets sem responsável</small>
            </div>
          </div>
        </section>
        <section
          className="gso-hd-exceptions"
          aria-labelledby="exceptions-heading"
        >
          <HdSectionHeading
            id="exceptions-heading"
            title="Sinais gerenciais"
            description="Sinais operacionais separados da qualidade e do frescor dos dados."
          />
          {exceptions.length ? (
            <div className="gso-hd-signal-list">
              {exceptions.slice(0, 3).map((item) =>
                isDashboardViewer ? (
                  <div key={item.key} className="gso-hd-signal">
                    <span>{item.domain}</span>
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </div>
                ) : (
                  <Link key={item.key} to={item.href} className="gso-hd-signal">
                    <span>{item.domain}</span>
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </Link>
                ),
              )}
            </div>
          ) : (
            <p className="gso-hd-muted-row">
              Nenhuma exceção determinística no recorte.
            </p>
          )}
        </section>
      </div>

      <section className="gso-hd-pipelines" aria-labelledby="pipelines-heading">
        <div className="gso-hd-section-heading-inline">
          <HdSectionHeading
            id="pipelines-heading"
            title="Pipelines de Suporte prioritários"
            description="Composição do volume no período selecionado."
          />
          <span>
            {pipelines.length
              ? `${pipelines.length} encontrados`
              : "Sem atividade"}
          </span>
        </div>
        {pipelines.length ? (
          <div className="gso-hd-pipeline-table">
            <div className="gso-hd-pipeline-head">
              <span>Pipeline</span>
              <span>Domínio</span>
              <span>Volume</span>
            </div>
            {pipelines.slice(0, 5).map((pipeline) => (
              <Link
                key={pipeline.id}
                to={pipeline.href}
                className="gso-hd-pipeline-row"
              >
                <strong>{pipeline.label}</strong>
                <span>{pipeline.domain}</span>
                <b>{formatCountLabel(pipeline.count, "ticket", "tickets")} →</b>
              </Link>
            ))}
          </div>
        ) : (
          <p className="gso-hd-muted-row">
            Nenhum pipeline de Suporte com atividade no período selecionado.
          </p>
        )}
      </section>
    </div>
  );
}

function HdStatus({ state }: { state: AnalyticsBlockState }) {
  const lastValidLabel = (state.status === "failed" || state.status === "error") && state.lastSuccessfulSyncAt
    ? ` · dados válidos de ${new Date(state.lastSuccessfulSyncAt).toLocaleString("pt-BR")}`
    : "";
  return (
    <span className={`gso-hd-status ${statusTone(state.status)}`}>
      <i aria-hidden="true" />
      {shortStatus(state.status)}{lastValidLabel}
    </span>
  );
}
function HdMetric({
  label,
  value,
  detail,
  comparison,
}: {
  label: string;
  value: string;
  detail?: string;
  comparison?: string;
}) {
  return (
    <div className="gso-hd-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail ?? "Sem detalhe complementar"}</small>
      {comparison ? <em>{comparison}</em> : null}
    </div>
  );
}
function HdDomain({
  card,
}: {
  card: DomainCard;
}) {
  const body = (
    <>
      <div className="gso-hd-domain-top">
        <span
          className={`gso-hd-domain-mark ${card.tone}`}
          aria-hidden="true"
        />
        <HdStatus
          state={
            card.state ?? {
              status: "not_configured",
              source: card.details,
              asOf: null,
              lastSuccessfulSyncAt: null,
              syncRunId: null,
              coverage: { expected: null, received: null },
              reason: card.details,
            }
          }
        />
      </div>
      <h3>{card.title}</h3>
      <p>{card.description}</p>
      <strong>{card.value}</strong>
      <small>{card.details}</small>
      <span className="gso-hd-domain-link">Abrir domínio →</span>
    </>
  );
  return (
    <Link
      to={card.href}
      className={`gso-hd-domain ${card.tone === "muted" ? "is-muted" : ""}`}
    >
      {body}
    </Link>
  );
}
function HdSectionHeading({
  id,
  title,
  description,
}: {
  id: string;
  title: string;
  description: string;
}) {
  return (
    <div className="gso-hd-section-heading">
      <div>
        <h2 id={id}>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}
function StatePanel({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <section className="gso-hd-state-panel" role="alert">
      <h2>{title}</h2>
      <p>{description}</p>
      <AnalyticsRetryAction onRetry={onRetry} />
    </section>
  );
}
function statusTone(status?: AnalyticsDataStatus) {
  if (status === "fresh" || status === "zero") return "fresh";
  if (status === "stale" || status === "partial" || status === "syncing")
    return "warning";
  if (status === "error" || status === "failed" || status === "unavailable" || status === "never_synced") return "critical";
  return "muted";
}

function hasUsableSnapshot(status: AnalyticsSourceStatusPayload['globalStatus'], lastSuccessAt: string | null, hasValidSnapshot = false) {
  return Boolean(lastSuccessAt || hasValidSnapshot) && ['fresh', 'stale', 'partial', 'syncing', 'failed'].includes(status);
}

async function getAnalyticsSourceStatusSafe(): Promise<AnalyticsSourceStatusPayload | null> {
  try {
    return await getAnalyticsSourceStatus();
  } catch {
    return null;
  }
}
function shortStatus(status?: AnalyticsDataStatus) {
  return status ? STATUS_LABELS[status] : "Não conectado";
}
function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}
function formatPercent(value: number) {
  return `${(value * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}
function formatPeriod(filters: AnalyticsFilters) {
  return filters.from && filters.to
    ? `${formatDate(filters.from)} a ${formatDate(filters.to)}`
    : "Período padrão";
}
function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}
function buildDelta(
  current: number,
  previous: number,
  kind: "currency" | "count",
): MetricDelta {
  if (previous === 0) return null;
  const change = ((current - previous) / Math.abs(previous)) * 100;
  const sign = change > 0 ? "+" : "";
  const value =
    kind === "currency"
      ? `${sign}${change.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`
      : `${sign}${change.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
  return {
    label: `${value} vs. período anterior`,
    tone: change > 0 ? "positive" : change < 0 ? "negative" : "neutral",
  };
}
function buildPercentagePointDelta(
  current: number,
  previous: number,
  currentDenominator: number,
  previousDenominator: number,
): MetricDelta {
  if (currentDenominator === 0 || previousDenominator === 0) return null;
  const change = (current - previous) * 100;
  const sign = change > 0 ? "+" : "";
  return {
    label: `${sign}${change.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} p.p. vs. período anterior`,
    tone: change > 0 ? "positive" : change < 0 ? "negative" : "neutral",
  };
}
