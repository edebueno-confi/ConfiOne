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
import { UiIcon } from './ui/UiIcon';
import { UiMetric } from './ui/UiMetric';
import { UiMetricRow } from './ui/UiMetricRow';
import { UiPage } from './ui/UiPage';
import { UiPageHeader } from './ui/UiPageHeader';
import './settings-ui.css';

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
 * Subpainel de contatos e identidade de marca (Preservado para capacidades reais de gravação).
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
    <div className="rounded-xl border border-[color:var(--gso-border,#22324D)] bg-[color:var(--gso-surface-primary,#131E33)] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-[color:var(--gso-text-primary,#E6ECF5)]">{item.brandName}</h4>
          <p className="text-xs text-[color:var(--gso-text-secondary,#A6B2C7)]">/{item.knowledgeSpaceSlug}</p>
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
          { icon: 'globe', label: 'Idioma padrão', value: profile?.defaultLocale ?? 'pt-BR' },
          { icon: 'link', label: 'Domínio principal', value: profile?.primaryDomain ?? 'ajuda.confione.com' },
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
        <p className="gso-ui-alert gso-ui-alert--success" role="status">Canais de contato salvos e publicados na central.</p>
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
 * Screen 04: Central de Ajuda (Fidelidade ao PO Approved Blueprint)
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

  /**
   * Consolidacao das centrais. Os seeds anteriores eram 1248 artigos e 48
   * categorias, e qualquer central sem contagem no contrato reescrevia o
   * acumulado para esses mesmos literais — ou seja, a tela exibia numeros
   * inventados mesmo com o backend respondendo. Aqui a contagem so soma o que
   * o contrato entrega; se nenhuma central expoe a metrica, fica `null` e a
   * UI mostra "Indisponivel".
   */
  const summary = items.reduce<{
    configuredContacts: number;
    articles: number | null;
    publishedArticles: number | null;
    categories: number | null;
  }>(
    (current, item) => {
      const profile = profileForSlug(profiles, item.knowledgeSpaceSlug);
      const add = (accumulated: number | null, value: number | null | undefined) =>
        typeof value === 'number' ? (accumulated ?? 0) + value : accumulated;
      return {
        configuredContacts: current.configuredContacts + (hasPublicContact(item) ? 1 : 0),
        articles: add(current.articles, profile?.articleCount),
        publishedArticles: add(current.publishedArticles, profile?.publishedArticleCount),
        categories: add(current.categories, profile?.categoryCount),
      };
    },
    { configuredContacts: 0, articles: null, publishedArticles: null, categories: null },
  );

  const draftArticles =
    summary.articles !== null && summary.publishedArticles !== null
      ? Math.max(summary.articles - summary.publishedArticles, 0)
      : null;
  const metricValue = (value: number | null) => (value === null ? 'Indisponível' : value.toLocaleString('pt-BR'));

  /** Centrais com as contagens que o contrato realmente expoe. */
  const spaces = items.map((item) => {
    const profile = profileForSlug(profiles, item.knowledgeSpaceSlug);
    return {
      id: item.knowledgeSpaceId,
      slug: item.knowledgeSpaceSlug,
      displayName: item.knowledgeSpaceDisplayName,
      brandName: item.brandName,
      locale: profile?.defaultLocale ?? null,
      domain: profile?.primaryDomain ?? null,
      articles: profile?.articleCount ?? null,
      published: profile?.publishedArticleCount ?? null,
      categories: profile?.categoryCount ?? null,
      hasContact: hasPublicContact(item),
    };
  });

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
            Visualizar Central de Ajuda ↗
          </Link>
        }
        description="Configuração editorial, publicação e governança do conhecimento."
        title="Central de Ajuda"
        titleId="settings-help-center-title"
      />

      {/* B. SUMMARY RAIL (5 KPI Cards Blueprint) */}
      {/* Saíram daqui "Autores ativos" (27) e "Tempo médio de atualização"
          (5,2 dias): nenhuma das duas existe em contrato. As variações
          ("+12% vs. mês anterior", "18 aguardando revisão", "+3 novos este
          mês") também eram literais — não há série histórica por trás. Ficam
          as três contagens que vw_admin_knowledge_spaces entrega, mais
          rascunhos derivado de total menos publicados. */}
      <UiMetricRow label="Resumo editorial da central de ajuda">
        <UiMetric icon="list" label="Artigos publicados" tone="primary" value={metricValue(summary.publishedArticles)} />
        <UiMetric icon="archive" label="Rascunhos" tone="neutral" value={metricValue(draftArticles)} />
        <UiMetric icon="layers" label="Categorias" tone="neutral" value={metricValue(summary.categories)} />
        <UiMetric icon="help" label="Centrais publicadas" tone="neutral" value={items.length} />
        <UiMetric icon="mail" label="Centrais com canal de contato" tone="neutral" value={summary.configuredContacts} />
      </UiMetricRow>

      {/* C. CENTRAIS PUBLICADAS
          Substitui a tabela "Categorias e coleções" e os cards de configuração
          editorial do blueprint. Aquela tabela trazia cinco categorias fixas
          (Comece por aqui, Funcionalidades, Integrações, Administração, Boas
          práticas) com contagens e datas literais, paginação falsa ("1 a 5 de
          48 categorias") e nenhuma leitura de backend. Aqui ficam apenas as
          centrais reais e as contagens que vw_admin_knowledge_spaces entrega. */}
      <UiCard labelledBy="help-center-spaces-title">
        <UiCardHeader
          description="Centrais publicadas, endereço público e volume de conteúdo por central."
          icon="layers"
          title="Centrais de ajuda"
          titleId="help-center-spaces-title"
          tone="primary"
        />
        <div className="gso-ui-card-body pt-2 overflow-x-auto">
          {spaces.length === 0 ? (
            <UiEmptyState
              description="Nenhuma central de ajuda publicada foi retornada pelo backend para este contexto."
              icon="help"
              title="Sem centrais publicadas"
            />
          ) : (
            <table className="gso-settings-help-table w-full text-xs text-left text-[color:var(--gso-text-primary,#E6ECF5)]">
              <thead>
                <tr className="border-b border-[color:var(--gso-border,#22324D)] bg-[color:var(--gso-surface-secondary,#18263F)] text-[color:var(--gso-text-secondary,#A6B2C7)]">
                  <th className="p-2.5 font-semibold">Central</th>
                  <th className="p-2.5 font-semibold">Marca</th>
                  <th className="p-2.5 font-semibold">Endereço público</th>
                  <th className="p-2.5 font-semibold">Idioma</th>
                  <th className="p-2.5 font-semibold text-center">Artigos</th>
                  <th className="p-2.5 font-semibold text-center">Publicados</th>
                  <th className="p-2.5 font-semibold text-center">Categorias</th>
                  <th className="p-2.5 font-semibold">Contato</th>
                </tr>
              </thead>
              <tbody>
                {spaces.map((space) => (
                  <tr className="border-b border-[color:var(--gso-border,#22324D)] hover:bg-[color:var(--gso-surface-secondary,#18263F)]" key={space.id}>
                    <td className="p-2.5 font-semibold">
                      <span className="flex items-center gap-2">
                        <span className="text-[color:var(--gso-brand-pink,#FF4FA3)]"><UiIcon name="layers" /></span>
                        {space.displayName}
                      </span>
                    </td>
                    <td className="p-2.5 text-[color:var(--gso-text-secondary)]">{space.brandName || 'Indisponível'}</td>
                    <td className="p-2.5 text-[color:var(--gso-text-secondary)]">{space.domain || `/${space.slug}`}</td>
                    <td className="p-2.5 text-[color:var(--gso-text-secondary)]">{space.locale || 'Indisponível'}</td>
                    <td className="p-2.5 text-center font-mono">{metricValue(space.articles)}</td>
                    <td className="p-2.5 text-center font-mono">{metricValue(space.published)}</td>
                    <td className="p-2.5 text-center font-mono">{metricValue(space.categories)}</td>
                    <td className="p-2.5">
                      <UiBadge dot tone={space.hasContact ? 'success' : 'warning'}>
                        {space.hasContact ? 'Publicado' : 'Sem contato'}
                      </UiBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </UiCard>

      {/* D. GOVERNANÇA EDITORIAL
          O blueprint trazia aqui seletores de status padrão, fluxo de revisão,
          visibilidade, comentários, versionamento e SLAs, além de badges fixas
          "Configurado / Completo / Online". Nenhum desses controles lia ou
          gravava estado: eram selects sem onChange e sem contrato. Enquanto o
          backend não expõe política editorial, a tela declara a lacuna em vez
          de simular configuração. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UiCard labelledBy="editorial-config-title">
          <UiCardHeader
            description="Status padrão, fluxo de revisão, visibilidade, comentários, versionamento e SLAs."
            icon="shield"
            title="Configuração editorial"
            titleId="editorial-config-title"
            tone="neutral"
          />
          <div className="gso-ui-card-body pt-2 space-y-3">
            <p className="gso-ui-alert gso-ui-alert--warning" role="status">
              BACKEND_CAPABILITY_REQUIRED — não existe contrato de política editorial
              (status padrão, etapas de revisão, visibilidade, moderação, versionamento
              ou SLA) para leitura ou gravação. Os controles foram removidos para não
              sugerir uma configuração que a plataforma não persiste.
            </p>
            <p className="text-[11px] text-[color:var(--gso-text-secondary)]">
              O que já é configurável hoje: identidade e canais de contato de cada
              central, no bloco abaixo, e o ciclo de vida de cada artigo na Central de
              Conhecimento.
            </p>
            <div className="gso-ui-actions">
              <Link className="gso-ui-button gso-ui-button--secondary" to="/admin/knowledge">
                Abrir Central de Conhecimento
              </Link>
            </div>
          </div>
        </UiCard>

        {/* Permissões editoriais: o blueprint listava papéis inventados
            ("Autores, Editores", "Revisores", "Publicadores") e contagens
            literais (24, 11, 8, 5 usuários). As capabilities abaixo são as que
            existem de fato em public.internal_capabilities; quem as concede é
            Usuários e acessos. */}
        <UiCard labelledBy="editorial-permissions-title">
          <UiCardHeader
            description="Permissões de conhecimento concedidas por perfil de acesso."
            icon="users"
            title="Permissões editoriais"
            titleId="editorial-permissions-title"
            tone="neutral"
          />
          <div className="gso-ui-card-body space-y-3 pt-2 text-xs">
            {[
              ['knowledge.create', 'Criar artigo'],
              ['knowledge.edit', 'Editar artigo'],
              ['knowledge.review', 'Revisar artigo'],
              ['knowledge.publish', 'Publicar artigo'],
              ['knowledge.configure', 'Configurar conteúdo'],
            ].map(([key, label]) => (
              <div className="p-3 rounded-lg border border-[color:var(--gso-border,#22324D)] bg-[color:var(--gso-surface-secondary,#18263F)] flex items-center justify-between" key={key}>
                <strong className="font-semibold text-[color:var(--gso-text-primary,#E6ECF5)]">{label}</strong>
                <code className="text-[11px] text-[color:var(--gso-text-secondary)]">{key}</code>
              </div>
            ))}
            <div className="pt-2 border-t border-[color:var(--gso-border,#22324D)]">
              <Link className="text-xs font-semibold text-[color:var(--gso-action-blue,#2D7CFF)] hover:underline inline-flex items-center gap-1" to="/admin/access?tab=permissions">
                Atribuir estas permissões em Usuários e acessos →
              </Link>
            </div>
          </div>
        </UiCard>
      </div>


      {/* Canais de Contato Registrados (Preservado para gravação backend) */}
      {items.length > 0 ? (
        <div className="pt-2">
          <button
            className="flex items-center justify-between w-full p-3 rounded-xl border border-[color:var(--gso-border,#22324D)] bg-[color:var(--gso-surface-primary,#131E33)] text-xs font-semibold text-[color:var(--gso-text-primary,#E6ECF5)] hover:bg-[color:var(--gso-surface-secondary)] transition-colors"
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
              {items.map((item) => (
                <HelpCenterContactsSubpanel
                  item={item}
                  key={item.knowledgeSpaceId}
                  mutating={mutating}
                  mutationError={mutationError}
                  onSave={onSave}
                  profiles={profiles}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </UiPage>
  );
}
