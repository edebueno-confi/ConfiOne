export type AnalyticsPeriodPreset = 'week' | 'month' | 'previous_month' | 'current_quarter' | 'previous_quarter' | 'year' | 'previous_year' | 'all';

function iso(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }

export function resolveAnalyticsPeriod(preset: AnalyticsPeriodPreset, now = new Date()): { from: string; to: string } {
  const current = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (preset === 'all') return { from: '', to: '' };
  if (preset === 'week') {
    const start = new Date(current);
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    return { from: iso(start), to: iso(current) };
  }
  if (preset === 'month') return { from: iso(new Date(current.getFullYear(), current.getMonth(), 1)), to: iso(current) };
  if (preset === 'previous_month') return { from: iso(new Date(current.getFullYear(), current.getMonth() - 1, 1)), to: iso(new Date(current.getFullYear(), current.getMonth(), 0)) };
  if (preset === 'year') return { from: iso(new Date(current.getFullYear(), 0, 1)), to: iso(current) };
  if (preset === 'previous_year') return { from: iso(new Date(current.getFullYear() - 1, 0, 1)), to: iso(new Date(current.getFullYear() - 1, 11, 31)) };
  const quarter = Math.floor(current.getMonth() / 3);
  if (preset === 'current_quarter') return { from: iso(new Date(current.getFullYear(), quarter * 3, 1)), to: iso(current) };
  return { from: iso(new Date(current.getFullYear(), (quarter - 1) * 3, 1)), to: iso(new Date(current.getFullYear(), quarter * 3, 0)) };
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
