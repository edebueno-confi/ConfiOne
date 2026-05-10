# Customer Portal Ticket Collaboration V3

## Objetivo
Consolidar a colaboracao real do cliente B2B no portal autenticado, cobrindo leitura/ack, resposta customer-facing, timeline segura e solicitacoes controladas de resolucao/reabertura sem expor operacao interna.

## Auditoria inicial
- Ja existiam `rpc_customer_add_ticket_message`, `rpc_customer_acknowledge_ticket_update`, `customer_ticket_update_acknowledgements`, `vw_customer_portal_ticket_timeline`, `vw_customer_portal_ticket_detail`, `ticket_messages` e `ticket_events`.
- A timeline customer-facing ja tinha boundary propria, mas foi endurecida para aceitar somente mensagens `customer` e eventos explicitamente seguros.
- O ack existia, mas nao validava que o `last_timeline_entry_id` recebido pertencia a uma entrada customer-facing disponivel para o ticket/tenant do ator.
- Nao existia read model dedicado de colaboracao com `unread_count`, `has_new_updates` e flags de acao derivadas pelo backend.
- Fechamento/reabertura pelo cliente ainda nao tinha contrato.

## Contratos finais
- `vw_customer_portal_ticket_detail`
  - bloqueia nova mensagem customer-facing em tickets `resolved`, `closed` e `cancelled`.
- `vw_customer_portal_ticket_timeline`
  - expõe apenas mensagens publicas/customer-facing.
  - expõe apenas eventos seguros para cliente.
  - nao expõe nota interna, engenharia, audit bruto, advisory, metadata sensivel ou anexo interno.
- `vw_customer_portal_ticket_collaboration_state`
  - deriva `can_reply`, `can_acknowledge`, `can_confirm_resolution`, `can_request_reopen`, `unread_count`, `has_new_updates`, `last_customer_message_at` e `last_support_response_at`.
- `rpc_customer_add_ticket_message`
  - exige ator customer ativo e ticket permitido.
  - bloqueia ticket `resolved`, `closed` e `cancelled`.
  - exige body nao vazio e limita a 4000 caracteres.
  - cria mensagem `customer`, `ticket_event` customer-facing e `audit_log`.
  - quando o ticket esta em `waiting_customer`, retorna para `waiting_support` via transicao backend.
- `rpc_customer_acknowledge_ticket_update`
  - continua idempotente.
  - valida que o timeline entry opcional existe na timeline customer-facing autorizada.
- `rpc_customer_confirm_ticket_resolved`
  - permite confirmar resolucao apenas quando o ticket esta `resolved`.
  - fecha o ticket via backend com `ticket_event` e `audit_log`.
- `rpc_customer_request_ticket_reopen`
  - permite solicitar reabertura apenas de ticket `resolved` ou `closed`.
  - exige motivo operacional nao vazio e limitado a 1200 caracteres.
  - move o ticket para `waiting_support` via backend com evento estruturado.

## Frontend
- `/portal/tickets/:ticketId` consome `vw_customer_portal_ticket_collaboration_state`.
- O portal mostra atualizacoes novas, ultima leitura, ultima resposta do cliente e ultima resposta da equipe Genius.
- O composer customer-facing usa `can_reply` do backend.
- O ack usa `latest_timeline_entry_id` derivado pelo backend.
- Confirmacao de resolucao e solicitacao de reabertura aparecem apenas quando as flags contratuais permitem.
- A UI nao exibe operacao interna, engenharia, audit bruto, storage path, metadata sensivel ou regra calculada localmente.

## Testes
- `supabase/tests/030_customer_portal_ticket_collaboration.sql` cobre timeline segura, ack idempotente, body vazio/grande, resposta permitida, cross-tenant bloqueado, ticket resolvido bloqueando resposta, confirmacao de resolucao, reabertura valida/invalida, audit logs, ticket events e DML direto bloqueado.
- Fixture QA inclui colaboracao customer-facing real com mensagem e ack pelo portal.

## Acoes habilitadas
- Cliente responde ticket permitido e aberto para resposta.
- Cliente marca atualizacao como lida.
- Cliente confirma resolucao quando o suporte marcou o ticket como `resolved`.
- Cliente solicita reabertura de ticket `resolved` ou `closed` com motivo.

## Acoes bloqueadas
- Cliente nao cria nota interna.
- Cliente nao altera prioridade, severidade, categoria ou SLA.
- Cliente nao ve engenharia interna, audit bruto, advisory, notas internas ou Knowledge draft/internal/restricted.
- Cliente nao fecha ticket arbitrariamente fora do estado `resolved`.
- Cliente nao reabre ticket ainda aberto.
- Chat realtime, notificacao externa, NPS, IA e Omni Inbox seguem fora de escopo.

## Riscos restantes
- A regra de janela temporal para reabertura ainda nao existe; o corte MVP usa apenas status `resolved`/`closed` e motivo obrigatorio.
- Nao ha notificacao externa para o time interno quando cliente responde, confirma ou reabre.
- Satisfacao/NPS e chat realtime continuam pendentes por decisao de produto.

## Proximo lote recomendado
`Customer Portal Access Administration V3`

Foco:
- convite/revogacao governada por tenant;
- boundary operacional do `customer_manager`;
- trilha auditavel de acesso customer-facing;
- sem auth paralela, sem bypass e sem permissao calculada no frontend.
