# Review

## Veredito formal

- Task ID: `KPI-REGISTRY-2026-08-21`
- Reviewer: Sentinel (Codex Independent Reviewer)
- Data: 2026-08-21
- Estado recebido: `READY_FOR_REVIEW`
- Owner recebido: `Sentinel`
- Base SHA: `06b24742013dfcd3e74c805b3a8754bd2c632581`
- HEAD efetivamente revisado: `06b24742013dfcd3e74c805b3a8754bd2c632581`
- Estado do código: `UNCOMMITTED_WORKTREE`

## Escopo e evidência revisados

Arquivos do lote:

- `docs/ANALYTICS_KPI_REGISTRY_V1.md`
- `docs/README.md`
- `docs/DOCUMENTATION_LEDGER.md`

O worktree contém alterações preexistentes fora da allowlist. Elas foram
excluídas da decisão e não foram alteradas pelo Sentinel. O lote não alterou
código, SQL, contratos, migrations, RLS, permissões, UI ou release surface.

O registro foi comparado com `analytics-kpi-contract.mjs`,
`analytics-model.ts`, `analytics-api.ts`, os read models de KPI e o snapshot
de Suporte/Visão Geral. A auditoria documental `changed` foi executada em
escopo amplo; seus 40 candidatos de drift/conflito não foram atribuídos a este
lote sem evidência específica, pois o worktree contém alterações históricas
não relacionadas.

## Critérios de aceitação

1. **Parcial**. As principais definições possuem fonte e contrato rastreáveis,
   mas o inventário não cobre todo o snapshot publicado referenciado pelo
   próprio registro.
2. **PASS com ressalva**. As coortes de criação, fechamento/resolução e posição
   atual estão descritas; o rótulo de `created_tickets` na Visão Geral está
   semanticamente incorreto.
3. **PASS nas linhas revisadas**. Fórmulas, unidades, timezone, filtros e
   estados estão descritos para os KPIs listados.
4. **Parcial**. Não foi encontrada contradição estrutural nas linhas listadas,
   mas a omissão de métricas do snapshot impede declarar o registro completo.
5. **PASS nas métricas listadas**. Métricas históricas insuficientes permanecem
   `awaiting_history` ou fora do cálculo.
6. **PASS**. `npm run docs:validate` passou sem bloqueios.

## Findings

### F-KPI-001 — MEDIUM — registro incompleto para o snapshot de Suporte/Visão Geral

- Evidência documental: `docs/ANALYTICS_KPI_REGISTRY_V1.md:24-28` declara
  `rpc_analytics_cs_snapshot_by_operation` e `rpc_analytics_ceo_snapshot` como
  fontes publicadas, mas as tabelas do registro não incluem todas as métricas
  entregues por esses payloads.
- Evidência executável:
  `supabase/migrations/20260821150000_analytics_commercial_conversion_semantics_v1.sql:307-320`
  publica `total_tickets`, `created_tickets`, `open_tickets`,
  `closed_tickets`, `closed_rate`, `high_priority_open`,
  `first_response_sla_tracked`, `close_sla_tracked` e `source_filled`.
  O registro cobre `created_tickets` e `open_backlog`, mas omite os demais
  indicadores do snapshot que ainda são consumidos pela Visão Geral e pelos
  mapeadores de Suporte.
- Impacto: o documento se apresenta como registro canônico de KPIs publicados,
  mas deixa métricas efetivamente publicadas sem definição, fonte, período,
  nulo ou limitação. Isso quebra o requisito 1 e reduz a rastreabilidade do
  painel.
- Correção esperada: adicionar as métricas publicadas omitidas, com suas
  bases/coortes, ou declarar explicitamente por que cada uma é legado fora do
  registro e ajustar o escopo/fontes do documento para não prometer cobertura
  maior que a entregue.

### F-KPI-002 — MEDIUM — semântica incorreta de `created_tickets`

- Evidência documental: `docs/ANALYTICS_KPI_REGISTRY_V1.md:73` nomeia a chave
  `created_tickets` como **Atendimentos abertos no período**.
- Evidência executável:
  `supabase/migrations/20260807170000_analytics_kpi_read_models_v3.sql:263`
  usa a base `ticket_created_at` e conta tickets criados; a Visão Geral
  também exibe essa métrica como movimento do período em
  `apps/web/src/features/analytics/AnalyticsCeoPage.tsx:736-747`.
  A posição corrente é o KPI distinto `open_backlog`/`open_tickets`.
- Impacto: “abertos” pode ser interpretado como status atual, confundindo o
  movimento de criação com a posição da fila, exatamente a ambiguidade que o
  registro deveria eliminar.
- Correção esperada: usar “Atendimentos criados no período” ou
  “Atendimentos recebidos no período”, mantendo explícita a distinção de
  `open_backlog` e alinhando a definição de negócio, fonte e coorte.

Não há findings de segurança, SQL, RLS, autorização, runtime ou release
surface neste lote.

## Gates independentes

- `npm run docs:validate`: PASS, 0 documentos bloqueados; 9 alertas
  documentais preexistentes.
- `npm run review:gates`: PASS, 0 regressões bloqueantes e 45 itens do
  baseline resolvidos.
- `node .agents/skills/genius-documentation-governance/scripts/validate-governance-skill.mjs`:
  PASS.
- Auditoria documental `changed --json`: executada read-only; escopo amplo,
  174 documentos analisados, 0 blockers, veredito heurístico
  `consistente com ressalvas`.
- `git diff --check`: PASS.

Typecheck, build, lint, pgTAP e QA de interface não são necessários para este
lote exclusivamente documental e não foram executados.

## Decisão

# CHANGES_REQUESTED

Forge deve responder F-KPI-001 e F-KPI-002 no registro, atualizar as
evidências correspondentes em `IMPLEMENTATION.md`, repetir os gates
documentais e retornar o handoff para `READY_FOR_REVIEW`.

Não alterar código de produto, SQL, contratos, migrations, RLS ou UI para
resolver estes findings. Push, merge, deploy, migration remota, secrets e
release surface continuam proibidos.

## Re-revisão incremental — 2026-08-21

- Task ID: `KPI-REGISTRY-2026-08-21`
- Reviewer: Sentinel (Codex Independent Reviewer)
- Estado recebido: `READY_FOR_REVIEW`
- Owner recebido: `Sentinel`
- Base SHA: `06b24742013dfcd3e74c805b3a8754bd2c632581`
- HEAD efetivamente revisado: `06b24742013dfcd3e74c805b3a8754bd2c632581`
- Estado do código: `UNCOMMITTED_WORKTREE`
- Escopo revisado: somente o lote documental da allowlist. Alterações
  preexistentes e não relacionadas no worktree foram excluídas da decisão.

### Resolução dos findings

- **F-KPI-001 — RESOLVED:** o registro agora inventaria o bloco de Suporte
  publicado pelo `rpc_analytics_cs_snapshot_by_operation`, incluindo
  `total_tickets`, `created_tickets`, `open_tickets`, `closed_tickets`,
  `closed_rate`, `high_priority_open`, `first_response_sla_tracked`,
  `close_sla_tracked` e `source_filled`. A seção em
  `docs/ANALYTICS_KPI_REGISTRY_V1.md:140-168` documenta a coorte por
  `hubspot_tickets.hs_created_at`, o estado corrente do estágio, fórmulas,
  nulos, filtros e a distinção em relação a `open_backlog`. As chaves e suas
  fórmulas conferem com
  `supabase/migrations/20260821150000_analytics_commercial_conversion_semantics_v1.sql:307-320`
  e o mapeamento em
  `apps/web/src/features/analytics/analytics-model.ts:767`.
- **F-KPI-002 — RESOLVED:** `created_tickets` é descrito como
  “Atendimentos criados no período” em
  `docs/ANALYTICS_KPI_REGISTRY_V1.md:73`, com base `ticket_created_at`, e a
  seção do snapshot mantém a separação entre criação da coorte e posição
  corrente (`open_backlog`/`open_tickets`). A definição é consistente com a
  coorte `hs_created_at` e com a consulta executável citada acima.

### Critérios de aceitação na re-revisão

1. **PASS:** o registro cobre as métricas do snapshot de Suporte objeto do
   finding, com fonte, coorte, fórmula, unidade e limitações rastreáveis.
2. **PASS:** `created_tickets` está semanticamente separado de métricas de
   posição corrente e de estado de fechamento.
3. **PASS:** as correções não introduzem alterações em código, SQL, contratos,
   migrations, RLS, permissões, UI ou release surface.
4. **PASS:** as linhas corrigidas permanecem consistentes com o contrato
   executável e o mapeador frontend.

### Gates independentes repetidos

- `npm run docs:validate`: PASS; 0 documentos bloqueados e 9 alertas
  preexistentes.
- `npm run review:gates`: PASS; 0 regressões bloqueantes e 45 itens do
  baseline resolvidos.
- `node .agents/skills/genius-documentation-governance/scripts/validate-governance-skill.mjs`:
  PASS; `valid: true`, sem erros.
- Auditoria documental `changed --json`: PASS em modo read-only; 174
  documentos analisados, 0 blockers, 0 findings de segurança e veredito
  heurístico `consistente com ressalvas`. Os candidatos heurísticos e links
  quebrados pertencem ao worktree amplo e não foram atribuídos a este lote
  sem evidência específica.
- `git diff --check`: PASS.

Typecheck, build, lint, pgTAP e QA de interface permanecem não aplicáveis ao
lote exclusivamente documental, que não alterou código executável,
migrations, contratos ou UI.

## Decisão da re-revisão

# APPROVED

F-KPI-001 e F-KPI-002 estão resolvidos com evidência documental e executável.
Não há finding aberto de severidade `CRITICAL`, `HIGH` ou `MEDIUM` neste lote.
Como a fila canônica marca `Approval = APPROVED`, Forge está autorizado a
executar `FINALIZE_LOCAL`: validar a allowlist, criar commit local exclusivo
do lote, arquivar o handoff, marcar a task como `DONE` e promover a próxima
task elegível. Push, merge, deploy, migration remota, alteração de secrets e
release surface continuam proibidos.
