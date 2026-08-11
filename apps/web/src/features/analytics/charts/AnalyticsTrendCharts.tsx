import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrencyBRL } from '../analytics-model';

/**
 * Gráficos de evolução.
 *
 * Quatro decisões, cada uma corrigindo um jeito específico de o gráfico mentir.
 *
 * **A linha é reta entre pontos medidos.** Interpolação suave (`monotone`)
 * desenha picos e vales entre dois meses que ninguém mediu. Numa série mensal
 * esparsa isso é invenção visual: a curva afirma uma trajetória que o dado não
 * contém. Segmento reto liga o que foi medido e não sugere nada no meio.
 *
 * **Medidas de ordem de grandeza diferente ficam em eixos diferentes.** Uma fila
 * acumulada na casa dos milhares no mesmo eixo de contagens mensais na casa das
 * centenas esmaga as barras contra o zero e as torna ilegíveis.
 *
 * **Toda série tem legenda.** Sem ela o leitor vê duas cores e não sabe qual é
 * ganho e qual é perda — e a suposição natural, de que a barra maior é a boa,
 * costuma estar errada.
 *
 * **O saldo é a informação principal, não a soma de duas barras.** Aberturas e
 * encerramentos lado a lado não respondem "a fila cresceu ou diminuiu". O
 * acumulado responde, e tem linha de referência no zero — sem ela, um saldo
 * negativo parece apenas uma barra menor.
 */

const eixo = {
  stroke: 'var(--minimal-text-tertiary)',
  fontSize: 11,
};

const grade = { stroke: 'var(--minimal-border)', strokeDasharray: '3 3' };

const caixaTooltip = {
  background: 'var(--minimal-surface)',
  border: '1px solid var(--minimal-border-strong)',
  borderRadius: '0.5rem',
  fontSize: '0.72rem',
  padding: '0.5rem 0.65rem',
};

const legenda = { fontSize: '0.72rem', paddingTop: '0.25rem' };

const COR = {
  entrada: 'var(--minimal-border-strong)',
  positivo: 'var(--minimal-action)',
  atencao: 'var(--minimal-warning-text)',
  critico: 'var(--minimal-danger-text)',
  apoio: 'var(--minimal-surface-muted)',
};

function rotuloPeriodo(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
}

const contagem = (value: number) => value.toLocaleString('pt-BR');

/** Compacta valores grandes no eixo sem perder a ordem de grandeza. */
function moedaCurta(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`;
  if (Math.abs(value) >= 1000) return `${Math.round(value / 1000).toLocaleString('pt-BR')} mil`;
  return value.toLocaleString('pt-BR');
}

export interface SupportTrendPoint {
  period: string;
  opened: number;
  resolved: number;
  balance: number;
  cumulative_balance: number;
  median_resolution_days: number | null;
}

export function SupportTrendChart({ data }: { data: SupportTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid {...grade} yAxisId="mes" vertical={false} />
        <XAxis dataKey="period" tickFormatter={rotuloPeriodo} {...eixo} tickLine={false} axisLine={false} />
        <YAxis yAxisId="mes" {...eixo} tickLine={false} axisLine={false} width={48} tickFormatter={contagem} />
        {/* A fila acumulada vive em eixo próprio: ela cresce em ordem de
            grandeza maior que o movimento de um mês e, compartilhando escala,
            achataria as barras contra o zero. */}
        <YAxis
          yAxisId="fila"
          orientation="right"
          {...eixo}
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={contagem}
        />
        <Tooltip
          contentStyle={caixaTooltip}
          labelFormatter={(value) => rotuloPeriodo(String(value))}
          formatter={(value, name) => [typeof value === 'number' ? contagem(value) : '—', name ?? '']}
        />
        <Legend wrapperStyle={legenda} iconType="circle" iconSize={8} />
        <ReferenceLine yAxisId="mes" y={0} stroke="var(--minimal-border-strong)" />
        <Bar yAxisId="mes" dataKey="opened" name="Abertos no mês" fill={COR.entrada} radius={[3, 3, 0, 0]} maxBarSize={22} />
        <Bar yAxisId="mes" dataKey="resolved" name="Encerrados no mês" fill={COR.positivo} radius={[3, 3, 0, 0]} maxBarSize={22} />
        <Line
          yAxisId="fila"
          type="linear"
          dataKey="cumulative_balance"
          name="Fila acumulada"
          stroke={COR.atencao}
          strokeWidth={2}
          dot={{ r: 2 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export interface CommercialTrendPoint {
  period: string;
  created: number;
  won: number;
  lost: number;
  won_amount: number;
  win_rate: number | null;
}

export function CommercialTrendChart({ data }: { data: CommercialTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid {...grade} yAxisId="qtd" vertical={false} />
        <XAxis dataKey="period" tickFormatter={rotuloPeriodo} {...eixo} tickLine={false} axisLine={false} />
        <YAxis yAxisId="qtd" {...eixo} tickLine={false} axisLine={false} width={44} tickFormatter={contagem} />
        <YAxis
          yAxisId="taxa"
          orientation="right"
          {...eixo}
          tickLine={false}
          axisLine={false}
          width={44}
          unit="%"
        />
        <Tooltip
          contentStyle={caixaTooltip}
          labelFormatter={(value) => rotuloPeriodo(String(value))}
          formatter={(value, name) =>
            typeof value !== 'number'
              ? ['—', name ?? '']
              : name === 'Taxa de ganho'
                ? [`${value.toLocaleString('pt-BR')}%`, name]
                : [contagem(value), name ?? '']
          }
        />
        <Legend wrapperStyle={legenda} iconType="circle" iconSize={8} />
        {/* Ganho antes de perda, e em cor de destaque: a ordem da legenda é a
            ordem em que a pergunta é feita. */}
        <Bar yAxisId="qtd" dataKey="won" name="Ganhos" fill={COR.positivo} radius={[3, 3, 0, 0]} maxBarSize={20} />
        <Bar yAxisId="qtd" dataKey="lost" name="Perdidos" fill={COR.entrada} radius={[3, 3, 0, 0]} maxBarSize={20} />
        <Line
          yAxisId="taxa"
          type="linear"
          dataKey="win_rate"
          name="Taxa de ganho"
          stroke={COR.atencao}
          strokeWidth={2}
          dot={{ r: 2 }}
          // Mês sem nada encerrado não tem taxa. Ligar os pontos por cima da
          // lacuna afirmaria uma continuidade que não existe.
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export interface FinanceTrendPoint {
  period: string;
  received: number;
  expected: number;
  overdue: number;
}

export function FinanceTrendChart({ data }: { data: FinanceTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
        <CartesianGrid {...grade} yAxisId="mov" vertical={false} />
        <XAxis dataKey="period" tickFormatter={rotuloPeriodo} {...eixo} tickLine={false} axisLine={false} />
        <YAxis yAxisId="mov" {...eixo} tickLine={false} axisLine={false} width={64} tickFormatter={moedaCurta} />
        {/* O previsto de um mês de vencimento concentrado é ordem de grandeza
            maior que a movimentação típica; em eixo comum ele apaga as barras. */}
        <YAxis
          yAxisId="previsto"
          orientation="right"
          {...eixo}
          tickLine={false}
          axisLine={false}
          width={64}
          tickFormatter={moedaCurta}
        />
        <Tooltip
          contentStyle={caixaTooltip}
          labelFormatter={(value) => rotuloPeriodo(String(value))}
          formatter={(value, name) => [typeof value === 'number' ? formatCurrencyBRL(value) : '—', name ?? '']}
        />
        <Legend wrapperStyle={legenda} iconType="circle" iconSize={8} />
        <Area
          yAxisId="previsto"
          type="linear"
          dataKey="expected"
          name="Previsto pelo vencimento"
          stroke={COR.entrada}
          fill={COR.apoio}
          strokeWidth={1.5}
        />
        <Bar yAxisId="mov" dataKey="received" name="Recebido" fill={COR.positivo} radius={[3, 3, 0, 0]} maxBarSize={22} />
        <Bar yAxisId="mov" dataKey="overdue" name="Vencido sem baixa" fill={COR.critico} radius={[3, 3, 0, 0]} maxBarSize={22} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
