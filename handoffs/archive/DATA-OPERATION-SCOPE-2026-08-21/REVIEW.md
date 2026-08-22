# Review

## Task ID

DATA-OPERATION-SCOPE-2026-08-21

## Reviewer

Claude, Principal Engineer / Independent Code Reviewer.

## Commit revisado

Base SHA `bdc1ea6404928e1ca4e8c7ccf9213d6a3090b6f9`, branch `main`.
Estado revisado: worktree não commitado sobre esse commit. Ciclo 2, re-review
incremental restrito ao DOS-F01 e à busca por regressões.
`Review mode: CLAUDE_REQUIRED`.

Delta desta correção: `apps/web/src/features/analytics/AnalyticsCeoPage.tsx` e
os artefatos de handoff. A migration, o pgTAP 119 e os demais arquivos de
produto não foram tocados, verificado por varredura de mtime em `supabase/`.

## Veredito

APPROVED.

## Resolução do finding do ciclo 1

### DOS-F01 - RESOLVED

A correção é a mínima e é a recomendada: `operationScoped` passou a ser
propagado ao `ExecutiveHdCanvas` no call site (`:282`), destructurado na
assinatura (`:452`) e declarado no tipo das props (`:482`). Sem `any`, sem
variável global, sem alteração de comportamento.

Os dois textos que estavam quebrados continuam de pé e continuam dizendo a
verdade sobre a indisponibilidade:

```
: operationScoped
  ? "Encerramentos do recorte indisponíveis"
: operationScoped
  ? "Prioridade do recorte indisponível"
```

Isso importa porque a correção poderia ter sido "resolvida" apagando as linhas,
o que devolveria o número global sob um recorte ativo. Não foi o caso.

Verificado por execução, no espelho com dependências instaladas:

```
npm run web:typecheck  -> exit 0, 0 erros
npm run web:build      -> exit 0, built in 4.14s
```

Executei os dois eu mesmo, sobre o estado entregue, e não aceitei a declaração.
Era exatamente esse o ponto do finding.

## Verificações executadas neste ciclo

| Verificação | Resultado observado |
| --- | --- |
| `npm run web:typecheck` | PASS, exit 0, 0 erros |
| `npm run web:build` | PASS, exit 0, `tsc --noEmit` e `vite build` concluídos |
| `npm run lint` | PASS, exit 0, 0 erros e 160 warnings preexistentes |
| `npm run test:all` | 568 testes, 566 PASS, 1 skip, 1 falha dependente de Supabase local |
| `git diff --check` em `apps/web`, `supabase` e `tests` | limpo, exit 0 |
| Textos de indisponibilidade | preservados nas duas linhas |
| Escopo da correção | somente `AnalyticsCeoPage.tsx`; `supabase/` intocado |

A única falha da suíte continua sendo
`tests/scripts/access-profile-capabilities-stability.test.mjs`, que exige
Supabase local. Mesma falha do ciclo 1, não é regressão.

Não reexecutei `docs:validate` nem `review:gates` neste ciclo: o delta é um
único arquivo `.tsx`, sem efeito sobre documentação canônica ou sobre os gates
determinísticos, e ambos passaram no ciclo 1.

## Mérito confirmado do ciclo 1, sem reabertura

Permanecem válidas as verificações do ciclo anterior, que a correção não tocou:
a migration segue o padrão já integrado em `20260808290000`; o escopo é
transacional por `set_config(..., true)`; os grants revogam `public` e `anon` e
concedem execute a `authenticated` e `service_role`; a função é
`security definer` com `search_path = ''`; a RPC base tem uma única definição e
um único patch; e o pgTAP 119 traz contra-teste real, com operação inexistente
devolvendo zero em vez do total global.

## O que não foi validado

- pgTAP real, incluindo o teste 119, e qualquer comportamento contra banco. Não
  há rota do ambiente do revisor até o Supabase local. A execução permanece como
  evidência do Codex.
- `supabase:lint:db`.
- QA visual autenticado da tela de Analytics.

Registro isso sem atenuar: a parte do lote que dá a garantia de isolamento entre
operações é a camada SQL, e é justamente a que eu não consigo exercitar. Minha
confiança nela vem da leitura do código, do desenho do contra-teste e da
consistência com o padrão já integrado, não de execução.

## Consequências da aprovação

Aprovado o lote como fechamento do escopo de Operação na evolução, no resumo
executivo e na exportação. Não autoriza push, merge, pull request, deploy,
migration remota nem alteração de release surface, conforme `OD-001`.

A migration deste lote é local. Sua aplicação em qualquer ambiente remoto
continua fora de qualquer autorização vigente e exige decisão explícita do
proprietário.

## Próximo passo

Owner retorna ao Codex. Cabem a ele, sob a autonomia da `OD-001`:

1. Integrar o lote por commit local restrito ao escopo.
2. Arquivar `handoffs/current/` como `DATA-OPERATION-SCOPE-2026-08-21`.
3. Atualizar `handoffs/README.md` aplicando, **na mesma edição**, a baixa deste
   lote e a promoção do próximo item elegível.
4. O próximo item da fila é o `DATA-PIPELINE-STAGE-SCOPE-2026-08-21`, que declara
   dependência deste lote.
