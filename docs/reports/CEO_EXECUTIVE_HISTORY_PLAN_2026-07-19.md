# Plano da Visao Historica Executiva — 2026-07-19

## Decisao

A Visao Executiva deve responder nao apenas "quanto temos agora", mas tambem
"como estamos evoluindo". O recorte selecionado deve continuar global entre
as abas, enquanto a serie historica usa o mesmo periodo para manter a leitura
comparavel.

## Primeira entrega planejada

- Comercial: receita ganha, deals criados, ganhos, perdas, conversao e ticket
  medio por mes.
- Suporte / CS: tickets criados, encerrados, taxa de encerramento e abertos
  por mes.
- Financeiro: saldo vencido, recebido, saldo em aberto e titulos por mes.
- Comparacao: variacao contra o periodo imediatamente anterior de mesma
  duracao, com indicador de alta, queda ou estabilidade.
- Leitura: tooltip com valor absoluto, variacao e origem da metrica.

## Semantica visual

- Verde: ganho, encerramento, recebimento ou melhora operacional.
- Azul: volume neutro, criado ou em andamento.
- Amarelo: espera, atencao ou risco moderado.
- Vermelho: perda, atraso, erro ou risco critico.
- Cinza: indisponivel, sem classificacao ou dado insuficiente.

## Ordem de execucao

1. Consolidar series temporais server-side no read model executivo.
2. Adicionar comparacao com periodo anterior sem alterar o historico.
3. Renderizar graficos responsivos com estados vazio, loading e erro.
4. Validar as metricas com os recortes atuais e documentar a fonte de cada
   ponto.
