import type { AnalyticsPageProps } from './analytics-model';
import { AnalyticsHdDomainFrame } from './AnalyticsHdDomainFrame';

type WaitingArea = {
  title: string;
  description: string;
  value: string;
  categories: string[];
  decision: string;
};

const PRODUCT: WaitingArea = {
  title: 'Produto',
  description: 'Visão executiva do que está sendo entregue, dos temas observados e do impacto esperado para o cliente.',
  value: 'Roadmap e entregas',
  categories: ['Roadmap', 'Entregas', 'Incidentes', 'Bugs', 'Temas reportados', 'Releases', 'Lead time'],
  decision: 'Definir a fonte operacional e o contrato de leitura antes de publicar indicadores de produto.',
};

const DEVELOPMENT: WaitingArea = {
  title: 'Desenvolvimento',
  description: 'Visão executiva da capacidade de entrega, do fluxo técnico, da estabilidade e dos bloqueios da plataforma.',
  value: 'Fluxo e estabilidade',
  categories: ['Deploys', 'Pull requests', 'Lead time', 'Throughput', 'Incidentes', 'Bugs', 'Bloqueios', 'Ambientes', 'Releases'],
  decision: 'Definir a integração futura e o contrato de leitura antes de publicar indicadores técnicos.',
};

export function AnalyticsProductPage(_props: AnalyticsPageProps) {
  return <WaitingAreaPage area={PRODUCT} />;
}

export function AnalyticsDevelopmentPage(_props: AnalyticsPageProps) {
  return <WaitingAreaPage area={DEVELOPMENT} />;
}

function WaitingAreaPage({ area }: { area: WaitingArea }) {
  return (
    <AnalyticsHdDomainFrame title={area.title} description={area.description} source="Integração futura">
      <div className="gso-hd-domain-surface gso-waiting-domain space-y-3">
        <section className="gso-waiting-domain-hero" aria-labelledby={`${area.title.toLowerCase()}-waiting-title`}>
          <div className="gso-waiting-domain-hero-copy">
            <span className="gso-waiting-domain-kicker">Modo de espera por integração</span>
            <h3 id={`${area.title.toLowerCase()}-waiting-title`}>A estrutura está pronta; os dados ainda não foram publicados.</h3>
            <p>O painel não chama GitHub neste lote e não cria números ilustrativos. Quando a fonte e o contrato forem aprovados, esta área poderá organizar {area.value.toLowerCase()} em uma leitura gerencial.</p>
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
