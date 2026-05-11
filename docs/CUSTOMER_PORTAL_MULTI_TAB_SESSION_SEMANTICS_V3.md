# Customer Portal Multi-Tab Session Semantics V3

## Objetivo
Formalizar a semantica de sessao multiaba do Portal Cliente B2B para `active_tenant_id` backend-governed, sem cache local como fonte de verdade e sem vazamento cross-tenant.

## Semantica oficial
- `active_tenant_id` continua global por usuario customer-facing.
- o valor persistido continua em `public.customer_portal_user_preferences`.
- trocar tenant em uma aba invalida operacionalmente as demais abas.
- a aba stale nao pode continuar operando como se o tenant anterior fosse valido.
- o frontend pode manter estado visual temporario, mas precisa revalidar o contexto antes de mutacoes sensiveis.
- o backend continua sendo a camada real de enforcement.

## Context version
- `vw_customer_portal_active_tenant_context` passou a expor `context_version`.
- `context_version` deriva de `customer_portal_user_preferences.updated_at` quando existe preferencia persistida valida.
- enquanto o usuario ainda nao persistiu preferencia, o fallback seguro usa `1970-01-01T00:00:00Z` como versao estavel.
- a troca via `rpc_customer_set_active_tenant(uuid)` devolve o `context_version` atualizado.

## Revalidacao no frontend
- `customer-portal-context.tsx` agora revalida o tenant ativo ao focar a janela/aba e ao voltar de `visibilitychange`.
- se `tenant_id` ou `context_version` mudarem no backend, a aba atual:
  - limpa o `activeContext` anterior;
  - guarda o contexto detectado como `pendingContext`;
  - entra em estado `stale`;
  - exige atualizacao explicita para continuar.

## Estado stale
- copy oficial:
  - `O contexto do portal mudou em outra aba. Atualize para continuar.`
- a shell continua visivel.
- a superficie principal sai do estado operacional anterior e mostra `StateFrame` honesto.
- o ticket, a lista e a central deixam de renderizar o tenant anterior como valido enquanto o contexto estiver stale.

## Mutacoes protegidas
- `rpc_customer_create_ticket`
- `rpc_customer_add_ticket_message`
- `rpc_customer_create_ticket_attachment_upload`
- `rpc_customer_get_attachment_download_url`
- `rpc_customer_acknowledge_ticket_update`
- `rpc_customer_confirm_ticket_resolved`
- `rpc_customer_request_ticket_reopen`

Regra:
- o frontend revalida antes de enviar a mutacao;
- se o contexto estiver stale, a acao e bloqueada na UI;
- se alguma aba ainda tentar operar com tenant antigo, o backend continua negando pela combinacao de `customer_portal_has_active_tenant(...)` e `can_access_customer_ticket(...)`.

## Boundary mantido
- `localStorage`, cache de query e estado React nao viram fonte de verdade de tenant.
- nao existe `BroadcastChannel` como enforcement de sessao.
- nao existe tenant switcher administrativo.
- `vw_admin_auth_context` continua isolado do tenant ativo customer-facing.
- `/admin/customer-portal` e `/admin/access` continuam fora do escopo do `active_tenant_id` customer-facing.

## Testes adicionados
- `context_version` inicial estavel sem preferencia persistida
- `context_version` muda apos switch real
- ticket antigo fica bloqueado apos switch
- busca autenticada com tenant antigo continua negada
- criacao de ticket no tenant antigo e negada
- resposta, ack, upload e download do tenant antigo continuam negados
- confirmacao de resolucao e reabertura no tenant antigo continuam negadas

## Riscos restantes
- nao existe sincronizacao visual imediata entre abas sem foco, por decisao de simplicidade e escopo
- a semantica de multiplas abas com sessao expirada ou offline prolongado continua para lote proprio

## Atualizacao posterior - expiracao e recuperacao de sessao
- A fase `Customer Portal Session Expiry And Recovery Semantics V3` separou formalmente:
  - `stale_context`
  - `session_expired`
  - `access_revoked`
  - `tenant_unavailable`
  - `network_retryable`
  - `fatal_error`
- A diferenca pratica:
  - `stale_context` continua ligada a outra aba alterando o tenant ativo;
  - `session_expired` limpa o contexto operacional e exige novo login;
  - `access_revoked` representa perda real do vinculo customer-facing;
  - `tenant_unavailable` representa perda do tenant habilitado, inclusive sem `returns_portal`;
  - `network_retryable` oferece retry explicito sem mascarar a falha.
