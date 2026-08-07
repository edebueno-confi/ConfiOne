import { useEffect, useMemo, useState } from 'react';
import { profileForSlug, useKnowledgeSpaceProfiles } from './knowledge-space-profiles';
import type { Brand } from './settings-api';
import { UiBadge } from './ui/UiBadge';
import { UiButton } from './ui/UiButton';
import { UiCard } from './ui/UiCard';
import { UiCardHeader } from './ui/UiCardHeader';
import { UiDetailList } from './ui/UiDetailList';
import { UiEmptyState } from './ui/UiEmptyState';
import { UiField } from './ui/UiField';
import { UiMetric } from './ui/UiMetric';
import { UiMetricRow } from './ui/UiMetricRow';
import { UiPage } from './ui/UiPage';
import { UiPageHeader } from './ui/UiPageHeader';
import { UiSearchField } from './ui/UiSearchField';
import { UiTable } from './ui/UiTable';
import { UiToolbar } from './ui/UiToolbar';
import './settings-ui.css';

const UNAVAILABLE = 'Indisponível';

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
    <UiPage className="gso-ui-page--fill">
      <UiPageHeader
        actions={
          <UiButton disabled={mutating || creating} icon="plus" onClick={startCreate} variant="primary">
            Nova marca
          </UiButton>
        }
        description="As marcas atendidas na plataforma e a central de ajuda que cada uma publica para o cliente."
        meta={`${activeBrands.length} marcas ativas`}
        title="Marcas"
        titleId="settings-brands-title"
      />

      <UiMetricRow label="Resumo das marcas">
        <UiMetric icon="brand" label="Marcas ativas" sub="atendidas na plataforma" tone="primary" value={activeBrands.length} />
        <UiMetric
          icon="help"
          label="Com central de ajuda"
          sub={linkedCount === activeBrands.length ? 'todas as marcas ativas' : 'marcas com central vinculada'}
          tone="accent"
          value={linkedCount}
        />
        {publishedArticles === null ? null : (
          <UiMetric icon="list" label="Artigos publicados" sub="somando as centrais vinculadas" tone="neutral" value={publishedArticles} />
        )}
      </UiMetricRow>

      {feedback ? <p className="gso-ui-alert gso-ui-alert--success" role="status">{feedback}</p> : null}
      {mutationError ? <p className="gso-ui-alert gso-ui-alert--error" role="alert">{mutationError}</p> : null}

      {state.phase === 'idle' || state.phase === 'loading' ? (
        <UiCard>
          <UiEmptyState icon="brand" title="Carregando as marcas cadastradas…" />
        </UiCard>
      ) : state.phase === 'error' ? (
        <p className="gso-ui-alert gso-ui-alert--error" role="alert">
          Não foi possível carregar as marcas agora. Atualize a página e tente novamente.
        </p>
      ) : (
        <div className="gso-ui-split gso-ui-grow">
          <div className="gso-ui-stack">
            <UiToolbar
              actions={
                <button className="gso-ui-linkbutton" disabled={!search} onClick={() => setSearch('')} type="button">
                  Limpar busca
                </button>
              }
              label="Busca de marcas"
            >
              <div className="gso-ui-toolbar-field gso-ui-toolbar-field--wide">
                <UiField label="Buscar por nome ou endereço da central">
                  <UiSearchField
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Ex.: After Sale ou after-sale"
                    value={search}
                  />
                </UiField>
              </div>
            </UiToolbar>

            {!brands.length ? (
              <UiCard>
                <UiEmptyState
                  description="Use “Nova marca” para cadastrar a primeira marca atendida."
                  icon="brand"
                  title="Nenhuma marca cadastrada"
                />
              </UiCard>
            ) : !visibleBrands.length ? (
              <UiCard>
                <UiEmptyState
                  action={
                    <button className="gso-ui-linkbutton" onClick={() => setSearch('')} type="button">
                      Limpar busca
                    </button>
                  }
                  description={`Nenhuma marca corresponde a “${search}”.`}
                  icon="search"
                  title="Nada nesta busca"
                />
              </UiCard>
            ) : (
              <UiCard fill flush label="Marcas cadastradas">
                <UiTable label="Marcas cadastradas">
                  <thead>
                    <tr>
                      <th scope="col">Marca</th>
                      <th scope="col">Central de ajuda</th>
                      <th scope="col">Situação</th>
                      <th className="gso-ui-table-actions--head" scope="col">Ações</th>
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
                              className="gso-ui-rowselect"
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
                            <UiBadge dot tone={brand.isActive ? 'success' : 'neutral'}>
                              {brand.isActive ? 'Ativa' : 'Arquivada'}
                            </UiBadge>
                          </td>
                          <td>
                            <div className="gso-ui-table-actions">
                              {brand.isActive ? (
                                <UiButton
                                  compact
                                  disabled={mutating}
                                  icon="archive"
                                  onClick={() => { setSelectedId(brand.id); setCreating(false); setConfirmingArchive(true); }}
                                >
                                  Arquivar
                                </UiButton>
                              ) : (
                                <span>Sem ações</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </UiTable>
                <p className="gso-ui-card-foot">
                  Marcas arquivadas continuam listadas para consulta, mas deixam de ser oferecidas nas superfícies que usam marca.
                </p>
              </UiCard>
            )}
          </div>

          <aside aria-label="Detalhe da marca" className="gso-ui-card">
            {creating ? (
              <>
                <UiCardHeader
                  description="Informe o nome da marca e, quando ela já tiver central de ajuda, o endereço dessa central."
                  icon="plus"
                  title="Nova marca"
                  tone="primary"
                />
                <div className="gso-ui-card-body">
                  <div className="gso-ui-grid">
                    <UiField error={labelError} errorId="new-brand-label-error" label="Nome da marca" wide>
                      <input
                        aria-describedby={labelError ? 'new-brand-label-error' : undefined}
                        aria-invalid={labelError ? true : undefined}
                        className="gso-ui-control"
                        onChange={(event) => setNewLabel(event.target.value)}
                        placeholder="Ex.: After Sale"
                        value={newLabel}
                      />
                    </UiField>
                    <UiField
                      error={slugError}
                      errorId="new-brand-slug-error"
                      label={<>Central de ajuda <small>(opcional)</small></>}
                      wide
                    >
                      <input
                        aria-describedby={slugError ? 'new-brand-slug-error' : undefined}
                        aria-invalid={slugError ? true : undefined}
                        className="gso-ui-control"
                        onChange={(event) => setNewSlug(event.target.value)}
                        placeholder="Ex.: after-sale"
                        value={newSlug}
                      />
                    </UiField>
                  </div>
                </div>
                <div className="gso-ui-actions">
                  <UiButton disabled={mutating} icon="check" onClick={() => void submitCreate()} variant="primary">
                    {mutating ? 'Salvando…' : 'Salvar marca'}
                  </UiButton>
                  <UiButton disabled={mutating} onClick={() => setCreating(false)} variant="ghost">
                    Cancelar
                  </UiButton>
                </div>
              </>
            ) : selected ? (
              <>
                <div className="gso-ui-identity">
                  <span aria-hidden="true" className="gso-ui-monogram">
                    {selectedProfile?.logoUrl ? <img alt="" src={selectedProfile.logoUrl} /> : monogramOf(selected.label)}
                  </span>
                  <div>
                    <h3>{selected.label}</h3>
                    <p>{selected.helpCenterSlug ? `/${selected.helpCenterSlug}` : UNAVAILABLE}</p>
                  </div>
                  <UiBadge dot tone={selected.isActive ? 'success' : 'neutral'}>
                    {selected.isActive ? 'Ativa' : 'Arquivada'}
                  </UiBadge>
                </div>

                <div className="gso-ui-card-body">
                  <UiDetailList
                    items={[
                      { icon: 'help', label: 'Central de ajuda', value: selected.helpCenterSlug ? `/${selected.helpCenterSlug}` : UNAVAILABLE },
                      { icon: 'globe', label: 'Idioma padrão', value: selectedProfile?.defaultLocale ?? UNAVAILABLE },
                      { icon: 'link', label: 'Domínio principal', value: selectedProfile?.primaryDomain ?? UNAVAILABLE },
                      { icon: 'list', label: 'Artigos publicados', value: selectedProfile?.publishedArticleCount ?? UNAVAILABLE },
                      { icon: 'tag', label: 'Categorias', value: selectedProfile?.categoryCount ?? UNAVAILABLE },
                    ]}
                  />
                </div>

                <p className="gso-ui-note">
                  {profiles.status === 'unavailable'
                    ? 'O perfil da central desta marca não está disponível para o seu acesso, por isso idioma, domínio e volume de conteúdo aparecem como indisponíveis.'
                    : 'Idioma, domínio e volume de conteúdo são definidos na própria central de ajuda e não são editáveis aqui.'}
                </p>

                {!selected.isActive ? (
                  <p className="gso-ui-note">Esta marca está arquivada e não é oferecida nas superfícies que usam marca.</p>
                ) : confirmingArchive ? (
                  <div className="gso-ui-confirm" role="group">
                    <strong>Arquivar “{selected.label}”?</strong>
                    <p>
                      A marca deixa de aparecer entre as marcas ativas e não será mais oferecida nas superfícies que usam
                      marca. O conteúdo já publicado permanece como está.
                    </p>
                    <div className="gso-ui-actions">
                      <UiButton disabled={mutating} icon="archive" onClick={() => void submitArchive()} variant="danger">
                        {mutating ? 'Arquivando…' : 'Confirmar arquivamento'}
                      </UiButton>
                      <UiButton disabled={mutating} onClick={() => setConfirmingArchive(false)} variant="ghost">
                        Cancelar
                      </UiButton>
                    </div>
                  </div>
                ) : (
                  <div className="gso-ui-actions">
                    <UiButton disabled={mutating} icon="archive" onClick={() => setConfirmingArchive(true)} variant="danger">
                      Arquivar marca
                    </UiButton>
                  </div>
                )}
              </>
            ) : (
              <UiEmptyState icon="brand" title="Escolha uma marca na lista para ver o detalhe dela aqui." />
            )}
          </aside>
        </div>
      )}
    </UiPage>
  );
}
