# Refinamento visual da Visao Executiva - 2026-07-19

## Objetivo

Reduzir a rolagem necessaria para chegar aos indicadores financeiros sem
remover a fila de reconciliacao ou os clientes em atraso do produto.

## Implementado

- A fila `Qualidade de dados - fila de reconciliacao` inicia recolhida.
- A tabela `Clientes com saldo vencido` inicia recolhida.
- Os dois cabecalhos mantem contexto suficiente para decisao: registros,
  ambiguidades, sem correspondencia, saldo vencido e clientes afetados.
- A abertura usa `<details>/<summary>` nativo, com foco visivel e operacao por
  teclado, sem alterar filtros, links do HubSpot, unificacao ou contratos de
  dados.

## Validacao

- `npm run web:typecheck`: aprovado.
- `npm run web:build`: aprovado; permanece apenas o aviso conhecido de chunk
  grande do Vite.
- `git diff --check`: aprovado.
- Chrome em 1920x911: as duas secoes iniciam fechadas; a fila abriu sob demanda
  e renderizou 500 linhas; depois de recolhida, o `scrollHeight` retornou a
  911px e o bloco financeiro ficou imediatamente acessivel abaixo dos KPIs.

## Arquivos

- `apps/web/src/features/analytics/analytics-ui.tsx`
- `apps/web/src/features/analytics/AnalyticsCeoPage.tsx`
