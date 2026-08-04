import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router';
import { cx } from '../../components/ui';
import { GeniusLamp } from '../../components/GeniusLamp';
import type { InternalScreenKey } from '../../contracts/admin-contracts';
import {
  canOpenSettingsSection,
  isRoutePublishedInRelease,
  isScreenPublishedInRelease,
} from '../../app/release-surface.mjs';
import {
  GENIUS_NAVIGATION_TARGETS,
  GENIUS_SETTINGS_TARGETS,
  rankGeniusArticles,
  rankGeniusTargets,
  resolveContextSuggestions,
  type GeniusArticleLike,
  type GeniusTarget,
} from './genius-search-sources.mjs';

export interface GeniusGlobalSearchPermissions {
  isPlatformAdmin: boolean;
  screenKeys: InternalScreenKey[];
}

type ArticleLoadState = 'idle' | 'loading' | 'ready' | 'error';

const SETTINGS_SECTION_STORAGE_KEY = 'genius.settings-section';

/**
 * Busca global do Gênio.
 *
 * Vive no header global e atende três fontes: telas e ações, seções de
 * configuração e artigos da base de conhecimento. Sem digitar nada, sugere o
 * que faz sentido para a tela atual — é o comportamento adaptativo ao contexto.
 *
 * Nenhum destino é oferecido sem passar pelo manifesto da superfície do release
 * e pela permissão do perfil, na mesma ordem usada pelos gates de rota.
 */
export function GeniusGlobalSearch({
  permissions,
  compact = false,
}: {
  permissions: GeniusGlobalSearchPermissions;
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [articles, setArticles] = useState<GeniusArticleLike[]>([]);
  const [articleState, setArticleState] = useState<ArticleLoadState>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isTargetAvailable = useCallback(
    (target: GeniusTarget) => {
      if (target.source === 'settings' || target.sectionId) {
        return canOpenSettingsSection(target.sectionId ?? '', permissions);
      }
      if (!isRoutePublishedInRelease(target.to)) return false;
      if (!target.screenKey) return true;
      if (!isScreenPublishedInRelease(target.screenKey)) return false;

      return permissions.isPlatformAdmin || permissions.screenKeys.includes(target.screenKey);
    },
    [permissions],
  );

  const canReadArticles =
    isScreenPublishedInRelease('knowledge') &&
    (permissions.isPlatformAdmin || permissions.screenKeys.includes('knowledge'));

  // Os artigos são buscados uma única vez, ao abrir, e filtrados no cliente.
  // Reaproveita o read model existente em vez de exigir um contrato novo.
  useEffect(() => {
    if (!open || !canReadArticles || articleState !== 'idle') return;

    let cancelled = false;
    setArticleState('loading');

    void (async () => {
      try {
        const [{ listAdminKnowledgeSpaces, listAdminKnowledgeArticlesV2 }] = await Promise.all([
          import('../admin/admin-api'),
        ]);
        const spaces = await listAdminKnowledgeSpaces();
        const space = spaces[0];
        if (!space) {
          if (!cancelled) setArticleState('ready');
          return;
        }
        const rows = await listAdminKnowledgeArticlesV2({ knowledgeSpaceId: space.id });
        if (!cancelled) {
          setArticles(rows as unknown as GeniusArticleLike[]);
          setArticleState('ready');
        }
      } catch {
        if (!cancelled) setArticleState('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, canReadArticles, articleState]);

  const availableTargets = useMemo(
    () =>
      [...GENIUS_NAVIGATION_TARGETS, ...GENIUS_SETTINGS_TARGETS.map((target) => ({
        ...target,
        source: 'settings' as const,
        kind: 'configuração',
        to: '/admin/settings',
      }))].filter((target) => isTargetAvailable(target as GeniusTarget)),
    [isTargetAvailable],
  );

  const context = useMemo(() => resolveContextSuggestions(location.pathname), [location.pathname]);

  const contextTargets = useMemo(
    () =>
      context.ids
        .map((id) => availableTargets.find((target) => target.id === id))
        .filter((target): target is GeniusTarget => Boolean(target)),
    [context, availableTargets],
  );

  const matchedTargets = useMemo(
    () => rankGeniusTargets(query, { isTargetAvailable, limit: 6 }),
    [query, isTargetAvailable],
  );

  const matchedArticles = useMemo(
    () => (canReadArticles ? rankGeniusArticles(query, articles, { limit: 5 }) : []),
    [query, articles, canReadArticles],
  );

  type Row =
    | { rowKey: string; type: 'target'; target: GeniusTarget }
    | { rowKey: string; type: 'article'; article: GeniusArticleLike };

  const rows: Row[] = useMemo(() => {
    const targets = query.trim() ? matchedTargets : contextTargets;
    return [
      ...targets.map((target) => ({ rowKey: `t:${target.id}`, type: 'target' as const, target })),
      ...matchedArticles.map((article) => ({ rowKey: `a:${article.id}`, type: 'article' as const, article })),
    ];
  }, [query, matchedTargets, contextTargets, matchedArticles]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  // Ctrl/Cmd+K abre de qualquer tela.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === 'Escape') setOpen(false);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
      return () => window.cancelAnimationFrame(frame);
    }
    triggerRef.current?.focus();
    setQuery('');
    return undefined;
  }, [open]);

  const runRow = useCallback(
    (row: Row) => {
      setOpen(false);

      if (row.type === 'article') {
        navigate(`/admin/knowledge/${row.article.id}/edit`);
        return;
      }

      const target = row.target;
      if (target.external) {
        window.open(target.to, '_blank', 'noreferrer');
        return;
      }
      if (target.sectionId) {
        // Configurações lê esta chave para abrir direto na seção pedida.
        try {
          window.sessionStorage.setItem(SETTINGS_SECTION_STORAGE_KEY, target.sectionId);
        } catch {
          // sessionStorage indisponível não deve impedir a navegação.
        }
      }
      navigate(target.to);
    },
    [navigate],
  );

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (rows.length ? (current + 1) % rows.length : 0));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => (rows.length ? (current - 1 + rows.length) % rows.length : 0));
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const row = rows[activeIndex];
      if (row) runRow(row);
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        aria-haspopup="dialog"
        className={cx(
          'gso-genius-trigger group hidden w-full items-center gap-2.5 rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] px-3 py-1.5 text-left transition hover:border-[color:var(--minimal-action)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)] md:flex',
          compact && 'gso-genius-trigger--compact justify-center px-1.5',
        )}
        onClick={() => setOpen(true)}
        title="Pergunte ao Gênio · Ctrl+K"
        type="button"
      >
        <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[color:var(--minimal-action)]" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM15.5 15.5 20 20" />
        </svg>
        <span className="truncate text-sm text-[color:var(--minimal-text-tertiary)]">
          Pergunte ao Gênio
        </span>
        <kbd className="ml-auto hidden shrink-0 rounded border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--minimal-text-tertiary)] lg:inline">
          Ctrl K
        </kbd>
      </button>

      <button
        aria-label="Pergunte ao Gênio"
        className="inline-flex h-11 w-11 items-center justify-center rounded-md text-[color:var(--minimal-text-secondary)] hover:bg-[color:var(--minimal-surface-muted)] md:hidden"
        onClick={() => setOpen(true)}
        type="button"
      >
        <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM15.5 15.5 20 20" />
        </svg>
      </button>

      {open
        ? createPortal(
        <div
          aria-label="Busca global"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[10vh]"
          role="dialog"
        >
          <button
            aria-label="Fechar busca"
            className="absolute inset-0 cursor-default bg-[rgba(12,18,32,0.55)] backdrop-blur-sm"
            onClick={() => setOpen(false)}
            tabIndex={-1}
            type="button"
          />
          <div className="gso-genius-panel relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] shadow-2xl">
            <div className="gso-genius-panel-glow" aria-hidden="true" />
            <div className="relative flex items-center gap-3 border-b border-[color:var(--minimal-border)] px-4 py-3">
              <GeniusLamp alt="Lâmpada do GeniusOS" size="md" />
              <input
                ref={inputRef}
                aria-label="Pergunte ao Gênio"
                className="min-w-0 flex-1 bg-transparent text-base text-[color:var(--minimal-text)] outline-none placeholder:text-[color:var(--minimal-text-tertiary)]"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Pergunte ao Gênio: um artigo, uma tela, uma configuração…"
                value={query}
              />
              <kbd className="hidden shrink-0 rounded border border-[color:var(--minimal-border)] px-1.5 py-0.5 text-[10px] text-[color:var(--minimal-text-tertiary)] sm:inline">
                Esc
              </kbd>
            </div>

            <div className="relative max-h-[52vh] overflow-y-auto px-2 py-2">
              {!query.trim() ? (
                <p className="px-2 pb-1.5 pt-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--minimal-text-tertiary)]">
                  {context.title}
                </p>
              ) : null}

              {rows.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <p className="text-sm text-[color:var(--minimal-text-secondary)]">
                    {articleState === 'loading'
                      ? 'O Gênio está consultando a documentação…'
                      : 'O Gênio não encontrou nada com esse termo.'}
                  </p>
                  {articleState === 'error' ? (
                    <p className="mt-1 text-xs text-[color:var(--minimal-text-tertiary)]">
                      A base de conhecimento não respondeu; telas e configurações continuam
                      pesquisáveis.
                    </p>
                  ) : null}
                </div>
              ) : (
                <ul className="space-y-0.5">
                  {rows.map((row, index) => {
                    const active = index === activeIndex;
                    const label = row.type === 'target' ? row.target.label : row.article.title;
                    const hint =
                      row.type === 'target'
                        ? row.target.hint
                        : row.article.category_name ?? 'Artigo da base de conhecimento';
                    const kind = row.type === 'target' ? row.target.kind : 'artigo';

                    return (
                      <li key={row.rowKey}>
                        <button
                          className={cx(
                            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition',
                            active
                              ? 'bg-[color:var(--minimal-selection)] text-[color:var(--minimal-selection-text)]'
                              : 'text-[color:var(--minimal-text)] hover:bg-[color:var(--minimal-surface-muted)]',
                          )}
                          onClick={() => runRow(row)}
                          onMouseEnter={() => setActiveIndex(index)}
                          type="button"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{label}</span>
                            <span
                              className={cx(
                                'block truncate text-xs',
                                active
                                  ? 'text-[color:var(--minimal-selection-text)] opacity-80'
                                  : 'text-[color:var(--minimal-text-tertiary)]',
                              )}
                            >
                              {hint}
                            </span>
                          </span>
                          <span className="shrink-0 rounded-full border border-[color:var(--minimal-border)] px-2 py-0.5 text-[0.68rem] uppercase tracking-[0.1em] text-[color:var(--minimal-text-tertiary)]">
                            {kind}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="relative flex items-center justify-between gap-3 border-t border-[color:var(--minimal-border)] px-4 py-2 text-[0.7rem] text-[color:var(--minimal-text-tertiary)]">
              <span>↑ ↓ navegar · Enter abrir · Esc fechar</span>
              {articleState === 'loading' ? <span>O Gênio está organizando seus dados…</span> : null}
            </div>
          </div>
        </div>,
        document.body,
      )
        : null}
    </>
  );
}
