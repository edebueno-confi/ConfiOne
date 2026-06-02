# OCP V1-E Customer Product Subscriptions Foundation

## Resumo

Lote backend local para materializar a fundacao de Customer Product Subscriptions no Operational Control Plane.

O lote reaproveita `commercial_products`, planos e features do OCP V1-C, sem criar produto paralelo, sem billing, sem UI, sem deploy remoto e sem dado real.

## Escopo entregue

- Migration local `20260602120000_ocp_v1_e_customer_product_subscriptions_foundation.sql`.
- Tabelas:
  - `customer_product_subscriptions`
  - `customer_product_feature_entitlements`
  - `customer_product_internal_owners`
- Enums de status, origem de entitlement e ownership.
- Views administrativas:
  - `vw_admin_customer_product_subscriptions`
  - `vw_admin_customer_product_subscription_detail`
  - `vw_admin_customer_product_feature_entitlements`
  - `vw_admin_customer_product_internal_owners`
- View support-safe:
  - `vw_support_customer_product_context`
- RPCs administrativas para criar, atualizar e arquivar subscriptions, entitlements e owners.
- RLS, grants, audit trail e bloqueio de leitura/DML direto para `authenticated`.
- pgTAP `047_ocp_v1_e_customer_product_subscriptions_foundation.sql`.
- Contratos TypeScript em `packages/contracts/src/ticketing.ts` e exports em `packages/contracts/src/index.ts`.

## Boundaries preservados

- Sem `apps/web`.
- Sem UI nova.
- Sem backend runtime fora de Supabase/contracts.
- Sem migration remota.
- Sem service_role fora de validação local.
- Sem billing, invoice, preço, cobrança, payment ou revenue.
- Sem alteração de `customer_account_features`.
- Sem mocks ou seed customer-facing.

## Validações

Validações executadas no fechamento do lote:

- `git status --short`
- `git diff --check`
- `npm run contracts:typecheck`
- `supabase db reset --local`
- `npm run supabase:lint:db` - sem erros de schema
- `npm run supabase:test:db` - 50 arquivos, 1072 testes, PASS
- confirmação de ausência de alteração em `apps/web`

## Gaps remanescentes

- UI/Admin Console para consumir os read models V1-E ainda não foi autorizada.
- CS Workspace e Finance Workspace continuam fora deste lote.
- Integração explícita entre subscription comercial e `customer_account_features` ainda exige decisão/migration futura.
- Billing e dados financeiros continuam fora do modelo V1-E.

## Recomendação

Usar esta fundação como source of truth backend para o próximo planejamento de consumo OCP. O próximo lote deve ser de leitura/UX autorizada ou de integração operacional controlada, nunca de billing implícito.
