export function formatAnalyticsSyncError({ operation, status, payload }) {
  const label = String(operation || 'integração');
  const code = String(payload?.code ?? '').toUpperCase();

  if (status === 546 || code === 'WORKER_LIMIT') {
    return `A sincronização do ${label} excedeu o limite de execução do worker (HTTP 546). Execute novamente em etapas menores.`;
  }

  if (status === 503 || code === 'BOOT_ERROR') {
    return `O serviço de sincronização do ${label} está indisponível (HTTP 503). Verifique se a Edge Function está ativa e tente novamente.`;
  }

  if (status === 409 && ['OMIE_SYNC_IN_PROGRESS', 'OMIE_PROVIDER_BUSY'].includes(code)) {
    return 'Já existe uma sincronização OMIE em andamento ou o provedor está concluindo uma requisição anterior. Aguarde alguns segundos e tente novamente.';
  }

  if (status === 424 || code === 'INTEGRATION_CREDENTIALS_MISSING') {
    return 'Configure as credenciais do OMIE e do HubSpot em Configurações → Integrações antes de sincronizar.';
  }

  const detail = typeof payload?.error === 'string' ? payload.error.trim() : '';
  if (detail) return detail;

  const providerMessage = typeof payload?.message === 'string' ? payload.message.trim() : '';
  if (providerMessage) return providerMessage;

  return `Sincronização do ${label} recusada pelo servidor (HTTP ${status}).`;
}
