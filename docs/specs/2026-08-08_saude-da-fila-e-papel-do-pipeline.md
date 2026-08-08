# Saúde da fila e papel do pipeline

**Data:** 2026-08-08
**Estado:** proposta, aguardando decisão sobre a classificação dos pipelines
**Evidência:** seção 22 de `reports/2026-08-07_kpi-discovery-e-lote-p0.md`
**Substitui:** a proposta de "decisão de encerramento no cruzamento de etapas",
que nasceu de leitura do banco local defasado e não se sustenta em produção

---

## 1. Problema

O Dashboard publica **"Fila atual: 2.851"**, e quem lê entende *2.851 pessoas
esperando atendimento*. A leitura correta é **652 aguardando atendimento e 2.199
abandonados em caixas de entrada que ninguém trabalha** — 77% da fila sem
qualquer atividade há mais de seis meses.

Dois pipelines concentram 84% do total e quase tudo em "Novo", nunca triado.
"Confi | Whatsapp" recebeu **dois** atendimentos em trinta dias e carrega 947
parados: é um depósito, não uma fila.

O mesmo distorce a **"Espera mediana na fila: 383 dias"**. Esse número não mede
demora de atendimento; mede idade de coisa esquecida.

**Quem sofre:** qualquer pessoa que use o painel para decidir alocação de
atendimento. Hoje o indicador mais visível do Suporte leva à conclusão errada —
"estamos afogados" — quando a leitura verdadeira é "temos 652 na fila e um
passivo de 2.199 a decidir o que fazer".

**Custo de não resolver:** o painel perde a única coisa que justifica sua
existência, que é ser confiável. Um número que exige nota de rodapé para não
enganar é pior que número nenhum, porque parece informação.

---

## 2. Objetivos

1. **A fila publicada mede fila.** "Fila atual" passa a contar apenas
   atendimentos em pipelines que a operação declara como trabalhados. Meta: o
   indicador cai de 2.851 para a ordem de 650, e a diferença fica visível e
   explicada, não escondida.
2. **O passivo esquecido vira número próprio, não desaparece.** Os 2.199 param de
   contaminar a fila e passam a ter indicador dedicado, porque são um problema
   real que merece decisão — só não é o mesmo problema.
3. **A mediana de espera mede espera.** Calculada sobre a fila trabalhada, deve
   cair de 383 dias para a ordem de dezenas.
4. **A classificação é decisão registrada, não heurística.** Nenhuma regra de
   nome, nenhuma inferência por volume: uma pessoa declara o papel de cada
   pipeline, com autoria e data no banco.
5. **Estagnação é medida continuamente.** O painel passa a distinguir fila que
   anda de fila que apodrece, em qualquer pipeline, inclusive nos trabalhados.

---

## 3. Não-objetivos

1. **Não vamos apagar, arquivar ou fechar atendimento nenhum.** Reclassificar é
   mudar como o painel lê; escrever no HubSpot é outra decisão, com outro risco,
   e exige autorização explícita.
2. **Não vamos adivinhar o papel do pipeline pelo nome nem pelo volume.** É a
   mesma armadilha da etapa "Concluída": funcionaria hoje e quebraria no próximo
   pipeline criado.
3. **Não vamos esconder o que for reclassificado.** Um pipeline fora da fila
   continua contado, visível e nomeado. A diferença é onde ele aparece.
4. **Não vamos mexer no cruzamento de etapas.** Ele está entregue e funcionando;
   o problema é de escopo de pipeline, não de etapa.
5. **Não vamos definir "estagnado" por acordo de nível de serviço.** O SLA real
   não está modelado; usar um limiar de tempo declarado é honesto, inventar SLA
   não é.

---

## 4. Histórias

**Como pessoa que decide alocação de atendimento**, quero que "Fila atual" conte
só quem está numa fila de fato trabalhada, para não concluir que a operação está
afogada quando o que existe é um passivo antigo.

**Como pessoa que decide alocação**, quero ver separadamente quantos atendimentos
estão parados há muito tempo, para decidir se tratamos, encerramos em massa ou
assumimos que aquele canal não existe mais.

**Como responsável pelo painel**, quero declarar o papel de cada pipeline em uma
tela, com o volume e a estagnação de cada um à vista, para decidir com base no
que o pipeline realmente é e não no que o nome sugere.

**Como responsável pelo painel**, quero que a decisão fique registrada com autor e
data, para que o próximo a olhar entenda por que aquele pipeline saiu da fila.

**Como qualquer leitor**, quero que a tela diga que existe um recorte aplicado e
qual, para nunca comparar este número com um do HubSpot e achar que um dos dois
está errado.

**Caso de borda — pipeline novo:** aparece como *a classificar*, entra no passivo
e **não** na fila trabalhada, e é sinalizado como pendente de decisão. O padrão
seguro é ficar de fora do indicador principal, não entrar sem ninguém saber.

**Caso de borda — nenhum pipeline classificado ainda:** o painel mantém o
comportamento de hoje e declara que nenhuma classificação foi feita. Nada muda em
silêncio.

---

## 5. Requisitos

### P0 — sem isto o problema não se resolve

**P0.1 — Papel do pipeline no banco.**
`analytics_source_config` ganha `queue_role`, com três valores: `trabalhada`,
`caixa_de_entrada`, `a_classificar` (padrão). Mais `queue_role_decided_by` e
`queue_role_decided_at`.

- [ ] Restrição rejeita valor fora dos três
- [ ] Padrão é `a_classificar`
- [ ] Pipeline novo entra como `a_classificar` sem intervenção
- [ ] Autoria e data preenchidas por RPC, nunca pelo cliente
- [ ] Sem alteração de linha existente: migração aditiva

**P0.2 — Indicadores separam fila de passivo.**
`rpc_analytics_support_kpis_v2` passa a publicar `open_backlog` restrito a
`queue_role = 'trabalhada'`, e ganha `dormant_backlog` com o restante.

- [ ] `open_backlog` conta só pipelines trabalhados
- [ ] `dormant_backlog` conta caixas de entrada mais estagnados da fila trabalhada
- [ ] `median_backlog_age_days` calculada só sobre a fila trabalhada
- [ ] Nenhum pipeline classificado ⇒ estado `partial` com motivo declarado, e o
      número de hoje preservado — nunca `0`
- [ ] Cobertura da classificação exposta como o resto: quantos pipelines
      decididos sobre o total

**P0.3 — Estagnação medida.**
Um atendimento é **estagnado** quando não tem atividade registrada há mais de
**180 dias**. O limiar é declarado na tela, não escondido no código.

- [ ] Limiar em um único lugar, legível por quem lê a fórmula
- [ ] Atendimento sem data de atividade conta como estagnado e é dito
- [ ] Estagnação medida por pipeline, inclusive nos trabalhados

**P0.4 — Editor de papel do pipeline.**
Em Configurações, Fontes do Dashboard, ao lado do cruzamento de etapas.

- [ ] Cada linha mostra: pipeline, papel atual, na fila, % estagnado, entradas
      nos últimos 30 dias
- [ ] Pipeline `a_classificar` em destaque
- [ ] Uma frase explica o efeito: pipeline em caixa de entrada sai de "Fila
      atual" e passa a contar no passivo
- [ ] Mudança grava autor e data
- [ ] Sem exclusão em massa, sem ação irreversível

**P0.5 — Proveniência na tela.**
- [ ] Suporte declara o recorte aplicado e quantos pipelines estão fora
- [ ] Pipeline sem decisão aparece nomeado, não somado em silêncio

### P1 — melhora muito, não bloqueia

- **P1.1** Passivo por faixa de idade (180–365, 365–730, +730 dias)
- **P1.2** Sub-aba de evolução do Suporte separa as duas séries
- **P1.3** Alerta quando um pipeline trabalhado passa de 30% estagnado
- **P1.4** Marcar e desmarcar todos no seletor de pipelines (dívida antiga)

### P2 — não construir, mas não impedir

- **P2.1** Encerramento em massa do passivo no HubSpot — escrita externa, exige
  autorização, dry-run e ledger
- **P2.2** Papel por etapa, não só por pipeline
- **P2.3** SLA por pipeline, quando existir a fonte

---

## 6. Métricas de sucesso

### Imediatas — verificáveis no dia da entrega

| Métrica | Hoje | Alvo | Como medir |
| --- | ---: | ---: | --- |
| Fila publicada | 2.851 | ~652 | `open_backlog` após classificação |
| Espera mediana | 383 d | < 90 d | `median_backlog_age_days` |
| Passivo visível | 0 | ~2.199 | `dormant_backlog` |
| Pipelines decididos | 0 de 6 | 6 de 6 | cobertura da classificação |

### De prazo — só o uso responde

- A fila trabalhada **não volta a crescer sem controle**: estagnação abaixo de
  10% nos pipelines trabalhados em 90 dias.
- O passivo **encolhe ou é encerrado por decisão**, e não fica parado — medido
  pela variação de `dormant_backlog`.
- **Nenhum pipeline fica em "a classificar" por mais de 30 dias.**

### Contra-indicador, que é o mais importante

Se a fila cair de 2.851 para 652 e ninguém notar diferença na operação, então o
indicador nunca foi usado para decidir nada — e o problema a resolver passa a ser
outro. Vale perguntar em vez de comemorar o número.

---

## 7. Direção visual

O passivo **não pode parecer um segundo indicador de fila**. São naturezas
diferentes: um é trabalho em curso, o outro é dívida acumulada. Se os dois forem
cartões iguais lado a lado, o leitor soma mentalmente e volta aos 2.851.

**A escolha:** a faixa "Agora" mantém apenas a fila trabalhada, com o peso
tipográfico que já tem. O passivo vive numa faixa própria, com rótulo que diz o
que ele é — *Passivo sem movimentação* — e uma frase curta com o limiar em texto,
não em símbolo.

**A aposta:** uma barra de proporção fina abaixo da fila, dividida entre o que
anda e o que está parado, em cinza neutro e não em vermelho. Vermelho seria
julgamento; a proporção é fato, e a decisão sobre o que fazer com ela é de quem
lê. Um único elemento visual novo, e nada mais.

Respeita o que já existe: mesmas faixas, mesmo contrato de estado, mesma regra de
"Indisponível" em vez de zero, mesma responsividade até 390px.

---

## 8. Questões em aberto

**Bloqueantes — precisam de resposta antes de implementar**

1. **Quais pipelines são fila trabalhada?** Decisão da operação. A evidência
   sugere `Criadouro de Tíquetes | Aftersale` e `Suporte`, com `Suporte B2B |
   Confi` em dúvida — 79 na fila, 71% parado, 1 entrada no mês. Mas é decisão de
   quem opera, não minha.
2. **180 dias é o limiar certo?** Escolhido por ser o ponto em que a distribuição
   se separa com clareza. Se a operação tiver um número próprio, ele vale mais.

**Não bloqueantes — resolvo durante**

3. Reclassificar deve recalcular o histórico ou só daqui pra frente? Proponho só
   daqui pra frente, com a data da decisão registrada.
4. As sub-abas de evolução devem separar as séries já na entrega ou depois?
   Proponho depois (P1.2).

---

## 9. Faseamento

**Fase 1 — tornar visível, sem mudar número publicado.** Estagnação medida e
exibida, com o passivo declarado ao lado da fila. Nenhum indicador muda de valor.
Não depende de decisão nenhuma e pode entrar imediatamente.

**Fase 2 — classificar.** Coluna de papel, editor, autoria. A classificação
começa vazia; nada muda até alguém decidir.

**Fase 3 — aplicar ao indicador.** "Fila atual" e "Espera mediana" passam a usar
o recorte. **Muda número publicado** — precisa de aviso à operação antes.

A ordem foi montada para que a única fase arriscada seja a última, e para que ela
chegue depois de a operação já ter visto os números novos ao lado dos antigos.
