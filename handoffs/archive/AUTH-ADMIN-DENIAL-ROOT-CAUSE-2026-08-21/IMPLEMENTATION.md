# IMPLEMENTATION

- Task ID: `AUTH-ADMIN-DENIAL-ROOT-CAUSE-2026-08-21`
- State: `COMPLETED`
- Owner: `Forge`
- Reviewer active: `Sentinel`
- Base SHA: `56e5fd3b0a5812fac6f22572f136b2feb82fd8e1`
- Current SHA: `0581660ae9b617845b66160dfa6059616cabecce`
- Implementation SHA: `0581660ae9b617845b66160dfa6059616cabecce`
- Final commit SHA: `0581660ae9b617845b66160dfa6059616cabecce`

## Plano

1. Confirmar branch, HEAD, worktree e a allowlist antes de tocar arquivos.
2. Reconstituir o fluxo de autenticação e autorização com evidência de código,
   contratos, rotas e testes existentes.
3. Reproduzir o caso de administrador válido recebendo `Acesso negado`, sem
   alterar estado remoto ou mascarar falhas.
4. Corrigir somente a causa mínima comprovada e adicionar regressão focada.
5. Executar os gates aplicáveis, registrar limitações e entregar a Sentinel.

## Estado da implementação

## Diagnóstico inicial

- `fetchAdminActorContext()` reconhece `platform_admin` por meio de
  `vw_admin_auth_context`, mas `canOpenInternalRoute()` exigia `screen_keys`
  para todas as rotas `/admin/*`.
- Isso criava uma contradição: o role global válido passava pelo gate inicial,
  mas um Admin Console publicado era enviado para `/access-denied` quando não
  havia grant de tela materializado.
- A correção foi limitada ao guard de rota: `platform_admin` pode abrir a
  superfície `/admin` publicada; roles não globais continuam sujeitos a
  `screen_keys` e deny by default.

## Alterações realizadas

- Adicionado o bypass mínimo condicionado a `platform_admin` em
  `internal-route-access.ts`.
- Expandida a regressão em `auth-admin-denial-root-cause.test.mjs` para login
  local, leitura autenticada de `vw_admin_auth_context`, chamada autenticada de
  `rpc_internal_actor_workspace_context`, montagem do contexto retornado pelo
  backend e passagem pelo guard usado por `AdminGate`.
- Adicionadas asserções de composição do `AdminGate` e do router para confirmar
  que `/admin` é protegido pelo gate e que `/admin/analytics` é uma rota filha
  real, além da preservação da sessão pela API Auth local.
- Nenhuma migration, RPC, RLS, contrato, release surface ou integração foi
  alterada.

## Resposta ao F-AUTH-001

- A regressão anterior com contexto literal permanece como teste unitário do
  guard. Ela não é mais a única evidência do lote.
- O novo caso behavior-level autentica o fixture local de `platform_admin`,
  confirma `id`, `is_active=true` e `roles` retornados por
  `vw_admin_auth_context`, consulta
  `rpc_internal_actor_workspace_context` e então constrói explicitamente o
  contexto autenticado com `screenKeys=[]`. Os cinco grants existentes do
  fixture são observados, mas não reutilizados, para que o teste falhe se o
  bypass de `platform_admin` for removido. Esse contexto sem grant passa
  `canOpenInternalRoute('/admin/analytics')` e `canOpenInternalRoute('/admin')`.
- O caso sem autorização usa um usuário local autenticável sem role
  administrativa. A view retorna perfil sem role administrativa, o RPC não
  retorna telas internas, o guard nega `/admin/analytics` e a consulta
  `/auth/v1/user` confirma que a sessão permanece ativa.
- A passagem equivalente por `AdminGate`/router foi verificada por contrato de
  composição: `AdminGate` chama o guard no estado autenticado pronto e o router
  monta `AdminGate` sobre `/admin`, com `analytics` como rota filha.
- Não existe no ambiente local uma credencial de fixture para perfil
  `profiles.is_active=false`. Por isso, não foi fabricado nem alterado estado
  para simular esse caso. A separação contratual continua coberta: `auth-api`
  devolve `inactive-profile`, `auth-context` transforma isso em gate negado e a
  `AccessDeniedPage` mantém a mensagem específica, sem encerrar a sessão.

## Validações executadas

- Reprodução pré-correção: a regressão nova falhou em
  `platform_admin` sem `screen_keys` (`false !== true`), confirmando o sintoma
  no guard de rota.
- Após a correção e a regressão behavior-level: `node --test
  tests/scripts/auth-admin-denial-root-cause.test.mjs` PASS, 5/5.
- Suíte focada de autorização e negação: `node --test
  tests/scripts/auth-admin-denial-root-cause.test.mjs
  tests/scripts/access-denied-feedback.test.mjs
  tests/scripts/post-login-denial-feedback.test.mjs
  tests/scripts/release-surface.test.mjs
  tests/scripts/access-control-v2-contract.test.mjs` PASS, 42/42.
- `npm run web:typecheck` PASS.
- `npm run web:build` PASS, 945 módulos compilados.
- `npm run lint` PASS, 0 erros e 160 warnings preexistentes.
- `npm run review:gates` PASS, 0 regressões bloqueantes e 45 itens do baseline resolvidos.
- `npm run docs:validate` PASS, 0 documentos bloqueados; alertas heurísticos documentais permanecem.
- `node .agents/skills/genius-documentation-governance/scripts/validate-governance-skill.mjs` PASS.
- `git diff --check` PASS.

## Evidência de backend e segurança

- `vw_admin_auth_context` continua filtrando `profiles` por `auth.uid()` e
  expondo os roles globais do próprio usuário.
- `rpc_internal_actor_workspace_context()` continua sendo a entrada autenticada
  para os grants de workspace; a migration existente
  `20260727173000_access_01_3_workspace_context_runtime_hardening.sql` mantém a
  avaliação em função `security definer` privada após a falha anterior do read
  model sob RLS.
- Nenhuma migration, RPC, RLS, contrato ou release surface foi alterada neste
  lote. Usuários sem role/workspace continuam negados no teste de regressão.

Os gates finais foram executados após a correção e permanecem limitados ao lote
atual. A suíte ampla não foi usada como critério adicional porque o worktree
contém alterações paralelas fora da allowlist.

## Limitações e riscos

- A reprodução autenticada pode depender de um ambiente local configurado e de
  um usuário de teste válido; se isso impedir a reprodução, a limitação será
  registrada sem inventar evidência.
- Não serão executadas escritas remotas, alterações de secrets, deploys ou
  migrations remotas.
