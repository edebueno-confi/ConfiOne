export type AnalyticsPeriodPreset = 'week' | 'month' | 'previous_month' | 'current_quarter' | 'previous_quarter' | 'year' | 'previous_year' | 'all';

export const ANALYTICS_TIMEZONE = 'America/Sao_Paulo';

type CalendarDateParts = { year: number; month: number; day: number };

function analyticsCalendarDate(now: Date): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ANALYTICS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now).reduce<Partial<Record<keyof CalendarDateParts, string>>>((result, part) => {
    if (part.type === 'year' || part.type === 'month' || part.type === 'day') result[part.type] = part.value;
    return result;
  }, {});

  return new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
}

function iso(date: Date) { return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`; }

export function resolveAnalyticsPeriod(preset: AnalyticsPeriodPreset, now = new Date()): { from: string; to: string } {
  const current = analyticsCalendarDate(now);
  if (preset === 'all') return { from: '', to: '' };
  if (preset === 'week') {
    const start = new Date(current);
    const day = start.getUTCDay() || 7;
    start.setUTCDate(start.getUTCDate() - day + 1);
    return { from: iso(start), to: iso(current) };
  }
  if (preset === 'month') return { from: iso(new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), 1))), to: iso(current) };
  if (preset === 'previous_month') return { from: iso(new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - 1, 1))), to: iso(new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), 0))) };
  if (preset === 'year') return { from: iso(new Date(Date.UTC(current.getUTCFullYear(), 0, 1))), to: iso(current) };
  if (preset === 'previous_year') return { from: iso(new Date(Date.UTC(current.getUTCFullYear() - 1, 0, 1))), to: iso(new Date(Date.UTC(current.getUTCFullYear() - 1, 11, 31))) };
  const quarter = Math.floor(current.getUTCMonth() / 3);
  if (preset === 'current_quarter') return { from: iso(new Date(Date.UTC(current.getUTCFullYear(), quarter * 3, 1))), to: iso(current) };
  return { from: iso(new Date(Date.UTC(current.getUTCFullYear(), (quarter - 1) * 3, 1))), to: iso(new Date(Date.UTC(current.getUTCFullYear(), quarter * 3, 0))) };
}

export function resolveAnalyticsTimeseriesPeriod(
  grain: 'day' | 'week' | 'month',
  now = new Date(),
): { from: string; to: string } {
  const to = analyticsCalendarDate(now);
  const from = new Date(to);
  if (grain === 'day') from.setUTCDate(from.getUTCDate() - 60);
  else if (grain === 'week') from.setUTCDate(from.getUTCDate() - 26 * 7);
  else from.setUTCMonth(from.getUTCMonth() - 11);
  from.setUTCDate(1);
  return { from: iso(from), to: iso(to) };
}

export const ANALYTICS_PERIOD_OPTIONS: { value: AnalyticsPeriodPreset; label: string }[] = [
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mês' },
  { value: 'previous_month', label: 'Mês passado' },
  { value: 'current_quarter', label: 'Trimestre atual' },
  { value: 'previous_quarter', label: 'Trimestre passado' },
  { value: 'year', label: 'Este ano' },
  { value: 'previous_year', label: 'Ano passado' },
  { value: 'all', label: 'Todo o período' },
];

export function matchAnalyticsPeriodPreset(
  value: { from: string; to: string },
  now = new Date(),
): AnalyticsPeriodPreset | '' {
  return ANALYTICS_PERIOD_OPTIONS.find((option) => {
    const period = resolveAnalyticsPeriod(option.value, now);
    return period.from === value.from && period.to === value.to;
  })?.value ?? '';
}
