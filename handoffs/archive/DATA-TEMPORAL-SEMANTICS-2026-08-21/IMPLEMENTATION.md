# Implementation

## Task ID

DATA-TEMPORAL-SEMANTICS-2026-08-21

## Implementador

Forge (Codex)

## Base SHA

705c886

## Implementation SHA

8d9e7da1c70d1aee8aad21e4e0896c3bf325d2d2

## Status

APPROVED por Sentinel e integrado localmente em commit exclusivo.

## Resumo

O calendário do Analytics agora é materializado de forma determinística em
America/Sao_Paulo no frontend e nas RPCs temporais. O backend continua sendo
a fonte da verdade: timestamps de origem permanecem em UTC, enquanto as
fronteiras de leitura e os agrupamentos de coorte usam o fuso operacional com
as regras IANA históricas.

## Inventário temporal verificado

- analytics-periods.ts e a janela padrão de séries: consumidores de calendário
  no frontend.
- rpc_analytics_timeseries: séries de Suporte, Comercial e Financeiro, com
  agrupamento por data de abertura, fechamento, resolução, baixa e vencimento.
- rpc_analytics_commercial_kpis_v2 e rpc_analytics_support_kpis_v2: coortes
  de criação, fechamento, resolução e primeira resposta; estoque atual segue
  independente do período.
- rpc_analytics_commercial_snapshot e
  rpc_analytics_cs_snapshot_alias_legacy: snapshots históricos filtráveis.
- rpc_analytics_ceo_snapshot_legacy: coortes executivas de criação e
  fechamento usadas pelos comparativos; o wrapper executivo apenas delega.

## Decisões tomadas

- Aplicada OD-003: timezone operacional America/Sao_Paulo, retroativo a
  séries, coortes e comparativos históricos, sem data de corte.
- Criadas as funções privadas analytics_period_start(date) e
  analytics_period_end_exclusive(date). Elas convertem meia-noite do
  calendário operacional para timestamptz via AT TIME ZONE, sem hardcode de
  offset.
- Preservada a convenção existente: >= from e < to + 1.
- Datas date do Financeiro continuam sem timezone e são agrupadas como
  calendário puro; timestamps de HubSpot são convertidos para o fuso
  operacional antes de date_trunc.
- Fixtures temporais existentes foram ajustadas para representar meia-noite
  operacional explicitamente em UTC. Nenhuma asserção foi removida ou
  enfraquecida.
- Tenant isolation, RLS, autorização, auditoria, release surface e integrações
  externas não foram alterados.

## Arquivos adicionados

- supabase/migrations/20260821100000_analytics_temporal_semantics_timezone_v1.sql
- supabase/tests/121_analytics_temporal_semantics.sql

## Arquivos modificados

- apps/web/src/features/analytics/analytics-periods.ts
- apps/web/src/features/analytics/analytics-api.ts
- docs/ANALYTICS_METRIC_CATALOG_V1.md
- supabase/tests/103_analytics_kpi_read_models.sql
- supabase/tests/105_analytics_hubspot_native_dates.sql
- tests/scripts/analytics-periods.test.mjs
- handoffs/current/TASK.md
- handoffs/current/IMPLEMENTATION.md
- handoffs/current/STATUS.md

## Migrations

20260821100000_analytics_temporal_semantics_timezone_v1.sql é uma migration
forward-only local. Ela cria somente helpers privados de fronteira temporal e
reescreve as definições atuais das seis RPCs temporais inventariadas. Não
altera dados, não executa migration remota e preserva os grants dos contratos
existentes. A transformação continua localizada na migration, mas agora cada
par obrigatório de expressão antiga e nova é validado por função: a contagem
de ocorrências substituídas precisa coincidir, e qualquer ocorrência legada
remanescente interrompe a aplicação com exceção explícita.

## Respostas aos findings do Sentinel

### F-TEMPORAL-001 — concordo e corrigi

O teste `supabase/tests/121_analytics_temporal_semantics.sql` passou a
executar timeseries, KPI comercial, KPI de suporte, snapshot comercial,
snapshot CS e wrapper executivo, usando eventos nas fronteiras operacionais.

### F-TEMPORAL-002 — concordo e corrigi

A migration declara pares obrigatórios por RPC e aplica cada replace em um
loop auditável. Para cada par, exige ocorrência da expressão antiga, confere
a contagem de novas expressões adicionadas e verifica que a expressão legada
não restou antes do execute.

## Testes e gates

- `node --test tests/scripts/analytics-periods.test.mjs`: PASS, 5/5.
- `npm run supabase:test:db`: PASS, 123 arquivos e 1.894/1.894 testes pgTAP.
- `npm run test:all`: a execução anterior passou 576/576; a reexecução do
  Sentinel encontrou 575/576 por P-GOV-001, fora deste lote.
- `npm run contracts:typecheck`: PASS.
- `npm run web:typecheck`: PASS.
- `npm run web:build`: PASS.
- `npm run lint`: PASS, 0 erros e 160 avisos legados.
- `npm run docs:validate`: PASS.
- `npm run supabase:lint:db`: PASS, com avisos históricos não bloqueantes.
- `npm run review:gates`: PASS, 0 regressões contra `.review/baseline.json`.
- `git diff --check`: PASS.
- Gates finais antes do checkpoint: `npm run review:gates` PASS e
  `git diff --check` PASS; allowlist validada sem arquivos estranhos.

## Limitações

- Não foi executado QA visual autenticado; a alteração de UI é limitada à
  materialização de datas e foi coberta por teste de contrato puro, typecheck
  e build.
- O worktree possui alterações preexistentes fora deste lote; elas foram
  preservadas e não entraram no checkpoint.
- `supabase:lint:db` mantém avisos históricos do catálogo de funções.
