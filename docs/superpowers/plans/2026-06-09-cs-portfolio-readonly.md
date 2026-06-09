# CS Portfolio Read-only Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar `/cs/portfolio` como cockpit read-only tenant-aware sobre `vw_cs_customer_portfolio`.

**Architecture:** Um adapter tipado consulta a view CS; `CsGate` resolve auth, permissao e retry; um shell interno reaproveita a navegacao unificada; a pagina renderiza lista selecionavel e detalhe sem criar regra de negocio. O backend permanece responsavel pelo isolamento tenant.

**Tech Stack:** React 19, TypeScript, React Router 7, Supabase JS, Tailwind CSS, Node test runner, PostgreSQL/pgTAP.

---

### Task 1: Contrato frontend e adapter CS

**Files:**
- Create: `apps/web/src/features/cs/cs-api.ts`
- Create: `tests/scripts/cs-portfolio-model.test.mjs`

- [ ] Criar teste falhando que valide mapeamento e busca por cliente, owner, produto e plano.
- [ ] Executar `node --test tests/scripts/cs-portfolio-model.test.mjs` e confirmar falha por modulo ausente.
- [ ] Implementar mapeador puro e `listCsCustomerPortfolio()` sobre `vw_cs_customer_portfolio`.
- [ ] Executar o teste e `npm run web:typecheck`.

### Task 2: Gate e redirect por contexto CS

**Files:**
- Create: `apps/web/src/features/cs/CsGate.tsx`
- Modify: `apps/web/src/features/auth/post-login-redirect.ts`
- Create: `tests/scripts/cs-route-access.test.mjs`

- [ ] Criar teste falhando para `/cs` autorizado e landing de membro CS.
- [ ] Extrair resolucao pura de rotas para permitir teste sem browser.
- [ ] Adicionar `hasCsPortfolioAccess` ao contexto de redirect.
- [ ] Implementar gate com loading, erro, retry, anonimo, sessao expirada, denied e empty admin.
- [ ] Executar testes e typecheck.

### Task 3: Shell, navegacao e rota

**Files:**
- Create: `apps/web/src/features/cs/CsWorkspaceShell.tsx`
- Modify: `apps/web/src/features/navigation/UnifiedEnvironmentNavigation.tsx`
- Modify: `apps/web/src/app/router.tsx`

- [ ] Adicionar permissao `hasCsPortfolioAccess`.
- [ ] Adicionar item `Carteira CS` em `Operacao CX`.
- [ ] Criar rota lazy `/cs/portfolio` sob `CsGate` e shell interno.
- [ ] Garantir redirect `/cs` para `/cs/portfolio`.
- [ ] Executar typecheck e build.

### Task 4: Interface de portfolio

**Files:**
- Create: `apps/web/src/features/cs/CsPortfolioPage.tsx`

- [ ] Implementar cabecalho, busca, lista selecionavel e painel de detalhe.
- [ ] Renderizar owner, produtos/planos, tickets, membros e ultima atualizacao.
- [ ] Renderizar health `Indisponivel` com motivo do backend.
- [ ] Implementar estados de carteira vazia e busca vazia.
- [ ] Garantir ausencia de mutation e overflow horizontal.
- [ ] Executar typecheck e build.

### Task 5: Fixture autenticada CS

**Files:**
- Modify: `supabase/qa/create-local-functional-fixture.mjs`
- Modify: `docs/LOCAL_QA_AUTH.md`

- [ ] Materializar usuario CS local com tenant membership e membership ativa `customer_success`.
- [ ] Garantir owner CS e contexto multiproduto suficiente para QA.
- [ ] Executar `npm run supabase:qa:local-functional-fixture`.
- [ ] Confirmar que a view retorna escopo tenant-aware para o usuario CS.

### Task 6: Documentacao e validacao final

**Files:**
- Modify: `docs/PROJECT_STATE.md`
- Modify: `docs/DOCUMENTATION_LEDGER.md`
- Modify: `docs/README.md`
- Create: `docs/reports/CS_PORTFOLIO_READONLY_UI_2026-06-09.md`

- [ ] Registrar rota, contrato, gate, boundaries e evidencias.
- [ ] Executar testes Node focados.
- [ ] Executar `npm run contracts:typecheck`.
- [ ] Executar `npm run web:typecheck`.
- [ ] Executar `npm run web:build`.
- [ ] Executar pgTAP de CS e suite global.
- [ ] Executar `npm run documentation:validate:internal-docs`.
- [ ] Executar `git diff --check`.

### Task 7: QA autenticado e visual

**Files:**
- No source changes expected unless QA reveals a defect.

- [ ] Abrir `/cs/portfolio` como `platform_admin`.
- [ ] Abrir como membro `customer_success` e confirmar isolamento.
- [ ] Abrir como usuario sem acesso e confirmar denial.
- [ ] Validar busca vazia, owner ausente, produto multiplo e health indisponivel.
- [ ] Validar desktop e viewport estreito sem scroll horizontal.
- [ ] Corrigir defeitos encontrados e repetir gates afetados.
