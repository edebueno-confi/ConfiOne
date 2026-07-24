# Repository Manifest

## Checkout

- Caminho: `C:\Projetos\GSO-old`
- Branch: `codex/repository-cleanup-consolidation-20260721`
- HEAD: `9aacecf`
- Worktree: sujo, preservado.

## Branches locais

- `codex/mvp-operational-completion-goal`
- `codex/repository-cleanup-consolidation-20260721`
- `codex/ux-ui-rebuild-v2-discovery`

## Branches remotas observadas

- `origin/codex/mvp-operational-completion-goal`
- `origin/codex/phase6-24-x-ticket-density-correction`
- `origin/codex/phase7-3-first-public-content-pack`
- `origin/codex/phase7-4-admin-knowledge-editorial-revision`
- `origin/codex/phase7-5-ui-copy-audit`
- `origin/codex/phase7-5-z2-admin-access-system-blueprint`
- `origin/codex/repository-cleanup-consolidation-20260721`
- `origin/main`

## Estrutura principal

- `apps/web`: frontend React/Vite.
- `packages/contracts`: contratos TypeScript compartilhados.
- `supabase/migrations`: schema, views, RPCs, policies.
- `supabase/functions`: Edge Functions.
- `supabase/tests`: testes pgTAP.
- `tests/scripts`: testes Node/QA.
- `docs`: documentação canônica e histórica.
- `raw_knowledge`: exportação Octadesk e assets.
- `output`: evidências geradas localmente; não é fonte canônica.

## Contagens

- Arquivos rastreáveis fora de artefatos: 1.348.
- Features web: 22.
- Migrations: 146.
- Testes DB: 74.
- Edge Functions: 12.
- Screenshots neste pacote: 23.

## Arquivos modificados antes deste pacote

- `apps/web/src/features/analytics/AnalyticsFilters.tsx`
- `apps/web/src/features/analytics/AnalyticsShell.tsx`
- `apps/web/src/features/analytics/analytics-periods.ts`
- `apps/web/src/features/help-center/HelpCenterHomePage.tsx`
- `docs/DOCUMENTATION_LEDGER.md`
- `docs/PROJECT_STATE.md`
- `docs/README.md`
- `docs/plan.md`

## Arquivos não rastreados relevantes antes deste pacote

- `apps/web/src/features/help-center/help-center-navigation.ts`
- `docs/ACCESS_AREAS_ROLES_PORTFOLIOS_SPEC_V1.md`
- `docs/reports/SUPPORT_QUEUE_TIMEOUT_ROOT_CAUSE_2026-07-23.md`
- `supabase/migrations/20260723183054_support_ticket_queue_single_pass_hardening.sql`
- testes Node recentes em `tests/scripts/*`

## Observação

Este manifesto não lista `node_modules`, `.git`, `.env` nem secrets.

## Manifesto V2 do pacote

O ZIP V2 deve ser validado por listagem interna antes do upload e deve conter:

- `docs/context-handoff/00_CONTEXT_PACK_INDEX.md` a `24_CONTEXT_USAGE_RULES.md`.
- `docs/context-handoff/screenshots/01-public-help-home-desktop.png` a `23-public-help-article-desktop.png`.
- `docs/context-handoff/ui-evidence-metadata.json`.

O pacote V1 `genius-support-os-context-pack.zip` foi identificado como incompleto no upload anterior porque não incluiu os Markdown esperados. O V2 corrige isso por staging explícito antes de compactar; ambos os ZIPs permanecem preservados no diretório externo de artefatos do GIT-01.

## Manifesto do Diário de Construção e Product Docs

### Componentes responsáveis

- `apps/web/src/features/build-journal/BuildJournalPage.tsx`
- `apps/web/src/features/build-journal/BuildJournalDocuments.tsx`
- `apps/web/src/features/build-journal/BuildJournalArchitecture.tsx`
- `apps/web/src/features/build-journal/BuildJournalAI.tsx`
- `apps/web/src/features/build-journal/BuildJournalQuoteFooter.tsx`
- `apps/web/src/features/build-journal/buildJournalContent.ts`
- `apps/web/src/features/product-docs/ProductDocsPage.tsx`
- `apps/web/src/features/product-docs/ProductDocReaderPanel.tsx`
- `apps/web/src/features/product-docs/ProductDocMarkdownPreview.tsx`
- `apps/web/src/features/product-docs/product-docs-api.ts`
- `apps/web/src/features/product-docs/productDocsContent.ts`

### Rotas

- `/admin/build-journal`
- `/admin/product-docs`

### Fontes de conteúdo

- `buildJournalContent.ts`: narrativa estática, abas, fases, categorias e referências editoriais.
- `productDocsContent.ts`: whitelist frontend e trilhas de leitura.
- `vw_internal_documents_catalog`: catálogo governado dos documentos internos.
- `vw_internal_document_detail`: detalhe com `body_md_sanitized`.
- `internal_documents` e `internal_document_versions`: fonte persistida governada pelo backend.

### Markdown consumidos ou referenciados

Whitelisted em Product Docs e/ou Build Journal:

- `PRODUCT.md`
- `DESIGN.md`
- `docs/PRODUCT_VISION.md`
- `docs/ARCHITECTURE_RULES.md`
- `docs/AUTH_CONTEXT_STRATEGY.md`
- `docs/ROADMAP_BUILDOUT_V3.md`
- `docs/PROJECT_STATE.md`
- `docs/DOCUMENTATION_LEDGER.md`
- `docs/SUPPORT_WORKFLOW.md`
- `docs/ENGINEERING_WORKFLOW.md`
- `docs/BUILD_JOURNAL_STRATEGY.md`
- `docs/BUILD_JOURNAL_SCREEN_SPEC.md`

Referências editoriais ainda sem slug/whitelist explícita no Diário:

- Leituras e ações governadas.
- Knowledge Base Strategy.
- Customer Portal Specs.

### Conteúdo hardcoded

- Hero, timeline, textos editoriais, categorias e próximas fases do Diário ficam em `buildJournalContent.ts` e componentes associados.
- Cores e classes ainda aparecem em TSX do módulo; há dívida de tokenização visual já registrada nos documentos de UI/UX.

### Conteúdo vindo de arquivo ou banco

- Product Docs e a aba `Documentos oficiais` do Diário leem catálogo/detalhe pelo Supabase através de `product-docs-api.ts`.
- O frontend renderiza `body_md_sanitized` retornado pelo backend; não lê filesystem em runtime.

### Dependências técnicas

- React/Vite/React Router.
- Supabase browser client.
- Views `vw_internal_documents_catalog` e `vw_internal_document_detail`.
- Tipos em `apps/web/src/contracts/admin-contracts.ts`.
- Migração-base `supabase/migrations/20260518152615_internal_documents_foundation_v3.sql`.

### Permissões

- As rotas `/admin/build-journal` e `/admin/product-docs` ficam no shell administrativo.
- O catálogo/detalhe documental não é exposto para `anon`.
- As views `vw_internal_documents_catalog` e `vw_internal_document_detail` são concedidas a `authenticated` e dependem das regras do contrato interno.
- A tabela base `internal_documents` não concede DML direto a usuários autenticados.
- O acesso de navegação usa contratos de telas internas; `product_docs` aparece como chave de acesso em `apps/web/src/contracts/admin-contracts.ts` e `apps/web/src/features/auth/internal-route-access.ts`.
- Permissão granular dedicada e distinta para `build-journal` ainda deve ser tratada em lote futuro se o Diário continuar fora do escopo administrativo amplo.

### Acesso aos Markdown originais

- Product Docs usa deep link `/admin/product-docs?doc=<slug>`.
- Build Journal abre documentos inline quando o slug está disponível para a superfície `build-journal`.
- Referências sem slug explícito não dão acesso ao Markdown original e devem ser classificadas antes da reconstrução do Diário.
