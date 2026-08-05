# Relatório Delta — Dashboard Blueprint System V2

**Data:** 2026-08-03
**Produto:** Genius Support OS
**Checkout:** `C:\Projetos\GSO-old`
**Escopo:** revisão conceitual e visual de blueprints; sem implementação final

## 1. Resumo executivo

Os blueprints V1 já tinham uma direção de cockpit operacional, mas misturavam
leitura instantânea e leitura histórica. KPIs, gráficos e detalhes apareciam
com peso semelhante, mesmo quando o recorte era de apenas um mês. O mascote
também era descrito com linguagem e composição excessivamente mágicas, o que
afastava o produto da imagem de um SaaS operacional.

O V2 introduz a tese **cockpit editorial de decisão**: KPIs lideram recortes
curtos, séries temporais ganham área somente quando acrescentam leitura e o
Gênio passa a ser tratado como avatar tecnológico do sistema.

## 2. Estado Git inicial

- Branch: `codex/dashboard-visual-density-v1-1-20260803`.
- HEAD: `a1d7b2a`.
- Worktree: limpo.
- Worktrees ativos: 1, no checkout canônico.
- Nenhuma alteração de outro agente foi encontrada.
- Nenhuma operação de backend, banco, integração, sincronização, merge, rebase,
  reset, clean ou push foi executada.

## 3. Problemas encontrados nos blueprints anteriores

1. KPIs e séries temporais não tinham uma regra explícita por faixa de período.
2. A Visão Geral podia reservar uma área nobre para gráfico mesmo em recorte
   curto, reduzindo a prioridade de alertas, contexto e tabelas.
3. Os domínios compartilhavam aparência de grade de cards, mas não uma ordem de
   decisão: estado, resultado, evolução e detalhe ficavam indistintos.
4. Customer Success podia parecer vazio ou sugerir uma carteira ainda não
   definida; o blueprint precisava declarar a ausência de denominador.
5. Integrações, Fontes e Histórico herdavam peso de dashboard, embora sejam
   superfícies de configuração e rastreabilidade.
6. O Gênio era associado a fantasma, espírito ou magia literal, em conflito com
   sua função de avatar do produto.

## 4. Revisão conceitual

### Nova tese

O olho percorre quatro perguntas, sempre nessa ordem:

`O que está acontecendo? → Qual é o sinal? → Como mudou? → Onde agir?`

Essa ordem produz uma faixa de KPIs, uma zona temporal proporcional e um
detalhe operacional. O layout usa separadores e proximidade para agrupar,
reservando bordas e superfícies fortes para decisões que realmente exigem foco.

### Direção visual

- base navy/azul e superfícies claras ou escuras do Design System V3;
- magenta Genius como assinatura de foco, não como cor de todos os indicadores;
- alto contraste e tipografia compacta, sem título maximalista;
- uma ação primária contextual, subordinada à leitura;
- conteúdo factual dominante e estados ausentes explícitos;
- layout de alta resolução com densidade controlada, não preenchimento artificial.

## 5. Regra de KPIs

KPIs respondem “qual é o estado atual?” e “qual é a comparação sintética?”.
Devem ocupar a faixa principal quando a janela for mês atual, mês passado ou
recorte de até 31 dias.

Cada KPI deve conter somente:

- valor principal ou `Indisponível`;
- rótulo humano e unidade;
- contexto curto;
- delta anterior quando houver contrato para comparação;
- sinal discreto de tendência ou risco.

Não usar gigantismo tipográfico, zero sintético ou repetição do mesmo valor em
três componentes sem uma pergunta adicional.

## 6. Regra de séries temporais

| Janela | Série | Papel | Área máxima recomendada |
| --- | --- | --- | --- |
| Até 31 dias | diária/semanal | contexto secundário | microtendência ou sparkline |
| 32–90 dias | semanal | diagnóstico compacto | bloco curto, recolhível |
| 91–365 dias | mensal | evolução e comparação | bloco relevante após KPIs |
| Mais de 1 ano | mensal/trimestral | sazonalidade e comportamento | bloco histórico principal |

Um gráfico grande para um único mês é considerado desperdício de área nobre.
Quando houver poucos pontos, a tabela resumida pode ser a representação mais
honesta. Gráficos não devem inventar séries, preencher lacunas ou converter
indisponibilidade em zero.

## 7. Revisão do Gênio

O Gênio V2 tem corpo definido, rosto simples e postura de assistente do
produto. A referência visual usa um avatar azul compacto com detalhe magenta e
halo fino; ele não é translúcido, não flutua como uma aparição e não ocupa o
centro da operação sem necessidade.

No UI-05, atividade é sugerida por pequena suspensão, arco de foco e partículas
moderadas. O texto continua factual e muda apenas quando a etapa do ciclo muda.
Estados de falha, timeout, abandono e indisponibilidade encerram a animação.
Com reduced motion, resta o avatar estático e o texto equivalente.

## 8. Revisão por tela

| Tela | KPIs prioritários | Gráfico temporal? | Granularidade | Tabela/Detalhe | Observações |
| --- | --- | --- | --- | --- | --- |
| Visão Geral | receita, negócios, tickets, risco financeiro | condicional | micro até 31d; mensal em histórico | mapa das áreas e trilho de integridade | tela mais executiva; sinais antes de gráfico |
| Comercial | negócios, ganhos, perdas, conversão, ticket, receita | sim, proporcional | semanal ou mensal | funil, pipeline, responsáveis, aging | mês curto privilegia KPIs e funil |
| Customer Success | placeholders conceituais de cobertura, owner, contrato, MRR | condicional | somente com carteira definida | cobertura, lacunas e health conceitual | não afirmar denominador nem health pronto |
| Suporte & Chat | abertos, encerrados, backlog, SLA, prioridade | sim, compacto | diária/semanal | status, pipeline/canal e fila | tickets e chat separados; Chat indisponível sem contrato |
| Financeiro | posição, vencido, recebido, 30/60/90, atraso | condicional | mensal em semestre/ano | aging, previsão e reconciliação | mês curto privilegia KPIs e tabelas OMIE |

### Superfícies de configuração e rastreabilidade

- **Integrações:** fonte, status, credencial protegida, ativação, descrição e
  ações; sem visual de dashboard pesado.
- **Fontes do Dashboard:** status, atualização automática, ações manuais e
  catálogo de pipelines em leitura operacional, sem parede de cards.
- **Histórico:** ciclo, origem, tipo, data/hora, duração, status, contagem e
  erro sanitizado em densidade escaneável e com detalhe progressivo.
- **UI-05:** avatar do sistema em loading/processamento, sem borda rígida ou
  apoio oval estático.
- **Guia visual:** regras de densidade, temporalidade, semântica de cor,
  acessibilidade e presença contextual do Gênio.

## 9. Arquivos gerados

- `docs/specs/DASHBOARD_BLUEPRINT_SYSTEM_V2.md`.
- `docs/design/blueprint/dashboard-v2/README.md`.
- `docs/design/blueprint/dashboard-v2/01-visao-geral.svg`.
- `docs/design/blueprint/dashboard-v2/02-comercial.svg`.
- `docs/design/blueprint/dashboard-v2/03-customer-success.svg`.
- `docs/design/blueprint/dashboard-v2/04-suporte-chat.svg`.
- `docs/design/blueprint/dashboard-v2/05-financeiro.svg`.
- `docs/design/blueprint/dashboard-v2/06-integracoes.svg`.
- `docs/design/blueprint/dashboard-v2/07-fontes-dashboard.svg`.
- `docs/design/blueprint/dashboard-v2/08-historico-sincronizacoes.svg`.
- `docs/design/blueprint/dashboard-v2/09-ui-05-genio-em-acao.svg`.
- `docs/design/blueprint/dashboard-v2/10-genio-loading.svg`.
- `docs/design/blueprint/dashboard-v2/11-guia-principios-visuais.svg`.

Os SVGs são imagens individualizadas por tela e contêm a marcação
`BLUEPRINT V2 · NÃO É TELA RUNTIME`. Não há valores de produção nos desenhos.

O pacote externo de revisão é `C:\Projetos\GSO-artifacts\dashboard-blueprint-v2-20260803`.
Ele contém 11 SVGs-fonte, 11 PNGs renderizados, manifesto SHA-256 e cópias dos
documentos desta revisão. O ZIP de revisão gerado é
`C:\Projetos\GSO-artifacts\dashboard-blueprint-v2-20260803-review.zip`.

## 10. Validação

Validação concluída:

- 11/11 SVGs parseados como XML, com `width=1600`, `height=1000` e marcador de
  blueprint.
- 11/11 PNGs renderizados em Playwright a 1600×1000.
- 11/11 imagens inspecionadas individualmente com `view_image`, incluindo
  contraste, overflow visual, hierarquia e avatar do Gênio.
- Nenhum placeholder `?`, caractere de substituição ou segredo detectado nos
  textos dos SVGs.
- `git diff --check` e auditoria documental executados após a consolidação.

Não foram executados build, banco, navegador de produto ou sincronização: o
lote é deliberadamente conceitual/visual e não altera runtime.

## 11. Estado Git final

O worktree será fechado com commit somente documental/visual neste lote. Não
houve reset, clean, stash drop, merge, rebase, cherry-pick, push ou alteração
de runtime. A verificação pós-commit deve confirmar a ausência de mudanças
pendentes e a preservação das demais branches/worktrees.

## 12. Pendências e próximos passos

1. Revisão visual do Product Owner sobre a direção V2.
2. Somente após aprovação, decidir se a futura implementação começa pela Visão
   Geral e UI-05 ou por outro piloto.
3. Manter fora deste lote discovery de CS, fórmulas, denominadores, contratos,
   performance de APIs, sincronização e mudanças de banco.
