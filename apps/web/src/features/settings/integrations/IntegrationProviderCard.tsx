import type { ReactNode } from 'react';
import { formatDateTime, truncateText } from '../../../app/format';
import type { ManagedIntegration } from '../settings-api';
import { UNAVAILABLE_LABEL, credentialState, lastRunState, toneClassName, toneTextClassName } from './integration-health.mjs';

/**
 * Moldura de um provedor. Concentra cabecalho, selo de estado e os metadados
 * publicados pelo read model; o formulario de credencial entra como conteudo,
 * porque cada provedor tem campos proprios.
 */
export function IntegrationProviderCard({
  children,
  description,
  eyebrow,
  item,
  title,
  variant,
}: {
  children: ReactNode;
  description: string;
  eyebrow: string;
  item: ManagedIntegration;
  title: string;
  variant: 'operation' | 'finance';
}) {
  const credential = credentialState(item);
  const lastRun = lastRunState(item);
  const headingId = `integration-${item.integrationKey}`;

  return (
    <section aria-labelledby={headingId} className={variant === 'finance' ? 'gso-int-card gso-int-card--finance' : 'gso-int-card'}>
      <header className="gso-int-card-header">
        <div className="gso-int-card-title">
          <p className="gso-settings-eyebrow">{eyebrow}</p>
          <h3 id={headingId}>{title}</h3>
          <p>{description}</p>
        </div>
        <span className={`gso-settings-status ${toneClassName(credential.tone)}`}>{credential.label}</span>
      </header>

      {children}

      <dl className="gso-int-card-meta">
        <div>
          <dt>Credencial atualizada em</dt>
          <dd>{item.credentialUpdatedAt ? formatDateTime(item.credentialUpdatedAt) : UNAVAILABLE_LABEL}</dd>
        </div>
        <div>
          <dt>Última execução</dt>
          <dd>
            {item.lastRunAt ? formatDateTime(item.lastRunAt) : UNAVAILABLE_LABEL}
            {' · '}
            <span className={toneTextClassName(lastRun.tone)}>{lastRun.label}</span>
          </dd>
        </div>
      </dl>

      {item.lastErrorMessage ? (
        <p className="gso-int-card-error">Última falha registrada: {truncateText(item.lastErrorMessage, 240)}</p>
      ) : null}
    </section>
  );
}
