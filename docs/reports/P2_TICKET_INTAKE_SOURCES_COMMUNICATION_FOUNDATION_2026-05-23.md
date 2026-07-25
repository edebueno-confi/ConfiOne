# P2 Ticket Intake, Sources & Communication Foundation

Data: 2026-05-23
Branch: `codex/p2-ticket-intake-sources-communication-foundation`

## Sumário executivo

O lote P2 consolidou a fundação operacional de origem, canal e comunicação dos tickets sem integrar canais externos reais. O backend agora normaliza a origem do ticket, o canal de comunicação e a capacidade de resposta por read models/RPCs. O Support Workspace exibe origem/canal sem poluir a fila, bloqueia resposta pública quando o canal ainda é futuro e diferencia mensagens outbound, inbound, internas e eventos de sistema. O Portal Cliente recebe apenas labels customer-facing e segue sem nota interna, engenharia, internal actions, audit bruto, storage path ou enum técnico.

## Auditoria inicial

- `tickets.source` já existia como enum e era usado de forma ambígua para origem/canal (`portal`, `email`, `chat`, `phone`, `api`, `internal`).
- `rpc_customer_create_ticket` já criava tickets com source `portal`.
- `rpc_create_ticket` aceitava source informado pelo suporte.
- `ticket_messages` e `ticket_events` não projetavam direção/canal em read models.
- A fila e o workspace mostravam parte do source, mas sem capacidade operacional de resposta.
- O Portal já filtrava timeline customer-facing, mas não tinha label específico de origem/canal.
- Não havia botão funcional de canal externo, mas tickets com source futuro não tinham motivo backend para resposta indisponível.

## Decisões de modelo

- Não foi criada integração com WhatsApp, email, chat, API externa ou Omni Inbox.
- O enum atual `ticket_source` foi preservado para evitar tabela nova desnecessária neste corte.
- A normalização passou a ser derivada em read models:
  - source `internal` ou `phone`: suporte manual ou suporte interno;
  - source `portal`: portal do cliente;
  - source `email`, `chat`, `api`: canais futuros indisponíveis para resposta direta.
- `can_reply_now`, `reply_mode` e `reason_if_unavailable` vêm do backend.
- Metadata de mensagens/eventos passa a carregar direção e canal quando criada por RPC.

## Contratos criados ou alterados

Views novas:
- `vw_admin_ticket_channel_definitions`
- `vw_support_ticket_channel_context`
- `vw_support_ticket_communication_capabilities`

Views ampliadas:
- `vw_support_tickets_queue`
- `vw_support_ticket_detail`
- `vw_ticket_timeline`
- `vw_support_ticket_timeline`
- `vw_support_ticket_timeline_recent`
- `vw_customer_portal_ticket_list`
- `vw_customer_portal_ticket_detail`
- `vw_customer_portal_ticket_timeline`

RPCs ajustadas:
- `rpc_create_ticket`
- `rpc_add_ticket_message`
- `rpc_add_internal_ticket_note`
- `rpc_support_get_ticket_timeline`
- `rpc_customer_create_ticket`
- `rpc_customer_add_ticket_message`

## Frontend alterado

- `/support/queue` exibe canal/origem compacto na lista.
- `/support/tickets/:ticketId` mostra origem/canal no header e rail.
- Composer público respeita `can_reply_now` e `reason_if_unavailable` do backend.
- Timeline diferencia metadados de canal/direção sem transformar eventos técnicos em conversa.
- `/portal/tickets` e `/portal/tickets/:ticketId` mostram copy customer-facing como "Enviado pelo portal" e "Resposta do suporte".

## Fixture QA

Fixture funcional local atualizada com quatro tickets P2 sanitizados:

- `8e5ee201-7e27-45ef-9e61-f3209f6ad201`: suporte manual, canal suporte interno, resposta disponível.
- `8e5ee201-7e27-45ef-9e61-f3209f6ad202`: portal cliente, canal portal, resposta disponível.
- `8e5ee201-7e27-45ef-9e61-f3209f6ad203`: email futuro, resposta indisponível.
- `8e5ee201-7e27-45ef-9e61-f3209f6ad204`: API futura, resposta indisponível.

Usuários principais:
- `qa.local.platform-admin@genius.local` / `LOCAL_QA_ADMIN_PASSWORD`
- `qa.local.support-manager-a@genius.local` / `LOCAL_QA_SUPPORT_MANAGER_PASSWORD`
- `qa.local.support-agent-a@genius.local` / `LOCAL_QA_SUPPORT_AGENT_PASSWORD`
- `marina.ops@support-qa-a.local` / `LOCAL_QA_CLIENT_PASSWORD`
- `gestao.portal@support-qa-a.local` / `LOCAL_QA_CUSTOMER_MANAGER_PASSWORD`

## QA executado

Banco:
- `npm run supabase:lint:db`
- `npm run supabase:test:db` com 44 arquivos e 913 testes PASS.
- `npm run supabase:qa:local-functional-fixture` executado duas vezes com sucesso após correção de idempotência append-only.

Frontend/build:
- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`

Browser smoke:
- `/support/queue`
- `/support/tickets/8e5ee201-7e27-45ef-9e61-f3209f6ad202`
- `/support/tickets/8e5ee201-7e27-45ef-9e61-f3209f6ad203`
- `/portal/tickets/8e5ee201-7e27-45ef-9e61-f3209f6ad202`
- `/admin/tenants`
- `/admin/customer-portal`
- `/admin/system`
- `/internal-actions`
- `/internal-actions/30bc109f-711e-4d5b-9921-3aedc75d8630`
- `/engineering`
- `/engineering/work-items/f755e5e8-30de-4785-8a66-3423f119bfa0`
- `/help/genius`
- `/help/genius/articles`

## Boundaries confirmados

- Portal não vê nota interna P2.
- Portal não vê internal actions.
- Portal não vê engenharia interna.
- Portal não vê audit bruto.
- Portal não vê storage path.
- Portal não vê enum cru `customer_portal` nem `source`.
- Support não simula envio externo.
- Canal futuro não vira botão funcional.
- Public Help não depende de ticket source.
- `ticket.status` não muda por causa de source/channel.
- `engineering_work_items` não são criados automaticamente.
- `internal_actions` não são criadas automaticamente.

## Riscos restantes

- `ticket_source` continua acumulando origem e canal no schema base; o read model normaliza, mas uma tabela dedicada de canal pode ser útil quando integrações externas reais começarem.
- Canais email/chat/api são apenas preparados e bloqueados. Não existe envio externo, recebimento externo, provider, retry, delivery status ou inbox omni.
- A fixture funcional é robusta, mas lenta porque reidrata a massa ampla de suporte e edge runtime local.
- Labels de canais futuros devem ser revisitados quando houver provider real e política de entrega.

## Próxima fase recomendada

Executar um lote P2-B focado em "Ticket Creation UX + Intake Governance", conectando melhor criação manual de tickets, motivo inicial, contato solicitante e source normalizado, ainda sem integração externa real.
