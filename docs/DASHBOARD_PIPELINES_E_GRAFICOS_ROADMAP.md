# Pipelines, etapas e gráficos do Dashboard — mapeamento e roadmap

Levantado em 2026-08-07 a partir de apontamentos da operação, com medição contra
os dados reais. **Nada aqui foi implementado ainda.** É mapa, não entrega.

---

## 1. Etapas duplicadas no gráfico de atendimentos

### 1.1 Defeito confirmado: a consolidação compara texto cru

O read model **já consolida etapas pelo nome** e mostra a distribuição por
pipeline no detalhe. O problema é que a comparação é literal:

| Nome exibido | Etapa | Pipeline | Tickets |
| --- | --- | --- | --- |
| `Em Tratativa` | 6980766 | Suporte B2B | 1 |
| `Em tratativa ` | 56125486 | Fale conosco | 1 |

Maiúscula diferente e um espaço no fim criam duas linhas para o mesmo conceito.
É defeito, não decisão.

**Correção:** normalizar para agrupamento — remover espaços das pontas, colapsar
espaços internos e comparar sem diferenciar caixa —, preservando como rótulo a
variante mais frequente.

### 1.2 Problema maior, que a normalização não resolve

Mesmo com o texto normalizado, sobram conceitos iguais com nomes diferentes na
origem:

| Conceito | Nomes reais | Pipelines | Tickets |
| --- | --- | --- | --- |
| Entrada | `Novo`, `Aberto` | 5 + 1 | 2.387 + 9 |
| Encerramento | `Fechado`, e variações por pipeline | 4 | 3.392 |
| Espera com o cliente | `Aguardando Cliente`, `Aguardando retorno` | 2 + 1 | 39 + 60 |

Isso **não é erro de digitação**: são vocabulários distintos, criados por times
distintos, ao longo do tempo. Resolver exige uma tabela de mapeamento
`etapa da origem → etapa canônica`, que é decisão de produto, não de código.

**Recomendação:** um mapeamento explícito e auditável, semeado por migration e
editável na tela de configuração, com as etapas não mapeadas aparecendo como
"Não classificada" — nunca silenciosamente agrupadas em outra coisa.

### 1.3 Por que não fizemos só a correção barata

Corrigir apenas o espaço e a caixa resolveria 2 dos ~6 conceitos duplicados e
daria a impressão de que o problema acabou. As duas coisas devem entrar juntas.

---

## 2. Pipelines misturando frentes diferentes — confirmado

A suspeita da operação está certa, e a evidência é forte.

| Pipeline | Tickets | Abertos | % aberto | Idade mediana da fila |
| --- | --- | --- | --- | --- |
| Criadouro de Tíquetes \| Aftersale | 27.775 | 174 | **0,6%** | 78 dias |
| Fale conosco \| Confi | 2.697 | 1.441 | 53,4% | **316 dias** |
| Confi \| Whatsapp | 2.296 | 947 | 41,2% | **428 dias** |
| Suporte B2B \| Confi | 860 | 79 | 9,2% | 276 dias |
| Suporte | 749 | 210 | 28,0% | 240 dias |
| Atendimento \| Confi Analytics | **8** | 2 | 25,0% | 844 dias |

### 2.1 O que os números dizem

**O Criadouro não é fila de atendimento.** Concentra 81% de todos os tickets e
tem 0,6% em aberto. O comportamento é de repositório histórico ou de entrada, não
de operação ativa. Ele infla todo indicador de volume da aba.

**Duas filas parecem abandonadas.** "Fale conosco" e "Whatsapp" guardam 2.388 dos
2.853 atendimentos em aberto — **84% da fila** — com idade mediana de 316 e 428
dias. Ou são canais sem dono, ou são caixas de entrada que ninguém encerra.

**Um pipeline é ruído estatístico.** "Atendimento | Confi Analytics" tem 8
tickets no total e uma mediana de 844 dias que não significa nada.

### 2.2 Consequência direta no que já foi publicado

A "espera mediana na fila" de 346 dias que o painel mostra hoje está
**tecnicamente correta e narrativamente enganosa**. Ela é dominada por duas filas
que aparentam abandono. Quem ler vai concluir que o suporte demora 346 dias para
atender, o que não descreve a operação viva.

Este é exatamente o tipo de erro que a regra de "nunca mostrar zero por ausência"
não pega: o número existe, a fonte é real, e ainda assim a leitura induz ao erro.

### 2.3 O que precisa ser decidido

1. **Quais pipelines pertencem à aba Suporte** de fato. Sugestão para avaliação:
   separar filas ativas de repositórios, e não somá-los no mesmo indicador.
2. **O que fazer com filas sem dono.** Excluir da média esconde o problema;
   incluir sem distinguir contamina o número. Uma terceira via é exibi-las
   separadamente, como sinal operacional.
3. **Se pipelines com volume irrelevante** entram no recorte padrão.

Nenhuma dessas é decisão técnica.

---

## 3. Seletor de pipelines: marcar e desmarcar todos

Pedido da operação. Hoje o seletor exige clique por item, e a aba Suporte tem
seis pipelines ativos e vinte e quatro catalogados.

Escopo previsto: ações de "selecionar todos" e "limpar seleção", contagem do que
está ativo, e preservação do comportamento atual de não alterar a configuração
persistida — o seletor é recorte de leitura, não configuração.

---

## 4. Sub-abas temporais por domínio

Ideia levantada pela operação: dentro de cada domínio, uma sub-aba dedicada a
evolução no tempo — crescimento, queda, ganhos e perdas.

### 4.1 Avaliação honesta: viável em três dos cinco domínios, hoje

O que existe de série temporal **real** neste momento:

| Domínio | Base disponível | Serve para gráfico temporal hoje? |
| --- | --- | --- |
| Suporte | 34.385 aberturas e 31.532 encerramentos com data | **Sim**, série mensal completa |
| Comercial | 2.104 aberturas e 897 fechamentos com data | **Sim** |
| Financeiro | vencimento, emissão e baixa por título | **Sim** |
| Carteira / receita recorrente | snapshot iniciado em 2026-08-07 | **Não** — um único ponto |
| Retenção, churn, NRR | mesma série | **Não** |

### 4.2 O risco de construir tudo de uma vez

Uma sub-aba "evolução" na Carteira mostraria hoje **um ponto**. Um gráfico com um
ponto sugere tendência onde não há, que é a mesma falha de honestidade que o
resto do painel combate. A regra vigente diz para declarar "aguardando
histórico"; abrir uma sub-aba vazia contradiz isso na prática.

**Recomendação:** construir as sub-abas de Suporte, Comercial e Financeiro, que
têm dado real, e deixar Carteira e Retenção com o estado explícito de espera e a
data em que passam a ser úteis — trinta dias de captura dá comparação
mês contra mês; noventa dias dá tendência.

### 4.3 Sub-aba é a estrutura certa?

Sim, e por um motivo de conteúdo, não de navegação: **as perguntas são
diferentes**. "Qual é a posição" e "como evoluiu" pedem recortes de data,
granularidades e visualizações distintas. Espremer as duas na mesma tela é o que
produz painel confuso.

O cuidado é não duplicar indicador entre a sub-aba de posição e a de evolução —
seria repetir o defeito de duplicidade que acabou de ser corrigido. A sub-aba
temporal deve mostrar **séries**, não repetir os cartões.

### 4.4 Conteúdo previsto por domínio

**Suporte:** aberturas contra encerramentos por mês, saldo acumulado da fila,
tempo de resolução ao longo do tempo, distribuição por canal e evolução da
reabertura quando o histórico de etapa existir.

**Comercial:** negócios abertos contra ganhos e perdidos por mês, receita fechada
por mês, evolução do tempo até fechar e do valor típico.

**Financeiro:** recebido contra previsto por mês, evolução do vencido e do aging,
concentração em inadimplentes ao longo do tempo.

**Carteira e Retenção:** receita recorrente, entradas e saídas, retenção líquida
e bruta — todos dependentes da série de snapshot.

---

## 5. Qualidade dos gráficos existentes

Crítica honesta ao que está publicado:

- **Barras horizontais com vinte categorias** e cauda longa de valores 1, 1, 3, 9
  não comunicam. Melhor exibir as principais e agrupar o restante, ou separar
  primeiro por situação e só depois por etapa.
- **Tendência mensal** mistura aberturas e encerramentos numa mesma escala sem
  mostrar o saldo, que é a informação que interessa.
- **Nenhum gráfico declara a coorte de data**, ao contrário dos indicadores. A
  mesma disciplina precisa valer para eles.
- **Nenhum gráfico mostra estado de cobertura.** Uma série construída sobre dado
  parcial parece tão sólida quanto uma completa.

---

## 6. Ordem sugerida

1. Mapeamento de etapas canônicas e normalização — destrava a leitura correta.
2. Definição de quais pipelines pertencem a cada aba — muda números publicados.
3. Seletor com marcar e desmarcar todos — barato e melhora o uso diário.
4. Sub-abas temporais de Suporte, Comercial e Financeiro.
5. Revisão dos gráficos com coorte e cobertura declaradas.
6. Sub-abas temporais de Carteira e Retenção, quando a série sustentar.

Os itens 1 e 2 alteram números que já estão publicados, então pedem comunicação
à operação antes de entrar.
