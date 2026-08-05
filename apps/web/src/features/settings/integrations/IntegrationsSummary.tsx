import { formatDateTime } from '../../../app/format';
import { UiMetric } from '../ui/UiMetric';
import { UiMetricRow } from '../ui/UiMetricRow';
import { uiToneOf, uiValueToneOf } from '../ui/ui-tone-map';
import { UNAVAILABLE_LABEL, type IntegrationsHealthSummary } from './integration-health.mjs';

/**
 * Resumo das integracoes publicadas. Todos os numeros vem do read model; nada e
 * estimado. Quando nao existe execucao registrada, a faixa diz isso em vez de
 * exibir um valor neutro que pareceria saudavel.
 *
 * Usa a faixa de indicadores compartilhada por todas as telas de Configuracoes.
 */
export function IntegrationsSummary({ summary }: { summary: IntegrationsHealthSummary }) {
  return (
    <UiMetricRow label="Resumo das integrações">
      <UiMetric
        icon="plug"
        label="Integrações ativas"
        sub="Fontes publicadas nesta versão"
        tone="primary"
        value={`${summary.enabled} de ${summary.total}`}
      />
      <UiMetric
        icon="key"
        label="Credenciais gravadas"
        sub={summary.pendingCredentials ? `${summary.pendingCredentials} ativa(s) sem credencial` : 'Nenhuma pendência entre as ativas'}
        tone={summary.pendingCredentials ? 'warning' : 'neutral'}
        value={`${summary.withCredentials} de ${summary.total}`}
        valueTone={summary.pendingCredentials ? 'warning' : undefined}
      />
      <UiMetric
        icon="clock"
        label="Última execução"
        sub={summary.lastRunLabel ?? 'Nenhuma execução registrada até agora'}
        text
        tone="neutral"
        value={summary.lastRunAt ? formatDateTime(summary.lastRunAt) : UNAVAILABLE_LABEL}
      />
      <UiMetric
        icon="activity"
        label="Estado geral"
        sub={summary.healthDetail}
        text
        tone={uiToneOf(summary.tone)}
        value={summary.healthLabel}
        valueTone={uiValueToneOf(summary.tone)}
      />
    </UiMetricRow>
  );
}
