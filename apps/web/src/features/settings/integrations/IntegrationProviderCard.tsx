import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { formatDateTime, truncateText } from '../../../app/format';
import type { ManagedIntegration } from '../settings-api';
import { UiBadge } from '../ui/UiBadge';
import { UiCard } from '../ui/UiCard';
import { UiCardHeader } from '../ui/UiCardHeader';
import { UiDetailList } from '../ui/UiDetailList';
import { uiToneOf } from '../ui/ui-tone-map';
import { UNAVAILABLE_LABEL, credentialState, lastRunState } from './integration-health.mjs';

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
    <UiCard labelledBy={headingId}>
      <UiCardHeader
        actions={
          <>
            <UiBadge tone="neutral">{eyebrow}</UiBadge>
            <UiBadge dot tone={uiToneOf(credential.tone)}>{credential.label}</UiBadge>
          </>
        }
        description={description}
        icon={variant === 'finance' ? 'database' : 'plug'}
        title={title}
        titleId={headingId}
        tone="neutral"
      />

      <div className="gso-ui-card-body">
        <UiDetailList
          items={[
            {
              icon: 'key',
              label: 'Credencial atualizada em',
              value: item.credentialUpdatedAt ? formatDateTime(item.credentialUpdatedAt) : UNAVAILABLE_LABEL,
            },
            {
              icon: 'clock',
              label: 'Última execução',
              value: (
                <>
                  {item.lastRunAt ? formatDateTime(item.lastRunAt) : UNAVAILABLE_LABEL}
                  {' · '}
                  <UiBadge tone={uiToneOf(lastRun.tone)}>{lastRun.label}</UiBadge>
                </>
              ),
            },
          ]}
        />
      </div>

      {item.lastErrorMessage ? (
        <p className="gso-ui-alert gso-ui-alert--error">Última falha registrada: {truncateText(item.lastErrorMessage, 240)}</p>
      ) : null}

      <footer className="gso-po-v2-provider-actions">
        <details>
          <summary>Gerenciar credenciais</summary>
          <div className="gso-ui-card-body">{children}</div>
        </details>
        <Link to="/admin/settings/sync-history">Ver histórico</Link>
      </footer>
    </UiCard>
  );
}
