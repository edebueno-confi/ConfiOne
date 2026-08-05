import { Link } from 'react-router';
import { formatDateTime } from '../../../app/format';
import type { ManagedIntegration } from '../settings-api';
import { UNAVAILABLE_LABEL, lastRunState, toneTextClassName } from './integration-health.mjs';

/**
 * Estado operacional de cada fonte, lido do proprio read model de integracoes.
 * Nao existe verificacao de conexao sob demanda no backend: a nota deixa isso
 * explicito em vez de simular um teste bem-sucedido.
 */
export function IntegrationSyncStatus({ integrations }: { integrations: ManagedIntegration[] }) {
  return (
    <article aria-labelledby="integration-rail-state" className="gso-int-rail-block">
      <p className="gso-settings-eyebrow">Estado</p>
      <h3 id="integration-rail-state">Conexões e execuções</h3>
      <p>O que aparece aqui é o resultado da última execução registrada por fonte.</p>
      <ul className="gso-int-rail-list">
        {integrations.map((item) => {
          const state = lastRunState(item);
          return (
            <li className="gso-int-rail-item" key={item.integrationKey}>
              <strong>{item.label}</strong>
              <span>{item.lastRunAt ? formatDateTime(item.lastRunAt) : UNAVAILABLE_LABEL}</span>
              <small className={toneTextClassName(state.tone)}>{state.label}</small>
            </li>
          );
        })}
      </ul>
      <Link className="gso-int-rail-link" to="/admin/settings/sync-history">
        Ver execuções detalhadas
      </Link>
      <p className="gso-int-rail-note">
        Não existe verificação de conexão sob demanda nesta versão. Enquanto uma nova execução não acontece, o estado permanece o da última registrada.
      </p>
    </article>
  );
}
