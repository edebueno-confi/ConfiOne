import { Link } from 'react-router';
import { formatDateTime } from '../../../app/format';
import type { ManagedIntegration } from '../settings-api';
import { UiBadge } from '../ui/UiBadge';
import { UiCard } from '../ui/UiCard';
import { UiCardHeader } from '../ui/UiCardHeader';
import { UiIconTile } from '../ui/UiIconTile';
import { uiToneOf } from '../ui/ui-tone-map';
import { UNAVAILABLE_LABEL, lastRunState } from './integration-health.mjs';

/**
 * Estado operacional de cada fonte, lido do proprio read model de integracoes.
 * Nao existe verificacao de conexao sob demanda no backend: a nota deixa isso
 * explicito em vez de simular um teste bem-sucedido.
 */
export function IntegrationSyncStatus({ integrations }: { integrations: ManagedIntegration[] }) {
  return (
    <UiCard labelledBy="integration-rail-state">
      <UiCardHeader
        description="O que aparece aqui é o resultado da última execução registrada por fonte."
        icon="activity"
        title="Conexões e execuções"
        titleId="integration-rail-state"
        tone="primary"
      />
      <ul className="gso-ui-runlist">
        {integrations.map((item) => {
          const state = lastRunState(item);
          return (
            <li key={item.integrationKey}>
              <UiIconTile icon="plug" size="sm" tone={uiToneOf(state.tone)} />
              <strong>{item.label}</strong>
              <span>
                {item.lastRunAt ? formatDateTime(item.lastRunAt) : UNAVAILABLE_LABEL}
                {' · '}
                <UiBadge tone={uiToneOf(state.tone)}>{state.label}</UiBadge>
              </span>
            </li>
          );
        })}
      </ul>
      <Link className="gso-ui-link" to="/admin/settings/sync-history">
        Ver execuções detalhadas
      </Link>
      <p className="gso-ui-note">
        Não existe verificação de conexão sob demanda nesta versão. Enquanto uma nova execução não acontece, o estado permanece o da última registrada.
      </p>
    </UiCard>
  );
}
