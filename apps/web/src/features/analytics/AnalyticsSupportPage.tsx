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
 * dados é o mesmo. Quando Customer Success ganhar contrato próprio, esta camada
 * continua válida e independente.
 */
export function AnalyticsSupportPage(props: AnalyticsPageProps) {
  return <AnalyticsCsPage {...props} />;
}
