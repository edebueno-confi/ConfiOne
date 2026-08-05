import { useMemo, useState } from 'react';
import { formatDateTime } from '../../app/format';
import { SettingsPageHeader } from './SettingsPageHeader';
import { IntegrationHealthRail } from './integrations/IntegrationHealthRail';
import { IntegrationProviderCard } from './integrations/IntegrationProviderCard';
import { IntegrationsSummary } from './integrations/IntegrationsSummary';
import { SettingsBenefitsFooter } from './integrations/SettingsBenefitsFooter';
import { summarizeIntegrations } from './integrations/integration-health.mjs';
import { saveManagedIntegration, type ManagedIntegration } from './settings-api';
import './integrations/settings-integrations.css';

const CONTROL = 'gso-settings-control w-full rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-3 py-2.5 text-sm text-[color:var(--minimal-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]';

type SaveIntegrationInput = Parameters<typeof saveManagedIntegration>[0];

interface ProviderFormProps {
  busy: boolean;
  item: ManagedIntegration;
  onSave: (input: SaveIntegrationInput) => Promise<void>;
}

/**
 * Contrato de credencial, identico nos dois formularios:
 * - o valor gravado nunca chega ao navegador, entao o campo comeca vazio;
 * - campo vazio significa manter o que ja esta gravado;
 * - `secret` so viaja quando o operador realmente digita algo.
 * Nenhum valor digitado e registrado em console, log, mensagem ou storage.
 */
function HubSpotIntegrationForm({ busy, item, onSave }: ProviderFormProps) {
  const [isEnabled, setIsEnabled] = useState(item.isEnabled);
  const [token, setToken] = useState('');

  const submit = async () => {
    const nextSecret = token.trim();
    await onSave({
      integrationKey: item.integrationKey,
      label: item.label,
      provider: item.provider,
      mode: 'api',
      isEnabled,
      config: { domains: ['commercial', 'customer_success', 'support'] },
      secret: nextSecret ? nextSecret : undefined,
    });
    if (nextSecret) setToken('');
  };

  return (
    <form
      className="gso-settings-form"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="gso-settings-form-grid">
        <label className="gso-settings-field gso-settings-field--toggle">
          <span>Integração ativa</span>
          <input checked={isEnabled} onChange={(event) => setIsEnabled(event.target.checked)} type="checkbox" />
        </label>
        <label className="gso-settings-field gso-settings-field--wide">
          <span>Token de acesso</span>
          <input
            aria-describedby="hubspot-credential-help"
            autoComplete="new-password"
            className={CONTROL}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Informe o token de acesso"
            type="password"
            value={token}
          />
        </label>
      </div>
      <p className="gso-settings-help" id="hubspot-credential-help">
        Deixe em branco para manter a credencial atual. O valor nunca é exibido novamente.
      </p>
      <footer className="gso-settings-card-actions">
        <button className="gso-settings-button gso-settings-button--primary" disabled={busy} type="submit">
          {busy ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </footer>
    </form>
  );
}

function OmieIntegrationForm({ busy, item, onSave }: ProviderFormProps) {
  const [isEnabled, setIsEnabled] = useState(item.isEnabled);
  const [appKey, setAppKey] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const submit = async () => {
    const key = appKey.trim();
    const secret = appSecret.trim();
    if (Boolean(key) !== Boolean(secret)) {
      setMessage('Informe a chave e o segredo da aplicação juntos para atualizar o OMIE.');
      return;
    }
    setMessage(null);
    await onSave({
      integrationKey: item.integrationKey,
      label: item.label,
      provider: item.provider,
      mode: 'api',
      isEnabled,
      config: { credential_format: 'app_key_app_secret', resource_label: 'Contas a receber' },
      secret: key ? JSON.stringify({ app_key: key, app_secret: secret }) : undefined,
    });
    if (key) {
      setAppKey('');
      setAppSecret('');
    }
  };

  return (
    <form
      className="gso-settings-form"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="gso-settings-form-grid">
        <label className="gso-settings-field gso-settings-field--toggle">
          <span>Integração ativa</span>
          <input checked={isEnabled} onChange={(event) => setIsEnabled(event.target.checked)} type="checkbox" />
        </label>
        <label className="gso-settings-field gso-settings-field--wide">
          <span>Chave da aplicação</span>
          <input
            aria-describedby="omie-credential-help"
            autoComplete="new-password"
            className={CONTROL}
            onChange={(event) => setAppKey(event.target.value)}
            placeholder="Informe a chave da aplicação"
            type="password"
            value={appKey}
          />
        </label>
        <label className="gso-settings-field gso-settings-field--wide">
          <span>Segredo da aplicação</span>
          <input
            aria-describedby="omie-credential-help"
            autoComplete="new-password"
            className={CONTROL}
            onChange={(event) => setAppSecret(event.target.value)}
            placeholder="Informe o segredo da aplicação"
            type="password"
            value={appSecret}
          />
        </label>
      </div>
      <p className="gso-settings-help" id="omie-credential-help">
        Deixe em branco para manter a credencial atual. O valor nunca é exibido novamente.
      </p>
      {message ? (
        <p className="gso-settings-inline-error" role="alert">
          {message}
        </p>
      ) : null}
      <footer className="gso-settings-card-actions">
        <button className="gso-settings-button gso-settings-button--primary" disabled={busy} type="submit">
          {busy ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </footer>
    </form>
  );
}

/**
 * Tela de Integracoes: cabecalho, resumo, cards por provedor, rail de
 * governanca e faixa inferior. A tela nao inventa acao nem estado: tudo que
 * aparece vem do read model das integracoes gerenciais.
 */
export function SettingsIntegrationsPanel({
  busy,
  error,
  integrations,
  onReload,
  onSave,
}: {
  busy: boolean;
  error: string | null;
  integrations: ManagedIntegration[];
  onReload: () => Promise<void>;
  onSave: (input: SaveIntegrationInput) => Promise<void>;
}) {
  const [reloading, setReloading] = useState(false);
  const published = useMemo(
    () =>
      integrations
        .filter((item) => item.provider === 'hubspot' || item.provider === 'omie')
        .sort((left, right) => (left.provider === right.provider ? 0 : left.provider === 'hubspot' ? -1 : 1)),
    [integrations],
  );
  const summary = useMemo(() => summarizeIntegrations(published), [published]);

  const reload = async () => {
    setReloading(true);
    try {
      await onReload();
    } finally {
      setReloading(false);
    }
  };

  if (!published.length) return <p className="gso-settings-empty">Nenhuma integração disponível neste ambiente.</p>;

  return (
    <div className="gso-int-surface gso-visual-v1-settings">
      <SettingsPageHeader
        actions={
          <button
            className="gso-settings-button gso-settings-button--secondary"
            disabled={busy || reloading}
            onClick={() => void reload()}
            type="button"
          >
            {reloading ? 'Atualizando…' : 'Atualizar estado'}
          </button>
        }
        description="Credenciais e estado das fontes externas que abastecem o Dashboard Gerencial."
        eyebrow="Configurações"
        meta={summary.updatedAt ? `Última alteração registrada em ${formatDateTime(summary.updatedAt)}` : 'Nenhuma alteração registrada'}
        title="Integrações"
        titleId="settings-integrations-title"
      />

      <IntegrationsSummary summary={summary} />

      <div className="gso-int-body">
        <div className="gso-int-cards">
          {published.map((item) =>
            item.provider === 'omie' ? (
              <IntegrationProviderCard
                description="Fonte dos dados financeiros e contas a receber."
                eyebrow="Financeiro"
                item={item}
                key={item.integrationKey}
                title="OMIE"
                variant="finance"
              >
                <OmieIntegrationForm busy={busy} item={item} onSave={onSave} />
              </IntegrationProviderCard>
            ) : (
              <IntegrationProviderCard
                description="Fonte de dados comerciais, clientes e atendimentos."
                eyebrow="Operação"
                item={item}
                key={item.integrationKey}
                title="HubSpot"
                variant="operation"
              >
                <HubSpotIntegrationForm busy={busy} item={item} onSave={onSave} />
              </IntegrationProviderCard>
            ),
          )}
        </div>

        <IntegrationHealthRail integrations={published} />
      </div>

      {error ? (
        <p className="gso-settings-inline-error" role="alert">
          {error}
        </p>
      ) : null}

      <SettingsBenefitsFooter />
    </div>
  );
}
