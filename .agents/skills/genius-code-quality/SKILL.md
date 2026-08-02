---
name: genius-code-quality
description: Use when auditing Genius Support OS code quality, architecture, security, maintainability, tests, documentation, technical debt, code review, handoff, pre-commit gates, release readiness, or safe refactoring. Do not use for feature implementation unless approved fixes are explicitly requested.
---

# Genius Code Quality

## Objetivo

Audite o código do Genius Support OS para revisão humana, handoff e decisões de release. A auditoria é read-only por padrão: inspecione, valide, classifique, explique e recomende; não altere código, testes, banco, dependências ou configuração sem autorização explícita.

**Lint é evidência parcial, não veredito.** Combine tooling existente, diff, contratos reais, arquitetura, segurança multi-tenant, testes, documentação e revisão semântica.

## Acionamento e limites

Use esta skill quando o pedido mencionar auditoria/revisão de código, qualidade técnica, dívida técnica, code review, handoff, revisão humana, pré-commit, release ou refatoração segura. Não use para implementar uma feature, redesenhar UI ou corrigir achados sem escopo aprovado.

Antes de agir:

1. Confirme cwd, branch, HEAD, status staged/unstaged/untracked e `git diff --check`.
2. Leia os documentos canônicos aplicáveis, começando por `docs/PROJECT_STATE.md`, `docs/ARCHITECTURE_RULES.md`, `docs/VIEW_RPC_CONTRACTS.md` e `docs/VALIDATION_CHECKLIST.md`.
3. Audite o tooling existente antes de propor pacote novo. Não altere `package.json` ou lockfile neste workflow.
4. Nunca abra, imprima ou reproduza `.env`, tokens, cookies, JWTs, service roles ou credenciais.

Não use `git reset`, `git clean`, `git stash`, `git checkout --`, push, deploy, sync externo, `supabase db reset`, migration remota ou escrita externa.

## Modos

| Invocação | Escopo | Conduta |
|---|---|---|
| `$genius-code-quality fast` | gate rápido antes de commit/encerramento | `git diff --check`, estado do diff, padrões locais e typechecks disponíveis; não executar banco, navegador ou testes demorados |
| `$genius-code-quality changed` | staged, unstaged e untracked relevantes | identificar a base real, impacto em consumidores, contratos, testes e documentação; nunca presumir `main` |
| `$genius-code-quality module <caminho ou domínio>` | módulo informado | arquitetura, dependências, contratos, segurança, testes, documentação e manutenção do recorte |
| `$genius-code-quality full` | repositório inteiro | auditoria profunda; pode usar subagentes especializados, mas não corrige automaticamente nem expande o escopo |

Se houver alteração em contrato, auth, RLS, RPC, migration, manifesto ou pacote compartilhado, eleve o recorte e registre o motivo. Se o caminho não existir, pare com resultado `não conclusivo`.

## Regras de análise

Consulte [quality-rules.md](references/quality-rules.md), [severity-model.md](references/severity-model.md) e [project-architecture.md](references/project-architecture.md). Avalie, quando aplicável, tipos, limites arquiteturais, legibilidade, duplicação, React, async/erros/observabilidade, segurança, Supabase/Postgres/SQL, integrações, testes, documentação e dependências.

No Genius Support OS, backend/views/read models/RPCs são a fonte da verdade; frontend não inventa métrica, regra ou dado. Ausência deve aparecer como indisponível. Tenant, RLS, permissão e auditoria são obrigatórios. `platform_admin` não elimina auditoria. Contratos compartilhados prevalecem sobre tipos locais; módulos ocultos continuam bloqueados pelo manifesto; não duplique allowlists. HubSpot e OMIE devem ser idempotentes e observáveis. `SECURITY DEFINER` exige `set search_path = ''`. Superfície pública usa tema claro fixo; interface interna suporta claro/escuro; alteração visual exige screenshot.

Separe explicitamente erro objetivo, regra violada, risco provável, dívida, oportunidade, preferência estilística e falso positivo. Métricas são sinais para investigação, não condenação automática. Destaque também decisões corretas e padrões consistentes.

## Evidência e relatório

Cada achado exige severidade, categoria, arquivo, linha/trecho, evidência, impacto, recomendação, confiança, bloqueio de merge/release e indicação de falso positivo. Não atribua falha herdada ao lote atual: registre proveniência (`introduzido`, `existente`, `herdado/indeterminado` ou `externo`).

Produza o formato em [report-template.md](references/report-template.md): resumo, comandos/duração/limitações, bloqueadores, achados por categoria, dívida, pontos positivos, incertezas, plano, estado Git e veredito (`aprovado`, `aprovado com ressalvas`, `reprovado` ou `não conclusivo`). Gere JSON somente quando solicitado (`--json`), seguindo [assets/code-quality-report-template.md](assets/code-quality-report-template.md).

## Correção e parada

O modo padrão termina após relatório. Só aplique correções se o usuário autorizar explicitamente um lote de correção; mesmo assim, escopo, arquivos e validações devem ser confirmados antes de editar. Não altere testes para obter verde, não insira disables sem justificativa e não declare aprovação apenas porque lint/typecheck passou.

Pare quando o modo solicitado, as verificações seguras e o relatório estiverem concluídos. Registre gates não executados e o motivo; não inicie outro macro-lote.
