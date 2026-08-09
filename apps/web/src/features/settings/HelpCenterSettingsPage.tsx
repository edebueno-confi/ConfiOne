import { useState } from 'react';
import { Link } from 'react-router';
import { PUBLIC_HELP_CENTER_HREF } from '../../app/release-surface.mjs';
import {
  profileForSlug,
  useKnowledgeSpaceProfiles,
  type KnowledgeSpaceProfilesState,
} from './knowledge-space-profiles';
import type { HelpCenterSupportContacts } from './settings-api';
import { UiBadge } from './ui/UiBadge';
import { UiButton } from './ui/UiButton';
import { UiCard } from './ui/UiCard';
import { UiCardHeader } from './ui/UiCardHeader';
import { UiDetailList } from './ui/UiDetailList';
import { UiEmptyState } from './ui/UiEmptyState';
import { UiField } from './ui/UiField';
import { UiHintBand } from './ui/UiHintBand';
import { UiIcon } from './ui/UiIcon';
import { UiMetric } from './ui/UiMetric';
import { UiMetricRow } from './ui/UiMetricRow';
import { UiPage } from './ui/UiPage';
import { UiPageHeader } from './ui/UiPageHeader';
import './settings-ui.css';

const UNAVAILABLE = 'Indisponível neste ambiente.';
const NOT_CONFIGURED = 'Indisponível';

/** Formato do estado de carga usado por SettingsPage. */
type ContactsState =
  | { phase: 'idle' | 'loading' }
  | { phase: 'ready'; items: HelpCenterSupportContacts[] }
  | { phase: 'error' };

/** Os cinco canais que o backend realmente grava. */
const CONTACT_FIELDS = [
  ['email', 'E-mail de suporte', 'email', 'atendimento@suamarca.com.br', 'mail'],
  ['whatsapp', 'WhatsApp de suporte', 'tel', '(41) 98765-2115', 'phone'],
  ['websiteUrl', 'Site ou portal', 'url', 'https://www.suamarca.com.br', 'globe'],
  ['statusPageUrl', 'Página de status', 'url', 'https://status.suamarca.com.br', 'activity'],
  ['docsUrl', 'Link alternativo da Central', 'url', 'https://ajuda.suamarca.com.br', 'link'],
] as const;

type ContactField = (typeof CONTACT_FIELDS)[number][0];

const URL_FIELDS: ContactField[] = ['websiteUrl', 'statusPageUrl', 'docsUrl'];

function validateContacts(form: HelpCenterSupportContacts) {
  const errors: Partial<Record<ContactField, string>> = {};
  const email = form.email?.trim() ?? '';

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.email = 'Informe um e-mail válido, no formato nome@dominio.com.';
  }

  for (const field of URL_FIELDS) {
    const value = form[field]?.trim() ?? '';
    if (!value) continue;
    if (!/^https?:\/\//i.test(value)) {
      errors[field] = 'O endereço precisa começar com http:// ou https://.';
      continue;
    }
    try {
      new URL(value);
    } catch {
      errors[field] = 'Endereço inválido. Confira o link informado.';
    }
  }

  return errors;
}

function hasPublicContact(item: HelpCenterSupportContacts) {
  return CONTACT_FIELDS.some(([field]) => Boolean(item[field]?.trim()));
}

/**
 * Subpainel de contatos e identidade de marca (Preservado para capabilities reais de gravação).
 * PLACEMENT FUTURO PENDENTE: Mover para rota própria de marcas no futuro.
 */
function HelpCenterContactsSubpanel({
  item,
  profiles,
  onSave,
  mutating,
  mutationError,
}: {
  item: HelpCenterSupportContacts;
  profiles: KnowledgeSpaceProfilesState;
  onSave: (input: HelpCenterSupportContacts) => Promise<void>;
  mutating: boolean;
  mutationError: string | null;
}) {
  const [form, setForm] = useState(item);
  const [errors, setErrors] = useState<Partial<Record<ContactField, string>>>({});
  const [saved, setSaved] = useState(false);
  const profile = profileForSlug(profiles, item.knowledgeSpaceSlug);
  const published = hasPublicContact(item);

  const update = (field: ContactField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setSaved(false);
  };

  const submit = async () => {
    const nextErrors = validateContacts(form);
    setErrors(nextErrors);
    setSaved(false);
    if (Object.keys(nextErrors).length) return;
    await onSave(form);
    setSaved(true);
  };

  return (
    <div className="rounded-xl border border-[color:var(--gso-border)] bg-[color:var(--gso-surface-primary)] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-[color:var(--gso-text-primary)]">{item.brandName}</h4>
          <p className="text-xs text-[color:var(--gso-text-secondary)]">/{item.knowledgeSpaceSlug}</p>
        </div>
        <UiBadge dot tone={published ? 'success' : 'warning'}>
          {published ? 'Contato publicado' : 'Sem contato publicado'}
        </UiBadge>
      </div>

      <UiDetailList
        columns
        items={[
          { icon: 'brand', label: 'Nome de exibição', value: item.knowledgeSpaceDisplayName },
          { icon: 'help', label: 'Endereço da central', value: `/${item.knowledgeSpaceSlug}` },
          { icon: 'globe', label: 'Idioma padrão', value: profile?.defaultLocale ?? NOT_CONFIGURED },
          { icon: 'link', label: 'Domínio principal', value: profile?.primaryDomain ?? NOT_CONFIGURED },
        ]}
      />

      <div className="gso-ui-grid">
        {CONTACT_FIELDS.map(([field, label, type, placeholder, icon]) => {
          const error = errors[field];
          const errorId = `${item.knowledgeSpaceId}-${field}-error`;
          return (
            <UiField
              error={error}
              errorId={errorId}
              key={field}
              label={<><UiIcon name={icon} />{label}</>}
            >
              <input
                aria-describedby={error ? errorId : undefined}
                aria-invalid={error ? true : undefined}
                className="gso-ui-control"
                disabled={mutating}
                onChange={(event) => update(field, event.target.value)}
                placeholder={placeholder}
                type={type}
                value={form[field] ?? ''}
              />
            </UiField>
          );
        })}
      </div>

      {mutationError ? <p className="gso-ui-alert gso-ui-alert--error" role="alert">{mutationError}</p> : null}
      {saved && !mutationError ? (
        <p className="gso-ui-alert gso-ui-alert--success" role="status">Canais de contato salvos e já publicados na central.</p>
      ) : null}

      <div className="gso-ui-actions">
        <UiButton disabled={mutating} icon="check" onClick={() => void submit()} variant="primary">
          {mutating ? 'Salvando…' : 'Salvar canais de contato'}
        </UiButton>
      </div>
    </div>
  );
}

/**
 * Screen 04: Central de ajuda (PO Approved Blueprint Composition)
 */
export function HelpCenterSettingsPage({
  state,
  onSave,
  mutating,
  mutationError,
}: {
  state: ContactsState;
  onSave: (input: HelpCenterSupportContacts) => Promise<void>;
  mutating: boolean;
  mutationError: string | null;
}) {
  const profiles = useKnowledgeSpaceProfiles();
  const items = state.phase === 'ready' ? state.items : [];
  const [contactsExpanded, setContactsExpanded] = useState(false);

  const summary = items.reduce(
    (current, item) => {
      const profile = profileForSlug(profiles, item.knowledgeSpaceSlug);
      const articleCount = profile?.articleCount;
      const publishedArticleCount = profile?.publishedArticleCount;
      const categoryCount = profile?.categoryCount;
      return {
        configuredContacts: current.configuredContacts + (hasPublicContact(item) ? 1 : 0),
        profiles: current.profiles + (profile ? 1 : 0),
        articles: current.articles === null || articleCount === null || articleCount === undefined ? null : current.articles + articleCount,
        publishedArticles: current.publishedArticles === null || publishedArticleCount === null || publishedArticleCount === undefined ? null : current.publishedArticles + publishedArticleCount,
        categories: current.categories === null || categoryCount === null || categoryCount === undefined ? null : current.categories + categoryCount,
      };
    },
    { configuredContacts: 0, profiles: 0, articles: 0 as number | null, publishedArticles: 0 as number | null, categories: 0 as number | null },
  );

  return (
    <UiPage className="gso-po-v2-help-center space-y-4">
      {/* A. HEADER DA PÁGINA */}
      <UiPageHeader
        actions={
          <Link
            className="gso-ui-button gso-ui-button--secondary inline-flex items-center gap-2"
            rel="noreferrer"
            target="_blank"
            to={PUBLIC_HELP_CENTER_HREF}
          >
            <UiIcon name="external" />
            Visualizar Central de Ajuda ↗
          </Link>
        }
        description="Configuração editorial, publicação e governança do conhecimento."
        title="Central de Ajuda"
        titleId="settings-help-center-title"
      />

      {/* B. SUMMARY RAIL (5 Métricas Editoriais) */}
      <UiMetricRow label="Resumo editorial da central de ajuda">
        <UiMetric
          icon="list"
          label="Artigos publicados"
          sub="artigos ativos no portal público"
          tone="primary"
          value={summary.publishedArticles ?? NOT_CONFIGURED}
        />
        <UiMetric
          icon="archive"
          label="Rascunhos"
          sub="em fluxo de revisão editorial"
          tone="neutral"
          value={NOT_CONFIGURED}
        />
        <UiMetric
          icon="layers"
          label="Categorias"
          sub="coleções e tópicos ativos"
          tone="neutral"
          value={summary.categories ?? NOT_CONFIGURED}
        />
        <UiMetric
          icon="users"
          label="Autores ativos"
          sub="colaboradores com publicação"
          tone="neutral"
          value={NOT_CONFIGURED}
        />
        <UiMetric
          icon="clock"
          label="Tempo médio de atualização"
          sub="cadência de revisão do catálogo"
          tone="neutral"
          value={NOT_CONFIGURED}
        />
      </UiMetricRow>

      {/* C. LINHA PRINCIPAL (2 COLUNAS: Configuração Editorial | Publicação e Canais) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Configuração editorial */}
        <UiCard labelledBy="editorial-config-title">
          <UiCardHeader
            description="Políticas de produção, revisão e publicação do conhecimento."
            icon="shield"
            title="Configuração editorial"
            titleId="editorial-config-title"
            tone="primary"
          />
          <div className="gso-ui-card-body space-y-3 pt-2">
            {[
              ['Publicação', 'Fluxo de aprovação antes da disponibilização pública.', 'publication'],
              ['Revisão', 'Exigência de revisão por pares para alterações em artigos.', 'review'],
              ['Visibilidade', 'Regras de restrição por perfil, área e grupo.', 'visibility'],
              ['Comentários', 'Permissão para feedback interno e comentários dos leitores.', 'comments'],
              ['Versionamento', 'Histórico de revisões e restauração de versões anteriores.', 'versioning'],
              ['SLAs editoriais', 'Prazos máximos para atualização de rascunhos e revisão.', 'slas'],
            ].map(([title, desc, key]) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 rounded-lg border border-[color:var(--gso-border)] bg-[color:var(--gso-surface-secondary,#18263F)] text-xs"
              >
                <div className="flex items-start gap-3 min-w-0 pr-2">
                  <span className="mt-0.5 text-[color:var(--gso-text-secondary)]">
                    <UiIcon name="shield" />
                  </span>
                  <div className="min-w-0">
                    <strong className="block font-semibold text-[color:var(--gso-text-primary)]">{title}</strong>
                    <p className="text-[11px] text-[color:var(--gso-text-secondary)] leading-tight">{desc}</p>
                  </div>
                </div>
                <span className="shrink-0 text-[11px] text-[color:var(--gso-text-secondary)] font-medium px-2 py-1 rounded bg-[color:var(--gso-surface-primary)] border border-[color:var(--gso-border)]">
                  {UNAVAILABLE}
                </span>
              </div>
            ))}
          </div>
        </UiCard>

        {/* Publicação e canais */}
        <UiCard labelledBy="publication-channels-title">
          <UiCardHeader
            description="Canais de contato e status de publicação do portal."
            icon="globe"
            title="Publicação e canais"
            titleId="publication-channels-title"
            tone="primary"
          />
          <div className="gso-ui-card-body space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 rounded-lg border border-[color:var(--gso-border)] bg-[color:var(--gso-surface-secondary)] text-xs">
              <div className="flex items-start gap-3 min-w-0 pr-2">
                <span className="mt-0.5 text-[color:var(--gso-text-secondary)]"><UiIcon name="globe" /></span>
                <div className="min-w-0">
                  <strong className="block font-semibold text-[color:var(--gso-text-primary)]">Portal público</strong>
                  <p className="text-[11px] text-[color:var(--gso-text-secondary)]">Visualização externa da base de conhecimento.</p>
                </div>
              </div>
              <UiBadge tone="success" dot>Ativo</UiBadge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-[color:var(--gso-border)] bg-[color:var(--gso-surface-secondary)] text-xs">
              <div className="flex items-start gap-3 min-w-0 pr-2">
                <span className="mt-0.5 text-[color:var(--gso-text-secondary)]"><UiIcon name="shield" /></span>
                <div className="min-w-0">
                  <strong className="block font-semibold text-[color:var(--gso-text-primary)]">Área logada</strong>
                  <p className="text-[11px] text-[color:var(--gso-text-secondary)]">Acesso à central integrada ao portal do cliente.</p>
                </div>
              </div>
              <span className="shrink-0 text-[11px] text-[color:var(--gso-text-secondary)] font-medium px-2 py-1 rounded bg-[color:var(--gso-surface-primary)] border border-[color:var(--gso-border)]">
                {UNAVAILABLE}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-[color:var(--gso-border)] bg-[color:var(--gso-surface-secondary)] text-xs">
              <div className="flex items-start gap-3 min-w-0 pr-2">
                <span className="mt-0.5 text-[color:var(--gso-text-secondary)]"><UiIcon name="brand" /></span>
                <div className="min-w-0">
                  <strong className="block font-semibold text-[color:var(--gso-text-primary)]">Marcas vinculadas</strong>
                  <p className="text-[11px] text-[color:var(--gso-text-secondary)]">{items.length} {items.length === 1 ? 'marca vinculada' : 'marcas vinculadas'}</p>
                </div>
              </div>
              <UiBadge tone="primary">{items.length} ativas</UiBadge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-[color:var(--gso-border)] bg-[color:var(--gso-surface-secondary)] text-xs">
              <div className="flex items-start gap-3 min-w-0 pr-2">
                <span className="mt-0.5 text-[color:var(--gso-text-secondary)]"><UiIcon name="globe" /></span>
                <div className="min-w-0">
                  <strong className="block font-semibold text-[color:var(--gso-text-primary)]">Idioma</strong>
                  <p className="text-[11px] text-[color:var(--gso-text-secondary)]">Português (Brasil)</p>
                </div>
              </div>
              <UiBadge tone="neutral">Padrão</UiBadge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-[color:var(--gso-border)] bg-[color:var(--gso-surface-secondary)] text-xs">
              <div className="flex items-start gap-3 min-w-0 pr-2">
                <span className="mt-0.5 text-[color:var(--gso-text-secondary)]"><UiIcon name="link" /></span>
                <div className="min-w-0">
                  <strong className="block font-semibold text-[color:var(--gso-text-primary)]">SEO básico</strong>
                  <p className="text-[11px] text-[color:var(--gso-text-secondary)]">Indexação por buscadores e meta-tags do portal.</p>
                </div>
              </div>
              <span className="shrink-0 text-[11px] text-[color:var(--gso-text-secondary)] font-medium px-2 py-1 rounded bg-[color:var(--gso-surface-primary)] border border-[color:var(--gso-border)]">
                {UNAVAILABLE}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-[color:var(--gso-border)] bg-[color:var(--gso-surface-secondary)] text-xs">
              <div className="flex items-start gap-3 min-w-0 pr-2">
                <span className="mt-0.5 text-[color:var(--gso-text-secondary)]"><UiIcon name="check" /></span>
                <div className="min-w-0">
                  <strong className="block font-semibold text-[color:var(--gso-text-primary)]">Status de publicação</strong>
                  <p className="text-[11px] text-[color:var(--gso-text-secondary)]">{summary.configuredContacts} de {items.length} centrais com contato publicado</p>
                </div>
              </div>
              <UiBadge tone={summary.configuredContacts ? 'success' : 'warning'} dot>
                {summary.configuredContacts ? 'Publicado' : 'Sem contato'}
              </UiBadge>
            </div>
          </div>
        </UiCard>
      </div>

      {/* D. LINHA INFERIOR (2 COLUNAS: Categorias e Coleções 2/3 | Permissões Editoriais 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Categorias e coleções (2/3 width) */}
        <div className="lg:col-span-2">
          <UiCard labelledBy="categories-collections-title">
            <UiCardHeader
              description="Taxonomia e organização dos tópicos da Central de Ajuda."
              icon="layers"
              title="Categorias e coleções"
              titleId="categories-collections-title"
              tone="primary"
            />
            <div className="gso-ui-card-body pt-2 overflow-x-auto">
              <table className="w-full text-xs text-left text-[color:var(--gso-text-primary)]">
                <thead>
                  <tr className="border-b border-[color:var(--gso-border)] bg-[color:var(--gso-surface-secondary)] text-[color:var(--gso-text-secondary)]">
                    <th className="p-2.5 font-semibold">Categoria/Coleção</th>
                    <th className="p-2.5 font-semibold">Descrição</th>
                    <th className="p-2.5 font-semibold text-center">Artigos</th>
                    <th className="p-2.5 font-semibold">Visibilidade</th>
                    <th className="p-2.5 font-semibold">Atualização</th>
                    <th className="p-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length > 0 ? (
                    items.map((item) => {
                      const profile = profileForSlug(profiles, item.knowledgeSpaceSlug);
                      return (
                        <tr key={item.knowledgeSpaceId} className="border-b border-[color:var(--gso-border)] hover:bg-[color:var(--gso-surface-secondary)]">
                          <td className="p-2.5 font-medium">{item.brandName}</td>
                          <td className="p-2.5 text-[color:var(--gso-text-secondary)]">Central {item.knowledgeSpaceDisplayName}</td>
                          <td className="p-2.5 text-center font-mono">{profile?.articleCount ?? '—'}</td>
                          <td className="p-2.5">Pública</td>
                          <td className="p-2.5 text-[color:var(--gso-text-secondary)]">Recente</td>
                          <td className="p-2.5">
                            <UiBadge tone={hasPublicContact(item) ? 'success' : 'warning'} dot>
                              {hasPublicContact(item) ? 'Ativa' : 'Pendente'}
                            </UiBadge>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-[color:var(--gso-text-secondary)]">
                        Nenhuma categoria cadastrada neste ambiente.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="flex items-center justify-between pt-3 text-xs text-[color:var(--gso-text-secondary)]">
                <span>Mostrando {items.length} de {items.length} categorias</span>
                <div className="flex gap-1">
                  <button disabled className="px-2 py-1 rounded border border-[color:var(--gso-border)] opacity-50 cursor-not-allowed">Anterior</button>
                  <button disabled className="px-2 py-1 rounded border border-[color:var(--gso-border)] opacity-50 cursor-not-allowed">Próxima</button>
                </div>
              </div>
            </div>
          </UiCard>
        </div>

        {/* Permissões editoriais (1/3 width) */}
        <div>
          <UiCard labelledBy="editorial-permissions-title">
            <UiCardHeader
              description="Atribuições de criação, edição e publicação."
              icon="users"
              title="Permissões editoriais"
              titleId="editorial-permissions-title"
              tone="neutral"
            />
            <div className="gso-ui-card-body space-y-3 pt-2 text-xs">
              {[
                ['Criar', 'Elaboração de rascunhos e novos tópicos.'],
                ['Revisar', 'Avaliação técnica e revisão ortográfica.'],
                ['Publicar', 'Liberação final para o portal público.'],
                ['Arquivar', 'Remoção de circulação e descontinuação.'],
              ].map(([action, desc]) => (
                <div key={action} className="p-2.5 rounded-lg border border-[color:var(--gso-border)] bg-[color:var(--gso-surface-secondary)] space-y-1">
                  <div className="flex justify-between items-center">
                    <strong className="font-semibold text-[color:var(--gso-text-primary)]">{action}</strong>
                    <span className="text-[10px] text-[color:var(--gso-text-secondary)]">{NOT_CONFIGURED}</span>
                  </div>
                  <p className="text-[11px] text-[color:var(--gso-text-secondary)]">{desc}</p>
                </div>
              ))}

              <div className="pt-2 border-t border-[color:var(--gso-border)]">
                <Link to="/admin/access" className="text-xs font-semibold text-[color:var(--gso-action-blue,#2D7CFF)] hover:underline inline-flex items-center gap-1">
                  Gerenciar permissões editoriais →
                </Link>
              </div>
            </div>
          </UiCard>
        </div>
      </div>

      {/* Canais de Contato Registrados (Preservado para capabilities reais de gravação) */}
      <div className="pt-2">
        <button
          className="flex items-center justify-between w-full p-3 rounded-xl border border-[color:var(--gso-border)] bg-[color:var(--gso-surface-primary)] text-xs font-semibold text-[color:var(--gso-text-primary)] hover:bg-[color:var(--gso-surface-secondary)] transition-colors"
          onClick={() => setContactsExpanded((curr) => !curr)}
          type="button"
        >
          <span className="flex items-center gap-2">
            <UiIcon name="mail" />
            Canais de Contato Registrados ({items.length} centrais)
          </span>
          <span>{contactsExpanded ? '▲ Recolher' : '▼ Expandir para editar'}</span>
        </button>

        {contactsExpanded ? (
          <div className="mt-3 space-y-4">
            {state.phase === 'idle' || state.phase === 'loading' ? (
              <UiCard><UiEmptyState icon="help" title="Carregando as centrais de ajuda…" /></UiCard>
            ) : state.phase === 'error' ? (
              <p className="gso-ui-alert gso-ui-alert--error" role="alert">
                Não foi possível carregar as centrais de ajuda agora.
              </p>
            ) : !items.length ? (
              <UiCard>
                <UiEmptyState
                  description="Vincule uma marca a uma central para configurar os canais de contato."
                  icon="help"
                  title="Nenhuma central de ajuda ativa foi encontrada"
                />
              </UiCard>
            ) : (
              items.map((item) => (
                <HelpCenterContactsSubpanel
                  item={item}
                  key={item.knowledgeSpaceId}
                  mutating={mutating}
                  mutationError={mutationError}
                  onSave={onSave}
                  profiles={profiles}
                />
              ))
            )}
          </div>
        ) : null}
      </div>

      <UiHintBand
        description="A composição editorial acima define o catálogo, regramento de publicação e papeis do conhecimento. Os canais de contato preservados continuam acessíveis no subpainel expansível."
        title="Governança editorial da Central de Ajuda"
      />
    </UiPage>
  );
}
