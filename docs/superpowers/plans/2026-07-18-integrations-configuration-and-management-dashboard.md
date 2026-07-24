# Configuração de integrações e dashboard gerencial — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Preparar o GSO Old para administrar fontes HubSpot, planilhas e Omie com segurança e alimentar o dashboard gerencial por contratos locais.

**Architecture:** Criar uma camada backend-first de configuração e execuções. Segredos permanecem server-side; configurações de pipes e mapeamentos ficam em tabela com RLS e RPCs administrativas. A UI de Settings administra estado seguro, enquanto parsers e adapters escrevem staging/read models por comandos autorizados.

**Tech Stack:** React/Vite, TypeScript, Supabase/Postgres, Edge Functions Deno, pgTAP, Node test runner e parser existente de planilhas.

---

### Task 1: Contrato vivo e modelo de configuração

**Files:**
- Create: `docs/spec.md`
- Create: `docs/plan.md`
- Create: `docs/superpowers/plans/2026-07-18-integrations-configuration-and-management-dashboard.md`
- Modify: `docs/PROJECT_STATE.md`
- Modify: `docs/DOCUMENTATION_LEDGER.md`

- [x] Registrar fatos observados, decisões, bloqueios e gates.
- [x] Documentar que segredo nunca retorna à UI.

### Task 2: Testes do normalizador Omie

**Files:**
- Create: `scripts/analytics/omie-receivables-normalizer.mjs`
- Test: `tests/scripts/omie-receivables-normalizer.test.mjs`

- [ ] Escrever teste RED para mapear headers do export Omie, preservar status original e calcular saldo sem classificar cancelamento como inadimplência.
- [ ] Executar `node --test tests/scripts/omie-receivables-normalizer.test.mjs` e confirmar falha por módulo ausente.
- [ ] Implementar o normalizador mínimo com rejeição honesta de linha sem cliente, status ou valor.
- [ ] Executar o teste novamente e confirmar GREEN.

### Task 3: Contrato Supabase de integrações gerenciadas

**Files:**
- Create: `supabase/migrations/20260718034735_managed_integrations_v1.sql`
- Test: `supabase/tests/051_managed_integrations.sql`
- Modify: `packages/contracts/src/index.ts`

- [ ] Criar tabela de configurações não sensíveis e execuções com RLS, auditoria e grants mínimos.
- [ ] Criar RPCs administrativas para upsert de configuração, ativação/inativação e registro de execução.
- [ ] Validar que segredos sejam aceitos somente por secret reference/backend e nunca por leitura autenticada da tabela.
- [ ] Cobrir plataforma admin, usuário não-admin e ausência de tenant com pgTAP.

### Task 4: Adapter Omie read-only

**Files:**
- Create: `supabase/functions/omie-sync/index.ts`
- Create: `supabase/functions/_shared/omie.ts`
- Create: `tests/scripts/omie-api-contract.test.mjs`
- Modify: `supabase/config.toml`

- [ ] Escrever testes do contrato de paginação, autenticação ausente e erro sanitizado.
- [ ] Implementar cliente HTTP server-side para Contas a Receber usando referência de secret, sem fallback literal.
- [ ] Registrar execução e contadores sem persistir App Secret em payload, log ou erro.
- [ ] Deixar o adapter desabilitado até a configuração existir.

### Task 5: Configuração na aba Settings

**Files:**
- Modify: `apps/web/src/features/settings/settings-api.ts`
- Modify: `apps/web/src/features/settings/SettingsPage.tsx`
- Modify: `apps/web/src/features/navigation/minimal-navigation.ts`

- [ ] Adicionar seção Integrações com HubSpot, Planilhas e Omie.
- [ ] Exibir status, modo, pipes/fontes, último sync e erros sanitizados.
- [ ] Permitir salvar apenas campos não sensíveis; credencial será informada por fluxo seguro de backend na segunda-feira.
- [ ] Cobrir loading, vazio, erro, não configurado e sucesso.

### Task 6: Dashboard por fontes e pipes configuráveis

**Files:**
- Modify: `supabase/functions/hubspot-sync/index.ts`
- Modify: `apps/web/src/features/analytics/analytics-api.ts`
- Modify: `apps/web/src/features/analytics/AnalyticsShell.tsx`
- Modify: `supabase/migrations/20260718040000_analytics_source_config_v2.sql`

- [ ] Permitir múltiplos pipes ativos por domínio, sem assumir `892833861`.
- [ ] Exibir origem/frescor/qualidade junto dos números.
- [ ] Manter estados vazios honestos quando nenhum sync foi executado.
- [ ] Reconciliar totais por domínio e pipe antes da UI.

### Task 7: Gates e handoff

**Files:**
- Modify: `docs/plan.md`
- Modify: `docs/PROJECT_STATE.md`
- Modify: `docs/DOCUMENTATION_LEDGER.md`
- Modify: `docs/reports/CODEX_CONTINUATION_HANDOFF_2026-07-17.md`

- [ ] Rodar gates de contratos, frontend, banco, build e smoke autenticado.
- [ ] Registrar o que ficou bloqueado pelas credenciais Omie.
- [ ] Não fazer commit, deploy remoto ou uso de credenciais reais neste lote.
