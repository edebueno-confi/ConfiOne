import { useState } from 'react';
import { saveManagedIntegration, type ManagedIntegration } from './settings-api';

const CONTROL = 'gso-settings-control w-full rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-3 py-2.5 text-sm text-[color:var(--minimal-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]';

function credentialStatus(item: ManagedIntegration) {
  if (!item.isEnabled) return { label: 'Integração desativada', className: 'gso-settings-status--muted' };
  if (item.hasCredentials) return { label: 'Credencial configurada', className: 'gso-settings-status--success' };
  return { label: 'Credencial pendente', className: 'gso-settings-status--warning' };
}

function IntegrationCard({
  item,
  busy,
  onSave,
}: {
  item: ManagedIntegration;
  busy: boolean;
  onSave: (input: { integrationKey: string; label: string; provider: ManagedIntegration['provider']; mode: 'api'; isEnabled: boolean; config: Record<string, unknown>; secret?: string }) => Promise<void>;
}) {
  const isOmie = item.provider === 'omie';
  const [isEnabled, setIsEnabled] = useState(item.isEnabled);
  const [primary, setPrimary] = useState('');
  const [secondary, setSecondary] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const status = credentialStatus({ ...item, isEnabled });

  const hasCredentialInput = isOmie ? Boolean(primary.trim() || secondary.trim()) : Boolean(primary.trim());

  const save = async () => {
    const withCredential = hasCredentialInput;
    if (withCredential && isOmie && Boolean(primary.trim()) !== Boolean(secondary.trim())) {
      setMessage('Informe a chave e o segredo da aplicação juntos para atualizar o OMIE.');
      return;
    }
    setMessage(null);
    const secret = withCredential
      ? (isOmie ? JSON.stringify({ app_key: primary.trim(), app_secret: secondary.trim() }) : primary.trim())
      : undefined;
    await onSave({
      integrationKey: item.integrationKey,
      label: item.label,
      provider: item.provider,
      mode: 'api',
      isEnabled,
      config: isOmie ? { credential_format: 'app_key_app_secret', resource_label: 'Contas a receber' } : { domains: ['commercial', 'customer_success', 'support'] },
      secret,
    });
    if (withCredential) {
      setPrimary('');
      setSecondary('');
    }
  };

  return (
    <section className="gso-settings-integration-card" aria-labelledby={`integration-${item.integrationKey}`}>
      <header className="gso-settings-card-header">
        <div>
          <p className="gso-settings-eyebrow">{isOmie ? 'Financeiro' : 'Operação'}</p>
          <h3 id={`integration-${item.integrationKey}`}>{isOmie ? 'OMIE' : 'HubSpot'}</h3>
          <p>{isOmie ? 'Fonte dos dados financeiros e contas a receber.' : 'Fonte de dados comerciais, clientes e atendimentos.'}</p>
        </div>
        <span className={`gso-settings-status ${status.className}`}>{status.label}</span>
      </header>

      <div className="gso-settings-form-grid">
        <label className="gso-settings-field gso-settings-field--toggle">
          <span>Integração ativa</span>
          <input type="checkbox" checked={isEnabled} onChange={(event) => setIsEnabled(event.target.checked)} />
        </label>

        {isOmie ? (
          <>
            <label className="gso-settings-field gso-settings-field--wide">
              <span>Chave da aplicação</span>
              <input className={CONTROL} type="password" autoComplete="new-password" value={primary} onChange={(event) => setPrimary(event.target.value)} placeholder="Informe a chave da aplicação" aria-describedby="omie-credential-help" />
            </label>
            <label className="gso-settings-field gso-settings-field--wide">
              <span>Segredo da aplicação</span>
              <input className={CONTROL} type="password" autoComplete="new-password" value={secondary} onChange={(event) => setSecondary(event.target.value)} placeholder="Informe o segredo da aplicação" aria-describedby="omie-credential-help" />
            </label>
          </>
        ) : (
          <label className="gso-settings-field gso-settings-field--wide">
            <span>Token de acesso</span>
            <input className={CONTROL} type="password" autoComplete="new-password" value={primary} onChange={(event) => setPrimary(event.target.value)} placeholder="Informe o token de acesso" aria-describedby="hubspot-credential-help" />
          </label>
        )}
      </div>

      <p className="gso-settings-help" id={isOmie ? 'omie-credential-help' : 'hubspot-credential-help'}>Deixe em branco para manter a credencial atual. O valor nunca é exibido novamente.</p>
      {message ? <p className="gso-settings-inline-error" role="alert">{message}</p> : null}
      <footer className="gso-settings-card-actions">
        <button className="gso-settings-button gso-settings-button--primary" type="button" disabled={busy} onClick={() => void save()}>
          {busy ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </footer>
    </section>
  );
}

export function SettingsIntegrationsPanel({
  integrations,
  busy,
  error,
  onSave,
}: {
  integrations: ManagedIntegration[];
  busy: boolean;
  error: string | null;
  onSave: (input: Parameters<typeof saveManagedIntegration>[0]) => Promise<void>;
}) {
  const published = integrations.filter((item) => item.provider === 'hubspot' || item.provider === 'omie');
  if (!published.length) return <p className="gso-settings-empty">Nenhuma integração disponível neste ambiente.</p>;
  return (
    <div className="gso-settings-stack gso-visual-v1-settings">
      <div className="gso-settings-intro-band">
        <strong>Integrações do Dashboard</strong>
        <span>HubSpot abastece Comercial, Customer Success e Suporte. OMIE abastece o Financeiro. Credenciais ficam protegidas e nunca são exibidas novamente.</span>
      </div>
      <div className="gso-settings-integration-grid">
        {published.map((item) => <IntegrationCard busy={busy} item={item} key={item.integrationKey} onSave={onSave} />)}
      </div>
      {error ? <p className="gso-settings-inline-error" role="alert">{error}</p> : null}
    </div>
  );
}
