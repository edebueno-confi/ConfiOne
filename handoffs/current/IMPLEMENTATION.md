# Implementation

## Task ID

R-14

## Implementador

Codex

## Base SHA

53e705c

## Implementation SHA

UNCOMMITTED_WORKTREE (finalização local autorizada; governança em `d892038`)

## Resumo

O finding R-14 foi resolvido sem alterar código de produto, migrations, RLS,
policies ou grants. A declaração versionada lista exatamente as 19 tabelas
detectadas pelo gate, registra a razão de cada deny-all e o teste confere essa
lista contra as migrations. O suporte existente do quality gate foi
materializado no lote para que a allowlist não dependa de arquivo apenas local.

### Resposta ao finding R14-F01

Concordo. `scripts/review/collect-review-context.mjs` e os scripts auxiliares
`review:context`, `review:gates:json` e `review:gates:baseline` não são
necessários para o finding R-14. Eles permanecem preservados no worktree como
trabalho preexistente, mas foram separados do conjunto de arquivos do lote.
O comando `review:gates:baseline` não foi executado e `.review/baseline.json`
permaneceu intacto. O inventário abaixo passa a distinguir o suporte mínimo do
R-14 das alterações preexistentes do `package.json`.

### Finalização local

O proprietário autorizou a transição automática `APPROVED -> FINALIZE_LOCAL`.
O checkpoint de governança `d892038` materializou os estados e a proteção de
staging seletivo. O commit do R-14 permanece separado e conterá somente sua
allowlist, gate, teste, contrato `review:gates` e os quatro artefatos do
handoff, sem absorver mudanças preexistentes.

## Decisões tomadas

- Manter as 19 tabelas sem policy: as migrations habilitam RLS e revogam acesso
  de `public`, `anon` e `authenticated`; algumas mantêm somente a fronteira
  `service_role` para workers e outras são consultadas por funções internas de
  autorização.
- Declarar a intenção em `.review/rls-deny-all-allowlist.json`, com versão,
  lista determinística e motivo individual. A allowlist não concede acesso e
  não substitui RLS, grants ou autorização de funções.
- Reutilizar `scripts/review/quality-gates.mjs`, materializando-o no lote porque
  o arquivo existia no worktree preexistente, mas não estava presente no
  checkpoint Git. O gate passa a operar de forma reproduzível com a allowlist.
- Não alterar `.review/baseline.json`: o finding histórico permanece auditável e
  aparece como resolvido pelo gate.

## Arquivos adicionados

- `.review/rls-deny-all-allowlist.json`.
- `scripts/review/quality-gates.mjs`.
- `tests/scripts/r14-rls-deny-all-allowlist.test.mjs`.

`scripts/review/collect-review-context.mjs` permanece fora do lote R-14 e não
será incluído no checkpoint deste finding.

## Arquivos modificados

- `package.json`, somente no hunk do script oficial `review:gates`; os demais
  scripts `review:*` e alterações locais do arquivo permanecem preexistentes e
  fora do lote.
- `handoffs/current/TASK.md`.
- `handoffs/current/IMPLEMENTATION.md`.
- `handoffs/current/REVIEW.md`.
- `handoffs/current/STATUS.md`.

## Migrations

Nenhuma planejada.

## Testes adicionados

- Correspondência exata entre a allowlist, as tabelas com RLS sem policy
  detectadas nas migrations e a lista histórica do gate.
- Motivo não vazio para cada tabela.
- Revogação explícita de `public`, `anon` e `authenticated` para cada entrada.

## Comandos de validação executados

- Investigação das 19 tabelas nas migrations, grants, revogações e funções
  internas relacionadas.
- `node --test tests/scripts/r14-rls-deny-all-allowlist.test.mjs`.
- `node --check tests/scripts/r14-rls-deny-all-allowlist.test.mjs`.
- `node -e` para validar o JSON da allowlist.
- `npm run review:gates -- --gate=RLS_WITHOUT_POLICY`.
- `npm run test:all`.
- `git diff --check`.
- `git diff --cached --name-only -- apps packages supabase`.

## Resultados

- Teste R-14: PASS, 2/2.
- `RLS_WITHOUT_POLICY`: PASS, total atual 0, baseline 19, 19 resolvidos e 0
  regressões bloqueantes.
- Suíte ampla: PASS, 568/568.
- JSON e sintaxe do teste: PASS.
- `git diff --check`: PASS.
- Nenhuma migration, policy, grant, RLS ou código de produto foi alterado.
- `collect-review-context.mjs`, `review:context`, `review:gates:json` e
  `review:gates:baseline` permanecem fora do escopo do checkpoint R-14.

## Limitações conhecidas

- A validação é estática sobre migrations e grants; não foi necessário executar
  mutation ou migration local/remota para formalizar a declaração.
- A allowlist não substitui revisão futura: qualquer alteração de grants,
  funções internas ou exposição de uma tabela exige novo lote ou atualização
  autorizada da declaração.

## Possíveis riscos

- Uma nova tabela RLS sem policy continuará bloqueando o gate até ser corrigida
  ou declarada com razão em lote próprio.
- O `service_role` continua sendo uma fronteira privilegiada e não deve ser
  exposto ao cliente ou a papéis interativos.

## Itens que o reviewer deve observar

- Conferir que as 19 entradas coincidem exatamente com o finding histórico e
  com as migrations atuais.
- Conferir que a allowlist não concede acesso e que as revogações interativas
  permanecem presentes.
- Conferir que o baseline não foi reescrito e que `RLS_WITHOUT_POLICY` somente
  deixa de reportar as entradas explicitamente declaradas.
- Confirmar que nenhuma alteração de produto ou banco entrou no lote.
- Confirmar que os artefatos auxiliares de contexto e baseline permanecem fora
  do checkpoint R-14, embora preservados no worktree.
