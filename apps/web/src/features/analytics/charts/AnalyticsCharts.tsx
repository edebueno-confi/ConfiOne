import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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

function ChartFrame({ children, height = 260 }: { children: React.ReactElement; height?: number }) {
  return (
    <div style={{ width: '100%', height }}>
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
      <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
        <CartesianGrid horizontal={false} stroke={PALETTE.grid} />
        <XAxis type="number" allowDecimals={false} tick={AXIS_STYLE} />
        <YAxis type="category" dataKey="name" width={150} tick={AXIS_STYLE} />
        <Tooltip
          formatter={(value) => [typeof value === 'number' ? `${value} deals` : '—', 'Deals']}
          cursor={{ fill: PALETTE.cursor }}
        />
        <Bar dataKey="deals" radius={[0, 4, 4, 0]}>
          {rows.map((row, index) => (
            <Cell
              key={index}
              fill={row.isWon ? PALETTE.won : row.isClosed ? PALETTE.lost : PALETTE.primary}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}

export function TicketStatusChart({ data }: { data: CsByStatus[] }) {
  const rows = data.map((status) => ({
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
      <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
        <CartesianGrid horizontal={false} stroke={PALETTE.grid} />
        <XAxis type="number" allowDecimals={false} tick={AXIS_STYLE} />
        <YAxis type="category" dataKey="name" width={150} tick={AXIS_STYLE} />
        <Tooltip
          formatter={(value) => [typeof value === 'number' ? `${value} tickets` : '—', 'Total consolidado']}
          content={({ active, payload }) => {
            const row = payload?.[0]?.payload as (typeof rows)[number] | undefined;
            if (!active || !row) return null;
            return <div style={{ border: `1px solid ${PALETTE.grid}`, borderRadius: 8, background: 'var(--minimal-surface)', padding: '8px 10px', color: 'var(--minimal-text)', fontSize: 12 }}><strong>{row.name}</strong><div style={{ marginTop: 4 }}>{row.tickets.toLocaleString('pt-BR')} tickets consolidados</div>{row.pipelineBreakdown.length ? <div style={{ marginTop: 6, color: 'var(--minimal-text-secondary)' }}>{row.pipelineBreakdown.map((item) => <div key={`${item.pipelineId}-${item.pipelineLabel}`}>{item.pipelineLabel}: {item.ticketCount.toLocaleString('pt-BR')}</div>)}</div> : null}</div>;
          }}
          cursor={{ fill: PALETTE.cursor }}
        />
        <Bar dataKey="tickets" radius={[0, 4, 4, 0]}>
          {rows.map((row, index) => (
            <Cell key={index} fill={ticketStatusColor(row.name, row.isClosed)} />
          ))}
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
      <BarChart data={points} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
        <CartesianGrid horizontal={false} stroke={PALETTE.grid} />
        <XAxis type="number" allowDecimals={false} tick={AXIS_STYLE} />
        <YAxis type="category" dataKey="name" width={150} tick={AXIS_STYLE} />
        <Tooltip
          cursor={{ fill: PALETTE.cursor }}
          content={({ active, payload }) => {
            const row = payload?.[0]?.payload as (typeof points)[number] | undefined;
            if (!active || !row) return null;
            return <div style={{ border: `1px solid ${PALETTE.grid}`, borderRadius: 8, background: 'var(--minimal-surface)', padding: '8px 10px', color: 'var(--minimal-text)', fontSize: 12 }}>
              <strong>{row.name}</strong>
              <div style={{ marginTop: 4 }}>{row.tickets.toLocaleString('pt-BR')} aguardando atendimento</div>
              {row.byPipeline.length > 1 ? <div style={{ marginTop: 6, color: 'var(--minimal-text-secondary)' }}>{row.byPipeline.map((item) => <div key={item.pipelineLabel}>{item.pipelineLabel}: {item.openTickets.toLocaleString('pt-BR')}</div>)}</div> : null}
            </div>;
          }}
        />
        <Bar dataKey="tickets" radius={[0, 4, 4, 0]}>
          {points.map((row, index) => (
            // Etapa sem decisão de cruzamento fica em tom neutro: ela não é uma
            // etapa do processo, é uma pendência de configuração.
            <Cell key={index} fill={row.isUnclassified ? PALETTE.neutral : ticketStatusColor(row.name, false)} />
          ))}
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
