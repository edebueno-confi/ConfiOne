# Access System Observability Hardening V3

## Objetivo
Fechar a governanca operacional de acesso e observabilidade administrativa nas rotas `/admin/access` e `/admin/system`, usando contratos reais de backend e sem expor dados sensiveis.

## Contexto Impeccable
- `PRODUCT.md` criado na raiz para alimentar o contexto de produto do Impeccable.
- `DESIGN.md` criado na raiz para alimentar o contexto visual do Impeccable.
- Contexto validado por `node C:\Users\edebu\.agents\skills\impeccable\scripts\load-context.mjs`.
- `npx impeccable@latest detect apps/web/src/features/access/AccessPage.tsx apps/web/src/features/system/SystemPage.tsx` executado como apoio de auditoria.
- Impeccable foi usado como complemento para `audit`, `layout`, `harden`, `clarify` e `polish`, sem substituir Design System V3, screen specs ou contratos backend.

## Auditoria inicial
- `profiles`, `user_global_roles`, `tenants`, `tenant_memberships`, `tenant_contacts` e `audit.audit_logs` ja existiam.
- `vw_admin_auth_context`, `vw_admin_user_lookup`, `vw_admin_tenant_memberships` e `vw_admin_audit_feed` ja existiam e foram reaproveitadas como base.
- RPCs administrativas de tenants/memberships ja existiam e foram endurecidas sem duplicacao.
- Riscos encontrados:
  - `/admin/system` derivava severidade e impacto no frontend.
  - `/admin/system` exibia `metadata`, `before_state` e `after_state` brutos.
  - `/admin/access` precisava diferenciar acoes habilitadas pelo backend de acoes bloqueadas.
  - Health checks nao poderiam virar dashboard decorativo nem status verde sem fonte.

## Contratos criados ou alterados

### Read models de Access
- `vw_admin_access_users`
- `vw_admin_access_user_detail`
- `vw_admin_access_memberships`

Esses read models sao restritos a `platform_admin` ativo e retornam usuarios, memberships, roles, status, tenants associados, contadores e flags de acao (`can_update_role`, `can_update_status`) sem expor metadados sensiveis.

### Read models de System
- `vw_admin_system_audit_events`
- `vw_admin_system_health_checks`
- `vw_admin_system_operational_summary`

O feed de auditoria administrativo agora e sanitizado. Ele nao expoe `metadata`, `before_state` ou `after_state` brutos. A severidade, o servico, a acao, o impacto e o contexto sanitizado sao derivados no backend.

### RPCs administrativas endurecidas
- `rpc_admin_add_tenant_member`
- `rpc_admin_update_tenant_member_role`
- `rpc_admin_update_tenant_member_status`

Regras reforcadas:
- ator ativo obrigatorio;
- tenant explicito;
- validacao de permissao no backend;
- `tenant_manager` nao promove `tenant_admin`;
- autopromocao bloqueada;
- DML direto do app continua bloqueado;
- mutacoes continuam auditadas por trigger.

## Frontend

### `/admin/access`
- Passou a consumir `vw_admin_access_memberships`.
- Mantem `listAdminTenants` e `vw_admin_user_lookup` para selecao de tenant e usuario.
- Desabilita edicao quando o backend retorna `can_update_role = false` ou `can_update_status = false`.
- Exibe copy honesta quando a acao esta bloqueada pelo contrato de acesso.

### `/admin/system`
- Passou a consumir:
  - `vw_admin_system_audit_events`;
  - `vw_admin_system_health_checks`;
  - `vw_admin_system_operational_summary`.
- Removeu derivacao frontend de severidade, servico, impacto e status.
- Removeu exibicao de metadata/raw before/after.
- Rail direito exibe contexto sanitizado e deixa claro que valores brutos/payloads sensiveis nao sao expostos.

## Fixtures QA
- Fixture local de suporte agora inclui usuarios adicionais de Access:
  - tenant admin ativo;
  - viewer convidado;
  - requester revogado.
- Fixture cobre multiplos roles, memberships ativas/inativas e eventos auditaveis para `/admin/access` e `/admin/system`.

## Acoes habilitadas
- Adicionar membro a tenant via RPC real.
- Alterar role de membership via RPC real, quando `can_update_role` permite.
- Alterar status de membership via RPC real, quando `can_update_status` permite.
- Ler audit feed administrativo sanitizado.
- Ler checks operacionais reais ou indisponiveis quando nao houver fonte suficiente.

## Acoes bloqueadas ou fora do lote
- Criar convite formal por dominio dedicado, se futuramente houver entidade de convite.
- Resetar senha ou operar Auth administrativo pela UI.
- Expor payload bruto, logs sensiveis, headers, tokens ou endpoints.
- Criar dashboard externo de observabilidade.
- Criar App Shell unificado.

## Testes esperados
- `npm run supabase:db:reset`
- `npm run supabase:test:db`
- `npm run supabase:lint:db`
- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`
- `npm run supabase:qa:local-support-fixture`

## Riscos restantes
- Health checks ainda sao locais e derivados do estado do banco; observabilidade externa real exige lote proprio.
- Reset de senha e convite formal continuam sem contrato operacional dedicado.
- Motivo obrigatorio em toda mutacao de acesso pode ser adicionado em lote futuro se Produto exigir evidencia operacional mais granular.
