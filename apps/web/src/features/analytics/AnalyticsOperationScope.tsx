import { useEffect, useMemo, useState } from 'react';

export interface AnalyticsOperationOption {
  value: string;
  source: 'pending' | 'suggested' | 'confirmed';
}

export function AnalyticsOperationScope({ storageKey, options, value, onChange }: { storageKey: string; options: AnalyticsOperationOption[]; value: string; onChange: (value: string) => void }) {
  const [restored, setRestored] = useState(false);
  const visible = useMemo(() => options.filter((option) => option.value && option.value !== 'a_definir'), [options]);

  useEffect(() => {
    if (restored || visible.length === 0) return;
    const saved = localStorage.getItem(storageKey) ?? '';
    if (saved === '' || visible.some((option) => option.value === saved)) onChange(saved);
    setRestored(true);
  }, [onChange, restored, storageKey, visible]);

  useEffect(() => {
    if (restored) localStorage.setItem(storageKey, value);
  }, [restored, storageKey, value]);

  if (visible.length === 0) return null;
  const selected = visible.find((option) => option.value === value);
  return <label className="flex min-w-[12rem] flex-1 basis-48 flex-col gap-1.5 text-xs font-medium text-[color:var(--minimal-text-secondary)]">
    Operacao
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-9 rounded-md border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-2.5 text-sm font-normal text-[color:var(--minimal-text)] outline-none transition focus:border-[color:var(--minimal-text-secondary)] focus:ring-2 focus:ring-[color:var(--minimal-border-strong)]">
      <option value="">Todas as operacoes</option>
      {visible.map((option) => <option key={option.value} value={option.value}>{option.value}{option.source === 'suggested' ? ' (sugerida)' : option.source === 'pending' ? ' (a definir)' : ''}</option>)}
    </select>
    {selected?.source === 'suggested' ? <span className="font-normal text-[10px] text-[color:var(--minimal-text-tertiary)]">Agrupamento sugerido; nao altera permissao.</span> : null}
  </label>;
}
