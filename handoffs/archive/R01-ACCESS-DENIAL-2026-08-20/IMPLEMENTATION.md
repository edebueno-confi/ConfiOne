# Implementation

## Task ID

R01-ACCESS-DENIAL-2026-08-20

## Implementador

Codex

## Base SHA

eece172fba56f290fa03b025d33263c3ac3f6528

## Implementation SHA

UNSET

## Resumo

Implementação em andamento do R-01. O `/inicio` agora consome o estado de
redirecionamento produzido pelo `AccessDeniedPage` e renderiza um aviso
não bloqueante com mensagem segura. Foi adicionado teste de contrato para
garantir que o estado é produzido e consumido.

## Decisões tomadas

- Concordar com R-01: o estado `fromAccessDenied` era escrito e nunca lido.
- Corrigir no consumidor (`HomePage`) para preservar o redirecionamento seguro e
  evitar alterar a política de autorização.
- Reutilizar `MinimalNotice` com tom de warning e mensagens por motivo conhecido.
- Não alterar R-03 nem qualquer outro finding.

## Arquivos adicionados

- `tests/scripts/access-denied-feedback.test.mjs`.

## Arquivos modificados

- `apps/web/src/features/home/HomePage.tsx`.

## Migrations

Nenhuma.

## Testes adicionados

- Contrato de feedback da negação de acesso em
  `tests/scripts/access-denied-feedback.test.mjs`.

## Comandos de validação executados

- `node --test tests/scripts/access-denied-feedback.test.mjs`.
- `npm run web:typecheck`.
- `npm run test:all`.
- `npm run lint`.
- `npm run web:build`.
- `npm run review:gates`.
- `npm run docs:validate`.
- `git diff --check`.

## Resultados

- Teste específico R-01: PASS, 1/1.
- `npm run web:typecheck`: PASS.
- `npm run test:all`: PASS, 551/551.
- `npm run lint`: PASS, 0 erros e 160 avisos legados.
- `npm run web:build`: PASS.
- `npm run review:gates`: PASS, 0 regressões; baseline preservado.
- `npm run docs:validate`: PASS sem bloqueios; 9 alertas preexistentes.
- `git diff --check`: PASS.
- O diff de produto deste lote está limitado a `HomePage.tsx`; o teste novo cobre
  a produção e o consumo do estado `fromAccessDenied`. R-03, R-11 e R-14 não foram
  alterados.

## Limitações conhecidas

Nenhuma identificada após os gates. A validação visual autenticada não foi
executada; o comportamento foi verificado pelo teste de contrato, typecheck e
build.

## Possíveis riscos

O aviso depende do estado real de navegação do React Router; navegações normais
para `/inicio` devem permanecer sem aviso.

## Itens que o reviewer deve observar

- Confirmar que o aviso aparece somente com `fromAccessDenied`.
- Confirmar que `reason` não expõe detalhes internos.
- Confirmar que o redirecionamento para `/inicio` permanece intacto.
- Confirmar que nenhum outro finding foi alterado.
