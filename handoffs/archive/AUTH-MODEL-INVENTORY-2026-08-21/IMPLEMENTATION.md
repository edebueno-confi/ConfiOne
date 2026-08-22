# IMPLEMENTATION

- Task ID: `AUTH-MODEL-INVENTORY-2026-08-21`
- State: `READY_FOR_REVIEW`
- Owner: `Forge`
- Reviewer active: `Sentinel`
- Base SHA: `76a7b867783c9303d2aca845c5b99b60c268377a`
- Implementation SHA: `UNCOMMITTED_WORKTREE`

O lote foi autorizado por `OD-007` e executado pelo Forge dentro da allowlist
documental. O inventário factual foi produzido em
`docs/specs/AUTHORIZATION_MODEL_INVENTORY_V1.md`. Nenhum código executável,
SQL, migration, policy, grant, secret ou serviço externo foi alterado.

## Resposta aos findings do Sentinel

- `F-AUTH-001` — corrigido. A seção 4.3 e a matriz distinguem o contrato
  estrutural histórico de `20260722221746` do runtime efetivo em
  `app_private.internal_actor_workspace_context()` e
  `rpc_internal_actor_workspace_context()`. O inventário agora registra que o
  runtime verifica profile/contexto interno ativo, grants de papel ou
  membership, tela publicada e capability; não valida diretamente
  `tenant_memberships.status`, `tenants.status` ou `permission_mode = profile`.
  A diferença entre grants de tela e grants de capability por perfil ficou
  registrada como lacuna.
- `F-AUTH-002` — corrigido. A matriz agora descreve o `CsGate` efetivamente
  envolvido pelo router, o bloqueio de `dashboard_viewer`, a carga da carteira,
  o fallback de plataforma e a proteção server-side por
  `can_access_cs_customer_portfolio()`/membership de Customer Success. A regra
  de `canOpenInternalRoute()` foi separada como utilitário não demonstrado como
  wrapper desse fluxo.
- `F-AUTH-003` — corrigido. Engenharia e Acionamentos agora aparecem com
  `ReleaseSurfaceGate` + `SupportGate`, conforme o router. As regras próprias
  de `canOpenInternalRoute()` foram classificadas como divergência a auditar,
  não como gate efetivo dessas rotas.

## Fontes e matriz produzida

- Fluxo frontend: `auth-context.tsx`, `auth-api.ts`, `AdminGate.tsx`,
  `ReleaseSurfaceGate.tsx`, `internal-route-access.ts`,
  `post-login-redirect.ts`, `AccessDeniedPage.tsx`, router e navegação.
- Contratos: `apps/web/src/contracts/admin-contracts.ts`.
- Backend: migrations de identidade/tenant, auth context, ACCESS-01, perfil de
  telas, CRUD operacional, convites, runtime read models e lifecycle V2.
- Testes: `supabase/tests/008_phase3_1_admin_auth_context.sql`,
  `084_access_01_internal_control_plane.sql`,
  `085_access_01_1_admin_operational_crud.sql`,
  `086_access_01_2_invites_saga.sql`,
  `086_access_01_4_runtime_read_models.sql`,
  `087_access_01_3_context_contract.sql`,
  `113_access_control_v2_lifecycle_effective_permissions.sql` e testes Node
  de deny, release, navigation e acesso administrativo.
- A seção 3 do inventário contém a matriz entidade, fonte, consumidor, escopo,
  evidência e lacuna. As seções 7 a 10 classificam estados, riscos, hipóteses
  e decisões pendentes sem converter hipótese em conclusão.

## Validações executadas

- `git diff --check` — PASS.
- `npm run docs:validate` — PASS, 0 documentos bloqueados; alertas de
  sensibilidade já existentes no catálogo interno.
- `node --test tests/scripts/access-denied-feedback.test.mjs` — PASS.
- `node --test tests/scripts/auth-admin-denial-root-cause.test.mjs` — PASS, 5/5;
  Supabase local e credenciais QA estavam disponíveis para os cenários
  somente leitura e login local previstos no teste.
- `node --test tests/scripts/access-control-v2-contract.test.mjs` — PASS, 3/3.
- `node --test tests/scripts/minimal-navigation.test.mjs tests/scripts/release-surface.test.mjs` — PASS, 34/34.
- Não foram executados typecheck, build, lint, pgTAP ou QA de navegador porque
  este lote não altera comportamento executável. O inventário não é prova de
  integração runtime atual.
- Após os findings: `git diff --check` — PASS; referências do inventário
  conferidas contra o RPC vigente, `CsGate`, `SupportGate` e router. A revisão
  independente do Sentinel é necessária para confirmar o fechamento.

## Limitações

- O worktree contém alterações rastreadas e não rastreadas preexistentes; não
  foi feito reset, clean, descarte ou stage amplo.
- A coleta não executou escrita de integração, alteração remota, migration ou
  mudança de perfil. Não há prova de comportamento em produção.
- A revogação durante uma sessão já carregada e a semântica completa de
  `READ/WRITE` ainda exigem a auditoria estrutural e a regressão de segurança.

## Entrega

- Estado solicitado: `READY_FOR_REVIEW` após responder F-AUTH-001,
  F-AUTH-002 e F-AUTH-003.
- Próximo responsável: Sentinel.
- O Sentinel deve revisar o inventário contra TASK, código, contratos, SQL,
  migrations, policies, grants e testes, sem alterar produto executável.
