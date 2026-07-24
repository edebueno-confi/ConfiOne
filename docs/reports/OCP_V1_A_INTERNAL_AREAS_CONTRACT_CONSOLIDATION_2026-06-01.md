# OCP V1-A - Internal Areas Contract Consolidation

Data: 2026-06-01
Branch: `codex/project-forensic-recovery-audit`
Base: `b3d4998`

## Objetivo

Implementar o primeiro corte seguro do Operational Control Plane V1 para consolidar áreas internas e colaboradores como contratos backend-first, sem criar UI, catálogo comercial, CS, Financeiro, Kanban, projetos ou health score.

## Decisão semântica

`internal_action_target_areas` pode funcionar como catálogo inicial de áreas internas no OCP V1-A. A tabela já possui `area_key`, `display_name`, `status`, `is_system`, `allows_specialized_bridge`, auditoria, RLS e grants controlados. O nome ainda reflete a origem em Internal Actions, mas a semântica atual é suficiente para uma camada de contrato canônica.

`internal_area_memberships` pode funcionar como membership operacional de colaborador por área. A tabela já vincula `tenant_id`, `user_id`, `area_key`, `role` e `status`, reaproveitando `tenants`, `profiles` e o catálogo de áreas existente.

Não foi criada tabela `internal_areas`, `internal_areas_v2`, `collaborators`, `employees`, `customers`, role paralela ou membership paralela porque não houve diferença semântica comprovada que justificasse duplicação.

## Backend implementado

Migration criada:

- `supabase/migrations/20260601134126_ocp_v1_a_internal_areas_contract_consolidation.sql`

Views criadas:

- `vw_admin_internal_areas`
- `vw_admin_internal_collaborators`
- `vw_internal_area_landing_context`

View preservada como contrato suficiente:

- `vw_admin_internal_area_memberships`

RPCs novas:

- nenhuma.

RPCs reaproveitadas:

- `rpc_admin_add_internal_area_membership`
- `rpc_admin_update_internal_area_membership`
- `rpc_admin_archive_internal_area_membership`

## Segurança

- As novas views usam `security_barrier = true`.
- `anon` não recebe `SELECT`.
- `authenticated` recebe apenas `SELECT` nas views.
- Tabelas base continuam sem DML direto para `authenticated`.
- `vw_admin_internal_areas` e `vw_admin_internal_collaborators` filtram por `platform_admin`.
- `vw_internal_area_landing_context` deriva de `vw_internal_action_area_auth_context` e mantém o escopo do usuário autenticado.
- O read model de colaboradores não expõe payload bruto de Auth, metadata, audit bruto, senha, storage path ou dados financeiros.

## Testes

Teste criado:

- `supabase/tests/045_ocp_v1_a_internal_areas_contract_consolidation.sql`

Cobertura:

- grants corretos para `authenticated`;
- bloqueio para `anon`;
- `security_barrier` nas views;
- ausência de DML direto nas tabelas base;
- platform admin lendo áreas e colaboradores;
- usuário sem `platform_admin` sem leitura administrativa;
- membro de área recebendo landing context;
- usuário sem membership sem landing context;
- ausência de exposição de colunas sensíveis no read model de colaboradores.

## Validação runtime

Comandos executados:

- `npm run supabase:lint:db`
- `npm run supabase:test:db`
- `npx supabase migration up --local`
- `npm run supabase:lint:db`
- `npm run supabase:test:db`
- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`
- `npm run documentation:validate:internal-docs`
- `git diff --check`

Resultado final:

- `supabase:lint:db`: passou, sem erros de schema.
- `supabase:test:db`: passou com `48` arquivos e `998` testes.
- `contracts:typecheck`: passou.
- `web:typecheck`: passou.
- `web:build`: passou.
- `documentation:validate:internal-docs`: passou em dry-run, com alertas documentais preexistentes e nenhum bloqueio.
- `git diff --check`: passou, sem erro de whitespace.

Causa raiz das falhas intermediárias:

- primeira execução de `supabase:test:db`: o banco local ainda não tinha aplicado a migration nova, então `vw_admin_internal_areas` não existia no runtime. Correção: `npx supabase migration up --local`, sem reset de banco.
- segunda execução de `supabase:test:db`: baseline pgTAP do teste novo declarava `20` testes, mas executava `19`. Correção: ajuste do `plan(19)`.

## Contratos TypeScript

Tipos adicionados em `packages/contracts/src/ticketing.ts` e exportados por `packages/contracts/src/index.ts`:

- `PlatformRole`
- `AdminInternalArea`
- `AdminInternalCollaborator`
- `InternalAreaLandingContext`

Reexports adicionados no frontend sem criar UI:

- `apps/web/src/contracts/admin-contracts.ts`
- `apps/web/src/contracts/support-contracts.ts`

## Limites mantidos

- Sem UI nova.
- Sem catálogo comercial.
- Sem CS Workspace.
- Sem Finance Workspace.
- Sem Kanban/tarefas.
- Sem projetos operacionais.
- Sem health score.
- Sem RPC nova.
- Sem duplicar `profiles`.
- Sem duplicar `tenants`.
- Sem duplicar `user_global_roles`.
- Sem duplicar `tenant_memberships`.
- Sem `service_role` como atalho operacional.

## Lacunas futuras

- Decidir se o nome físico `internal_action_target_areas` deve permanecer ou se uma futura migration controlada deve introduzir `internal_areas`.
- Definir atributos operacionais de colaborador antes de criar `internal_collaborator_profiles`.
- Modelar catálogo comercial em lote próprio.
- Modelar vínculo cliente-produto-plano em lote próprio.
- Definir ownership interno por cliente/produto antes de CS/Financeiro.
- Definir read models específicos para CS, Financeiro, Produto, tarefas e projetos antes de qualquer UI.

## Próximo lote recomendado

`OCP V1-B Commercial Product Catalog Planning & Contract Design`

Escopo recomendado:

- auditar `customer_account_features`, `customer_account_profiles` e docs de produto;
- definir produtos, planos, módulos e features comercializadas;
- desenhar migrations prováveis sem implementar UI;
- documentar perguntas de produto inevitáveis sobre oferta, limites e ownership.
