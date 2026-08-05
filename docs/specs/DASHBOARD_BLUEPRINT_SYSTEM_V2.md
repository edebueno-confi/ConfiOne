# Dashboard Blueprint System V2

**Status:** referência conceitual para revisão do Product Owner
**Data:** 2026-08-03
**Escopo:** blueprints e direção visual; sem implementação de frontend neste lote

## Tese visual

O Dashboard Gerencial é um **cockpit editorial de decisão**: uma superfície
compacta que leva o olhar do contexto para o sinal e do sinal para a próxima
ação segura. A composição usa uma faixa de leitura instantânea, uma zona
temporal proporcional ao recorte e um detalhe operacional curto.

O blueprint não representa dados reais. Valores aparecem como `—`,
`Indisponível` ou `conceitual` até que o contrato entregue uma leitura factual.

## Gramática de tela

1. **Header:** nome da superfície, propósito em uma linha e estado de fonte em
   uma única faixa semântica.
2. **Filtro:** período e dimensões diretamente ligadas à pergunta da área.
3. **Metric rail:** três a cinco KPIs compactos, com valor, contexto e delta
   somente quando o contrato os sustentar.
4. **Zona de evolução:** microtendência, série semanal ou série mensal conforme
   a faixa temporal; nunca um gráfico ornamental.
5. **Detalhe operacional:** tabela, breakdown, lista ou trilho de integridade.
6. **Insight/ação:** alerta curto e ação próxima do problema, sem CTA competir
   com o dado principal.

## Regra KPI versus série temporal

| Período | Protagonista | Temporalidade permitida | Tratamento visual |
| --- | --- | --- | --- |
| Até 31 dias | KPIs | microtendência diária ou semanal | sparkline ou faixa de 1/3 da largura; sem gráfico grande |
| 32–90 dias | KPIs | semanal | gráfico compacto, comparativo e recolhível |
| 91–365 dias | KPIs + evolução | mensal | série mensal com comparação e distribuição |
| Acima de 1 ano | tendência | mensal ou trimestral | comportamento, sazonalidade e comparação; nunca granularidade diária |

### Separação obrigatória

- **Instantâneo:** estado atual, posição, risco e comparação sintética.
- **Histórico:** como o sinal mudou no tempo e em qual granularidade.
- **Analítico:** cortes por pipeline, responsável, faixa ou origem.
- **Operacional:** lista ou tabela que permite localizar o próximo trabalho.

Um mesmo valor não deve aparecer simultaneamente em KPI, gráfico e tabela sem
que cada repetição responda a uma pergunta diferente.

## Densidade e resolução

- Canvas de composição: 1920×1080; validação secundária em 1440×900, 1024×768,
  768×1024 e 390×844.
- Margem principal: 24–32px; gaps: 12–20px; padding de bloco: 12–16px.
- Título de página: 24–32px; títulos de seção: 15–17px; dados principais:
  compactos, sem gigantismo.
- Quatro KPIs no desktop largo; dois somente quando a largura permitir; um por
  linha no mobile.
- Bordas delimitam interação ou agrupamento. O espaço em branco organiza a
  leitura; não se cria uma caixa para cada elemento.
- A rolagem fica no conteúdo operacional quando necessária, nunca na sidebar e
  nunca como consequência de um gráfico grande em recorte curto.

## Visualização

- Use linhas e barras somente quando o eixo, a unidade, a janela e a origem
  forem legíveis.
- Prefira tabela compacta a gráfico quando há poucos pontos ou uma única janela
  mensal.
- Use estado `Indisponível` quando faltarem fonte, denominador ou snapshot; não
  substitua ausência por zero.
- A legenda explica a pergunta do gráfico, não o nome técnico do read model.
- A cor semântica marca risco, atenção ou saúde; não colore todos os KPIs.

## Gênio

O Gênio é um **avatar do sistema**: amigável, tecnológico, com forma definida e
presença funcional. Ele aparece em loading, vazio, sucesso e orientação, mas não
compete com a operação.

Permitido:

- halo discreto, brilho controlado e pequenos sinais de atividade;
- flutuação curta com `transform` e `opacity`;
- postura de assistente orientando o painel;
- cópia factual aprovada por etapa.

Proibido:

- silhueta transparente ou fantasmagórica;
- espírito, aparição, fantasma ou entidade sobrenatural;
- aura que vire o conteúdo principal;
- progresso, contagem ou sucesso inventados;
- Gênio repetido em todos os cards.

Copy de referência para UI-05:

- geral: “O Gênio está organizando os dados do painel”;
- HubSpot: “O Gênio está atualizando os dados do HubSpot”;
- OMIE: “O Gênio está organizando os dados financeiros do OMIE”;
- publicação: “O Gênio está finalizando a atualização”.

Com `prefers-reduced-motion`, remover voo e partículas móveis, mantendo avatar,
halo estático e o mesmo contexto textual.

## Critério de blueprint

Cada imagem deve tornar identificáveis: header, filtro, KPIs, comportamento
temporal, detalhe operacional, sinais/alertas e, quando aplicável, a presença
do Gênio. Os blueprints são referência de composição, não telas runtime e não
autorizam alteração de fonte, métrica, contrato ou sincronização.
