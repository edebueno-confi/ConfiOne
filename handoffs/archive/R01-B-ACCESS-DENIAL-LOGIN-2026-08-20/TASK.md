# Task

## Task ID

R01-B-ACCESS-DENIAL-LOGIN-2026-08-20

## Título

Propagar feedback de negação no redirect pós-login

## Contexto

O review do lote `R01-ACCESS-DENIAL-2026-08-20` foi `APPROVED`, restrito ao
escopo declarado, e deixou o finding `R01-F01` aberto. O resolver de pós-login
calcula `denialReason: 'missing-authorized-workspace'` quando um perfil ativo
solicita uma rota sem permissão, mas devolve a landing padrão em `destination`.
O `LoginPage` trata qualquer `destination` como sucesso e descarta o motivo.

## Objetivo

Preservar o contexto de negação no caminho de login para que o redirect fallback
para `/inicio` renderize o mesmo feedback visível do lote R-01.

## Escopo

- `apps/web/src/features/login/LoginPage.tsx`.
- Novo helper puro de estado de navegação em
  `apps/web/src/features/auth/post-login-navigation.ts`.
- Teste comportamental em `tests/scripts/post-login-denial-feedback.test.mjs`.
- Artefatos canônicos deste handoff.
- Atualização da fila em `handoffs/README.md` para registrar R01-B ativo.

## Fora de escopo

- R-03, R-11, R-14 e qualquer outro finding.
- Alterar `post-login-redirect.ts` além do necessário para este finding.
- Alterar autorização, RLS, RPCs, migrations, banco ou release surface.
- Alterar `AccessDeniedPage.tsx` ou o comportamento de `/inicio` já aprovado.
- Publicar `/inicio` ou `/admin/tenants`.
- Commit, push, merge, deploy, migration remota ou alteração de secrets.

## Requisitos funcionais

- Quando `resolvePostLoginRedirect` retornar `destination` e
  `denialReason = 'missing-authorized-workspace'`, o `LoginPage` deve navegar
  para o destino fallback com `state.fromAccessDenied = true` e o motivo.
- Quando o destino for autorizado, o `Navigate` deve continuar sem estado de
  negação.
- Quando `destination` for nulo, o caminho existente para `/access-denied` deve
  permanecer intacto.
- O `/inicio` deve poder consumir o estado já implementado no lote R-01.

## Requisitos técnicos

- Reutilizar o tipo `PostLoginDenialReason` existente.
- Extrair apenas uma função pura e testável para construir o estado de
  navegação, sem importar React ou criar infraestrutura de teste paralela.
- O teste deve verificar comportamento para negação, sucesso e ausência de
  destino, além da ligação do `LoginPage` ao helper.
- Não enfraquecer o baseline nem alterar testes existentes para mascarar falhas.

## Critérios de aceitação

- O cenário de rota não autorizada no login produz estado
  `{ fromAccessDenied: true, reason: 'missing-authorized-workspace' }`.
- O cenário autorizado não produz estado de negação.
- O cenário sem destino continua usando `/access-denied` com o motivo existente.
- O teste comportamental dedicado passa.
- `npm run web:typecheck`, `npm run test:all`, `npm run review:gates` e
  `git diff --check` passam, quando executados.
- `STATUS.md` termina em `READY_FOR_REVIEW` com `Owner = Claude`.

## Documentos normativos aplicáveis

- `AGENTS.md`.
- `docs/engineering/REVIEW_PROTOCOL.md`.
- `handoffs/README.md`.
- `docs/AUTH_CONTEXT_STRATEGY.md`.
- `docs/PROJECT_STATE.md`.
- Decisão D-02 do proprietário, preservada no arquivo arquivado do lote R-01.

## Riscos conhecidos

- O worktree contém alterações preexistentes extensas, inclusive em arquivos de
  autenticação. Este lote deve alterar somente os arquivos listados no escopo.
- A eficácia final depende de `/inicio` continuar sendo a superfície publicada;
  D-02 permanece encerrada como regra de autorização de release, não como
  autorização de publicação.
- QA visual autenticado pode depender do servidor local e de credenciais; se não
  for executado, a limitação deve ser registrada sem inferir validação visual.

## Base commit SHA

c6bffd8c4a94d91714b9a14c2e285b5c37bf0727

## Branch

main

## Responsável atual

Codex implementa e valida; Claude revisa após `READY_FOR_REVIEW`.

## Observações do proprietário

Resolver exclusivamente `R01-F01`. Não abrir R-03 automaticamente após a
entrega. D-02 está encerrada: implementado não significa autorizado para
release.
