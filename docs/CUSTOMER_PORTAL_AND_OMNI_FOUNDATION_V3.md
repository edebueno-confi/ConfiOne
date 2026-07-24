# Customer Portal And Omni Foundation V3

## Objetivo
Registrar a fundacao futura para Portal Cliente, Omni Inbox e IA operacional sem implementar Omni Inbox, canais externos ou IA neste lote.

## Separacao conceitual

### Ticket
Ticket continua sendo a unidade operacional de suporte B2B. Ele concentra estado, classificacao, SLA interno, evidencias, eventos e historico governado.

### Thread/canal futuro
Thread de canal deve ser entidade separada do ticket. Uma thread pode representar email, WhatsApp, formulario autenticado, portal ou outro canal externo. O ticket pode referenciar uma ou mais threads por tabela de vinculo futura, sem misturar payload bruto de canal em `ticket_messages`.

### Timeline operacional
A timeline atual de tickets continua sendo read model de eventos e mensagens governadas. No futuro, ela pode agregar eventos vindos de threads/canais, desde que o backend sanitize origem, ator, visibilidade e payload.

## Boundary para canais externos
- Canal externo nao deve escrever diretamente em `tickets`, `ticket_messages`, `ticket_events` ou anexos.
- Toda entrada deve passar por RPC ou worker transacional.
- Payload bruto de canal deve ficar fora do frontend operacional.
- Segredos, headers, webhooks e tokens devem ficar fora de views.
- Cada evento precisa carregar tenant, ticket/thread quando houver, ator/origem e auditabilidade.

## Como tickets conversarao com canais
Fluxo futuro sugerido:
1. Canal recebe mensagem externa.
2. Worker valida assinatura/origem e resolve tenant.
3. Worker cria ou localiza thread.
4. Worker cria ou vincula ticket por RPC.
5. Worker registra mensagem/evento sanitizado.
6. Frontend le apenas read model operacional.

O portal autenticado criado neste lote pode ser tratado como o primeiro canal customer-facing seguro, mas ainda nao como Omni Inbox.

## Como IA consumira contexto futuramente
IA deve consumir apenas contexto citavel e autorizado por backend:
- tickets permitidos;
- timeline sanitizada;
- Knowledge publica ou interna conforme papel;
- Customer Account Profile seguro;
- evidencias apenas por metadata e permissao explicita;
- eventos de engenharia somente quando o papel permitir.

IA nao deve ler:
- audit bruto;
- storage path;
- secrets;
- payload bruto de canal;
- drafts/advisory de Knowledge;
- notas internas quando o destino for cliente.

## Knowledge no portal e na IA
- Portal cliente consome apenas artigos publicos publicados enviados ao cliente ou autorizados por contrato futuro.
- Knowledge interna/restrita continua fora do portal.
- IA customer-facing futura deve citar somente Knowledge publica/autorizada e nunca usar corpus documental ou draft como fonte de verdade.

## Contratos futuros recomendados
- `external_channel_threads`
- `external_channel_messages`
- `ticket_channel_links`
- `rpc_channel_ingest_message`
- `rpc_channel_link_thread_to_ticket`
- `vw_support_ticket_channel_threads`
- `vw_customer_portal_channel_threads`, se o portal precisar mostrar origem/conversa.
- `vw_ai_ticket_context`, apenas quando houver governanca de IA aprovada.

## Bloqueios explicitos
- Sem WhatsApp real neste momento.
- Sem email threading real neste momento.
- Sem chatbot ou IA neste momento.
- Sem notificacao externa falsa.
- Sem canal anonimo criando ticket sem tenant resolvido.
- Sem frontend inferindo permissao, SLA, status ou roteamento.

## Criterios para iniciar Omni Inbox
Antes de implementar Omni Inbox, devem existir:
- modelo de thread/canal aprovado;
- resolucao segura de tenant;
- segregacao de payload bruto;
- RLS e grants de thread;
- audit trail de ingestao;
- politica de retencao;
- contratos de visualizacao por papel;
- testes de cross-tenant e vazamento.
