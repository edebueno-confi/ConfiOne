# Implementation

## Task ID

DATA-TEMPORAL-SEMANTICS-2026-08-21

## Implementador

Codex

## Base SHA

705c886

## Implementation SHA

UNCOMMITTED_WORKTREE

## Status

READY_FOR_REVIEW após responder aos findings F-TEMPORAL-001 e F-TEMPORAL-002 do
Sentinel. O timezone operacional foi aplicado conforme a decisão OD-003, sem
alterar a convenção meia-aberta dos períodos.

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
remanescente interrompe a aplicação com exceção explícita. As variantes de
filtro de KPI, snapshots e séries são declaradas separadamente conforme o
contrato executável de cada RPC.

## Respostas aos findings do Sentinel

### F-TEMPORAL-001 — concordo e corrigi

O teste `supabase/tests/121_analytics_temporal_semantics.sql` deixou de validar
somente texto de definição. Ele agora executa timeseries, KPI comercial, KPI de
suporte, snapshot comercial, snapshot CS e wrapper executivo, usando quatro
eventos por domínio: antes do início local, exatamente no início, no limite
superior inclusivo e exatamente no início do dia seguinte. Os resultados
esperados são 2 eventos em 2099-08-01 e 1 em 2099-08-02, confirmando a janela
`>= início` e `< fim exclusivo` nas seis superfícies. A janela futura é
intencional para não misturar fixtures globais de outras fontes presentes no
catálogo local.

### F-TEMPORAL-002 — concordo e corrigi

A migration agora declara pares obrigatórios por RPC e aplica cada `replace`
em um loop auditável. Para cada par, ela exige ocorrência da expressão antiga,
confere que a quantidade de expressões novas adicionadas é exatamente igual à
quantidade antiga substituída e verifica que a expressão legada não restou na
definição antes do `execute`. Assim, uma substituição coincidente não consegue
mais liberar uma função parcialmente convertida.

## Testes adicionados

- tests/scripts/analytics-periods.test.mjs: 5/5, incluindo fronteira próxima
  à meia-noite UTC, janela de série e data histórica com horário de verão.
- supabase/tests/121_analytics_temporal_semantics.sql: 20/20, incluindo
  chamadas reais às seis superfícies temporais e contra-testes nos limites
  operacionalmente inclusivos e exclusivos, além de diferenças entre 2018 com
  horário de verão e 2019 sem offset fixo.

## Comandos de validação executados

- node --test tests/scripts/analytics-periods.test.mjs: PASS, 5/5.
- pnpm exec supabase migration up --local: PASS, aplicou somente a migration
  deste lote no banco local.
- Suíte pgTAP temporal relacionada, 9 arquivos: PASS, 110/110.
- npm run supabase:test:db: PASS, 123 arquivos e 1.894/1.894 testes pgTAP.
- npm run test:all: a execução anterior do lote passou 576/576; a
  reexecução do Sentinel encontrou 575/576 por incompatibilidade do teste de
  governança com `Owner: Sentinel`, finding fora deste lote e não alterado.
- npm run web:typecheck: PASS, exit 0.
- npm run web:build: PASS, exit 0.
- npm run lint: PASS, exit 0; 160 avisos legados, sem erros.
- npm run docs:validate: PASS, sem documentos bloqueados.
- npm run supabase:lint:db: PASS, exit 0; avisos históricos não bloqueantes.
- npm run review:gates: PASS, 0 regressões contra .review/baseline.json.
- git diff --check: PASS, limpo.

## Resultados

O frontend e o backend usam a mesma data de calendário operacional. Eventos
próximos à meia-noite não atravessam o período apenas por diferença entre o
fuso do navegador e o fuso da sessão. Datas anteriores a 2019 usam as regras
IANA de horário de verão, e não um deslocamento fixo.

## Limitações conhecidas

- Não foi executado QA visual autenticado; a alteração de UI é limitada à
  materialização de datas e foi coberta por teste de contrato puro, typecheck e
  build.
- O repositório ainda possui alterações preexistentes fora deste lote. Elas
  não foram alteradas nem incluídas no pedido de revisão.
- supabase:lint:db mantém avisos históricos do catálogo de funções; não há
  erro novo bloqueante.

## Itens que o reviewer deve observar

- confirmar que as seis RPCs temporais usam as funções privadas de fronteira ou
  AT TIME ZONE America/Sao_Paulo no agrupamento;
- confirmar que a convenção >= from e < to + 1 permaneceu intacta;
- confirmar a fronteira de meia-noite e a regra histórica de horário de verão;
- confirmar que posição atual, movimento no período, nulos, reaberturas e
  ausência de histórico continuam explícitos;
- confirmar que arquivos preexistentes do worktree não foram absorvidos.
- confirmar a execução dos contra-testes comportamentais e a proteção de cada
  substituição obrigatória da migration.
