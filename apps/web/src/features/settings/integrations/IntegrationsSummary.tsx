import { formatDateTime } from '../../../app/format';
import { UNAVAILABLE_LABEL, toneTextClassName, type IntegrationsHealthSummary } from './integration-health.mjs';

/**
 * Resumo das integracoes publicadas. Todos os numeros vem do read model; nada e
 * estimado. Quando nao existe execucao registrada, a faixa diz isso em vez de
 * exibir um valor neutro que pareceria saudavel.
 *
 * Usa a faixa de indicadores compartilhada por todas as telas de Configuracoes.
 */
export function IntegrationsSummary({ summary }: { summary: IntegrationsHealthSummary }) {
  return (
    <section aria-label="Resumo das integrações" className="gso-settings-metrics">
      <div className="gso-settings-metric">
        <span>Integrações ativas</span>
        <strong>
          {summary.enabled} de {summary.total}
        </strong>
        <small>Fontes publicadas nesta versão</small>
      </div>
      <div className="gso-settings-metric">
        <span>Credenciais gravadas</span>
        <strong>
          {summary.withCredentials} de {summary.total}
        </strong>
        <small>{summary.pendingCredentials ? `${summary.pendingCredentials} ativa(s) sem credencial` : 'Nenhuma pendência entre as ativas'}</small>
      </div>
      <div className="gso-settings-metric gso-settings-metric--text">
        <span>Última execução</span>
        <strong>{summary.lastRunAt ? formatDateTime(summary.lastRunAt) : UNAVAILABLE_LABEL}</strong>
        <small>{summary.lastRunLabel ?? 'Nenhuma execução registrada até agora'}</small>
      </div>
      <div className="gso-settings-metric gso-settings-metric--text gso-settings-metric--accent">
        <span>Estado geral</span>
        <strong className={toneTextClassName(summary.tone)}>{summary.healthLabel}</strong>
        <small>{summary.healthDetail}</small>
      </div>
    </section>
  );
}
