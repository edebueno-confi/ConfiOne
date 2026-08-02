---
name: genius-documentation-governance
description: Audit and govern documentation across the Genius Support OS repository. Use when detecting stale, duplicate, conflicting, missing, or misleading docs; reconciling docs with code, routes, database contracts, permissions, and UI; preparing handoffs or scheduled read-only reviews. Read-only by default; edits require explicit apply mode and approved scope.
---

# Genius Documentation Governance

## Objetivo e limites

Governar a documentação como fonte rastreável de contexto, sem presumir que um documento existente seja verdadeiro. O comportamento padrão é somente leitura: inventarie, compare, classifique, proponha e reporte. Não editar, mover, renomear, excluir, consolidar, commitar ou arquivar documentos sem modo `apply` e escopo aprovado.

Não crie segundo ledger, índice ou registry quando os equivalentes existentes puderem ser evoluídos. Use primeiro `docs/DOCUMENTATION_UPDATE_POLICY.md`, `docs/DOCUMENTATION_GOVERNANCE_RUNBOOK.md`, `docs/PROJECT_STATE.md`, `docs/DOCUMENTATION_LEDGER.md` e `docs/README.md`.

## Precedência de fontes

1. código executável, migrations, views, RPCs, policies, testes e contratos reais;
2. documentos canônicos atuais;
3. Context Pack aprovado mais recente;
4. relatórios recentes com evidência objetiva;
5. Product Docs/Build Journal;
6. documentação histórica;
7. prompts, chats e artefatos experimentais.

Quando houver conflito, não adapte código silenciosamente. Classifique a divergência, identifique a decisão vigente e pare para decisão humana quando o Product Owner for necessário. Consulte [source-precedence.md](references/source-precedence.md) e [drift-rules.md](references/drift-rules.md).

## Modos

| Invocação | Escopo e comportamento |
|---|---|
| `$genius-documentation-governance fast` | higiene rápida: links, caminhos, títulos, comandos, duplicatas exatas e secrets sem reproduzir valores |
| `$genius-documentation-governance changed` | diff staged/unstaged/untracked, commits recentes, impacto documental e documentação ausente |
| `$genius-documentation-governance domain <domínio>` | mapa profundo de docs, código, rotas, shell, contratos, banco, testes e UI do domínio |
| `$genius-documentation-governance full` | auditoria ampla; pode usar subagentes e navegador apenas se autorizados, sem escrita automática |
| `$genius-documentation-governance apply <relatório/escopo>` | aplica somente mudanças explicitamente aprovadas; scripts permanecem dry-run e o agente edita apenas o escopo confirmado |
| `$genius-documentation-governance scheduled` | comparação recorrente read-only com relatório anterior; não cria automação neste lote |

O modo incremental não lê todo o repositório. Comece por inventário/metadados, busque termos, abra docs relacionados, confira contratos reais e só então amplie a leitura. Só `full` autoriza leitura ampla.

## Workflow seguro

1. Confirmar cwd, branch, HEAD, staged/unstaged/untracked e `git diff --check`.
2. Inventariar sem abrir `.env`, tokens, cookies, JWTs, service roles ou dumps privados.
3. Classificar tipo e status separadamente; `HISTORICAL` pode continuar correto sobre seu momento.
4. Comparar documentação com package scripts, router, manifesto, shell, contratos TypeScript, migrations, views, RPCs, policies, testes e arquivos reais.
5. Detectar duplicação exata/semântica e contradições como candidatos com evidência, confiança e fonte provável; não eliminar históricos ou resumos intencionais.
6. Produzir relatório Markdown e JSON opcional. Usar [report-template.md](references/report-template.md) e [documentation-registry-schema.json](assets/documentation-registry-schema.json).
7. Parar ao concluir o modo solicitado. Não executar reconciliação real encontrada durante piloto, não criar tarefa agendada, não fazer push/deploy/sync e não alterar banco.

Para segurança, caminhos e evidências sensíveis são redigidos. Para UI, só usar navegador/QA em `domain`/`full` com ambiente autorizado; screenshots antigos não provam estado atual. Consulte [reconciliation-rules.md](references/reconciliation-rules.md) antes de `apply`.

## Saída e severidade

O relatório deve conter resumo, Git, mapa documental, drift com código, contradições, duplicações, documentação ausente, links, segurança, plano e veredito (`consistente`, `consistente com ressalvas`, `inconsistente`, `não conclusivo`). Cada achado exige arquivo/linha ou trecho, evidência, recomendação, confiança, proveniência, bloqueio e falso positivo possível. Consulte [documentation-taxonomy.md](references/documentation-taxonomy.md) e [severity-model.md](references/severity-model.md).

## Recursos executáveis

`scripts/run-documentation-audit.mjs` é o auditor determinístico e read-only. `scripts/validate-governance-skill.mjs` valida a estrutura local. Ambos funcionam sem serviço externo, não escrevem arquivos e aceitam `--json`; use `--strict` somente quando o consumidor precisar de exit code não zero para achados críticos/altos.

## Condição de parada

Encerrar após inventariar, validar, produzir o relatório e registrar limitações. No modo `apply`, encerrar depois do escopo aprovado e da validação proporcional; não iniciar outro macro-lote.
