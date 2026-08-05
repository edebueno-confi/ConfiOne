import { useEffect, useMemo, useState } from 'react';
import { SettingsPageHeader } from './SettingsPageHeader';
import { profileForSlug, useKnowledgeSpaceProfiles } from './knowledge-space-profiles';
import type { Brand } from './settings-api';
import './settings-shell.css';

const UNAVAILABLE = 'Indisponível';
const CONTROL =
  'w-full rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-2.5 py-2 text-sm text-[color:var(--minimal-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]';

/**
 * Mesmo formato de estado de carga usado por SettingsPage. A tela nao faz
 * leitura propria de marcas: recebe a lista e os handlers ja existentes.
 */
type BrandsState =
  | { phase: 'idle' | 'loading' }
  | { phase: 'ready'; items: Brand[] }
  | { phase: 'error' };

/** Iniciais do nome da marca. O projeto nao tem envio de logo. */
function monogramOf(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function matchesSearch(brand: Brand, term: string) {
  if (!term) return true;
  const needle = term.trim().toLowerCase();
  return (
    brand.label.toLowerCase().includes(needle) ||
    (brand.helpCenterSlug ?? '').toLowerCase().includes(needle)
  );
}

/**
 * Marcas atendidas na plataforma: lista a esquerda, detalhe da marca escolhida
 * a direita.
 *
 * O backend oferece apenas leitura da lista, criacao (nome + central) e
 * arquivamento. Nao existe edicao de marca, logo, cor, idioma ou dominio em
 * `brands`; o que aparece alem disso vem do perfil da central de ajuda e some
 * como "Indisponivel" quando essa leitura nao resolve.
 */
export function BrandsSettingsPage({
  state,
  onCreate,
  onArchive,
  mutating,
  mutationError,
}: {
  state: BrandsState;
  onCreate: (input: { label: string; helpCenterSlug: string; sortOrder: number }) => Promise<boolean>;
  onArchive: (id: string) => Promise<void>;
  mutating: boolean;
  mutationError: string | null;
}) {
  // Referência estável da lista: os memos de recorte dependem dela e não podem
  // recalcular a cada render.
  const brands = useMemo(() => (state.phase === 'ready' ? state.items : []), [state]);
  const profiles = useKnowledgeSpaceProfiles();

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [labelError, setLabelError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const activeBrands = useMemo(() => brands.filter((brand) => brand.isActive), [brands]);
  const visibleBrands = useMemo(
    () => brands.filter((brand) => matchesSearch(brand, search)),
    [brands, search],
  );
  const linkedCount = activeBrands.filter((brand) => Boolean(brand.helpCenterSlug)).length;
  const publishedArticles = useMemo(() => {
    if (profiles.status !== 'ready') return null;
    let total = 0;
    for (const brand of activeBrands) {
      total += profileForSlug(profiles, brand.helpCenterSlug)?.publishedArticleCount ?? 0;
    }
    return total;
  }, [activeBrands, profiles]);

  // A marca escolhida acompanha a lista: se ela sai do recorte da busca ou da
  // leitura, o painel volta para a primeira marca visivel.
  useEffect(() => {
    if (!visibleBrands.length) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    if (!visibleBrands.some((brand) => brand.id === selectedId)) setSelectedId(visibleBrands[0].id);
  }, [selectedId, visibleBrands]);

  useEffect(() => {
    setConfirmingArchive(false);
  }, [selectedId]);

  const selected = visibleBrands.find((brand) => brand.id === selectedId) ?? null;
  const selectedProfile = profileForSlug(profiles, selected?.helpCenterSlug ?? null);

  const startCreate = () => {
    setCreating(true);
    setNewLabel('');
    setNewSlug('');
    setLabelError(null);
    setSlugError(null);
    setFeedback(null);
  };

  const submitCreate = async () => {
    const label = newLabel.trim();
    const slug = newSlug.trim();
    let invalid = false;

    if (!label) {
      setLabelError('Informe o nome da marca.');
      invalid = true;
    } else {
      setLabelError(null);
    }

    // A central de ajuda é opcional no cadastro; quando preenchida precisa ter o
    // formato de endereço que a Central usa.
    if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setSlugError('Use apenas letras minúsculas, números e hífen. Exemplo: after-sale.');
      invalid = true;
    } else {
      setSlugError(null);
    }

    if (invalid) return;

    const created = await onCreate({ label, helpCenterSlug: slug, sortOrder: (activeBrands.length + 1) * 10 });
    if (created) {
      setCreating(false);
      setNewLabel('');
      setNewSlug('');
      setFeedback(`Marca “${label}” criada.`);
    }
  };

  const submitArchive = async () => {
    if (!selected) return;
    await onArchive(selected.id);
    setConfirmingArchive(false);
  };

  return (
    <div className="gso-settings-page gso-visual-v1-settings">
      <SettingsPageHeader
        actions={
          <button
            className="gso-settings-button gso-settings-button--primary"
            disabled={mutating || creating}
            onClick={startCreate}
            type="button"
          >
            Nova marca
          </button>
        }
        description="As marcas atendidas na plataforma e a central de ajuda que cada uma publica para o cliente."
        meta={`${activeBrands.length} marcas ativas`}
        title="Marcas"
        titleId="settings-brands-title"
      />

      <section aria-label="Resumo das marcas" className="gso-settings-metrics">
        <div className="gso-settings-metric gso-settings-metric--accent">
          <span>Marcas ativas</span>
          <strong>{activeBrands.length}</strong>
          <small>atendidas na plataforma</small>
        </div>
        <div className="gso-settings-metric">
          <span>Com central de ajuda</span>
          <strong>{linkedCount}</strong>
          <small>{linkedCount === activeBrands.length ? 'todas as marcas ativas' : 'marcas com central vinculada'}</small>
        </div>
        {publishedArticles === null ? null : (
          <div className="gso-settings-metric">
            <span>Artigos publicados</span>
            <strong>{publishedArticles}</strong>
            <small>somando as centrais vinculadas</small>
          </div>
        )}
      </section>

      {feedback ? <p className="gso-settings-inline-message" role="status">{feedback}</p> : null}
      {mutationError ? <p className="gso-settings-inline-error" role="alert">{mutationError}</p> : null}

      {state.phase === 'idle' || state.phase === 'loading' ? (
        <p className="gso-settings-empty">Carregando as marcas cadastradas…</p>
      ) : state.phase === 'error' ? (
        <p className="gso-settings-inline-error" role="alert">
          Não foi possível carregar as marcas agora. Atualize a página e tente novamente.
        </p>
      ) : (
        <div className="gso-settings-split">
          <div className="gso-settings-page">
            <section aria-label="Busca de marcas" className="gso-settings-toolbar">
              <label className="gso-settings-toolbar-field gso-settings-toolbar-field--wide">
                <span>Buscar por nome ou endereço da central</span>
                <input
                  className={CONTROL}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Ex.: After Sale ou after-sale"
                  type="search"
                  value={search}
                />
              </label>
              <div className="gso-settings-toolbar-actions">
                <button className="gso-settings-toolbar-reset" disabled={!search} onClick={() => setSearch('')} type="button">
                  Limpar busca
                </button>
              </div>
            </section>

            {!brands.length ? (
              <p className="gso-settings-empty">
                Nenhuma marca cadastrada. Use “Nova marca” para cadastrar a primeira marca atendida.
              </p>
            ) : !visibleBrands.length ? (
              <p className="gso-settings-empty">
                Nenhuma marca corresponde a “{search}”.{' '}
                <button className="gso-settings-toolbar-reset" onClick={() => setSearch('')} type="button">
                  Limpar busca
                </button>
              </p>
            ) : (
              <>
                <div className="gso-settings-table-frame">
                  <table className="gso-settings-table">
                    <thead>
                      <tr>
                        <th scope="col">Marca</th>
                        <th scope="col">Central de ajuda</th>
                        <th scope="col">Situação</th>
                        <th scope="col">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleBrands.map((brand) => {
                        const profile = profileForSlug(profiles, brand.helpCenterSlug);
                        return (
                          <tr className={brand.id === selectedId ? 'is-selected' : undefined} key={brand.id}>
                            <td>
                              <button
                                aria-current={brand.id === selectedId ? 'true' : undefined}
                                className="gso-settings-row-select"
                                onClick={() => { setSelectedId(brand.id); setCreating(false); }}
                                type="button"
                              >
                                {brand.label}
                              </button>
                            </td>
                            <td>
                              {brand.helpCenterSlug ? `/${brand.helpCenterSlug}` : UNAVAILABLE}
                              {profile ? <small>{profile.displayName}</small> : null}
                            </td>
                            <td>
                              <span className={`gso-settings-status ${brand.isActive ? 'gso-settings-status--success' : 'gso-settings-status--muted'}`}>
                                {brand.isActive ? 'Ativa' : 'Arquivada'}
                              </span>
                            </td>
                            <td>
                              <div className="gso-settings-table-actions">
                                {brand.isActive ? (
                                  <button
                                    className="gso-settings-button gso-settings-button--secondary"
                                    disabled={mutating}
                                    onClick={() => { setSelectedId(brand.id); setCreating(false); setConfirmingArchive(true); }}
                                    type="button"
                                  >
                                    Arquivar
                                  </button>
                                ) : (
                                  <span className="gso-settings-tone-muted">Sem ações</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="gso-settings-table-caption">
                  Marcas arquivadas continuam listadas para consulta, mas deixam de ser oferecidas nas superfícies que usam marca.
                </p>
              </>
            )}
          </div>

          <aside aria-label="Detalhe da marca" className="gso-settings-card">
            {creating ? (
              <>
                <div className="gso-settings-card-header">
                  <div>
                    <p className="gso-settings-eyebrow">Cadastro</p>
                    <h3>Nova marca</h3>
                    <p>Informe o nome da marca e, quando ela já tiver central de ajuda, o endereço dessa central.</p>
                  </div>
                </div>
                <div className="gso-settings-form-grid">
                  <label className="gso-settings-field gso-settings-field--wide">
                    <span>Nome da marca</span>
                    <input
                      aria-describedby={labelError ? 'new-brand-label-error' : undefined}
                      aria-invalid={labelError ? true : undefined}
                      className={CONTROL}
                      onChange={(event) => setNewLabel(event.target.value)}
                      placeholder="Ex.: After Sale"
                      value={newLabel}
                    />
                    {labelError ? <span className="gso-settings-field-error" id="new-brand-label-error">{labelError}</span> : null}
                  </label>
                  <label className="gso-settings-field gso-settings-field--wide">
                    <span>Central de ajuda <small>(opcional)</small></span>
                    <input
                      aria-describedby={slugError ? 'new-brand-slug-error' : undefined}
                      aria-invalid={slugError ? true : undefined}
                      className={CONTROL}
                      onChange={(event) => setNewSlug(event.target.value)}
                      placeholder="Ex.: after-sale"
                      value={newSlug}
                    />
                    {slugError ? <span className="gso-settings-field-error" id="new-brand-slug-error">{slugError}</span> : null}
                  </label>
                </div>
                <div className="gso-settings-card-actions">
                  <button className="gso-settings-button gso-settings-button--primary" disabled={mutating} onClick={() => void submitCreate()} type="button">
                    {mutating ? 'Salvando…' : 'Salvar marca'}
                  </button>
                  <button className="gso-settings-button gso-settings-button--secondary" disabled={mutating} onClick={() => setCreating(false)} type="button">
                    Cancelar
                  </button>
                </div>
              </>
            ) : selected ? (
              <>
                <div className="gso-settings-identity">
                  <span aria-hidden="true" className="gso-settings-monogram">
                    {selectedProfile?.logoUrl ? <img alt="" src={selectedProfile.logoUrl} /> : monogramOf(selected.label)}
                  </span>
                  <div>
                    <p className="gso-settings-eyebrow">Marca</p>
                    <h3>{selected.label}</h3>
                  </div>
                  <span className={`gso-settings-status ${selected.isActive ? 'gso-settings-status--success' : 'gso-settings-status--muted'}`}>
                    {selected.isActive ? 'Ativa' : 'Arquivada'}
                  </span>
                </div>

                <dl className="gso-settings-definition">
                  <div>
                    <dt>Central de ajuda</dt>
                    <dd>{selected.helpCenterSlug ? `/${selected.helpCenterSlug}` : UNAVAILABLE}</dd>
                  </div>
                  <div>
                    <dt>Idioma padrão</dt>
                    <dd>{selectedProfile?.defaultLocale ?? UNAVAILABLE}</dd>
                  </div>
                  <div>
                    <dt>Domínio principal</dt>
                    <dd>{selectedProfile?.primaryDomain ?? UNAVAILABLE}</dd>
                  </div>
                  <div>
                    <dt>Artigos publicados</dt>
                    <dd>{selectedProfile?.publishedArticleCount ?? UNAVAILABLE}</dd>
                  </div>
                  <div>
                    <dt>Categorias</dt>
                    <dd>{selectedProfile?.categoryCount ?? UNAVAILABLE}</dd>
                  </div>
                </dl>

                <p className="gso-settings-help">
                  {profiles.status === 'unavailable'
                    ? 'O perfil da central desta marca não está disponível para o seu acesso, por isso idioma, domínio e volume de conteúdo aparecem como indisponíveis.'
                    : 'Idioma, domínio e volume de conteúdo são definidos na própria central de ajuda e não são editáveis aqui.'}
                </p>

                {!selected.isActive ? (
                  <p className="gso-settings-help">Esta marca está arquivada e não é oferecida nas superfícies que usam marca.</p>
                ) : confirmingArchive ? (
                  <div className="gso-settings-confirm" role="group">
                    <strong>Arquivar “{selected.label}”?</strong>
                    <p>
                      A marca deixa de aparecer entre as marcas ativas e não será mais oferecida nas superfícies que usam
                      marca. O conteúdo já publicado permanece como está.
                    </p>
                    <div className="gso-settings-card-actions">
                      <button className="gso-settings-button gso-settings-button--primary" disabled={mutating} onClick={() => void submitArchive()} type="button">
                        {mutating ? 'Arquivando…' : 'Confirmar arquivamento'}
                      </button>
                      <button className="gso-settings-button gso-settings-button--secondary" disabled={mutating} onClick={() => setConfirmingArchive(false)} type="button">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="gso-settings-card-actions">
                    <button className="gso-settings-button gso-settings-button--secondary" disabled={mutating} onClick={() => setConfirmingArchive(true)} type="button">
                      Arquivar marca
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="gso-settings-empty">Escolha uma marca na lista para ver o detalhe dela aqui.</p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
