# Review

## Task ID

OVERVIEW-SNAPSHOT-FLOW-2026-08-21

## Reviewer

Sentinel (Codex Independent Reviewer)

## Estado

AGUARDANDO IMPLEMENTAÇÃO

Forge deve entregar `IMPLEMENTATION.md` completo e `STATUS.md` em
`READY_FOR_REVIEW` antes da revisão independente.

## Revisão independente — 2026-08-21

### Estado e SHAs efetivamente revisados

- Reviewer: Sentinel (Codex Independent Reviewer).
- Estado recebido: `READY_FOR_REVIEW`.
- Owner recebido: `Sentinel`.
- Task ID: `OVERVIEW-SNAPSHOT-FLOW-2026-08-21`.
- Base SHA: `5bf4cc3caab4f6487b0733eeac81e92d7dd176b0`.
- HEAD efetivo: `5bf4cc3caab4f6487b0733eeac81e92d7dd176b0`.
- Implementação: `UNCOMMITTED_WORKTREE`.
- O worktree contém alterações preexistentes; a revisão considerou somente a
  allowlist declarada no lote e não absorveu arquivos alheios.

### O que foi confirmado

- `analytics-api.ts` executa consultas separadas para período e posição atual,
  convertendo datas vazias em `null` antes de chamar os RPCs existentes.
- `analytics-ceo-snapshot.mjs` preserva as métricas de movimento do payload do
  período e substitui os campos de posição atual definidos no helper.
- A composição não muta os payloads de entrada e os testes puros cobrem a troca
  de período, a preservação de movimento e a ausência de zeros criados pelo
  helper.
- Não houve alteração nova de migration, RPC, policy, RLS, autorização,
  tenant, integração externa ou release surface neste lote.

### Findings

#### F-OVERVIEW-001 — HIGH — posição operacional ainda depende do período selecionado

- Evidência: `apps/web/src/features/analytics/AnalyticsCeoPage.tsx:161-166`
  carrega `getCommercialKpisV2(filters, groupCompany)`,
  `getSupportKpisV2(filters, groupCompany)` e `getCsSnapshot(filters, [],
  groupCompany)` usando o mesmo `filters` temporal selecionado.
- Evidência: `apps/web/src/features/analytics/AnalyticsCeoPage.tsx:336-352`
  `applyOperationScope` usa esses resultados para sobrescrever
  `commercial.openPipelineValue`, `commercial.openDeals` e
  `support.openTickets`, que são campos exibidos na posição atual.
- Evidência contratual: `supabase/migrations/20260808290000_analytics_operation_scope_v1.sql:77-110`
  repassa `p_from` e `p_to` das RPCs operacionais para os RPCs KPI base.
- Cenário de falha: com uma operação selecionada, trocar janeiro por fevereiro
  altera o payload operacional e consequentemente a fila atual, negócios abertos
  e pipeline aberto, mesmo quando a posição corrente da operação não mudou.
- Requisito afetado: requisitos 1, 2 e 4 da TASK, além do objetivo de manter a
  posição atual estável quando o período histórico muda.
- Impacto: o fluxo global foi separado, mas a mesma tela continua apresentando
  números temporais como se fossem posição atual quando o filtro de operação
  está ativo. Isso contradiz a distinção Agora/No período e pode orientar
  decisões operacionais com um recorte histórico.
- Correção esperada: separar também a consulta operacional de movimento da
  consulta operacional sem datas, ou deixar indisponíveis as dimensões
  operacionais cuja posição corrente não tenha contrato. Compor os campos de
  posição a partir da resposta sem período e manter os campos de movimento a
  partir da resposta com período. Adicionar teste comportamental para troca de
  período com `groupCompany` selecionado.
- Status: `OPEN`.

### Observação não bloqueante

- O lote dobra as chamadas de cada RPC executivo. A execução paralela reduz a
  latência percebida, mas o custo de quatro chamadas combinadas na abertura da
  Visão Geral deve ser acompanhado em lote futuro ou substituído por composição
  server-side quando houver evidência de impacto.

### Validações independentes

- `node --test tests/scripts/analytics-ceo-snapshot.test.mjs`: **PASS**, 3/3.
- `npm run contracts:typecheck`: **PASS**.
- `npm run web:typecheck`: **PASS**.
- `npm run web:build`: **PASS**, 943 módulos transformados.
- `npm run lint`: **PASS**, 0 erros e 160 warnings preexistentes.
- `npm run review:gates`: **PASS**, 0 regressões e 45 itens do baseline
  resolvidos.
- `npm run docs:validate`: **PASS**, 0 documentos bloqueados e 9 alertas
  documentais preexistentes.
- `git diff --check`: **PASS**.
- Não foi executado pgTAP, pois o lote não altera SQL, RPC, RLS ou dados.
- Não foi feita validação visual/browser nem fluxo autenticado remoto; essas
  ações não são demonstradas por build/typecheck e escrita remota é proibida.

### Segurança e limites

Não foi observada regressão nova de autorização, isolamento de tenant, RLS,
secrets ou integração externa. Sentinel não alterou código de produto, testes,
contratos, migrations ou configuração executável.

## Decisão

# CHANGES_REQUESTED

O caminho global demonstra a separação entre posição corrente e movimento, mas
o caminho com filtro de operação ainda usa RPCs temporais para sobrescrever
campos da posição atual. Forge deve corrigir F-OVERVIEW-001, adicionar a
evidência comportamental correspondente, atualizar `IMPLEMENTATION.md` e
reenviar o lote em `READY_FOR_REVIEW` com `Owner = Sentinel`.

## Re-revisão incremental 2 — 2026-08-21

### Estado e SHAs efetivamente revisados

- Reviewer: Sentinel (Codex Independent Reviewer).
- Estado recebido: `READY_FOR_REVIEW`.
- Owner recebido: `Sentinel`.
- Task ID: `OVERVIEW-SNAPSHOT-FLOW-2026-08-21`.
- Base SHA: `5bf4cc3caab4f6487b0733eeac81e92d7dd176b0`.
- HEAD efetivo: `5bf4cc3caab4f6487b0733eeac81e92d7dd176b0`.
- Implementação: `UNCOMMITTED_WORKTREE`.
- A revisão considerou a allowlist efetiva do lote e o diff real; alterações
  preexistentes fora do lote não foram absorvidas.

### F-OVERVIEW-001 — resolvido

A separação `period/current` permanece confirmada para Comercial, Suporte e
snapshot de Suporte. O teste comportamental com `groupCompany` continua
demonstrando que movimento usa o período e posição usa a variante sem datas.

### F-OVERVIEW-002 — HIGH — permanece aberto

O estado `unavailable` de um payload operacional recebido agora é preservado
no helper e a interface o apresenta como `Indisponível`. Porém, o caminho em
que a consulta operacional ainda não terminou ou falha continua expondo o
snapshot global para uma operação selecionada:

- Evidência: `apps/web/src/features/analytics/AnalyticsCeoPage.tsx:160`
  redefine `operationKpis` para `null` no início de cada carregamento; em
  `:185-186`, qualquer erro das consultas operacionais também deixa esse valor
  como `null`.
- Evidência: em `:227-234`, `operationKpis === null` define
  `operationCurrentAvailability` como todas as flags `true` e usa
  `result.data` diretamente. Esse `result.data` vem de
  `getCeoSnapshot(filters)` em `:190`, que não recebe `groupCompany` e,
  portanto, é o snapshot global.
- Evidência adicional: `:371-382` ainda converte ausência de valor recebido em
  `0` com `?? 0`. As flags atuais impedem esse zero de aparecer no cartão
  quando o payload operacional existe e está indisponível, mas não impedem o
  uso do snapshot global enquanto o payload operacional está ausente.

Cenário: com uma operação selecionada, trocar o período ou sofrer erro em uma
  RPC operacional mantém ou renderiza os valores globais de pipeline, negócios
  abertos e fila atual como se fossem da operação. Como as flags ficam
  verdadeiras nesse intervalo, a interface não mostra `Indisponível` nem um
  estado de carregamento específico da dimensão operacional.

Requisitos afetados: 4, 5 e 6 da TASK. O impacto é atribuição de dado
consolidado à operação selecionada e mascaramento de indisponibilidade, mesmo
com os casos de payload `unavailable` já cobertos.

Correção esperada: quando `groupCompany` estiver selecionado e o payload
operacional estiver carregando, ausente ou com erro, não reutilizar os valores
globais como posição da operação. Exibir estado explícito de carregamento ou
`Indisponível`, preservando a disponibilidade por KPI. Remover também o
fallback artificial para `0` no modelo usado pela posição operacional, ou
garantir por contrato que nenhum consumidor possa observá-lo como ausência.
Adicionar contra-teste para falha/ausência do carregamento operacional, além do
caso de KPI `unavailable` já existente.

### Validações independentes desta re-revisão

- `node --test tests/scripts/analytics-ceo-snapshot.test.mjs`: **PASS**, 4/4.
- `npm run contracts:typecheck`: **PASS**.
- `npm run web:typecheck`: **PASS**.
- `npm run web:build`: **PASS**, 943 módulos transformados.
- `npm run lint`: **PASS**, 0 erros e 160 warnings legados.
- `npm run review:gates`: **PASS**, 0 regressões e 45 itens do baseline
  resolvidos.
- `npm run docs:validate`: **PASS**, 0 documentos bloqueados e 9 alertas
  documentais preexistentes.
- `git diff --check`: **PASS**.
- Não foi executado pgTAP, pois o lote não altera SQL, RPC, RLS ou dados.
- Não foi feita validação visual/browser nem fluxo autenticado remoto.

### Decisão incremental

# CHANGES_REQUESTED

F-OVERVIEW-001 permanece resolvido e o estado `unavailable` de um payload
operacional recebido está melhor coberto. O lote ainda não pode ser aprovado
porque a ausência ou falha do carregamento operacional permite fallback para o
snapshot global quando uma operação está selecionada. Forge deve fechar
F-OVERVIEW-002, adicionar o contra-teste do caminho ausente/com erro, atualizar
`IMPLEMENTATION.md` e reenviar o lote para `READY_FOR_REVIEW` com
`Owner = Sentinel`.

## Re-revisão incremental — 2026-08-21

### Estado e SHAs efetivamente revisados

- Reviewer: Sentinel (Codex Independent Reviewer).
- Estado recebido: `READY_FOR_REVIEW`.
- Owner recebido: `Sentinel`.
- Task ID: `OVERVIEW-SNAPSHOT-FLOW-2026-08-21`.
- Base SHA: `5bf4cc3caab4f6487b0733eeac81e92d7dd176b0`.
- HEAD efetivo: `5bf4cc3caab4f6487b0733eeac81e92d7dd176b0`.
- Implementação: `UNCOMMITTED_WORKTREE`.
- O diff foi revisado pela allowlist efetiva atualizada, sem absorver as
  alterações preexistentes do worktree.

### F-OVERVIEW-001 — resolvido

`AnalyticsCeoPage.tsx` agora usa `getCommercialKpisV2ForOverview`,
`getSupportKpisV2ForOverview` e `getCsSnapshotForOverview`, cada um com
variantes `period` e `current`. A composição usa `current` para
`open_pipeline_amount`, `open_deals` e `open_backlog`, e `period` para ganhos,
perdas, receita, conversão e tickets recebidos. O teste
`tests/scripts/analytics-ceo-snapshot.test.mjs:75-105` demonstra a separação
com `groupCompany`.

### Finding novo

#### F-OVERVIEW-002 — HIGH — ausência operacional cai em dado global ou zero

- Evidência: `apps/web/src/features/analytics/AnalyticsCeoPage.tsx:351-352`
  usa `publishedKpiValue(currentCommercial, ...) ?? data.commercial...` para
  os campos de posição. Quando o KPI operacional vem `unavailable` ou sem
  valor, o componente reutiliza o valor global do snapshot.
- Evidência contratual: `supabase/migrations/20260807130000_analytics_kpi_read_models_v1.sql:241-242`
  constrói os KPIs de pipeline e negócios abertos com `nullif(..., 0)`, e
  `app_private.kpi_entry` os transforma em `state: unavailable` e `value: null`
  quando não há dado confiável.
- Evidência adicional: `AnalyticsCeoPage.tsx:362-364` usa diretamente
  `scoped.current.supportSnapshot.kpis.openTickets`; o mapeador
  `analytics-model.ts:767` converte campo ausente para `0` e não transporta o
  estado `empty/unavailable` da resposta operacional.
- Cenário de falha: uma operação sem pipeline aberto ou sem snapshot de suporte
  pode exibir o pipeline global como se fosse da operação, ou exibir zero como
  posição corrente sem estado explícito.
- Requisitos afetados: requisitos 4, 5 e 6 da TASK.
- Impacto: a separação temporal passa a existir, mas a dimensão operacional
  perde sua semântica de disponibilidade e pode atribuir dados consolidados à
  operação selecionada.
- Correção esperada: preservar estado e valor da variante operacional corrente;
  não fazer fallback silencioso para o consolidado quando a dimensão
  operacional está indisponível. Para suporte, transportar o estado do snapshot
  corrente ou usar o KPI corrente com estado explícito. Exibir `Indisponível`
  quando o contrato não fornece valor confiável e adicionar contra-teste para
  operação sem dados correntes.
- Status: `OPEN`.

### Validações independentes desta re-revisão

- `node --test tests/scripts/analytics-ceo-snapshot.test.mjs`: **PASS**, 4/4.
- `npm run contracts:typecheck`: **PASS**.
- `npm run web:typecheck`: **PASS**.
- `npm run web:build`: **PASS**, 943 módulos transformados.
- `npm run lint`: **PASS**, 0 erros e 160 warnings legados.
- `npm run review:gates`: **PASS**, 0 regressões e 45 itens do baseline
  resolvidos.
- `npm run docs:validate`: **PASS**, 0 documentos bloqueados e 9 alertas
  documentais preexistentes.
- `git diff --check`: **PASS**.
- Não foi executado pgTAP, pois o lote não altera SQL, RPC, RLS ou dados.
- Não foi feita validação visual/browser nem fluxo autenticado remoto.

### Decisão incremental

# CHANGES_REQUESTED

F-OVERVIEW-001 foi corrigido e a separação temporal do caminho operacional foi
confirmada. A revisão não aprova o lote porque F-OVERVIEW-002 ainda permite
misturar posição global com operação selecionada e converter ausência operacional
em zero. Forge deve corrigir o finding, adicionar o teste de estado operacional,
atualizar `IMPLEMENTATION.md` e reenviar o lote para `READY_FOR_REVIEW` com
`Owner = Sentinel`.

## Re-revisão incremental 3 — 2026-08-21

### Estado e SHAs efetivamente revisados

- Reviewer: Sentinel (Codex Independent Reviewer).
- Estado recebido: `READY_FOR_REVIEW`.
- Owner recebido: `Sentinel`.
- Task ID: `OVERVIEW-SNAPSHOT-FLOW-2026-08-21`.
- Base SHA: `5bf4cc3caab4f6487b0733eeac81e92d7dd176b0`.
- HEAD efetivo: `5bf4cc3caab4f6487b0733eeac81e92d7dd176b0`.
- Implementação: `UNCOMMITTED_WORKTREE`.
- A revisão considerou a allowlist declarada e o diff real; alterações
  preexistentes fora do lote não foram absorvidas.

### F-OVERVIEW-001 — resolvido

A separação `period/current` permanece correta para as consultas operacionais.
O contra-teste com `groupCompany` continua demonstrando que a posição atual
usa a variante sem datas e o movimento usa o período selecionado.

### F-OVERVIEW-002 — HIGH — permanece aberto

O novo payload `buildUnavailableOperationKpiPayload()` impede que a posição
operacional reutilize o consolidado quando a carga está ausente ou falha. Porém,
o mesmo payload também é passado para `applyOperationScope`, que ainda faz
fallback para `data`, o snapshot global, nas métricas de movimento:

- Evidência: `apps/web/src/features/analytics/AnalyticsCeoPage.tsx:397-406`
  usa `?? data.commercial.wonDeals`, `?? data.commercial.lostDeals`,
  `?? data.commercial.wonRevenue` e `?? data.commercial.conversionRate`.
- Evidência: `apps/web/src/features/analytics/AnalyticsCeoPage.tsx:408-411`
  usa `?? data.support.createdTickets`.
- Evidência de origem global: `data` é `result.data`, carregado por
  `getCeoSnapshot(filters)` sem `groupCompany`, enquanto o payload operacional
  ausente é aplicado em `:244-257` como `EMPTY_OPERATION_KPIS`.
- O teste `tests/scripts/analytics-ceo-snapshot.test.mjs:114-124` valida apenas
  o helper de composição. Ele não cobre a renderização de movimento através de
  `applyOperationScope`, onde o fallback global permanece.

Cenário: com uma operação selecionada e falha ou ausência do carregamento
operacional, a posição atual fica indisponível, mas Receita ganha, Negócios
ganhos, Conversão e Atendimentos recebidos podem continuar exibindo os números
consolidados como se fossem da operação. Isso contradiz a afirmação de que não
há fallback para o consolidado e viola os requisitos 4, 5 e 6 da TASK.

Correção esperada: quando a dimensão operacional estiver indisponível, não
usar `data` global como fallback para métricas de movimento. Preservar o estado
`unavailable` por KPI e exibir `Indisponível` ou outro estado explícito para os
campos afetados. Adicionar contra-teste que passe payload operacional ausente
pela mesma composição consumida pela tela e prove que nenhum campo de movimento
é substituído por valor global ou zero artificial.

### Validações independentes desta re-revisão

- `node --test tests/scripts/analytics-ceo-snapshot.test.mjs`: **PASS**, 5/5.
- `npm run contracts:typecheck`: **PASS**.
- `npm run web:typecheck`: **PASS**.
- `npm run web:build`: **PASS**, 943 módulos transformados.
- `npm run lint`: **PASS**, 0 erros e 160 warnings legados.
- `npm run review:gates`: **PASS**, 0 regressões e 45 itens do baseline
  resolvidos.
- `npm run docs:validate`: **PASS**, 0 documentos bloqueados e 9 alertas
  documentais preexistentes.
- `git diff --check`: **PASS**.
- Não foi executado pgTAP, pois o lote não altera SQL, RPC, RLS ou dados.
- Não foi feita validação visual/browser nem fluxo autenticado remoto.

### Decisão incremental

# CHANGES_REQUESTED

F-OVERVIEW-001 permanece resolvido. F-OVERVIEW-002 não está fechado porque a
ausência operacional foi tratada apenas para a posição atual; as métricas de
movimento ainda reutilizam o snapshot global dentro de `applyOperationScope`.
Forge deve remover esse fallback, adicionar o contra-teste de composição da
tela, atualizar `IMPLEMENTATION.md` e reenviar o lote para `READY_FOR_REVIEW`
com `Owner = Sentinel`.

## Re-revisão incremental 4 — 2026-08-21

### Estado e SHAs efetivamente revisados

- Reviewer: Sentinel (Codex Independent Reviewer).
- Estado recebido: `READY_FOR_REVIEW`.
- Owner recebido: `Sentinel`.
- Task ID: `OVERVIEW-SNAPSHOT-FLOW-2026-08-21`.
- Base SHA: `5bf4cc3caab4f6487b0733eeac81e92d7dd176b0`.
- HEAD efetivo: `5bf4cc3caab4f6487b0733eeac81e92d7dd176b0`.
- Implementação: `UNCOMMITTED_WORKTREE`.
- A revisão considerou a allowlist do lote e o diff real; alterações
  preexistentes fora do lote não foram absorvidas.

### F-OVERVIEW-001 — resolvido

A separação `period/current` permanece correta para as consultas operacionais.
Posição atual usa a variante sem datas e movimento usa o período selecionado,
com preservação dos filtros não temporais e do `groupCompany`.

### F-OVERVIEW-002 — resolvido

- `buildUnavailableOperationKpiPayload()` fornece estado explícito quando o
  carregamento operacional está ausente ou falha.
- `operationCurrentAvailability` e `operationPeriodAvailability` impedem que a
  UI trate posição ou movimento operacional indisponível como dado global.
- `buildOperationPeriodMetrics()` lê somente KPIs publicáveis da variante
  histórica operacional. `applyOperationScope` deixou de usar o snapshot global
  como fallback para ganhos, perdas, receita, conversão e tickets recebidos.
- O teste `tests/scripts/analytics-ceo-snapshot.test.mjs:127-143` cobre a
  ausência do movimento operacional e confirma que os valores consolidados não
  são reutilizados.
- Os campos internos `0` usados para manter o shape de `CeoSnapshot` ficam
  protegidos pelas flags de disponibilidade e não são exibidos como ausência.

### Critérios de aceitação

Os requisitos 1 e 2 permanecem atendidos pela separação temporal. O requisito 3
é coberto pelo teste de troca de período com `groupCompany`. Os requisitos 4 a 6
foram confirmados pela preservação dos filtros, estados `unavailable` e ausência
de fallback global na composição operacional.

### Validações independentes desta re-revisão

- `node --test tests/scripts/analytics-ceo-snapshot.test.mjs`: **PASS**, 6/6.
- `npm run contracts:typecheck`: **PASS**.
- `npm run web:typecheck`: **PASS**.
- `npm run web:build`: **PASS**, 943 módulos transformados.
- `npm run lint`: **PASS**, 0 erros e 160 warnings legados.
- `npm run review:gates`: **PASS**, 0 regressões e 45 itens do baseline
  resolvidos.
- `npm run docs:validate`: **PASS**, 0 documentos bloqueados e 9 alertas
  documentais preexistentes.
- `git diff --check`: **PASS**.
- Não foi executado pgTAP, pois o lote não altera SQL, RPC, RLS ou dados.
- Não foi feita validação visual/browser nem fluxo autenticado remoto.

### Segurança, escopo e rastreabilidade

Não foi observada regressão nova de tenant isolation, autorização, RLS, secrets,
integrações externas ou release surface. A atualização da regra de notificação
em `docs/engineering/REVIEW_PROTOCOL.md` e `handoffs/README.md` foi uma ação
documental explicitamente solicitada pelo proprietário e não pertence ao lote de
código a ser finalizado pelo Forge.

### Decisão incremental

# APPROVED

F-OVERVIEW-001 e F-OVERVIEW-002 estão resolvidos com evidência no diff, nos
testes e nos gates independentes. Como a fila canônica marca a task com
`Approval = APPROVED`, Forge está autorizado a executar `FINALIZE_LOCAL` para
este lote: validar a allowlist, criar commit local exclusivo, arquivar o
handoff, marcar a task como `DONE` e abrir a próxima task elegível. Push, merge,
deploy, migration remota, secrets e release surface continuam proibidos.
