# Operational Control Plane V1 - Planning & Contract Audit

Data: 2026-06-01
Branch auditada: `codex/project-forensic-recovery-audit`
Base informada: commit `234196c`
Escopo: auditoria e planejamento. Este lote nao cria migration, schema, UI, contrato runtime ou feature.

## Resumo executivo

O produto ja possui fundacao relevante para o Operational Control Plane V1: identidade em `profiles`, clientes B2B em `tenants`, memberships de tenant, roles globais, Admin Console, Support Workspace, Customer Portal, Engineering Workspace, Internal Actions e perfil operacional de cliente.

A lacuna real nao e "criar tudo do zero". O proximo passo deve consolidar as entidades existentes em uma arquitetura de governanca operacional sem duplicar identidade, tenant, roles, memberships ou customer context. A maior area descoberta e o bloco comercial/operacional: catalogo de produtos comercializados, planos, modulos, features canonicas, assinatura cliente-produto-plano, ownership interno por cliente/produto, cockpits de CS e Financeiro, tarefas/Kanban, projetos operacionais e health score.

Recomendacao: iniciar por um lote estreito de contrato/read models para areas internas e colaboradores, reaproveitando `internal_action_target_areas`, `internal_area_memberships` e `profiles`, antes de criar catalogo comercial ou novas telas.

## Auditoria executada

Comandos e leituras principais:

- `git branch --show-current`
- `git status --short`
- `git log -3 --oneline`
- leitura de `README.md`, `package.json` e docs canonicos.
- auditoria de migrations em `supabase/migrations`.
- busca de contratos em `packages/contracts/src`.
- busca de rotas/gates em `apps/web/src/app/router.tsx`, `apps/web/src/features/auth/*`, `apps/web/src/features/navigation/*`.
- leitura de `docs/OPERATIONAL_CONTROL_PLANE_V1.md`.
- leitura de `docs/AUTH_CONTEXT_STRATEGY.md`.
- leitura de `docs/CUSTOMER_ACCOUNT_PROFILE_SPEC.md`.
- leitura de `docs/CUSTOMER_ACCOUNT_PROFILE_DATA_MODEL_REVIEW.md`.
- leitura de `docs/SUPPORT_WORKSPACE_ARCHITECTURE_SPEC.md`.
- leitura de `docs/ROADMAP_BUILDOUT_V3.md`.

## Estado atual

### Identidade, tenancy e admin

Existem como base canonica:

- `profiles`: identidade base de usuario autenticado.
- `user_global_roles`: papeis globais, incluindo `platform_admin`, suporte, engenharia, knowledge e auditoria.
- `tenants`: cliente B2B operacional.
- `tenant_memberships`: vinculo usuario-cliente e role customer/admin por tenant.
- `tenant_contacts`: contato cliente, separado de colaborador interno.
- `audit.audit_logs`: trilha auditavel de mutacoes.
- RPCs administrativas `rpc_admin_*` para tenants, contacts e memberships.
- `vw_admin_auth_context`, `vw_admin_access_*` e read models administrativos ja usados pelo frontend.

O redirect pos-login ja e orientado por contrato backend: admin vai para `/admin`, suporte para `/support/queue`, area interna para `/internal-actions`, engenharia para `/engineering`, customer-facing para `/portal`, e usuario sem workspace para `/access-denied`.

### Support Workspace

O suporte ja opera sobre contratos reais:

- `tickets`, `ticket_messages`, `ticket_assignments`, `ticket_events`, `ticket_attachments`.
- views como `vw_support_tickets_queue`, `vw_support_ticket_detail`, `vw_support_ticket_timeline`, `vw_support_customer_360`, `vw_support_customer_account_context`, `vw_support_assignable_agents`.
- RPCs como `rpc_create_ticket`, `rpc_update_ticket_status`, `rpc_assign_ticket`, `rpc_add_ticket_message`, `rpc_add_internal_ticket_note`.

O Support Workspace ja tem contexto de cliente, SLA, evidencias, Knowledge, conversa, classificacao, acionamentos internos e handoff tecnico. Nao deve virar cockpit generico de CS, Financeiro ou Produto.

### Areas internas e acionamentos

Ja existem:

- `internal_action_target_areas`: catalogo atual de areas acionaveis por internal actions, com chaves como `engineering`, `finance`, `customer_success`, `product`, `operations` e `other_internal`.
- `internal_area_memberships`: membership por `tenant_id`, `user_id`, `area_key`, role e status.
- `internal_actions`, `internal_action_updates`, `internal_action_evidence_links`.
- views de suporte, area e admin para internal actions.
- RPCs administrativas de membership e RPCs operacionais de acionamento.
- `vw_internal_action_area_auth_context` para autorizar workspace de area interna.

Essa base deve ser auditada antes de qualquer nova entidade `internal_areas`. O nome `internal_action_target_areas` ainda esta preso ao subdominio de acionamentos, mas a semantica ja se aproxima de um catalogo de areas internas.

### Engenharia

Ja existem:

- `engineering_work_items`
- `engineering_ticket_links`
- `engineering_work_item_updates`
- views de fila, detalhe, links e timeline
- RPCs de assignment, status, update, retorno ao suporte e link com tickets

Engenharia operacional esta ligada a suporte. Ela nao deve ser reaproveitada como backlog de produto ou user story sem uma entidade intermediaria de demanda qualificada.

### Customer Account Profile

Ja existem:

- `customer_account_profiles`
- `customer_account_integrations`
- `customer_account_features`
- `customer_account_customizations`
- `customer_account_alerts`
- views admin e support para contexto de cliente
- RPCs administrativas de upsert, archive e manutencao de perfil operacional

Esse conjunto representa estado operacional de conta. `customer_account_features` nao e catalogo canonico de produto, plano, modulo ou feature comercializada.

### Customer Portal e canais

O Portal ja possui gate customer-facing separado por `vw_customer_portal_auth_context`, preferencia de tenant ativo, session recovery e RPCs customer-facing. A feature `returns_portal` funciona como gate operacional de portal, mas nao substitui catalogo comercial.

Tambem existem bases de comunicacao e readiness AI-native com read models administrativos/suporte e auditoria, mas sem acao automatizada.

### Lacunas de workspace

Nao ha cockpit dedicado e contratado para:

- CS/carteira.
- Financeiro.
- Admin operacional de produtos/planos/assinaturas.
- Product demand intake.
- Operational tasks/Kanban.
- Operational projects.
- Health score e sinais de carteira.

Rotas e navegacao atuais tambem nao indicam `/cs`, `/finance`, `/admin/operations` ou `/governance` como superficies implementadas.

## Entidades existentes reutilizaveis

| Necessidade | Entidade existente | Como reutilizar | Nao fazer |
| --- | --- | --- | --- |
| Identidade de colaborador | `profiles` | usar como usuario interno base | criar tabela paralela de usuario |
| Papel global | `user_global_roles` | manter para papeis transversais | inferir permissao por UI/email |
| Cliente B2B | `tenants` | manter como ancora de cliente | criar `customers` concorrente |
| Acesso cliente | `tenant_memberships` | manter para customer/admin por tenant | misturar com area interna |
| Contato cliente | `tenant_contacts` | manter como contato customer-facing | tratar como colaborador interno |
| Area acionavel | `internal_action_target_areas` | candidato a catalogo inicial de areas | criar `internal_areas_v2` sem prova |
| Membership area | `internal_area_memberships` | usar/evoluir para colaborador-area | duplicar membership por area |
| Acionamento interno | `internal_actions` | manter como subfluxo estruturado | virar mensagem solta |
| Engenharia operacional | `engineering_work_items` | manter para work item tecnico | virar backlog de produto |
| Perfil operacional cliente | `customer_account_profiles` | enriquecer contexto cliente | substituir assinatura/produto |
| Features por conta | `customer_account_features` | usar como estado operacional por conta | usar como catalogo comercial |
| Auditoria | `audit.audit_logs` | manter trilha de mutacao | expor payload bruto por default |

## Lacunas reais

1. Catalogo comercial canonico: produtos, planos, modulos, features e limites.
2. Vinculo cliente-produto-plano: assinatura/contratacao por `tenant_id`, status, escopo e datas.
3. Ownership interno por cliente/produto: CS owner, suporte owner, financeiro owner, produto/area responsavel.
4. Area interna canonica: confirmar se `internal_action_target_areas` vira base canonica ou se precisa migrar para `internal_areas`.
5. Perfil operacional de colaborador: dados internos como senioridade, area principal, disponibilidade e canais, sem duplicar `profiles`.
6. Cockpit CS: carteira, riscos, follow-ups, projetos, health summary.
7. Cockpit Financeiro: contexto contratual/financeiro governado e mascarado.
8. Product demand intake: ponte auditavel entre ticket, suporte, engenharia e produto.
9. Tarefas operacionais/Kanban: entidade propria, nao ticket.
10. Projetos operacionais: implantacao, integracao, rollout, incidente, melhoria e CS.
11. Health score: sinais versionados e calculo governado no backend.

## Riscos de duplicacao

- Criar `users`, `collaborators` ou `employees` como identidade paralela a `profiles`.
- Criar `customers` paralelo a `tenants`.
- Criar `area_memberships_v2` sem confirmar se `internal_area_memberships` ja cobre a semantica.
- Usar `tenant_memberships` para membership de area interna.
- Usar `customer_account_features` como catalogo de features comercializadas.
- Usar `engineering_work_items` como backlog de produto.
- Tratar `internal_actions` como Kanban geral.
- Criar rotas CS/Financeiro com dados compostos no frontend antes de views/RPCs.
- Reaproveitar views internas no Portal ou expor notas/auditoria ao cliente.

## Proposta de arquitetura

### Camada 1: Identidade e autorizacao

Manter:

- `profiles` como identidade.
- `user_global_roles` para papeis globais.
- `tenant_memberships` para relacao usuario-cliente.
- `internal_area_memberships` para relacao colaborador-area, se a auditoria semantica confirmar.
- Auth contexts por view, sem decisao de permissao no frontend.

Qualquer nova role operacional deve nascer com matriz de permissao, RLS, grants, testes pgTAP e documentacao.

### Camada 2: Areas internas e colaboradores

Primeiro consolidar read models:

- `vw_admin_internal_areas`
- `vw_admin_internal_collaborators`
- `vw_admin_internal_area_memberships`
- `vw_internal_area_landing_context`

Essas views podem inicialmente ler de `internal_action_target_areas`, `internal_area_memberships` e `profiles`. Se a semantica exigir, uma migration posterior pode introduzir `internal_areas`, mas isso deve vir com plano de migracao, compatibilidade e testes.

### Camada 3: Catalogo comercial

Criar somente apos decisao de produto:

- `commercial_products`
- `commercial_product_plans`
- `commercial_product_modules`
- `commercial_product_features`
- `product_area_ownerships`

Esse catalogo deve ser separado de `customer_account_features`, que continua representando estado operacional por conta.

### Camada 4: Assinatura cliente-produto e ownership

Criar:

- `customer_product_subscriptions`
- `customer_internal_owners`

Essas entidades apontam para `tenants`, catalogo comercial e `profiles`/areas internas. Devem alimentar views para suporte, CS, financeiro e admin sem expor dados sensiveis indevidos.

### Camada 5: Execucao operacional

Manter:

- tickets para suporte.
- internal actions para acionamentos.
- engineering work items para trabalho tecnico originado de suporte.

Adicionar futuramente:

- `product_demand_intakes` para demanda de produto qualificada.
- `operational_tasks` para tarefas e Kanban.
- `operational_projects` para projetos operacionais.
- `customer_health_signals` para health score versionado.

### Camada 6: Cockpits e read models

Cada cockpit deve ler views pequenas, orientadas ao fluxo:

- Suporte: fila, cliente, SLA, evidencias, acionamentos.
- CS: carteira, health, riscos, follow-ups, projetos.
- Engenharia: work items, demandas qualificadas, evidencias tecnicas.
- Financeiro: contrato/status financeiro permitido, pendencias e alertas mascarados.
- Admin: governanca de areas, colaboradores, produtos, planos, clientes, ownership e auditoria.

Frontend nao deve montar permissao, score, status contratual ou ownership por composicao local.

## Fases recomendadas

### Fase 1: Internal Areas & Collaborators Contract Consolidation

- Confirmar semantica de `internal_action_target_areas` e `internal_area_memberships`.
- Criar read models administrativos de areas/colaboradores sobre entidades existentes.
- Adicionar contratos TypeScript correspondentes.
- Cobrir RLS/grants/pgTAP.
- Nao criar UI nova neste primeiro corte se o objetivo for reduzir risco.

### Fase 2: Commercial Product Catalog

- Modelar produtos, planos, modulos, features e ownership por area.
- Proibir reaproveitamento de `customer_account_features` como catalogo.
- Criar views/RPCs admin-only e auditoria.

### Fase 3: Customer Product Subscriptions & Internal Owners

- Vincular `tenant_id` a produto/plano.
- Definir CS owner, suporte owner, financeiro owner e area responsavel.
- Expor contexto seguro para suporte, CS e financeiro.

### Fase 4: Role-Based Landing Context V1

- Evoluir auth context para escolher cockpit por papel/ownership real.
- Manter gates por views/RPCs.
- Nao inferir destino por frontend.

### Fase 5: CS Portfolio Foundation

- Criar carteira CS, health summary inicial e follow-ups.
- Health score deve ser sinalizado/calculado pelo backend.

### Fase 6: Finance Operational Context

- Criar contexto financeiro governado.
- Aplicar mascaramento, escopo estrito e auditoria.

### Fase 7: Product Demand Intake

- Criar entidade intermediaria entre ticket e backlog/produto.
- Exigir decisao humana e criterios de aceite.

### Fase 8: Operational Tasks/Kanban

- Criar tarefa operacional com area, responsavel, tenant/produto/projeto/ticket opcionais, prazo, status e historico.
- Nao converter tickets diretamente em tarefas genericas sem origem auditavel.

### Fase 9: Operational Projects

- Criar projetos para implantacao, integracao, rollout, melhoria, incidente e CS.
- Conectar milestones, riscos, tarefas, clientes e produtos.

## Primeiro lote implementavel seguro

Nome recomendado: `OCP V1-A Internal Areas Contract Consolidation`.

Escopo:

- criar uma migration pequena apenas de read models, se aprovada no lote futuro;
- nao criar tabela nova no primeiro corte;
- criar `vw_admin_internal_areas` lendo `internal_action_target_areas`;
- criar `vw_admin_internal_collaborators` lendo `profiles`, `user_global_roles` e `internal_area_memberships`;
- revisar se `vw_admin_internal_area_memberships` atual ja atende ou se precisa de versao complementar;
- criar tipos em `packages/contracts` para essas views;
- adicionar testes pgTAP de RLS/grants;
- documentar a decisao semantica: evoluir tabela existente, renomear futuramente ou criar `internal_areas` com migracao planejada.

Fora desse primeiro lote:

- catalogo comercial;
- UI nova de CS/Financeiro/Admin Operations;
- tarefas/Kanban;
- projetos;
- health score;
- product demand intake.

## Migrations provaveis

### V1-A: read models de areas e colaboradores

Provavel conteudo:

- `vw_admin_internal_areas`
- `vw_admin_internal_collaborators`
- possivel ajuste complementar de `vw_admin_internal_area_memberships`
- grants restritos a `authenticated` com RLS/filters internos por funcao, conforme padrao do repo
- pgTAP para impedir acesso indevido

### V1-B: extensao operacional de colaborador

Somente se houver necessidade real:

- `internal_collaborator_profiles`
- referencia obrigatoria a `profiles(id)`
- campos operacionais, nao identidade duplicada
- RPCs admin-only para manutencao

### V1-C: catalogo comercial

Somente apos decisoes de produto:

- `commercial_products`
- `commercial_product_plans`
- `commercial_product_modules`
- `commercial_product_features`
- `product_area_ownerships`

### V1-D: assinatura e ownership por cliente

- `customer_product_subscriptions`
- `customer_internal_owners`
- views para suporte/CS/financeiro/admin

### V1-E em diante

- `product_demand_intakes`
- `operational_tasks`
- `operational_projects`
- `customer_health_signals`

## Views e RPCs provaveis

Views:

- `vw_admin_internal_areas`
- `vw_admin_internal_collaborators`
- `vw_admin_internal_area_memberships`
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

RPCs:

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

Todas as RPCs futuras devem usar ator autenticado, `SECURITY DEFINER` apenas quando necessario, `SET search_path = ''`, grants explicitos, validacao de escopo e audit trail.

## Impactos em frontend

- Nenhuma alteracao frontend neste lote de planejamento.
- Futuramente, o frontend deve consumir somente views/RPCs contratadas.
- Roteamento pos-login deve continuar sendo resolvido por auth context backend, nao por regra local.
- `/support/queue`, `/engineering`, `/internal-actions`, `/portal` e `/admin` nao devem receber dados de CS/Financeiro por composicao improvisada.
- Novos cockpits devem nascer depois dos contratos:
  - `/cs/portfolio`
  - `/finance`
  - possivel `/admin/operations`
  - possivel `/engineering/product-demands`
- UI futura precisa de blueprint/screen spec antes da implementacao visual.

## Riscos de seguranca

- Vazamento cross-tenant se subscriptions/ownership nao tiverem `tenant_id` explicito e RLS testada.
- Escalada de privilegio se area membership for confundida com tenant membership.
- Exposicao financeira se cockpit financeiro nao mascarar valores/status sensiveis.
- Exposicao de audit bruto se read models administrativos reutilizarem `audit.audit_logs` sem sanitizacao.
- Bypass operacional se frontend decidir landing, role ou permissao sem auth context backend.
- Uso indevido de `service_role` em scripts/QA para passar gate.
- `SECURITY DEFINER` sem `SET search_path = ''`.
- Helpers privados com `EXECUTE` publico indevido.
- Portal customer-facing consumindo views internas de suporte/admin.

## Perguntas de produto inevitaveis

1. Quais produtos comercializados existem no primeiro catalogo: `Genius Returns`, `After Sale` e quais outros?
2. Plano e modulo sao conceitos comerciais, operacionais ou ambos?
3. Quais features sao vendidas, quais sao habilitacoes internas e quais sao gates temporarios por conta?
4. Um cliente pode ter multiplos produtos/planos ativos simultaneamente?
5. Quem e o owner primario por cliente: CS, suporte, gerente de conta ou area?
6. Financeiro pode ver todos os clientes ou apenas carteira/ownership?
7. CS pode criar tarefa/projeto para suporte/engenharia ou apenas follow-up proprio?
8. Health score deve ser manual, calculado, hibrido ou apenas sinais na primeira versao?
9. Quais sinais entram no health score: tickets, SLA, uso do portal, financeiro, integracoes, projetos, alertas?
10. Product demand intake sera revisado por Produto, Engenharia, Suporte ou comite?
11. Quando uma demanda de produto pode virar backlog real?
12. O Admin operacional deve ficar dentro de `/admin` ou nascer como `/admin/operations`?
13. Financeiro deve expor valores financeiros, status simplificado ou apenas alerta operacional?
14. Projetos operacionais pertencem a CS, suporte, produto ou sao cross-area?
15. Quais areas internas sao canonicas e quais sao apenas areas acionaveis por suporte?

## Decisao recomendada

Nao implementar catalogo comercial, CS, Financeiro, tarefas, projetos ou health score antes de consolidar areas internas e colaboradores como contrato operacional.

O primeiro lote implementavel seguro deve ser `OCP V1-A Internal Areas Contract Consolidation`, com read models sobre entidades existentes e testes de permissao. Esse lote reduz risco de duplicacao e prepara a base para produto/plano/ownership sem criar uma arquitetura paralela.

## Boundary confirmado

- Nenhuma migration criada neste lote.
- Nenhum schema alterado neste lote.
- Nenhuma UI alterada neste lote.
- Nenhuma feature criada neste lote.
- Nenhum arquivo em `supabase/` deve ser alterado por este planejamento.
