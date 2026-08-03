# Matriz de capacidade do token HubSpot — discovery somente leitura

**Data da leitura:** 2026-08-02 (snapshot operacional; horários podem estar em UTC).
**Escopo:** discovery autorizado, sem escrita no HubSpot e sem alteração de configuração.
**Classificação:** `AVAILABLE`, `AVAILABLE_WITH_LIMITATIONS`, `MISSING_SCOPE`,
`PRODUCT_NOT_AVAILABLE`, `ENDPOINT_NOT_APPLICABLE`, `NOT_TESTED`,
`ERROR_INCONCLUSIVE`.

## Evidência do resolvedor real do GSO

O preflight local `analytics-hubspot-preflight` foi executado com o contexto
administrativo autenticado e resolveu a credencial no servidor. O resultado
sanitizado foi:

| Verificação | Resultado |
| --- | --- |
| estado | `ready` |
| credencial configurada | sim, valor não retornado |
| endpoint alcançável | sim |
| resposta válida | sim |
| pipelines não arquivados | 35 (11 de deals, 24 de tickets) |
| catálogo local | 35/35 definições live presentes; 2 entradas locais adicionais de QA preservadas |
| escrita de dados externos | `false` |

Isso comprova a rota real de leitura do GSO, mas não comprova que todo escopo
de produto necessário para CS esteja concedido.

## Objetos e capacidades observados

| Área/API | Estado | Evidência | Limitação |
| --- | --- | --- | --- |
| Companies | `AVAILABLE` | leitura e busca totalizável | total é catálogo geral, não carteira CS |
| Deals | `AVAILABLE_WITH_LIMITATIONS` | busca, propriedades e pipelines | uso de pipeline precisa de regra de negócio aprovada |
| Tickets | `AVAILABLE_WITH_LIMITATIONS` | busca, propriedades e pipelines | nome do pipeline não prova domínio CS/Suporte |
| Contacts | `AVAILABLE` | leitura disponível no conector | não é denominador CS por si só |
| Calls, Tasks, Meetings, Emails, Notes | `AVAILABLE_WITH_LIMITATIONS` | totais agregados de leitura | associações e atribuição operacional ainda não foram fechadas |
| Owners | `ERROR_INCONCLUSIVE` | endpoint respondeu em páginas de amostra | paginação do conector retornou amostras repetidas; total global não foi afirmado |
| Properties/schema | `AVAILABLE_WITH_LIMITATIONS` | 510 Companies, 983 Deals, 1040 Tickets | inventário completo foi resumido; nenhuma propriedade foi escolhida como canônica |
| Conversations/inboxes/messages | `NOT_TESTED` / `PRODUCT_NOT_AVAILABLE` no conector atual | tipos não expostos pelo conector instalado | `source_type=CHAT` não prova thread/conversa |
| Feedback submissions/survey responses | `NOT_TESTED` / `PRODUCT_NOT_AVAILABLE` no conector atual | tipos não expostos pelo conector instalado | propriedades de CSAT/NPS/CES não substituem fonte de feedback |

## Escopo do código GSO auditado

O resolvedor server-side usa o RPC protegido
`rpc_service_get_managed_integration_secret`, com execução restrita ao
`service_role`, e não retorna a credencial ao frontend. O runner existente
implementa leitura de Companies, Deals, Tickets, owners, pipelines e
propriedades. Não há cliente GSO existente para Conversations, Inbox, Messages,
Feedback Submissions ou Survey Responses.

Nenhuma requisição `POST`, `PATCH`, `PUT` ou `DELETE` foi realizada neste
discovery. Nenhum token, cabeçalho de autenticação, registro individual ou dado
pessoal foi persistido.

## Referências oficiais

- Pipelines: https://developers.hubspot.com/docs/api-reference/latest/crm/pipelines/guide
- Properties: https://developers.hubspot.com/docs/api-reference/latest/crm/properties/guide
- CRM, busca e associações: https://developers.hubspot.com/docs/api-reference/latest/crm/understanding-the-crm
- Conversations: https://developers.hubspot.com/docs/api-reference/latest/conversations/guide
- Feedback submissions: https://developers.hubspot.com/docs/api-reference/crm-feedback-submissions-v3/guide

## Decisão pendente

O token é suficiente para o inventário CRM básico e para o preflight do GSO.
Ainda não há evidência para declarar uma integração de Conversas/Feedback
disponível. A definição do universo de Customer Success e a eventual ampliação
de escopo devem ser aprovadas antes de criar métricas ou alterar o sincronismo.
