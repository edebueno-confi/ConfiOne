# Handoff — 2026-08-08

> ## Atualização Codex — tickets HubSpot completos e dispatcher autônomo
>
> As migrations `20260808260000`, `20260808270000` e `20260808280000` estão
> aplicadas no remoto. A carga completa de tickets terminou em `success` com
> 45.065 registros promovidos e passou a materializar assunto, primeira resposta
> do agente, reabertura, duração, one-touch e fechamento quando presentes na
> origem. O KPI de reabertura passou a usar a evidência nativa e não inventa
> valor quando ela está ausente.
>
> O defeito de operação também foi resolvido: criar uma run agora aciona o
> dispatcher por trigger privado, e o dispatcher continua lotes de 12 itens e
> tenta a promoção final ao encontrar a fila vazia. Um run incremental iniciado
> diretamente pelo RPC concluiu com nove páginas e `success`, sem intervenção
> manual. Foram publicadas `hubspot-orchestrator-worker` v39 e
> `hubspot-orchestrator-dispatcher` v32. Relatório:
> `docs/reports/2026-08-08_hubspot-ticket-native-fields-and-autodispatch.md`.

> ## ⛔ INCIDENTE ABERTO — LEIA PRIMEIRO
>
> **O Dashboard está quebrado em produção.** Reportado pela operação logo após o
> commit `b064b43`.
>
> ```
> rpc_analytics_ceo_snapshot        500
> rpc_analytics_ceo_history         500
> rpc_analytics_executive_kpis_v2   500
> functions/v1/omie-sync            502
> ```
>
> **Diagnóstico confirmado:** o log do Postgres acusa
> `canceling statement due to statement timeout`. **Não é permissão nem coluna
> ausente** — as funções executam com sucesso quando chamadas direto no banco,
> inclusive com `set role authenticated`. Estouram o `statement_timeout` do
> PostgREST quando vêm pelo REST.
>
> **Suspeito principal: `vw_analytics_ticket_resolution`**, reescrita por mim em
> `20260808210000` e novamente em `20260808230000`. Um `count(*)` sobre ela custa
> **563 ms** com Seq Scan em 34.392 linhas, e as RPCs executivas fazem LEFT JOIN
> dela dentro de cadeias de 15 CTEs.
>
> Descartados na investigação: carga concorrente (banco ocioso, nenhuma consulta
> longa), `analytics_hubspot_stage_events` (zero linhas, o CTE de janela é
> barato), privilégios (`authenticated` tem EXECUTE em todas as RPCs).
>
> ### Caminhos, do mais seguro ao mais custoso
>
> 1. **Reverter a view para a definição de `20260807160000`**, que rodava em
>    produção sem timeout. Perde as propriedades nativas, que só terão valor
>    depois da próxima sincronização de qualquer forma. É a reversão mais barata
>    e devolve o painel hoje.
> 2. **Medir a RPC, não a view.** `explain (analyze)` em
>    `rpc_analytics_executive_kpis_v2` e `rpc_analytics_ceo_snapshot` para achar o
>    nó caro. Pode não ser a view: as duas cruzam OMIE, HubSpot e snapshots.
> 3. **Materializar.** Se a view for mesmo o gargalo, uma matview com refresh no
>    ciclo de sincronização resolve sem perder as colunas novas.
>
> O `omie-sync` com 502 pode ser sintoma do mesmo esgotamento ou problema
> independente — **verifique separadamente antes de assumir causa comum**.
>
> **Não tive contexto para concluir a correção.** O diagnóstico acima é o que
> ficou verificado; a hipótese da view é forte mas **não foi provada** medindo a
> RPC completa. Comece por aí.

> ## Atualização Codex — hardening aplicado no Supabase, 2026-08-08
>
> A medição remota da cadeia completa refutou a hipótese da view: ela conta
> 34.392 tickets em 42 ms. O gargalo é o spill de CTEs sob `work_mem=2184kB`, com
> `authenticated` limitado a 8 s. Os máximos históricos via PostgREST foram
> 7,68 s no Histórico, 6,79 s no Snapshot e 6,71 s no Resumo Executivo.
>
> A migration local `20260808250000_analytics_dashboard_timeout_hardening.sql`
> configura `work_mem=16MB` no read model de Suporte e `64MB` no Snapshot
> executivo. Ela tem pgTAP dedicado, reset integral e 1.694 testes aprovados.
> A migration foi aplicada no Supabase remoto: o catálogo confirma os valores
> por função e as quatro RPCs críticas mediram entre 299 ms e 4,37 s, abaixo dos
> 8 s autenticados. Não houve deploy, push ou alteração de secret; falta apenas
> acompanhar a rota HTTP autenticada sob tráfego real.
>
> O 502 atual do OMIE é separado: os dois últimos runs falharam por 500 do
> provedor; a promoção de 3.768 títulos concluiu em 42,2 s após o hardening de
> 120 s. Relatório: `docs/reports/2026-08-08_dashboard-timeout-root-cause-and-hardening.md`.


Estado do trabalho no Dashboard para quem continuar, com ou sem histórico da
conversa. Escrito para o Codex assumir do zero.

---

## 1. CI: estava vermelho por cinco commits, foi corrigido

> **Resolvido em `b064b43`.** `db reset` do zero mais 1.690 testes pgTAP em PASS.
> O diagnóstico dos quatro defeitos está na seção 9. As linhas abaixo descrevem o
> estado em que o problema foi encontrado, e ficam como registro.

**Os workflows "Supabase DB" falhavam desde `6914a7f` (2026-08-07 17:09).** Cinco
execuções seguidas em vermelho, e eu publiquei todas sem conferir.

O workflow (`.github/workflows/supabase-db.yml`) roda, nesta ordem:

```
contracts:typecheck → web:typecheck → web:build → supabase:start
→ supabase:db:reset → supabase:test:db (pgTAP) → knowledge:verify
→ supabase:lint:db
```

Os três primeiros passam localmente. **A suspeita recai sobre o pgTAP**, porque
`db reset` aplica as migrations do zero e depois roda os testes.

### Hipótese principal, por leitura de código

`supabase/migrations/20260808210000_propriedades_nativas_de_atendimento.sql`
reescreveu `vw_analytics_ticket_resolution` mudando três comportamentos:

| O que mudou | Teste que provavelmente quebra |
| --- | --- |
| `has_history` passou a ser verdadeiro também quando `reopened_at` existe | `104_...sql:168` afirma `has_history = false` para `res-4` |
| `first_response_hours` ganhou precedência para `first_agent_reply_at` | `105_...sql:97,103,109` |
| `reopened_count` deriva de `reopened_at` e não só do histórico | `104_...sql:142` |

**Nunca rodei pgTAP depois de reescrever essa view.** Rodei apenas os testes de
contrato em Node, que não cobrem SQL.

### Como reproduzir

```
npm run supabase:db:reset      # demorado: baixa imagens na primeira vez
npm run supabase:test:db
```

O reset estava em curso quando o trabalho parou, ainda baixando imagens Docker.
Log em `.tmp-reset.log` (ignorado pelo Git).

### Cuidado

`db reset` **apaga o banco local**. Os dados de lá já estavam defasados
(2026-08-04) e são recuperáveis por sincronização, mas confirme antes de rodar em
qualquer ambiente que não seja o local.

---

## 2. Estado do Git

| Item | Estado |
| --- | --- |
| Branch | `codex/react-router-v8-migration-20260804` |
| Último commit | `b064b43` — **publicado nos dois espelhos** |
| Árvore de trabalho | limpa |
| Remoto | `origin` com duas URLs de push (Genius-OS e Central-Confi) |

Verificado por `git ls-remote`: local, Genius-OS e Central-Confi no mesmo commit.

---

## 3. O que foi entregue e está em produção

Migrations aplicadas em local e remoto, histórico do CLI alinhado.

| Migration | O que faz |
| --- | --- |
| `20260808120000` | `queue_role` no pipeline, limiar de estagnação, saúde da fila |
| `20260808130000` | Separa "sem data de atividade" de "estagnado" |
| `20260808140000` | Editor de papel, faixas de idade, dívida com clientes, Fase 3 |
| `20260808150000` | Remove `subject` inexistente da função de dívida |
| `20260808160000` | Cobertura de atividade no indicador de parados |
| `20260808170000` | Colunas explícitas no CTE |
| `20260808180000` | **Operação do grupo** e **espera de terceiro** |
| `20260808190000` | Indicadores que dependem de decisão viram `unavailable` |
| `20260808200000` | Operação do grupo nos pipelines de negócio + inventário |
| `20260808210000` | **Propriedades nativas** (suspeita do CI) |
| `20260808220000` | **Campos customizados de fechamento** |

---

## 4. Os achados que mudam a leitura do painel

### 4.1 O portal do HubSpot é compartilhado por quatro operações

Confi, Neotrust, Aftersale e **SocialSoul / Lomadee**. A convenção de emoji no
nome do pipeline codifica isso: 💜 Aftersale, 🔎 Confi, 📊 Neotrust, 👁 Confi
Analytics.

"Fila atual" somava as três primeiras num número só. Separadas:

| Operação | Na fila | Sem dono |
| --- | ---: | ---: |
| Confi | 2.469 | **2.053** |
| Neotrust | 210 | 11 |
| Aftersale | 170 | 4 |

**Neotrust e Aftersale estão saudáveis. O problema é todo da Confi.**

### 4.2 O apelido interno escondia a operação

`1429283` chama-se **"📊 CS | Neotrust"** e o painel exibia **"Suporte"**. A
classificação foi decidida sobre esse rótulo e teve de ser revertida.

**Regra que ficou:** nome oficial é o rótulo, apelido vem ao lado.

### 4.3 A equipe fecha em campo customizado, não na etapa

`tipo_de_fechamento | Fale conosco | Confi` tem **1.247 preenchidos**, e esse é o
pipeline com **1.117 parados**. Mesma ordem de grandeza.

O painel, lendo só a etapa, publica como aberto o que já foi concluído. Os
valores agora são ingeridos **sem interpretação** — transformar "Solicitação
concluída" em encerramento é decisão humana a registrar, não regra a inventar.

### 4.4 Os "Indisponível" eram falta de contrato nosso

| Propriedade | No HubSpot | Tínhamos |
| --- | ---: | ---: |
| `subject` | 53.070 | **0** (pedido e descartado) |
| `first_agent_reply_date` | 13.679 | 1.077 |
| `hs_ticket_reopened_at` | 68 | 0 |

`hs_ticket_reopened_at` **destrava a taxa de reabertura sem histórico de
etapas**, que estava listada como bloqueio há vários ciclos.

**Os valores só chegam na próxima sincronização completa de atendimentos.**

### 4.5 23% dos encerramentos são instantâneos

81 de 351 têm data de encerramento igual à de abertura, todos num pipeline só.
Puxam a mediana para 0,1 dia. Publicados como contagem própria
(`instant_resolutions`), sem exclusão.

---

## 5. Decisões da operação já tomadas

- **Fila de trabalho:** Criadouro Aftersale, Suporte (= CS Neotrust), Suporte B2B
- **Caixa de entrada:** Fale conosco, Confi Whatsapp, Confi Analytics
- **Limiar de estagnação:** 180 dias, com faixas na tela para conferência
- **Passivo:** não encerrar em massa; reclassificar resolve o painel sem tocar no
  HubSpot

**A classificação foi revertida** após o achado 4.2 e precisa ser refeita com o
nome real à vista. Todos os pipelines estão em `a_classificar`, e o fallback
devolve o comportamento anterior com estado parcial declarado.

---

## 6. Pendências, em ordem

~~1. Corrigir o CI~~ — **feito** em `b064b43`, seção 9.
~~2. Publicar~~ — **feito**, os dois espelhos em `b064b43`.

3. **Sincronização completa de atendimentos.** Sem ela os campos novos —
   `subject`, `first_agent_reply_at`, `reopened_at`, `closure_type` — continuam
   nulos, e os indicadores que dependem deles seguem em "Indisponível". É o
   passo de maior efeito por menor esforço.
4. **Reclassificar os pipelines** em Configurações, Fontes do Dashboard, agora
   com o nome oficial e a operação à vista. Muda "Fila atual" de 2.851 para a
   ordem de 650 — avisar a operação antes.
5. **Filtro por operação no painel** — pedido explícito: o CS da Neotrust abre e
   vê Neotrust, o da Aftersale vê Aftersale. `group_company` já existe em
   `analytics_source_config` e a saúde da fila já agrupa por ela; falta o seletor
   e a propagação aos read models de cada aba.
6. **Confirmar SocialSoul / Lomadee** como quarta operação, e revisar se os
   pipelines dela deveriam estar ativos no recorte de Suporte.
7. **Ingestão de vínculos:** `completed_at` ainda nulo, varredura em curso.
   Cobertura de 2026 subiu de 0% para 60,2% após a retomada.
8. **Comercial tem a mesma mistura do Suporte** e ninguém decidiu nada ainda:
   "Piloto Aftersale" 1.171 negócios, "Pipe de Vendas" 908 sem operação
   definida, "Gestão CS" 25 que não é comercial. Nenhum indicador comercial foi
   alterado de propósito.

---

## 7. Regras que este trabalho comprou com erro

**Consultar o banco não é consultar a fonte.** Três lotes seguidos com o mesmo
erro de fundo: leitura do banco tratada como conhecimento do negócio. Banco local
defasado virou "defeito em produção". Apelido virou classificação errada. Schema
nosso virou "a propriedade não existe no HubSpot". Nos três, o SQL estava certo.

**Número que muda decisão da operação é conferido na origem antes de virar
proposta.** Nos três casos a correção veio de alguém abrir a tela do HubSpot.

**Cobertura acompanha a medida, não a função.** Todo indicador sobre campo
opcional precisa da própria checagem: corrigir num lugar não protege o próximo.

**Indicador que depende de decisão não publica número antes dela.**

---

## 8. Onde está o resto

- `docs/reports/2026-08-07_kpi-discovery-e-lote-p0.md` — seções 1 a 26, com as
  retificações marcadas
- `docs/specs/2026-08-08_saude-da-fila-e-papel-do-pipeline.md`
- `docs/DASHBOARD_PIPELINES_E_GRAFICOS_ROADMAP.md` — Now/Next/Later
- `scripts/local-qa/dashboard-subabas-evolucao-qa.mjs` — QA visual, 18 combinações
- `scripts/local-qa/dev-server-monta.mjs` — confere que o dev sobe de fato

---

## 9. Atualização: CI corrigido

`npm run supabase:db:reset && npm run supabase:test:db` → **PASS, 1.690 testes.**

Foram quatro defeitos encadeados, todos meus:

1. **`e.previous_state` não existe** em `analytics_hubspot_stage_events`. Copiei
   de uma versão da view que derivava isso e a tabela nunca teve a coluna. Agora
   é derivado com `lag()` sobre a própria sequência.
2. **A reescrita descartou colunas do contrato** — `is_currently_open`,
   `pipeline_id`, `first_closed_at`, `stage_changes` — e mudou o significado de
   `has_history` e `reopened_count`. Restaurados.
3. **Dois gatilhos SECURITY DEFINER em `public`.** A auditoria exige prefixo
   `rpc_` ali. Movidos para `app_private` e sem elevação de privilégio.
4. **ACL não declarada** na função nova.

E um rótulo trocado sem motivo: `hubspot_property` virou `native_close_date` na
minha reescrita. Voltou. Vocabulário estabelecido não se troca por preferência.

**A causa raiz de tudo:** reescrevi a view do zero em vez de partir da definição
vigente. Reescrever de memória descarta o que não se lembrou de olhar.

**Regra:** alterar view ou função existente parte do `pg_get_functiondef` /
`pg_get_viewdef` atual. E `supabase:test:db` roda antes de qualquer commit que
toque em SQL — foi o único que pegou os quatro.
