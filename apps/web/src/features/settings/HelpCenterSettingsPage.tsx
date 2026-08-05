import { useState } from 'react';
import { Link } from 'react-router';
import { PUBLIC_HELP_CENTER_HREF } from '../../app/release-surface.mjs';
import { SettingsPageHeader } from './SettingsPageHeader';
import {
  profileForSlug,
  useKnowledgeSpaceProfiles,
  type KnowledgeSpaceProfilesState,
} from './knowledge-space-profiles';
import type { HelpCenterSupportContacts } from './settings-api';
import './settings-shell.css';

const UNAVAILABLE = 'Indisponível';
const CONTROL =
  'w-full rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-2.5 py-2 text-sm text-[color:var(--minimal-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]';

/** Mesmo formato de estado de carga usado por SettingsPage. */
type ContactsState =
  | { phase: 'idle' | 'loading' }
  | { phase: 'ready'; items: HelpCenterSupportContacts[] }
  | { phase: 'error' };

/** Os cinco canais que o backend realmente grava, nesta ordem. */
const CONTACT_FIELDS = [
  ['email', 'E-mail de suporte', 'email', 'atendimento@suamarca.com.br'],
  ['whatsapp', 'WhatsApp de suporte', 'tel', '(41) 98765-2115'],
  ['websiteUrl', 'Site ou portal', 'url', 'https://www.suamarca.com.br'],
  ['statusPageUrl', 'Página de status', 'url', 'https://status.suamarca.com.br'],
  ['docsUrl', 'Link alternativo da Central', 'url', 'https://ajuda.suamarca.com.br'],
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
    <section aria-label={`Central de ajuda ${item.brandName}`} className="gso-settings-card">
      <div className="gso-settings-identity">
        <span aria-hidden="true" className="gso-settings-monogram">
          {profile?.logoUrl ? <img alt="" src={profile.logoUrl} /> : monogramOf(item.brandName)}
        </span>
        <div>
          <p className="gso-settings-eyebrow">Central de ajuda</p>
          <h3>{item.brandName}</h3>
          <p>/{item.knowledgeSpaceSlug}</p>
        </div>
        <span className={`gso-settings-status ${published ? 'gso-settings-status--success' : 'gso-settings-status--warning'}`}>
          {published ? 'Contato publicado' : 'Sem contato publicado'}
        </span>
      </div>

      <p className="gso-settings-help">
        Identidade desta central, definida no espaço de conhecimento correspondente. Não é editável nesta tela.
      </p>
      <dl className="gso-settings-definition gso-settings-definition--columns">
        <div>
          <dt>Nome de exibição</dt>
          <dd>{item.knowledgeSpaceDisplayName}</dd>
        </div>
        <div>
          <dt>Endereço da central</dt>
          <dd>/{item.knowledgeSpaceSlug}</dd>
        </div>
        <div>
          <dt>Idioma padrão</dt>
          <dd>{profile?.defaultLocale ?? UNAVAILABLE}</dd>
        </div>
        <div>
          <dt>Domínio principal</dt>
          <dd>{profile?.primaryDomain ?? UNAVAILABLE}</dd>
        </div>
      </dl>

      <div className="gso-settings-card-header gso-settings-card-header--section">
        <div>
          <p className="gso-settings-eyebrow">Canais de contato</p>
          <p>Aparecem no rodapé público desta central. Deixe em branco o canal que a marca não oferece.</p>
        </div>
      </div>

      <div className="gso-settings-form-grid">
        {CONTACT_FIELDS.map(([field, label, type, placeholder]) => {
          const error = errors[field];
          const errorId = `${item.knowledgeSpaceId}-${field}-error`;
          return (
            <label className="gso-settings-field" key={field}>
              <span>{label}</span>
              <input
                aria-describedby={error ? errorId : undefined}
                aria-invalid={error ? true : undefined}
                className={CONTROL}
                disabled={mutating}
                onChange={(event) => update(field, event.target.value)}
                placeholder={placeholder}
                type={type}
                value={form[field] ?? ''}
              />
              {error ? <span className="gso-settings-field-error" id={errorId}>{error}</span> : null}
            </label>
          );
        })}
      </div>

      {mutationError ? <p className="gso-settings-inline-error" role="alert">{mutationError}</p> : null}
      {saved && !mutationError ? (
        <p className="gso-settings-inline-message" role="status">Canais de contato salvos e já publicados na central.</p>
      ) : null}

      <div className="gso-settings-card-actions">
        <button className="gso-settings-button gso-settings-button--primary" disabled={mutating} onClick={() => void submit()} type="button">
          {mutating ? 'Salvando…' : 'Salvar canais de contato'}
        </button>
      </div>
    </section>
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
    <div className="gso-settings-page gso-visual-v1-settings">
      <SettingsPageHeader
        actions={
          <Link
            className="gso-settings-button gso-settings-button--secondary"
            rel="noreferrer"
            target="_blank"
            to={PUBLIC_HELP_CENTER_HREF}
          >
            Abrir central pública
          </Link>
        }
        description="Como cada marca se apresenta na central de ajuda pública e por onde o cliente fala com o time."
        meta={`${items.length} ${items.length === 1 ? 'central de ajuda' : 'centrais de ajuda'}`}
        title="Central de ajuda"
        titleId="settings-help-center-title"
      />

      {state.phase === 'idle' || state.phase === 'loading' ? (
        <p className="gso-settings-empty">Carregando as centrais de ajuda…</p>
      ) : state.phase === 'error' ? (
        <p className="gso-settings-inline-error" role="alert">
          Não foi possível carregar as centrais de ajuda agora. Atualize a página e tente novamente.
        </p>
      ) : !items.length ? (
        <p className="gso-settings-empty">
          Nenhuma central de ajuda ativa foi encontrada. Vincule uma marca a uma central para configurar os canais de contato.
        </p>
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

      <section className="gso-settings-source-note">
        <strong>O que ainda não é ajustável aqui</strong>
        <p>
          Nesta versão você define os canais de contato de cada central. Os textos de apresentação, a organização das
          categorias e o comportamento da busca pública seguem o padrão da plataforma e não são editáveis nesta tela.
        </p>
      </section>
    </div>
  );
}
