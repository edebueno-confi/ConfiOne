import { Link } from 'react-router-dom';
import type { AnalyticsPageProps } from './analytics-model';
import { AnalyticsHdDomainFrame } from './AnalyticsHdDomainFrame';
import { MinimalState } from '../../components/minimal-states';
import { analyticsHref } from './analytics-navigation';

/**
 * Customer Success ainda não possui um read model publicado para esta
 * superfície. Não reutilizar o snapshot executivo aqui: ele agrega contexto
 * suficiente para a Visão Geral, mas não constitui o contrato operacional de
 * CS e não deve ser apresentado como indicador próprio da área.
 */
export function AnalyticsCustomerSuccessPage(_props: AnalyticsPageProps) {
  return (
    <AnalyticsHdDomainFrame
      title="Customer Success"
      description="Carteira, cobertura de responsáveis e qualidade do relacionamento."
      source="Contrato Customer Success não publicado"
    >
      <MinimalState
        title="Indicadores de Customer Success ainda não configurados"
        description="A carteira estruturada, o health score, as renovações e os sinais de risco precisam de um contrato de origem próprio antes de serem exibidos nesta área. Nenhum indicador foi inferido do Dashboard executivo ou de tickets."
      />
      <p className="mt-4 text-xs text-[color:var(--minimal-text-tertiary)]">
        Dependência: publicar read model/RPC de Customer Success com tenant, RLS,
        permissão, frescor e auditoria definidos.
      </p>
      <Link
        to={analyticsHref('ceo')}
        className="mt-4 inline-flex text-xs font-semibold text-[color:var(--minimal-action)]"
      >
        Voltar à Visão Geral <span aria-hidden="true">→</span>
      </Link>
    </AnalyticsHdDomainFrame>
  );
}
