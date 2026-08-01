# AUTH_CONTEXT_STRATEGY.md

## Objetivo
Garantir que cada usuário acesse apenas o que deve, conforme papel global, tenant e domínio operacional.

## Tipos de usuário
- Internal Admin
- Support Agent
- Support Manager
- Engineering Member
- Engineering Manager
- Customer Contact
- Viewer/Auditor

## Contexto obrigatório
Toda operação deve saber:
- usuário autenticado;
- tenant atual;
- papel do usuário naquele tenant;
- escopo permitido;
- ação solicitada.

## Regras
- Usuário interno pode operar múltiplos tenants conforme permissão.
- Contato cliente só acessa dados do próprio tenant.
- Engenharia não deve ver dados sensíveis do cliente sem necessidade operacional.
- Suporte não deve alterar status técnico final sem permissão.
- Admin não significa bypass irrestrito sem auditoria.
- `platform_admin` inicial não nasce por policy aberta; ele é bootstrapado uma única vez por função privada e conexão de banco privilegiada.
- `tenant_admin` e `tenant_manager` nunca podem atuar fora do próprio tenant.
- `tenant_manager` não pode se autopromover nem promover outro usuário para `tenant_admin`.
- Usuário autenticado comum não cria membership.
- `profiles` aceita apenas autoedição de campos seguros: `full_name`, `avatar_url`, `locale` e `timezone`.
- Alterações de `email`, `is_active`, papéis e metadados críticos acontecem por backend/Auth controlado, nunca por edição livre do cliente.

## Backend
Permissões devem ser validadas no banco/RPC/policy, nunca apenas no frontend.

## Boundary entre Admin e Portal Cliente
- O Admin Console e o Portal Cliente reutilizam a mesma sessao Supabase do browser, mas nao compartilham gate, role efetiva nem tenant ativo.
- O gate administrativo deve continuar derivado exclusivamente de `vw_admin_auth_context`.
- O contexto customer-facing deve continuar derivado exclusivamente de `vw_customer_portal_auth_context` e dos read models/RPCs do portal.
- Troca de sessao entre customer-facing e admin nunca pode depender de limpar `localStorage` manualmente como solucao de produto.
- O tenant switching customer-facing implementado na fase 8.22 nao promove nem contamina contexto admin; `active_tenant_id` e resolvido por contrato backend em `customer_portal_user_preferences`, via `rpc_customer_set_active_tenant`, e revalidado contra membership real.
- A fase 8.24 formalizou a semantica multiaba do portal: `active_tenant_id` continua global por usuario customer-facing, `context_version` vem de `customer_portal_user_preferences.updated_at` e qualquer aba stale precisa revalidar antes de mutacao sensivel.
- Nenhuma superficie deve inferir permissao da outra: customer sem role admin vai para `access-denied`; admin sem membership customer-facing nao ganha contexto de portal.
- O gate de portal habilitado customer-facing e feito por `customer_account_features.feature_key = 'returns_portal'`; membership ativa sem esse gate nao basta para selecionar tenant no portal.
- A fase 8.25 formalizou a recuperacao de sessao customer-facing:
  - `rpc_customer_get_portal_session_status()` revalida o contexto operacional.
  - O provider do portal distingue `stale_context`, `session_expired`, `access_revoked`, `tenant_unavailable`, `network_retryable` e `fatal_error`.
  - Logout/expiracao limpam o contexto renderizado antes de qualquer nova mutacao.
  - Revogacao de membership ou desabilitacao de `returns_portal` nao cai em loop de refetch nem reaproveita dados antigos.
- A fase 8.26 endureceu a recuperacao de rede sem criar auth paralela:
  - timeout, `AbortError` e `Failed to fetch` entram em `network_retryable`.
  - `network_retryable` continua separado de `session_expired`, `access_revoked` e `tenant_unavailable`.
  - o portal bloqueia mutacoes e limpa a superficie operacional local quando a leitura falha por rede.
  - retry de contexto e sempre manual; nao existe loop automatico nem modo offline.

## Redirect pós-login por papel
- O redirect inicial pós-login deve resolver a área operacional do usuário antes de navegar.
- A ausência de `redirectTo` não pode cair em `/admin` por padrão para usuários não-admin.
- A matriz vigente é:
  - `platform_admin` -> `/admin`;
  - `support_manager` ou `support_agent` -> `/support/queue`;
  - membro ativo de área interna com membership autorizado -> `/internal-actions`;
  - `engineering_member` ou `engineering_manager` -> `/engineering`;
  - `customer_user` ou `customer_manager` com contexto portal ativo -> `/portal`;
  - usuário autenticado sem workspace autorizado -> `/access-denied`.
- `redirectTo` explícito só deve ser preservado quando a rota for compatível com o contexto autenticado atual; destino proibido cai no default do papel.
- A resolução de landing usa read models existentes (`vw_admin_auth_context`, `vw_customer_portal_auth_context` e `vw_internal_action_area_auth_context`) e não substitui os gates de rota.
- O contexto de área interna precisa diferenciar membership ativo sem acionamentos de ausência real de acesso. A fila `vw_internal_action_queue_by_area` continua sendo read model operacional de itens, mas não deve ser usada como prova única de workspace autorizado.
- Nenhum redirect pode inferir permissão por e-mail, `localStorage`, texto de UI ou mock.

## Estado da Fase 1.2
- Bootstrap do primeiro `platform_admin` implementado em `app_private.bootstrap_first_platform_admin(...)`.
- Verificação de status de bootstrap em `app_private.platform_admin_bootstrap_status()`.
- Fluxo operacional documentado em `supabase/bootstrap/README.md`.
- Hardening de `tenant_memberships` e `profiles` validado com pgTAP.
- Toda mutação administrativa de tenancy passa por `public.rpc_admin_*`, nunca por DML direto do app nas tabelas administrativas.
- `app_private.require_active_actor()` resolve o ator autenticado e bloqueia execução sem profile ativo.
- Funções `SECURITY DEFINER` usadas no control plane e na camada privada têm `SET search_path = ''` explícito.
- Helpers privados e triggers sem necessidade operacional exposta tiveram `EXECUTE` revogado de `public`, `anon` e `authenticated`.

## Matriz mínima vigente

### `platform_admin`
- Pode criar tenant.
- Pode alterar status de qualquer tenant.
- Pode adicionar e alterar memberships em qualquer tenant.
- Pode criar e atualizar contatos em qualquer tenant.

### `tenant_admin`
- Pode operar RPC administrativa apenas dentro do próprio tenant.
- Pode adicionar `tenant_manager`, `tenant_requester` e `tenant_viewer` no próprio tenant.
- Pode alterar role e status de memberships do próprio tenant, respeitando o escopo do vínculo.
- Pode criar e atualizar `tenant_contacts` do próprio tenant.

### `tenant_manager`
- Pode operar apenas dentro do próprio tenant.
- Pode gerenciar `tenant_requester` e `tenant_viewer`.
- Não pode criar `tenant_admin`.
- Não pode se autopromover.
- Não pode mover vínculo para outro `tenant_id`.

### Usuário autenticado comum
- Não pode usar RPC administrativa.
- Não pode criar membership.
- Mantém apenas leitura e autoedição segura do próprio `profile`, sob RLS e trigger de proteção.
# ACCESS-01 — Contexto interno explícito — 2026-07-27

O contexto interno passa a ser representado por `public.user_actor_contexts` com
`actor_type = internal`, status e primário. Membership de cliente não concede acesso
interno; ausência de contexto interno ativo resulta em deny by default. A autorização
efetiva combina release allowlist, capabilities e overrides auditáveis. O frontend
consome os read models, mas não decide precedência.
## ACCESS-01.1 — Control plane administrativo — 2026-07-27

`/admin/access` administra apenas colaboradores com `user_actor_contexts.actor_type = internal`.
Memberships de cliente, contatos HubSpot e usuários exclusivamente do Portal não entram
na listagem interna. A atribuição de área, função, perfil e override é executada por RPC
com capacidade `access.*.manage`, justificativa quando aplicável e auditoria de alteração.

O catálogo `internal_organizational_areas` é deliberadamente separado do catálogo legado
`internal_action_target_areas`: o primeiro organiza colaboradores; o segundo continua
governando roteamento de acionamentos. A compatibilidade entre ambos é mantida por um
`area_key` operacional seguro na membership, sem converter usuários clientes em internos.

Read models administrativos: `vw_admin_access_internal_users`, `vw_admin_access_invites`,
`vw_admin_access_areas`, `vw_admin_access_functions`, `vw_admin_access_profiles`,
`vw_admin_access_overrides` e `vw_admin_access_capabilities`.
