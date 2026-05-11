# Customer Portal Tenant Context And Switching V3

## Objetivo
Implementar contexto ativo de tenant no Portal Cliente B2B para usuarios customer-facing com multiplos vinculos, permitindo troca segura de tenant sem contaminar contexto admin, sem depender de cache local como fonte de verdade e sem expor dados cross-tenant.

## Decisao final
- O tenant ativo passou a ser backend-governed.
- A persistencia ficou em `public.customer_portal_user_preferences`.
- A selecao e feita por `rpc_customer_set_active_tenant(uuid)`.
- O backend revalida a selecao contra memberships customer-facing ativas, tenant ativo e portal habilitado por `customer_account_features.feature_key = 'returns_portal'`.
- O frontend nao usa `localStorage` como source of truth de tenant.

## Modelo de active tenant

### Tabela de preferencia
- `public.customer_portal_user_preferences`
  - `user_id`
  - `active_tenant_id`
  - `created_at`
  - `updated_at`
  - `created_by_user_id`
  - `updated_by_user_id`

### Regras
- o usuario so pode selecionar tenant com membership ativa em `customer_user` ou `customer_manager`
- o tenant precisa estar `active`
- o tenant precisa ter portal habilitado em `customer_account_features`
- tenant inativo, arquivado, sem portal ou fora do escopo do ator e negado pela RPC
- se o usuario tiver apenas um tenant valido, esse tenant vira fallback automatico
- se nao houver tenant valido, o portal entra em estado honesto de indisponibilidade

## Views e funcoes finais

### Novas views
- `vw_customer_portal_available_tenants`
- `vw_customer_portal_active_tenant_context`

### Views endurecidas
- `vw_customer_portal_auth_context`
- `vw_customer_portal_profile_context`

### Funcoes privadas
- `app_private.customer_portal_active_tenant_id()`
- `app_private.customer_portal_has_active_tenant(uuid)`
- `app_private.vw_customer_portal_available_tenant_scope`

### RPCs
- `rpc_customer_set_active_tenant(uuid)`

## Impacto nos contratos customer-facing
- tickets list/detail/timeline passam a respeitar o tenant ativo
- anexos customer-facing passam a respeitar o tenant ativo
- Knowledge autorizada e busca autenticada passam a respeitar o tenant ativo
- `rpc_customer_create_ticket` exige tenant igual ao tenant ativo efetivo
- `rpc_customer_search_knowledge_articles` nega explicitamente busca para tenant diferente do ativo

## Boundary admin vs customer
- Admin continua resolvendo autorizacao apenas por `vw_admin_auth_context`.
- Portal cliente continua resolvendo contexto apenas pelos contratos `vw_customer_portal_*` e `rpc_customer_*`.
- O `active_tenant_id` customer-facing nao libera nem altera qualquer superficie admin.
- Customer sem role admin continua bloqueado em `/access-denied` ao tentar abrir `/admin/customer-portal`.

## Frontend
- novo provider: `apps/web/src/features/customer-portal/customer-portal-context.tsx`
- a heuristica `contexts[0]` foi removida das telas do portal
- o seletor de tenant aparece apenas quando ha multiplos tenants validos
- a troca de tenant faz refetch e limpa o dado renderizado do tenant anterior
- quando nao ha tenant valido, o portal mostra estado vazio honesto

## Validacoes do lote
- pgTAP novo: `supabase/tests/035_customer_portal_tenant_context_and_switching.sql`
- fixture QA atualizada com:
  - customer com tenant unico
  - customer multi-tenant
  - tenant sem portal habilitado
  - tickets em tenants distintos
  - entitlements distintos por tenant

## Acoes habilitadas
- customer com um tenant entra direto no contexto correto
- customer com multiplos tenants pode trocar o tenant ativo no portal
- search/help/tickets passam a responder ao tenant ativo
- admin continua usando `/admin/customer-portal` sem loading persistente

## Acoes bloqueadas
- selecao de tenant fora do escopo do ator
- selecao de tenant inativo
- selecao de tenant sem portal habilitado
- qualquer inferencia de tenant ativo apenas por cache local
- qualquer contaminacao de contexto admin pelo portal cliente

## Riscos restantes
- ainda nao existe tenant switcher para superfícies externas alem do portal
- o portal continua sem estrategia de sessao multi-aba dedicada; o contrato atual cobre o tenant ativo por usuario autenticado
- futuras RPCs customer-facing novas precisam continuar aderindo a `app_private.customer_portal_has_active_tenant(...)`

## Atualização posterior - regressão de entitlement
- A inconsistência visual observada no tenant B depois do fechamento deste lote nao foi causada pelo tenant switching.
- O `active_tenant_id` continuou correto; o problema era uma fixture que deixava um entitlement `restricted` ativo embora marcado para arquivamento.
- Depois da correção do seed e das regressões adicionais:
  - trocar tenant continua limpando o dado anterior
  - tenant ativo divergente continua negado no backend
  - artigo `restricted` com entitlement arquivado deixa de aparecer imediatamente no tenant correspondente
