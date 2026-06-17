import type { ReactNode } from 'react';
import { cx } from '../../../components/ui';

export interface SupportTicketQueueTab {
  key: string;
  label: string;
  count: number;
}

export function SupportTicketQueue({
  totalCount,
  search,
  onSearchChange,
  onReset,
  scope,
  onScopeChange,
  scopeCounts,
  tabs,
  activeTab,
  onTabChange,
  ticketsContent,
  pageLabel,
  currentPageLabel,
  canGoPrevious,
  canGoNext,
  onPreviousPage,
  onNextPage,
  searchIcon,
  filterIcon,
}: {
  totalCount: number;
  search: string;
  onSearchChange: (value: string) => void;
  onReset: () => void;
  scope: 'open' | 'closed';
  onScopeChange: (scope: 'open' | 'closed') => void;
  scopeCounts: {
    open: number;
    closed: number;
  };
  tabs: SupportTicketQueueTab[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
  ticketsContent: ReactNode;
  pageLabel: ReactNode;
  currentPageLabel: ReactNode;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  searchIcon: ReactNode;
  filterIcon: ReactNode;
}) {
  return (
    <aside className="hidden min-h-0 min-w-0 flex-col border-r border-[color:var(--minimal-border)] bg-[color:var(--minimal-sidebar)] xl:flex">
      <header className="shrink-0 border-b border-[color:var(--minimal-border)] px-3 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[color:var(--minimal-text)]">Caixa de entrada</h2>
          <span className="text-xs text-[color:var(--minimal-text-tertiary)]">{totalCount}</span>
        </div>
        <div className="mt-3 flex gap-2">
          <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-[color:var(--minimal-border-strong)] bg-[color:var(--minimal-surface)] px-2.5">
            <span className="text-[color:var(--minimal-text-tertiary)]">{searchIcon}</span>
            <input
              className="min-w-0 flex-1 bg-transparent text-sm text-[color:var(--minimal-text)] outline-none placeholder:text-[color:var(--minimal-text-tertiary)]"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar tickets..."
              value={search}
            />
          </label>
          <button
            aria-label="Limpar busca e filtros rápidos"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[color:var(--minimal-border-strong)] text-[color:var(--minimal-text-secondary)] hover:bg-[color:var(--minimal-surface-muted)]"
            onClick={onReset}
            title="Limpar busca e filtros rápidos"
            type="button"
          >
            {filterIcon}
          </button>
        </div>
        <div className="mt-3 flex border-b border-[color:var(--minimal-border)]" role="tablist" aria-label="Escopo da fila">
          {([
            ['open', 'Abertos', scopeCounts.open],
            ['closed', 'Fechados', scopeCounts.closed],
          ] as const).map(([key, label, count]) => (
            <button
              aria-selected={scope === key}
              className={cx(
                'min-h-9 flex-1 border-b-2 px-2 text-xs',
                scope === key
                  ? 'border-[color:var(--minimal-action)] font-medium text-[color:var(--minimal-text)]'
                  : 'border-transparent text-[color:var(--minimal-text-secondary)]',
              )}
              key={key}
              onClick={() => onScopeChange(key)}
              role="tab"
              type="button"
            >
              {label} {count}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {tabs.map((tab) => (
            <button
              className={cx(
                'min-h-8 text-xs',
                activeTab === tab.key
                  ? 'font-medium text-[color:var(--minimal-action)]'
                  : 'text-[color:var(--minimal-text-secondary)]',
              )}
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              type="button"
            >
              {tab.label} {tab.count}
            </button>
          ))}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">{ticketsContent}</div>

      <footer className="flex shrink-0 items-center justify-between border-t border-[color:var(--minimal-border)] px-3 py-2 text-xs text-[color:var(--minimal-text-tertiary)]">
        <span>{pageLabel}</span>
        <div className="flex items-center gap-1">
          <button
            aria-label="Página anterior da fila"
            className="h-8 w-8 rounded hover:bg-[color:var(--minimal-surface-muted)] disabled:opacity-40"
            disabled={!canGoPrevious}
            onClick={onPreviousPage}
            type="button"
          >
            ‹
          </button>
          <span className="min-w-6 text-center">{currentPageLabel}</span>
          <button
            aria-label="Próxima página da fila"
            className="h-8 w-8 rounded hover:bg-[color:var(--minimal-surface-muted)] disabled:opacity-40"
            disabled={!canGoNext}
            onClick={onNextPage}
            type="button"
          >
            ›
          </button>
        </div>
      </footer>
    </aside>
  );
}
