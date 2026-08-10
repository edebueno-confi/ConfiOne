import { useId, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { formatDateTime, truncateText } from '../../../app/format';
import type { ManagedIntegration } from '../settings-api';
import { UiBadge } from '../ui/UiBadge';
import { UiIconTile } from '../ui/UiIconTile';
import { uiToneOf } from '../ui/ui-tone-map';
import {
  UNAVAILABLE_LABEL,
  credentialState,
  integrationScopes,
  providerMetrics,
} from './integration-health.mjs';

/**
 * Painel de um provedor de integracao.
 *
 * Primitive unica: HubSpot e OMIE usam exatamente esta composicao, na largura
 * equivalente do blueprint aprovado. As regioes sao fixas — cabecalho, grade de
 * tres metricas, escopo sincronizado e barra de acoes — e nenhuma delas some
 * quando o dado nao existe: a posicao permanece e recebe o rotulo factual de
 * indisponibilidade.
 *
 * Capability omitida: "Testar conexao". O backend nao publica verificacao de
 * conexao sob demanda nesta versao, entao a acao nao e renderizada em vez de
 * receber um handler que simularia um teste.
 */
export function IntegrationProviderPanel({
  credentialForm,
  description,
  eyebrow,
  item,
  title,
  variant,
}: {
  credentialForm: ReactNode;
  description: string;
  eyebrow: string;
  item: ManagedIntegration;
  title: string;
  variant: 'operation' | 'finance';
}) {
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const headingId = `integration-panel-${item.integrationKey}`;
  const formId = useId();
  const credential = credentialState(item);
  const metrics = providerMetrics(item);
  const scopes = integrationScopes(item);

  return (
    <section aria-labelledby={headingId} className="gso-po-panel">
      <header className="gso-po-panel-head">
        <UiIconTile icon={variant === 'finance' ? 'database' : 'plug'} size="md" tone="neutral" />
        <div className="gso-po-panel-title">
          <h3 id={headingId}>{title}</h3>
          <p>{description}</p>
        </div>
        <div className="gso-po-panel-badges">
          <UiBadge tone="neutral">{eyebrow}</UiBadge>
          <UiBadge dot tone={uiToneOf(credential.tone)}>{credential.label}</UiBadge>
        </div>
      </header>

      <dl className="gso-po-panel-metrics">
        {metrics.map((metric) => (
          <div className="gso-po-metric" key={metric.key}>
            <dt>{metric.label}</dt>
            <dd className={`gso-po-metric-value gso-po-tone-${metric.tone}`}>
              {metric.at ? formatDateTime(metric.at) : metric.value}
            </dd>
            <p className="gso-po-metric-detail" title={metric.detail}>
              {metric.detailAt ? formatDateTime(metric.detailAt) : truncateText(metric.detail, 90)}
            </p>
          </div>
        ))}
      </dl>

      <div className="gso-po-panel-scope">
        <p className="gso-po-panel-scope-label">Escopo / Perfis sincronizados</p>
        {scopes.length ? (
          <ul className="gso-po-chips">
            {scopes.map((scope) => (
              <li className="gso-po-chip" key={scope}>{scope}</li>
            ))}
          </ul>
        ) : (
          <p className="gso-po-metric-detail">Escopos indisponíveis nesta leitura.</p>
        )}
      </div>

      <footer className="gso-po-panel-actions">
        <button
          aria-controls={formId}
          aria-expanded={credentialsOpen}
          className="gso-po-action"
          onClick={() => setCredentialsOpen((current) => !current)}
          type="button"
        >
          Gerenciar credenciais
        </button>
        <Link className="gso-po-action" to="/admin/settings/sync-history">
          Ver histórico
        </Link>
      </footer>

      {credentialsOpen ? (
        <div className="gso-po-panel-form" id={formId}>
          {credentialForm}
        </div>
      ) : null}

      <p className="sr-only">
        Credencial gravada: {item.hasCredentials ? 'sim' : 'não'}. Atualizada em:{' '}
        {item.credentialUpdatedAt ? formatDateTime(item.credentialUpdatedAt) : UNAVAILABLE_LABEL}.
      </p>
    </section>
  );
}
