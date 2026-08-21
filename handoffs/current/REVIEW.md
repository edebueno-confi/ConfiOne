# Review

## Veredito formal

- Task ID: `COMMERCIAL-GOALS-MRR-2026-08-21`
- Reviewer: Sentinel (Codex Independent Reviewer)
- Data: 2026-08-21
- Estado recebido: `READY_FOR_REVIEW`
- Owner recebido: `Sentinel`
- Base SHA: `d3f26bfe6ac22f06376c5797c48d6b1221366cf2`
- HEAD efetivamente revisado: `d3f26bfe6ac22f06376c5797c48d6b1221366cf2`
- Estado do lote: `UNCOMMITTED_WORKTREE`

## Escopo e diff revisados

O lote foi limitado à fundação documental de metas financeiras/MRR, conforme a
allowlist do `TASK.md`. Foram revisados:

- `docs/ANALYTICS_MRR_GOALS_FOUNDATION_V1.md`
- `docs/PROJECT_STATE.md`
- `docs/DOCUMENTATION_LEDGER.md`
- `docs/README.md`
- `handoffs/README.md`
- `handoffs/current/TASK.md`
- `handoffs/current/IMPLEMENTATION.md`
- `handoffs/current/STATUS.md`
- `handoffs/current/REVIEW.md`

O worktree contém alterações amplas preexistentes e não relacionadas. Nenhum
arquivo executável, migration, RPC, contrato backend, teste de produto ou UI foi
atribuído a este lote. Push, merge, deploy, migration remota, secrets e release
surface permanecem fora do escopo.

## Evidências independentes

- `supabase/migrations/20260807130000_analytics_kpi_read_models_v1.sql:679-686`
  e `supabase/migrations/20260809060338_analytics_finance_identity_reconciliation_v1.sql:320-321`
  publicam `mrr_total` com base temporal `company_recurring_revenue_now`,
  estados `available`, `partial` ou `unavailable` e motivo explícito para fonte
  não resolvida ou cobertura incompleta.
- `supabase/migrations/20260807120000_analytics_kpi_foundation_v1.sql:126-165`
  define a base atual de clientes/MRR e preserva ausência como `NULL`, sem
  transformar dado ausente em zero.
- `apps/web/src/features/analytics/analytics-api.ts:351-355` chama a RPC de
  Customer Success sem parâmetros temporais, e
  `apps/web/src/features/analytics/AnalyticsCustomerSuccessPage.tsx:14-18,96-100`
  trata a superfície como posição atual, sem filtro de período.
- `supabase/migrations/20260807120000_analytics_kpi_foundation_v1.sql:238-251,269-289,343-357`
  materializa armazenamento de snapshots diários, incluindo
  `recurring_revenue_total`, mas esse mecanismo é de captura operacional, não
  um contrato de meta ou de série histórica consumível pela interface.
- `supabase/migrations/20260807180000_analytics_kpi_least_privilege_v1.sql:27-43`
  revoga a leitura direta de `analytics_kpi_daily_snapshot` para
  `authenticated`; `rpc_analytics_kpi_settings()` expõe apenas
  `history_since`/`history_days` em `20260807120000...:454-484`. Não foi
  localizado RPC publicado para leitura histórica de MRR.
- A documentação revisada separa período da meta, janela histórica e `as_of`,
  mantém ausência como `unavailable`/`PROPOSED` e não propõe distribuição sem
  fonte válida.

## Critérios de aceitação

1. **PARCIAL:** as fontes e semânticas estão em grande parte rastreáveis, mas
   há uma formulação contraditória sobre a fonte de MRR e uma fronteira não
   explicitada entre snapshot armazenado e série histórica publicada.
2. **PASS:** período da meta, janela histórica e data de corte são conceitos
   separados no documento.
3. **PASS:** a ausência de meta, fonte ou cobertura não é convertida em zero.
4. **PASS:** `npm run review:gates` passou sem regressões bloqueantes e sem
   alteração do baseline.
5. **PARCIAL:** as lacunas são classificadas como `PROPOSED`, indisponíveis ou
   dependentes de decisão, mas a redação precisa ser corrigida para não criar
   uma lacuna factual adicional.

## Findings

### F-MRR-001 — MEDIUM — frase contraditória sobre a fonte de MRR

- Evidência: `docs/ANALYTICS_MRR_GOALS_FOUNDATION_V1.md:11-14` afirma que
  existe um contrato de MRR operacional e, na sequência, que não existe fonte
  canônica publicada para “metas financeiras ou MRR”. O próprio documento em
  `:20-41` descreve `vw_analytics_customer_base`,
  `rpc_analytics_customer_success_kpis_v2()` e `mrr_total` como fontes reais
  de posição atual. A migration e a RPC também confirmam essa publicação nos
  trechos listados acima.
- Impacto: o documento canônico pode ser interpretado como se o MRR atual
  também não existisse, contrariando a evidência executável e confundindo a
  separação entre MRR atual, histórico de MRR e meta financeira.
- Correção esperada: substituir a redação por algo inequívoco, por exemplo:
  “não possui fonte canônica publicada para metas financeiras nem para uma
  série histórica confiável de MRR”, preservando a afirmação de que o MRR
  operacional de posição atual é publicado.

### F-MRR-002 — MEDIUM — fronteira entre snapshots históricos e contrato publicado

- Evidência: `analytics_kpi_daily_snapshot` armazena
  `recurring_revenue_total` e a captura diária existe em
  `supabase/migrations/20260807120000_analytics_kpi_foundation_v1.sql:238-357`.
  Entretanto, `20260807180000_analytics_kpi_least_privilege_v1.sql:27-43`
  revoga a leitura direta para usuários autenticados, e o contrato exposto por
  `rpc_analytics_kpi_settings()` fornece apenas o tamanho da série
  (`history_since`/`history_days`), sem dados históricos de MRR. Não foi
  localizado read model ou RPC de consumo dessa série pelo produto.
- Impacto: sem essa distinção explícita, “histórico não publicado” pode ser
  entendido tanto como “não existe armazenamento” quanto como “existe captura,
  mas não existe contrato de leitura confiável”. Isso prejudica a rastreabilidade
  exigida pelo TASK e pode induzir uma futura implementação a consultar a tabela
  diretamente ou a declarar histórico publicado sem contrato.
- Correção esperada: incluir `analytics_kpi_daily_snapshot` na seção de fontes
  ou evidências, declarando que há captura interna de snapshots de MRR, mas não
  há contrato autenticado/publicado para leitura histórica, nem base suficiente
  para meta, atingimento ou distribuição. Não criar código neste lote.

Não foram encontrados findings `CRITICAL` ou `HIGH`, nem risco novo de
cross-tenant, RLS, secrets, escrita externa ou alteração executável neste lote.
O finding histórico `P-COMM-EVOLUTION-001` permanece `PROPOSED` e fora desta
task.

## Gates independentes

- `npm run docs:validate`: PASS, 0 documentos bloqueados; alertas catalogados
  e preexistentes foram preservados.
- `node .agents/skills/genius-documentation-governance/scripts/validate-governance-skill.mjs`:
  PASS, `valid: true`, sem erros.
- `node .agents/skills/genius-documentation-governance/scripts/run-documentation-audit.mjs changed --json`:
  PASS, 0 blockers, 0 security findings, veredito heurístico `consistente com
  ressalvas`; o escopo amplo do worktree gerou conflitos heurísticos que não
  foram atribuídos a este lote.
- `npm run review:gates`: PASS, 0 regressões bloqueantes e 45 itens do baseline
  resolvidos.
- `git diff --check`: PASS.
- Typecheck, build, lint e testes de runtime não foram executados porque o lote
  não alterou código executável; essa limitação é proporcional e permanece
  registrada no `IMPLEMENTATION.md`.

## Decisão

# CHANGES_REQUESTED

Os gates passam e o lote permanece corretamente documental, mas os dois
findings `MEDIUM` impedem aprovação formal porque a documentação canônica ainda
não é totalmente consistente com os contratos reais nem suficientemente precisa
sobre o histórico armazenado versus publicado.

Forge deve corrigir somente a documentação dentro da allowlist, responder aos
dois findings no `IMPLEMENTATION.md`, repetir os gates documentais aplicáveis e
reenviar o handoff em `READY_FOR_REVIEW` com `Owner: Sentinel`.

Como a fila marca `Approval = APPROVED`, a correção continua autorizada dentro
do lote. Após nova aprovação formal, Forge poderá executar `FINALIZE_LOCAL` com
commit local exclusivo, arquivamento e marcação `DONE`. Push, merge, deploy,
migration remota, alteração de secrets e release surface continuam proibidos.

## Re-review incremental

- Task ID: `COMMERCIAL-GOALS-MRR-2026-08-21`
- Reviewer: Sentinel (Codex Independent Reviewer)
- Data: 2026-08-21
- Estado revisado: `READY_FOR_REVIEW`
- Owner revisado: `Sentinel`
- Base SHA: `d3f26bfe6ac22f06376c5797c48d6b1221366cf2`
- HEAD efetivamente revisado: `d3f26bfe6ac22f06376c5797c48d6b1221366cf2`
- Estado do lote: `UNCOMMITTED_WORKTREE`

### Findings respondidos

- `F-MRR-001`: **RESOLVED**. A decisão agora afirma que o Analytics publica
  MRR operacional de posição atual e que não há fonte publicada para metas
  financeiras nem para uma série histórica confiável de MRR.
- `F-MRR-002`: **RESOLVED**. A documentação agora identifica
  `analytics_kpi_daily_snapshot` e `recurring_revenue_total`, distinguindo a
  captura interna da ausência de contrato autenticado/publicado de leitura
  histórica. Também registra a revogação da leitura direta autenticada e que
  `rpc_analytics_kpi_settings()` expõe apenas `history_since` e `history_days`.

### Critérios de aceitação

1. **PASS:** fontes, contratos e semântica temporal estão rastreáveis, com a
   distinção explícita entre MRR atual, snapshot interno, histórico publicado
   e meta financeira.
2. **PASS:** período da meta, janela histórica e data de corte permanecem
   separados.
3. **PASS:** ausência, cobertura insuficiente e histórico não publicado não
   são convertidos silenciosamente em zero.
4. **PASS:** gates aplicáveis passaram sem alteração do baseline.
5. **PASS:** lacunas continuam classificadas como `PROPOSED`,
   `unavailable` ou dependentes de contrato/decisão futura, sem inferência não
   comprovada.

### Gates independentes da re-review

- `npm run docs:validate`: PASS, 0 documentos bloqueados.
- `node .agents/skills/genius-documentation-governance/scripts/validate-governance-skill.mjs`:
  PASS, `valid: true`, sem erros.
- `node .agents/skills/genius-documentation-governance/scripts/run-documentation-audit.mjs changed --json`:
  PASS, 0 blockers e 0 security findings; veredito heurístico `consistente
  com ressalvas` por conflitos preexistentes do worktree misto.
- `npm run review:gates`: PASS, 0 regressões bloqueantes e 45 itens do
  baseline resolvidos.
- `git diff --check`: PASS.
- Typecheck, build, lint e testes de runtime permanecem não aplicáveis ao
  lote documental, sem alteração de código executável.

## Decisão final

# APPROVED

Os findings `F-MRR-001` e `F-MRR-002` foram resolvidos com evidência
documental consistente com os contratos executáveis. O lote atende aos
critérios de aceitação e está aprovado.

Como a fila canônica marca `Approval = APPROVED`, Forge está autorizado a
executar `FINALIZE_LOCAL`: validar a allowlist, fazer stage seletivo, criar
commit local exclusivo, registrar o SHA, arquivar o handoff, marcar a task como
`DONE` e iniciar a próxima task autorizada. Push, merge, deploy, migration
remota, alteração de secrets e release surface continuam proibidos.
