# OPERATIONAL_CONTROL_PLANE_V1.md

## Status

Plano canonico aprovado conceitualmente em 2026-05-26 e consolidado na Fase 0 documental em 2026-05-27.

Esta fase nao implementa migration, backend, frontend, tela, mock, seed, Supabase, contrato novo ou comportamento de produto. O documento transforma a auditoria `docs/reports/OPERATIONAL_CONTROL_PLANE_V1_AUDITORIA_E_PROPOSTA_2026-05-25.md` em plano oficial de produto/arquitetura para implementacao futura.

## Objetivo

O Operational Control Plane V1 organiza a operacao interna "da porta para dentro" para que Genius Support OS deixe de ser apenas um conjunto de workspaces e passe a ter governanca operacional canonica sobre:

- areas internas;
- colaboradores;
- papeis e permissoes;
- vinculo colaborador-area;
- vinculo area-produto;
- produtos comercializados;
- planos, modulos e features;
- clientes B2B vinculados a produtos;
- responsaveis internos por cliente;
- acionamentos internos entre areas;
- tarefas e projetos operacionais futuros;
- roteamento pos-login por papel e workspace.

## Premissas obrigatorias

- Backend continua sendo source of truth.
- Frontend le por views/read models e escreve por RPCs.
- Toda futura mutacao relevante exige RLS/grants, auditoria e evento quando aplicavel.
- `tenant_id` e obrigatorio quando o dado pertence a operacao de um cliente B2B.
- Dado interno global, dado por organizacao, dado por tenant/cliente e dado por produto devem permanecer separados.
- O Control Plane nao cria permissao implícita por UI, texto, email, localStorage ou mock.
- Nenhuma entidade operacional futura deve expor segredo, token, storage path, payload bruto ou dado sensivel sem contrato de permissao e auditoria.

## Principios de modelagem do Control Plane

- Colaborador interno e `profiles` + extensao operacional. Uma futura entidade como `internal_collaborator_profiles` so pode estender dados operacionais do `profile`; ela nao pode duplicar identidade, auth, email ou usuario.
- Area interna nao e tenant. Area representa capacidade operacional interna; tenant continua representando cliente B2B operacional.
- Produto comercializado nao e feature flag solta. Produtos, planos, modulos, features e limites precisam de catalogo canonico proprio; `customer_account_features` nao deve virar catalogo oficial.
- Cliente B2B continua sendo tenant operacional. O vinculo cliente-produto deve apontar para `tenant_id`, mas nao substituir `tenants`.
- Contato cliente nao e colaborador. `tenant_contacts` e usuarios customer-facing continuam separados de colaboradores internos.
- Tenant membership nao e area membership. `tenant_memberships` governa acesso ao cliente/tenant; membership de area governa participacao interna em area operacional.
- Support agent e engineering member sao papeis/contexts operacionais, nao novas identidades.
- Acionamento interno nao e mensagem solta. Ele deve permanecer subfluxo estruturado com owner, area, status, updates, retorno ao suporte, eventos e auditoria.
- Tarefa nao e ticket. Tarefa operacional futura deve ter dominio proprio, responsavel, status, prazo, origem, vinculos e historico.
- Projeto nao e ticket. Projeto operacional precisa de entidade propria, milestones, riscos, areas e timeline.
- Demanda de produto nao e ticket. Ticket pode originar uma demanda, mas nao vira backlog tecnico diretamente.
- User Story futura nao nasce direto do ticket sem intake/qualificacao. Deve existir entidade intermediaria auditavel para demanda de produto, com decisao humana e criterios de aceite antes de qualquer backlog.
- Nao criar tabela `v2` como atalho. Se `internal_area_memberships` ja cobre a semantica futura, ela deve ser evoluida; se nao cobre, deve haver justificativa tecnica para renomear, estender ou criar nova entidade com plano de migracao.

## Fronteiras de dominio

| Fronteira | Regra |
| --- | --- |
| Identidade | `profiles` continua sendo a identidade base do usuario autenticado. Extensoes futuras adicionam contexto operacional, nao identidade paralela. |
| Cliente B2B | `tenants` continua sendo a ancora operacional do cliente. |
| Contato cliente | `tenant_contacts` e usuarios `customer_user`/`customer_manager` continuam customer-facing e nao se misturam com colaboradores internos. |
| Area interna | Area representa funcao/capacidade interna como Suporte N1, CS, Financeiro, Produto, Desenvolvimento, Infraestrutura ou Juridico. |
| Membership de area | Deve relacionar colaborador/profile a area, com papel operacional, status e auditoria. |
| Produto comercializado | Deve representar `Genius Returns`, `After Sale` e produtos futuros como catalogo canonico, nao como string solta. |
| Plano/modulo/feature | Deve representar oferta comercial/operacional e limites, separado de feature flags pontuais por conta. |
| Ticket | Continua sendo tratativa de suporte e comunicacao com cliente. |
| Acionamento interno | Continua sendo subfluxo area-area vinculado a ticket ou contexto operacional, sem virar mensagem solta. |
| Engenharia operacional | Continua atendendo demandas tecnicas originadas de tickets via work item. |
| Demanda de produto | Deve nascer em entidade intermediaria antes de virar historia, bug estrutural ou item de roadmap. |
| Tarefa/Kanban | Deve servir a operacao B2B real, com vinculos e auditoria, nao virar Trello generico. |
| Projeto | Deve organizar implantacao, integracao, migracao, rollout, melhoria, incidente, CS ou estrategia. |

## Reaproveitamento obrigatorio do que ja existe

### `profiles`

Reaproveitar como identidade base. Nao criar novo usuario interno paralelo. Dados futuros de colaborador devem referenciar `profile_id`/`user_id` e conter apenas atributos operacionais, como area principal, cargo funcional, disponibilidade, senioridade, canais internos e metadados de ownership.

### `internal_area_memberships`

Auditar antes de qualquer schema change. A decisao futura deve ser uma destas:

1. evoluir a tabela atual, se ela ja representa membership colaborador-area de forma correta;
2. renomear com migration planejada, se o nome atual for adequado apenas ao subdominio de acionamentos e nao ao Control Plane;
3. criar entidade nova apenas se houver diferenca semantica real, documentada e testada.

Criar `internal_area_memberships_v2` sem justificativa tecnica esta proibido.

### `customer_account_features`

Reaproveitar apenas como estado/feature operacional de uma conta quando fizer sentido. Nao usar como catalogo canonico de produtos, planos, modulos ou features comercializadas.

### `engineering_work_items`

Reaproveitar para engenharia operacional originada de suporte. Nao usar como backlog de produto futuro. Demandas de produto precisam de entidade intermediaria propria.

## Entidades candidatas futuras

| Entidade candidata | Escopo | Observacao |
| --- | --- | --- |
| `internal_areas` | Catalogo canonico de areas internas | Pode evoluir/absorver `internal_action_target_areas` se a semantica for confirmada. |
| `internal_area_memberships` evoluida | Vinculo colaborador-area | Preferir evolucao da tabela existente se atender ao dominio. |
| `internal_collaborator_profiles` | Extensao operacional de `profiles` | Nao duplica identidade; apenas atributos internos de colaborador. |
| `commercial_products` | Produtos comercializados | `Genius Returns`, `After Sale` e produtos futuros. |
| `commercial_product_plans` | Planos | Oferta comercial/operacional por produto. |
| `commercial_product_modules` | Modulos | Modulos contrataveis/habilitaveis. |
| `commercial_product_features` | Features canonicas | Catalogo de capacidade, nao flag solta por conta. |
| `customer_product_subscriptions` | Cliente-produto-plano | Vinculo tenant-produto-plano com status e limites. |
| `customer_internal_owners` | Responsaveis internos por cliente | CS, suporte, financeiro, produto ou area responsavel. |
| `product_area_ownerships` | Area-produto | Define area dona/apoio por produto/modulo. |
| `product_demand_intakes` | Entidade intermediaria ticket-demanda | Qualifica pedido antes de backlog/US. |
| `operational_tasks` | Tarefas operacionais | Kanban/lista conectados a cliente, area, ticket, projeto e produto. |
| `operational_projects` | Projetos operacionais | Implantacao, integracao, rollout, melhoria, incidente e CS. |
| `customer_health_signals` | Health score e sinais | Sinais versionados e auditaveis, nao calculo livre no frontend. |

## Views candidatas

- `vw_admin_internal_areas`
- `vw_admin_internal_area_detail`
- `vw_admin_internal_area_memberships`
- `vw_admin_internal_collaborators`
- `vw_admin_commercial_products`
- `vw_admin_commercial_product_detail`
- `vw_admin_customer_product_subscriptions`
- `vw_support_customer_operational_ownership`
- `vw_cs_customer_portfolio`
- `vw_cs_customer_health_summary`
- `vw_finance_customer_contract_context`
- `vw_engineering_product_demand_queue`
- `vw_operational_tasks_board`
- `vw_operational_projects_list`
- `vw_governance_control_plane_audit_summary`

Cada view deve ser pequena, orientada a tela/fluxo e sem payload bruto sensivel.

## RPCs candidatas

- `rpc_admin_create_internal_area`
- `rpc_admin_update_internal_area`
- `rpc_admin_add_internal_area_member`
- `rpc_admin_update_internal_area_member`
- `rpc_admin_archive_internal_area_member`
- `rpc_admin_create_commercial_product`
- `rpc_admin_update_commercial_product`
- `rpc_admin_create_product_plan`
- `rpc_admin_update_product_plan`
- `rpc_admin_assign_product_area_owner`
- `rpc_admin_create_customer_product_subscription`
- `rpc_admin_update_customer_product_subscription`
- `rpc_admin_assign_customer_internal_owner`
- `rpc_support_create_product_demand_intake_from_ticket`
- `rpc_product_review_demand_intake`
- `rpc_create_operational_task`
- `rpc_update_operational_task_status`
- `rpc_create_operational_project`
- `rpc_update_operational_project_status`

RPCs futuras devem exigir ator ativo, motivo quando aplicavel, escopo explicito e audit trail.

## Permissoes e RLS

| Papel/contexto | Leitura candidata | Escrita candidata | Limite |
| --- | --- | --- | --- |
| `platform_admin` | Governanca ampla do Control Plane | Mutacoes administrativas via RPC | Sem bypass sem auditoria. |
| Suporte | Tickets, cliente, produto/plano permitido, dependencias internas | Mutacoes de suporte por RPC | Nao altera catalogo de produto, permissao ou financeiro sensivel. |
| CS | Carteira, health, projetos, tarefas e sinais autorizados | Follow-ups, tarefas e projetos de CS | Nao substitui suporte nem acessa financeiro sensivel sem permissao. |
| Engenharia | Work items, demandas tecnicas, demandas de produto qualificadas | Updates tecnicos e revisao tecnica | Nao conversa direto com cliente nem cria backlog direto de ticket. |
| Financeiro | Contratos/status financeiro permitidos | Alertas/status financeiro operacional | Dados sensiveis com mascaramento e auditoria. |
| Gestores/Auditoria | Resumos, eventos, riscos e trilhas | Preferencialmente leitura; mutacoes separadas | Sem payload bruto por padrao. |
| Customer-facing | Apenas dados do proprio tenant autorizados | Acoes customer-facing por RPC | Nao ve Control Plane interno. |

## Workspaces por papel e roteamento futuro

| Papel | Destino pos-login sugerido | Cockpit principal | Acoes do dia a dia | Dados que visualiza | Dados que edita | Limites |
| --- | --- | --- | --- | --- | --- | --- |
| Admin | `/admin` ou futuro `/admin/operations` | Governanca operacional | Areas, colaboradores, produtos, planos, permissoes, clientes e responsaveis | Areas, users, roles, produtos, tenants, auditoria | Configuracoes governadas por RPC | Nao vira operador de suporte; acesso sensivel auditado. |
| Suporte tecnico | `/support/queue` | Fila e tratativa | Triar, responder, classificar, acionar areas, vincular Knowledge | Tickets, timeline, cliente, SLA, Knowledge, dependencias | Mensagens, notas, classificacao, acionamentos | Nao altera produto/plano/permissao/financeiro sensivel. |
| Customer Success | Futuro `/cs/portfolio` | Carteira de clientes | Health, follow-ups, reunioes, projetos, plano de acao | Clientes, produtos usados, tickets agregados, projetos, riscos | Tarefas, follow-ups, planos e projetos de CS | Nao vira suporte paralelo. |
| Engenharia | `/engineering` e futuro `/engineering/product-demands` | Fila tecnica e demandas qualificadas | Ownership tecnico, updates, retorno ao suporte, revisao de demanda | Work items, evidencias, links de ticket, demandas | Updates/status tecnico e revisao de demanda | Ticket nao vira backlog sem intake. |
| Financeiro | Futuro `/finance` | Cockpit financeiro | Contratos, recebimentos, pendencias, alertas | Cliente, contrato, produto/plano, status autorizado | Alertas/status operacional financeiro | Dados sensiveis exigem permissao e mascaramento. |
| Gestores/Auditoria | Futuro `/governance` ou `/admin/system` | Controle e risco | Revisar auditoria, SLAs, permissoes, handoffs e riscos | Logs sanitizados, eventos, indicadores e politicas | Poucas acoes, sempre auditadas | Nao usa acesso bruto para operar. |

## Sequencia aprovada de implementacao futura

### Fase 1: Internal Areas & Collaborators

- Auditar `internal_action_target_areas` e `internal_area_memberships`.
- Definir se `internal_area_memberships` sera evoluida, renomeada ou separada.
- Criar/ajustar cadastro canonico de areas internas.
- Criar extensao operacional de colaborador baseada em `profiles`.
- Criar views/RPCs administrativas minimas com RLS, auditoria e eventos.

### Fase 2: Product Catalog & Plans

- Criar catalogo canonico de produtos comercializados.
- Modelar planos, modulos, features e limites operacionais.
- Evitar reaproveitar `customer_account_features` como catalogo.
- Conectar area responsavel por produto.

### Fase 3: Customer Product Subscriptions & Ownership

- Vincular `tenant` a produto/plano/modulos.
- Definir responsaveis internos por cliente/produto.
- Preparar Customer Portfolio Management.
- Expor apenas read models seguros para Suporte, CS e Financeiro.

### Fase 4: Internal Actions connected to canonical areas

- Conectar acionamentos internos ao catalogo canonico de areas.
- Preservar `internal_actions` como subfluxo estruturado.
- Nao converter acionamento em mensagem solta nem alterar `ticket.status` automaticamente.

### Fase 5: Role-Based routing and workspaces

- Atualizar roteamento pos-login por workspace autorizado.
- Garantir gates por view/RPC, nao por frontend.
- Planejar Admin, Suporte, CS, Financeiro, Engenharia e Auditoria como superficies distintas.

### Fase 6: CS Workspace

- Carteira de clientes.
- Health Score.
- Follow-ups.
- Reunioes de resultado.
- Projetos de CS.
- Plano de acao.
- Riscos, expansao e sinais de atencao.

### Fase 7: Finance Workspace

- Contratos de clientes.
- Status financeiro operacional.
- Pendencias e alertas.
- Relacao cliente-contrato-produto-plano.
- Mascaramento e auditoria para dados sensiveis.

### Fase 8: Engineering Product Demand Workspace

- Criar entidade intermediaria para demanda de produto.
- Qualificar melhoria/bug estrutural antes de backlog.
- Separar engenharia operacional de suporte e produto/desenvolvimento futuro.

### Fase 9: Operational Tasks/Kanban

- Tarefas com Kanban/lista.
- Responsavel, area, cliente, ticket/projeto/produto, prazo, status, prioridade e historico.
- Nao virar Trello generico.

### Fase 10: Operational Projects

- Projetos de implantacao, integracao, migracao, rollout, melhoria, incidente, CS e estrategia.
- Milestones, riscos, timeline, areas responsaveis e clientes/produtos relacionados.

### Fase 11: UI blueprints + Impeccable pass

- Criar blueprints por workspace antes de UI.
- Aplicar Genius Support OS Design System V3.
- Usar Impeccable para audit, layout, critique, polish, harden, clarify/adapt quando houver nova tela ou refatoracao.
- Evitar CRM generico, dashboard decorativo e UI sem contrato real.

## Impacto em telas existentes

- Admin: deve virar superficie de governanca operacional antes de criar CS/Financeiro amplos.
- Support: continua cockpit diario; passa a consumir produto, plano, ownership e areas canonicas quando existirem.
- Customer Account: deve receber contexto produto/plano/ownership por read models, sem virar catalogo.
- Internal Actions: deve ser conectado a areas canonicas, preservando status/updates/auditoria.
- Engineering: deve manter engenharia operacional de suporte separada de demandas de produto futuras.
- Portal/Public Help: nao recebem Control Plane interno; veem apenas dados customer-facing autorizados.

## Documentos a atualizar apos aprovacao de implementacao

- `docs/PROJECT_STATE.md`
- `docs/ROADMAP_BUILDOUT_V3.md`
- `docs/PRODUCT_VISION.md`
- `docs/ARCHITECTURE_RULES.md`, se houver nova regra estrutural
- `docs/VIEW_RPC_CONTRACTS.md`, quando existirem novos contratos
- `docs/AUTH_CONTEXT_STRATEGY.md`, quando houver novos papeis/rotas
- `docs/CUSTOMER_ACCOUNT_PROFILE_SPEC.md`
- `docs/SUPPORT_WORKFLOW.md`
- `docs/ENGINEERING_WORKSPACE_OPERATIONAL_CORE_V3.md`
- `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md`
- specs futuras de CS, Financeiro, Produtos, Tarefas e Projetos

## Recomendacao final

A primeira implementacao deve ser pequena e estrutural: **Fase 1 - Internal Areas & Collaborators**. Ela deve resolver o cadastro canonico de areas e colaboradores sem duplicar `profiles`, sem criar `internal_area_memberships_v2` por atalho e sem misturar area interna com tenant.

So depois devem vir Product Catalog & Plans, Customer Product Subscriptions & Ownership e a conexao governada de Internal Actions a areas canonicas. UI ampla de workspaces deve aguardar contratos backend aprovados e blueprints validados.
