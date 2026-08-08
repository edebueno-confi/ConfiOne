# Handoff — 2026-08-08

Estado do trabalho no Dashboard para quem continuar, com ou sem histórico da
conversa. Escrito para o Codex assumir do zero.

---

## 1. O bloqueio ativo: CI vermelho há cinco commits

**Os workflows "Supabase DB" falham desde `6914a7f` (2026-08-07 17:09).** Cinco
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
| Último commit local | `707f6a8` — não publicado |
| Último commit publicado | `7f3b273` |
| Árvore de trabalho | limpa |
| Remoto | `origin` com duas URLs de push (Genius-OS e Central-Confi) |

**`707f6a8` não foi publicado de propósito:** não faz sentido empurrar mais um
commit para um CI já vermelho antes de entender a causa.

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

1. **Corrigir o CI** — hipótese na seção 1. Bloqueia tudo.
2. **Publicar `707f6a8`** depois do CI verde.
3. **Sincronização completa de atendimentos**, para os campos novos chegarem.
4. **Reclassificar os pipelines** em Configurações, Fontes do Dashboard.
5. **Filtro por operação no painel** — pedido da operação: o CS da Neotrust abre
   e vê Neotrust. `group_company` já existe e é agrupável; falta o seletor e a
   propagação aos read models.
6. **Confirmar SocialSoul / Lomadee** como quarta operação.
7. Ingestão de vínculos: `completed_at` ainda nulo, varredura em curso.

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
