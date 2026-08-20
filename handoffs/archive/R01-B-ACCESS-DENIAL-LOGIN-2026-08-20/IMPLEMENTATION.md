# Implementation

## Task ID

R01-B-ACCESS-DENIAL-LOGIN-2026-08-20

## Implementador

Codex

## Base SHA

c6bffd8c4a94d91714b9a14c2e285b5c37bf0727

## Implementation SHA

UNCOMMITTED_WORKTREE

## Resumo

O lote corrige exclusivamente o caminho de login que descartava
`denialReason` quando um perfil ativo era enviado para a landing fallback após
solicitar uma rota sem permissão.

## Decisões tomadas

- Preservar `destination` e anexar o estado de negação somente quando
  `denialReason` existir.
- Manter o fluxo existente para `destination = null`, que continua navegando
  para `/access-denied`.
- Usar helper puro para tornar o contrato de estado diretamente testável.

## Arquivos adicionados

- `apps/web/src/features/auth/post-login-navigation.ts`.
- `tests/scripts/post-login-denial-feedback.test.mjs`.

## Arquivos modificados

- `apps/web/src/features/login/LoginPage.tsx`.
- `handoffs/README.md`.
- `handoffs/current/TASK.md`.
- `handoffs/current/IMPLEMENTATION.md`.
- `handoffs/current/REVIEW.md`.
- `handoffs/current/STATUS.md`.

## Migrations

Nenhuma.

## Testes adicionados

- Teste comportamental do helper de navegação para negação, sucesso e destino
  ausente, com contrato de ligação ao `LoginPage`.

## Comandos de validação executados

- `node --test tests/scripts/post-login-denial-feedback.test.mjs`.
- `npm run web:typecheck`.
- `npm run test:all`.
- `npm run lint`.
- `npm run web:build`.
- `npm run review:gates`.
- `npm run docs:validate`.
- `git diff --check`.

## Resultados

- Teste comportamental dedicado: PASS, 2/2.
- `npm run web:typecheck`: PASS, exit 0.
- `npm run test:all`: PASS, 553/553, exit 0.
- `npm run lint`: PASS, 0 erros e 160 avisos preexistentes.
- `npm run web:build`: PASS, Vite produziu o bundle web.
- `npm run review:gates`: PASS, 0 regressões; baseline preservado; 1 item
  histórico resolvido.
- `npm run docs:validate`: PASS, 0 bloqueios e 9 alertas preexistentes.
- `git diff --check`: PASS.

Os gates não executaram reset, migration remota, deploy ou escrita externa.

## Limitações conhecidas

Não foi executado QA visual autenticado no navegador; o teste comportamental,
typecheck e build cobrem o contrato implementado, mas não substituem a
validação visual em runtime.

## Possíveis riscos

O aviso depende de o `LoginPage` encaminhar o estado ao mesmo destino `/inicio`
que já é consumido pelo lote R-01. O caminho de login sem destino continua
usando `/access-denied`.

## Itens que o reviewer deve observar

- Confirmar que o motivo só é anexado quando `denialReason` existir.
- Confirmar que o caminho de perfil inativo não foi convertido em landing
  silenciosa.
- Confirmar que o teste comportamental cobre negação e sucesso.
- Confirmar que nenhuma alteração de R-03 ou da release surface entrou neste
  lote.
