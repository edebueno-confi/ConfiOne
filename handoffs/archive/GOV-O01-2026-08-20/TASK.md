# Task

## Task ID

GOV-O01-2026-08-20

## Título

Resolver O-01 e ajustes de governança identificados no review

## Contexto

O finding O-01 identificou divergência entre `.review/README.md`, que declara
`baseline.json` e `verdicts/<lote>.md` como versionados, e o estado real do Git.
`.review/baseline.json` e `.review/verdicts/takeover-worktree-2026-08-19.md`
existem no checkout, mas aparecem como não rastreados. O review também registrou
G-01, uma regressão de indentação em `handoffs/README.md`, e O-02, uma instrução
indevida no `STATUS.md` sobre o veredito do reviewer.

## Objetivo

Corrigir O-01 e os dois ajustes de governança autorizados pelo proprietário,
tornando versionados os artefatos necessários para reproduzir os quality gates,
preservando o baseline legado e removendo a instrução indevida do handoff.

## Escopo

- `.review/baseline.json`.
- `.review/verdicts/takeover-worktree-2026-08-19.md`.
- `.gitignore`, incluindo `/.review/context/`.
- `handoffs/README.md`, para registrar a fila autorizada sem criar infraestrutura
  paralela.
- `handoffs/current/TASK.md`.
- `handoffs/current/IMPLEMENTATION.md`.
- `handoffs/current/STATUS.md`.
- Confirmar a coerência com `.review/README.md` e a ausência de ignore aplicável.

## Fora de escopo

- Qualquer código de produto, migration, contrato, teste de produto ou release surface.
- Alterar o conteúdo de `.review/baseline.json`.
- Alterar ou reescrever o veredito histórico e os findings R-01 a R-14.
- Corrigir R-01, R-03, R-11, R-14 ou qualquer outro finding fora de G-01/O-02.
- Push, merge, deploy, alteração de secrets ou alteração remota.

## Requisitos funcionais

- O baseline histórico continua integralmente preservado.
- O veredito do takeover continua integralmente preservado, incluindo R-01 a R-14.
- O `STATUS.md` não contém regra sobre qual resultado o reviewer pode declarar.
- A regra `/.review/context/` está presente no `.gitignore` e será integrada com o
  lote de governança.
- Os dois artefatos passam a fazer parte do diff destinado ao conjunto versionado
  declarado em `.review/README.md`.

## Requisitos técnicos

- Não gerar novo baseline nem modificar contagens, chaves, severidades ou findings.
- Não alterar `.review/README.md`, pois sua declaração já corresponde à solução
  tecnicamente correta de versionar os artefatos.
- Registrar a fila autorizada em `handoffs/README.md`, mantendo R-01, R-03, R-11 e
  R-14 como lotes futuros separados e sem iniciar sua implementação.
- Corrigir G-01 e O-02 somente nos artefatos de governança indicados pelo review.
- Confirmar validade estrutural do JSON e referências do veredito.
- Executar quality gates, validação documental e `git diff --check`.

## Critérios de aceitação

- O diff lista os dois artefatos `.review` como adições destinadas ao Git.
- Hashes e conteúdo histórico permanecem inalterados durante o lote.
- `npm run review:gates` não apresenta novas regressões contra o baseline existente.
- `npm run docs:validate` conclui sem bloqueios.
- `STATUS.md` termina em `READY_FOR_REVIEW` com `Owner = Claude`.
- A fila autorizada aparece em `handoffs/README.md` na ordem O-01, R-01, R-03,
  R-11 e R-14, com regra de avanço somente após `APPROVED`.
- A formatação do item 9 está correta e `/.review/context/` aparece no diff do lote.

## Documentos normativos aplicáveis

- `AGENTS.md`
- `docs/engineering/REVIEW_PROTOCOL.md`
- `handoffs/README.md`

## Riscos conhecidos

- O working tree possui alterações preexistentes extensas; somente os dois artefatos
  `.review` e os documentos correntes desta TASK podem ser considerados neste lote.
- Sem commit autorizado, a confirmação definitiva por clone limpo ficará para a
  integração posterior; o diff preparado deve ser revisado pelo Claude.

## Base commit SHA

dfb3bc249a219da7630dd27b8f730743be0f77c5

## Branch

main

## Responsável atual

Codex implementa e valida; Claude revisa após `READY_FOR_REVIEW`.

## Observações do proprietário

Preservar integralmente o baseline legado e os findings R-01 a R-14. O proprietário
autoriza um commit exclusivo deste lote, sem push, merge ou deploy.
