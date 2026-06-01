# Operational Control Plane V1 - Auditoria e Proposta

Data: 2026-05-25
Branch auditada: `codex/p4-true-support-visual-refactor`
Escopo: auditoria e planejamento. Nenhuma implementacao realizada.

## Resumo executivo

O Genius Support OS ja possui uma base operacional consistente para suporte, portal do cliente, Knowledge, engenharia operacional, acoes internas, perfis de cliente, RLS, views/RPCs e auditoria. O proximo bloco estrutural deve ser o **Operational Control Plane V1**, uma camada governada de operacao interna que organiza colaboradores, areas, produtos, planos, responsabilidades, carteira de clientes, tarefas, projetos e handoffs entre areas.

A recomendacao e iniciar pelo dominio interno minimo: areas internas, colaboradores, memberships, papeis, produtos comercializados e vinculos cliente-produto-responsavel. Sem isso, novas telas de CS, financeiro, engenharia de produto ou tarefas correm o risco de virar CRM generico, Trello generico ou dashboards sem contrato operacional.

O Control Plane deve preservar as regras ja consolidadas:

- backend como source of truth;
- frontend apenas por views/read models e RPCs;
- `tenant_id` sempre que o dado for operacional de cliente;
- separacao entre cliente B2B, contato do cliente, colaborador interno, suporte, engenharia e area interna;
- ticket nao vira backlog tecnico diretamente;
- toda mutacao futura precisa de RPC, RLS/grants, auditoria e evento quando aplicavel.

## Escopo e premissas

Esta auditoria nao autoriza migration, tela, mock, backend ou alteracao de contrato. O resultado esperado e um mapa de dominio, riscos e roadmap para aprovacao antes de implementacao.

O Operational Control Plane V1 deve organizar "da porta para dentro":

- areas internas;
- colaboradores;
- papeis e permissoes;
- vinculo colaborador-area;
- vinculo colaborador-papel;
- vinculo area-produto;
- produtos comercializados;
- planos, modulos e features;
- clientes B2B vinculados a produtos;
- responsaveis internos por cliente;
- acionamentos internos entre areas;
- tarefas e projetos operacionais futuros.

## O que ja existe

### Identidade, acesso e tenancy

Ja existem bases reutilizaveis:

- `profiles`;
- `user_global_roles`;
- `tenants`;
- `tenant_memberships`;
- `tenant_contacts`;
- roles globais e roles de tenant;
- memberships de organizacao em Knowledge/multi-brand;
- rotas pos-login por perfil em `AUTH_CONTEXT_STRATEGY.md`.

Esses contratos resolvem autenticacao, papel global, acesso de cliente e membros de tenant. Eles nao devem ser duplicados como "usuarios internos" paralelos.

### Customer Account Profile

Ja existe uma base relevante para contexto de cliente:

- `customer_account_profiles`;
- `customer_account_integrations`;
- `customer_account_features`;
- `customer_account_customizations`;
- `customer_account_alerts`;
- views admin/support de perfil, features, alertas, integracoes e contexto;
- RPCs admin para atualizar perfil, integracoes, customizacoes, alertas e feature flags.

Esse dominio deve ser reaproveitado para leitura de contexto por Suporte, CS e Financeiro, mas nao deve ser expandido para virar catalogo de produtos, contratos financeiros ou carteira de CS sem novos contratos explicitos.

### Suporte

Ja existe o workspace operacional de suporte:

- fila de tickets;
- detalhe do ticket;
- timeline;
- mensagens publicas;
- notas internas;
- classificacao;
- SLA;
- intake;
- anexos/evidencias;
- Knowledge linking;
- entrega via portal;
- acionamentos internos;
- handoff para engenharia operacional.

As views e RPCs principais ja seguem o padrao backend-first. O suporte deve continuar como cockpit de atendimento diario, nao como CRM amplo.

### Internal Actions

Ja existem entidades de area-alvo e acionamento interno:

- `internal_action_target_areas`;
- `internal_area_memberships`;
- `internal_actions`;
- `internal_action_updates`;
- `internal_action_evidence_links`;
- fila por area;
- detalhe por area;
- timeline por area;
- RPCs de criacao, atribuicao, comentario, status, retorno ao suporte e fechamento.

Esse dominio e a base mais proxima do futuro fluxo area-area. Ele ainda precisa ser conectado a um cadastro mais completo de areas internas, produtos responsaveis e colaboradores.

### Engenharia operacional

Ja existem:

- `engineering_work_items`;
- `engineering_ticket_links`;
- `engineering_work_item_updates`;
- fila de engenharia;
- detalhe tecnico;
- retorno ao suporte.

Esse dominio cobre engenharia operacional originada de tickets. Ele nao deve ser confundido com backlog de produto, sprint planning ou User Stories.

### Knowledge, Portal, Communication e AI readiness

Ja existem:

- Knowledge com public/internal/restricted/draft/review/published;
- portal do cliente com tickets, timeline, evidencias e artigos autorizados;
- Public Help published/public;
- governanca de canais e delivery;
- readiness AI-native human-governed, sem IA real.

Esses dominios devem permanecer separados do Control Plane, mas consumirao permissao, produto, plano, feature e responsabilidade interna quando o catalogo existir.

## O que falta

Faltam contratos canonicos para:

- colaborador interno como entidade operacional alem de `profile`;
- area interna completa, com ownership, status, tipo, escopo e hierarquia leve;
- membership colaborador-area com papel operacional;
- vinculo area-produto;
- catalogo de produtos comercializados;
- planos, modulos, features e limites operacionais;
- assinatura/contratacao cliente-produto-plano;
- responsaveis internos por cliente, por produto e por funcao;
- workspace proprio de Customer Success;
- dominio financeiro operacional;
- health score e sinais de risco;
- tarefas operacionais com Kanban/lista;
- projetos operacionais;
- entidade intermediaria para converter ticket em demanda de produto;
- auditoria e eventos especificos para mudancas de ownership, produto, plano, tarefa, projeto e risco.

## Workspaces por papel

| Papel | Destino pos-login sugerido | Cockpit principal | Acoes do dia a dia | Dados que precisa visualizar | Dados que pode editar | Limites de permissao | Relacao com tickets, clientes, produtos e areas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Admin | `/admin` ou futuro `/admin/operations` | Governanca operacional | Cadastrar areas, colaboradores, produtos, planos, permissoes, clientes, responsaveis e feature flags | Areas, usuarios, roles, produtos, planos, tenants, auditoria, readiness | Configuracoes governadas via RPC admin | Nao deve atuar como suporte nem burlar RLS; acesso sensivel auditado | Define a estrutura usada por todos os outros workspaces |
| Suporte tecnico | `/support/queue` | Fila operacional e tratativa | Triar, responder, classificar, acionar areas, vincular Knowledge, pedir engenharia | Tickets, timeline, cliente, SLA, Knowledge autorizado, dependencias internas | Mutacoes de ticket permitidas por RPC; mensagens, notas, classificacao, acionamentos | Nao ve financeiro sensivel; nao altera produto/plano/permissao | Opera tickets conectados a clientes, produtos, areas e handoffs |
| Customer Success | Futuro `/cs/portfolio` | Carteira de clientes | Gerir health score, follow-ups, reunioes, projetos, plano de acao, riscos e expansao | Clientes, contratos/produtos permitidos, tickets agregados, projetos, tarefas, sinais de risco | Tarefas, follow-ups, projetos de CS, planos de acao e notas de relacionamento | Nao deve virar suporte paralelo; nao ve dados financeiros sensiveis sem permissao | Conecta cliente, produto, suporte, projetos e riscos |
| Engenharia | Atual `/engineering`; futuro `/engineering/product-demands` | Fila tecnica e demandas de produto | Responder demandas tecnicas de suporte; no futuro, qualificar demanda de produto | Work items, evidencias tecnicas, links de ticket, demandas intermediarias | Updates tecnicos, status tecnico, ownership tecnico | Nao conversa diretamente com cliente; ticket nao vira backlog sem entidade intermediaria | Apoia suporte e, no futuro, produto/desenvolvimento via demanda auditavel |
| Financeiro | Futuro `/finance` | Cockpit financeiro operacional | Acompanhar contratos, recebimentos, pendencias e alertas que impactam atendimento | Cliente, contrato, produto/plano, status financeiro permitido, pendencias | Alertas financeiros, status operacional financeiro, notas autorizadas | Dados sensiveis exigem permissao, auditoria e mascaramento | Informa suporte/CS sobre bloqueios ou riscos financeiros sem expor detalhe indevido |
| Gestores/Auditoria | Futuro `/governance` ou `/admin/system` | Visao de controle e risco | Revisar auditoria, SLAs, handoffs, permissoes, produtividade e riscos | Logs, eventos, indicadores, politicas, permissoes, historico de decisoes | Preferencialmente leitura; acoes de governanca separadas e auditadas | Nao executa operacao diaria sem papel operacional | Observa todos os dominios por contratos de auditoria, nao por acesso bruto |

## Admin Workspace

O Admin deve evoluir para area de governanca operacional, nao apenas configuracao tecnica.

Capacidades futuras:

- cadastro de areas internas;
- cadastro e governanca de colaboradores;
- vinculo colaborador-area;
- vinculo colaborador-papel;
- vinculo area-produto;
- governanca de permissoes;
- produtos comercializados;
- planos, modulos e features;
- clientes B2B vinculados a produtos/planos;
- responsaveis internos por cliente;
- auditabilidade de alteracoes operacionais.

O Admin nao deve conter botoes que ativem provider externo, IA real, integracao externa ou regra sem contrato backend.

## Suporte Workspace

O suporte deve permanecer como cockpit diario de atendimento:

- fila operacional;
- detalhe de ticket;
- conversa/timeline;
- composer de resposta publica e nota interna;
- classificacao;
- evidencias;
- Knowledge linking;
- acionamentos internos;
- contexto do cliente B2B;
- handoff para engenharia, CS ou financeiro quando existir contrato;
- retorno estruturado das areas internas para a timeline do ticket.

Kanban/lista de tarefas pode existir para suporte apenas se estiver conectado a ticket, cliente, area, prioridade, prazo e responsavel. Nao deve virar uma lista generica de afazeres.

## Customer Success Workspace

CS deve ter area propria, nao copia do suporte.

Capacidades candidatas:

- carteira de clientes;
- Health Score;
- proximos contatos;
- follow-ups;
- reunioes de resultado;
- projetos por cliente;
- plano de acao;
- Kanban/lista de tarefas;
- contratos/produtos usados;
- riscos, expansao e sinais de atencao;
- conexao com tickets, projetos e Customer Account Profile.

CS deve visualizar tickets agregados e sinais de atendimento, mas nao substituir a tratativa de suporte. Mutacoes de CS precisam de contratos proprios e auditoria.

## Engenharia Workspace

### A. Engenharia operacional de suporte

Ja existe base para:

- demandas tecnicas originadas de tickets;
- fila tecnica;
- status tecnico;
- retorno ao suporte;
- evidencias;
- ownership.

Este fluxo deve continuar separado da conversa com cliente. Engenharia retorna para suporte; suporte decide como comunicar.

### B. Produto e desenvolvimento futuro

O produto futuro pode cobrir:

- demandas de produto;
- User Stories;
- melhorias solicitadas por clientes;
- bugs estruturais;
- planejamento futuro de sprint;
- Kanban e lista;
- conversao controlada de ticket de melhoria em demanda de produto.

Regra estrutural: ticket nao deve virar backlog tecnico diretamente. Deve existir entidade intermediaria auditavel, por exemplo `product_demand_intakes`, com link opcional para ticket, cliente, produto, evidencias, criterio de aceite, prioridade, status e decisao humana.

## Financeiro Workspace

O financeiro futuro deve cobrir:

- contratos de clientes;
- status de recebimento;
- dados cadastrais/comerciais relevantes;
- pendencias financeiras;
- relacao cliente-contrato-produto-plano;
- alertas financeiros que impactam suporte/CS;
- cockpit financeiro operacional.

Dados financeiros sensiveis nao devem aparecer para suporte, CS ou portal sem contrato de permissao, mascaramento e auditoria. Para suporte, o ideal e expor apenas sinais operacionais autorizados, como "pendencia financeira impacta atendimento", sem detalhes sensiveis.

## Produtos, planos, modulos e features

O repositorio ja cita `Genius Returns`, `After Sale`, product lines e features por cliente. Falta um catalogo canonico.

Dominio candidato:

- produtos comercializados: `Genius Returns`, `After Sale`, produtos futuros;
- planos;
- modulos;
- features habilitadas;
- limites operacionais;
- vinculo cliente-produto;
- vinculo produto-area responsavel;
- impacto no suporte, CS, financeiro e portal cliente.

O catalogo deve evitar strings soltas no frontend. Produto/plano/feature deve ser lido por view e alterado por RPC admin/governance.

## Kanban e tarefas

O dominio futuro de tarefas deve servir a operacao B2B real, nao ser Trello generico.

Campos candidatos:

- visualizacao Kanban e lista;
- responsavel;
- area;
- cliente relacionado;
- ticket relacionado, quando existir;
- projeto relacionado, quando existir;
- produto relacionado, quando existir;
- prazo;
- status;
- prioridade;
- historico;
- origem;
- eventos/auditoria.

O mesmo dominio pode atender CS, suporte, engenharia e financeiro, desde que os tipos, permissoes e vinculos sejam explicitos.

## Projetos operacionais

Projetos devem ser dominio transversal para:

- implantacao;
- integracao;
- migracao;
- rollout;
- melhoria;
- incidente;
- projeto estrategico;
- projeto de CS.

Projetos devem poder se conectar a:

- cliente B2B;
- produto;
- tickets;
- tarefas;
- areas internas;
- responsaveis;
- milestones;
- riscos;
- timeline.

Projeto nao deve substituir ticket, tarefa ou demanda de produto. Ele agrega trabalho operacional com marcos, riscos e ownership.

## Riscos arquiteturais

- Duplicar `profiles` criando "colaboradores" sem ligacao canonica com auth.
- Misturar contato de cliente com colaborador interno.
- Misturar tenant membership de cliente com membership de area interna.
- Usar `customer_account_features` como catalogo de produto completo.
- Transformar support ticket em backlog de engenharia ou produto diretamente.
- Acoplar internal action como mensagem solta de ticket.
- Expor dados financeiros sensiveis para suporte/portal.
- Criar permissoes no frontend em vez de RLS/views/RPCs.
- Criar workspaces como dashboards decorativos sem contratos operacionais.
- Criar Kanban generico desconectado de cliente, ticket, projeto e area.
- Criar UI antes de aprovar catalogo, ownership e fronteiras de dominio.

## Entidades candidatas

### Fundacao interna

- `internal_collaborator_profiles`: extensao operacional de `profiles`, nao substituto de auth.
- `internal_areas`: cadastro canonico de areas internas.
- `internal_area_memberships_v2` ou evolucao da tabela atual: papel, status, escopo e auditabilidade.
- `internal_area_product_ownerships`: relacao area-produto.
- `internal_collaborator_role_assignments`: se `user_global_roles` nao for suficiente para papeis operacionais granulares.

### Produtos e contratacao

- `product_catalog_items`;
- `product_plans`;
- `product_modules`;
- `product_features`;
- `product_plan_features`;
- `tenant_product_subscriptions`;
- `tenant_product_limits`;
- `tenant_feature_entitlements`.

### Cliente, carteira e ownership

- `customer_account_ownerships`;
- `customer_success_portfolios`;
- `customer_health_scores`;
- `customer_health_signals`;
- `customer_followups`;
- `customer_success_meetings`;
- `customer_action_plans`.

### Tarefas e projetos

- `operational_tasks`;
- `operational_task_events`;
- `operational_task_links`;
- `operational_projects`;
- `operational_project_milestones`;
- `operational_project_risks`;
- `operational_project_links`;
- `operational_project_events`.

### Engenharia de produto futura

- `product_demand_intakes`;
- `product_demand_ticket_links`;
- `product_demand_events`;
- `product_demand_decisions`;
- `product_demand_story_links`, somente quando houver modulo de produto/sprint aprovado.

### Financeiro

- `customer_contracts`;
- `customer_contract_product_lines`;
- `customer_receivable_status_snapshots`;
- `customer_financial_alerts`;
- `finance_operational_notes`, com permissao restrita e auditoria.

## Views candidatas

- `vw_admin_internal_areas`;
- `vw_admin_internal_collaborators`;
- `vw_admin_internal_area_memberships`;
- `vw_admin_area_product_ownerships`;
- `vw_admin_product_catalog`;
- `vw_admin_product_plans`;
- `vw_admin_product_modules`;
- `vw_admin_product_features`;
- `vw_admin_tenant_product_subscriptions`;
- `vw_support_customer_operational_context`;
- `vw_support_ticket_handoff_readiness`;
- `vw_cs_customer_portfolio`;
- `vw_cs_customer_health_overview`;
- `vw_cs_customer_followups`;
- `vw_engineering_support_work_queue`;
- `vw_engineering_product_demand_queue`;
- `vw_finance_customer_contracts`;
- `vw_finance_customer_alerts`;
- `vw_operational_tasks_by_workspace`;
- `vw_operational_projects_by_workspace`;
- `vw_governance_operational_audit_summary`.

## RPCs candidatas

### Admin/Governanca

- `rpc_admin_create_internal_area`;
- `rpc_admin_update_internal_area`;
- `rpc_admin_assign_collaborator_to_area`;
- `rpc_admin_update_area_membership_status`;
- `rpc_admin_assign_area_to_product`;
- `rpc_admin_create_product`;
- `rpc_admin_update_product`;
- `rpc_admin_create_product_plan`;
- `rpc_admin_update_product_plan`;
- `rpc_admin_set_plan_feature`;
- `rpc_admin_assign_product_to_tenant`;
- `rpc_admin_assign_customer_owner`.

### CS

- `rpc_cs_create_followup`;
- `rpc_cs_update_followup_status`;
- `rpc_cs_record_customer_meeting`;
- `rpc_cs_update_health_signal`;
- `rpc_cs_create_customer_action_plan`;
- `rpc_cs_update_customer_action_plan_status`.

### Tarefas e projetos

- `rpc_create_operational_task`;
- `rpc_update_operational_task_status`;
- `rpc_assign_operational_task`;
- `rpc_link_operational_task`;
- `rpc_create_operational_project`;
- `rpc_update_operational_project_status`;
- `rpc_add_project_milestone`;
- `rpc_add_project_risk`;
- `rpc_link_project_entity`.

### Engenharia de produto

- `rpc_create_product_demand_from_ticket`;
- `rpc_qualify_product_demand`;
- `rpc_reject_product_demand`;
- `rpc_link_product_demand_to_story`, somente apos modulo de produto aprovado.

### Financeiro

- `rpc_finance_update_contract_operational_status`;
- `rpc_finance_create_customer_alert`;
- `rpc_finance_resolve_customer_alert`;
- `rpc_finance_add_restricted_note`.

## Permissoes/RLS

Diretrizes:

- `platform_admin`: leitura/escrita governada de configuracoes, produtos, areas, colaboradores e ownerships.
- Suporte: leitura de contexto operacional necessario ao ticket; escrita somente de acoes de suporte por RPC.
- CS: leitura de carteira, cliente, produto, health e tickets agregados; escrita de follow-ups, tarefas, projetos de CS e planos de acao.
- Engenharia: leitura/escrita apenas em work items tecnicos ou demandas de produto aprovadas para engenharia.
- Financeiro: leitura/escrita de contratos, pendencias e alertas financeiros conforme permissao; exposicao resumida para suporte/CS.
- Gestores/Auditoria: leitura por views agregadas e auditadas, sem acesso bruto por padrao.
- Customer user/manager: sem acesso a Control Plane interno.
- Public anon: sem alteracao.

Todo dado operacional de cliente deve carregar `tenant_id` ou link equivalente a tenant/cliente. Todo dado interno global deve evitar `tenant_id` falso.

## Impacto nas telas existentes

- Admin: deve ganhar, em fase futura, governanca de areas, colaboradores, produtos, planos, features e ownerships.
- Support: passa a consumir contexto mais rico de produto, plano, responsavel, areas e handoffs, sem virar CRM.
- Customer Account: deve consumir produto/plano/ownership como contratos canonicos, nao como texto livre.
- Internal Actions: deve usar areas canonicas e memberships consolidados.
- Engineering: deve manter engenharia operacional e ganhar, no futuro, demanda de produto intermediaria.
- Portal: deve continuar vendo apenas conteudo customer-facing autorizado por tenant/produto/feature.
- CS: novo workspace proprio.
- Financeiro: novo workspace proprio.
- Public Help: sem impacto direto.

## Design e Impeccable

Qualquer nova interface futura deve:

- seguir o Genius Support OS Design System V3;
- revisar documentos de design antes de implementar;
- usar Impeccable quando houver criacao ou refatoracao de UI;
- antes de criar tela nova, pesquisar as skills disponiveis do Impeccable e escolher a skill adequada para construcao completa da interface;
- complementar com audit, layout, polish, harden, critique, clarify ou distill conforme necessidade;
- respeitar blueprints aprovados;
- evitar tela generica, CRM generico, dashboard decorativo e cardizacao sem funcao operacional.

Hierarquia recomendada para UI futura:

1. objetivo operacional real da tela;
2. blueprint aprovado;
3. screen spec;
4. Design System V3;
5. contratos reais;
6. implementacao antiga.

## Backlog faseado e roadmap

### Fase 0 - Aprovacao arquitetural

- Aprovar este desenho de dominio.
- Atualizar docs canonicos.
- Definir nomes finais de entidades e fronteiras.

### Fase 1 - Internal Areas & Collaborators

- Cadastro canonico de areas internas.
- Perfil operacional de colaborador.
- Membership colaborador-area.
- Papel operacional por area.
- Auditoria de mudancas.

### Fase 2 - Product Catalog & Plans

- Produtos: `Genius Returns`, `After Sale`, futuros.
- Planos, modulos, features e limites.
- Area responsavel por produto.
- Views admin/support/CS.

### Fase 3 - Cliente B2B conectado a produto e responsaveis

- Cliente-produto-plano.
- Responsaveis internos por cliente/produto.
- Customer portfolio base.
- Impacto controlado no Customer Account Profile.

### Fase 4 - Role-Based Workspaces

- Admin Workspace.
- Suporte Workspace aprimorado.
- CS Workspace.
- Finance Workspace.
- Engineering Product Demand Workspace.
- Governance/Audit Workspace, se aprovado.

### Fase 5 - Customer Success Workspace

- Carteira.
- Health Score.
- Follow-ups.
- Reunioes.
- Projetos de CS.
- Plano de acao.
- Customer Portfolio Management.

### Fase 6 - Finance Workspace

- Contratos.
- Recebimentos/status operacional.
- Alertas financeiros.
- Permissoes e mascaramento.
- Relacao cliente-contrato-produto-plano.

### Fase 7 - Engineering Product Demand Workspace

- Entidade intermediaria ticket-demanda.
- User Stories futuras.
- Bugs estruturais.
- Melhorias solicitadas por clientes.
- Decisoes de produto auditadas.

### Fase 8 - Operational Tasks/Kanban

- Kanban e lista por workspace.
- Responsaveis, prazos, status, prioridade.
- Links para cliente, ticket, projeto e produto.
- Historico.

### Fase 9 - Operational Projects

- Projetos de implantacao, integracao, migracao, rollout, melhoria, incidente, CS e estrategia.
- Milestones, riscos, timeline e areas responsaveis.

### Fase 10 - UI roadmap com Design System + Impeccable

- Roadmap visual por workspace.
- Blueprints antes de tela.
- Auditoria Impeccable antes/depois.
- Validacao de rotas com dados reais/fixture.

Itens explicitamente incluidos no roadmap:

- Operational Control Plane V1;
- Internal Areas & Collaborators;
- Product Catalog & Plans;
- Role-Based Workspaces;
- CS Workspace;
- Finance Workspace;
- Engineering Product Demand Workspace;
- Operational Tasks/Kanban;
- Operational Projects;
- Customer Health Score;
- Customer Portfolio Management;
- Internal Actions Between Areas;
- Roadmap de UI com Design System + Impeccable.

## Documentacao a atualizar apos aprovacao

Depois da aprovacao da arquitetura, atualizar:

- `docs/PROJECT_STATE.md`;
- `docs/ROADMAP_BUILDOUT_V3.md`;
- `docs/PRODUCT_VISION.md`, se a visao operacional mudar;
- `docs/ARCHITECTURE_RULES.md`, se houver nova regra estrutural;
- `docs/VIEW_RPC_CONTRACTS.md`, quando existirem novos contratos;
- `docs/AUTH_CONTEXT_STRATEGY.md`, se houver novos papeis/permissoes;
- `docs/CUSTOMER_ACCOUNT_PROFILE_SPEC.md`;
- `docs/SUPPORT_WORKFLOW.md`;
- `docs/ENGINEERING_WORKSPACE_OPERATIONAL_CORE_V3.md`;
- `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md` ou specs de tela, se houver mudanca visual;
- specs futuras de CS, Financeiro, Produtos, Tarefas e Projetos.

## Recomendacao final

Recomendo aprovar o Operational Control Plane V1 como fundacao backend-first antes de qualquer nova UI ampla. A primeira implementacao deve ser pequena e estrutural: areas internas, colaboradores, memberships e catalogo de produtos/planos. Em seguida, conectar clientes a produtos e responsaveis. So depois disso vale abrir CS Workspace, Finance Workspace, tarefas, projetos e engenharia de produto.

Essa ordem reduz duplicacao, evita dashboards genericos e preserva os boundaries ja conquistados no MVP.

## Arquivos consultados

- `docs/PROJECT_STATE.md`;
- `docs/PRODUCT_VISION.md`;
- `docs/ARCHITECTURE_RULES.md`;
- `docs/VIEW_RPC_CONTRACTS.md`;
- `docs/AUTH_CONTEXT_STRATEGY.md`;
- `docs/ROADMAP_BUILDOUT_V3.md`;
- `docs/SUPPORT_WORKFLOW.md`;
- `docs/SUPPORT_WORKSPACE_ARCHITECTURE_SPEC.md`;
- `docs/CUSTOMER_ACCOUNT_PROFILE_SPEC.md`;
- `docs/ENGINEERING_WORKSPACE_OPERATIONAL_CORE_V3.md`;
- `docs/INTERNAL_DOCUMENTATION_AREAS_CHECKPOINT_V1.md`;
- `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md`;
- `supabase/migrations/*`;
- `packages/contracts/src/*`;
- `apps/web/src/features/support/*`;
- `apps/web/src/features/admin/*`;
- `apps/web/src/features/tenants/*`.

## Nenhuma implementacao realizada

Nao houve:

- alteracao de frontend;
- alteracao de backend;
- migration;
- alteracao Supabase;
- contrato novo;
- mock;
- tela nova;
- deploy;
- uso de dados reais.

O worktree ja estava sujo por alteracoes visuais anteriores na branch atual; esta auditoria apenas adiciona este relatorio de planejamento.
