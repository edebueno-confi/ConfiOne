import { MinimalState } from '../../components/minimal-states';
import type { AnalyticsPageProps } from './analytics-model';

export function AnalyticsProductPage(_props: AnalyticsPageProps) {
  return <UnavailableArea title="Produto" description="A área está preparada para receber uma fonte confiável de solicitações, feedback e evolução de produto." />;
}

export function AnalyticsDevelopmentPage(_props: AnalyticsPageProps) {
  return <UnavailableArea title="Desenvolvimento" description="A área está preparada para receber uma fonte confiável de fluxo, qualidade e estabilidade de entrega." />;
}

function UnavailableArea({ title, description }: { title: string; description: string }) {
  return <section className="gso-hd-domain-surface space-y-4" aria-labelledby="analytics-unavailable-heading">
    <header className="border-b border-[color:var(--minimal-border)] pb-3">
      <h2 id="analytics-unavailable-heading" className="text-base font-semibold text-[color:var(--minimal-text)]">{title}</h2>
      <p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">Fonte ainda não conectada</p>
    </header>
    <MinimalState title="Fonte ainda não conectada" description={description} />
    <p className="text-xs text-[color:var(--minimal-text-tertiary)]">Nenhum indicador demonstrativo é exibido até existir contrato, fonte e cobertura suficientes.</p>
  </section>;
}
