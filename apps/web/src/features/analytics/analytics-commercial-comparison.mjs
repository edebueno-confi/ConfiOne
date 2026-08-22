import { readKpi } from './analytics-kpi-contract.mjs';

export const COMMERCIAL_COMPARISON_METRICS = [
  { key: 'created_deals', label: 'Negócios criados', kind: 'count' },
  { key: 'won_deals', label: 'Negócios ganhos', kind: 'count' },
  { key: 'lost_deals', label: 'Negócios perdidos', kind: 'count' },
  { key: 'won_amount', label: 'Receita ganha', kind: 'currency' },
  { key: 'win_rate', label: 'Taxa de ganho', kind: 'percent', isRate: true },
];

function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return iso(date) === value ? date : null;
}

function iso(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

/**
 * Deriva o recorte anterior com a mesma quantidade de dias do recorte atual.
 * Períodos abertos não recebem uma comparação arbitrária.
 */
export function resolvePreviousComparablePeriod(period) {
  const from = parseDate(period?.from);
  const to = parseDate(period?.to);
  if (!from || !to || from > to) return null;
  const length = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
  const previousTo = addDays(from, -1);
  const previousFrom = addDays(previousTo, -(length - 1));
  return { from: iso(previousFrom), to: iso(previousTo) };
}

export function calculateComparisonDelta(current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  const absolute = current - previous;
  return {
    absolute,
    relativePercent: previous === 0 ? null : (absolute / Math.abs(previous)) * 100,
  };
}

function comparableEntry(payload, key) {
  const entry = readKpi(payload, key);
  return {
    ...entry,
    comparable: Number.isFinite(entry.value),
  };
}

export function buildCommercialComparisons(currentPayload, previousPayload) {
  return COMMERCIAL_COMPARISON_METRICS.map((metric) => {
    const current = comparableEntry(currentPayload, metric.key);
    const previous = comparableEntry(previousPayload, metric.key);
    return {
      ...metric,
      current,
      previous,
      delta: current.comparable && previous.comparable
        ? calculateComparisonDelta(current.value, previous.value)
        : null,
    };
  });
}
