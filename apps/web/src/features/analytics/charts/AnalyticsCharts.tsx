import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
} from 'recharts';
import {
  formatCurrencyBRL,
  type CommercialFunnelStage,
  type CsByStatus,
} from '../analytics-model';
import { UNCLASSIFIED_LABEL, type StageBreakdownRow } from '../analytics-stage-breakdown.mjs';

const PALETTE = {
  primary: 'var(--color-brand-blue)',
  won: 'var(--color-success-ink)',
  lost: 'var(--color-danger-ink)',
  waiting: 'var(--color-warning-ink)',
  neutral: 'var(--minimal-text-tertiary)',
  grid: 'var(--analytics-chart-grid)',
  axis: 'var(--analytics-chart-axis)',
  cursor: 'var(--analytics-chart-cursor)',
};

function ticketStatusColor(label: string, isClosed: boolean) {
  const normalized = label.toLocaleLowerCase('pt-BR');
  if (isClosed) return PALETTE.won;
  if (/aguardando|retorno|pendente|analis/.test(normalized)) return PALETTE.waiting;
  if (/cancel|erro|bloquead|cr[ií]tic/.test(normalized)) return PALETTE.lost;
  return PALETTE.primary;
}

const AXIS_STYLE = { fontSize: 11, fill: PALETTE.axis } as const;

function formatChartCount(value: unknown): string {
  return typeof value === 'number' ? value.toLocaleString('pt-BR') : '';
}

function ChartBarShape(props: BarShapeProps) {
  const row = (props.payload ?? {}) as {
    name?: string;
    kind?: 'funnel' | 'status' | 'stage';
    isWon?: boolean;
    isClosed?: boolean;
    isUnclassified?: boolean;
  };
  const fill = row.kind === 'funnel'
    ? row.isWon
      ? PALETTE.won
      : row.isClosed
        ? PALETTE.lost
        : PALETTE.primary
    : row.isUnclassified
      ? PALETTE.neutral
      : row.name
        ? ticketStatusColor(row.name, row.isClosed === true)
        : PALETTE.primary;

  return <Rectangle {...props} fill={fill} />;
}

function ChartTooltipContent({ title, value, details }: { title: string; value: string; details?: ReactNode }) {
  return (
    <div className="gso-chart-tooltip">
      <strong className="gso-chart-tooltip__title">{title}</strong>
      <div className="gso-chart-tooltip__value">{value}</div>
      {details ? <div className="gso-chart-tooltip__details">{details}</div> : null}
    </div>
  );
}

function ChartFrame({ children, height = 260 }: { children: React.ReactElement; height?: number }) {
  return (
    <div className="gso-chart-frame" style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

function CompactSummary({ title, rows, unit }: { title: string; rows: Array<{ label: string; value: number }>; unit: string }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  return <div className="gso-compact-chart-summary" aria-label={title}>
    {rows.map((row) => <div className="gso-compact-chart-row" key={row.label}>
      <span className="gso-compact-chart-label">{row.label}</span>
      <span className="gso-compact-chart-value">{row.value.toLocaleString('pt-BR')} {unit}</span>
      <span className="gso-compact-chart-share">{total ? `${Math.round((row.value / total) * 100)}%` : '0%'}</span>
    </div>)}
  </div>;
}

export function CommercialFunnelChart({ data }: { data: CommercialFunnelStage[] }) {
  const rows = data.map((stage) => ({
    kind: 'funnel' as const,
    name: stage.label,
    deals: stage.dealCount,
    isWon: stage.isWon,
    isClosed: stage.isClosed,
  }));

  if (rows.length <= 2) {
    return <CompactSummary title="Resumo do funil comercial" rows={rows.map((row) => ({ label: row.name, value: row.deals }))} unit="negócios" />;
  }

  return (
    <ChartFrame height={Math.max(220, rows.length * 42)}>
      <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 42, top: 8, bottom: 8 }}>
        <CartesianGrid horizontal={false} stroke={PALETTE.grid} />
        <XAxis type="number" allowDecimals={false} tick={AXIS_STYLE} />
        <YAxis type="category" dataKey="name" width="auto" tick={AXIS_STYLE} />
        <Tooltip
          formatter={(value) => [typeof value === 'number' ? `${value} deals` : '—', 'Deals']}
          cursor={{ fill: PALETTE.cursor }}
        />
        <Bar dataKey="deals" radius={[0, 5, 5, 0]} shape={ChartBarShape} activeBar={{ opacity: 0.76 }}>
          <LabelList
            dataKey="deals"
            position="right"
            offset={8}
            fill={PALETTE.axis}
            fontSize={11}
            fontWeight={600}
            formatter={formatChartCount}
          />
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}

export function TicketStatusChart({ data }: { data: CsByStatus[] }) {
  const rows = data.map((status) => ({
    kind: 'status' as const,
    name: status.label,
    tickets: status.ticketCount,
    isClosed: status.isClosed,
    pipelineBreakdown: status.pipelineBreakdown ?? [],
  }));

  if (rows.length <= 2) {
    return <CompactSummary title="Resumo dos tickets por status" rows={rows.map((row) => ({ label: row.name, value: row.tickets }))} unit="tickets" />;
  }

  return (
    <ChartFrame height={Math.max(220, rows.length * 42)}>
      <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 42, top: 8, bottom: 8 }}>
        <CartesianGrid horizontal={false} stroke={PALETTE.grid} />
        <XAxis type="number" allowDecimals={false} tick={AXIS_STYLE} />
        <YAxis type="category" dataKey="name" width="auto" tick={AXIS_STYLE} />
        <Tooltip
          formatter={(value) => [typeof value === 'number' ? `${value} tickets` : '—', 'Total consolidado']}
          content={({ active, payload }) => {
            const row = payload?.[0]?.payload as (typeof rows)[number] | undefined;
            if (!active || !row) return null;
            return (
              <ChartTooltipContent
                title={row.name}
                value={`${row.tickets.toLocaleString('pt-BR')} tickets consolidados`}
                details={row.pipelineBreakdown.length ? row.pipelineBreakdown.map((item) => <div key={`${item.pipelineId}-${item.pipelineLabel}`}>{item.pipelineLabel}: {item.ticketCount.toLocaleString('pt-BR')}</div>) : undefined}
              />
            );
          }}
          cursor={{ fill: PALETTE.cursor }}
        />
        <Bar dataKey="tickets" radius={[0, 5, 5, 0]} shape={ChartBarShape} activeBar={{ opacity: 0.76 }}>
          <LabelList
            dataKey="tickets"
            position="right"
            offset={8}
            fill={PALETTE.axis}
            fontSize={11}
            fontWeight={600}
            formatter={formatChartCount}
          />
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}

/**
 * Fila por etapa canônica.
 *
 * Difere do gráfico anterior em uma coisa que muda a leitura: as barras seguem a
 * ordem do fluxo de atendimento, não o volume. Ordenar por volume produz um
 * ranking; ordenar pelo fluxo mostra onde a fila se acumula dentro do processo,
 * que é a pergunta real.
 *
 * O tooltip abre a composição por pipeline porque uma barra consolidada precisa
 * poder ser auditada — quem vê "Em tratativa: 240" deve conseguir descobrir de
 * onde vieram os 240.
 */
export function SupportStageChart({ rows }: { rows: StageBreakdownRow[] }) {
  const points = rows.map((row) => ({
    kind: 'stage' as const,
    name: row.stage,
    tickets: row.openTickets,
    byPipeline: row.byPipeline,
    isUnclassified: row.stage === UNCLASSIFIED_LABEL,
  }));

  if (points.length <= 2) {
    return <CompactSummary title="Resumo da fila por etapa" rows={points.map((row) => ({ label: row.name, value: row.tickets }))} unit="atendimentos" />;
  }

  return (
    <ChartFrame height={Math.max(220, points.length * 42)}>
      <BarChart data={points} layout="vertical" margin={{ left: 8, right: 42, top: 8, bottom: 8 }}>
        <CartesianGrid horizontal={false} stroke={PALETTE.grid} />
        <XAxis type="number" allowDecimals={false} tick={AXIS_STYLE} />
        <YAxis type="category" dataKey="name" width="auto" tick={AXIS_STYLE} />
        <Tooltip
          cursor={{ fill: PALETTE.cursor }}
          content={({ active, payload }) => {
            const row = payload?.[0]?.payload as (typeof points)[number] | undefined;
            if (!active || !row) return null;
            return (
              <ChartTooltipContent
                title={row.name}
                value={`${row.tickets.toLocaleString('pt-BR')} aguardando atendimento`}
                details={row.byPipeline.length > 1 ? row.byPipeline.map((item) => <div key={item.pipelineLabel}>{item.pipelineLabel}: {item.openTickets.toLocaleString('pt-BR')}</div>) : undefined}
              />
            );
          }}
        />
        <Bar dataKey="tickets" radius={[0, 5, 5, 0]} shape={ChartBarShape} activeBar={{ opacity: 0.76 }}>
          <LabelList
            dataKey="tickets"
            position="right"
            offset={8}
            fill={PALETTE.axis}
            fontSize={11}
            fontWeight={600}
            formatter={formatChartCount}
          />
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}

// As séries mensais de suporte e comercial saíram daqui.
//
// Elas viviam na aba de posição, ao lado dos indicadores do recorte, e mediam a
// mesma coisa por outro caminho — a mesma duplicidade que produziu "Receita
// ganha" duas vezes com valores diferentes. A evolução agora tem sub-aba
// própria, janela própria e coorte declarada, em `AnalyticsTrendPanel`.

export { formatCurrencyBRL };
