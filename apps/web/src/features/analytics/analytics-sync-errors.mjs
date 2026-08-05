/* Copy das falhas de atualização do painel.
 *
 * Regra de produto: a interface diz o que aconteceu, qual o efeito e o que
 * fazer. Nenhum código de transporte, nome de serviço, função de servidor ou
 * texto cru devolvido pela origem chega à tela. O detalhe técnico continua
 * existindo, mas só no `Error` que sobe pela pilha (`cause`), nunca junto da
 * mensagem exibida.
 */

const OMIE_BUSY_CODES = ['OMIE_SYNC_IN_PROGRESS', 'OMIE_PROVIDER_BUSY'];

function keepState(label) {
  return `A atualização do ${label} não foi concluída. O painel mantém o último estado publicado.`;
}

export function formatAnalyticsSyncError({ operation, status, payload }) {
  const label = String(operation || 'painel');
  const code = String(payload?.code ?? '').toUpperCase();

  // Tempo excedido: a rodada foi interrompida antes de terminar.
  if (status === 546 || code === 'WORKER_LIMIT') {
    return `A atualização do ${label} passou do tempo permitido para uma única rodada e foi interrompida. O painel mantém o último estado publicado. Refaça a atualização por períodos menores.`;
  }

  // Indisponível: a atualização nem começou.
  if (status === 503 || status === 502 || code === 'BOOT_ERROR') {
    return `A atualização do ${label} não pôde ser iniciada agora. O painel mantém o último estado publicado. Tente novamente em alguns minutos; se continuar, avise a equipe responsável pela plataforma.`;
  }

  // Sem resposta no tempo esperado.
  if (status === 408 || status === 504) {
    return `A atualização do ${label} não respondeu no tempo esperado. O painel mantém o último estado publicado. Consulte o Histórico de atualizações antes de tentar de novo.`;
  }

  // Já em andamento.
  if (status === 409 && OMIE_BUSY_CODES.includes(code)) {
    return 'Já existe uma atualização do OMIE em andamento. Aguarde a conclusão antes de pedir outra; o painel avisa quando o novo estado for publicado.';
  }

  if (status === 409) {
    return `Já existe uma atualização do ${label} em andamento. Aguarde a conclusão antes de pedir outra.`;
  }

  // Sessão expirada.
  if (status === 401) {
    return 'Sua sessão expirou antes de a atualização começar. Entre novamente e repita a operação.';
  }

  // Sem permissão.
  if (status === 403) {
    return `Sua conta não tem permissão para atualizar o ${label}. Peça a liberação a quem administra os acessos.`;
  }

  // Configuração incompleta.
  if (status === 424 || code === 'INTEGRATION_CREDENTIALS_MISSING') {
    return 'Falta concluir a configuração do OMIE e do HubSpot em Configurações → Integrações antes de atualizar o painel.';
  }

  return `${keepState(label)} Consulte o Histórico de atualizações para ver o que ficou registrado e tente novamente.`;
}

/**
 * Detalhe técnico da falha. Serve ao diagnóstico de quem opera o sistema e
 * viaja apenas no `cause` do `Error`; nunca é renderizado.
 */
export function describeAnalyticsSyncFailure({ operation, status, payload }) {
  const parts = [`operation=${String(operation || 'painel')}`, `status=${String(status)}`];
  if (payload?.code) parts.push(`code=${String(payload.code)}`);
  if (typeof payload?.error === 'string' && payload.error.trim()) parts.push(`error=${payload.error.trim()}`);
  if (typeof payload?.message === 'string' && payload.message.trim()) parts.push(`message=${payload.message.trim()}`);
  return parts.join(' ');
}

/**
 * Erro pronto para subir pela pilha: `message` é a copy de produto que a tela
 * exibe, `cause` guarda o detalhe técnico para diagnóstico.
 */
export function analyticsSyncError(input) {
  const error = new Error(formatAnalyticsSyncError(input));
  error.name = 'AnalyticsSyncError';
  error.cause = describeAnalyticsSyncFailure(input);
  return error;
}
