# Engineering Workspace Operational Core V3

## Objetivo
Materializar o núcleo operacional do Engineering Workspace para demandas técnicas originadas de tickets, mantendo `ticket` e `engineering_work_item` como domínios separados e conectados apenas por `engineering_ticket_links`.

## Decisão de escopo
- O Engineering Workspace não é um Jira interno.
- Não há sprint, backlog de produto genérico, chat interno, notificação externa, IA ou upload/storage neste corte.
- O ticket continua sendo a source of truth da tratativa de suporte.
- A demanda técnica passa a ter workspace próprio, ownership técnico, status técnico, updates estruturados e retorno governado ao suporte.

## Auditoria inicial
- Já existiam `engineering_work_items` e `engineering_ticket_links` criados no lote de anexos/escalonamento.
- Já existiam os enums `engineering_work_item_type` e `engineering_work_item_status`.
- Já existiam `rpc_support_create_engineering_work_item_from_ticket`, `rpc_support_link_ticket_to_engineering_work_item` e `vw_support_ticket_engineering_links`.
- Já existiam roles globais `engineering_member` e `engineering_manager`.
- Faltavam read models dedicados para fila/detalhe de engenharia, entidade de updates técnicos, RPCs de ownership/status/retorno ao suporte e rota própria no frontend.

## Contratos criados

### Tabela
- `engineering_work_item_updates`
  - registra atualizações técnicas estruturadas;
  - usa `tenant_id` explícito;
  - referencia `engineering_work_items` por FK composta com tenant;
  - exige `created_by_user_id`;
  - não substitui `ticket_messages`.

### Enums
- `engineering_work_item_update_kind`
  - `progress_update`
  - `status_update`
  - `support_return`
- `engineering_work_item_status`
  - adicionado `returned_to_support`
- `ticket_event_type`
  - adicionado `engineering_update_added`
  - adicionado `engineering_status_updated`
  - adicionado `engineering_returned_to_support`

### Views
- `vw_engineering_work_items_queue`
- `vw_engineering_work_item_detail`
- `vw_engineering_work_item_ticket_links`
- `vw_engineering_work_item_updates`

### RPCs
- `rpc_engineering_assign_work_item`
- `rpc_engineering_unassign_work_item`
- `rpc_engineering_update_work_item_status`
- `rpc_engineering_add_work_item_update`
- `rpc_engineering_return_work_item_to_support`
- `rpc_engineering_link_existing_work_item_to_ticket`

## Regras de permissão
- `platform_admin` pode operar tudo.
- `engineering_member` e `engineering_manager` podem operar demandas técnicas do tenant onde possuem membership ativa.
- Suporte pode enxergar vínculos técnicos de tickets acessíveis pelo contrato de suporte, mas não altera work item técnico.
- Toda mutação exige actor ativo.
- Toda mutação exige `tenant_id` explícito.
- Cross-tenant é bloqueado no backend.
- DML direto por `authenticated` nas tabelas base permanece bloqueado.

## Auditoria e eventos
- Mudança de ownership, status, update técnico, retorno ao suporte e link técnico geram `audit_log`.
- Ações que impactam ticket vinculado geram `ticket_event`.
- O retorno estruturado ao suporte gera evento `engineering_returned_to_support` e move o ticket vinculado para `waiting_support` quando a transição é permitida.
- O retorno técnico fica disponível para o suporte como dado estruturado em `vw_support_ticket_engineering_links`, não como mensagem solta.

## Frontend
- Criada rota interna `/engineering`.
- Criada rota interna `/engineering/work-items/:workItemId`.
- A navegação do Support Workspace passou a incluir `Engenharia`.
- O workspace de engenharia lê apenas views/RPCs contratuais.
- A tela permite:
  - ver fila técnica;
  - filtrar por status e tipo;
  - abrir detalhe técnico;
  - assumir demanda;
  - remover responsável;
  - atualizar status técnico;
  - registrar update técnico;
  - devolver ao suporte com retorno estruturado.
- O ticket workspace passou a mostrar último retorno técnico e link para a demanda de engenharia quando houver work item vinculado.

## Ações bloqueadas
- Upload real de evidência continua bloqueado até existir bucket/policy/storage seguro.
- Categoria inicial de ticket continua sem contrato formal.
- Notificações externas continuam fora do escopo.
- Link de work item existente fica disponível apenas pelo RPC backend, sem UI dedicada neste corte.
- Suporte não altera work item técnico.

## Fixture QA
A fixture local foi expandida com:
- usuário `engineering_member`;
- work item técnico vinculado a ticket;
- atribuição técnica via RPC;
- atualização de status técnico;
- update técnico estruturado;
- cenários de ticket com e sem vínculo técnico.

## Testes
Cobertura adicionada em `supabase/tests/026_engineering_workspace_operational_core.sql`:
- leitura da fila técnica;
- leitura do detalhe técnico;
- isolamento cross-tenant;
- atribuição válida;
- atribuição inválida bloqueada;
- status válido;
- status inválido bloqueado;
- retorno estruturado com `audit_log`;
- retorno estruturado com `ticket_event`;
- leitura de vínculo técnico pelo suporte;
- suporte sem permissão de escrita em work item;
- DML direto bloqueado.

## Riscos restantes
- Ainda não existe upload/storage seguro para anexos reais.
- Ainda não existe SLA técnico ou categoria formal de ticket.
- Ainda não há notificações externas de retorno técnico.
- O modelo propositalmente não cobre gestão ampla de produto, sprint ou backlog técnico genérico.

## Próximo lote recomendado
`Secure Ticket Evidence Storage V3`: fechar bucket, policies, metadata, geração segura de URLs temporárias, limites de tipo/tamanho e UI de upload controlada por contrato real.
