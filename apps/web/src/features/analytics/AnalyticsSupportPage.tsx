import { AnalyticsCsPage } from './AnalyticsCsPage';
import type { AnalyticsPageProps } from './analytics-model';

/**
 * Suporte — tickets, fila e tempo de atendimento.
 *
 * O conteúdo hoje renderizado pela antiga aba "CS / Suporte" é inteiramente de
 * tickets (status, tendência mensal, origem, pipeline e responsável). Ao separar
 * os domínios, esse conteúdo pertence a Suporte.
 *
 * Reaproveita o componente existente em vez de duplicar a leitura: o contrato de
 * tickets permanece próprio de Suporte, enquanto Customer Success usa seu read
 * model de empresas HubSpot separado.
 */
export function AnalyticsSupportPage(props: AnalyticsPageProps) {
  return <AnalyticsCsPage {...props} />;
}
