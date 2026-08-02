# Especificação — Suporte e Conversas V1

Status: tickets disponíveis; conversas ainda não conectadas ao Analytics.

## Separação de domínios

- Tickets são casos operacionais e continuam no contrato atual de
  `rpc_analytics_cs_snapshot` e nas views `vw_analytics_cs_*`.
- Conversas são threads/mensagens de canais e não devem ser contadas como
  tickets sem uma regra de correlação explícita.
- Customer Success não pode usar nenhum desses dois conjuntos como substituto
  de seu contrato de carteira.

## Ticket V1 existente

O contrato atual cobre total, abertos, encerrados, taxa encerrada, status e
tendências. SLA existe em dados sincronizados, mas a métrica não está publicada
no Analytics V1. Status desconhecido não é convertido em encerrado.

## Conversas — contrato proposto

Campos mínimos: `source_system`, `channel_id`, `thread_id`, `message_id`,
`actor_type`, `occurred_at`, `direction`, `status`, `assigned_to`, `tenant_id`,
`quality_status` e referência opcional a ticket. A ingestão precisa ser
idempotente, paginada, auditável e com retenção definida.

Métricas candidatas: conversas abertas, primeira resposta, tempo até resposta,
tempo até resolução quando houver correlação, backlog por canal e volume por
responsável. Cada uma exige janela, timezone, unidade e denominador explícitos.

## Dependência externa

A API de Conversations do HubSpot permite trabalhar com inboxes, canais,
threads, mensagens e atores; a leitura exige escopos de conversas apropriados e
custom channels têm requisitos próprios. A implementação deve confirmar os
escopos e a disponibilidade no portal antes de criar migration ou sync:
[Conversations API](https://developers.hubspot.com/docs/api-reference/latest/conversations/guide)
e [scopes de desenvolvimento](https://developers.hubspot.com/docs/apps/developer-platform/build-apps/authentication/scopes).

## Critério de aceite

Nenhuma métrica de conversa entra no Dashboard até existir read model com
tenant/RLS/permissão/auditoria, cursor de ingestão, deduplicação e teste de
isolamento. Enquanto isso, a ausência é documentada como indisponível.
