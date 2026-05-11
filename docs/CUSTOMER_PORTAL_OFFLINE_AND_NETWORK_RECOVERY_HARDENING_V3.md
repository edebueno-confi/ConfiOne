# Customer Portal Offline And Network Recovery Hardening V3

## Objetivo
Endurecer o comportamento do Portal Cliente B2B em falha temporaria de rede, timeout, host local indisponivel e reconexao, sem criar modo offline, sem tratar cache como fonte operacional e sem confundir erro de rede com sessao expirada, acesso revogado ou tenant indisponivel.

## Semantica final de network recovery
- `network_retryable` cobre falha temporaria de fetch, timeout controlado e indisponibilidade momentanea do host/backend.
- `fatal_error` fica reservado para contrato quebrado, payload inesperado ou falha nao recuperavel.
- `session_expired` continua separado e limpa o contexto operacional renderizado.
- `access_revoked` continua representando ator autenticado sem permissao customer-facing valida.
- `tenant_unavailable` continua representando ausencia de tenant elegivel para o portal.

## Regras operacionais
- nao existe modo offline;
- nao existe fila offline de mutacoes;
- retry automatico infinito e proibido;
- retry e sempre manual e explicito;
- dado antigo pode existir apenas como superficie indisponivel, nunca como verdade operacional;
- nenhuma mutacao customer-facing executa fora de `ready`;
- `network_retryable` nao derruba a sessao global sozinho, mas bloqueia a operacao ate nova revalidacao.

## Hardening aplicado

### API helpers
- `customer-portal-api.ts` ganhou timeouts controlados por classe de operacao:
  - bootstrap/sessao
  - leitura
  - mutacao
  - upload
- falhas `AbortError`, timeout e `Failed to fetch` agora convergem para `network_retryable`.
- erros de autorizacao, expiracao de sessao e contrato continuam separados.

### Provider
- `customer-portal-context.tsx` passou a impedir retries concorrentes.
- `refresh()` e `switchTenant()` nao disparam enquanto ha bootstrap, revalidacao ou retry em andamento.
- falha temporaria de leitura agora promove o portal para o estado global `network_retryable`, desmontando a superficie operacional ativa e centralizando o retry manual.
- o provider preserva compatibilidade com `stale_context` multiaba sem reintroduzir loop de `useEffectEvent`.

### UI do portal
- `/portal`, `/portal/tickets`, `/portal/tickets/:ticketId`, `/portal/help` e `/portal/help/:slug` limpam o dado local da superficie quando a leitura falha por rede.
- o estado visual de rede usa copy explicita de indisponibilidade e CTA `Tentar novamente`.
- tickets, artigos, resultados de busca e anexos deixam de parecer validos quando a leitura falha por rede.

## Contratos backend
- nenhum contrato novo foi necessario neste lote;
- o hardening reaproveita:
  - `rpc_customer_get_portal_session_status`
  - `vw_customer_portal_auth_context`
  - `vw_customer_portal_available_tenants`
  - `vw_customer_portal_active_tenant_context`
  - RPCs customer-facing existentes de tickets, anexos e Knowledge

## Validacao
- `npm run supabase:db:reset`
- `npm run supabase:test:db`
- `npm run supabase:lint:db`
- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`
- `npm run supabase:qa:local-support-fixture`
- browser real com customer valido, indisponibilidade temporaria do backend, retry manual e regressao admin

## Limites assumidos
- o portal nao oferece uso offline;
- sem backend disponivel, a recuperacao depende de retry manual quando o host voltar;
- o lote nao altera Admin Console, RLS, tenancy nem contratos de auth alem do necessario para classificacao correta do erro no runtime.

## Riscos restantes
- queda prolongada do host local continua dependente de retorno real do backend para sair de `network_retryable`;
- nao existe observabilidade dedicada de outage customer-facing ainda;
- futuras superficies do portal continuam obrigadas a usar o mesmo mapeamento de erro e o mesmo bloqueio fora de `ready`.
