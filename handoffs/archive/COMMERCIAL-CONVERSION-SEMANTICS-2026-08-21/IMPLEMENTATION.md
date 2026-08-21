# Implementation

## Task ID

COMMERCIAL-CONVERSION-SEMANTICS-2026-08-21

## Implementador

Forge (Codex)

## Estado do handoff

READY_FOR_REVIEW — findings F-CONV-001 e F-CONV-002 corrigidos e reenviado ao
Sentinel para revisão incremental.

## Base e SHAs

- Base SHA declarada na TASK: `892efd4c7d6e988bc98f4e0598f00782776f721f`.
- HEAD efetivo antes das alterações: `47fba447731bd702c72fe7f147887a0072082890`.
- Implementation SHA: `UNCOMMITTED_WORKTREE`.
- Branch: `main`.

O HEAD efetivo é o commit de abertura desta task, posterior ao checkpoint
declarado na TASK. Nenhum arquivo alheio foi rebaseado, descartado ou absorvido.

## Investigação

Foram comparados o helper `app_private.kpi_ratio`, a RPC v2, a view legada,
o snapshot comercial reconciliado, os consumidores React e os contratos de
teste. A evidência local mostrou:

1. A RPC v2 já publicava percentuais em pontos percentuais, de 0 a 100, usando
   a coorte encerrada por `closed_at` e o helper compartilhado.
2. O snapshot comercial reconciliado ainda calculava uma razão de 0 a 1 e
   convertia denominador vazio em zero.
3. O modelo interno de snapshot/export do frontend usa fração para o formatter
   legado, enquanto o read model v2 e o detalhamento por responsável usam pontos
   percentuais. Havia fronteiras implícitas e risco de multiplicação dupla.
4. A definição aplicada neste lote é `wins / (wins + losses) * 100`, considerando
   somente negócios encerrados com `closed_at` no período operacional. Numerador,
   denominador, filtros, pipeline, responsável, funil e timezone usam a mesma
   coorte. Negócio reaberto, ainda aberto, ou sem data de fechamento não entra na
   coorte encerrada.

## Resposta aos findings do Sentinel

### F-CONV-001 — HIGH — corrigido

Concordo. A view legada calculava o numerador com `is_won` sem exigir que o
negócio estivesse fechado e aceitava fechamentos sem `hs_closed_at`. A view
agora inclui no numerador somente `is_closed and hs_closed_at is not null and
is_won`, e usa `is_closed and hs_closed_at is not null` no denominador.

Foi adicionado contra-teste pgTAP com ganho ainda aberto e negócio fechado sem
data. O fixture confirma que a view publica 75% somente para os quatro negócios
fechados com data válida, dos quais três são ganhos.

### F-CONV-002 — HIGH — corrigido

Concordo. O RPC executivo legado agora separa a coorte criada da coorte fechada
e usa `app_private.kpi_ratio` sobre negócios fechados com `hs_closed_at` no
período operacional. Denominador vazio retorna `NULL`.

O mapeador preserva `NULL` e converte explicitamente pontos percentuais da API
para a fração interna do CEO. A exportação HTML e texto usa o formatter que
renderiza `Indisponível` para `null`, sem transformar ausência em `0%`.
Contra-testes cobrem 66,67% na coorte fechada e `null` em período sem fechamento.

## Implementação

### Banco e contratos

- `supabase/migrations/20260821150000_analytics_commercial_conversion_semantics_v1.sql`
  atualiza `app_private.kpi_ratio` para retornar `NULL` em entrada inválida,
  numerador negativo, numerador acima do denominador ou denominador nulo/não
  positivo; entradas válidas retornam pontos percentuais entre 0 e 100.
- A view `vw_analytics_commercial_kpis` e a RPC
  `rpc_analytics_commercial_snapshot` passam a usar a mesma semântica de
  coorte encerrada e pontos percentuais, preservando filtros, autorização,
  `security definer`, `search_path`, tenant implícito e as dimensões publicadas.
  A mesma migration alinha a view legada e `rpc_analytics_ceo_snapshot_legacy`
  à coorte de fechamento com data válida.
- `supabase/tests/122_analytics_commercial_reconciliation.sql` atualiza a
  expectativa do contrato ativo de `0.5` para `50` pontos percentuais.
- `supabase/tests/123_analytics_conversion_semantics.sql` adiciona 18
  asserções comportamentais e contra-testes para coorte divergente, ganho,
  perda, negócio aberto/reaberto, ausência de `closed_at`, denominador vazio,
  limites 0..100 e entradas inválidas do helper.

### Frontend

- `apps/web/src/features/analytics/analytics-model.ts` mantém a fração somente
  na fronteira interna legada do snapshot/export/CEO, converte explicitamente a
  resposta API de pontos percentuais para fração e representa ausência como
  `null`/`Indisponível`.
- `apps/web/src/features/analytics/analytics-export.ts` e
  `apps/web/src/features/analytics/AnalyticsReportExport.tsx` usam o formatter
  semântico, sem converter `null` em zero.
- `apps/web/src/features/analytics/AnalyticsCommercialPage.tsx` passa a exibir
  a taxa v2 em pontos percentuais sem multiplicação dupla.
- `apps/web/src/features/analytics/AnalyticsCeoPage.tsx` converte o valor v2
  publicado para a fração esperada pelo modelo interno do CEO.

### Documentação canônica

- `docs/ANALYTICS_METRIC_CATALOG_V1.md` registra fórmula, coorte, unidade,
  nulos, reabertura e ausência de fechamento.
- `docs/PROJECT_STATE.md` registra a semântica vigente dos três caminhos
  executáveis e as fronteiras de representação do frontend.
- `docs/DOCUMENTATION_LEDGER.md` registra a alteração e sua validação.

As tarefas propostas de metodologia e contexto orientado ao usuário continuam
fora deste lote. A documentação de explicação para usuários e sua exposição na
interface permanecem nas tasks autorizadas próprias da fila.

## Allowlist deste lote

1. `supabase/migrations/20260821150000_analytics_commercial_conversion_semantics_v1.sql`
2. `supabase/tests/122_analytics_commercial_reconciliation.sql`
3. `supabase/tests/123_analytics_conversion_semantics.sql`
4. `tests/scripts/analytics-export-contract.test.mjs`
5. `apps/web/src/features/analytics/analytics-model.ts`
6. `apps/web/src/features/analytics/analytics-export.ts`
7. `apps/web/src/features/analytics/AnalyticsReportExport.tsx`
8. `apps/web/src/features/analytics/AnalyticsCommercialPage.tsx`
9. `apps/web/src/features/analytics/AnalyticsCeoPage.tsx`
10. `docs/ANALYTICS_METRIC_CATALOG_V1.md`
11. `docs/PROJECT_STATE.md`
12. `docs/DOCUMENTATION_LEDGER.md`

As demais alterações rastreadas e não rastreadas do worktree são preexistentes
ou pertencem a outros lotes e não fazem parte deste handoff. Em particular,
as tasks `ANALYTICS-METRIC-METHODOLOGY` e `ANALYTICS-METRIC-CONTEXT-UI` não
foram iniciadas.

## Validações executadas

### Banco e testes focados

- `npm exec -- supabase status`: PASS. Supabase local ativo em `127.0.0.1:54322`.
- `npm exec -- supabase db push --local`: PASS. Aplicou somente a migration
  deste lote, sem reset. Como a versão já estava registrada como aplicada, a
  revalidação incremental da definição alterada foi executada no mesmo banco
  local via `docker exec ... psql`, sem reset.
- `npm run supabase:test:file -- supabase/tests/102_analytics_kpi_foundation.sql supabase/tests/103_analytics_kpi_read_models.sql supabase/tests/122_analytics_commercial_reconciliation.sql supabase/tests/123_analytics_conversion_semantics.sql`: PASS, 4 arquivos, 83/83 testes após os contra-testes.
- `npm run supabase:test:db`: PASS, 125 arquivos, 1920/1920 testes.

### Frontend e contratos

- Testes Node focados para contratos, superfícies e exportação: PASS, 24/24.
- `npm run web:typecheck`: PASS.
- `npm run web:build`: PASS. Vite transformou 942 módulos e concluiu o build.
- `npm run contracts:typecheck`: PASS.
- `npm run lint`: PASS, 0 erros e 160 warnings legados/preexistentes.

### Gates e integridade

- `npm run docs:validate`: PASS. 0 documentos bloqueados; 9 documentos com
  alertas históricos já reportados pelo validador.
- `npm run review:gates`: PASS, 0 regressões; 45 itens do baseline resolvidos
  pelo estado corrente do repositório.
- `git diff --check`: PASS.

- `npm run test:all`: 576/577 testes passaram. O único failure é o teste
  preexistente `tests/scripts/dev-control-mvp.test.mjs`, que ainda restringe
  `STATUS.owner` a `Codex`, `Claude` ou `Ede`; o estado operacional vigente usa
  `Forge`. O failure é de governança do heartbeat, não da semântica comercial,
  e não foi alterado neste lote.

## Segurança, isolamento e limitações

- A migration preserva os filtros e as proteções existentes da RPC/view,
  incluindo `can_read_analytics`, `security definer` e `search_path` controlado.
- Nenhuma migration remota, deploy, push, merge, release surface ou alteração
  de secret foi executada.
- Não foi feita validação visual/browser de fluxo publicado; typecheck e build
  comprovam compilação, não renderização nem integração remota.
- O working tree continua contaminado por alterações legadas e outros lotes.
  A integração deve usar somente esta allowlist após aprovação formal do
  Sentinel.

## Pedido ao reviewer

Sentinel deve revisar o diff real contra a allowlist, a semântica de coorte,
os contra-testes pgTAP, a conversão de unidades no frontend e os gates acima.
Os findings F-CONV-001 e F-CONV-002 foram respondidos acima. O veredito
incremental deve ser registrado em `REVIEW.md`; Forge não declara aprovação.
