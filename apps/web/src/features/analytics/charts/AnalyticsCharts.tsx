import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  CommercialFunnelStage,
  CommercialMonthlyPoint,
  CsByStatus,
  CsMonthlyPoint,
} from '../analytics-model';
import { formatCurrencyBRL, formatMonthLabel } from '../analytics-model';

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

export function CommercialFunnelChart({ data }: { data: CommercialFunnelStage[] }) {
  const rows = data.map((stage) => ({
    name: stage.label,
    deals: stage.dealCount,
    isWon: stage.isWon,
    isClosed: stage.isClosed,
  }));

  return (
    <ChartFrame height={Math.max(220, rows.length * 42)}>
      <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
        <CartesianGrid horizontal={false} stroke={PALETTE.grid} />
        <XAxis type="number" allowDecimals={false} tick={AXIS_STYLE} />
        <YAxis type="category" dataKey="name" width={150} tick={AXIS_STYLE} />
        <Tooltip
          formatter={(value: number) => [`${value} deals`, 'Deals']}
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

export function CommercialMonthlyChart({ data }: { data: CommercialMonthlyPoint[] }) {
  const rows = data.map((point) => ({
    name: formatMonthLabel(point.monthStart),
    Criados: point.createdCount,
    Ganhos: point.wonCount,
  }));

  return (
    <ChartFrame>
      <LineChart data={rows} margin={{ left: 4, right: 16, top: 8, bottom: 8 }}>
        <CartesianGrid stroke={PALETTE.grid} />
        <XAxis dataKey="name" tick={AXIS_STYLE} />
        <YAxis allowDecimals={false} tick={AXIS_STYLE} />
        <Tooltip cursor={{ stroke: PALETTE.grid }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="Criados" stroke={PALETTE.primary} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="Ganhos" stroke={PALETTE.won} strokeWidth={2} dot={false} />
      </LineChart>
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

  return (
    <ChartFrame height={Math.max(220, rows.length * 42)}>
      <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
        <CartesianGrid horizontal={false} stroke={PALETTE.grid} />
        <XAxis type="number" allowDecimals={false} tick={AXIS_STYLE} />
        <YAxis type="category" dataKey="name" width={150} tick={AXIS_STYLE} />
        <Tooltip
          formatter={(value: number) => [`${value} tickets`, 'Total consolidado']}
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

export function TicketMonthlyChart({ data }: { data: CsMonthlyPoint[] }) {
  const rows = data.map((point) => ({
    name: formatMonthLabel(point.monthStart),
    Criados: point.createdCount,
    Encerrados: point.closedCount,
  }));

  return (
    <ChartFrame>
      <LineChart data={rows} margin={{ left: 4, right: 16, top: 8, bottom: 8 }}>
        <CartesianGrid stroke={PALETTE.grid} />
        <XAxis dataKey="name" tick={AXIS_STYLE} />
        <YAxis allowDecimals={false} tick={AXIS_STYLE} />
        <Tooltip cursor={{ stroke: PALETTE.grid }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="Criados" stroke={PALETTE.primary} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="Encerrados" stroke={PALETTE.neutral} strokeWidth={2} dot={false} />
      </LineChart>
    </ChartFrame>
  );
}

export { formatCurrencyBRL };
