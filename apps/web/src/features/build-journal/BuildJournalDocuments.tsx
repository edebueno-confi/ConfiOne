import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { cx } from '../../components/ui';
import { EmptyState, ErrorState, LoadingState } from '../../components/states';
import type {
  AdminInternalDocumentCatalogRow,
  AdminInternalDocumentDetailRow,
} from '../../contracts/admin-contracts';
import { classifyAdminError } from '../admin/admin-errors';
import { ProductDocReaderPanel } from '../product-docs/ProductDocReaderPanel';
import {
  getInternalDocumentDetailBySlug,
  listInternalDocumentsCatalog,
} from '../product-docs/product-docs-api';
import {
  buildJournalDocumentCategories,
  type BuildJournalDocumentCategory,
  type BuildJournalDocumentTone,
} from './buildJournalContent';
import { BuildJournalQuoteFooter } from './BuildJournalQuoteFooter';

const toneClasses: Record<BuildJournalDocumentTone, { bg: string; border: string; icon: string; text: string; line: string }> = {
  blue: {
    bg: 'bg-[#EEF6FF]',
    border: 'border-[#CFE0FF]',
    icon: 'text-[#236EFF]',
    text: 'text-[#1458E8]',
    line: 'bg-[#236EFF]',
  },
  green: {
    bg: 'bg-[#EFFDF7]',
    border: 'border-[#C8F0DF]',
    icon: 'text-[#0B8C62]',
    text: 'text-[#0B8C62]',
    line: 'bg-[#21B889]',
  },
  orange: {
    bg: 'bg-[#FFF6EC]',
    border: 'border-[#FFD9B5]',
    icon: 'text-[#D05F00]',
    text: 'text-[#C85C00]',
    line: 'bg-[#FF8A16]',
  },
  pink: {
    bg: 'bg-[#FFF0F7]',
    border: 'border-[#FFD0E6]',
    icon: 'text-[#D92C78]',
    text: 'text-[#D92C78]',
    line: 'bg-[#F83D90]',
  },
  teal: {
    bg: 'bg-[#EEFCFC]',
    border: 'border-[#C8F2F2]',
    icon: 'text-[#129094]',
    text: 'text-[#129094]',
    line: 'bg-[#27C6C5]',
  },
  violet: {
    bg: 'bg-[#F7F2FF]',
    border: 'border-[#DACBFF]',
    icon: 'text-[#6D3BDD]',
    text: 'text-[#6D3BDD]',
    line: 'bg-[#8C54F7]',
  },
};

function DocumentIcon({ name, className }: { name: string; className?: string }) {
  const base = cx('h-5 w-5', className);

  if (name === 'book') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M4.8 6.2c2.8 0 5 .7 7.2 2.2 2.2-1.5 4.4-2.2 7.2-2.2v12.6c-2.8 0-5 .7-7.2 2.2-2.2-1.5-4.4-2.2-7.2-2.2V6.2Z" strokeLinejoin="round" />
        <path d="M12 8.4V21" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'clipboard') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 5.5h6M9.2 4h5.6a1.2 1.2 0 0 1 1.2 1.2v1.3H8V5.2A1.2 1.2 0 0 1 9.2 4Z" />
        <path d="M7 6.5H6a1.8 1.8 0 0 0-1.8 1.8v10A1.8 1.8 0 0 0 6 20h12a1.8 1.8 0 0 0 1.8-1.8v-10A1.8 1.8 0 0 0 18 6.5h-1" />
        <path d="M8 12h8M8 15.5h6" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'code') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
        <path d="m8.5 8-4 4 4 4M15.5 8l4 4-4 4M13.4 5.8l-2.8 12.4" />
      </svg>
    );
  }

  if (name === 'headset') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M5 13v-1a7 7 0 0 1 14 0v1M5 13h3v5H6.5A1.5 1.5 0 0 1 5 16.5V13ZM19 13h-3v5h1.5a1.5 1.5 0 0 0 1.5-1.5V13ZM16 18c-.7 1.3-2 2-4 2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'layers') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
        <path d="m12 4 8 4-8 4-8-4 8-4Z" />
        <path d="m4 12 8 4 8-4M4 16l8 4 8-4" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'portal') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M8 19v-2.6a4 4 0 0 1 8 0V19M12 11.6a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2Z" />
        <path d="M5.5 20h13" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'shield') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 4.2 18.4 6v5.2c0 4-2.4 7-6.4 8.6-4-1.6-6.4-4.6-6.4-8.6V6L12 4.2Z" />
        <path d="m9.4 12.1 1.7 1.7 3.6-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === 'spark') {
    return (
      <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 3.8c1.2 3.6 2.8 5.2 6.4 6.4-3.6 1.2-5.2 2.8-6.4 6.4-1.2-3.6-2.8-5.2-6.4-6.4 3.6-1.2 5.2-2.8 6.4-6.4Z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className={base} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 4.2 14.2 9l5.3.5-4 3.4 1.2 5.2-4.7-2.8-4.7 2.8 1.2-5.2-4-3.4L9.8 9 12 4.2Z" strokeLinejoin="round" />
    </svg>
  );
}

function CategoryCard({
  availableDocuments,
  category,
  onSelectDocument,
  selectedDocumentSlug,
}: {
  availableDocuments: Map<string, AdminInternalDocumentCatalogRow>;
  category: BuildJournalDocumentCategory;
  onSelectDocument: (documentSlug: string) => void;
  selectedDocumentSlug: string | null;
}) {
  const tone = toneClasses[category.tone];

  return (
    <article className="relative overflow-hidden rounded-[18px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] p-5 shadow-[0_14px_36px_rgba(31,67,125,0.06)]">
      <span aria-hidden="true" className={cx('absolute inset-x-0 top-0 h-1', tone.line)} />
      <div className="grid gap-5 xl:grid-cols-[56px_1fr]">
        <div className={cx('flex h-16 w-16 items-center justify-center rounded-[18px] border', tone.bg, tone.border, tone.icon)}>
          <DocumentIcon className="h-9 w-9" name={category.icon} />
        </div>

        <div className="min-w-0">
          <p className={cx('text-xs font-black uppercase tracking-[0.22em]', tone.text)}>{category.eyebrow}</p>
          <h2 className="mt-2 text-xl font-black tracking-[-0.02em] text-[#071641]">{category.title}</h2>
          <p className="mt-3 max-w-[74ch] text-sm font-semibold leading-7 text-[#31476C]">{category.description}</p>
          <div className={cx('mt-5 rounded-[12px] border p-4', tone.bg, tone.border)}>
            <p className="text-sm font-black leading-6 text-[#20375F]">{category.role}</p>
          </div>

          <div className="mt-5 rounded-[14px] border border-[#E1EAF6] bg-[#F8FBFF] p-4">
            <p className="text-sm font-black text-[#071641]">Documentos principais</p>
            <div className="mt-4 space-y-3">
              {category.documents.map((document) => {
                const productDocId = document.productDocId ?? null;
                const catalogDocument = productDocId ? availableDocuments.get(productDocId) ?? null : null;
                const isActive = productDocId !== null && selectedDocumentSlug === productDocId;

                if (!productDocId || !catalogDocument) {
                  return (
                    <div className="rounded-[10px] border border-dashed border-[#D9E6F7] bg-[color:var(--color-surface-strong)]/70 p-3" key={document.title}>
                      <strong className="block text-sm font-black text-[#071641]">{document.title}</strong>
                      <span className="mt-1 block text-xs font-semibold leading-5 text-[#496186]">{document.purpose}</span>
                      <span className="mt-3 inline-flex rounded-full border border-[#FFD9B5] bg-[#FFF6EC] px-3 py-1 text-[11px] font-black text-[#C85C00]">
                        {document.pendingReason ?? 'Documento indisponível ou sem permissão'}
                      </span>
                    </div>
                  );
                }

                return (
                  <button
                    className={cx(
                      'group block w-full rounded-[10px] border bg-[color:var(--color-surface-strong)] p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-[#1458E8]/20',
                      isActive
                        ? 'border-[#1458E8]/45 bg-[#F5F8FF]'
                        : 'border-[#D9E6F7] hover:border-[#1458E8]/40 hover:bg-[#F7FAFF]',
                    )}
                    key={document.title}
                    onClick={() => onSelectDocument(productDocId)}
                    type="button"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span>
                        <strong className="block text-sm font-black text-[#071641]">{document.title}</strong>
                        <span className="mt-1 block text-xs font-semibold leading-5 text-[#496186]">{document.purpose}</span>
                        <span className={cx('mt-3 inline-flex rounded-full border px-3 py-1 text-[11px] font-black', isActive ? 'border-[#CFE0FF] bg-[color:var(--color-surface-strong)] text-[#1458E8]' : 'border-[#D9E6F7] bg-[#F8FBFF] text-[#31476C]')}>
                          {isActive ? 'Aberto no Diário' : 'Ler no Diário'}
                        </span>
                      </span>
                      <span aria-hidden="true" className="mt-1 text-[#1458E8] transition group-hover:translate-x-0.5">→</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function BuildJournalDocuments() {
  const [catalogPhase, setCatalogPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [detailPhase, setDetailPhase] = useState<'idle' | 'loading' | 'ready' | 'unavailable' | 'error'>('idle');
  const [catalog, setCatalog] = useState<AdminInternalDocumentCatalogRow[]>([]);
  const [selectedDocumentSlug, setSelectedDocumentSlug] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<AdminInternalDocumentDetailRow | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setCatalogPhase('loading');
      setMessage('');

      try {
        const nextCatalog = await listInternalDocumentsCatalog('build-journal');
        if (cancelled) {
          return;
        }

        setCatalog(nextCatalog);
        setCatalogPhase('ready');
      } catch (error) {
        if (cancelled) {
          return;
        }

        const classified = classifyAdminError(
          error,
          'Falha ao carregar o catálogo oficial do Diário de Construção.',
        );
        setMessage(classified.message);
        setCatalogPhase('error');
      }
    }

    void loadCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  const availableDocuments = useMemo(
    () => new Map(catalog.map((document) => [document.slug, document] as const)),
    [catalog],
  );

  const firstAvailableDocumentSlug = useMemo(() => {
    for (const category of buildJournalDocumentCategories) {
      for (const document of category.documents) {
        if (document.productDocId && availableDocuments.has(document.productDocId)) {
          return document.productDocId;
        }
      }
    }

    return null;
  }, [availableDocuments]);

  useEffect(() => {
    if (catalogPhase !== 'ready') {
      return;
    }

    if (!selectedDocumentSlug || !availableDocuments.has(selectedDocumentSlug)) {
      setSelectedDocumentSlug(firstAvailableDocumentSlug);
    }
  }, [availableDocuments, catalogPhase, firstAvailableDocumentSlug, selectedDocumentSlug]);

  useEffect(() => {
    if (catalogPhase !== 'ready' || !selectedDocumentSlug) {
      setDetailPhase('idle');
      setSelectedDocument(null);
      return;
    }

    let cancelled = false;
    const documentSlug = selectedDocumentSlug;

    async function loadDetail() {
      setDetailPhase('loading');
      setSelectedDocument(null);
      setMessage('');

      try {
        const detail = await getInternalDocumentDetailBySlug(documentSlug, 'build-journal');
        if (cancelled) {
          return;
        }

        if (!detail) {
          setDetailPhase('unavailable');
          setMessage('Documento indisponível ou sem permissão.');
          return;
        }

        setSelectedDocument(detail);
        setDetailPhase('ready');
      } catch (error) {
        if (cancelled) {
          return;
        }

        const classified = classifyAdminError(
          error,
          'Falha ao abrir o documento oficial no Diário de Construção.',
        );
        setMessage(classified.message);
        setDetailPhase(classified.kind === 'permission-denied' ? 'unavailable' : 'error');
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [catalogPhase, selectedDocumentSlug]);

  return (
    <section className="space-y-6">
      <section className="overflow-hidden rounded-[18px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] shadow-[0_14px_36px_rgba(31,67,125,0.06)]">
        <div className="grid gap-6 p-7 lg:grid-cols-[1fr_380px]">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.24em] text-[#1458E8]">Camada narrativa, não explorador</span>
            <h2 className="mt-3 max-w-4xl text-[2rem] font-black leading-tight tracking-[-0.02em] text-[#071641]">
              Fontes oficiais que deram forma ao produto
            </h2>
            <p className="mt-4 max-w-[78ch] text-base font-semibold leading-8 text-[#31476C]">
              Esta aba organiza a leitura por papel na construção: visão, arquitetura, segurança, operação, conteúdo, experiência e governança. Os documentos whitelisted abrem dentro do próprio Diário usando a mesma fonte real governada do Product Docs.
            </p>
          </div>
          <div className="rounded-[16px] border border-[#CFE0FF] bg-[#F5F8FF] p-5">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#1458E8]">Guarda de segurança</p>
            <ul className="mt-4 space-y-3">
              {[
                'Não abre arquivos arbitrários do repositório.',
                'Reutiliza o leitor oficial de Product Docs.',
                'Usa as mesmas leituras autorizadas do Documentos do Produto.',
                'Só abre documentos presentes na whitelist sincronizada.',
              ].map((item) => (
                <li className="flex gap-3 text-sm font-bold leading-6 text-[#20375F]" key={item}>
                  <DocumentIcon className="h-5 w-5 shrink-0 text-[#0B8C62]" name="shield" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-[18px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] p-5 shadow-[0_14px_36px_rgba(31,67,125,0.06)] lg:grid-cols-3">
        {[
          ['Diário de Construção', 'Organiza a história, o porquê e a sequência das decisões.'],
          ['Documentos oficiais', 'Explica quais fontes sustentam cada parte da construção.'],
          ['Product Docs', 'Mantém a leitura detalhada, controlada e whitelisted.'],
        ].map(([title, text], index) => (
          <article className="rounded-[14px] border border-[#E1EAF6] bg-[#FBFDFF] p-5" key={title}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF6FF] text-sm font-black text-[#1458E8]">{index + 1}</span>
            <h3 className="mt-4 text-base font-black text-[#071641]">{title}</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#41567A]">{text}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(460px,1.08fr)]">
        <div className="space-y-5">
          {buildJournalDocumentCategories.map((category) => (
            <CategoryCard
              availableDocuments={availableDocuments}
              category={category}
              key={category.title}
              onSelectDocument={setSelectedDocumentSlug}
              selectedDocumentSlug={selectedDocumentSlug}
            />
          ))}
        </div>

        <aside className="min-w-0 xl:sticky xl:top-4 xl:self-start">
          {catalogPhase === 'loading' ? (
            <LoadingState
              title="Carregando documentos oficiais"
              description="Estamos consultando o catálogo governado do Diário de Construção."
            />
          ) : catalogPhase === 'error' ? (
            <ErrorState description={message || 'Falha ao carregar documentos oficiais.'} />
          ) : catalog.length === 0 ? (
            <EmptyState
              title="Nenhum documento disponível"
              description="Nenhum documento autorizado para o Diário ficou disponível agora."
            />
          ) : detailPhase === 'loading' ? (
            <LoadingState
              title="Carregando documento"
              description="Estamos abrindo a versão revisada disponível para consulta."
            />
          ) : detailPhase === 'error' ? (
            <ErrorState description={message || 'Falha ao abrir o documento solicitado.'} />
          ) : detailPhase === 'unavailable' ? (
            <EmptyState
              title="Documento indisponível"
              description={message || 'Documento indisponível ou sem permissão.'}
            />
          ) : selectedDocument ? (
            <ProductDocReaderPanel
              className="max-h-none xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto"
              document={selectedDocument}
              officialLinkLabel="Abrir no Documentos do Produto"
              showOfficialLink
            />
          ) : (
            <EmptyState
              title="Nenhum documento selecionado"
              description="Escolha um documento disponível para abrir a leitura inline."
            />
          )}
        </aside>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <article className="rounded-[18px] border border-[#D9E6F7] bg-[color:var(--color-surface-strong)] p-6 shadow-[0_14px_36px_rgba(31,67,125,0.06)]">
          <h2 className="text-xl font-black text-[#071641]">Como usar esta leitura</h2>
          <p className="mt-2 text-sm font-semibold leading-7 text-[#31476C]">
            Comece pela categoria ligada à dúvida do momento. Se precisar da versão detalhada, abra o documento no Product Docs. Se o item estiver pendente, ele não foi exposto nesta whitelist e não deve ser tratado como link disponível.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[#1458E8] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(20,88,232,0.18)]" to="/admin/product-docs?surface=development">
              Abrir Documentos do Produto
              <span aria-hidden="true" className="ml-2">→</span>
            </Link>
            <span className="inline-flex min-h-11 items-center rounded-[10px] border border-[#D9E6F7] bg-[#F8FBFF] px-5 text-sm font-black text-[#31476C]">
              Conteúdo sincronizado, versionado e sanitizado
            </span>
          </div>
        </article>

        <aside className="rounded-[18px] border border-[#D9E6F7] bg-[linear-gradient(135deg,#F5F8FF,#FFFFFF)] p-6 shadow-[0_14px_36px_rgba(31,67,125,0.06)]">
          <h2 className="text-lg font-black text-[#071641]">Diferença essencial</h2>
          <p className="mt-3 text-sm font-semibold leading-7 text-[#31476C]">
            Esta tela explica o mapa das fontes. Product Docs continua sendo o leitor oficial controlado. O Diário não substitui a fonte, ele ajuda a entender por que ela existe.
          </p>
        </aside>
      </section>

      <BuildJournalQuoteFooter
        author="A documentação oficial continua sendo a fonte controlada. O Diário explica o caminho que levou até ela."
        quote="Documentar é preservar decisão, contexto e responsabilidade."
        variant="documents"
      />
    </section>
  );
}
