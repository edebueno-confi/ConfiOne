import type { ManagedIntegration } from '../settings-api';
import { UiIconTile } from '../ui/UiIconTile';
import { integrationScopes } from './integration-health.mjs';

/**
 * Permissoes e escopos: uma linha por integracao publicada, com os escopos
 * reais declarados na configuracao da fonte. Os chips sao neutros de proposito
 * — nao existe cor por dominio, porque a cor sugeriria uma classificacao que o
 * read model nao publica. Sem leitura de escopo, a linha permanece e diz isso.
 */
export function IntegrationScopesPanel({ integrations }: { integrations: ManagedIntegration[] }) {
  return (
    <section aria-labelledby="integration-scopes-title" className="gso-po-region">
      <header className="gso-po-region-head">
        <h3 id="integration-scopes-title">Permissões e escopos</h3>
        <p>Resumo do que está habilitado em cada integração.</p>
      </header>
      <ul className="gso-po-scope-list">
        {integrations.map((item) => {
          const scopes = integrationScopes(item);
          return (
            <li className="gso-po-scope-row" key={item.integrationKey}>
              <span className="gso-po-scope-provider">
                <UiIconTile icon={item.provider === 'omie' ? 'database' : 'plug'} size="sm" tone="neutral" />
                <strong>{item.label}</strong>
              </span>
              {scopes.length ? (
                <ul className="gso-po-chips">
                  {scopes.map((scope) => (
                    <li className="gso-po-chip" key={scope}>{scope}</li>
                  ))}
                </ul>
              ) : (
                <span className="gso-po-metric-detail">Escopos indisponíveis nesta leitura.</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
