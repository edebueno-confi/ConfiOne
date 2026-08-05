import { AppError } from '../../app/errors';

export interface ClassifiedAdminError {
  kind: 'contract-unavailable' | 'session-expired' | 'permission-denied' | 'error';
  message: string;
}

function sanitizeAdminMessage(message: string, fallbackMessage: string) {
  const normalized = message.trim();
  const lowered = normalized.toLowerCase();

  if (!normalized) {
    return fallbackMessage;
  }

  if (
    lowered.includes('duplicate key') ||
    lowered.includes('already exists') ||
    lowered.includes('ja existe') ||
    lowered.includes('já existe')
  ) {
    return 'Já existe um registro com os mesmos dados principais. Revise os campos e tente novamente.';
  }

  // Mensagens do gate de publicacao publica: traduzir para acao concreta em vez
  // de vazar o texto cru do backend em ingles.
  if (lowered.includes('must be public before preparing public evidence')) {
    return 'Defina a visibilidade como Público e salve o artigo antes de preparar a evidência de publicação.';
  }

  if (lowered.includes('must be in review before publish')) {
    return 'Envie o artigo para revisão antes de publicar.';
  }

  if (lowered.includes('requires reviewed human evidence')) {
    return 'A publicação pública exige revisão editorial registrada. Conclua a confirmação editorial antes de publicar.';
  }

  if (lowered.includes('requires complete human confirmations')) {
    return 'Marque todos os itens da confirmação editorial antes de publicar.';
  }

  if (lowered.includes('requires public advisory classification')) {
    return 'A evidência editorial ainda não está classificada como pública. Refaça a confirmação com a visibilidade Público.';
  }

  if (
    lowered.includes('violates check constraint') ||
    lowered.includes('status transition') ||
    lowered.includes('invalid input value for enum') ||
    lowered.includes('must be in') ||
    lowered.includes('cannot be') ||
    lowered.includes('immutable') ||
    lowered.includes('editorial revision') ||
    lowered.includes('only published knowledge articles support editorial revision')
  ) {
    return 'Não foi possível concluir a ação na etapa atual. Revise o status e os campos obrigatórios antes de tentar novamente.';
  }

  if (
    lowered.includes('jwt') ||
    lowered.includes('permission denied') ||
    lowered.includes('row-level security')
  ) {
    return 'Sua sessão não tem permissão para concluir esta ação agora.';
  }

  if (
    lowered.includes('edge function') ||
    lowered.includes('non-2xx') ||
    lowered.includes('status code') ||
    lowered.includes('http 4') ||
    lowered.includes('http 5')
  ) {
    return fallbackMessage;
  }

  if (
    lowered.includes('constraint') ||
    lowered.includes('postgres') ||
    lowered.includes('sql') ||
    lowered.includes('supabase') ||
    lowered.includes('rpc_') ||
    lowered.includes('vw_')
  ) {
    return fallbackMessage;
  }

  return normalized;
}

export function classifyAdminError(
  error: unknown,
  fallbackMessage: string,
): ClassifiedAdminError {
  if (error instanceof AppError) {
    if (error.code === 'contract-unavailable') {
      return {
        kind: 'contract-unavailable',
        message: error.message,
      };
    }

    if (error.code === 'session-expired') {
      return {
        kind: 'session-expired',
        message: error.message,
      };
    }

    if (error.code === 'permission-denied') {
      return {
        kind: 'permission-denied',
        message: 'Sua conta não tem permissão para concluir esta ação agora.',
      };
    }

    return {
      kind: 'error',
      message: sanitizeAdminMessage(error.message || fallbackMessage, fallbackMessage),
    };
  }

  if (error instanceof Error) {
    return {
      kind: 'error',
      message: sanitizeAdminMessage(error.message || fallbackMessage, fallbackMessage),
    };
  }

  return {
    kind: 'error',
    message: fallbackMessage,
  };
}
