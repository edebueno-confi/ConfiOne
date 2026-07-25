# DASHBOARD-02 — Blueprint UX/UI de confiança

Este documento define a evolução futura sem implementar uma reconstrução visual
neste lote.

## Princípios

- Todo indicador exibe valor, significado, período, fonte, estado da fonte e
  última atualização quando esses dados existirem.
- Zero é um resultado válido; ausência, atraso, erro e fonte não configurada
  têm estados próprios.
- O filtro de período afeta apenas métricas de fluxo. Posição financeira atual
  declara explicitamente que não é afetada pelo período.
- Ação de retry deve ser contextual e não apagar dados ainda válidos.

## Superfícies

| Superfície | Estado principal | Próxima ação |
| --- | --- | --- |
| Visão executiva | comparação entre desempenho no período e risco atual | ajustar período ou investigar fonte |
| Comercial | pipeline, conversão e receita por período | filtrar pipeline/período |
| CS | tickets, prioridade, SLA e cobertura | investigar fila/pipeline |
| Financeiro | posição atual, recebimentos e aging | configurar fonte ou revisar carteira |

## Estados visuais

`loading` preserva a estrutura; `syncing` identifica atualização em andamento;
`empty` informa resposta sem registros; `not_configured` orienta configuração;
`partial` mostra cobertura; `stale` mostra a data; `unavailable` e `error`
oferecem retry sem revelar detalhes técnicos sensíveis.

## Fora deste lote

Não inclui redesign completo, nova fonte de dados, nova regra de negócio,
integração externa, migration remota ou promessa de frequência de sincronização
que não esteja registrada no sistema.
