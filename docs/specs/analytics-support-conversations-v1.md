# Especificação — Suporte, Tickets e Conversas V1

Status: tickets disponíveis no Dashboard; Conversations/Chat ainda não estão
conectados ao Analytics.

## Separação obrigatória

Tickets são casos operacionais. Conversas são threads e mensagens de canais.
Um ticket pode referenciar uma conversa, mas os conjuntos não podem ser
somados nem usados como proxy de Customer Success sem uma associação explícita.
O contrato deve preservar `source_type`, pipeline, estágio, prioridade,
responsável, timestamps, tenant, qualidade e auditoria.

## Ticket — catálogo e estado atual

Fonte atual: tabela sincronizada `hubspot_tickets`, contrato
`rpc_analytics_cs_snapshot` e views `vw_analytics_cs_*`. O Dashboard atual
publica apenas o que o read model retorna; status desconhecido não é convertido
em encerrado.

| Métrica | Pergunta / fórmula | Granularidade e período | Campos/associações necessários | Disponibilidade atual | Nulo, segurança e owner |
|---|---|---|---|---|---|
| Tickets criados | Quantos tickets entraram no período? `count(created_at na janela)` | Ticket, pipeline e tenant; janela selecionada | `ticket_id`, `created_at`, `pipeline_id`, `source_type` | Disponível no snapshot atual | Timestamp ausente fica fora com qualidade; RLS/Analytics; Support |
| Tickets abertos | Quantos estão em estágio não encerrado? `count(status aberto)` | Ticket; fotografia | pipeline/stage e catálogo de estágios | Disponível; aberto não depende de rótulo visual desconhecido | Estágio desconhecido fica qualidade parcial; Support |
| Tickets encerrados | Quantos foram encerrados no período? `count(closed_at na janela)` | Ticket; janela | `closed_at`, estágio terminal governado | Disponível | Fechamento ausente não é encerrado; RLS; Support |
| Taxa encerrada | `encerrados / tickets criados`, denominador explícito | Pipeline e período | mesmas fontes + denominador | Disponível quando denominador > 0 | Denominador zero/ausente vira indisponível, nunca 0%; Support |
| Backlog | Quantos tickets abertos aguardam resolução? `count(abertos)` | Pipeline, prioridade e owner; fotografia | status/stage, priority, owner_id | Parcial no contrato atual | Owner nulo é `Sem responsável`; tenant/RLS; Support |
| Alta prioridade aberta | `count(abertos com prioridade governada)` | Ticket e empresa; fotografia | priority, status, Company↔Ticket | Disponível para ticket; associação de empresa depende da sincronização | Sem prioridade não classificar; Support/CS |
| SLA de primeira resposta | `tickets com first_response_at no SLA / tickets elegíveis` | Ticket, pipeline e janela | `first_response_at`, SLA alvo/versionado, created_at | Dados de SLA existem na carga, métrica não publicada no Analytics V1 | Sem SLA/primeira resposta fica parcial; exige política e auditoria; Support |
| SLA de encerramento | `tickets encerrados no prazo / tickets elegíveis` | Ticket e período de encerramento | `closed_at`, due_at/SLA alvo, estágio terminal | Não publicado | Não estimar pelo tempo visual; Support |
| Volume por canal/origem | `count por source_type` | Canal/origem e período | `source_type` sincronizado; catálogo de valores | Parcial: by-source do snapshot | source_type nulo vira qualidade parcial; Support |
| Satisfação de ticket | média/mediana de resposta válida pós-atendimento | Ticket e período | feedback_id, score, submitted_at, ticket_id | Não confirmado no read model atual | Sem resposta fora do denominador; exige escopo/API e consentimento; Support |

## Conversas/Chat — contrato proposto e disponibilidade

Não foram encontrados read models locais publicados para inbox, thread ou
mensagem. A implementação futura deverá confirmar produto, portal, plano e
escopos antes de criar migration ou sync. A API oficial descreve inboxes,
canais, threads, mensagens e atores na
[Conversations API](https://developers.hubspot.com/docs/api-reference/latest/conversations/guide);
os escopos devem ser confirmados na documentação oficial de
[scopes](https://developers.hubspot.com/docs/apps/developer-platform/build-apps/authentication/scopes).

| Área | Métrica | Definição | Campos/associações | Hoje | `source_type` / dependência adicional |
|---|---|---|---|---|---|
| Conversas | Conversas abertas | threads não encerradas no período | inbox_id, channel_id, thread_id, status, occurred_at | Indisponível; não há tabela/read model | `hubspot_conversations`; API Conversations + escopo de leitura |
| Conversas | Conversas criadas | `count(thread_id distintos criados na janela)` | thread_id, created_at, tenant | Indisponível | mesma API; paginação/cursor |
| Conversas | Tempo até primeira resposta | `first_agent_at - first_customer_at` | message_id, actor_type, direction, occurred_at, thread_id | Indisponível | mensagens/atores; deduplicação |
| Conversas | Tempo até resolução | `resolved_at - opened_at` para threads com estado resolvido | thread status/timestamps | Indisponível | pode exigir correlação com ticket; não inferir |
| Canais | Volume por canal | `count(messages/threads por channel_id)` | channel_id, channel_type, source_type | Indisponível | catálogo de canais + API |
| Canais | Backlog por canal | threads abertas por canal | thread status, channel_id | Indisponível | API + read model |
| SLA | Primeira resposta no SLA | `threads elegíveis dentro da meta versionada / elegíveis` | SLA alvo, timezone, first response | Indisponível | política interna + mensagens |
| SLA | Resolução no SLA | `threads resolvidas dentro da meta / elegíveis` | resolved_at, SLA alvo | Indisponível | política + estado de thread |
| Satisfação | CSAT de conversa | média/mediana de respostas válidas | feedback_id, score, submitted_at, thread_id | Indisponível | API/feedback habilitado no portal |
| Satisfação | Taxa de resposta | `respostas CSAT / convites enviados` | invite_id, response_id, timestamps | Indisponível | endpoint/produto de feedback a confirmar |

## Ingestão, contrato e segurança futuros

Campos mínimos: `tenant_id`, `source_system`, `source_type`, `portal_id`,
`inbox_id`, `channel_id`, `thread_id`, `message_id`, `actor_type`, `direction`,
`occurred_at`, `status`, `assigned_to`, `ticket_id` opcional, `quality_status`,
`cursor`, `ingested_at` e versão do contrato.

- ingestão server-side, idempotente e paginada por cursor;
- deduplicação por portal + thread/message ID e auditoria de cada lote;
- retenção e minimização de conteúdo definidas antes da carga;
- associações Conversation↔Ticket somente quando vindas da fonte, nunca por
  proximidade temporal ou texto;
- views/RPCs com tenant, RLS, permissão, `observed_at`, frescor e estados
  `not_configured`, `partial`, `stale`, `empty`, `fresh`, `error`;
- frontend sem chamada HubSpot direta e sem fallback para tickets.

## Critérios de aceite

Tickets continuam separados de Conversas no schema, read model, filtros,
cards, séries e exportação. Conversas só entram no Dashboard após escopos e
plano confirmados, carga paginada real, fixture de deduplicação, pgTAP de
isolamento cross-tenant e captura visual dos estados vazio/erro/fresh.
