# Modelo contextual de severidade

Severidade mede impacto confirmado ou provável, não quantidade bruta de linhas. Status e severidade são dimensões independentes.

| Severidade | Critério | Bloqueia merge/release |
|---|---|---|
| CRÍTICO | problema confirmado com risco imediato, bypass de tenant/RLS, vazamento ou escrita indevida | sim |
| ALTO | problema confirmado ou altamente provável com contrato, autorização ou segurança relevante | somente quando confirmado |
| MÉDIO | risco provável, dúvida relevante ou contrato potencialmente instável | não automaticamente |
| BAIXO | melhoria localizada ou candidato de baixo impacto | não |
| INFORMATIVO | sinal heurístico, histórico corrigido ou hipótese que exige revisão | não |

## Status obrigatório

`candidate`, `probable`, `confirmed`, `dismissed`, `historical-fixed` e `requires-runtime-validation`.

Uma ocorrência textual nunca vira `confirmed` automaticamente. `historical-fixed` não deve gerar backlog para editar migration antiga; o contrato final deve ser auditado.

## Campos obrigatórios

Cada finding deve registrar:

- `detector`, `ruleVersion`, `mode` e `layer`;
- `ruleApplicability`, `status` e `contextStatus`;
- arquivo, linha/trecho, evidência, impacto e recomendação;
- confiança, `blocksMergeOrRelease` e `possibleFalsePositive`;
- `provenance` com tipo de análise, commit, timestamp e base de comparação.

O risco é calculado por findings `confirmed`, `probable` e candidatos ativos. A quantidade total de candidatos não pode, sozinha, produzir risco alto.
