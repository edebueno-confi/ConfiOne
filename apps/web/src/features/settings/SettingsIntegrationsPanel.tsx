import { useMemo, useState } from 'react';
import { formatDateTime } from '../../app/format';
import { IntegrationHealthRail } from './integrations/IntegrationHealthRail';
import { IntegrationProviderCard } from './integrations/IntegrationProviderCard';
import { IntegrationsSummary } from './integrations/IntegrationsSummary';
import { SettingsBenefitsFooter } from './integrations/SettingsBenefitsFooter';
import { summarizeIntegrations } from './integrations/integration-health.mjs';
import { saveManagedIntegration, type ManagedIntegration } from './settings-api';
import { UiButton } from './ui/UiButton';
import { UiEmptyState } from './ui/UiEmptyState';
import { UiField } from './ui/UiField';
import { UiPage } from './ui/UiPage';
import { UiPageHeader } from './ui/UiPageHeader';
import './settings-ui.css';

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
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="gso-ui-grid">
        <label className="gso-ui-toggle">
          <span>Integração ativa</span>
          <input checked={isEnabled} onChange={(event) => setIsEnabled(event.target.checked)} type="checkbox" />
        </label>
        <UiField label="Token de acesso" wide>
          <input
            aria-describedby="hubspot-credential-help"
            autoComplete="new-password"
            className="gso-ui-control"
            onChange={(event) => setToken(event.target.value)}
            placeholder="Informe o token de acesso"
            type="password"
            value={token}
          />
        </UiField>
      </div>
      <p className="gso-ui-note" id="hubspot-credential-help">
        Deixe em branco para manter a credencial atual. O valor nunca é exibido novamente.
      </p>
      <footer className="gso-ui-actions">
        <UiButton disabled={busy} icon="check" type="submit" variant="primary">
          {busy ? 'Salvando…' : 'Salvar alterações'}
        </UiButton>
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
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="gso-ui-grid">
        <label className="gso-ui-toggle">
          <span>Integração ativa</span>
          <input checked={isEnabled} onChange={(event) => setIsEnabled(event.target.checked)} type="checkbox" />
        </label>
        <UiField label="Chave da aplicação" wide>
          <input
            aria-describedby="omie-credential-help"
            autoComplete="new-password"
            className="gso-ui-control"
            onChange={(event) => setAppKey(event.target.value)}
            placeholder="Informe a chave da aplicação"
            type="password"
            value={appKey}
          />
        </UiField>
        <UiField label="Segredo da aplicação" wide>
          <input
            aria-describedby="omie-credential-help"
            autoComplete="new-password"
            className="gso-ui-control"
            onChange={(event) => setAppSecret(event.target.value)}
            placeholder="Informe o segredo da aplicação"
            type="password"
            value={appSecret}
          />
        </UiField>
      </div>
      <p className="gso-ui-note" id="omie-credential-help">
        Deixe em branco para manter a credencial atual. O valor nunca é exibido novamente.
      </p>
      {message ? (
        <p className="gso-ui-alert gso-ui-alert--error" role="alert">
          {message}
        </p>
      ) : null}
      <footer className="gso-ui-actions">
        <UiButton disabled={busy} icon="check" type="submit" variant="primary">
          {busy ? 'Salvando…' : 'Salvar alterações'}
        </UiButton>
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

  if (!published.length) {
    return (
      <UiPage className="gso-ui-page--fill">
        <UiEmptyState icon="plug" title="Nenhuma integração disponível neste ambiente." />
      </UiPage>
    );
  }

  return (
    <UiPage className="gso-ui-page--fill">
      <UiPageHeader
        actions={
          <UiButton disabled={busy || reloading} icon="refresh" onClick={() => void reload()}>
            {reloading ? 'Atualizando…' : 'Atualizar estado'}
          </UiButton>
        }
        description="Credenciais e estado das fontes externas que abastecem o Dashboard Gerencial."
        meta={summary.updatedAt ? `Última alteração registrada em ${formatDateTime(summary.updatedAt)}` : 'Nenhuma alteração registrada'}
        title="Integrações"
        titleId="settings-integrations-title"
      />

      <IntegrationsSummary summary={summary} />

      <div className="gso-ui-body gso-ui-grow">
        <div className="gso-ui-cards">
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
        <p className="gso-ui-alert gso-ui-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      <SettingsBenefitsFooter />
    </UiPage>
  );
}
