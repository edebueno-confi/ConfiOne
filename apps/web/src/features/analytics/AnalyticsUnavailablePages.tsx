import type { AnalyticsPageProps } from './analytics-model';
import { AnalyticsHdDomainFrame } from './AnalyticsHdDomainFrame';

type WaitingArea = {
  title: string;
  description: string;
  value: string;
  categories: string[];
  decision: string;
};

const PRODUCT_DEVELOPMENT: WaitingArea = {
  title: 'Produto e Desenvolvimento',
  description: 'Visão executiva correlacionada de roadmap, entregas, fluxo técnico, estabilidade e bloqueios da plataforma.',
  value: 'Roadmap, entregas e fluxo técnico',
  categories: ['Roadmap', 'Entregas', 'Releases', 'Pull requests', 'Lead time', 'Throughput', 'Incidentes', 'Bugs', 'Bloqueios', 'Ambientes'],
  decision: 'Definir a fonte GitHub e o contrato de leitura antes de publicar indicadores reais.',
};

export function AnalyticsProductDevelopmentPage({ sharedOperation }: AnalyticsPageProps) {
  return <WaitingAreaPage area={PRODUCT_DEVELOPMENT} operation={sharedOperation || null} />;
}

export const AnalyticsProductPage = AnalyticsProductDevelopmentPage;
export const AnalyticsDevelopmentPage = AnalyticsProductDevelopmentPage;

function WaitingAreaPage({ area, operation }: { area: WaitingArea; operation: string | null }) {
  return (
    <AnalyticsHdDomainFrame title={area.title} description={area.description} source="Integração futura">
      <div className="gso-hd-domain-surface gso-waiting-domain space-y-3">
        <section className="gso-waiting-domain-hero" aria-labelledby={`${area.title.toLowerCase()}-waiting-title`}>
          <div className="gso-waiting-domain-hero-copy">
            <span className="gso-waiting-domain-kicker">Modo de espera por integração</span>
            <h3 id={`${area.title.toLowerCase()}-waiting-title`}>A estrutura está pronta; os dados ainda não foram publicados.</h3>
            <p>O painel não chama GitHub neste lote e não cria números ilustrativos. {operation ? `O recorte ${operation} também permanece sem dimensão publicada.` : ''} Quando a fonte e o contrato forem aprovados, esta área poderá organizar {area.value.toLowerCase()} em uma leitura gerencial.</p>
          </div>
          <span className="gso-waiting-domain-status">Indisponível</span>
        </section>

        <div className="gso-waiting-domain-grid">
          <section className="gso-waiting-domain-panel" aria-labelledby={`${area.title.toLowerCase()}-categories-title`}>
            <header><h3 id={`${area.title.toLowerCase()}-categories-title`}>Estrutura preparada</h3><p>Categorias previstas, sem dados demonstrativos.</p></header>
            <ul className="gso-waiting-domain-list">{area.categories.map((category) => <li key={category}><span aria-hidden="true" />{category}<strong>Indisponível</strong></li>)}</ul>
          </section>
          <section className="gso-waiting-domain-panel" aria-labelledby={`${area.title.toLowerCase()}-activation-title`}>
            <header><h3 id={`${area.title.toLowerCase()}-activation-title`}>Dependências para ativação</h3><p>Próximas decisões do produto e da governança.</p></header>
            <dl className="gso-waiting-domain-facts">
              <div><dt>Fonte prevista</dt><dd>GitHub · não conectado</dd></div>
              <div><dt>Contrato de leitura</dt><dd>Indisponível</dd></div>
              <div><dt>Próxima decisão</dt><dd>{area.decision}</dd></div>
            </dl>
          </section>
        </div>
      </div>
    </AnalyticsHdDomainFrame>
  );
}
