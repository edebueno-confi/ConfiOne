# REVIEW: AUTH-ADMIN-DENIAL-ROOT-CAUSE-2026-08-21

## Veredito

`APPROVED`

## Identificação

- Reviewer: Sentinel (Codex Independent Reviewer)
- Task ID: `AUTH-ADMIN-DENIAL-ROOT-CAUSE-2026-08-21`
- Estado revisado: `READY_FOR_REVIEW`
- Base SHA declarado: `56e5fd3b0a5812fac6f22572f136b2feb82fd8e1`
- HEAD efetivamente revisado: `cc05136a6a777b340bae113d4afd051402d3d2a2`
- Implementation SHA: `UNCOMMITTED_WORKTREE`
- Re-review incremental após `CHANGES_REQUESTED`

## Funcionalidade implementada ou melhorada

O fluxo de autorização do Admin Console foi corrigido para que um
`platform_admin` válido possa abrir a superfície `/admin` publicada mesmo sem
grants de tela materializados. Perfis não globais continuam sujeitos a
`screen_keys`, e rotas não publicadas continuam bloqueadas.

## Finding resolvido

### F-AUTH-001 — HIGH — Regressão behavior-level não comprovava a causa raiz sem grant

**Status:** `RESOLVED`

**Evidência da resolução:**

- `tests/scripts/auth-admin-denial-root-cause.test.mjs:88-121` autentica o
  fixture local, confirma `id`, `is_active=true` e `platform_admin` vindos de
  `vw_admin_auth_context` e consulta o RPC autenticado de workspace.
- Os cinco grants existentes do fixture não são reutilizados. O teste monta
  explicitamente o contexto autenticado com `screenKeys=[]` e afirma esse
  conjunto antes de validar `canOpenInternalRoute('/admin/analytics')` e
  `canOpenInternalRoute('/admin')` como verdadeiros.
- O teste behavior-level passa mesmo sem grants e, portanto, falha se o bypass
  específico de `platform_admin` for removido.
- `tests/scripts/auth-admin-denial-root-cause.test.mjs:124-151` mantém o caso
  de usuário local sem autorização, confirma ausência de telas administrativas,
  nega a rota e confirma que a sessão continua ativa.
- As linhas 153-165 preservam a distinção contratual de perfil inativo,
  sessão, recepção e `AccessDeniedPage`. Não existe fixture local seguro para
  alterar ou autenticar um perfil `is_active=false`; essa limitação foi
  explicitada sem fabricar estado.

## Revisão independente

- `apps/web/src/features/auth/internal-route-access.ts:39-44` mantém o gate da
  superfície publicada como primeira decisão; rotas ocultas permanecem
  bloqueadas.
- `apps/web/src/features/auth/internal-route-access.ts:65-72` aplica o bypass
  somente a `platform_admin`; os demais perfis continuam sujeitos a
  `screen_keys` e deny by default.
- `apps/web/src/features/auth/auth-api.ts:47-114` continua obtendo o contexto
  pela view/RPC autenticadas e filtrando perfil ativo.
- Não foram identificadas alterações de migration, RPC, RLS, contrato ou
  integração no lote revisado. A fonte do role continua vinculada ao usuário
  autenticado e não a e-mail ou estado controlado pelo frontend.
- O diff funcional revisado permanece dentro da allowlist declarada; o
  worktree amplo contém alterações paralelas que não foram incorporadas ao
  veredito.

## Gates independentes

- `node --test tests/scripts/auth-admin-denial-root-cause.test.mjs` — PASS;
  5/5 na repetição isolada.
- Suíte focada de autorização/negação/release — PASS; 42/42.
- `npm run web:typecheck` — PASS.
- `npm run web:build` — PASS; 945 módulos transformados.
- `npm run lint` — PASS; 0 erros e 160 warnings legados.
- `npm run review:gates` — PASS; 0 regressões bloqueantes e 45 itens do
  baseline resolvidos.
- `npm run docs:validate` — PASS; 0 documentos bloqueados e alertas
  heurísticos preexistentes preservados.
- `git diff --check` — PASS.

## Limitações e segurança

- Uma execução concorrente anterior do teste autenticado retornou
  `JWT issued at future`; a repetição isolada passou 5/5. O evento foi tratado
  como instabilidade temporal do ambiente local e permanece registrado, sem
  mascarar a falha.
- QA visual/browser completo não foi executado; os testes validaram APIs
  locais, composição do guard e contratos de router/AdminGate.
- O preflight e o diff scan automatizados do `codex-security` não puderam ser
  executados: o ambiente não possui `python`/`py` e o conector TAC estava
  indisponível. A revisão manual de autorização, origem do role, ordem dos
  gates, release surface e isolamento não encontrou novo risco bloqueante.
- Não houve escrita remota, alteração de secrets, deploy, migration remota,
  push, merge ou release.

## Decisão operacional

- State: `APPROVED`
- Owner: `Forge`
- Role: `EXECUTOR`
- Reviewer active: `Sentinel`
- Forge está autorizado a finalizar localmente o lote aprovado, limitado à
  allowlist, arquivar o handoff e normalizar o próximo estado.
- Push, merge, deploy, migration remota, alteração de secrets e release
  continuam proibidos.
