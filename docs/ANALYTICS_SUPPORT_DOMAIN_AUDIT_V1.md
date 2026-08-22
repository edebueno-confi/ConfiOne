# Auditoria do domínio de Suporte V1

## Estado

- **Task:** `SUPPORT-DOMAIN-AUDIT-2026-08-21`
- **Tipo:** descoberta e fundação documental
- **Estado:** `DISCOVERY_COMPLETE / NOT_PUBLISHED`
- **Data:** 2026-08-21
- **Implementador:** Forge
- **Reviewer ativo:** Sentinel
- **Escopo:** fila, tickets, mensagens, eventos, conversas, chat, SLA,
  aging, prioridade, responsáveis, tenant, permissões, proveniência e
  frescor.

Este documento registra o contrato observável no checkout local. Ele não cria
um contrato novo e não autoriza UI, cálculo, ingestão, mutation ou publicação.
Quando uma capacidade aparece no código, isso é evidência de existência local,
não prova de integração externa ou de cobertura completa dos dados.

## Veredito executivo

O ConfiOne possui um contrato operacional local de tickets: `public.tickets`,
mensagens, eventos, atribuições, views de fila/detalhe/timeline e RPCs
governadas. A fila é filtrada server-side, tenant-aware e expõe status,
prioridade, severidade, categoria, motivo operacional, SLA e timestamps.

Tickets, conversas e chat não são o mesmo objeto:

- um ticket é o work item operacional local;
- mensagens e eventos formam uma timeline vinculada ao ticket, não uma entidade
  de conversa independente;
- `conversation_type_key` é classificação do ticket, não histórico de thread;
- `ticket_source = chat` existe como origem/classificação, mas a fundação de
  canais marca chat, e-mail e API como futuros para resposta direta;
- a especificação existente de Conversations API confirma uma capacidade
  oficial de leitura de inboxes, canais, threads, mensagens e atores, mas não
  há read model local nem ingestão executável dessa fonte neste lote.

O contrato analítico de Suporte é separado do Workspace local. A RPC
`rpc_analytics_support_kpis_v2` lê `hubspot_tickets` e read models analíticos,
usa `hs_created_at`, `resolved_at`, `last_activity_at` e `synced_at`, e não
deve ser descrita como uma simples agregação de `public.tickets`.

Não há uma única semântica universal de “fechado”: a fila local usa estado
operacional e expõe `closed_at`, enquanto os KPIs de HubSpot usam coortes,
campos de resolução e estágio atual conforme o indicador. Qualquer interface
futura deve mostrar a fonte e a data considerada junto do valor.

## Precedência e mapa de evidências

Código executável, migrations, views, RPCs, políticas e testes locais foram
tratados como evidência primária. Documentos foram usados para reconciliação e
para registrar limites, sem substituir os contratos executáveis.

| Área | Fonte local | Evidência observada |
| --- | --- | --- |
| Ticket operacional | `supabase/migrations/20260429225342_phase2_ticketing_core_backend_contracts.sql` | enums de status/prioridade/severidade/origem; `public.tickets`; mensagens, atribuições e eventos; views e RPCs de ticketing |
| Workspace de Suporte | `supabase/migrations/20260504004500_phase6_1_support_workspace_read_models.sql` e `supabase/migrations/20260723183054_support_ticket_queue_single_pass_hardening.sql` | fila, detalhe, timeline e customer context com filtro de acesso por tenant |
| Fila paginada | `supabase/migrations/20260723200500_support_ticket_queue_server_pagination_v1.sql` | filtros server-side, contagens, máximo de 50 itens e ordenação determinística |
| SLA e classificação | `supabase/migrations/20260509001100_ticket_classification_and_sla_governance_v3.sql` e `supabase/migrations/20260509042343_tenant_support_policy_and_sla_automation_v3.sql` | categorias, motivos, políticas, datas de vencimento, status de SLA e calendário por tenant |
| Canais | `supabase/migrations/20260523231636_ticket_intake_sources_communication_foundation.sql` | origem, canal, modo de resposta e indisponibilidade de e-mail/chat/API |
| Tipo de conversa | `supabase/migrations/20260716170000_settings_conversation_types_v1.sql` e `supabase/migrations/20260717080000_tickets_conversation_type_link_v1.sql` | catálogo de tipos e vínculo opcional no ticket |
| Conversas externas | `docs/specs/analytics-support-conversations-v1.md` | Conversations API oficial, threads, mensagens, atores, paginação e associação opcional com tickets; capacidade documentada, sem read model local |
| KPIs analíticos | `supabase/migrations/20260808160000_support_kpis_activity_coverage.sql` | read model HubSpot, cobertura, coortes, atividade, aging e histórico de backlog |
| Consumidor web | `apps/web/src/features/support/support-api.ts` | frontend lê RPCs/views; o mapeamento não calcula fila, SLA ou permissões localmente |
| Cobertura de testes | `supabase/tests/005_phase2_ticketing_core.sql`, `017_phase6_1_support_workspace_read_models.sql`, `023_support_ticket_operational_flow.sql`, `026_ticket_classification_and_sla_governance.sql`, `027_tenant_support_policy_and_sla_automation.sql`, `041_ticket_intake_sources_communication_foundation.sql`, `049_customer_support_loop_e2e.sql`, `073_support_pagination_and_customer_relationship_contract.sql` | contratos de ticketing, acesso, classificação, SLA, canais e paginação são cobertos por testes versionados; esta auditoria não reexecuta pgTAP |

## Objetos e semânticas

| Conceito | Contrato real | O que pode ser afirmado | O que não pode ser afirmado |
| --- | --- | --- | --- |
| Ticket | `public.tickets` e views/RPCs de Support Workspace | work item local com tenant, requester, título, status, prioridade, severidade, responsável e datas | que representa toda conversa externa ou todo canal integrado |
| Mensagem | `public.ticket_messages` | conteúdo vinculado a ticket, visibilidade interna/customer e `created_at` | que é uma thread de chat independente |
| Evento | `public.ticket_events` | mudança ou ocorrência na timeline, com `occurred_at`, ator e visibilidade | que toda atividade externa foi ingerida |
| Atribuição | `public.ticket_assignments` | histórico de responsável e ator | que o owner é a mesma coisa que participante da conversa |
| Tipo de conversa | `tickets.conversation_type_key` + catálogo | classificação operacional, como dúvida, incidente ou melhoria | que existe um objeto/conversa com mensagens próprias |
| Chat | `ticket_source`, canal e regras de resposta | origem/classificação local; resposta direta marcada futura/indisponível | que há integração de chat ou histórico externo consultável |
| Conversa externa | Conversations API oficial | capacidade upstream documentada para inbox, canal, thread, mensagem e ator, com associação a ticket quando a fonte fornecer | que existe read model local, escopo confirmado no portal ou ingestão completa |
| Analytics Support | `rpc_analytics_support_kpis_v2` e `hubspot_tickets` | KPIs com cobertura, coorte, atividade e frescor do read model HubSpot | que os números são contagem direta da fila local |

## Datas, períodos e timezone

### Support Workspace local

| Campo | Semântica observada |
| --- | --- |
| `created_at` | criação do ticket e base operacional de idade do item |
| `updated_at` | última atualização relevante do ticket; também participa da ordenação da fila |
| `resolved_at` | momento de resolução quando preenchido |
| `closed_at` | fechamento formal; o contrato de ticket exige coerência com status `closed` e `close_reason` |
| `occurred_at` | momento cronológico de evento na timeline |
| `ticket_messages.created_at` | momento de criação da mensagem; alimenta a timeline e `last_message_at` derivado |
| `first_response_due_at` / `resolution_due_at` | prazos derivados da política de SLA e do `tickets.created_at` |

A fila paginada não recebe `from`/`to`. Ela representa posição corrente e
ordena por `updated_at desc`, depois `created_at desc` e `id desc`. O escopo
`open` exclui status `resolved`, `closed` e `cancelled`; o escopo `closed`
considera esses três estados. Portanto, “aberto no período” não pode ser
inferido dessa RPC.

O calendário de negócio é cadastrado por tenant e possui timezone, horas
semanais e feriados. A aplicação observada de prazo usa a criação do ticket e
minutos da política. A auditoria não encontrou contrato suficiente para
afirmar, sem teste dedicado, que todos os prazos já respeitam horas úteis e
feriados. Isso é uma pendência de verificação, não uma autorização para
recalcular SLA localmente.

### Analytics Support baseado em HubSpot

| Campo/base | Uso documentado no contrato analítico |
| --- | --- |
| `hs_created_at` | coorte de tickets criados e base de aging/backlog |
| `resolved_at` | coorte de resolução e tempo de resolução quando disponível |
| `last_activity_at` | cobertura de atividade, estagnação e aging operacional |
| `ticket_first_response_at` / `first_response_hours` | primeira resposta e cobertura de FRT |
| estágio atual | estado aberto/fechado da fila analítica conforme metadados do pipeline |
| `synced_at` | frescor máximo do read model HubSpot |
| `analytics_kpi_daily_snapshot` | histórico de backlog quando há série suficiente; caso contrário `awaiting_history` |

Os parâmetros `p_from` e `p_to` não transformam todos os indicadores em uma
mesma coorte. A implementação usa a base apropriada por KPI: criação,
resolução, primeira resposta, atividade, estado aberto atual ou snapshot
histórico. A documentação de KPI deve permanecer a referência de cada campo.
Não combinar `closed_at` do ticket local com a coorte HubSpot sem declarar a
fonte e a regra do indicador.

O timezone do Support Workspace tem configuração por calendário de negócio,
com fallback local registrado em `America/Sao_Paulo`. O contrato analítico
expõe período e frescor, mas não autoriza assumir timezone de negócio diferente
do que a fonte efetivamente persistir.

## Fila, prioridade, status e aging

O contrato server-side aceita status, prioridade, severidade, tenant,
responsável, não atribuído, categoria, busca, escopo e filtros de inbox. A
busca percorre identificador, título, tenant, categoria, responsável e label
de SLA. O limite máximo é 50 por página; total e contagens por escopo/filtro
voltam no mesmo contrato.

Prioridade (`low`, `normal`, `high`, `urgent`) e severidade (`low`, `medium`,
`high`, `critical`) são dimensões diferentes. `high_attention` combina
prioridade urgente, severidade crítica ou SLA `at_risk`/`breached`; não é uma
prioridade nova.

Status local inclui `new`, `triage`, `waiting_customer`, `waiting_support`,
`waiting_engineering`, `in_progress`, `resolved`, `closed` e `cancelled`.
Indicadores de espera são derivados do status atual. Aging local pode ser
calculado a partir de `created_at` apenas se um contrato futuro definir
janela, timezone e população; a fila, por si só, publica idade implícita do
item e não uma série temporal.

No analytics HubSpot, o aging e a estagnação usam `hs_created_at` e
`last_activity_at`, respectivamente. Ausência de `last_activity_at`, de
histórico, de resolução ou de SLA deve permanecer como estado de cobertura
(`unavailable`, `partial` ou `awaiting_history`), nunca como zero.

## SLA e estados de ausência

O domínio local possui políticas que combinam tenant, categoria, prioridade e
severidade, além de prazos de primeira resposta e resolução. O status de SLA
observado é `unavailable`, `on_track`, `at_risk`, `breached` ou `complete`.
Sem data de vencimento, o status é `unavailable`; itens resolvidos, fechados ou
cancelados podem ser `complete`. A própria view registra que essa referência
é governança interna e não promessa pública automática.

No analytics, cobertura incompleta é explicitada no payload e nos warnings.
Backlog histórico fica `awaiting_history` quando a série diária não é
suficiente. Não existe base para preencher lacunas com zero ou para declarar
que o SLA local e o SLA do HubSpot têm a mesma política.

## Tenant, permissões, proveniência e frescor

- O ticket, a fila, o detalhe e a timeline carregam `tenant_id` e passam pelo
  gate `app_private.can_access_support_workspace`. O gate considera
  `platform_admin` ou membership ativa com papel interno de suporte.
- Views de suporte revogam leitura pública/anon e concedem leitura a
  `authenticated` e `service_role` conforme cada contrato. Conteúdo de
  timeline possui visibilidade interna/customer, e permissões de resposta são
  calculadas no backend.
- O frontend usa `rpc_support_ticket_queue_page` para a fila e views/RPCs para
  detalhe, timeline e ações. Não é fonte de verdade para status, SLA,
  prioridade, tenant ou autorização.
- A proveniência da superfície local é o banco/read model do ConfiOne. Ela não
  prova ingestão completa de e-mail, chat, API ou atividades externas.
- A proveniência do KPI analítico é HubSpot via `hubspot_tickets` e o read
  model de analytics. `synced_at`, `coverage`, `partial` e warnings são os
  sinais disponíveis de frescor e completude; não há SLA de frescor publicado
  nesta auditoria.

## Descoberta oficial de Conversations API

`docs/specs/analytics-support-conversations-v1.md` é uma fonte canônica local
para a descoberta da capacidade upstream. Ela aponta a [Conversations API
oficial](https://developers.hubspot.com/docs/api-reference/latest/conversations/guide)
e registra que a leitura exige `conversations.read`. A especificação também
define os objetos esperados para um próximo read model: inbox, canal, thread,
mensagem e ator; prevê associação opcional Conversation↔Ticket; exige
paginação por cursor; e recomenda registrar `portal_id`, `tenant_id`,
`source_system`, `occurred_at`, `cursor`, `ingested_at`, qualidade e auditoria.

O que está confirmado é a capacidade oficial documentada, não a configuração
do portal ConfiOne. Portal, plano, permissões efetivas, escopo concedido,
tenant mapping, rate limits, retenção histórica, truncamento de conteúdo e
frescor real ainda dependem de verificação autorizada. Não houve chamada
externa nem leitura de secret neste lote.

Assim, a matriz separa:

1. **capacidade oficial:** Conversations API documentada;
2. **escopo:** `conversations.read`, a confirmar no app/portal antes de usar;
3. **read model local:** inexistente no checkout auditado;
4. **ingestão:** `REQUIRES_NEW_INGESTION`, com paginação, idempotência,
   associação explícita e isolamento tenant-aware antes de qualquer KPI;
5. **limitação:** não classificada como `API_LIMITATION`, pois não há evidência
   de limitação estrutural da API.

## Matriz de disponibilidade

`AVAILABLE_NOW`, `REQUIRES_SCOPE`, `REQUIRES_NEW_INGESTION` e
`API_LIMITATION` classificam disponibilidade de capacidade ou integração. Uma
pendência que pertence ao contrato local, sem envolver API ou permissão, usa
`PENDING_LOCAL_CONTRACT_VALIDATION` para não fabricar um pedido de scope.

| Capacidade | Classificação | Evidência/limite |
| --- | --- | --- |
| Tickets locais com tenant, status, prioridade, severidade e responsável | `AVAILABLE_NOW` | tabela, views, RPCs e fila paginada locais |
| Fila atual com filtros, contagens e paginação | `AVAILABLE_NOW` | `rpc_support_ticket_queue_page`, máximo 50 |
| Detalhe e timeline vinculados ao ticket | `AVAILABLE_NOW` | views de detalhe/timeline e mensagens/eventos |
| Categorias, motivos operacionais e contexto de SLA | `AVAILABLE_NOW` | read models e RPCs autenticados |
| Tipo de conversa como classificação | `AVAILABLE_NOW` | catálogo e coluna opcional no ticket |
| Chat/e-mail/API como resposta direta integrada | `REQUIRES_NEW_INGESTION` | canal existe como classificação, mas resposta direta está futura/indisponível |
| Conversations API oficial para leitura | `REQUIRES_SCOPE` | capacidade documentada; `conversations.read` e permissões efetivas do portal ainda não confirmados |
| Read model local de threads/mensagens externas | `REQUIRES_NEW_INGESTION` | a especificação existe, mas não há tabela, view, RPC ou ingestão local |
| Aging e estagnação de tickets HubSpot | `AVAILABLE_NOW` | contrato analítico com cobertura e estados parciais; separado da fila local |
| Backlog histórico por dia | `REQUIRES_NEW_INGESTION` | depende de série suficiente em `analytics_kpi_daily_snapshot`; ausência fica `awaiting_history` |
| SLA local por horas úteis/feriados | `PENDING_LOCAL_CONTRACT_VALIDATION` | calendário existe, mas o comportamento completo precisa de teste/semântica local; não é ausência de scope |
| Permissão para futura fonte externa | `REQUIRES_SCOPE` | `conversations.read` e outros scopes efetivos precisam ser confirmados pela integração autorizada |
| Limitação estrutural de API | `API_LIMITATION` | não há evidência suficiente nesta auditoria para classificar uma capacidade assim |

## Lacunas e menor próximo lote

1. Confirmar, com teste de contrato local, se `apply_ticket_sla` deve respeitar
   horas úteis e feriados ou se a política atual é intencionalmente baseada em
   minutos corridos.
2. Se o produto precisar de chat, e-mail ou Conversations API integrada, abrir
   task própria para confirmar portal/plano/scopes, inventariar inbox, canal,
   thread, mensagem e ator, validar paginação/rate limits/histórico, e definir
   ingestão idempotente com tenant e associação explícita a tickets. Não usar
   `ticket_source` como prova de integração.
3. Se histórico de backlog for requisito, abrir task própria para definir
   retenção, granularidade, timezone, proveniência e cobertura do snapshot.
4. Se houver interface de metodologia, expor fonte, data considerada, período,
   timezone, cobertura e estado de ausência para cada KPI. Não implementar essa
   interface neste lote.

## Limites e não alterações

Este lote alterou somente documentação e handoff. Não foram alterados código de
produto, migrations, views, RPCs, RLS, contratos compartilhados, testes de
produto, integrações, secrets ou serviços externos. Nenhuma escrita remota foi
executada.
