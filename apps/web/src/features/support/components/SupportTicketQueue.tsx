import type { ReactNode } from 'react';
import { GhostButton, TextInput, cx } from '../../../components/ui';
import { SupportQueuePanel } from './SupportWorkspacePrimitives';

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
    <SupportQueuePanel
      content={ticketsContent}
      footer={
        <div className="flex items-center justify-between gap-2 text-[10.5px] text-[color:var(--color-muted)]">
          <span>{pageLabel}</span>
          <div className="flex items-center gap-1.5">
            <GhostButton
              className="min-h-7 min-w-7 rounded-[10px] px-0 text-[12px]"
              disabled={!canGoPrevious}
              onClick={onPreviousPage}
              type="button"
            >
              ‹
            </GhostButton>
            <span className="min-w-[3ch] text-center font-semibold text-[color:var(--color-ink)]">
              {currentPageLabel}
            </span>
            <GhostButton
              className="min-h-7 min-w-7 rounded-[10px] px-0 text-[12px]"
              disabled={!canGoNext}
              onClick={onNextPage}
              type="button"
            >
              ›
            </GhostButton>
          </div>
        </div>
      }
      header={
        <>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-bold tracking-[-0.03em] text-[color:var(--color-ink)]">
                Fila viva
              </h2>
              <span className="inline-flex h-5 items-center rounded-full bg-[rgba(47,107,255,0.08)] px-2 text-[10px] font-semibold text-[color:var(--color-brand-blue)]">
                {totalCount}
              </span>
            </div>
          </div>
          <div className="support-queue-search-row mt-3">
            <div className="relative min-w-0 flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)]">
                {searchIcon}
              </span>
              <TextInput
                className="h-10 rounded-[12px] border-[color:var(--color-support-border)] bg-[color:var(--color-support-surface)] pl-9 text-[12px]"
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Buscar tickets..."
                value={search}
              />
            </div>
            <GhostButton
              aria-label="Limpar busca e filtros rápidos"
              className="min-h-10 min-w-10 rounded-[12px] px-0 text-[12px]"
              onClick={onReset}
              title="Limpar busca e filtros rápidos"
              type="button"
            >
              {filterIcon}
            </GhostButton>
          </div>
          <div className="support-queue-segmented mt-3" role="tablist" aria-label="Escopo da fila">
            <button
              aria-selected={scope === 'open'}
              className={cx(
                'support-queue-segmented__button',
                scope === 'open' && 'support-queue-segmented__button--active',
              )}
              onClick={() => onScopeChange('open')}
              role="tab"
              type="button"
            >
              <span>Abertos</span>
              <span className="support-queue-segmented__count">{scopeCounts.open}</span>
            </button>
            <button
              aria-selected={scope === 'closed'}
              className={cx(
                'support-queue-segmented__button',
                scope === 'closed' && 'support-queue-segmented__button--active',
              )}
              onClick={() => onScopeChange('closed')}
              role="tab"
              type="button"
            >
              <span>Fechados</span>
              <span className="support-queue-segmented__count">{scopeCounts.closed}</span>
            </button>
          </div>
          <div className="support-queue-filter-row mt-3">
            {tabs.map((tab) => (
              <button
                className={cx(
                  'support-queue-filter-chip',
                  activeTab === tab.key
                    ? 'support-queue-filter-chip--active'
                    : 'support-queue-filter-chip--idle',
                )}
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                type="button"
              >
                <span>{tab.label}</span>
                <span className="support-queue-filter-chip__count">{tab.count}</span>
              </button>
            ))}
          </div>
        </>
      }
    />
  );
}
