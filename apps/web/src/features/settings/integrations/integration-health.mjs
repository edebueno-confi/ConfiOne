// Leitura pura do estado das integracoes gerenciais.
//
// Toda informacao aqui deriva do read model `vw_admin_managed_integrations`
// (is_enabled, has_credentials, last_run_status, last_run_at). Nenhum estado e
// inferido, simulado ou completado com valor padrao: quando o dado nao existe,
// a funcao devolve o rotulo de indisponibilidade para a interface exibir.

export const UNAVAILABLE_LABEL = 'Indisponível';

const TONE_CLASS = {
  success: 'gso-settings-status--success',
  warning: 'gso-settings-status--warning',
  danger: 'gso-settings-status--failed',
  muted: 'gso-settings-status--muted',
};

const TONE_TEXT_CLASS = {
  success: 'gso-settings-tone-success',
  warning: 'gso-settings-tone-warning',
  danger: 'gso-settings-tone-danger',
  muted: 'gso-settings-tone-muted',
};

/**
 * Classe do selo de estado, reaproveitada do design system de Configuracoes.
 * @param {'success' | 'warning' | 'danger' | 'muted'} tone
 */
export function toneClassName(tone) {
  return TONE_CLASS[tone] ?? TONE_CLASS.muted;
}

/**
 * Classe de cor de texto para estados exibidos sem selo.
 * @param {'success' | 'warning' | 'danger' | 'muted'} tone
 */
export function toneTextClassName(tone) {
  return TONE_TEXT_CLASS[tone] ?? TONE_TEXT_CLASS.muted;
}

/**
 * Estado da credencial: desativada, pendente ou configurada.
 * @param {{ isEnabled: boolean, hasCredentials: boolean }} item
 */
export function credentialState(item) {
  if (!item.isEnabled) return { key: 'disabled', label: 'Integração desativada', tone: 'muted' };
  if (!item.hasCredentials) return { key: 'pending', label: 'Credencial pendente', tone: 'warning' };
  return { key: 'configured', label: 'Credencial configurada', tone: 'success' };
}

/**
 * Resultado da ultima execucao registrada para a integracao.
 * @param {{ lastRunStatus: string }} item
 */
export function lastRunState(item) {
  if (item.lastRunStatus === 'success') return { key: 'success', label: 'Concluída', tone: 'success' };
  if (item.lastRunStatus === 'partial') return { key: 'partial', label: 'Parcial', tone: 'warning' };
  if (item.lastRunStatus === 'error') return { key: 'error', label: 'Com falha', tone: 'danger' };
  return { key: 'never', label: 'Sem execução registrada', tone: 'muted' };
}

/** @param {string | null} a @param {string | null} b */
function laterMoment(a, b) {
  if (!a) return b ?? null;
  if (!b) return a;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

/**
 * Consolida o estado das integracoes publicadas para o resumo da tela.
 * @param {Array<{ label: string, isEnabled: boolean, hasCredentials: boolean, lastRunStatus: string, lastRunAt: string | null, updatedAt: string }>} items
 */
export function summarizeIntegrations(items) {
  const list = Array.isArray(items) ? items : [];
  const enabled = list.filter((item) => item.isEnabled);
  const withCredentials = list.filter((item) => item.hasCredentials);
  const pendingCredentials = enabled.filter((item) => !item.hasCredentials);
  const failing = enabled.filter((item) => item.lastRunStatus === 'error');
  const partial = enabled.filter((item) => item.lastRunStatus === 'partial');
  const neverRan = enabled.filter((item) => item.lastRunStatus === 'never');

  let lastRunAt = null;
  let lastRunLabel = null;
  for (const item of list) {
    const next = laterMoment(lastRunAt, item.lastRunAt);
    if (next && next !== lastRunAt) lastRunLabel = item.label;
    lastRunAt = next;
  }

  let updatedAt = null;
  for (const item of list) updatedAt = laterMoment(updatedAt, item.updatedAt);

  let health = 'idle';
  let healthLabel = 'Sem integração ativa';
  let healthDetail = 'Ative uma fonte para o Dashboard receber dados.';
  let tone = 'muted';

  if (failing.length) {
    health = 'failure';
    healthLabel = 'Falha na última execução';
    healthDetail = `${failing.map((item) => item.label).join(', ')} não concluiu a última execução.`;
    tone = 'danger';
  } else if (pendingCredentials.length) {
    health = 'attention';
    healthLabel = 'Credencial pendente';
    healthDetail = `${pendingCredentials.map((item) => item.label).join(', ')} está ativa sem credencial gravada.`;
    tone = 'warning';
  } else if (partial.length) {
    health = 'attention';
    healthLabel = 'Última execução parcial';
    healthDetail = `${partial.map((item) => item.label).join(', ')} concluiu apenas parte da carga.`;
    tone = 'warning';
  } else if (neverRan.length) {
    health = 'attention';
    healthLabel = 'Aguardando primeira execução';
    healthDetail = `${neverRan.map((item) => item.label).join(', ')} ainda não registrou execução.`;
    tone = 'warning';
  } else if (enabled.length) {
    health = 'ok';
    healthLabel = 'Operando';
    healthDetail = 'Todas as fontes ativas concluíram a última execução.';
    tone = 'success';
  }

  return {
    total: list.length,
    enabled: enabled.length,
    withCredentials: withCredentials.length,
    pendingCredentials: pendingCredentials.length,
    lastRunAt,
    lastRunLabel,
    updatedAt,
    health,
    healthLabel,
    healthDetail,
    tone,
  };
}

/**
 * Rotulos de dominio publicados pela propria tela ao gravar a integracao.
 * Nao ha inferencia: uma chave desconhecida e exibida como veio do read model.
 */
const DOMAIN_LABEL = {
  commercial: 'Comercial',
  customer_success: 'Customer Success',
  support: 'Suporte',
  finance: 'Financeiro',
  product: 'Produto',
  development: 'Desenvolvimento',
};

/**
 * Escopos sincronizados de uma integracao, lidos apenas das chaves que a
 * propria aplicacao grava em `config`. Quando o read model nao publica escopo,
 * a funcao devolve lista vazia e a interface diz que a leitura nao existe.
 * Nenhum escopo e inventado nem completado com valor padrao.
 * @param {{ config?: Record<string, unknown> }} item
 * @returns {string[]}
 */
export function integrationScopes(item) {
  const config = item && typeof item.config === 'object' && item.config ? item.config : {};
  const domains = Array.isArray(config.domains) ? config.domains : [];
  const scopes = domains
    .filter((value) => typeof value === 'string' && value.trim())
    .map((value) => DOMAIN_LABEL[value] ?? value);
  const resource = typeof config.resource_label === 'string' && config.resource_label.trim()
    ? config.resource_label.trim()
    : null;
  if (resource && !scopes.includes(resource)) scopes.push(resource);
  return scopes;
}

/**
 * As tres metricas do painel de provedor, na ordem do blueprint aprovado.
 *
 * O read model publica uma unica execucao (`last_run_status` + `last_run_at`),
 * entao "ultimo sucesso" e "ultima falha" so podem afirmar algo sobre essa
 * execucao. Quando ela nao qualifica a posicao, a metrica devolve o rotulo de
 * indisponibilidade em vez de um valor que pareceria uma serie historica.
 * @param {IntegrationHealthInput & { credentialUpdatedAt: string | null, lastErrorMessage: string | null }} item
 */
export function providerMetrics(item) {
  const succeeded = item.lastRunStatus === 'success';
  const failed = item.lastRunStatus === 'error' || item.lastRunStatus === 'partial';
  const credential = credentialState(item);

  return [
    {
      key: 'last-success',
      label: 'Último sucesso',
      at: succeeded ? item.lastRunAt : null,
      value: succeeded ? null : UNAVAILABLE_LABEL,
      detail: succeeded ? 'Última execução registrada.' : 'Nenhuma execução concluída registrada.',
      tone: succeeded ? 'success' : 'muted',
    },
    {
      key: 'last-failure',
      label: 'Última falha',
      at: failed ? item.lastRunAt : null,
      value: failed ? null : '—',
      detail: failed
        ? (item.lastErrorMessage ? String(item.lastErrorMessage) : 'Última execução não concluiu integralmente.')
        : 'Nenhuma falha registrada.',
      tone: failed ? (item.lastRunStatus === 'error' ? 'danger' : 'warning') : 'muted',
    },
    {
      key: 'credential-health',
      label: 'Saúde das credenciais',
      at: null,
      value: credential.label,
      detail: item.credentialUpdatedAt
        ? 'Credencial atualizada nesta data.'
        : 'Data de atualização indisponível.',
      detailAt: item.credentialUpdatedAt,
      tone: credential.tone,
    },
  ];
}
