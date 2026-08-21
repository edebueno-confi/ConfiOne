# Review

## Task ID

COMMERCIAL-CONVERSION-SEMANTICS-2026-08-21

## Reviewer

Reviewer: Sentinel (Codex Independent Reviewer)

Substituição operacional temporária do Claude, com revisão independente baseada
no repositório e no estado local efetivo.

## Estado revisado

- Estado recebido: `READY_FOR_REVIEW`
- Owner recebido: `Sentinel`
- Branch: `main`
- Base SHA declarada pela TASK: `892efd4c7d6e988bc98f4e0598f00782776f721f`
- HEAD efetivo revisado: `47fba447731bd702c72fe7f147887a0072082890`
- Estado de implementação: `UNCOMMITTED_WORKTREE`
- Diff real: worktree contaminado por alterações preexistentes; a allowlist do
  lote foi revisada separadamente e não foi misturada ao restante.

## Escopo e critérios

Foram revisados a migration `20260821150000_analytics_commercial_conversion_semantics_v1.sql`,
os testes pgTAP 122 e 123, os consumidores e mapeadores em Analytics, os
formatadores de exportação, a documentação canônica, os wrappers RPC e as
definições efetivas no Supabase local.

Critérios centrais verificados: mesma coorte e dimensões para numerador e
denominador, fechamento no período operacional, tratamento explícito de nulos,
reaberturas e denominador zero, unidade percentual, preservação de autorização
e integridade do diff.

## Findings

### F-CONV-001 — HIGH — view legada ainda não usa a coorte declarada de fechamento

- Camada: migration SQL / read model
- Status: `confirmed`
- Evidência: em `supabase/migrations/20260821150000_analytics_commercial_conversion_semantics_v1.sql:31-53`,
  a CTE `deals` não seleciona nem filtra `hs_closed_at`; a view calcula o
  numerador com `count(*) filter (where is_won)` e o denominador com
  `count(*) filter (where is_closed)`. A definição efetiva retornada por
  `pg_get_viewdef('public.vw_analytics_commercial_kpis'::regclass, true)`
  confirmou a mesma forma.
- Impacto: um deal em estágio `is_won = true` e `is_closed = false` entra no
  numerador, embora esteja fora do denominador. Um deal fechado sem
  `hs_closed_at` também entra no denominador sem poder ser atribuído ao período.
  O helper pode devolver `NULL` por inconsistência, mas a view continua
  publicando uma coorte diferente da documentada e diferente dos RPCs v2 e do
  snapshot.
- Requisito afetado: 1, 2, 3 e 4 da TASK; também contradiz
  `docs/ANALYTICS_METRIC_CATALOG_V1.md:98,107-113` e
  `docs/PROJECT_STATE.md:9-17`.
- Correção esperada: alinhar a view ao contrato efetivo de conversão, incluindo
  somente negócios fechados com data de fechamento válida e garantindo que o
  numerador seja subconjunto do mesmo denominador; adicionar contra-testes
  específicos para deal ganho não fechado e deal fechado sem `hs_closed_at`.

### F-CONV-002 — HIGH — exportação executiva ainda publica zero com denominador vazio

- Camada: RPC legado / mapeador e exportação frontend
- Status: `confirmed`
- Evidência: a definição efetiva de
  `public.rpc_analytics_ceo_snapshot_legacy(date,date)` no Supabase local usa
  `case when count(*) > 0 then ... else 0 end` para `commercial_closed`.
  `apps/web/src/features/analytics/analytics-model.ts:747-756` converte o
  campo ausente em zero via `toNumber(c.conversion_rate)`. Em seguida,
  `apps/web/src/features/analytics/analytics-export.ts:64-68` exporta esse
  valor com `formatPercent(c.conversionRate)`. A tela oculta o caso em
  `AnalyticsCeoPage.tsx:631-637`, mas o relatório exportável não usa essa
  guarda.
- Impacto: para um período sem negócios fechados, o relatório executivo
  publica `0%`, apesar do contrato deste lote exigir nulo/indisponível e a
  documentação afirmar que ausência de denominador nunca deve virar zero.
  Isso deixa a Visão Executiva e a exportação com semântica diferente do
  read model v2 e do snapshot corrigidos.
- Requisito afetado: 3 e 4 da TASK; também contradiz
  `docs/ANALYTICS_METRIC_CATALOG_V1.md:111-113` e
  `docs/PROJECT_STATE.md:12-17`.
- Correção esperada: preservar ausência como `null` desde a fonte executável
  até `CeoSnapshot` e a exportação, ou fazer a exportação consumir o read model
  com estado explícito. Cobrir o caso sem fechamentos no RPC legado, no
  mapeador e no HTML do relatório. Manter explícita a unidade interna em fração
  somente se ela continuar sendo um boundary deliberado e testado.

## Gates e validações independentes

- `npm run supabase:test:file -- supabase/tests/102_analytics_kpi_foundation.sql supabase/tests/103_analytics_kpi_read_models.sql supabase/tests/122_analytics_commercial_reconciliation.sql supabase/tests/123_analytics_conversion_semantics.sql`: PASS, 4 arquivos, 80/80 testes.
- Testes Node focados de detalhes comerciais, exportação e contratos KPI: PASS, 25/25.
- `npm run review:gates`: PASS, 0 regressões; 44 itens do baseline resolvidos; baseline intacto.
- `npm run web:typecheck`: PASS.
- `npm run contracts:typecheck`: PASS.
- `npm run web:build`: PASS, 942 módulos transformados.
- `npm run lint`: PASS, 0 erros e 160 warnings existentes.
- `npm run docs:validate`: PASS, 0 documentos bloqueados; 9 alertas históricos.
- `git diff --check`: PASS.
- Consulta independente de `pg_get_viewdef` e `pg_get_functiondef` no Supabase
  local: confirmou F-CONV-001 e F-CONV-002.

## Segurança e limitações

- A migration revisada mantém `security definer`, `search_path = ''`,
  `can_read_analytics()` e os grants existentes; não identifiquei regressão
  nova de RLS, tenant ou secrets neste lote.
- Não foi executada migration remota, deploy, push, merge, commit ou alteração
  de código pelo Sentinel.
- Não foi feita validação visual/browser nem integração remota. Build e
  typecheck comprovam compilação, não renderização nem publicação.
- `npm run test:all` foi reportado pelo Forge como 576/577, com falha de
  governança preexistente sobre o owner `Forge`; não é gate suficiente para
  aprovar este lote e permanece fora do escopo dos findings acima.

## Decisão

# CHANGES_REQUESTED

Os dois findings `HIGH` são confirmados e afetam caminhos executáveis da mesma
métrica. Os testes entregues passam, mas não cobrem a view legada nem a
exportação executiva sem denominador. Forge deve corrigir os findings, atualizar
os contra-testes e reenviar `READY_FOR_REVIEW` com `Owner = Sentinel`.

Após a correção, a revisão deve ser incremental contra o novo HEAD/diff real;
nenhum finding permanece aberto apenas por ter sido criado por Sentinel se a
evidência técnica demonstrar a correção.

## Re-revisão incremental — 2026-08-21

### Estado e base efetivamente revisados

- Reviewer: Sentinel (Codex Independent Reviewer).
- Estado recebido: `READY_FOR_REVIEW`.
- Owner recebido: `Sentinel`.
- Base SHA declarada pela TASK: `892efd4c7d6e988bc98f4e0598f00782776f721f`.
- HEAD efetivo: `47fba447731bd702c72fe7f147887a0072082890`.
- Implementação: `UNCOMMITTED_WORKTREE`.
- A allowlist foi confrontada com o diff por caminho; alterações alheias
  preexistentes permaneceram fora do lote.

### Resolução dos findings anteriores

#### F-CONV-001 — resolvido

A definição efetiva de `public.vw_analytics_commercial_kpis`, confirmada por
`pg_get_viewdef`, agora seleciona `hs_closed_at` e calcula a conversão com o
mesmo universo em numerador e denominador:

```sql
count(*) filter (where is_closed and hs_closed_at is not null and is_won)
count(*) filter (where is_closed and hs_closed_at is not null)
```

O contra-teste em `supabase/tests/123_analytics_conversion_semantics.sql:157-161`
confirma 75% e exclui ganho ainda aberto e fechamento sem data. O numerador
passou a ser subconjunto explícito do denominador.

#### F-CONV-002 — resolvido

A definição efetiva de `public.rpc_analytics_ceo_snapshot_legacy(date,date)`,
confirmada por `pg_get_functiondef`, usa `closed_commercial` com
`is_closed`, `hs_closed_at is not null` e os limites operacionais do período.
`app_private.kpi_ratio` retorna `NULL` sem denominador. O mapeador em
`apps/web/src/features/analytics/analytics-model.ts:755-757` preserva nulo e
converte pontos percentuais para a fração interna somente na fronteira legada.
`apps/web/src/features/analytics/analytics-export.ts:68,113-114` usa
`formatCommercialConversionRate`, que renderiza `Indisponível` para nulo.

Os contra-testes em `supabase/tests/123_analytics_conversion_semantics.sql:163-173`
confirmam 66,67% no período com fechamentos e `NULL` no período sem
fechamentos.

### Validações independentes desta re-revisão

- pgTAP focado (`102`, `103`, `122`, `123`): **PASS**, 83/83.
- Testes Node focados de analytics, exportação, segurança e contratos:
  **PASS**, 25/25.
- `npm run review:gates`: **PASS**, 0 regressões e 45 itens do baseline
  resolvidos.
- `npm run web:typecheck`: **PASS**.
- `npm run contracts:typecheck`: **PASS**.
- `npm run web:build`: **PASS**, 942 módulos transformados.
- `npm run lint`: **PASS**, 0 erros e 160 warnings legados/preexistentes.
- `npm run docs:validate`: **PASS**, 0 documentos bloqueados e 9 alertas
  históricos.
- `git diff --check`: **PASS**.
- Consulta independente de `pg_get_viewdef` e `pg_get_functiondef`: confirmou
  as definições corrigidas no Supabase local.

### Segurança e regressões

Não foi identificada regressão nova de tenant, RLS, autorização,
`security definer`, `search_path`, grants ou exposição de secrets. Nenhum
arquivo de produto, migration, teste, contrato ou configuração executável foi
alterado pelo Sentinel.

### Observação PROPOSED não bloqueante

A view legada não recebe período e representa uma coorte all-time, enquanto a
documentação descreve a regra de conversão em termos de período. A API
`getCommercialKpis` ainda preserva esse caminho legado, embora as telas atuais
usem os RPCs filtrados. Recomenda-se explicitar essa distinção no lote
`KPI-REGISTRY-2026-08-21`, sem reabrir os findings corrigidos deste lote.

## Decisão incremental

# APPROVED

F-CONV-001 e F-CONV-002 estão tecnicamente resolvidos e foram confirmados por
definições efetivas, contra-testes e validações independentes. A task atende os
critérios de aceitação aplicáveis ao lote.

Como a fila canônica marca esta task com `Approval = APPROVED`, o próximo
owner é `Forge`. Forge está autorizado a executar a finalização local do lote:
validar novamente a allowlist, criar commit local exclusivo, arquivar o
handoff, marcar a task como `DONE` e iniciar a próxima task autorizada. Push,
merge, deploy, migration remota, secrets e release surface continuam proibidos.
