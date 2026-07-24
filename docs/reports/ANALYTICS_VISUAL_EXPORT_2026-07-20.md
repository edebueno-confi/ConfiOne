# Exportacao visual do Dashboard Gerencial — 2026-07-20

## Problema corrigido

O fluxo anterior chamava `window.print()` diretamente na tela operacional.
Isso imprimia o shell global, menu, navegacao e apenas a aba atualmente aberta.

## Solucao

- O shell agora abre um configurador de relatorio visual.
- O usuario escolhe Visao executiva, Comercial, CS/Suporte e/ou Financeiro.
- Os dados das quatro abas sao carregados pelos snapshots reais do periodo global.
- O PDF e gerado em uma janela de documento dedicada, sem sidebar, header ou
  controles operacionais.
- O PNG e renderizado localmente em canvas a partir de um relatorio estruturado.
- CSV foi removido do fluxo visual; permanece fora da experiencia de relatorio.

## Seguranca e limites

- Nenhum dado e enviado a terceiros.
- O relatorio respeita o periodo compartilhado entre as abas.
- A exportacao e somente leitura e nao altera filtros, HubSpot, OMIE ou banco.
- Se o navegador bloquear pop-ups, a interface informa que o bloqueio precisa
  ser liberado para gerar o PDF.

## Validacao

- `npm run web:typecheck`: aprovado.
- `npm run web:build`: aprovado; permanece apenas o alerta conhecido de chunks
  maiores que 500 kB.
- QA local chegou a tela de login; o fluxo autenticado nao foi executado porque
  a sessao local nao estava disponivel no navegador de validacao.
