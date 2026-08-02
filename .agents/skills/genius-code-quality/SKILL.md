---
name: genius-code-quality
description: Use when auditing Genius Support OS code quality, architecture, security, maintainability, tests, documentation, technical debt, code review, handoff, pre-commit gates, release readiness, or safe refactoring. Do not use for feature implementation unless approved fixes are explicitly requested.
---

# Genius Code Quality

## Objetivo e limites

Audite o Genius Support OS para revisao humana, handoff e decisoes de release. O comportamento padrao e read-only: inspecione, valide, classifique, explique e recomende; nao altere produto, testes, banco, dependencias ou configuracao sem autorizacao explicita.

Lint e typecheck sao evidencias parciais. Combine tooling existente, diff, contratos reais, arquitetura, seguranca multi-tenant, testes, documentacao e revisao semantica.

## Acionamento

Use quando o pedido mencionar auditoria ou revisao de codigo, qualidade tecnica, divida tecnica, code review, handoff, pre-commit, release ou refatoracao segura. Nao use para feature, redesign de UI ou correcao de achados sem escopo aprovado.

Antes de agir:

1. Confirme cwd, branch, HEAD, status staged/unstaged/untracked e `git diff --check`.
2. Leia os documentos canonicos aplicaveis, comecando por `docs/PROJECT_STATE.md`, `docs/ARCHITECTURE_RULES.md`, `docs/VIEW_RPC_CONTRACTS.md` e `docs/VALIDATION_CHECKLIST.md`.
3. Audite o tooling existente antes de propor pacote novo.
4. Nunca abra ou reproduza `.env`, tokens, cookies, JWTs, service roles ou credenciais.

Nao use `git reset`, `git clean`, `git stash`, `supabase db reset` ou `git checkout --` neste workflow.

## Modos

| Invocacao | Escopo |
|---|---|
| `$genius-code-quality fast` | Git, diff check, padroes, lint configurado, typechecks e secret scan existente; sem banco, navegador ou testes demorados. |
| `$genius-code-quality changed` | staged, unstaged e untracked relevantes, com base real do working tree. |
| `$genius-code-quality module <caminho>` | scanner contextual, typecheck/lint possivel e inventario de dependencias, contratos, consumidores, testes, docs, rotas e estados. |
| `$genius-code-quality full` | auditoria ampla; pode usar validacoes autorizadas, mas nao corrige automaticamente. |

O modo `module` nao declara auditoria profunda: separa escopo direto, dependencias, consumidores, contratos, testes, documentacao e itens nao analisados.

## Modelo contextual

Cada finding contem `layer`, `ruleApplicability`, `status`, `contextStatus`, `detector`, `ruleVersion`, `analysisType` e `provenance`.

Camadas: frontend, contratos compartilhados, Edge Function/backend, migration SQL, teste SQL, script operacional, script de auditoria, fixture, teste Node/frontend, documentacao e configuracao.

Status: `candidate`, `probable`, `confirmed`, `dismissed`, `historical-fixed` e `requires-runtime-validation`. Heuristica textual nunca vira `confirmed` automaticamente.

`SECURITY DEFINER` so e analisado em blocos de funcao SQL. `search_path = ''` e tratado como conforme; `public`/`pg_temp`, grants amplos e SQL dinamico exigem contexto. Migrations historicas nao sao editadas; hardening posterior pode classifica-las como `historical-fixed`.

`SELECT *` em pgTAP, fixtures, inspecoes e scripts de auditoria nao gera divida de contrato. Views publicas, RPCs e read models recebem candidato contextual.

`.from()` em frontend e candidato somente quando acessa tabela sem view/RPC aprovada. Edge Functions, scripts e testes nao sao marcados pela existencia do `.from()`; acesso backend sensivel com service role e sem autorizacao aparente e tratado como provavel.

## Severidade e veredito

- `CRITICO`: problema confirmado com risco imediato;
- `ALTO`: problema confirmado ou provavel com impacto elevado;
- `MEDIO`: risco provavel ou duvida relevante;
- `BAIXO`: melhoria localizada;
- `INFORMATIVO`: candidato ou sinal para revisao.

O risco e calculado pelos estados contextuais, nao pela contagem bruta. Somente findings `confirmed` criticos/altos bloqueiam merge/release. Candidatos isolados geram `aprovado com observacoes`; comandos incompletos geram `nao conclusivo`; achados confirmados altos/criticos geram `reprovado`.

## Saida e truncamento

O JSON preserva todos os findings. O Markdown agrupa por regra, camada, severidade e status e pode omitir candidatos repetitivos apenas do resumo. O relatorio informa total, exibidos, omitidos, regras afetadas e garante que criticos/altos confirmados nunca sejam truncados.

## Recursos e seguranca

- `scripts/run-quality-gate.mjs`: orquestra Git, padroes, lint se configurado, typechecks e `local:qa:secret-scan` existente.
- `scripts/check-project-patterns.mjs`: detector contextual read-only, com JSON completo.
- `scripts/validate-skill.mjs`: valida estrutura, frontmatter, campos contextuais e fixtures.
- `tests/detectors.test.mjs`: regressao artificial dos detectores, sem banco, navegador ou API externa.

Nenhum script edita arquivos, cria commits, altera Git, executa banco, sync, push, deploy ou operacao destrutiva.

## Correcao e parada

So aplique correcoes em lote separado, com escopo e arquivos confirmados. Nao transforme candidates automaticamente em backlog do produto. Pare apos o modo solicitado, validacoes seguras e relatorio; nao inicie outro macro-lote.
