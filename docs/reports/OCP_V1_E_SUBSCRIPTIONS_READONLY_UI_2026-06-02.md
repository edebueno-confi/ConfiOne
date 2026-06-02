# OCP V1-E Subscriptions Read-only UI - 2026-06-02

## Resumo

O lote implementou o primeiro consumo frontend read-only dos read models V1-E de Customer Product Subscriptions em uma superfície Admin/OCP existente.

Superfície escolhida: `/admin/tenants`, no detalhe do cliente B2B, com nova aba `Subscriptions`.

## Escopo entregue

- Consumo read-only de `vw_admin_customer_product_subscriptions`.
- Consumo read-only de `vw_admin_customer_product_subscription_detail`.
- Exibição de:
  - cliente/tenant selecionado;
  - produto;
  - plano;
  - status da subscription;
  - datas relevantes;
  - features comerciais retornadas pelo read model;
  - responsáveis internos retornados pelo read model;
  - estados de loading, vazio, erro e contrato indisponível.
- Integração sem criar workspace novo, rota nova ou tela concorrente.
- Nenhuma ação de criar, editar, arquivar ou mutar V1-E foi exposta.

## Arquivos alterados

- `apps/web/src/contracts/admin-contracts.ts`
- `apps/web/src/features/admin/admin-api.ts`
- `apps/web/src/features/tenants/TenantsPage.tsx`
- `docs/VIEW_RPC_CONTRACTS.md`
- `docs/PROJECT_STATE.md`
- `docs/DOCUMENTATION_LEDGER.md`
- `docs/README.md`
- `docs/reports/OCP_V1_E_SUBSCRIPTIONS_READONLY_UI_2026-06-02.md`

## Contratos consumidos

- `vw_admin_customer_product_subscriptions`
- `vw_admin_customer_product_subscription_detail`

Nenhuma RPC de escrita V1-E foi chamada pelo frontend.

## Validação local

- `npm run web:typecheck`
- smoke autenticado em `http://127.0.0.1:5173/admin/tenants` com `platform_admin`
- validação visual básica no browser da aba `Subscriptions`
- confirmação textual no DOM de produto, plano, features e owners retornados pelo backend
- console do browser sem erro durante o smoke

Para o smoke visual, o banco local não tinha produtos, planos, features ou subscriptions V1-E. Foram criados dados QA locais por RPCs reais e autenticadas como `platform_admin`, sem alterar migration, seed versionado ou frontend.

## Limitações e riscos

- Ainda não há UI de mutação para criar/editar/arquivar subscriptions, entitlements ou owners.
- Ainda não há billing, financeiro, preço, invoice, cobrança, pagamento ou receita.
- Ainda não há CS Workspace ou Finance Workspace consumindo V1-E.
- A view `vw_admin_customer_product_subscriptions` pode multiplicar `active_entitlement_count` e `active_owner_count` quando a mesma subscription tem múltiplos entitlements e múltiplos owners, por causa da agregação sobre joins simultâneos. A UI evita usar esses contadores de lista como fonte visual principal e prioriza `vw_admin_customer_product_subscription_detail` para features e responsáveis.

## Recomendação

O lote está apto para fechamento como primeiro consumo read-only Admin/OCP.

Próximo lote recomendado: corrigir ou revisar o agregado backend de `vw_admin_customer_product_subscriptions` para usar contagem distinta antes de usar os contadores de lista em decisões operacionais ou indicadores de portfolio. Depois disso, avançar para integração operacional controlada no Customer Account/Profile ou planejamento do CS Workspace.
