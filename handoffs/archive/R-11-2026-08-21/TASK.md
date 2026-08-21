# Task

## Task ID

R-11

## Project

ConfiOne

## Título

Corrigir scripts npm que apontam para arquivos inexistentes

## Contexto

O finding legado R-11, registrado em
`.review/verdicts/takeover-worktree-2026-08-19.md`, identifica 16 comandos do
`package.json` que apontam para arquivos `.mjs` ausentes. O baseline
`.review/baseline.json` registra esse débito em `NPM_SCRIPT_MISSING`.

O lote DEV-CONTROL-MVP foi aprovado pelo Claude no ciclo 5 e a fila foi
promovida atomicamente. Este é um lote independente e não deve alterar o
control plane aprovado nem código de produto.

## Objetivo

Eliminar as referências npm quebradas sem mascarar a dívida histórica:
restaurar somente scripts que ainda tenham contrato e consumidores verificáveis;
remover ou ajustar entradas comprovadamente descontinuadas; e deixar cada
comando mantido apontando para um arquivo existente e executável.

## Escopo

- Auditar as 16 referências listadas no baseline e no veredito legado.
- Verificar consumidores, documentação, testes e convenções existentes antes de
  decidir entre restaurar, ajustar ou remover cada entrada.
- Restaurar o runner `scripts/run-pgtap-file.mjs` se a investigação confirmar
  que `supabase:test:file` continua sendo a via focada oficial.
- Atualizar testes e documentação do próprio fluxo quando necessário para
  preservar o contrato real.
- Atualizar os quatro artefatos de `handoffs/current/`.

## Fora de escopo

- Alterar código de produto em `apps/web`, `packages/` ou `supabase/`.
- Corrigir R-14, policies, RLS, migrations remotas ou banco remoto.
- Criar scripts falsos, placeholders silenciosos ou comandos que apenas ocultem
  a ausência do arquivo.
- Atualizar dependências sem necessidade comprovada.
- Commit, push, merge, deploy ou release surface.

## Requisitos funcionais

- Cada script npm mantido deve resolver para um arquivo existente no checkout.
- A decisão sobre cada uma das 16 referências deve ser registrada com evidência
  em `IMPLEMENTATION.md`.
- `supabase:test:file` deve continuar focado em um arquivo pgTAP se a evidência
  confirmar que esse contrato ainda é usado.
- Remoções de scripts devem ser justificadas como descontinuação verificável,
  nunca usadas para esconder um recurso que ainda possui consumidores.

## Requisitos técnicos

- Reutilizar os padrões de execução e validação já existentes no repositório.
- Não executar migrations remotas, resetar banco ou escrever em serviços
  externos.
- Não reduzir o baseline nem alterar o resultado do quality gate para obter
  aprovação.
- Manter comandos sem interpolação insegura e sem exposição de secrets.

## Critérios de aceitação

- Não restam referências a arquivos inexistentes nos scripts npm mantidos.
- O gate `NPM_SCRIPT_MISSING` não apresenta regressão e as resoluções são
  evidenciadas sem alterar o baseline histórico para mascarar o resultado.
- O runner pgTAP focado, se mantido, possui teste ou validação real do contrato.
- Testes, lint, typecheck, build e gates aplicáveis passam, com limitações
  explicitamente registradas.
- O lote termina em `READY_FOR_REVIEW` com `Owner = Claude`.

## Documentos normativos aplicáveis

- `AGENTS.md`.
- `docs/engineering/REVIEW_PROTOCOL.md`.
- `docs/CODE_REVIEW_PROTOCOL_V1.md`.
- `handoffs/README.md`.
- `.review/baseline.json`.
- `.review/verdicts/takeover-worktree-2026-08-19.md`.

## Riscos conhecidos

- Algumas referências podem ser artefatos históricos sem consumidor atual; a
  remoção precisa ser distinguida da correção de um contrato ainda ativo.
- O worktree contém alterações preexistentes extensas. Nenhuma deve ser
  incorporada neste lote.
- O baseline legado deve permanecer preservado como histórico verificável.

## Base commit SHA

1ea22b20d9703b76c57aff53f7bee6e0c2c1ae93

## Branch

main

## Responsável atual

Codex implementa e valida; Claude revisa após `READY_FOR_REVIEW`.

## Observações do proprietário

Lote R-11 previamente autorizado na fila. Executar somente este finding e não
avançar para R-14 antes da aprovação formal.
