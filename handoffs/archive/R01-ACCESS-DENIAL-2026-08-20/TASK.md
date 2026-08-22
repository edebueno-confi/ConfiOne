# Task

## Task ID

R01-ACCESS-DENIAL-2026-08-20

## Título

Restaurar feedback visível para negação de acesso

## Contexto

O finding R-01 do baseline identificou que `AccessDeniedPage.tsx` redireciona
sessões autenticadas para `/inicio` com `fromAccessDenied` e `reason`, mas nenhum
componente consumia esses dados. O usuário perdia o motivo do redirecionamento e
recebia apenas a recepção sem explicação.

## Objetivo

Restaurar feedback claro, não bloqueante e acessível para a negação de acesso,
preservando o redirecionamento seguro para `/inicio` e sem alterar regras de
autorização ou release surface.

## Escopo

- `apps/web/src/features/home/HomePage.tsx`.
- `tests/scripts/access-denied-feedback.test.mjs`.
- Consumir o estado `fromAccessDenied` e `reason` produzido por
  `AccessDeniedPage.tsx`.
- Renderizar aviso visível no `/inicio` com mensagem segura por motivo conhecido.

## Fora de escopo

- R-03 ou qualquer outro finding da fila.
- Alterar RLS, RPCs, migrations, contratos backend ou banco.
- Alterar a lógica de autorização, `AccessDeniedPage` ou release surface.
- Alterar `/inicio`, `/admin/tenants` ou landing padrão além do aviso autorizado.
- Commit, push, merge, deploy, migration remota ou alteração de secrets.

## Requisitos funcionais

- Quando a navegação autenticada carregar `/inicio` com `fromAccessDenied`, o
  usuário deve ver um aviso sobre a área não liberada.
- O aviso deve usar o `reason` conhecido para explicar o caso sem expor detalhes
  internos de implementação.
- Usuários que chegam normalmente ao `/inicio` não devem ver o aviso.
- O redirecionamento para `/inicio` continua não bloqueante e seguro.

## Requisitos técnicos

- Consumir o estado real do React Router, sem inventar endpoint ou permissão local.
- Reutilizar o componente visual `MinimalNotice` e o design system existente.
- Adicionar teste de contrato que cubra produção e consumo de `fromAccessDenied`.
- Não enfraquecer testes existentes nem alterar o baseline de quality gates.

## Critérios de aceitação

- O aviso é renderizado apenas quando `fromAccessDenied` estiver presente.
- O motivo `missing-authorized-workspace` ou desconhecido gera mensagem útil e
  segura.
- O teste do contrato de feedback passa.
- `npm run web:typecheck`, `npm run test:all`, `npm run review:gates` e
  `git diff --check` passam, quando executados.
- `STATUS.md` termina em `READY_FOR_REVIEW` com `Owner = Claude`.

## Documentos normativos aplicáveis

- `AGENTS.md`
- `docs/engineering/REVIEW_PROTOCOL.md`
- `handoffs/README.md`

## Riscos conhecidos

- O working tree contém alterações preexistentes extensas; somente as alterações
  do R-01 devem ser consideradas neste lote.
- A validação visual autenticada depende do servidor local e de credenciais QA;
  se indisponível, registrar a limitação sem declarar o fluxo como validado.

## Base commit SHA

eece172fba56f290fa03b025d33263c3ac3f6528

## Branch

main

## Responsável atual

Codex implementa e valida; Claude revisa após `READY_FOR_REVIEW`.

## Observações do proprietário

Este é o segundo item da fila autorizada. Não avançar para R-03, R-11 ou R-14
antes da aprovação formal deste lote.
