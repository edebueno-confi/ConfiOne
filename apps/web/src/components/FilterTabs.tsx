import { cx } from './ui';

export interface FilterTabItem {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

export function FilterTabs({
  items,
  activeId,
  onChange,
  ariaLabel,
  className,
}: {
  items: readonly FilterTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div aria-label={ariaLabel} className={cx('gso-filter-tabs flex flex-wrap gap-1.5', className)} role="group">
      {items.map((item) => {
        const active = item.id === activeId;

        return (
          <button
            aria-pressed={active}
            className={cx(
              'gso-filter-tab inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]',
              active
                ? 'gso-filter-tab--active border-[color:var(--minimal-action)] bg-[color:var(--minimal-selection)] text-[color:var(--minimal-selection-text)]'
                : 'border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] text-[color:var(--minimal-text-secondary)] hover:border-[color:var(--minimal-border-hover)] hover:bg-[color:var(--minimal-surface-muted)] hover:text-[color:var(--minimal-text)]',
            )}
            disabled={item.disabled}
            key={item.id}
            onClick={() => onChange(item.id)}
            type="button"
          >
            <span>{item.label}</span>
            {typeof item.count === 'number' ? (
              <span className={cx('gso-filter-tab__count tabular-nums', active ? 'text-[color:var(--minimal-selection-text)]' : 'text-[color:var(--minimal-text-tertiary)]')}>
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
