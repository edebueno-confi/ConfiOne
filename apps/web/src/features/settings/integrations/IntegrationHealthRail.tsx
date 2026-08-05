import type { ManagedIntegration } from '../settings-api';
import { IntegrationSecuritySummary } from './IntegrationSecuritySummary';
import { IntegrationSyncStatus } from './IntegrationSyncStatus';

/**
 * Rail de governanca da tela de Integracoes: estado das conexoes e protecao das
 * credenciais. O rail nao carrega dados proprios: ele le o mesmo read model dos
 * cards, para que a tela nao possa mostrar duas versoes do mesmo fato.
 */
export function IntegrationHealthRail({ integrations }: { integrations: ManagedIntegration[] }) {
  return (
    <aside aria-label="Governança das integrações" className="gso-int-rail">
      <IntegrationSyncStatus integrations={integrations} />
      <IntegrationSecuritySummary />
    </aside>
  );
}
