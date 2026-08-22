# Review

## Task ID

R-11

## Reviewer

Claude, Principal Engineer / Independent Code Reviewer.

## Commit revisado

Base SHA `1ea22b20d9703b76c57aff53f7bee6e0c2c1ae93`, branch `main`.
Estado revisado: worktree não commitado sobre esse commit. Ciclo 2, re-review
incremental restrito ao R11-F01 e à busca por regressões.

Delta desta correção, por mtime posterior ao REVIEW do ciclo 1:
`tests/scripts/r11-npm-scripts.test.mjs` e os artefatos de handoff. Nenhum outro
arquivo foi tocado. `apps/`, `packages/` e `supabase/` permanecem intocados.

## Veredito

APPROVED.

## Resolução do finding do ciclo 1

### R11-F01 - RESOLVED

O caso passou a derivar o caminho do contrato real em vez de fixar um literal de
plataforma:

```js
const paths = resolvePgTapPaths(['supabase/tests/001_phase1_identity_tenancy_rls.sql']);
const command = buildPgTapCommand(paths, REPOSITORY_ROOT);

assert.equal(command.args.at(-2), '--local');
assert.equal(command.args.at(-1), paths[0]);
assert.equal(command.args.includes('--linked'), false);
assert.equal(command.args.includes('--db-url'), false);
```

A correção é a que o finding pedia, e nenhuma asserção foi removida ou
enfraquecida. As duas verificações que tinham valor, `--local` presente e
`--linked` e `--db-url` ausentes, continuam lá. A asserção de caminho deixou de
comparar uma string com ela mesma: agora exige que o comando carregue exatamente
o caminho validado por `resolvePgTapPaths`, na última posição, o que também
trava a ordem dos argumentos. É verdadeiro nas duas plataformas porque o valor
esperado passa a vir de `relative()`, e não de um literal.

Verificado por execução em dois ambientes Linux independentes:

```
ok 1 - todos os scripts npm node apontam para arquivos existentes
ok 2 - runner pgTAP aceita somente SQL dentro de supabase/tests
ok 3 - runner pgTAP força execução local sem aceitar alvo remoto
# pass 3  # fail 0
```

## Verificações executadas neste ciclo

| Verificação | Comando | Resultado observado |
| --- | --- | --- |
| Teste do lote, no checkout | `node --test tests/scripts/r11-npm-scripts.test.mjs` | PASS, 3/3 |
| Teste do lote, em espelho Linux limpo | idem | PASS, 3/3 |
| Suíte completa, em espelho com dependências | `npm run test:all` | 566 testes, 564 PASS, 1 skip, 1 FAIL |
| Gates determinísticos | `npm run review:gates` | `NPM_SCRIPT_MISSING` total 0, resolvidos 16, 0 regressões |
| Baseline intacto | `git status --porcelain .review/baseline.json` | sem modificação |
| Higiene do diff | `git diff --check` | limpo, exit 0 |
| Escopo | varredura de mtime em `apps/`, `packages/`, `supabase/` | nenhum arquivo tocado |

A única falha remanescente da suíte é
`tests/scripts/access-profile-capabilities-stability.test.mjs`, que exige
Supabase local em execução. No ciclo 1 eram duas falhas; a que saiu é exatamente
o R11-F01.

Não reexecutei `lint`, `web:typecheck` e `web:build` neste ciclo. O delta é um
único arquivo de teste sob `tests/`, fora de `apps/web` e de `packages/`, que são
o alvo dos três comandos. No ciclo 1 eu os executei e todos passaram: lint exit 0
com 160 warnings, typecheck exit 0 e build exit 0.

## Auditoria do ciclo 1 que permanece válida

A matriz das 16 referências, a revisão de segurança do runner pgTAP e a
verificação de ausência de consumidores dos 13 scripts removidos foram feitas no
ciclo 1 e não foram afetadas por esta correção, que tocou apenas o arquivo de
teste. Não as refiz.

## O que não foi validado

- `npm run supabase:test:file` contra pgTAP real e
  `access-profile-capabilities-stability.test.mjs`, ambos dependentes de Supabase
  local em execução.
- Execução em runtime dos scripts `local:qa:*` mantidos.

## Recomendação estrutural, fora do escopo deste lote

O R11-F01 existiu por dois ciclos com declaração de verde porque a suíte JS não
roda em lugar nenhum além da máquina do implementador.
`.github/workflows/supabase-db.yml` roda em `ubuntu-latest` e executa
`contracts:typecheck`, `web:typecheck`, `web:build` e o pgTAP, mas **não** executa
`npm run test:all`. Os 566 testes nunca são exercitados em Linux pelo pipeline.

Acrescentar um passo `npm run test:all` a esse workflow tornaria a paridade de
plataforma automática e independente de onde o revisor executa. Não trato isso
como finding do R-11, porque está fora do escopo declarado na TASK. Registro como
candidato a item de fila, sujeito à decisão do proprietário.

## Consequências da aprovação

Aprovado o lote R-11 como correção das referências npm quebradas. Não autoriza
commit, push, merge, deploy nem release surface.

## Próximo passo

Owner retorna ao Codex, conforme a regra de fila para tarefas previamente
autorizadas. Cabem ao Codex:

1. Integrar o lote pelo processo de integração aplicável.
2. Arquivar `handoffs/current/` como `R-11-2026-08-21`.
3. Atualizar `handoffs/README.md` aplicando, **na mesma edição**, a baixa do R-11
   para `DONE` e a promoção do R-14 para `ACTIVE`.
4. Abrir a TASK do R-14, último item aprovado da fila.
