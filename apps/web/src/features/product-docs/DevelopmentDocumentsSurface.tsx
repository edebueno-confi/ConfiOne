import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ErrorState, LoadingState } from '../../components/states';
import { cx } from '../../components/ui';
import type { AdminInternalDocumentCatalogRow, AdminInternalDocumentDetailRow } from '../../contracts/admin-contracts';
import { classifyAdminError } from '../admin/admin-errors';
import { ProductDocReaderPanel } from './ProductDocReaderPanel';
import { getProductDocDetailBySlug, listProductDocsCatalog } from './product-docs-api';
import { productDocsCategories } from './productDocsContent';

function normalizeSlug(value: string | null) {
  const slug = value?.trim().toLowerCase() ?? '';
  return slug || null;
}

function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function statusLabel(status: AdminInternalDocumentCatalogRow['status']) {
  return status === 'published' ? 'Publicado' : status === 'draft' ? 'Rascunho' : status === 'archived' ? 'Arquivado' : 'Bloqueado';
}

function sensitivityLabel(sensitivity: AdminInternalDocumentCatalogRow['sensitivity']) {
  return sensitivity === 'restricted' ? 'Restrito' : sensitivity === 'internal' ? 'Interno' : 'Público interno';
}

function CatalogIndex({
  catalog,
  query,
  selectedSlug,
  onQueryChange,
  onSelect,
}: {
  catalog: AdminInternalDocumentCatalogRow[];
  query: string;
  selectedSlug: string | null;
  onQueryChange: (value: string) => void;
  onSelect: (slug: string) => void;
}) {
  const normalizedQuery = normalizeSearch(query);
  const filtered = catalog.filter((document) => normalizeSearch(`${document.title} ${document.category} ${document.description ?? ''}`).includes(normalizedQuery));
  const groups = productDocsCategories.map((category) => ({ category, documents: filtered.filter((document) => document.category === category) })).filter((group) => group.documents.length > 0);

  return (
    <aside className="gso-docs-v2-index">
      <div className="gso-docs-v2-index-head"><div><span className="gso-docs-v2-label">Biblioteca</span><strong>{catalog.length} fontes</strong></div><span className="gso-docs-v2-index-signal" /></div>
      <label className="gso-docs-v2-search"><span>Buscar na biblioteca</span><input aria-label="Buscar na biblioteca documental" onChange={(event) => onQueryChange(event.target.value)} placeholder="Título, área ou palavra-chave" value={query} /></label>
      {groups.length > 0 ? (
        <div className="gso-docs-v2-groups">
          {groups.map((group) => (
            <section key={group.category}>
              <span className="gso-docs-v2-group-title">{group.category}</span>
              {group.documents.map((document) => (
                <button
                  className={cx('gso-docs-v2-index-item', selectedSlug === document.slug && 'is-active')}
                  key={document.slug}
                  onClick={() => onSelect(document.slug)}
                  type="button"
                >
                  <span>
                    <strong>{document.title}</strong>
                    <small>{statusLabel(document.status)} · {sensitivityLabel(document.sensitivity)}</small>
                  </span>
                  <i>→</i>
                </button>
              ))}
            </section>
          ))}
        </div>
      ) : (
        <div className="gso-docs-v2-index-empty">
          <strong>{catalog.length === 0 ? 'Índice aguardando catálogo' : 'Nenhum resultado'}</strong>
          <span>{catalog.length === 0 ? 'As fontes aparecem aqui depois da publicação autorizada.' : 'Tente outro termo de busca.'}</span>
        </div>
      )}
    </aside>
  );
}

function EmptyDocumentStage({ catalogCount, onReload }: { catalogCount: number; onReload: () => void }) {
  return (
    <section className="gso-docs-v2-empty-stage">
      <div className="gso-docs-v2-empty-mark">/</div>
      <span className="gso-docs-v2-label">{catalogCount === 0 ? 'Catálogo sem publicação' : 'Nenhuma fonte selecionada'}</span>
      <h2>{catalogCount === 0 ? 'A biblioteca ainda não recebeu documentos.' : 'Escolha uma fonte para começar.'}</h2>
      <p>{catalogCount === 0 ? 'A tela está pronta, mas o catálogo governado local não possui documentos sincronizados nesta sessão. Isso é diferente de uma falha de leitura.' : 'Use o índice para abrir o conteúdo sanitizado e consultar seu contexto, status e origem.'}</p>
      <div className="gso-docs-v2-empty-actions"><button onClick={onReload} type="button">Atualizar catálogo</button><Link to="/admin/build-journal?surface=development">Voltar ao Diário →</Link></div>
    </section>
  );
}

export function DevelopmentDocumentsSurface() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [catalog, setCatalog] = useState<AdminInternalDocumentCatalogRow[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<AdminInternalDocumentDetailRow | null>(null);
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [detailPhase, setDetailPhase] = useState<'idle' | 'loading' | 'ready' | 'empty' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const requestedSlug = normalizeSlug(searchParams.get('doc'));
  const selectedSlug = requestedSlug ?? catalog[0]?.slug ?? null;

  async function loadCatalog() {
    setPhase('loading');
    setMessage('');
    try {
      setCatalog(await listProductDocsCatalog());
      setPhase('ready');
    } catch (error) {
      const classified = classifyAdminError(error, 'Falha ao carregar a biblioteca documental.');
      setMessage(classified.message);
      setPhase('error');
    }
  }

  useEffect(() => { void loadCatalog(); }, []);

  useEffect(() => {
    if (phase !== 'ready' || !selectedSlug) {
      setSelectedDetail(null);
      setDetailPhase('idle');
      return;
    }

    let cancelled = false;
    setDetailPhase('loading');
    void getProductDocDetailBySlug(selectedSlug).then((detail) => {
      if (cancelled) return;
      setSelectedDetail(detail);
      setDetailPhase(detail ? 'ready' : 'empty');
    }).catch((error) => {
      if (cancelled) return;
      setMessage(classifyAdminError(error, 'Falha ao abrir o documento solicitado.').message);
      setDetailPhase('error');
    });
    return () => { cancelled = true; };
  }, [phase, selectedSlug]);

  const counts = useMemo(() => ({
    published: catalog.filter((document) => document.status === 'published').length,
    restricted: catalog.filter((document) => document.sensitivity === 'restricted').length,
    warnings: catalog.filter((document) => document.current_validation_status === 'warning').length,
  }), [catalog]);

  function openDocument(slug: string) {
    const next = new URLSearchParams(searchParams);
    next.set('surface', 'development');
    next.set('doc', slug);
    setSearchParams(next);
  }

  if (phase === 'loading') return <main className="gso-development-documents-v2"><LoadingState title="Abrindo biblioteca" description="Consultando o catálogo governado do cockpit." /></main>;
  if (phase === 'error') return <main className="gso-development-documents-v2"><ErrorState description={message || 'Falha ao carregar a biblioteca documental.'} /></main>;

  return (
    <main className="gso-development-documents-v2">
      <header className="gso-docs-v2-command">
        <div><span className="gso-docs-v2-label">KNOWLEDGE / CONTROLLED SOURCES</span><h1>Biblioteca documental</h1><p>Fontes que explicam o estado atual, as decisões e o modo como o ConfiOne é construído.</p></div>
        <div className="gso-docs-v2-command-actions"><span><strong>{catalog.length}</strong> fontes</span><span><strong>{counts.published}</strong> publicadas</span><button onClick={() => void loadCatalog()} type="button">Recarregar</button></div>
      </header>
      <div className="gso-docs-v2-layout">
        <CatalogIndex catalog={catalog} onQueryChange={setQuery} onSelect={openDocument} query={query} selectedSlug={selectedSlug} />
        <section className="gso-docs-v2-reader">
          {detailPhase === 'loading' ? <LoadingState title="Abrindo fonte" description="Preparando a leitura sanitizada." /> : null}
          {detailPhase === 'error' ? <ErrorState description={message || 'Falha ao abrir a fonte.'} /> : null}
          {detailPhase === 'empty' || (!selectedSlug && detailPhase !== 'loading') ? <EmptyDocumentStage catalogCount={catalog.length} onReload={() => void loadCatalog()} /> : null}
          {selectedDetail && detailPhase === 'ready' ? <ProductDocReaderPanel className="gso-docs-v2-reader-panel" document={selectedDetail} officialLinkLabel="Abrir na biblioteca completa" showOfficialLink /> : null}
        </section>
        <aside className="gso-docs-v2-context">
          <section><span className="gso-docs-v2-label">Saúde do catálogo</span><div className="gso-docs-v2-stat"><strong>{counts.published}</strong><span>publicadas</span></div><div className="gso-docs-v2-stat"><strong>{counts.warnings}</strong><span>com alerta de validação</span></div><div className="gso-docs-v2-stat"><strong>{counts.restricted}</strong><span>restritas</span></div></section>
          <section><span className="gso-docs-v2-label">Como ler</span><ol><li><b>01</b><span>Escolha a fonte no índice.</span></li><li><b>02</b><span>Leia o resumo e a origem.</span></li><li><b>03</b><span>Use o Diário para entender o contexto.</span></li></ol></section>
          <section><span className="gso-docs-v2-label">Regra do cockpit</span><p>Esta biblioteca não é explorador de arquivos. Exibe apenas documentos publicados, sanitizados e autorizados pelo catálogo real.</p><Link to="/admin/build-journal?surface=development">Ver memória de construção →</Link></section>
        </aside>
      </div>
    </main>
  );
}
