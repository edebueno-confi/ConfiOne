# OCP Next Lot Readiness Audit 2026-06-01

## Resumo executivo

O Operational Control Plane V1 avancou em dois lotes implementados e dois lotes documentais:

- OCP V1-A foi executado e consolidou areas internas/colaboradores reaproveitando contratos existentes.
- OCP V1-B foi planejamento contratual do catalogo comercial.
- OCP V1-C foi executado e materializou a fundacao backend do catalogo comercial global.
- OCP V1-D foi planejamento de customer product subscriptions e registrou bloqueio explicito antes de qualquer implementacao.

Conclusao: **OCP V1-E Customer Product Subscriptions Foundation ainda nao esta liberado para migration/backend**. O proximo lote seguro e **somente decisao de produto**, com registro documental das decisoes minimas. Enquanto essas decisoes nao forem fechadas, qualquer migration para `customer_product_subscriptions` ou `customer_product_feature_entitlements` deve permanecer bloqueada.

## Estado atual OCP

O plano canonico `docs/OPERATIONAL_CONTROL_PLANE_V1.md` define a sequencia futura do OCP: areas internas, catalogo de produtos/planos, subscriptions cliente-produto, conexao com Internal Actions, roteamento por papel, CS, Financeiro, demandas de produto, tarefas/projetos e UI/Impeccable pass.

O estado real atual, cruzando relatórios OCP, contratos e migrations, e:

| Frente | Estado | Evidencia |
| --- | --- | --- |
| Areas internas e colaboradores | executado | OCP V1-A criou migration/teste/views e reaproveitou `internal_action_target_areas` + `internal_area_memberships`. |
| Catalogo comercial - desenho | planejado | OCP V1-B definiu modelo futuro e separou catalogo comercial de `customer_account_features`. |
| Catalogo comercial - backend | executado | OCP V1-C criou `commercial_products`, planos, modulos, features, `commercial_plan_features` e `product_area_ownerships`. |
| Customer product subscriptions | planejado, bloqueado | OCP V1-D planejou o modelo, mas registrou stop condition antes da implementacao. |
| OCP V1-E | nao liberado | Depende de decisoes de produto minimas listadas em V1-D. |

## Lotes ja fechados

### OCP V1-A - Internal Areas Contract Consolidation

Status: fechado e implementado.

Artefatos principais:

- migration `supabase/migrations/20260601134126_ocp_v1_a_internal_areas_contract_consolidation.sql`;
- teste `supabase/tests/045_ocp_v1_a_internal_areas_contract_consolidation.sql`;
- views administrativas para areas e colaboradores;
- reaproveitamento de `internal_action_target_areas`, `internal_area_memberships`, `profiles`, `tenants` e roles existentes;
- sem criar `internal_areas_v2`, identidade paralela ou membership paralela.

### OCP V1-B - Commercial Product Catalog Planning & Contract Design

Status: fechado como planejamento documental.

Resultado:

- definiu semantica de produto, plano, modulo, feature, entitlement comercial, add-on, limite de plano e ownership interno;
- definiu que `customer_account_features` e `knowledge_article_entitlements` nao sao catalogo/entitlement comercial;
- recomendou V1-C como primeiro lote implementavel;
- deixou `customer_product_subscriptions` e `customer_product_feature_entitlements` para lote posterior.

### OCP V1-C - Product Catalog Foundation

Status: fechado e implementado.

Contratos materializados:

- tabelas globais: `commercial_products`, `commercial_product_plans`, `commercial_product_modules`, `commercial_product_features`, `commercial_plan_features`, `product_area_ownerships`;
- views admin-only: `vw_admin_commercial_products`, `vw_admin_commercial_product_detail`, `vw_admin_commercial_product_plans`, `vw_admin_product_area_ownerships`;
- RPCs admin-only para criar/atualizar produtos, planos, modulos, features, relacao plano-feature e ownership por area;
- contratos TypeScript em `packages/contracts`;
- teste `supabase/tests/046_ocp_v1_c_product_catalog_foundation.sql`;
- RLS, grants, audit triggers, `security_barrier` e `SECURITY DEFINER` com `search_path` explicito.

Boundary preservado em V1-C:

- nao criou `customer_product_subscriptions`;
- nao criou `customer_product_feature_entitlements`;
- nao criou assinatura cliente-produto-plano;
- nao criou UI;
- nao misturou entitlement de Knowledge com entitlement comercial.

## Lotes planejados

### OCP V1-D - Customer Product Subscriptions Planning

Status: fechado como planejamento documental, com bloqueio explicito.

Modelo futuro proposto:

- `customer_product_subscriptions`: vinculo tenant-produto-plano;
- `customer_product_feature_entitlements`: direito efetivo por subscription/feature, somente se Produto confirmar necessidade;
- views futuras admin/support/portal/CS/financeiro segmentadas por superficie;
- RPCs futuras admin-only para criar/atualizar/arquivar subscriptions e entitlements;
- convivencia com `customer_account_features` como feature operacional/habilitacao real por conta, sem migracao automatica.

O V1-D recomenda o nome `OCP V1-E Customer Product Subscriptions Foundation`, mas condiciona o inicio a decisoes minimas de produto.

## Bloqueios de produto

O OCP V1-E ainda depende das seguintes decisoes:

1. **After Sale**
   - Decidir se o MVP cobre apenas `Genius Returns` ou tambem `After Sale`.
   - Decidir se `After Sale` e produto separado, modulo de outro produto, plataforma propria ou familia futura.

2. **Multiproduto por cliente**
   - Confirmar se um `tenant` pode ter multiplos produtos ativos ao mesmo tempo.
   - Definir se o modelo aceita uma assinatura ativa por produto ou historico de planos por produto.

3. **Visibilidade por papel**
   - Definir o que Support pode ver: produto/plano/status, limites, gaps ou apenas resumo operacional.
   - Definir se Portal Cliente pode ver plano/features ou apenas produto/status.
   - Definir se Financeiro ve valores reais, status financeiro ou apenas status operacional.
   - Definir o que CS pode ver antes de workspace proprio.

4. **Ownership de manutencao**
   - Definir quem cria e mantem assinatura por cliente: platform admin, Financeiro, CS, owner da conta ou outro papel.
   - Definir se ownership de catalogo por area (`product_area_ownerships`) e suficiente para governanca de produto, sem virar permissao individual.

5. **Relacao entre cliente B2B, tenant, produto, plano, subscription e responsaveis internos**
   - `tenant` continua sendo o cliente B2B operacional.
   - `commercial_products` e `commercial_product_plans` sao catalogo global.
   - `customer_product_subscriptions` deve ser o vinculo `tenant -> product -> plan`.
   - `customer_account_profiles.product_line` e `account_tier` seguem como resumo operacional legado, nao fonte canonica comercial.
   - `customer_account_features` segue como habilitacao/override operacional por conta, nao entitlement comercial.
   - `product_area_ownerships` representa ownership interno por area sobre produto/modulo/feature, nao responsavel individual por cliente nem permissao.

## Contratos existentes reutilizaveis

### Reutilizaveis diretamente

- `tenants`: entidade operacional do cliente B2B e FK obrigatoria futura para subscription.
- `commercial_products`: produto comercial global.
- `commercial_product_plans`: plano por produto.
- `commercial_product_modules`: agrupamento interno/comercial dentro do produto.
- `commercial_product_features`: feature comercial canonica.
- `commercial_plan_features`: relacao plano-feature, com limites quando aplicavel.
- `product_area_ownerships`: ownership interno por area sobre produto/modulo/feature.
- `internal_action_target_areas`: catalogo inicial de areas internas usado por ownership.
- `internal_area_memberships`: membership individual de colaborador por area.
- `vw_admin_commercial_products`, `vw_admin_commercial_product_detail`, `vw_admin_commercial_product_plans`, `vw_admin_product_area_ownerships`: read models admin do catalogo.
- RPCs admin-only do catalogo comercial V1-C.
- Contratos TypeScript de catalogo comercial em `packages/contracts`.

### Reutilizaveis apenas como contexto ou compatibilidade

- `customer_account_profiles.product_line`: resumo operacional legado/atual.
- `customer_account_profiles.account_tier`: resumo operacional legado/atual.
- `customer_account_features`: habilitacao operacional/override por tenant.
- Customer Portal entitlements de Knowledge: servem apenas para Knowledge, nao para entitlement comercial.

### Nao existentes no runtime atual

A busca textual em `supabase`, `packages` e `apps` nao encontrou contratos runtime para:

- `customer_product_subscriptions`;
- `customer_product_feature_entitlements`;
- `vw_admin_customer_product_subscriptions`;
- `vw_admin_customer_product_entitlements`;
- `rpc_admin_create_customer_product_subscription`;
- `rpc_admin_set_customer_product_feature_entitlement`;
- tipos `CustomerProductSubscription` ou `CustomerProductFeatureEntitlement`.

Esses nomes aparecem nos documentos como modelo futuro/planejamento, nao como contrato implementado.

## Riscos arquiteturais

- Criar `customer_product_subscriptions` antes de decidir After Sale pode cristalizar uma taxonomia errada de produto/plataforma/modulo.
- Assumir multiproduto por tenant sem decisao de Produto pode quebrar compatibilidade com `product_line`/`account_tier` e com telas atuais.
- Expor plano/features no Support, Portal ou Financeiro sem matriz de visibilidade pode vazar informacao comercial sensivel.
- Misturar `customer_account_features` com entitlement comercial tornaria feature operacional fonte de contrato vendido.
- Reutilizar entitlement de Knowledge para feature comercial acoplaria dominios diferentes.
- Fazer frontend calcular contratado versus habilitado localmente violaria backend como source of truth.
- Usar `product_area_ownerships` como permissao individual enfraqueceria `internal_area_memberships` e auth real.
- Migrar dados legados automaticamente sem decisao de transicao pode corromper o estado operacional atual.

## Proximo lote recomendado

Recomendacao: **somente decisao de produto**.

Nome sugerido:

`OCP V1-E Product Decision Gate - Customer Product Subscriptions`

Escopo recomendado:

- fechar, em documento curto, as decisoes minimas de Produto para liberar ou bloquear V1-E;
- decidir Genius Returns vs After Sale no MVP;
- decidir se After Sale e produto separado, modulo, plataforma propria ou familia futura;
- decidir multiproduto por tenant;
- decidir visibilidade por papel para Support, Portal, CS e Financeiro;
- decidir owner de manutencao de subscription;
- decidir regra de convivencia/transicao com `customer_account_profiles` e `customer_account_features`;
- atualizar `ROADMAP_BUILDOUT_V3.md` e/ou `OPERATIONAL_CONTROL_PLANE_V1.md` apenas se a decisao alterar a sequencia.

Nao recomendado agora:

- migration/backend;
- contratos TypeScript novos;
- UI;
- RPC/view de subscription;
- seed de assinatura;
- migration de dados legados.

Se a decisao humana vier completa, o lote seguinte pode ser **planejamento tecnico final de V1-E** ou, se o modelo ficar fechado o suficiente, **migration/backend V1-E** com pgTAP, RLS, grants, audit e contratos TypeScript.

## Stop conditions

Parar antes de implementar V1-E se qualquer item permanecer sem decisao:

- Genius Returns apenas ou After Sale tambem;
- classificacao de After Sale como produto, modulo, plataforma propria ou familia futura;
- multiproduto por tenant;
- visibilidade de plano/features/limites para Support, Portal, CS e Financeiro;
- owner de manutencao de assinatura;
- regra de convivencia com `product_line`, `account_tier` e `customer_account_features`;
- necessidade real de `customer_product_feature_entitlements`;
- qualquer exposicao customer-facing de entitlement comercial;
- qualquer duvida de RLS, grants, audit ou tenant boundary.

Tambem parar diante das stop conditions gerais de `AGENTS.md` e `docs/GOAL_EXECUTION_PLAN.md`: deploy remoto, migration remota, secrets/service_role, dados reais, acao externa, custo, conflito documental ou falha de validacao.

## Prompt recomendado para o proximo lote

```text
Atue como product owner tecnico, arquiteto SaaS multi-tenant e docs/governance owner do Genius Support OS.

Objetivo:
Fechar o decision gate de Produto para liberar ou bloquear OCP V1-E Customer Product Subscriptions Foundation.

Escopo permitido:
- Criar um documento curto de decisao em docs/reports/ ou docs/.
- Responder explicitamente:
  - MVP inclui apenas Genius Returns ou tambem After Sale?
  - After Sale e produto separado, modulo, plataforma propria ou familia futura?
  - Um tenant pode ter multiplos produtos ativos?
  - Quais dados de produto/plano/features Support, Portal, CS e Financeiro podem ver?
  - Quem mantem assinatura por cliente?
  - Como subscriptions convivem com product_line, account_tier e customer_account_features?
  - customer_product_feature_entitlements e necessario no MVP?

Escopo proibido:
- Nao criar migration.
- Nao alterar Supabase/backend/runtime/UI/contratos.
- Nao criar seed.
- Nao implementar V1-E.

Fontes obrigatorias:
- AGENTS.md
- docs/GOAL_EXECUTION_PLAN.md
- docs/OPERATIONAL_CONTROL_PLANE_V1.md
- docs/reports/OCP_V1_D_CUSTOMER_PRODUCT_SUBSCRIPTIONS_PLANNING_2026-06-01.md
- docs/reports/OCP_NEXT_LOT_READINESS_AUDIT_2026-06-01.md

Entrega:
- Documento de decisao.
- Recomendacao final: liberar planejamento tecnico, liberar migration/backend ou manter bloqueado.
- git status final.
```

## Validacoes executadas nesta auditoria

- `git status --short`
- verificacao de existencia das fontes obrigatorias
- leitura/listagem textual de `AGENTS.md`, `docs/GOAL_EXECUTION_PLAN.md`, `docs/PROJECT_STATE.md`, `docs/ROADMAP_BUILDOUT_V3.md`, `docs/OPERATIONAL_CONTROL_PLANE_V1.md`, relatórios OCP V1-A/V1-B/V1-C/V1-D, `docs/ARCHITECTURE_RULES.md`, `docs/VIEW_RPC_CONTRACTS.md`, `docs/AUTH_CONTEXT_STRATEGY.md` e `docs/VALIDATION_CHECKLIST.md`
- busca textual por subscriptions, products, plans, ownership, entitlements e `customer_product`
- busca em `supabase`, `packages` e `apps` para confirmar ausencia de contratos runtime de `customer_product_subscriptions` e `customer_product_feature_entitlements`
- `git diff --check`
