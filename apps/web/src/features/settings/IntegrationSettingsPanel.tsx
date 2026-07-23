import { useState } from 'react';
import { cx } from '../../components/ui';
import type { ManagedIntegration } from './settings-api';
import { saveManagedIntegration } from './settings-api';

const inputClass =
  'w-full rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-3 py-2 text-sm text-[color:var(--minimal-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]';

function statusLabel(item: ManagedIntegration) {
  if (!item.isEnabled) return 'Desativada';
  if (item.lastRunStatus === 'error') return 'Erro na última execução';
  if (!item.hasCredentials && item.mode !== 'manual') return 'Aguardando credencial';
  return 'Pronta';
}

export function IntegrationSettingsPanel({
  items,
  onSave,
  mutating,
  error,
}: {
  items: ManagedIntegration[];
  onSave: (input: Parameters<typeof saveManagedIntegration>[0]) => Promise<void>;
  mutating: boolean;
  error: string | null;
}) {
  const [drafts, setDrafts] = useState<Record<string, { isEnabled: boolean; secret: string; appKey: string; appSecret: string }>>({});

  function draftFor(item: ManagedIntegration) {
    return drafts[item.integrationKey] ?? { isEnabled: item.isEnabled, secret: '', appKey: '', appSecret: '' };
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[color:var(--color-info-border)] bg-[color:var(--color-info-surface)] px-4 py-3 text-sm text-[color:var(--color-info-text)]">
        Credenciais são armazenadas no Vault e nunca são exibidas novamente. Deixe o campo vazio para preservar a credencial atual.
      </div>
      {error ? <div className="rounded-lg border border-[color:var(--color-danger-border)] bg-[color:var(--color-danger-surface)] px-4 py-3 text-sm text-[color:var(--color-danger-text)]">{error}</div> : null}
      {items.map((item) => {
        const draft = draftFor(item);
        const pipelineConfig = Array.isArray(item.config.domains) ? `Domínios: ${(item.config.domains as string[]).join(', ')}` : null;
        return (
          <section className="integration-card rounded-[18px] border border-[color:var(--minimal-border)] p-4 sm:p-5" key={item.integrationKey}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">{item.label}</h3>
                  <span className="integration-card__badge">Integração gerenciada</span>
                </div>
                <p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">{item.provider} · modo {item.mode} · {statusLabel(item)}</p>
                {pipelineConfig ? <p className="mt-1 text-xs text-[color:var(--minimal-text-tertiary)]">{pipelineConfig}</p> : null}
              </div>
              <label className="flex items-center gap-2 text-xs text-[color:var(--minimal-text-secondary)]">
                <input checked={draft.isEnabled} onChange={(event) => setDrafts((current) => ({ ...current, [item.integrationKey]: { ...draft, isEnabled: event.target.checked } }))} type="checkbox" />
                Ativa
              </label>
            </div>
            {item.mode !== 'manual' ? (
              item.provider === 'omie' ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-medium text-[color:var(--minimal-text-secondary)]">
                    App Key
                    <input
                      aria-label="Omie App Key"
                      autoComplete="off"
                      className={cx(inputClass, 'mt-1')}
                      onChange={(event) => setDrafts((current) => ({ ...current, [item.integrationKey]: { ...draft, appKey: event.target.value } }))}
                      placeholder={item.hasCredentials ? 'Configurada — preencha os dois para substituir' : 'Cole o App Key do Omie'}
                      type="password"
                      value={draft.appKey}
                    />
                  </label>
                  <label className="block text-xs font-medium text-[color:var(--minimal-text-secondary)]">
                    App Secret
                    <input
                      aria-label="Omie App Secret"
                      autoComplete="off"
                      className={cx(inputClass, 'mt-1')}
                      onChange={(event) => setDrafts((current) => ({ ...current, [item.integrationKey]: { ...draft, appSecret: event.target.value } }))}
                      placeholder={item.hasCredentials ? 'Configurada — preencha os dois para substituir' : 'Cole o App Secret do Omie'}
                      type="password"
                      value={draft.appSecret}
                    />
                  </label>
                  <p className="text-[11px] text-[color:var(--minimal-text-tertiary)] sm:col-span-2">Preencha App Key e App Secret juntos para gravar. Deixe ambos vazios para preservar a credencial atual. Os valores vão direto para o Vault e não são exibidos novamente.</p>
                </div>
              ) : (
                <label className="mt-4 block text-xs font-medium text-[color:var(--minimal-text-secondary)]">
                  Nova credencial (opcional)
                  <input
                    aria-label={`Nova credencial ${item.label}`}
                    className={cx(inputClass, 'mt-1')}
                    onChange={(event) => setDrafts((current) => ({ ...current, [item.integrationKey]: { ...draft, secret: event.target.value } }))}
                    placeholder={item.hasCredentials ? 'Credencial configurada — deixe vazio para preservar' : 'Cole a credencial quando disponível'}
                    type="password"
                    value={draft.secret}
                  />
                </label>
              )
            ) : null}
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-[color:var(--minimal-text-tertiary)]">
                {item.lastRunAt ? `Última execução: ${new Date(item.lastRunAt).toLocaleString('pt-BR')}` : 'Nenhuma execução registrada'}
              </p>
              <button
                className="rounded-lg bg-[color:var(--minimal-action)] px-3 py-2 text-sm font-medium text-[color:var(--minimal-action-ink)] disabled:opacity-60"
                disabled={mutating}
                onClick={() => void onSave({
                  integrationKey: item.integrationKey,
                  label: item.label,
                  provider: item.provider,
                  mode: item.mode,
                  isEnabled: draft.isEnabled,
                  config: item.config,
                  secret: item.provider === 'omie'
                    ? (draft.appKey.trim() && draft.appSecret.trim() ? JSON.stringify({ app_key: draft.appKey.trim(), app_secret: draft.appSecret.trim() }) : '')
                    : draft.secret,
                })}
                type="button"
              >
                {mutating ? 'Salvando…' : 'Salvar configuração'}
              </button>
            </div>
          </section>
        );
      })}
    </div>
  );
}
