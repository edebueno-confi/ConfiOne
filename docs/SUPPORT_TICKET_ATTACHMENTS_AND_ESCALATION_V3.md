# Support Ticket Attachments And Escalation V3

## Objetivo

Fechar o proximo bloco operacional do ticket workspace com dois contratos reais:

- leitura segura de evidencias/anexos do ticket
- handoff tecnico estruturado para engenharia

O lote nao publica arquivos, nao cria upload inseguro e nao transforma o ticket em backlog tecnico generico.

## Auditoria inicial

### O que ja existia

- `tickets`, `ticket_messages`, `ticket_events` e `audit.audit_logs`
- `ticket_attachments` como tabela base de metadata
- read models e RPCs do Support Workspace:
  - `vw_support_tickets_queue`
  - `vw_support_ticket_detail`
  - `vw_support_ticket_timeline`
  - `vw_support_ticket_timeline_recent`
  - `rpc_support_get_ticket_timeline`
  - `rpc_create_ticket`
  - RPCs de status, atribuicao, resposta publica, nota interna e fechamento/reabertura
- fixture QA do suporte com tickets, Knowledge vinculada e intake operacional

### O que faltava

- read model contratual para anexos do ticket sem expor bucket/path sensivel
- dominio proprio para handoff tecnico
- vinculo explicito `ticket -> engineering_work_item`
- RPC real para criar demanda tecnica a partir do ticket
- cobertura de testes para isolamento por tenant, evento e auditoria desse novo fluxo

### Riscos encontrados

- storage local/remoto ainda sem bucket/policies seguras para upload governado
- risco de expor `storage_object_path` ou URL direta se o frontend lesse a tabela base
- risco de acoplar engenharia dentro de `ticket_messages` como texto livre, sem ownership nem lifecycle

## Decisao sobre anexos e storage

Upload real nao foi habilitado neste lote.

Motivo:

- o projeto possui `ticket_attachments` e schema `storage`
- mas a auditoria nao encontrou bucket configurado nem policies seguras prontas para upload por tenant/ticket

Decisao aplicada:

- manter apenas leitura de metadata sanitizada por read model
- bloquear a UI de upload com copy honesta
- registrar a pendencia de storage seguro como lote tecnico proprio

## Contratos reaproveitados

- `ticket_attachments`
- `vw_support_tickets_queue`
- `vw_support_ticket_detail`
- `vw_support_ticket_timeline`
- `vw_support_ticket_timeline_recent`
- `rpc_support_get_ticket_timeline`
- `rpc_create_ticket`
- `audit.audit_logs`
- infraestrutura de `ticket_events`

## Contratos criados ou alterados

### Novo dominio tecnico

- `engineering_work_items`
- `engineering_ticket_links`

### Novos enums

- `engineering_work_item_type`
- `engineering_work_item_status`

### Novos helpers

- `app_private.can_access_ticket_engineering`
- `app_private.create_engineering_ticket_link`

### Novas views

- `vw_support_ticket_attachments`
- `vw_support_ticket_engineering_links`

### Novas RPCs

- `rpc_support_create_engineering_work_item_from_ticket`
- `rpc_support_link_ticket_to_engineering_work_item`

## Regras contratuais finais

### Anexos/evidencias

- leitura apenas por `vw_support_ticket_attachments`
- tenant do anexo precisa coincidir com tenant do ticket
- `storage_bucket` e `storage_object_path` nao sao expostos ao frontend
- `download_available` so fica `true` quando houver bucket e objeto resolvidos
- como nao existe storage seguro configurado, a UI apenas lista metadata e mostra bloqueio honesto para upload

### Handoff tecnico

- o ticket nao vira work item tecnico automaticamente
- a engenharia ganha entidade propria:
  - `engineering_work_items`
  - `engineering_ticket_links`
- o vinculo entre ticket e demanda tecnica e explicito, auditavel e isolado por tenant
- o handoff cria:
  - work item tecnico
  - link `ticket -> work item`
  - `ticket_event`
  - `audit_log`
- tickets fechados/cancelados nao aceitam novo handoff
- `work item status` e a fonte canonica do andamento tecnico; por isso nao foi criada RPC separada de status do link neste MVP

## Frontend

### `/support/tickets/:ticketId`

O workspace passou a mostrar:

- painel de anexos/evidencias com leitura real e sanitizada
- estado bloqueado honesto para upload
- lista real de demandas tecnicas vinculadas
- formulario real de handoff tecnico quando a RPC existe

Guardrails preservados:

- sem erro tecnico cru na interface
- sem URL/path sensivel
- sem scroll global
- sem scroll horizontal
- sem alterar thread/composer/status fora do necessario

## Permissoes, RLS e auditoria

- sem DML direto do frontend nas tabelas novas
- leitura por views filtradas com helper privado
- `authenticated` nao recebe acesso irrestrito a `engineering_work_items` nem `engineering_ticket_links`
- toda mutacao relevante gera:
  - `ticket_event`
  - `audit_log`
- cross-tenant bloqueado em leitura e escrita

## Acoes habilitadas

- listar anexos/evidencias do ticket por metadata sanitizada
- criar demanda tecnica a partir do ticket
- visualizar work items vinculados ao ticket

## Acoes bloqueadas

- upload real de arquivo
- remocao/arquivamento de anexo
- exposicao de bucket/path/URL sensivel
- handoff tecnico em ticket fora do tenant do caller
- handoff tecnico em ticket fechado/cancelado
- atualizacao arbitraria de status do link ticket-work item

## Fixture QA

Fixture local atualizada para cobrir:

- ticket com handoff tecnico existente
- ticket sem handoff tecnico
- usuario autorizado e nao autorizado
- dados suficientes para validar o workspace com e sem contexto tecnico

Nao foi criado fixture de upload real porque storage seguro nao existe neste corte.

## Validacoes executadas

- `npm run supabase:db:reset`
- `npm run supabase:test:db`
- `npm run supabase:lint:db`
- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`
- `npm run supabase:qa:local-support-fixture`

## Validacao visual

Viewport validado:

- `1440 x 900`

Telas verificadas:

- `/support/queue`
- `/support/tickets/:ticketId` com handoff existente
- `/support/tickets/:ticketId` com novo handoff criado via UI

Resultado:

- sem scroll global
- sem scroll horizontal
- scroll interno apenas nos containers operacionais do workspace
- sem regressao visual relevante observada

## Riscos restantes

- upload seguro ainda depende de bucket, policies e contrato proprio de storage
- engenharia ainda nao possui workspace dedicado; o ticket apenas registra e exibe o handoff
- categoria inicial do ticket continua fora deste lote
- notificacao externa continua fora do escopo

## Proximo lote recomendado

- `Engineering Workspace Operational Core V3`

Objetivo do proximo lote:

- dar superficie operacional propria para `engineering_work_items`
- fechar fila, detalhe, status e ownership tecnico sem empurrar isso para dentro do ticket workspace
