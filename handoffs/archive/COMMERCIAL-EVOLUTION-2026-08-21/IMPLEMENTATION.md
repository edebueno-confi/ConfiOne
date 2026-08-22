# Implementation

## Task ID

COMMERCIAL-EVOLUTION-2026-08-21

## Implementador

Forge (Codex)

## Estado do handoff

COMPLETED

## Base e SHAs

- Base SHA: `de314b56ca57202290bbbd332a469bb1ffcb8afa`.
- Implementation SHA: `d3f26bfe6ac22f06376c5797c48d6b1221366cf2`.
- Branch: `main`.

## Investigação inicial

- `AnalyticsTrendPanel` e `rpc_analytics_timeseries_by_operation` já publicam
  evolução comercial por criação, ganho, perda e taxa de ganho.
- `getCommercialKpisV2` já chama o RPC operacional com filtros, owner e
  `groupCompany`; será reutilizado para os dois períodos.
- `analytics-kpi-contract.mjs` é a fronteira de estados e impede transformar
  ausência de fonte em zero.
- `stage_aging_days` está publicado como `awaiting_history` quando não existe
  histórico suficiente de entrada na etapa; a task não autoriza inventar essa
  idade.

## Plano executado

- [x] criar cálculo puro do período anterior equivalente e dos deltas;
- [x] criar componente de comparação temporal com estados explícitos;
- [x] integrar a comparação na aba Comercial sem alterar o contrato backend;
- [x] adicionar testes focados;
- [x] executar gates e registrar evidências;
- [x] entregar `READY_FOR_REVIEW` para Sentinel.

## Implementação produzida

- `analytics-commercial-comparison.mjs` deriva períodos anteriores inclusivos,
  calcula delta absoluto e variação relativa sem divisão por zero e reaproveita
  `readKpi`, preservando `unavailable`, `partial` e `awaiting_history`.
- `AnalyticsCommercialComparison.tsx` mostra atual, anterior, delta absoluto e
  delta percentual para criação, ganhos, perdas, receita e conversão. Conversão
  é apresentada em pontos percentuais, com variação relativa separada.
- `AnalyticsCommercialPage.tsx` faz a segunda leitura pelo mesmo RPC, com os
  mesmos filtros e `groupCompany`, e adiciona a comparação à aba Posição.
- `stage_aging_days` é lido pelo contrato existente e exibido como
  `Indisponível` ou `Aguardando histórico`; nenhuma idade é inferida.
- `analytics-commercial-comparison.d.mts` mantém a fronteira tipada do módulo
  JavaScript sem alterar o contrato de dados.
- `analytics-commercial-evolution.test.mjs` cobre datas, períodos abertos,
  deltas, base zero e preservação de estados sem fonte.

## Validações

- `node --test tests/scripts/analytics-commercial-evolution.test.mjs` — PASS;
  4/4 testes.
- `npm run web:typecheck` — PASS.
- `npm run web:build` — PASS; 945 módulos transformados.
- `npm run review:gates` — PASS; 0 regressões bloqueantes e 45 itens do
  baseline resolvidos.
- `npm run lint` — PASS; 0 erros e 160 warnings legados após remover o aviso
  adicional de import duplicado deste lote.
- `git diff --check` — PASS.
- `npm run test` — LIMITAÇÃO PREEXISTENTE: a suíte focada executa os testes
  novos e falha em `analytics-dashboard-domains-integrations.test.mjs:53`, que
  exige um padrão antigo em `AnalyticsCeoPage.tsx`, arquivo fora da allowlist e
  não alterado por esta task. Não foi corrigido para mascarar regressão externa.

## Entrega para revisão

- Estado: `COMPLETED`.
- Owner: `Forge`.
- Reviewer active: `Sentinel`.
- Implementation SHA: `d3f26bfe6ac22f06376c5797c48d6b1221366cf2`.
- Alterações de produto limitadas à allowlist; nenhum SQL, RPC, view,
  migration, RLS, contrato backend ou release surface foi alterado.

## Limitações conhecidas

- A comparação só é calculável para um período delimitado. `Todo o período`
  mantém o estado indisponível para evitar uma comparação arbitrária.
- Aging de etapa depende de histórico de transições não publicado neste lote.

## Finalização local

- Veredito formal do Sentinel: `APPROVED`.
- Approval da fila: `APPROVED`.
- Commit local exclusivo do lote: `d3f26bfe6ac22f06376c5797c48d6b1221366cf2`.
- Stage seletivo confirmado nos cinco caminhos de produto da allowlist.
- Nenhuma alteração preexistente foi incluída no commit.
- Handoff a arquivar em `handoffs/archive/COMMERCIAL-EVOLUTION-2026-08-21/`.
- Nenhuma operação externa foi executada.
