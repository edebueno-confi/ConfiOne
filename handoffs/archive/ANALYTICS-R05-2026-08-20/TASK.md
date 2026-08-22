# Task

## Task ID

ANALYTICS-R05-2026-08-20

## Título

Corrigir isolamento de operação no teste pgTAP de Analytics

## Contexto

O Review Cycle 0 identificou R-05 em `supabase/tests/110_analytics_operation_scope.sql`.
A asserção do teste usa a posição zero do array de estágios e falha quando o snapshot
real local altera a ordenação ou adiciona dados ao recorte.

## Objetivo

Corrigir somente a cobertura do escopo de operação no teste 110, sem alterar o
contrato do RPC, migrations ou código de produto.

## Escopo

- `supabase/tests/110_analytics_operation_scope.sql`.
- Corrigir a asserção posicional do breakdown por etapa.
- Adicionar contra-teste que prove que o pipeline Aftersale não aparece sob a
  operação Neotrust.

## Fora de escopo

- Qualquer outro finding R-01 a R-14.
- Qualquer migration, RPC, view, frontend, contrato ou release surface.
- Alteração de baseline ou enfraquecimento de asserção.

## Requisitos funcionais

- O pipeline `operation-scope-aftersale` retorna exatamente um ticket aberto no
  breakdown quando consultado com a operação `Aftersale`.
- O mesmo pipeline retorna `stages` vazio quando consultado com a operação
  `Neotrust`.

## Requisitos técnicos

- A correção não depende de posição fixa no array.
- O contra-teste valida isolamento usando o contrato público do RPC.
- A suíte pgTAP relevante e a suíte completa, quando executadas, devem passar sem
  reduzir cobertura ou alterar o baseline.

## Critérios de aceitação

- `docs/engineering/REVIEW_PROTOCOL.md`
- `.review/verdicts/takeover-worktree-2026-08-19.md`, seção R-05
- `docs/ARCHITECTURE_RULES.md`
- `docs/VALIDATION_CHECKLIST.md`
- `AGENTS.md`

## Documentos normativos aplicáveis

- `AGENTS.md`
- `docs/engineering/REVIEW_PROTOCOL.md`
- `handoffs/README.md`

## Riscos conhecidos

- O Supabase local precisa estar ativo.
- O banco local contém snapshot real que não pode ser apagado ou resetado neste lote.
- A suíte ampla pode expor falhas históricas fora do escopo; registrar sem corrigi-las.

## Base commit SHA

64103335a5fbe89dfb8d67730dc60a5cd5d78ec1

## Branch

main

## Responsável atual

Codex implementa e valida; Claude revisa após `READY_FOR_REVIEW`.

## Observações do proprietário

Não avançar para R-01 ou qualquer outro finding neste lote.

## Estado da execução

Codex corrigiu R-05 exclusivamente no teste pgTAP 110, adicionou o contra-teste
de isolamento entre Aftersale e Neotrust e concluiu as validações. O lote está
pronto para revisão do Claude.
