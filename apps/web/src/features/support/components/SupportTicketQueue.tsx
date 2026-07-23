import type { ReactNode } from 'react';
import { FilterTabs } from '../../../components/FilterTabs';

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
              aria-label="Buscar tickets"
              className="min-w-0 flex-1 bg-transparent text-sm text-[color:var(--minimal-text)] outline-none placeholder:text-[color:var(--minimal-text-tertiary)]"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar tickets..."
              value={search}
            />
          </label>
          <button
            aria-label="Limpar busca e filtros rápidos"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[color:var(--minimal-border-strong)] px-2.5 text-xs text-[color:var(--minimal-text-secondary)] hover:bg-[color:var(--minimal-surface-muted)] sm:px-3"
            onClick={onReset}
            title="Limpar busca e filtros rápidos"
            type="button"
          >
            {filterIcon}
            <span className="hidden sm:inline">Limpar filtros</span>
          </button>
        </div>
        <FilterTabs
          ariaLabel="Escopo da fila"
          className="mt-3"
          activeId={scope}
          items={[{ id: 'open', label: 'Abertos', count: scopeCounts.open }, { id: 'closed', label: 'Fechados', count: scopeCounts.closed }]}
          onChange={(id) => onScopeChange(id as 'open' | 'closed')}
        />
        <FilterTabs
          ariaLabel="Filtros da fila"
          className="mt-2"
          activeId={activeTab}
          items={tabs.map((tab) => ({ id: tab.key, label: tab.label, count: tab.count }))}
          onChange={onTabChange}
        />
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
