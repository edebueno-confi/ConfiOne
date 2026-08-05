import { formatDateTime } from '../../../app/format';
import { UNAVAILABLE_LABEL, toneTextClassName, type IntegrationsHealthSummary } from './integration-health.mjs';

/**
 * Resumo das integracoes publicadas. Todos os numeros vem do read model; nada e
 * estimado. Quando nao existe execucao registrada, a faixa diz isso em vez de
 * exibir um valor neutro que pareceria saudavel.
 */
export function IntegrationsSummary({ summary }: { summary: IntegrationsHealthSummary }) {
  return (
    <section aria-label="Resumo das integrações" className="gso-int-summary">
      <div className="gso-int-summary-item">
        <span>Integrações ativas</span>
        <strong>
          {summary.enabled} de {summary.total}
        </strong>
        <small>Fontes publicadas nesta versão</small>
      </div>
      <div className="gso-int-summary-item">
        <span>Credenciais gravadas</span>
        <strong>
          {summary.withCredentials} de {summary.total}
        </strong>
        <small>{summary.pendingCredentials ? `${summary.pendingCredentials} ativa(s) sem credencial` : 'Nenhuma pendência entre as ativas'}</small>
      </div>
      <div className="gso-int-summary-item gso-int-summary-item--text">
        <span>Última execução</span>
        <strong>{summary.lastRunAt ? formatDateTime(summary.lastRunAt) : UNAVAILABLE_LABEL}</strong>
        <small>{summary.lastRunLabel ?? 'Nenhuma execução registrada até agora'}</small>
      </div>
      <div className="gso-int-summary-item gso-int-summary-item--health">
        <span>Estado geral</span>
        <strong className={toneTextClassName(summary.tone)}>{summary.healthLabel}</strong>
        <small>{summary.healthDetail}</small>
      </div>
    </section>
  );
}
