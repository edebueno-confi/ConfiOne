import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  AccessDeniedState,
  ContractUnavailableState,
  EmptyState,
  ErrorState,
  LoadingState,
  SessionExpiredState,
} from '../../components/states';
import { AppButton, StatusPill, TextInput, cx } from '../../components/ui';
import type {
  AdminInternalDocumentCatalogRow,
  AdminInternalDocumentDetailRow,
} from '../../contracts/admin-contracts';
import { classifyAdminError } from '../admin/admin-errors';
import { ProductDocReaderPanel } from './ProductDocReaderPanel';
import { getProductDocDetailBySlug, listProductDocsCatalog } from './product-docs-api';
import {
  productDocsCategories,
  productDocsReadingTracks,
  productDocsStarterIds,
  type ProductDocsReadingTrack,
} from './productDocsContent';

type PagePhase =
  | 'loading'
  | 'ready'
  | 'contract-unavailable'
  | 'permission-denied'
  | 'session-expired'
  | 'error';

type DetailPhase =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'unavailable'
  | 'contract-unavailable'
  | 'session-expired'
  | 'error';

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function normalizeSlug(value: string | null) {
  const normalized = value?.trim().toLowerCase() ?? '';
  return normalized || null;
}

function formatStatusLabel(status: AdminInternalDocumentCatalogRow['status']) {
  if (status === 'published') {
    return 'Publicado';
  }

  if (status === 'draft') {
    return 'Rascunho';
  }

  if (status === 'archived') {
    return 'Arquivado';
  }

  return 'Bloqueado';
}

function formatSensitivityLabel(sensitivity: AdminInternalDocumentCatalogRow['sensitivity']) {
  if (sensitivity === 'internal') {
    return 'Interna';
  }

  if (sensitivity === 'restricted') {
    return 'Restrita';
  }

  return 'Pública interna';
}

function matchesSearch(document: AdminInternalDocumentCatalogRow, query: string) {
  if (!query) {
    return true;
  }

  const haystack = normalizeSearch(
    [
      document.title,
      document.category,
      document.description ?? '',
      document.owner,
      document.source_path,
      formatStatusLabel(document.status),
      formatSensitivityLabel(document.sensitivity),
    ].join(' '),
  );

  return haystack.includes(query);
}

function CategoryCount({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2">
      <span className="min-w-0 truncate text-sm font-medium text-[color:var(--color-ink)]">
        {label}
      </span>
      <span className="text-xs font-semibold text-[color:var(--color-muted)]">{count}</span>
    </div>
  );
}

function validationTone(status: AdminInternalDocumentCatalogRow['current_validation_status']) {
  if (status === 'valid') {
    return 'positive' as const;
  }

  if (status === 'warning') {
    return 'accent' as const;
  }

  return 'warning' as const;
}

function ProductDocsGovernanceRail({
  catalog,
  onOpenDocument,
  readingTracks,
  selectedDocument,
}: {
  catalog: AdminInternalDocumentCatalogRow[];
  onOpenDocument: (documentSlug: string) => void;
  readingTracks: Array<ProductDocsReadingTrack & { documents: AdminInternalDocumentCatalogRow[] }>;
  selectedDocument: AdminInternalDocumentCatalogRow | null;
}) {
  const validCount = catalog.filter((document) => document.current_validation_status === 'valid').length;
  const warningCount = catalog.filter((document) => document.current_validation_status === 'warning').length;
  const restrictedCount = catalog.filter((document) => document.sensitivity === 'restricted').length;

  return (
    <aside className="min-w-0 space-y-3 xl:min-h-0 xl:overflow-y-auto">
      <section className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-4 py-4">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          Fonte governada
        </p>
        <h2 className="mt-2 text-base font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
          Documentos sincronizados
        </h2>
        <dl className="mt-4 grid gap-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[color:var(--color-muted)]">Catálogo</dt>
            <dd className="font-semibold text-[color:var(--color-ink)]">{catalog.length}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[color:var(--color-muted)]">Sanitização ok</dt>
            <dd className="font-semibold text-[color:var(--color-ink)]">{validCount}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[color:var(--color-muted)]">Com alerta</dt>
            <dd className="font-semibold text-[color:var(--color-ink)]">{warningCount}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[color:var(--color-muted)]">Restritos</dt>
            <dd className="font-semibold text-[color:var(--color-ink)]">{restrictedCount}</dd>
          </div>
        </dl>
      </section>

      {selectedDocument ? (
        <section className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-4 py-4">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
            Documento aberto
          </p>
          <h2 className="mt-2 text-base font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
            {selectedDocument.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted)]">
            {selectedDocument.description ?? 'Documento oficial controlado.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusPill tone={validationTone(selectedDocument.current_validation_status)}>
              {selectedDocument.current_validation_status === 'valid'
                ? 'Sanitização ok'
                : selectedDocument.current_validation_status === 'warning'
                  ? 'Com alerta'
                  : 'Bloqueado'}
            </StatusPill>
            <StatusPill>{formatSensitivityLabel(selectedDocument.sensitivity)}</StatusPill>
          </div>
        </section>
      ) : null}

      <section className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-4 py-4">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          Trilhas sugeridas
        </p>
        <div className="mt-3 space-y-3">
          {readingTracks.map((track) => (
            <div className="border-t border-[color:var(--color-border)] pt-3 first:border-t-0 first:pt-0" key={track.title}>
              <h3 className="text-sm font-semibold text-[color:var(--color-ink)]">{track.title}</h3>
              <p className="mt-1 text-xs leading-5 text-[color:var(--color-muted)]">{track.summary}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {track.documents.slice(0, 3).map((document) => (
                  <button
                    className="rounded-full border border-[color:var(--color-border)] px-2 py-1 text-[0.68rem] font-semibold text-[color:var(--color-ink)] transition hover:border-[rgba(48,127,226,0.35)] hover:text-[color:var(--color-brand-blue)]"
                    key={`${track.title}:${document.slug}`}
                    onClick={() => onOpenDocument(document.slug)}
                    type="button"
                  >
                    {document.title}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}

function sortCatalog(
  documents: AdminInternalDocumentCatalogRow[],
): AdminInternalDocumentCatalogRow[] {
  const categoryOrder = new Map<string, number>(
    productDocsCategories.map((category, index) => [category, index]),
  );

  return [...documents].sort((left, right) => {
    const leftCategoryIndex = categoryOrder.get(left.category) ?? Number.MAX_SAFE_INTEGER;
    const rightCategoryIndex = categoryOrder.get(right.category) ?? Number.MAX_SAFE_INTEGER;

    if (leftCategoryIndex !== rightCategoryIndex) {
      return leftCategoryIndex - rightCategoryIndex;
    }

    return left.title.localeCompare(right.title, 'pt-BR');
  });
}

export function ProductDocsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [phase, setPhase] = useState<PagePhase>('loading');
  const [pageMessage, setPageMessage] = useState('');
  const [catalog, setCatalog] = useState<AdminInternalDocumentCatalogRow[]>([]);
  const [query, setQuery] = useState('');
  const [detailPhase, setDetailPhase] = useState<DetailPhase>('idle');
  const [selectedDetail, setSelectedDetail] = useState<AdminInternalDocumentDetailRow | null>(null);
  const [detailMessage, setDetailMessage] = useState('');

  const requestedSlug = normalizeSlug(searchParams.get('doc'));
  const normalizedQuery = normalizeSearch(query);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setPhase('loading');
      setPageMessage('');

      try {
        const nextCatalog = sortCatalog(await listProductDocsCatalog());
        if (cancelled) {
          return;
        }

        setCatalog(nextCatalog);
        setPhase('ready');
      } catch (error) {
        if (cancelled) {
          return;
        }

        const classified = classifyAdminError(
          error,
          'Falha ao carregar o catálogo oficial de documentos.',
        );
        setPageMessage(classified.message);
        setPhase(classified.kind);
      }
    }

    void loadCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  const catalogBySlug = useMemo(
    () => new Map(catalog.map((document) => [document.slug, document] as const)),
    [catalog],
  );

  const filteredDocs = useMemo(
    () => catalog.filter((document) => matchesSearch(document, normalizedQuery)),
    [catalog, normalizedQuery],
  );

  const selectedSlug = requestedSlug ?? catalog[0]?.slug ?? null;
  const selectedCatalogItem = selectedSlug ? catalogBySlug.get(selectedSlug) ?? null : null;

  useEffect(() => {
    if (phase !== 'ready') {
      return;
    }

    if (!requestedSlug && catalog.length > 0) {
      setDetailMessage('');
      setDetailPhase('idle');
      setSelectedDetail(null);
    }
  }, [catalog.length, phase, requestedSlug]);

  useEffect(() => {
    if (phase !== 'ready' || !selectedSlug) {
      setDetailMessage('');
      setDetailPhase('idle');
      setSelectedDetail(null);
      return;
    }

    let cancelled = false;

    async function loadDetail() {
      setDetailPhase('loading');
      setDetailMessage('');
      setSelectedDetail(null);

      try {
        const detail = await getProductDocDetailBySlug(selectedSlug);
        if (cancelled) {
          return;
        }

        if (!detail) {
          setDetailPhase('unavailable');
          setDetailMessage('Documento indisponível ou sem permissão.');
          return;
        }

        setSelectedDetail(detail);
        setDetailPhase('ready');
      } catch (error) {
        if (cancelled) {
          return;
        }

        const classified = classifyAdminError(
          error,
          'Falha ao carregar o documento oficial solicitado.',
        );
        setDetailMessage(classified.message);
        if (classified.kind === 'permission-denied') {
          setDetailPhase('unavailable');
          return;
        }
        setDetailPhase(classified.kind);
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [phase, selectedSlug]);

  const starterDocs = useMemo(
    () =>
      productDocsStarterIds
        .map((slug) => catalogBySlug.get(slug))
        .filter((document): document is AdminInternalDocumentCatalogRow => Boolean(document)),
    [catalogBySlug],
  );

  const readingTracks = useMemo(
    () =>
      productDocsReadingTracks.map((track) => ({
        ...track,
        documents: track.documentIds
          .map((slug) => catalogBySlug.get(slug))
          .filter((document): document is AdminInternalDocumentCatalogRow => Boolean(document)),
      })),
    [catalogBySlug],
  );

  const visibleCategories = useMemo(() => {
    const staticGroups = productDocsCategories.map((category) => ({
      category,
      documents: filteredDocs.filter((document) => document.category === category),
      total: catalog.filter((document) => document.category === category).length,
    }));
    const dynamicCategories = catalog
      .map((document) => document.category)
      .filter((category) => !productDocsCategories.includes(category as (typeof productDocsCategories)[number]))
      .filter((category, index, array) => array.indexOf(category) === index)
      .map((category) => ({
        category,
        documents: filteredDocs.filter((document) => document.category === category),
        total: catalog.filter((document) => document.category === category).length,
      }));

    return [...staticGroups, ...dynamicCategories].filter(
      (group) => group.total > 0,
    );
  }, [catalog, filteredDocs]);

  function openDocument(documentSlug: string) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('doc', documentSlug);
    setSearchParams(nextParams, { replace: false });
  }

  if (phase === 'loading') {
    return (
      <LoadingState
        title="Carregando documentos oficiais"
        description="Estamos consultando o catálogo oficial controlado desta área."
      />
    );
  }

  if (phase === 'contract-unavailable') {
    return <ContractUnavailableState contractName="Documentos internos oficiais" />;
  }

  if (phase === 'session-expired') {
    return <SessionExpiredState />;
  }

  if (phase === 'permission-denied') {
    return (
      <AccessDeniedState description="Seu acesso atual não permite consultar os documentos oficiais desta área." />
    );
  }

  if (phase === 'error') {
    return <ErrorState description={pageMessage || 'Falha ao carregar os documentos oficiais.'} />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-x-hidden xl:overflow-hidden">
      <header className="shrink-0 rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/94 px-5 py-5 shadow-[0_18px_38px_rgba(16,30,74,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
              Fonte controlada
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold leading-tight tracking-[-0.045em] text-[color:var(--color-ink)]">
                Documentos do Produto
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-[color:var(--color-muted)]">
                Fonte oficial controlada dos documentos que sustentam visão, arquitetura,
                segurança, operação, design e construção do ConfiOne.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill tone="positive">Fonte oficial</StatusPill>
            <StatusPill>{catalog.length} documentos</StatusPill>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)_280px] xl:overflow-hidden">
        <aside className="min-w-0 space-y-4 xl:min-h-0 xl:overflow-y-auto">
          <section className="rounded-[24px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/94 px-4 py-4 shadow-[0_16px_34px_rgba(16,30,74,0.08)]">
            <div className="rounded-[20px] border border-[rgba(48,127,226,0.14)] bg-[rgba(48,127,226,0.06)] px-4 py-4">
              <h2 className="text-base font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
                Por onde começar
              </h2>
              <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted)]">
                Se você está entrando agora, siga esta ordem: tese do produto, problema
                operacional, regras de arquitetura e checkpoint do estado atual.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {starterDocs.map((document) => (
                  <button
                    className="rounded-full border border-[rgba(48,127,226,0.22)] bg-[color:var(--color-surface-strong)]/88 px-3 py-1 text-xs font-semibold text-[color:var(--color-brand-blue)] transition hover:bg-[color:var(--color-surface-strong)]"
                    key={document.slug}
                    onClick={() => openDocument(document.slug)}
                    type="button"
                  >
                    {document.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <h2 className="text-base font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
                  Índice
                </h2>
                <p className="text-sm leading-6 text-[color:var(--color-muted)]">
                  Somente documentos sincronizados e autorizados para esta superfície aparecem
                  aqui. Esta área não é explorador de arquivos.
                </p>
              </div>
              <TextInput
                aria-label="Buscar documentos"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar documento"
                value={query}
              />
            </div>

            <div className="mt-4 grid gap-2">
              {visibleCategories.map((group) => (
                <CategoryCount count={group.total} key={group.category} label={group.category} />
              ))}
            </div>
          </section>

          <nav
            aria-label="Documentos permitidos"
            className="rounded-[24px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/94 px-3 py-3 shadow-[0_16px_34px_rgba(16,30,74,0.08)]"
          >
            {filteredDocs.length > 0 ? (
              <div className="space-y-4">
                {visibleCategories
                  .filter((group) => group.documents.length > 0)
                  .map((group) => (
                    <section className="space-y-2" key={group.category}>
                      <div className="px-1">
                        <h3 className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                          {group.category}
                        </h3>
                      </div>
                      <div className="grid gap-1">
                        {group.documents.map((document) => {
                          const active = selectedSlug === document.slug;

                          return (
                            <button
                              className={cx(
                                'min-h-14 rounded-[18px] border px-3 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-blue)]/25',
                                active
                                  ? 'border-[rgba(48,127,226,0.28)] bg-[rgba(48,127,226,0.09)]'
                                  : 'border-transparent bg-transparent hover:border-[color:var(--color-border)] hover:bg-[color:var(--color-surface)]',
                              )}
                              key={document.slug}
                              onClick={() => openDocument(document.slug)}
                              type="button"
                            >
                              <span className="block truncate text-sm font-semibold text-[color:var(--color-ink)]">
                                {document.title}
                              </span>
                              <span className="mt-1 flex flex-wrap gap-1.5">
                                <span className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/80 px-2 py-0.5 text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-muted)]">
                                  {formatStatusLabel(document.status)}
                                </span>
                                <span className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/80 px-2 py-0.5 text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-muted)]">
                                  {formatSensitivityLabel(document.sensitivity)}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ))}
              </div>
            ) : (
              <EmptyState
                title="Nenhum documento encontrado"
                description="A busca local não encontrou documentos dentro do catálogo autorizado."
              />
            )}
          </nav>

        </aside>

        <main className="min-w-0 xl:min-h-0 xl:overflow-y-auto">
          {!selectedSlug ? (
            <EmptyState
              title="Nenhum documento selecionado"
              description="Escolha um item do índice para abrir o conteúdo oficial controlado."
            />
          ) : detailPhase === 'loading' ? (
            <LoadingState
              title="Carregando documento"
              description="Estamos abrindo a versão oficial sanitizada deste documento."
            />
          ) : detailPhase === 'contract-unavailable' ? (
            <ContractUnavailableState contractName="Leitura detalhada de documentos internos" />
          ) : detailPhase === 'session-expired' ? (
            <SessionExpiredState />
          ) : detailPhase === 'error' ? (
            <ErrorState description={detailMessage || 'Falha ao carregar o documento solicitado.'} />
          ) : detailPhase === 'unavailable' ? (
            <EmptyState
              title="Documento indisponível"
              description={detailMessage || 'Documento indisponível ou sem permissão.'}
              action={
                filteredDocs.length > 0 && !selectedCatalogItem ? (
                  <AppButton onClick={() => openDocument(filteredDocs[0].slug)}>
                    Abrir primeiro documento disponível
                  </AppButton>
                ) : undefined
              }
            />
          ) : selectedDetail ? (
            <ProductDocReaderPanel document={selectedDetail} />
          ) : (
            <EmptyState
              title="Documento indisponível"
              description="Documento indisponível ou sem permissão."
            />
          )}
        </main>

        <ProductDocsGovernanceRail
          catalog={catalog}
          onOpenDocument={openDocument}
          readingTracks={readingTracks}
          selectedDocument={selectedCatalogItem}
        />
      </div>
    </div>
  );
}
