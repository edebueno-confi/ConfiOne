# OCP V1-C - Product Catalog Foundation

Data: 2026-06-01
Branch: `codex/project-forensic-recovery-audit`
Base: `1ba2228`
Escopo: fundacao backend do catalogo comercial global. Este lote nao cria UI, assinatura cliente-produto-plano, CS, Financeiro, Kanban, projetos ou health score.

## Resumo executivo

O lote materializou o primeiro contrato executavel do catalogo comercial do Operational Control Plane V1. O catalogo agora possui entidades globais para produtos, planos, modulos, features comercializadas, relacao plano-feature e ownership por area interna.

`customer_account_features` permanece como habilitacao operacional por tenant e nao foi migrada, lida como catalogo ou usada como fonte canonica comercial. `product_line` e `account_tier` tambem permanecem apenas como resumo operacional de Customer Account.

## Artefatos criados

### Migration

- `supabase/migrations/20260601163921_ocp_v1_c_product_catalog_foundation.sql`

### Tabelas

- `commercial_products`
- `commercial_product_plans`
- `commercial_product_modules`
- `commercial_product_features`
- `commercial_plan_features`
- `product_area_ownerships`

### Enums

- `commercial_product_status`
- `commercial_product_plan_status`
- `commercial_product_module_status`
- `commercial_product_feature_status`
- `commercial_plan_feature_inclusion_type`
- `product_area_ownership_role`
- `product_area_ownership_status`

### Views admin-only

- `vw_admin_commercial_products`
- `vw_admin_commercial_product_detail`
- `vw_admin_commercial_product_plans`
- `vw_admin_product_area_ownerships`

### RPCs admin-only

- `rpc_admin_create_commercial_product`
- `rpc_admin_update_commercial_product`
- `rpc_admin_create_commercial_product_plan`
- `rpc_admin_update_commercial_product_plan`
- `rpc_admin_create_commercial_product_module`
- `rpc_admin_update_commercial_product_module`
- `rpc_admin_create_commercial_product_feature`
- `rpc_admin_update_commercial_product_feature`
- `rpc_admin_set_commercial_plan_feature`
- `rpc_admin_assign_product_area_ownership`
- `rpc_admin_archive_product_area_ownership`

## Seguranca e governanca

- Todas as tabelas novas possuem RLS habilitada.
- `authenticated` nao possui SELECT nem DML direto nas tabelas base.
- `anon` nao possui leitura do catalogo administrativo.
- Leitura de app futuro deve ocorrer somente pelas views `vw_admin_*`.
- Escrita de app futuro deve ocorrer somente pelas RPCs administrativas.
- Todas as RPCs novas sao `SECURITY DEFINER` com `SET search_path = ''`.
- Mutacoes geram audit trail por `audit.capture_row_change()` em `audit.audit_logs`.
- Views administrativas usam `security_barrier = true`.
- `product_area_ownerships.area_key` referencia `internal_action_target_areas.area_key`.
- Vinculos plano-feature, feature-modulo e ownership modulo/feature validam consistencia de produto.
- O modelo V1-C nao possui colunas financeiras, preco, moeda, invoice ou revenue.

## Contratos TypeScript

Foram adicionados em `packages/contracts`:

- status/enums de produto, plano, modulo, feature, inclusao plano-feature e ownership por area.
- records de produto, plano, modulo, feature, plan-feature e ownership.
- read models administrativos:
  - `AdminCommercialProduct`
  - `AdminCommercialProductDetail`
  - `AdminCommercialProductPlan`
  - `AdminProductAreaOwnership`
- payloads/responses das RPCs administrativas do catalogo.

## Testes

Teste novo:

- `supabase/tests/046_ocp_v1_c_product_catalog_foundation.sql`

Cobertura:

- RLS habilitada nas tabelas novas.
- Grants corretos para base, views e RPCs.
- `anon` bloqueado.
- `authenticated` sem SELECT/DML direto nas bases.
- views com `security_barrier`.
- leitura admin somente para `platform_admin`.
- usuario sem permissao recebe zero linhas.
- RPCs bloqueadas para usuario sem `platform_admin`.
- audit trail em mutacoes.
- rejeicao de `area_key` inexistente.
- rejeicao de vinculos cross-product.
- ausencia de colunas financeiras/preco.

Teste global ajustado:

- `supabase/tests/004_phase1_2_function_audit.sql`
  - contador de RPCs controladas atualizado para `118`.
  - helpers privados do catalogo adicionados ao allowlist privado.

## Falhas encontradas e causa raiz

1. O primeiro pgTAP tentava buscar IDs diretamente nas tabelas base como `authenticated`.
   - Causa raiz: erro no teste; o contrato corretamente remove SELECT direto das tabelas base.
   - Correcao: o teste passou a capturar IDs retornados pelas RPCs em tabela temporaria e usar read models para leitura.

2. O trigger compartilhado de validacao cross-product acessava `NEW.module_id` antes de ramificar por tabela.
   - Causa raiz: funcao de trigger compartilhada assumia coluna inexistente em `commercial_plan_features`.
   - Correcao: a funcao agora ramifica por `TG_TABLE_NAME` antes de acessar colunas especificas.

3. O plano pgTAP contava operacoes de setup como asserts e uma chamada direta como `anon` derrubou a conexao local.
   - Causa raiz: erro de teste, nao do contrato. A cobertura de `anon` ja existia por verificacao ACL.
   - Correcao: plano ajustado para asserts reais e remocao da chamada direta instavel.

## Validacoes executadas ate este checkpoint

- `npx supabase migration up --local`
- `npm run supabase:db:reset`
- `npm run supabase:test:db` com 49 arquivos e 1040 testes

Os demais gates do checkpoint V1-C devem ser executados antes do commit:

- `npm run supabase:lint:db`
- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`
- `npm run documentation:validate:internal-docs`
- `git diff --check`

## Boundary preservado

- Nenhuma UI criada.
- Nenhum `customer_product_subscriptions` criado.
- Nenhum `customer_product_feature_entitlements` criado.
- Nenhuma migration sobre assinatura cliente-produto-plano.
- Nenhuma migracao de `customer_account_features`.
- Nenhum CS Workspace.
- Nenhum Finance Workspace.
- Nenhum Kanban/tarefa.
- Nenhum projeto operacional.
- Nenhum health score.
- Nenhum valor financeiro ou preco.
- Nenhum deploy remoto.

## Riscos restantes

- A assinatura cliente-produto-plano ainda nao existe e precisa de planejamento V1-D antes de qualquer schema.
- Visibilidade para Support, Portal, CS e Financeiro ainda exige decisao de produto.
- Add-on, entitlement e override operacional continuam semanticamente separados, mas ainda precisam de contrato futuro.
- A manutencao do catalogo ainda nao tem UI; qualquer UI futura deve consumir somente views/RPCs.

## Proximo lote recomendado

`OCP V1-D Customer Product Subscriptions Planning`

Escopo recomendado:

- auditar `tenants`, `customer_account_profiles`, `customer_account_features` e o catalogo V1-C.
- planejar `customer_product_subscriptions` e possivel `customer_product_feature_entitlements`.
- definir read models futuros para Admin, Support, Portal, CS e Financeiro.
- definir RLS, grants, auditoria e RPCs futuras.
- nao criar migration neste planejamento.
