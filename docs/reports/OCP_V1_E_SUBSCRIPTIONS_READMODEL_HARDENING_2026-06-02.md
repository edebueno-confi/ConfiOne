# OCP V1-E Subscriptions Read Model Hardening - 2026-06-02

## Resumo

O lote corrigiu o read model administrativo `vw_admin_customer_product_subscriptions` para eliminar multiplicação indevida de contadores quando uma mesma subscription possui múltiplos entitlements comerciais e múltiplos owners internos.

O shape público da view foi preservado. A UI read-only existente em `/admin/tenants` continua consumindo os mesmos campos.

## Causa raiz

A versão inicial de `vw_admin_customer_product_subscriptions` fazia `left join` simultâneo em:

- `customer_product_feature_entitlements`
- `customer_product_internal_owners`

Quando uma subscription tinha 2 entitlements e 2 owners, o join intermediário gerava 4 linhas. Como os contadores eram calculados diretamente sobre esse resultado, `active_entitlement_count` e `active_owner_count` podiam retornar `4` em vez de `2`.

## Correção

Foi criada a migration:

- `supabase/migrations/20260602170000_ocp_v1_e_subscription_readmodel_hardening.sql`

A migration redefine `vw_admin_customer_product_subscriptions` usando agregações independentes por subscription via `left join lateral`:

- uma agregação para `active_entitlement_count`;
- uma agregação para `active_owner_count`.

Não houve alteração em:

- tabelas;
- enums;
- RPCs;
- RLS;
- grants;
- UI;
- contratos TypeScript;
- billing, financeiro, preço, invoice, cobrança, payment ou revenue.

## Teste adicionado

O pgTAP `supabase/tests/047_ocp_v1_e_customer_product_subscriptions_foundation.sql` foi endurecido para criar:

- 1 subscription;
- 2 feature entitlements ativos;
- 2 owners internos ativos.

Asserções novas/ajustadas:

- `active_entitlement_count = 2`;
- `active_owner_count = 2`;
- `jsonb_array_length(entitlements) = 2`;
- `jsonb_array_length(owners) = 2`.

## Contratos

Views auditadas:

- `vw_admin_customer_product_subscriptions`
- `vw_admin_customer_product_subscription_detail`

Shape público preservado. Não houve necessidade de atualizar contratos TypeScript.

## Validações

- `supabase db reset --local --yes`
- `supabase test db --local supabase/tests/047_ocp_v1_e_customer_product_subscriptions_foundation.sql`
- `git diff --check`
- `npm run supabase:lint:db`
- `npm run supabase:test:db`
- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`
- smoke autenticado em `/admin/tenants` > `Subscriptions` com massa local mínima: a UI exibiu 1 subscription, 2 entitlements, 2 responsáveis, produto, plano, features e owners.

## Limites preservados

- Sem alteração em `apps/web`.
- Sem mutation nova.
- Sem billing ou financeiro.
- Sem deploy remoto.
- Sem service role.
- Sem dados reais.

## Recomendação

Fechar o lote como correção backend do contrato de lista V1-E. O próximo lote pode voltar ao consumo operacional em Customer Account/Profile ou planejamento do CS Workspace, sem exigir workaround no frontend para contadores de subscriptions.
