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
import { UiPage } from './ui/UiPage';
import { UiPageHeader } from './ui/UiPageHeader';
import './settings-ui.css';

const UNAVAILABLE = 'Indisponível';

/** Mesmo formato de estado de carga usado por SettingsPage. */
type ContactsState =
  | { phase: 'idle' | 'loading' }
  | { phase: 'ready'; items: HelpCenterSupportContacts[] }
  | { phase: 'error' };

/** Os cinco canais que o backend realmente grava, nesta ordem. */
const CONTACT_FIELDS = [
  ['email', 'E-mail de suporte', 'email', 'atendimento@suamarca.com.br', 'mail'],
  ['whatsapp', 'WhatsApp de suporte', 'tel', '(41) 98765-2115', 'phone'],
  ['websiteUrl', 'Site ou portal', 'url', 'https://www.suamarca.com.br', 'globe'],
  ['statusPageUrl', 'Página de status', 'url', 'https://status.suamarca.com.br', 'activity'],
  ['docsUrl', 'Link alternativo da Central', 'url', 'https://ajuda.suamarca.com.br', 'link'],
] as const;

type ContactField = (typeof CONTACT_FIELDS)[number][0];

const URL_FIELDS: ContactField[] = ['websiteUrl', 'statusPageUrl', 'docsUrl'];

function monogramOf(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** Validação de formato feita antes de enviar; campo vazio significa "sem canal". */
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

function HelpCenterCard({
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
    <UiCard label={`Central de ajuda ${item.brandName}`}>
      <div className="gso-ui-identity">
        <span aria-hidden="true" className="gso-ui-monogram">
          {profile?.logoUrl ? <img alt="" src={profile.logoUrl} /> : monogramOf(item.brandName)}
        </span>
        <div>
          <h3>{item.brandName}</h3>
          <p>/{item.knowledgeSpaceSlug}</p>
        </div>
        <UiBadge dot tone={published ? 'success' : 'warning'}>
          {published ? 'Contato publicado' : 'Sem contato publicado'}
        </UiBadge>
      </div>

      <p className="gso-ui-note">
        Identidade desta central, definida no espaço de conhecimento correspondente. Não é editável nesta tela.
      </p>
      <div className="gso-ui-card-body">
        <UiDetailList
          columns
          items={[
            { icon: 'brand', label: 'Nome de exibição', value: item.knowledgeSpaceDisplayName },
            { icon: 'help', label: 'Endereço da central', value: `/${item.knowledgeSpaceSlug}` },
            { icon: 'globe', label: 'Idioma padrão', value: profile?.defaultLocale ?? UNAVAILABLE },
            { icon: 'link', label: 'Domínio principal', value: profile?.primaryDomain ?? UNAVAILABLE },
          ]}
        />
      </div>

      <div className="gso-ui-card-body">
        <UiCardHeader
          description="Aparecem no rodapé público desta central. Deixe em branco o canal que a marca não oferece."
          icon="mail"
          title="Canais de contato"
          tone="primary"
        />
      </div>

      <div className="gso-ui-card-body">
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
    </UiCard>
  );
}

/**
 * Central de ajuda: o que a plataforma publica para o cliente.
 *
 * A unica gravacao disponivel sao os cinco canais de contato. Identidade,
 * idioma e dominio vem do espaco de conhecimento e aparecem apenas em leitura.
 * O tema da Central publica e sempre claro e nao e configuravel.
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

  return (
    <UiPage className="gso-ui-page--fill">
      <UiPageHeader
        actions={
          <Link
            className="gso-ui-button gso-ui-button--secondary"
            rel="noreferrer"
            target="_blank"
            to={PUBLIC_HELP_CENTER_HREF}
          >
            <UiIcon name="external" />
            Abrir central pública
          </Link>
        }
        description="Como cada marca se apresenta na central de ajuda pública e por onde o cliente fala com o time."
        meta={`${items.length} ${items.length === 1 ? 'central de ajuda' : 'centrais de ajuda'}`}
        title="Central de ajuda"
        titleId="settings-help-center-title"
      />

      {state.phase === 'idle' || state.phase === 'loading' ? (
        <UiCard>
          <UiEmptyState icon="help" title="Carregando as centrais de ajuda…" />
        </UiCard>
      ) : state.phase === 'error' ? (
        <p className="gso-ui-alert gso-ui-alert--error" role="alert">
          Não foi possível carregar as centrais de ajuda agora. Atualize a página e tente novamente.
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
          <HelpCenterCard
            item={item}
            key={item.knowledgeSpaceId}
            mutating={mutating}
            mutationError={mutationError}
            onSave={onSave}
            profiles={profiles}
          />
        ))
      )}

      <UiHintBand
        description="Nesta versão você define os canais de contato de cada central. Os textos de apresentação, a organização das categorias e o comportamento da busca pública seguem o padrão da plataforma e não são editáveis nesta tela."
        title="O que ainda não é ajustável aqui"
      />
    </UiPage>
  );
}
