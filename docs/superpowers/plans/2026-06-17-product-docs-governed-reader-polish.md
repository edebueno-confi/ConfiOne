# Product Docs Governed Reader Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recuperar e polir `/admin/product-docs` como leitor governado de documentos oficiais, com dados reais do Supabase local e UX operacional de alta qualidade.

**Architecture:** O frontend continua lendo catalogo e detalhe por read models existentes. A recuperacao local sincroniza apenas a whitelist oficial via script seguro que usa credenciais locais em memoria. A UI melhora leitura, orientacao e governanca sem criar regra de negocio local.

**Tech Stack:** React, TypeScript, Vite, Supabase local, Node test runner, Tailwind utilities existentes.

---

### Task 1: Recuperacao Local do Catalogo

**Files:**
- Create: `scripts/documentation/sync-internal-documents-local.mjs`
- Modify: `package.json`
- Test: `tests/scripts/internal-docs-local-sync.test.mjs`

- [x] **Step 1: Write the failing test**

```js
assert.deepEqual(parseSupabaseStatusEnv(statusOutput), {
  API_URL: 'http://127.0.0.1:54321',
  SERVICE_ROLE_KEY: 'local-service-role',
});
assert.throws(
  () => buildInternalDocsSyncApplyEnv({ API_URL: 'https://remote.supabase.co', SERVICE_ROLE_KEY: 'secret' }),
  /URL local Supabase/,
);
```

- [x] **Step 2: Run test to verify it fails**

Run: `node --test tests/scripts/internal-docs-local-sync.test.mjs`

- [x] **Step 3: Write minimal implementation**

Implementar parser de `supabase status -o env`, aceitar somente `API_URL` e `SERVICE_ROLE_KEY`, exigir host loopback e chamar `sync-internal-documents.mjs --apply` com env em memoria.

- [x] **Step 4: Run test to verify it passes**

Run: `node --test tests/scripts/internal-docs-local-sync.test.mjs`

### Task 2: Product Docs Reader UX

**Files:**
- Modify: `apps/web/src/features/product-docs/ProductDocsPage.tsx`
- Modify: `apps/web/src/features/product-docs/ProductDocReaderPanel.tsx`
- Modify: `apps/web/src/features/product-docs/ProductDocMarkdownPreview.tsx`
- Test: `tests/scripts/product-docs-ui-contract.test.mjs`

- [x] **Step 1: Write the failing test**

```js
assert.match(pageSource, /xl:grid-cols-\[320px_minmax\(0,1fr\)_280px\]/);
assert.doesNotMatch(pageSource, /Contrato real/);
assert.match(readerSource, /getProductDocOutline\(document\.body_md_sanitized\)/);
assert.match(readerSource, /Neste documento/);
```

- [x] **Step 2: Run test to verify it fails**

Run: `node --test tests/scripts/product-docs-ui-contract.test.mjs`

- [x] **Step 3: Write minimal implementation**

Abrir o primeiro documento do catalogo, manter tres zonas, remover copy tecnica de contrato, extrair outline do markdown sanitizado e renderizar links internos com IDs estaveis.

- [x] **Step 4: Run test to verify it passes**

Run: `node --test tests/scripts/product-docs-ui-contract.test.mjs`

### Task 3: Documentacao e Validacao

**Files:**
- Modify: `docs/PROJECT_STATE.md`
- Modify: `docs/README.md`
- Modify: `docs/DOCUMENTATION_LEDGER.md`
- Modify: `docs/PRODUCT_DOCS_INTERNAL_READER_V1.md`
- Create: `docs/reports/PRODUCT_DOCS_GOVERNED_READER_POLISH_2026-06-17.md`

- [x] **Step 1: Document changed behavior**

Registrar causa raiz, contratos consumidos, boundaries, validacoes e riscos restantes.

- [ ] **Step 2: Run validation gates**

Run:

```powershell
npm run documentation:validate:internal-docs
npm run documentation:sync:internal-docs:local
npm run contracts:typecheck
npm run web:typecheck
node --test tests/scripts/*.test.mjs
npm run web:build
```

- [ ] **Step 3: Browser QA**

Abrir `http://127.0.0.1:4173/admin/product-docs` autenticado como fixture admin local e confirmar 12 documentos, reader aberto, rail de governanca, outline interno e ausencia de estado vazio.
