# REVIEW

## Veredito formal

- Task ID: `R1-MY-SPACE-SAFE-LANDING-2026-08-21`
- Reviewer: Sentinel (Codex Independent Reviewer)
- Review mode: `SENTINEL_REQUIRED`
- Estado revisado: `READY_FOR_REVIEW`
- Base SHA: `cce0fdd`
- Implementation SHA: `UNCOMMITTED_WORKTREE`
- Funcionalidade revisada: contrato de landing segura `Meu Espaço`, retorno de
  Acesso Negado e separação de estados de autenticação.
- Decisão: `CHANGES_REQUESTED`

### Resumo do que foi entregue

O lote adicionou `tests/scripts/my-space-safe-landing.test.mjs` e atualizou os
handoffs. O teste verifica estaticamente o fallback textual para `/inicio`, o
retorno autenticado de Acesso Negado e fases do `AdminGate`. Não houve alteração
de runtime neste lote.

### Validações independentes

- `node --test tests/scripts/my-space-safe-landing.test.mjs`: 3/3 PASS.
- `git diff --check`: PASS.
- O diff contra `cce0fdd` foi conferido: o teste e os handoffs são as mudanças
  atribuídas ao lote; alterações amplas restantes do worktree foram preservadas
  como preexistentes e não foram consideradas parte da entrega.
- Gates registrados pelo Forge: focused 9/9, `web:typecheck`, `web:build`
  (944 módulos), lint (0 erros/160 warnings legados), `docs:validate` e
  `review:gates` sem regressões bloqueantes.

### Findings

#### F-MYSPACE-001 — HIGH — `/inicio` não é uma landing universal no runtime

**Evidência:** `apps/web/src/app/release-surface.mjs` define
`FIRST_RELEASE_LANDING_ROUTE = '/admin/analytics'` e o redirect técnico
`'/inicio' -> '/admin/analytics'`. O router registra `/inicio` dentro de
`ReleaseSurfaceGate` e `SupportGate` (`apps/web/src/app/router.tsx`). O
`ReleaseSurfaceGate` aplica o redirect antes da renderização. Em seguida,
`SupportGate` nega um usuário autenticado que não seja administrador, operador
de Suporte ou não tenha uma tela de Suporte autorizada, enviando-o para
`/access-denied`. A página de Acesso Negado, para sessão autenticada, retorna
para `/inicio` (`apps/web/src/features/auth/AccessDeniedPage.tsx`).

**Impacto:** um usuário interno autenticado sem acesso a Suporte/Analytics não
recebe a superfície neutra prometida. O fluxo pode repetir
`/inicio -> /admin/analytics -> /access-denied -> /inicio`, violando os
critérios de landing válida, ausência de loop e fallback sem bypass.

**Correção esperada:** alinhar o contrato real de release, router e guards para
que `/inicio` seja uma superfície publicada e segura para o usuário autenticado
sem exigir capacidade de Suporte ou Analytics, ou alterar explicitamente a
especificação para outro destino que tenha autorização universal. Adicionar um
teste determinístico que percorra a combinação sem workspace/sem capacidade de
Suporte e prove terminação do fallback.

#### F-MYSPACE-002 — MEDIUM — teste focalizado não cobre a fonte que invalida o contrato

**Evidência:** `tests/scripts/my-space-safe-landing.test.mjs` lê
`internal-route-access.ts`, `post-login-redirect.ts`, `AdminGate.tsx`,
`AccessDeniedPage.tsx` e `HomePage.tsx`, mas não lê nem executa
`release-surface.mjs`, `ReleaseSurfaceGate.tsx`, `router.tsx` ou
`SupportGate.tsx`. As asserções principais são `assert.match` sobre texto e a
função isolada `buildPostLoginNavigation`; nenhuma renderização, composição de
rotas ou resolução de redirect é executada.

**Impacto:** os 3/3 passam mesmo com `/inicio` redirecionando para uma tela
restrita e com o gate que pode negar o próprio fallback. Portanto, os 9/9
registrados não comprovam os critérios de menu/guard/landing, ausência de loop
ou comportamento para usuário sem workspace.

**Correção esperada:** depois de corrigir F-MYSPACE-001, ampliar o teste para
validar a composição efetiva do release gate, router e gate de autorização, ou
registrar explicitamente essa validação como não coberta e remover as alegações
de PASS correspondentes do handoff.

### Limitações preservadas

Não houve QA visual ou browser autenticado ponta a ponta. Não foram executadas
chamadas externas, escritas em banco, alterações de autorização, produção,
secrets, migrations remotas, deploy, push ou merge.

### Próximo passo

Owner devolvido ao Forge para responder F-MYSPACE-001 e F-MYSPACE-002. Após nova
entrega em `READY_FOR_REVIEW`, Sentinel fará re-review incremental.

## Re-review incremental

- Reviewer: Sentinel (Codex Independent Reviewer)
- Estado revisado: `READY_FOR_REVIEW`
- Base SHA: `cce0fdd`
- Implementation SHA: `UNCOMMITTED_WORKTREE`
- Findings F-MYSPACE-001 e F-MYSPACE-002: resolvidos nesta revisão.
- Decisão: `CHANGES_REQUESTED`

### Evidência da correção

O diff real agora inclui `release-surface.mjs`, `router.tsx`, o novo
`ReceptionGate.tsx`, o teste focused e os handoffs. O manifest publica `/inicio`,
remove o redirect para Analytics e define `/inicio` como landing. O router usa
`ReceptionGate` em `/inicio`, sem `SupportGate`. O teste passou a executar o
manifest real e a verificar essa composição.

### Validações independentes

- `npm run web:typecheck`: PASS.
- `node --test tests/scripts/my-space-safe-landing.test.mjs`: 4/4 PASS.
- `git diff --check`: PASS.
- Gates registrados pelo Forge: focused 12/12, build 945 módulos, lint sem
  erros, `docs:validate` PASS e `review:gates` PASS sem regressões bloqueantes.
- A falha ampla de `release-surface` referente a `/admin/tenants` foi mantida
  como limitação preexistente fora deste lote, não usada para reprovar a
  correção de `/inicio`.

### Novo finding

#### F-MYSPACE-003 — HIGH — `ReceptionGate` ignora sessão expirada

**Evidência:** `apps/web/src/features/auth/ReceptionGate.tsx:8-16` lê somente
`phase`. O contrato de autenticação expõe `sessionExpired` separadamente em
`apps/web/src/features/auth/auth-context.tsx:37-48`, e o código chama
`markSessionExpired()` em vários fluxos quando a sessão deixa de ser válida.
Enquanto `phase` ainda é `authenticated` e `sessionExpired` é verdadeiro, o
gate retorna os filhos sem exibir estado de sessão expirada, sem pedir login e
sem bloquear a superfície.

**Impacto:** a landing pode continuar renderizando shell e dados previamente
carregados depois de expiração/revogação detectada. Isso contradiz o requisito
de uma landing segura e a separação dos estados de autenticação; também pode
oferecer links para rotas operacionais em uma sessão já inválida.

**Correção esperada:** fazer `ReceptionGate` consumir o mesmo estado
`sessionExpired` usado pelos gates existentes e apresentar o estado explícito
de sessão expirada, com ação de retorno ao login ou encerramento da sessão.
Adicionar regressão determinística para `phase=authenticated` com
`sessionExpired=true`, sem depender de browser autenticado.

### Inconsistência de evidência

#### F-MYSPACE-004 — MEDIUM — IMPLEMENTATION desatualizado em relação ao diff

`handoffs/current/IMPLEMENTATION.md:27` afirma que não houve alteração de
runtime, mas o diff desta entrega altera `release-surface.mjs` e `router.tsx` e
adiciona `ReceptionGate.tsx`. O mesmo documento ainda registra teste novo 3/3
nas linhas 41-42, enquanto a execução atual foi 4/4 e o Forge reporta focused
12/12.

**Correção esperada:** atualizar a matriz de allowlist, arquivos alterados,
comandos e contagens para refletir o lote real antes da próxima entrega.

### Limitações preservadas

Não houve QA visual ou browser autenticado ponta a ponta. Não foram executadas
chamadas externas, escritas em banco, alterações de autorização, produção,
secrets, migrations remotas, deploy, push ou merge.

### Próximo passo

Owner permanece com o Forge para responder F-MYSPACE-003 e F-MYSPACE-004 e
devolver `READY_FOR_REVIEW`. Não finalizar ou arquivar antes de novo veredito.

## Re-review final

- Reviewer: Sentinel (Codex Independent Reviewer)
- Estado revisado: `READY_FOR_REVIEW`
- Base SHA: `cce0fdd`
- Implementation SHA: `UNCOMMITTED_WORKTREE`
- F-MYSPACE-001: RESOLVED. `/inicio` está publicado, é a landing do release e
  não usa o `SupportGate`.
- F-MYSPACE-002: RESOLVED. O focused verifica o manifest, a composição do
  router, o `ReceptionGate` e a ausência do ciclo anterior.
- F-MYSPACE-003: RESOLVED. `ReceptionGate` bloqueia `sessionExpired` com
  `SessionExpiredState` e ações seguras, com regressão focused correspondente.
- F-MYSPACE-004: RESOLVED. `IMPLEMENTATION.md` agora reconcilia o runtime
  alterado, a allowlist e as contagens de validação.
- Decisão: `APPROVED`

### Validações independentes finais

- `node --test tests/scripts/my-space-safe-landing.test.mjs`: 4/4 PASS.
- `npm run web:typecheck`: PASS.
- `git diff --check`: PASS.
- Gates registrados pelo Forge: focused 12/12, build 945 módulos, lint sem
  erros, `docs:validate` PASS e `review:gates` PASS sem regressões bloqueantes.
- A falha ampla preexistente de `release-surface` para `/admin/tenants` foi
  mantida fora do lote e não altera este veredito.

### Ganho para o produto

Usuários internos autenticados sem acesso a uma área operacional passam a ter
uma entrada neutra e terminante em `/inicio`, sem redirecionamento indevido
para Analytics, sem exigir permissão de Suporte e sem liberar rotas
operacionais. Expiração de sessão apresenta estado explícito antes do shell,
reduzindo risco de exibir uma superfície com credencial inválida.

### Limitações

Não houve QA visual ou browser autenticado ponta a ponta. A validação é
contratual e estática, além de typecheck e testes focados. Não foram executadas
chamadas externas, escritas em banco, alterações remotas, produção, secrets,
migrations remotas, deploy, push ou merge.

### Próximo passo

Task aprovada. Owner devolvido ao Forge para `FINALIZE_LOCAL`, stage seletivo,
commit local exclusivo e arquivamento conforme o protocolo. Push, merge,
deploy e release continuam proibidos.
