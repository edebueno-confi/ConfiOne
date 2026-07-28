import { MinimalState } from '../../components/minimal-states';
import type { AnalyticsPageProps } from './analytics-model';
import { AnalyticsHdDomainFrame } from './AnalyticsHdDomainFrame';

export function AnalyticsProductPage(_props: AnalyticsPageProps) {
  return <UnavailableArea title="Produto" description="A área está preparada para receber uma fonte confiável de solicitações, feedback e evolução de produto." />;
}

export function AnalyticsDevelopmentPage(_props: AnalyticsPageProps) {
  return <UnavailableArea title="Desenvolvimento" description="A área está preparada para receber uma fonte confiável de fluxo, qualidade e estabilidade de entrega." />;
}

function UnavailableArea({ title, description }: { title: string; description: string }) {
  return <AnalyticsHdDomainFrame title={title} description={description} source="Fonte operacional futura">
    <div className="gso-hd-domain-surface gso-hd-compact-unavailable space-y-3">
      <MinimalState title="Fonte ainda não conectada" description={description} />
      <p className="text-xs text-[color:var(--minimal-text-tertiary)]">Nenhum indicador demonstrativo é exibido até existir contrato, fonte e cobertura suficientes.</p>
    </div>
  </AnalyticsHdDomainFrame>;
}
