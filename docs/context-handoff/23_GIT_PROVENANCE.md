# Git Provenance

Auditoria gerada em 2026-07-23 no checkout `C:\Projetos\GSO-old`.

## Identidade do checkout

- Branch: `codex/repository-cleanup-consolidation-20260721`
- HEAD: `9aacecf` — `Atualizar fluxo operacional e contratos do Genius Support OS`
- Upstream: `origin/codex/repository-cleanup-consolidation-20260721`
- Ahead/behind: `0/0` no momento da verificação com `git rev-list --left-right --count "HEAD...@{upstream}"`.

## Estado do working tree

O repositório já estava sujo antes do Context Pack V2. Não foi executado `reset`, `clean`, `stash`, `checkout`, commit ou push para resolver esse estado.

### Modificados herdados antes do Context Pack

- `apps/web/src/features/analytics/AnalyticsFilters.tsx`
- `apps/web/src/features/analytics/AnalyticsShell.tsx`
- `apps/web/src/features/analytics/analytics-periods.ts`
- `apps/web/src/features/help-center/HelpCenterHomePage.tsx`
- `docs/DOCUMENTATION_LEDGER.md`
- `docs/PROJECT_STATE.md`
- `docs/README.md`
- `docs/plan.md`

### Não rastreados herdados antes do Context Pack

- `apps/web/src/features/help-center/help-center-navigation.ts`
- `docs/ACCESS_AREAS_ROLES_PORTFOLIOS_SPEC_V1.md`
- `docs/reports/SUPPORT_QUEUE_TIMEOUT_ROOT_CAUSE_2026-07-23.md`
- `supabase/migrations/20260723183054_support_ticket_queue_single_pass_hardening.sql`
- `tests/scripts/analytics-periods.test.mjs`
- `tests/scripts/help-center-navigation.test.mjs`
- `tests/scripts/release-smoke-playwright.mjs`
- `tests/scripts/support-queue-view-architecture.test.mjs`

## Criados pelo Context Pack

- `docs/context-handoff/00_CONTEXT_PACK_INDEX.md`
- `docs/context-handoff/01_EXECUTIVE_OVERVIEW.md`
- `docs/context-handoff/02_PRODUCT_VISION_AND_SCOPE.md`
- `docs/context-handoff/03_CURRENT_IMPLEMENTATION_STATE.md`
- `docs/context-handoff/04_MODULE_INVENTORY.md`
- `docs/context-handoff/05_INFORMATION_ARCHITECTURE.md`
- `docs/context-handoff/06_ROUTES_AND_NAVIGATION.md`
- `docs/context-handoff/07_OPERATIONAL_WORKFLOWS.md`
- `docs/context-handoff/08_PERSONAS_ROLES_AND_PERMISSIONS.md`
- `docs/context-handoff/09_DATA_MODEL_AND_TENANCY.md`
- `docs/context-handoff/10_SECURITY_AND_RLS.md`
- `docs/context-handoff/11_INTEGRATIONS_HUBSPOT_OMIE.md`
- `docs/context-handoff/12_DASHBOARDS_AND_METRICS.md`
- `docs/context-handoff/13_UI_UX_CURRENT_STATE.md`
- `docs/context-handoff/14_TECHNICAL_ARCHITECTURE.md`
- `docs/context-handoff/15_TESTS_AND_QUALITY.md`
- `docs/context-handoff/16_TECHNICAL_DEBT_AND_RISKS.md`
- `docs/context-handoff/17_CONFLICTS_AND_DUPLICATIONS.md`
- `docs/context-handoff/18_PENDING_DECISIONS.md`
- `docs/context-handoff/19_PROPOSED_PRODUCT_MAP.md`
- `docs/context-handoff/20_PROPOSED_PHASED_BACKLOG.md`
- `docs/context-handoff/21_REPOSITORY_MANIFEST.md`
- `docs/context-handoff/22_UI_EVIDENCE_MATRIX.md`
- `docs/context-handoff/23_GIT_PROVENANCE.md`
- `docs/context-handoff/ui-evidence-metadata.json`
- `docs/context-handoff/screenshots/*.png`
- `C:\Projetos\GSO-artifacts\context-pack-20260723\genius-support-os-context-pack.zip` e `genius-support-os-context-pack-v2.zip`

## Alterados pelo Context Pack

- `docs/README.md`: adicionou link para o Context Pack.
- `docs/DOCUMENTATION_LEDGER.md`: registrou o macro-lote.
- `docs/PROJECT_STATE.md`: registrou o novo protocolo e o Context Pack.
- `docs/plan.md`: registrou execução/pendências do Context Pack.

## Origem provável dos lotes herdados

- Arquivos de `analytics` e `help-center`: release urgente Dashboard + Central e smoke autenticado de 2026-07-23.
- Migration `20260723183054_support_ticket_queue_single_pass_hardening.sql`: correção local de timeout da fila de suporte.
- Testes em `tests/scripts`: validações focadas de períodos, navegação da Central e arquitetura da fila.
- `ACCESS_AREAS_ROLES_PORTFOLIOS_SPEC_V1.md`: spec de áreas, papéis e carteiras criada em lote anterior.

## Origem desconhecida

Não foi identificada origem externa desconhecida crítica neste lote. A origem precisa de commit/fechamento específico para cada grupo antes de qualquer normalização Git.

## Observação de shell

Um comando inicial `git rev-list --left-right --count HEAD...@{u}` falhou no PowerShell por interpretação de `@{}`. A verificação foi refeita com aspas e forma explícita: `git rev-list --left-right --count "HEAD...@{upstream}"`, retornando `0 0`.
