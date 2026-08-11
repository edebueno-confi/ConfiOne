import { Link } from 'react-router';

/**
 * Eventos recentes das integracoes.
 *
 * A regiao e estrutural: ela existe mesmo sem evento. A superficie de
 * Integracoes le `vw_admin_managed_integrations`, que publica o estado atual de
 * cada fonte e nao uma serie de eventos; enquanto nao houver read model de
 * eventos publicado aqui, a tabela mantem o cabecalho de colunas e o estado
 * vazio factual, e o historico completo continua acessivel pela sua propria
 * tela. Nenhum evento e fabricado para preencher a regiao.
 */
export type IntegrationEvent = {
  id: string;
  occurredAt: string;
  integrationLabel: string;
  event: string;
  detail: string;
  status: string;
  actor: string;
};

const COLUMNS = ['Data e hora', 'Integração', 'Evento', 'Detalhes', 'Status', 'Executado por'];

export function IntegrationEventsTable({ events = [] }: { events?: IntegrationEvent[] }) {
  return (
    <section aria-labelledby="integration-events-title" className="gso-po-region gso-po-region--wide">
      <header className="gso-po-region-head">
        <h3 id="integration-events-title">Eventos recentes</h3>
        <p>Últimos eventos de status e sincronização das integrações.</p>
      </header>
      <div className="gso-po-table-wrap">
        <table className="gso-po-table gso-po-table--events">
          <thead>
            <tr>
              {COLUMNS.map((column) => (
                <th key={column} scope="col">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.length ? (
              events.map((item) => (
                <tr key={item.id}>
                  <td>{item.occurredAt}</td>
                  <td>{item.integrationLabel}</td>
                  <td>{item.event}</td>
                  <td>{item.detail}</td>
                  <td>{item.status}</td>
                  <td>{item.actor}</td>
                </tr>
              ))
            ) : (
              <tr className="gso-po-table-empty">
                <td colSpan={COLUMNS.length}>Nenhum evento de integração registrado neste ambiente.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <footer className="gso-po-region-foot">
        <span className="gso-po-metric-detail">
          {events.length ? `Mostrando ${events.length} de ${events.length} eventos` : 'Nenhum evento no recorte atual'}
        </span>
        <Link className="gso-po-action" to="/admin/settings/sync-history">
          Ver histórico completo
        </Link>
      </footer>
    </section>
  );
}
