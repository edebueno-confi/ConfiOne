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

> **Status: entregue para Suporte, Comercial e Financeiro em 2026-08-07.**
> Carteira e Retenção seguem aguardando série, conforme decidido na seção 4.2.
> A avaliação abaixo permanece registrada como a base da decisão.

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

### 4.5 O que foi entregue

Cada domínio tem duas sub-abas, **Posição** e **Evolução**, com uma frase no topo
declarando que pergunta cada uma responde.

A regra de não duplicar foi aplicada de forma destrutiva, não aditiva: as antigas
tabelas e linhas de "Tendência mensal" foram **removidas** das abas de posição, e
não deixadas ao lado da nova. Foram três remoções — `TicketMonthlyChart`,
`CommercialMonthlyChart` e a tabela de saldo mensal do Financeiro. Manter as duas
versões teria reproduzido exatamente o defeito que gerou "Receita ganha" duas
vezes com valores diferentes.

A janela da evolução é **independente do filtro de recorte** da aba de posição:
doze meses no grão mensal, vinte e seis semanas no semanal, sessenta dias no
diário. O motivo é que o recorte de posição costuma ser curto, e uma série de
trinta dias em grão mensal desenha um ou dois pontos. A tela diz isso ao usuário,
para que ninguém compare o total do gráfico com o indicador acima e conclua que
um dos dois está errado.

---

## 5. Qualidade dos gráficos existentes

Crítica registrada ao que estava publicado, e o que foi feito com cada ponto:

- **Barras horizontais com vinte categorias** e cauda longa de valores 1, 1, 3, 9
  não comunicam. *Parcialmente resolvido:* o cruzamento de etapas reduziu as
  categorias ao consolidar nomes equivalentes, e a ordenação passou a seguir o
  fluxo do atendimento em vez do volume — o que antes produzia um ranking e agora
  mostra onde a fila se acumula dentro do processo. **Continua pendente** o
  agrupamento das categorias residuais em "outras".
- **Tendência mensal** mistura aberturas e encerramentos numa mesma escala sem
  mostrar o saldo. *Resolvido:* o saldo acumulado virou a linha de destaque, com
  linha de referência no zero, e a taxa de conversão do Comercial ganhou eixo
  próprio para não ser achatada pela contagem.
- **Nenhum gráfico declara a coorte de data.** *Resolvido nos gráficos de
  evolução:* a legenda vem do próprio read model, para que a frase não possa
  divergir da fórmula, e é impressa no rodapé do gráfico. Os gráficos de posição
  ainda não declaram.
- **Nenhum gráfico mostra estado de cobertura.** **Continua pendente.** Há um
  meio-passo: série ausente, vazia ou inteiramente em zero devolve estado
  explícito em vez de desenhar uma linha plana — mas cobertura parcial ainda não
  é sinalizada dentro do gráfico como já é nos indicadores.

---

## 5.1 A fila publicada não mede fila — medido em produção, 2026-08-08

> **Esta seção substitui uma versão anterior que estava errada.** Ela afirmava
> que etapas de conclusão eram contadas como fila e que 48% do número era falso.
> A leitura veio do banco local, defasado em três dias. Em produção as etapas de
> conclusão estão corretas. A retificação completa está na seção 22 de
> `reports/2026-08-07_kpi-discovery-e-lote-p0.md`.

O problema real é de **escopo de pipeline**, não de etapa. A fila de produção é
de 2.851 atendimentos, e **2.199 deles — 77% — não têm atividade há mais de seis
meses**.

| Pipeline | Na fila | Sem atividade +180d | % parado | Entradas em 30d |
| --- | ---: | ---: | ---: | ---: |
| Fale conosco \| Confi | 1.443 | 1.117 | 77% | 66 |
| Confi \| Whatsapp | 947 | 905 | **96%** | **2** |
| Suporte | 210 | 113 | 54% | 16 |
| Criadouro de Tíquetes \| Aftersale | 170 | 6 | **4%** | 39 |
| Suporte B2B \| Confi | 79 | 56 | 71% | 1 |
| Atendimento \| Confi Analytics | 2 | 2 | 100% | 0 |

Dois pipelines concentram 84% da fila e quase tudo em "Novo", nunca triado.
"Confi | Whatsapp" recebeu **dois** atendimentos em trinta dias e carrega 947
parados: é um depósito, não uma fila.

**A seção 2 deste roadmap estava invertida.** Ela tratava "Criadouro de Tíquetes |
Aftersale" como repositório; ele é o único pipeline saudável do conjunto — 4% de
estagnação e 39 entradas no mês.

Quem lê "Fila atual: 2.851" entende *2.851 pessoas esperando*. A leitura correta
é *652 aguardando e 2.199 abandonados em caixas de entrada que ninguém trabalha*.
São conclusões operacionais opostas a partir do mesmo número.

Especificação completa em
`specs/2026-08-08_saude-da-fila-e-papel-do-pipeline.md`.

---

## 6. Roadmap — Now / Next / Later

Atualizado em 2026-08-08, depois da medição em produção da seção 5.1.

### Agora

| Item | Estado | Muda número publicado? | Depende de |
| --- | --- | --- | --- |
| **Fase 1 — estagnação visível** | Pronto para entrar | Não | Nada |
| **Fase 2 — papel do pipeline e editor** | Especificado | Não | Nada |
| **Fase 3 — aplicar o recorte à fila** | Especificado | **Sim** | Decisão da operação sobre quais pipelines são trabalhados |

O faseamento existe para isolar o risco: as duas primeiras fases não mexem em
nenhum número, e a terceira só chega depois de a operação ter visto os valores
novos ao lado dos antigos.

### Em seguida

| Item | Por quê | Muda número? |
| --- | --- | --- |
| Passivo por faixa de idade | 180 dias e 900 dias pedem decisões diferentes | Não |
| Evolução do Suporte separando as duas séries | A série atual soma fila e passivo | Não |
| Marcar e desmarcar todos no seletor | Dívida antiga, barato, uso diário | Não |
| Cobertura declarada nos gráficos de posição | Os de evolução já declaram; os de posição não | Não |

### Depois

| Item | Condição para começar |
| --- | --- |
| Alerta de pipeline trabalhado passando de 30% estagnado | Fase 3 entregue e classificação estável |
| Sub-abas de evolução em Carteira e Retenção | Série de snapshot com 90 dias — a partir de 2026-11-05 |
| Encerramento em massa do passivo no HubSpot | Autorização explícita, dry-run e ledger. Escrita externa |
| SLA por pipeline | Existir fonte de SLA. Hoje não existe |

### O que saiu

**Decisão de encerramento no cruzamento de etapas — removida.** Resolvia um
defeito que só existe no banco local defasado. Ver 5.1.

**Definição de quais pipelines pertencem a cada aba — absorvida** pela Fase 2,
que é a mesma decisão com desenho melhor: papel declarado por pessoa, com
autoria, em vez de lista fixa no código.

### Riscos

**A Fase 3 muda o indicador mais visível do painel**, de 2.851 para cerca de 652.
Sem aviso prévio, quem abrir a tela vai achar que o sistema quebrou. Mitigação: a
Fase 1 mostra os dois números lado a lado antes.

**A classificação depende de uma decisão que não é minha.** Se ninguém decidir, o
painel fica com todo mundo em "a classificar" e nada muda — que é o
comportamento seguro, mas o problema segue de pé. É o único bloqueio real do
roadmap.

**O passivo de 2.199 é uma decisão operacional adiada, não um problema de
software.** Tornar visível não resolve; alguém precisa decidir se trata, encerra
ou desliga o canal.
