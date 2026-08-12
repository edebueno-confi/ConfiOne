# Prompt de retomada — Codex

Copie o bloco abaixo como primeira mensagem para o Codex.

---

Você volta a conduzir o Genius Support OS. O checkout canônico é
`C:\Projetos\GSO-old`, branch `codex/react-router-v8-migration-20260804`.

**Há um incidente aberto: o Dashboard está quebrado em produção.** Comece por
ele, antes de qualquer melhoria.

```
rpc_analytics_ceo_snapshot        500
rpc_analytics_ceo_history         500
rpc_analytics_executive_kpis_v2   500
functions/v1/omie-sync            502
```

O log do Postgres acusa `canceling statement due to statement timeout`. Não é
permissão nem coluna ausente — as funções executam direto no banco, inclusive com
`set role authenticated`. O diagnóstico completo, o que já foi descartado e três
caminhos de correção estão no topo de `docs/HANDOFF_CLAUDE_2026-08-08.md`.

O suspeito principal é `vw_analytics_ticket_resolution`, reescrita pelo Claude e
não medida sob a carga real das RPCs executivas. **A hipótese é forte mas não foi
provada** — meça a RPC completa antes de decidir.

Fora isso: nos últimos dois dias o Claude conduziu um ciclo longo sobre o
Dashboard Gerencial. O trabalho está publicado — local, Genius-OS e Central-Confi
no commit `b064b43`, árvore limpa, CI verde. **Leia antes de tocar em qualquer
coisa.**

## Leitura obrigatória, nesta ordem

1. **`docs/HANDOFF_CLAUDE_2026-08-08.md`** — comece aqui. Estado do Git, as treze
   migrations aplicadas, os achados que mudam a leitura do painel, as decisões da
   operação, as pendências em ordem e as regras que o ciclo comprou com erro.
2. **`docs/reports/2026-08-07_kpi-discovery-e-lote-p0.md`**, seções 19 a 26 — o
   diário técnico. As seções 22 e 24 são **retificações**: conclusões que foram
   publicadas erradas e depois desmontadas por verificação na origem. Leia-as
   inteiras; elas explicam por que o painel está como está.
3. **`docs/specs/2026-08-08_saude-da-fila-e-papel-do-pipeline.md`** — a
   especificação em vigor, com objetivos, não-objetivos e faseamento.
4. **`docs/DASHBOARD_PIPELINES_E_GRAFICOS_ROADMAP.md`**, seções 5.1 e 6 —
   Now/Next/Later atualizado, com o que saiu do roadmap e por quê.
5. **`docs/specs/2026-08-08_cockpit-gerencial-e-conciliacao.md`** — três pedidos
   diretos da operação, registrados e não implementados: conciliação de empresas
   entre HubSpot e OMIE por similaridade de nome com vínculo manual, o cockpit
   gerencial que tira a administração de dentro do painel, e a direção visual de
   geometria reta.
6. Os de sempre: `AGENTS.md`, `docs/PROJECT_STATE.md`,
   `docs/ARCHITECTURE_RULES.md`, `docs/VIEW_RPC_CONTRACTS.md`,
   `docs/AUTH_CONTEXT_STRATEGY.md`, `docs/DOCUMENTATION_LEDGER.md`.

## O que você precisa saber antes de decidir qualquer coisa

**O portal do HubSpot é compartilhado por pelo menos quatro operações do grupo:**
Confi, Neotrust, Aftersale e SocialSoul/Lomadee. A convenção de emoji no nome do
pipeline codifica isso. O painel somava três delas num indicador único, e
separadas a conclusão inverte: Neotrust tem 11 atendimentos sem dono em 210,
Aftersale tem 4 em 170, e o problema inteiro é da Confi, com 2.053 em 2.469.

**O apelido interno chegou a esconder de quem era o pipeline.** `1429283` chama-se
"📊 CS | Neotrust" no HubSpot e o painel exibia "Suporte". Uma classificação
inteira foi decidida sobre esse rótulo e teve de ser revertida. Hoje o nome
oficial é o rótulo e o apelido vem ao lado.

**A equipe registra o fechamento em campo customizado e nem sempre move a etapa.**
`tipo_de_fechamento | Fale conosco | Confi` tem 1.247 preenchidos, e esse é o
pipeline com 1.117 atendimentos parados. O painel, lendo só a etapa, publica como
aberto o que já foi concluído. Os valores são ingeridos sem interpretação: virar
regra exige decisão registrada.

**Boa parte dos "Indisponível" era falta de contrato nosso, não ausência na
origem.** `subject` existe em 53.070 atendimentos e era pedido ao HubSpot e
descartado na gravação por falta de coluna. Já corrigido no adapter; falta a
sincronização trazer os valores.

## As regras que este ciclo comprou com erro

Três lotes seguidos falharam pelo mesmo motivo, e vale herdar as regras em vez de
repetir o custo:

- **Consultar o banco não é consultar a fonte.** Banco local defasado virou
  "defeito em produção"; apelido virou classificação errada; schema nosso virou
  "a propriedade não existe no HubSpot". Nos três casos o SQL estava correto e a
  correção veio de alguém abrir a tela do HubSpot.
- **Número que muda decisão da operação é conferido na origem antes de virar
  proposta**, não depois.
- **Alterar view ou função existente parte de `pg_get_viewdef` /
  `pg_get_functiondef` atual.** Reescrever do zero descartou colunas do contrato e
  deixou o CI vermelho por cinco commits.
- **`npm run supabase:test:db` roda antes de qualquer commit que toque em SQL.**
  Foi o único comando que pegou os quatro defeitos daquela reescrita; contrato em
  Node não cobre SQL.
- **Cobertura acompanha a medida, não a função.** Todo indicador sobre campo
  opcional precisa da própria checagem.
- **Indicador que depende de decisão humana não publica número antes dela.**

## Próximos passos, em ordem de efeito

**0. Resolver o incidente de timeout.** Bloqueia tudo: o painel executivo está
fora do ar para a operação. Detalhes no topo do handoff.

**1. Sincronização completa de atendimentos.** É o maior efeito pelo menor
esforço. Sem ela, `subject`, `first_agent_reply_at`, `reopened_at`,
`closure_type` e `is_one_touch` seguem nulos, e vários indicadores continuam em
"Indisponível" sem necessidade. Depois dela: a taxa de reabertura sai de
"Aguardando histórico" e o tempo de primeira resposta passa de 3% para cerca de
40% de cobertura.

**2. Filtro por operação no painel.** Pedido explícito da operação: o CS da
Neotrust abre o Dashboard e vê Neotrust; o da Aftersale vê Aftersale. A base está
pronta — `group_company` existe em `analytics_source_config`,
`rpc_analytics_support_queue_health` já devolve `by_group_company`. Falta o
seletor e a propagação aos read models de cada aba. Considere se o recorte deve
ser preferência da pessoa ou derivar do perfil de acesso.

**3. Reclassificar os pipelines** em Configurações, Fontes do Dashboard. A tela
foi refeita com agrupamento por operação e o nome oficial à vista. Isso muda
"Fila atual" de 2.851 para a ordem de 650 — **avise a operação antes**, e note
que o fallback mantém o número antigo com estado parcial enquanto ninguém
decidir.

**4. Comercial tem a mesma mistura do Suporte, e ninguém decidiu nada.** "Piloto
Aftersale" com 1.171 negócios, "Pipe de Vendas" com 908 e operação indefinida, e
"Gestão CS" com 25 que não é comercial. A taxa de ganho de 8% é média de coisas
que não se comparam. `rpc_analytics_pipeline_inventory('deal')` apoia a decisão.

**5. Confirmar SocialSoul / Lomadee** como quarta operação e revisar se os
pipelines dela deveriam estar ativos no recorte de Suporte.

**6. Os três pedidos da operação** em
`docs/specs/2026-08-08_cockpit-gerencial-e-conciliacao.md`, na ordem sugerida
lá: direção visual de cantos retos primeiro, porque é de menor risco e evita
retrabalho; depois o cockpit; por último a conciliação de empresas, que é a de
maior valor e maior cuidado porque muda o cruzamento financeiro.

**7. Terminar a ingestão de vínculos.** `completed_at` ainda nulo em
`analytics_hubspot_associations_sync_state`. A cobertura de 2026 subiu de 0% para
60,2% após a retomada; a varredura segue em curso.

## Como validar

```
npm run lint
npm run web:typecheck
npm run contracts:typecheck
npm run web:build
npm run supabase:db:reset && npm run supabase:test:db   # obrigatório se tocar SQL
npm run local:qa:secret-scan
npm run quality:changed
node scripts/local-qa/dashboard-subabas-evolucao-qa.mjs   # QA visual, 18 combinações
node scripts/local-qa/dev-server-monta.mjs               # confere que o dev sobe
```

O ambiente local roda exclusivamente em `http://127.0.0.1:4173`. O launcher
verifica o processo que ocupa a porta, reinicia apenas a instância marcada
como deste projeto e não usa porta alternativa. Relatórios históricos podem
conter referências a outros previews, mas isso não representa o fluxo atual.

## Mantenha o que funcionou

O painel tem uma disciplina que custou caro para chegar aqui e que vale preservar:
dado ausente aparece como "Indisponível" com motivo em linguagem de operação,
nunca como zero; cada indicador declara a coorte de data que o posiciona;
cobertura parcial é dita na tela; e nenhuma regra de negócio é inventada no
frontend a partir de nome ou texto livre.

Se encontrar um número que surpreenda, a primeira pergunta não é o que ele
significa — é de qual ambiente ele veio e se bate com a origem.

---

Comece pelo handoff e siga com o passo 1. Não precisa pedir aprovação para o
desenvolvimento normal; pare e registre o risco antes de deploy, alteração de
secret, migration remota destrutiva, escrita em massa no HubSpot ou qualquer
operação com custo financeiro.
