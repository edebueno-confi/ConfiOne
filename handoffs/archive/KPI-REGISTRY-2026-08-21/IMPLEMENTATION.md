# Implementation

## Task ID

KPI-REGISTRY-2026-08-21

## Implementador

Forge (Codex)

## Estado do handoff

COMPLETED

## Base e SHAs

- Base SHA: `06b24742013dfcd3e74c805b3a8754bd2c632581`.
- Implementation SHA: `de314b56ca57202290bbbd332a469bb1ffcb8afa`.
- Branch: `main`.

## Investigação e matriz de evidências

- A fonte histórica `docs/ANALYTICS_METRIC_CATALOG_V1.md` foi reconciliada com
  os contratos executáveis. Ela permanece histórica; o novo registro corrente
  foi criado em `docs/ANALYTICS_KPI_REGISTRY_V1.md`.
- O contrato de apresentação em
  `apps/web/src/features/analytics/analytics-kpi-contract.mjs` confirma os
  estados `available`, `partial`, `unavailable` e `awaiting_history`, além das
  bases legíveis para criação, fechamento, posição atual, resolução e histórico.
- `analytics-model.ts` confirma o mapeamento dos payloads de Comercial,
  Suporte, Customer Success e Visão Geral sem cálculo adicional no frontend.
- `analytics-api.ts` confirma os RPCs efetivamente chamados, os filtros de
  período e o recorte opcional de operação.
- As migrations `20260807130000_analytics_kpi_read_models_v1.sql`,
  `20260807150000_analytics_kpi_read_models_v2.sql` e
  `20260807170000_analytics_kpi_read_models_v3.sql` confirmam as fórmulas,
  bases, estados e limitações dos KPIs publicados.
- As migrations `20260808290000_analytics_operation_scope_v1.sql`,
  `20260821100000_analytics_temporal_semantics_timezone_v1.sql`,
  `20260821113000_analytics_commercial_reconciliation_cohorts_v1.sql` e
  `20260821150000_analytics_commercial_conversion_semantics_v1.sql` confirmam
  escopo operacional, limites de data em `America/Sao_Paulo`, separação entre
  criação/posição/fechamento e conversão em pontos percentuais.
- O contrato financeiro foi limitado à fonte OMIE publicada por
  `20260802020000_analytics_finance_api_only_surface_v1.sql`; planilhas não
  foram registradas como fonte ou fallback.

## Resposta aos findings do Sentinel

- **F-KPI-001 — corrigido:** o registro agora inclui o bloco publicado de
  Suporte do `rpc_analytics_cs_snapshot_by_operation`, com
  `total_tickets`, `created_tickets`, `open_tickets`, `closed_tickets`,
  `closed_rate`, `high_priority_open`, `first_response_sla_tracked`,
  `close_sla_tracked` e `source_filled`. A documentação diferencia o
  snapshot filtrado por `hubspot_tickets.hs_created_at` da posição corrente
  `open_backlog`, registrando fórmulas, cobertura, campos vazios e limites de
  interpretação.
- **F-KPI-002 — corrigido:** `created_tickets` na Visão Geral passou a ser
  descrito como “Atendimentos criados no período”. A definição mantém
  `ticket_created_at`/`hs_created_at` e separa explicitamente esse movimento
  de `open_backlog`/`open_tickets`, que representam estados de fila.
- Evidência conferida para as correções:
  `supabase/migrations/20260821150000_analytics_commercial_conversion_semantics_v1.sql:264-335`
  define a coorte por `hs_created_at`, o estado por `is_closed` e os campos de
  cobertura `time_to_first_response_sla_status`,
  `time_to_close_sla_status` e `source_type`; o mapeamento do payload em
  `apps/web/src/features/analytics/analytics-model.ts:767` confirma todas as
  chaves do snapshot.

## Arquivos pertencentes ao lote

- `docs/ANALYTICS_KPI_REGISTRY_V1.md` — novo registro canônico.
- `docs/README.md` — índice do novo documento.
- `docs/DOCUMENTATION_LEDGER.md` — trilha de auditoria do lote.
- Os demais arquivos da allowlist são o handoff e não recebem conteúdo de
  produto; a fila foi marcada `DONE` após o veredito formal do Sentinel e a
  integração local.
- Nenhum arquivo fora da allowlist foi alterado por este lote. O worktree já
  contém alterações preexistentes, preservadas sem stage ou descarte.

## Validações

- `npm run docs:validate` — PASS; 0 documentos bloqueados. Os 9 alertas de
  token/sensibilidade são alertas preexistentes do catálogo interno e não
  bloqueiam a validação.
- `npm run review:gates` — PASS; 0 regressões bloqueantes contra o baseline,
  45 itens do baseline resolvidos pelo estado acumulado do worktree.
- `node .agents/skills/genius-documentation-governance/scripts/validate-governance-skill.mjs` — PASS.
- Auditoria documental `changed --json` — PASS em modo read-only; 174
  documentos analisados, 0 blockers, 40 candidatos de conflito/drift, 6 links
  quebrados já presentes no worktree amplo, 0 findings de segurança e veredito
  heurístico `consistente com ressalvas`. Nenhum arquivo foi gravado pela
  auditoria.
- `git diff --check` — PASS.
- Não foram executados typecheck, build, lint, pgTAP ou QA de interface porque
  o lote é exclusivamente documental e não alterou código, SQL, contratos ou
  comportamento executável.

## Finalização local

- Veredito formal do Sentinel: `APPROVED`.
- Approval da fila: `APPROVED`.
- Commit local exclusivo do lote: `de314b56ca57202290bbbd332a469bb1ffcb8afa`.
- Caminhos integrados: `docs/ANALYTICS_KPI_REGISTRY_V1.md`, o link
  correspondente em `docs/README.md` e a entrada do registro em
  `docs/DOCUMENTATION_LEDGER.md`.
- O stage foi seletivo; alterações preexistentes, inclusive outros hunks de
  `docs/README.md`, permaneceram fora do commit.
- Handoff arquivado em
  `handoffs/archive/KPI-REGISTRY-2026-08-21/`; nenhuma operação externa foi
  executada.

## Limitações e próximos lotes

- A metodologia ainda não é exibida na interface. `ANALYTICS-METRIC-METHODOLOGY-2026-08-21`
  e `ANALYTICS-METRIC-CONTEXT-UI-2026-08-21` permanecem `PROPOSED`.
- O registro documenta o contrato publicado; não substitui uma consulta a
  dados atuais nem prova frescor de uma sincronização específica.
- A próxima tarefa elegível da fila é
  `COMMERCIAL-EVOLUTION-2026-08-21`, previamente autorizada e desbloqueada.
