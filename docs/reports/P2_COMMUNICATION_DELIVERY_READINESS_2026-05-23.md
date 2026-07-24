# P2-B Communication Delivery Readiness & Outbox Foundation

Data: 2026-05-23
Branch: `codex/p2-b-communication-delivery-readiness`

## Sumario executivo

O lote P2-B criou a fundacao auditavel de delivery customer-facing sem integrar provider externo. O canal real neste corte e o `customer_portal`: mensagens publicas do suporte e mensagens inbound do cliente passam a registrar ledger append-only em `ticket_message_deliveries`. Email, WhatsApp, chat e API permanecem como canais futuros bloqueados por contrato, sem fila externa, sem job, sem retry e sem provider fake.

## Auditoria inicial

- Nao existia ledger/status de entrega de mensagem.
- Resposta publica do suporte era apenas `ticket_messages.visibility = customer` com evento de ticket.
- O Portal ja mostrava mensagens customer-facing, mas nao havia estado contratual de disponibilidade no portal.
- `can_reply_now`, `reply_mode` e `reason_if_unavailable` ja bloqueavam canais futuros na UI, mas `rpc_add_ticket_message` ainda precisava de hardening backend contra simulacao de envio externo.
- Nota interna, engineering, internal actions, audit bruto e storage path ja estavam fora do Portal.

## Decisoes de modelo

- `customer_portal` e o unico canal real de delivery.
- Canais externos foram modelados como readiness/capability bloqueada: `email_future`, `whatsapp_future`, `chat_future`, `api_future`.
- O ledger e append-only e auditado.
- Nenhum provider externo, token, API key, webhook, job, retry ou outbox executavel foi criado.
- Delivery nao altera `ticket.status`, nao cria internal action, nao cria engineering work item e nao publica Knowledge.

## Contratos criados ou alterados

Tipos:
- `ticket_delivery_channel`
- `ticket_delivery_status`
- `ticket_delivery_direction`
- `ticket_delivery_provider_state`

Tabela:
- `ticket_message_deliveries`

Views:
- `vw_support_ticket_message_deliveries`
- `vw_support_ticket_delivery_capabilities`
- `vw_customer_portal_ticket_delivery_state`
- `vw_admin_communication_delivery_summary`

Views ampliadas:
- `vw_support_ticket_timeline`
- `vw_support_ticket_timeline_recent`
- `vw_customer_portal_ticket_timeline`

RPCs/funcoes:
- `rpc_add_ticket_message`
- `rpc_customer_add_ticket_message`
- `rpc_support_get_ticket_timeline`
- `app_private.register_customer_portal_delivery`

## Frontend

- `/support/tickets/:ticketId` passa a exibir status leve de delivery na timeline: `Disponivel no Portal` ou `Recebida pelo Portal`.
- O composer usa copy `Resposta publica via Portal` quando o modo e customer portal.
- Canais externos continuam indisponiveis por `can_reply_now=false`/`reason_if_unavailable`.
- Portal continua exibindo apenas labels customer-facing, sem provider, enum cru, erro tecnico ou metadata.

## Fixture QA

A fixture funcional local agora registra deliveries nativos para:
- `8e5ee201-7e27-45ef-9e61-f3209f6ad211`: mensagem inbound do cliente no Portal.
- `8e5ee201-7e27-45ef-9e61-f3209f6ad212`: resposta publica do suporte disponivel no Portal.

Tickets uteis:
- `8e5ee201-7e27-45ef-9e61-f3209f6ad202`: ticket criado pelo portal cliente.
- `8e5ee201-7e27-45ef-9e61-f3209f6ad203`: canal email futuro indisponivel.

## QA e validacoes

- `supabase db reset --local --yes`
- `npm run supabase:test:db`: 45 arquivos, 933 testes PASS.
- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`
- `npm run supabase:lint:db`
- `npm run supabase:qa:local-functional-fixture` duas vezes, com deliveries P2-B preservados de forma idempotente.

Smoke browser autenticado executado em `http://127.0.0.1:5173`:
- `support_manager`: `/support/queue`, `/support/tickets/8e5ee201-7e27-45ef-9e61-f3209f6ad202` e `/support/tickets/8e5ee201-7e27-45ef-9e61-f3209f6ad203` carregaram sem scroll horizontal, sem erro cru e sem enum tecnico. A timeline mostrou mensagens customer-facing como `Disponivel no Portal` / `Recebida pelo Portal`; o ticket de e-mail futuro manteve `Enviar resposta` desabilitado com motivo operacional.
- `customer_user`: `/portal/tickets/8e5ee201-7e27-45ef-9e61-f3209f6ad202` mostrou resposta do suporte e mensagem do cliente sem nota interna, internal actions, engenharia, audit bruto, `provider_state`, `reason_if_blocked` ou enum cru.
- `platform_admin`: `/admin/system` e `/admin/customer-portal` carregaram sem tela falsa de provider, token ou cadastro de canal externo.
- Publico anonimo: `/help/genius` carregou sem dependencia de delivery.
- Regressao rapida: `/internal-actions` e `/engineering` carregaram com os usuarios QA correspondentes, sem erro cru e sem scroll horizontal global.

## Boundaries confirmados

- Portal nao ve nota interna.
- Portal nao ve delivery tecnico, provider_state, reason tecnico, audit bruto ou storage path.
- Support nao simula envio externo.
- Email/WhatsApp/chat/API nao ficam funcionais.
- Nenhum segredo/token/API key foi criado.
- Delivery nao altera `ticket.status`.
- Delivery nao cria engenharia, internal actions ou publicacao de Knowledge.
- Public Help nao depende de delivery.

## Riscos restantes

- Ainda nao existe provider real, retry, dead-letter, webhook, threading externo ou reconciliacao de entrega externa.
- O admin summary e leitura sanitizada; configuracao de provider fica para fase futura.
- Quando email/WhatsApp/chat forem implementados, sera necessario contrato proprio de provider, secrets, tentativa de envio, retry e observabilidade.

## Proxima fase recomendada

`P2-C Communication Provider Contract Design`, ainda sem conectar provider real em producao: especificar provider boundaries, segredo, outbound attempt, retry/backoff, idempotencia, webhooks e reconciliacao antes de qualquer API externa.
