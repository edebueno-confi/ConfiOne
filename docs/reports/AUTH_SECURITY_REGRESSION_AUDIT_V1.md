# Auditoria de regressão de segurança da autorização V1

Task: `AUTH-SECURITY-REGRESSION-2026-08-21`
Base: `f444a95`
Implementation: `UNCOMMITTED_WORKTREE`
Modo: validação local/read-only; nenhuma permissão, policy, claim, scope,
capability, RLS, RPC, migration, grant, secret, banco ou integração foi alterado.

## Critério de leitura

`PASS` abaixo significa evidência reproduzida no teste indicado. `PARCIAL`
significa que existe contrato ou evidência local, mas falta a dimensão ponta a
ponta. `NÃO COMPROVADO` significa que a validação exigiria escrita, sessão
carregada, ambiente remoto ou fixture que não pode ser criado nesta task.

| Cenário | Resultado | Evidência local | Limitação |
| --- | --- | --- | --- |
| Bypass de URL | PASS estático | `internal-route-access.ts:30-43` rejeita superfície não publicada antes do contexto; `auth-resolution-guards-navigation.test.mjs` 5/5 | Não houve browser autenticado contra cada URL |
| Cross-tenant | PARCIAL | `supabase/tests/001_phase1_identity_tenancy_rls.sql` e `003_phase1_2_admin_control_plane.sql` contêm cenários tenant/RPC; a task não executa pgTAP mutável | Não houve sessão read-only dedicada comparando dois tenants neste lote |
| WRITE | NÃO COMPROVADO | O escopo preserva RPCs/policies existentes; `admin-access-language-contract.test.mjs` confirma somente flags de UI | Validar escrita exigiria mutação controlada e não é permitido |
| Revogação | PARCIAL | `AdminGate.tsx:34-53` expõe encerramento e refresh; `auth-context.tsx:290-301` limpa e reconsulta o gate | Não houve revogação durante uma sessão de browser carregada |
| Sessão stale | PARCIAL | `auth-context.tsx:127-160,277-301` trata expiração, identidade e refresh | Não houve expiração real de token nem relógio manipulado |
| Usuário desativado | PASS local | `auth-api.ts:52-75` consulta contexto e classifica `inactive-profile`; `auth-admin-denial-root-cause.test.mjs` 5/5 | O teste confirma contrato e fixture local, não mudança remota de perfil |
| Último administrador | PASS histórico/contratual | `supabase/tests/002_phase1_1_hardening.sql:105-136` cobre bootstrap único de `platform_admin`; salvaguardas estão documentadas no relatório da task 36 | Não foi executada mutação para tentar remover o último admin |
| Menu/guard | PASS local | `auth-resolution-guards-navigation.test.mjs` valida menu publicado contra `canOpenInternalRoute`, rota não publicada e deny by default | É teste de contrato, não QA visual autenticado |
| Fallback de acesso negado | PASS contratual/local | `AccessDeniedPage.tsx:30-40` envia anônimo a login e autenticado a `/inicio`; `access-denied-feedback.test.mjs` 1/1 | O fluxo React integrado não foi renderizado neste lote |

## Fatos, hipóteses e lacunas

Fatos reproduzidos:

- O administrador local autenticado consultou `vw_admin_auth_context` e
  `rpc_internal_actor_workspace_context`; o teste confirmou sessão válida,
  `platform_admin` e `screenKeys=[]`, e abriu `/admin/analytics` e `/admin`.
- O usuário local sem autorização manteve a sessão e recebeu decisão negativa,
  sem alteração de perfil.
- Os quatro testes focused executados nesta task passaram em 14/14 testes no
  conjunto agregado: 5/5 + 1/1 + 5/5 + 3/3.
- O guard verifica publicação da rota antes da decisão de autorização e o menu
  é comparado contra o mesmo guard nos testes existentes.

Hipóteses não promovidas a incidente:

- Uma sessão stale pode produzir uma decisão antiga se o consumidor não chamar
  refresh; o código possui caminho de refresh/expiração, mas isso não foi
  reproduzido com sessão carregada.
- A cobertura cross-tenant existente pode ser suficiente para os contratos
  cobertos pelos pgTAP históricos, mas não comprova o fluxo atual completo de
  browser/read model nesta task.

Limitações explícitas:

- Não houve escrita local ou remota, execução de migration, alteração de
  fixture, revogação de usuário, remoção do último administrador ou teste de
  WRITE.
- Não houve QA visual, browser autenticado ponta a ponta, teste de rede/console
  ou validação em produção.
- O novo teste `auth-security-regression-contract.test.mjs` é uma regressão de
  contrato de fontes; ele não substitui autorização efetiva nem simula sessão.

## Gates

- `node --test tests/scripts/auth-resolution-guards-navigation.test.mjs`: PASS,
  5/5.
- `node --test tests/scripts/access-denied-feedback.test.mjs`: PASS, 1/1.
- `node --test tests/scripts/auth-admin-denial-root-cause.test.mjs`: PASS, 5/5,
  incluindo chamadas somente de leitura ao Supabase local.
- `node --test tests/scripts/auth-security-regression-contract.test.mjs`:
  PASS, 3/3.
- Gates finais registrados:

  - `npm run docs:validate`: PASS, 0 bloqueios; alertas documentais existentes
    permanecem apenas como alertas.
  - `npm run review:gates`: PASS, 0 regressões bloqueantes e 47 itens do
    baseline resolvidos.
  - `npm run web:typecheck`: PASS.
  - `npm run web:build`: PASS, 944 módulos transformados.
  - `npm run lint`: PASS, 0 erros e 160 warnings preexistentes.
  - `git diff --check`: PASS.
