# Implementation

## Task ID

R-11

## Implementador

Codex

## Base SHA

1ea22b20d9703b76c57aff53f7bee6e0c2c1ae93

## Implementation SHA

UNCOMMITTED_WORKTREE

## Resumo

O finding `NPM_SCRIPT_MISSING` foi resolvido sem alterar código de produto. O
runner pgTAP focado foi restaurado, dois comandos foram apontados para utilitários
existentes e 13 comandos legados sem arquivo ou consumidor executável verificável
foram removidos do `package.json`.

## Resposta ao review cycle 1

### R11-F01 — MEDIUM — RESOLVIDO

Concordo com o finding. O teste passava uma entrada com separador Windows
diretamente para `buildPgTapCommand`, o que fazia o caso falhar em Linux e
comparar a entrada consigo mesma em Windows.

Correção aplicada em `tests/scripts/r11-npm-scripts.test.mjs`: o caso agora
passa `supabase/tests/001_phase1_identity_tenancy_rls.sql` por
`resolvePgTapPaths` e alimenta `buildPgTapCommand` com o caminho relativo
normalizado retornado pelo contrato real. A asserção compara o argumento final
com essa saída normalizada e preserva as verificações de `--local`, ausência de
`--linked` e ausência de `--db-url`. Nenhuma asserção foi removida ou enfraquecida.

Evidência após a correção:

- `node --test tests/scripts/r11-npm-scripts.test.mjs`: 3/3 PASS.
- `npm run test:all`: 566/566 PASS.
- `npm run review:gates`: 0 regressões bloqueantes; `NPM_SCRIPT_MISSING` total
  0, baseline 16 e 16 resolvidos sem alterar o baseline.

## Decisões tomadas

- Preservar `supabase:test:file` porque o veredito legado o identifica como a
  via oficial de pgTAP focado. O runner aceita apenas SQL existente dentro de
  `supabase/tests/` e sempre usa `supabase test db --local`.
- Restaurar `supabase:qa:local-support-fixture` para o caminho existente
  `supabase/qa/create-local-support-fixture.mjs`, confirmado também pelo
  histórico Git.
- Atualizar `local:qa:hubspot-discovery` para o utilitário existente
  `scripts/analytics/hubspot-coverage-discovery.mjs`.
- Remover apenas entradas sem arquivo correspondente e sem consumidor
  executável verificável no checkout. Não foram criados placeholders.

## Arquivos adicionados

- `scripts/run-pgtap-file.mjs`.
- `tests/scripts/r11-npm-scripts.test.mjs`.

## Arquivos modificados

- `package.json`.
- `handoffs/README.md`.
- `handoffs/current/TASK.md`.
- `handoffs/current/IMPLEMENTATION.md`.
- `handoffs/current/REVIEW.md`.
- `handoffs/current/STATUS.md`.

## Migrations

Nenhuma.

## Testes adicionados

- Verificação de que todos os scripts npm `node ... .mjs` apontam para arquivos
  existentes.
- Verificação multiplataforma do runner pgTAP, incluindo resolução do caminho
  relativo, path traversal, extensões inválidas e recusa de alvos remotos.

## Comandos de validação executados

- Investigação do baseline, do veredito legado, do histórico Git e dos
  consumidores executáveis.
- `node --test tests/scripts/r11-npm-scripts.test.mjs`.
- `npm run supabase:test:file -- supabase/tests/110_analytics_operation_scope.sql`.
- `npm run test:all`.
- `npm run lint`.
- `npm run web:typecheck`.
- `npm run web:build`.
- `npm run review:gates`.
- `npm run docs:validate`.
- `git diff --check`.
- `node --check scripts/run-pgtap-file.mjs` e
  `node --check tests/scripts/r11-npm-scripts.test.mjs`.

## Resultados

- Runner e contrato npm: PASS, 3/3, incluindo o caso de portabilidade corrigido
  no R11-F01.
- pgTAP focado: PASS, 1 arquivo e 9 testes.
- Suíte ampla: PASS, 566/566.
- Lint: PASS, 0 erros e 160 warnings preexistentes no workspace.
- Web typecheck: PASS, exit 0.
- Web build: PASS, exit 0.
- Review gates: PASS, 0 regressões bloqueantes; `NPM_SCRIPT_MISSING` caiu de
  16 para 0 e os 16 itens foram contabilizados como resolvidos contra o
  baseline histórico intacto.
- Documentação: PASS, 0 documentos bloqueados; alertas existentes preservados
  pelo modo dry-run.
- `git diff --check`: PASS, saída limpa.
- Sintaxe dos scripts adicionados: PASS.

## Limitações conhecidas

- A execução completa de pgTAP depende do banco local; o arquivo focado foi
  executado com sucesso. Nenhum banco remoto foi acessado.

## Possíveis riscos

- O baseline ainda registra 16 itens históricos, por desenho do quality gate; a
  resolução é observada como `resolvidos`, sem reescrever o baseline.
- Os 13 comandos removidos eram referências sem arquivo e sem consumidor
  executável verificável; eventual reativação futura exige tarefa própria.

## Itens que o reviewer deve observar

- Confirmar a matriz de 16 referências e a distinção entre restauração,
  correção de caminho e remoção justificada.
- Confirmar que o R11-F01 está fechado pela resolução do caminho antes da
  montagem do comando e que o teste permanece significativo em Linux e Windows.
- Confirmar que o runner não aceita path traversal nem alvo remoto.
- Confirmar que R-14, código de produto e release surface permaneceram fora do
  diff.

## Auditoria das 16 referências do finding

| Tratamento | Referência | Evidência |
| --- | --- | --- |
| Restaurado | `supabase:test:file` | `scripts/run-pgtap-file.mjs` novo; contrato validado com 9 testes pgTAP locais. |
| Caminho corrigido | `supabase:qa:local-support-fixture` | `supabase/qa/create-local-support-fixture.mjs` existe e o histórico Git confirma o caminho anterior. |
| Caminho corrigido | `local:qa:hubspot-discovery` | `scripts/analytics/hubspot-coverage-discovery.mjs` existe e é o utilitário de discovery ativo. |
| Removidos | `local:qa:commercial-pipeline-audit`, `local:qa:cs-b2b-ux-data-audit`, `local:qa:help-center-release-smoke`, `local:qa:settings-sources-delta-audit`, `local:qa:settings-ux-friction-audit`, `local:qa:hubspot-error-sanitization-smoke`, `local:qa:hubspot-catalog-service-identity-smoke`, `local:qa:dashboard-reconcile-hubspot-leases-smoke`, `local:qa:dashboard-sync-loading-smoke`, `local:qa:dashboard-visual-system-v1-preview`, `local:qa:dashboard-visual-density-v1-1-preview`, `local:qa:high-density-ui-rebuild-preview`, `local:qa:admin-configuration-visual-v1-preview` | Arquivos ausentes no checkout e nenhuma referência executável fora do próprio pacote, baseline e histórico de review. |
