import { MinimalState } from '../../components/minimal-states';
import { AnalyticsRetryAction } from './analytics-ui';
import type { AnalyticsPageProps } from './analytics-model';

/**
 * Customer Success — carteira, saúde e relacionamento.
 *
 * A antiga aba "CS / Suporte" media exclusivamente tickets. Ao separar os
 * domínios, esse conteúdo foi para Suporte e Customer Success ficou sem
 * contrato de leitura próprio: `vw_cs_customer_portfolio` existe, mas pertence
 * ao módulo de Carteira CS, que não está publicado neste release.
 *
 * A regra do projeto é explícita: dado ausente é exibido como indisponível,
 * nunca simulado. Por isso esta superfície declara a lacuna em vez de derivar
 * indicadores de CS a partir de tickets, o que seria uma métrica inventada.
 */
export function AnalyticsCustomerSuccessPage({ onRetry }: AnalyticsPageProps) {
  return (
    <div className="space-y-4">
      <MinimalState
        title="Indicadores de Customer Success ainda não disponíveis"
        description="Esta área passou a ser separada de Suporte. Os indicadores de carteira, saúde e relacionamento dependem do contrato de Carteira CS, que ainda não está publicado. Enquanto isso, os indicadores de tickets estão na aba Suporte."
        actions={<AnalyticsRetryAction onRetry={onRetry} />}
      />
    </div>
  );
}
