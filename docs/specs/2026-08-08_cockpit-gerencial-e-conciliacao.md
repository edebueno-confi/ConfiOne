# Cockpit gerencial, conciliação de empresas e direção visual

**Data:** 2026-08-08
**Origem:** pedidos diretos da operação, registrados para o Codex executar
**Estado:** especificação, nada implementado

Três frentes distintas que chegaram juntas. Estão separadas aqui porque têm
donos, riscos e prazos diferentes.

---

## 1. Conciliação de empresas entre HubSpot e OMIE

### O problema, nas palavras de quem opera

> "Tem no HubSpot e tem na OMIE, só que elas estão escritas de forma diferente.
> Na OMIE está o nome completo, no HubSpot está o primeiro nome, também escrito
> de forma diferente."

O cruzamento atual usa **apenas CNPJ normalizado**. Onde o CNPJ falta ou diverge,
o vínculo não acontece — e hoje isso aparece na tela como "Sem empresa no
HubSpot", que soa como ausência de cadastro quando o cadastro existe com outro
nome.

O painel Financeiro já expõe o sintoma: *"Ver empresas do OMIE sem cadastro no
HubSpot"*, com uma coluna Motivo que diz "Nome parecido no HubSpot". Ou seja, a
similaridade **já é calculada** — só não é acionável.

### O que fazer

**Ampliar a busca de correspondência**, mantendo a hierarquia de confiança que já
existe e que não deve mudar:

1. Identificador explícito
2. CNPJ normalizado (dígitos)
3. CNPJ raiz — mesmo grupo econômico
4. **Similaridade de nome, como candidata e nunca como vínculo automático**

Para o passo 4, o Postgres já tem `pg_trgm`. Normalizar antes de comparar:
maiúsculas, acentos, formas societárias (`LTDA`, `S/A`, `ME`, `EIRELI`) e
pontuação. "CONFI TECNOLOGIA LTDA" e "Confi" precisam se encontrar.

**A regra que não pode ser quebrada:** similaridade de nome **sugere**, nunca
vincula. A instrução original do projeto é explícita — *não fazer matching
HubSpot ↔ OMIE automaticamente pelo nome da empresa*. O que muda é que a
sugestão passa a ser acionável por uma pessoa, não que ela vire regra.

### Vínculo manual, com autoridade

- Uma pessoa autorizada **confirma** ou **descarta** cada sugestão
- Uma pessoa autorizada **desfaz** um vínculo já feito, inclusive por CNPJ
- Toda decisão grava **quem, quando e por qual evidência** — o mesmo desenho de
  `queue_role` e do cruzamento de etapas
- Guarda: `has_global_role('platform_admin')`, igual aos demais editores
- **Nada é escrito no HubSpot nem no OMIE.** O vínculo vive no nosso banco

### Estado sugerido

| Estado | Significado |
| --- | --- |
| `confirmado` | pessoa confirmou; vale como verdade |
| `automatico` | CNPJ bateu; vale, e pode ser desfeito |
| `sugerido` | similaridade encontrou candidato; **não conta** até alguém decidir |
| `descartado` | pessoa disse que não é a mesma empresa; não sugerir de novo |

O `descartado` importa tanto quanto o `confirmado`: sem ele, a mesma sugestão
errada volta a cada sincronização.

---

## 2. Cockpit gerencial: tirar a administração de dentro do painel

### O problema

Configurações do Dashboard, cruzamento de etapas, papel dos pipelines, histórico
de sincronização e conciliação de empresas estão espalhados entre a página de
Configurações e a de Analytics. Quem opera o painel e quem administra as fontes
são momentos diferentes de trabalho, e hoje disputam a mesma tela.

Pela operação: *"não deixar especificamente na página do dashboard; ter uma
página específica de ajustes do painel, fontes do dashboard, histórico de
sincronização, num cockpit gerencial"*.

### O que fazer

Uma área própria — sugestão de rota: `/admin/cockpit` — reunindo:

| Seção | O que já existe |
| --- | --- |
| Fontes do Dashboard | `DashboardSourcesSettingsPage` |
| Papel dos pipelines | `PipelineRoleSettings` (já agrupado por operação) |
| Cruzamento de etapas | `StageMappingSettings` |
| **Conciliação de empresas** | a construir, item 1 |
| Histórico de sincronização | `SyncHistorySettingsPage` |
| Integrações | `SettingsIntegrationsPanel` |

**A crítica que a operação fez à densidade vale para todas elas:** *"está muito
apertado as informações ali"*. A conciliação de empresas em particular pede
espaço — é comparação lado a lado de dois cadastros, com decisão no meio. Não
cabe numa linha de tabela.

Considere para a conciliação: lista de pendências à esquerda, comparação dos dois
registros ao centro, ação à direita. Um caso por vez, com contador de progresso.
O mesmo princípio que fez a tela de pipelines funcionar — **o que falta decidir
vem primeiro, e uma decisão de cada vez**.

---

## 3. Direção visual: geometria reta

### O pedido, direto

> "Sem essa visão arredondada de sistemas feitos por IA. Adotar o visual mais
> linha reta, pouco traço. Cantos retos, não arredondados. Inclusive a sidebar."

Isso é uma correção de direção, não ajuste de detalhe. O produto hoje usa
`rounded-lg`, `rounded-xl` e `rounded-full` de forma difusa — que é exatamente a
assinatura genérica que a operação quer evitar.

### O que fazer

**Raio zero como padrão.** Cantos retos em cartões, tabelas, campos, botões,
seções e barra lateral. Se algum elemento precisar de exceção, ela deve ser
justificável em uma frase — e provavelmente não vai ser.

**Menos traço, mais espaço.** "Pouco traço" pede que a separação venha de
espaçamento e alinhamento, não de bordas em tudo. Onde hoje há caixa com borda,
frequentemente basta uma régua fina ou nada.

**Faça pelo token, não por busca e substituição.** O sistema já usa variáveis CSS
para cor. O raio precisa do mesmo tratamento: um token único, alterado num lugar.
Trocar classe por classe espalha a decisão e garante que ela volte a divergir.

**A barra lateral entra no escopo.** Foi citada explicitamente, e é o elemento
mais constante da tela.

Atualize `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md` antes de aplicar: a
regra escrita é o que impede a próxima tela de nascer arredondada de novo.

---

## 4. QA visual que ficou pendente

A operação pediu uma passada por todas as abas com o recorte do mês anterior,
com análise crítica de posicionamento, navegação e densidade. **Não foi
executada** — o login do ambiente de QA falhou com desvio de relógio entre os
contêineres (`JWT issued at future`), de forma intermitente.

O roteiro está pronto e é reaproveitável:
`scripts/local-qa/dashboard-subabas-evolucao-qa.mjs` cobre três domínios em dois
temas e três resoluções. Para o pedido completo, estenda para as cinco abas e
para a área de Configurações, aplicando o período do mês anterior antes da
captura.

Se o login falhar, é transiente: reiniciar o stack local realinha o relógio.

---

## 5. Ordem sugerida

1. **Direção visual** — é a de menor risco e afeta tudo que vier depois. Fazer
   antes evita retrabalho nas telas novas.
2. **Cockpit** — reorganiza o que já existe, sem tocar em cálculo.
3. **Conciliação de empresas** — a de maior valor e maior cuidado. Muda o
   cruzamento financeiro, que sustenta MRR e carteira.

A conciliação depende do cockpit para ter onde morar com espaço, e ambas se
beneficiam da direção visual já decidida.
