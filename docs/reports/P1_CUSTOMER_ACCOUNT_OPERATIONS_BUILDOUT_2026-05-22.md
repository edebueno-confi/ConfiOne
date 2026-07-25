# P1 Customer Account Operations Buildout

## Sumario
O lote fechou a camada operacional minima de Customer Account para clientes B2B, conectando contratos backend-first, Admin Tenants, Support Customer Context e fixture QA local. O escopo evitou CRM generico, dados reais, CSV, planilha real de clientes e qualquer exposicao customer-facing de dados internos.

## Auditoria inicial
- Ja existiam tabelas `customer_account_profiles`, `customer_account_integrations`, `customer_account_features`, `customer_account_customizations` e `customer_account_alerts`.
- Ja existiam RLS, auditoria por trigger, sanitizacao de texto sensivel e bloqueio de DML direto para `authenticated`.
- Ja existiam `vw_support_customer_account_context` e `vw_admin_customer_account_profiles`.
- Ja existiam RPCs para upsert de profile, add/update de integracao, add/update de customizacao, add/archive de alerta e set de feature flag.
- Lacunas encontradas: faltavam views administrativas dedicadas por recurso, aliases de suporte esperados, `archive` explicito de integracao/customizacao, `update` explicito de alerta e UI administrativa conectada em `/admin/tenants`.

## Criado ou alterado
- Migration `20260522231000_customer_account_operations_closure_v1.sql`.
- Testes pgTAP ampliados em `020_phase6_8_customer_account_profile_backend.sql`.
- Tipos em `packages/contracts`.
- Contratos web em `apps/web/src/contracts/admin-contracts.ts`.
- API administrativa em `apps/web/src/features/admin/admin-api.ts`.
- Aba `Conta B2B` em `apps/web/src/features/tenants/TenantsPage.tsx`.
- Fixture `supabase/qa/create-local-functional-fixture.mjs` enriquecida com resumo de `customer_account`.

## Views
- `vw_admin_customer_account_profile_detail`
- `vw_admin_customer_account_integrations`
- `vw_admin_customer_account_customizations`
- `vw_admin_customer_account_alerts`
- `vw_admin_customer_account_features`
- `vw_support_customers_list`
- `vw_support_customer_detail`

## RPCs
- `rpc_admin_archive_customer_integration`
- `rpc_admin_archive_customer_customization`
- `rpc_admin_update_customer_account_alert`
- Reutilizadas: `rpc_admin_upsert_customer_account_profile`, `rpc_admin_add_customer_integration`, `rpc_admin_update_customer_integration`, `rpc_admin_add_customer_customization`, `rpc_admin_update_customer_customization`, `rpc_admin_add_customer_account_alert`, `rpc_admin_archive_customer_account_alert`, `rpc_admin_set_customer_feature_flag`.

## Telas
- `/admin/tenants`: adicionada aba `Conta B2B` para profile, integracoes, customizacoes, alertas e features.
- `/support/customers` e `/support/customers/:tenantId`: permanecem read-only sobre contexto operacional seguro.
- `/support/tickets/:ticketId`: permanece com rail/contexto essencial, sem virar CRM.
- Portal Cliente: sem mudanca de superficie.

## Boundaries
- Frontend nao le tabelas `customer_account_*` diretamente.
- Escrita passa somente por RPC administrativa.
- Portal Cliente nao recebe alertas internos, customizacoes internas, notas operacionais, detalhes sensiveis de integracao, audit bruto, engenharia, internal actions, bucket/path de storage ou URL persistente.
- Texto de account profile continua bloqueando tokens, secrets, URLs internas e endpoints sensiveis no backend.
- `tenant_id` permanece explicito nos contratos de escrita.

## Fixture QA
Script: `npm run supabase:qa:local-functional-fixture`.

Usuarios locais principais:
- `qa.local.platform-admin@genius.local` / `LOCAL_QA_ADMIN_PASSWORD`
- `qa.local.support-manager-a@genius.local` / `LOCAL_QA_SUPPORT_MANAGER_PASSWORD`
- `qa.local.support-agent-a@genius.local` / `LOCAL_QA_SUPPORT_AGENT_PASSWORD`
- `marina.ops@support-qa-a.local` / `LOCAL_QA_CLIENT_PASSWORD`
- `gestao.portal@support-qa-a.local` / `LOCAL_QA_CUSTOMER_MANAGER_PASSWORD`

Dados artificiais:
- tenant `support-qa-a`
- ticket funcional persistido
- customer account com produto, tier, integracoes, features, customizacoes e alertas
- artigos public/restricted/internal para QA de boundary
- internal actions e work item de engenharia para rotas privadas

## CRUD
Completo no corte P1:
- Customer account profile: upsert/list/detail/audit.
- Customer integrations: add/update/archive/list/audit.
- Customer customizations: add/update/archive/list/audit.
- Customer account alerts: add/update/archive/list/audit.
- Customer account features: set/list/audit.
- Contatos: continuam por RPCs administrativas existentes.

Ainda incompleto:
- Tipologia rica de contato operacional/tecnico/financeiro/CS.
- Onboarding governado novo de usuario customer-facing a partir de Customer Account.
- Edicao inline completa de registros existentes no Admin pode ser refinada; os contratos backend ja existem.
- Modelo comercial profundo de contrato/plano continua fora do corte para evitar CRM inflado.

## QA esperado
Rotas de QA autenticado:
- `platform_admin`: `/admin/tenants`, `/admin/customer-portal`.
- `support_manager`: `/support/customers`, `/support/customers/:tenantId`, `/support/tickets/:ticketId`.
- `customer_user` e `customer_manager`: `/portal`, `/portal/tickets`, `/portal/help`.

## Riscos restantes
- A UI administrativa entrega operacao minima e densa, mas ainda pode ganhar edicao inline mais ergonomica em lote menor.
- O dominio de contatos precisa evoluir sem reaproveitar campos ambiguos.
- Nenhum dado real de cliente foi importado; validacao com planilha real deve acontecer apenas em lote futuro sanitizado.

## Proximos passos
Recomendado: P1-B Customer Account QA Hardening, focado em smoke autenticado com fixture local, edicao inline ergonomica de registros existentes e backlog de contato B2B tipado, sem importar dados reais.
