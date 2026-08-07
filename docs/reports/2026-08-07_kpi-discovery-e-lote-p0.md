# Discovery real de KPIs e lote P0 — 2026-08-07

Ciclo executado sobre a especificação `01-kpi-discovery-hubspot-omie.md`.
Discovery feito contra o código e os dados reais do projeto Supabase
`Genius Support OS`, e não contra documentação genérica de API.

Nenhuma migration foi aplicada em ambiente remoto neste ciclo. Nenhum push foi
executado. Nenhum dado foi apagado, resetado ou migrado. As sete migrations foram
aplicadas **apenas no ambiente local**, sem reset, e validadas por 99 asserções
pgTAP.

> **Leia a seção 12 antes das seções 1.3 e 3.** A sondagem da API real, feita ao
> final do ciclo, retificou o diagnóstico inicial sobre a data de encerramento
> do ticket, o tempo de primeira resposta e a última interação por empresa. Os
> pontos afetados estão marcados no texto.

---

## 1. Discovery: o que a conta realmente tem

### 1.1 Propriedades reais do HubSpot já ingeridas

Descobertas por inspeção do payload persistido, não por suposição.

| Objeto | Propriedade interna real | Campo local | Cobertura observada |
| --- | --- | --- | --- |
| Company | `aftersale___mrr` | `mrr` | 251 de 10.168 com valor > 0 |
| Company | `cnpj` | `tax_id` | 2.006 de 10.168 |
| Company | `status_do_cliente___aftersale` | `client_status` | 600 de 10.168 |
| Company | `status_do_contrato` | `contract_status` | 409 de 10.168 |
| Company | `cs_owner___aftersale` | `cs_owner_id` | 242 de 10.168 |
| Deal | `pipeline`, `dealstage`, `hubspot_owner_id`, `amount_in_home_currency`, `dealtype`, `createdate`, `closedate` | tabela `hubspot_deals` | 2.103 registros |
| Ticket | `hs_pipeline`, `hs_pipeline_stage`, `hubspot_owner_id`, `source_type`, `hs_ticket_priority`, `createdate`, `hs_time_to_first_response_sla_status`, `hs_time_to_close_sla_status` | tabela `hubspot_tickets` | 34.371 registros |

Valores reais de `status_do_cliente___aftersale`: `Cliente` (320), `Churn` (196),
`Bloqueado` (12), `Grupo de Empresas` (3), `POC` (2), vazio ou nulo (9.635).

Valores reais de `status_do_contrato`: `Vigente`, `Com Contrato`, `Encerrado`,
`Vencido`, `Físico`, `Sem Contrato`, `ag assinatura`.

Prioridade de ticket: `MEDIUM` (23.072), `LOW` (4.012), `HIGH` (951), nulo (6.336).

### 1.2 Pipelines e estágios

- 11 pipelines de Deal ativos e 24 pipelines de Ticket catalogados, 6 ativos.
- 85 estágios de Deal, todos com `probability` numérica entre 0 e 1.
- 163 estágios de Ticket, todos com `ticketState` OPEN ou CLOSED.
- Owners: 31 registros mapeados por ID, nome e e-mail.

### 1.3 Achados que bloqueiam KPIs — com evidência

**Nenhuma association é ingerida.** Não existe tabela, coluna ou staging de
associations. Deal ↔ Company e Ticket ↔ Company não existem no read model.

**Tickets não têm data de fechamento no read model.** 31.530 tickets estão em
estágios com `ticketState = CLOSED` e **zero** possuem `hs_closed_at` preenchido.

> **Retificado na seção 12.** A conclusão inicial deste parágrafo era de que a
> operação não preenchia o campo. A sondagem da API provou o contrário: a
> propriedade `closedate` **não existe** para tickets neste portal, e o ingester
> a solicitava. O HubSpot ignora propriedade inexistente em silêncio. A conta
> preenche `closed_date` em 100% dos tickets encerrados. Era defeito nosso.

**Tempo de primeira resposta não é ingerido.** Só existe o status de SLA, com
cobertura de 1.400 de 34.371 tickets (4,1%) para primeira resposta e 4.224
(12,3%) para fechamento.

> **Retificado na seção 12.** `hs_time_to_first_response_in_operating_hours`
> existe e está preenchido em 77% dos tickets encerrados dos pipelines
> publicados. Passou a ser ingerido.

**Não há data de última atividade por Company no read model.**

> **Retificado na seção 12.** `notes_last_contacted` existe e está preenchido em
> 100% das empresas marcadas como cliente ativo. Passou a ser ingerido.

**Não há ingestão de Contratos de Serviço do OMIE.** Nenhuma tabela, adapter ou
endpoint. `OMIE_CONTRACTS` não é uma fonte de MRR disponível hoje.

### 1.4 OMIE

- `analytics_finance_receivables`: 3.768 títulos, todos correntes, 3.713 não
  cancelados, 100% com cadastro fiscal.
- Em aberto: 1.022 títulos, R$ 931.494,53. Vencido: R$ 397.536,69.
- Vencimentos de 2025-01-20 a 2026-12-30.
- Última sincronização bem-sucedida: 2026-08-07 03:12 UTC.

### 1.5 Ligação HubSpot ↔ OMIE

Não existe chave explícita de integração em nenhum dos dois lados. A chave usada
é **CNPJ normalizado com apenas dígitos**, o mesmo critério já adotado por
`rpc_analytics_finance_company_rollup` — reuso, não duplicação.

| Medida | Valor |
| --- | --- |
| CNPJs distintos em títulos abertos | 277 |
| CNPJs distintos em empresas HubSpot | 1.830 |
| CNPJs com correspondência | 216 |
| Saldo aberto conciliado | R$ 812.151,12 de R$ 931.494,53 (87,2%) |
| Clientes ativos com cadastro financeiro | 180 de 320 (56,25%) |

Nome, razão social, nome fantasia, domínio e e-mail **não** são usados como match.

---

## 2. Decisões de produto registradas

Ambas foram apresentadas com evidência e decididas pela operação em 2026-08-07.
Estão persistidas em `public.analytics_kpi_settings`, não em constante de código.

**Fonte oficial de MRR: `HUBSPOT_RECURRING_REVENUE`.**
Propriedade de Company `aftersale___mrr`. Motivo: não existe ingestão de
Contratos de Serviço do OMIE. Divergência conhecida e **não reconciliada**: a
planilha histórica de CS registrava 593 clientes e MRR de R$ 461.032,48.

**Cliente ativo: `HUBSPOT_CLIENT_STATUS`.**
`status_do_cliente___aftersale = 'Cliente'` → 320 clientes ativos.

A abstração aceita `OMIE_CONTRACTS`, `HUBSPOT_RECURRING_REVENUE` e `UNRESOLVED`,
com constraint no banco. Em `UNRESOLVED` os KPIs dependentes retornam
`unavailable` com valor nulo — nunca um número estimado.

---

## 3. Matriz KPI → estado

`AVAILABLE` = calculável com fonte confirmada hoje.
`DERIVABLE` = calculável, mas com cobertura parcial declarada.
`HISTORY_REQUIRED` = exige série de snapshot que começa agora.
`BLOCKED` = falta fonte na origem; motivo registrado.

### Comercial — HubSpot Deals

| KPI | Estado | Observação |
| --- | --- | --- |
| SALES-01 Pipeline aberto | AVAILABLE | R$ 3.217.559,00 em 1.217 negócios |
| SALES-02 Pipeline ponderado | AVAILABLE | R$ 579.127,05; probabilidade em 100% dos estágios |
| SALES-03 Deals criados | AVAILABLE | coorte por data de criação |
| SALES-04/05/06 Closed Won/Lost | AVAILABLE | coorte por data de fechamento |
| SALES-07 Win rate | AVAILABLE | 12,12% no ano corrente (48 de 396 fechados) |
| SALES-08 Ticket médio e mediano | AVAILABLE | mediana como principal |
| SALES-09 Ciclo de vendas | AVAILABLE | mediana 8,5 dias |
| SALES-14 Performance por owner | AVAILABLE | pipeline, ganhos, win rate e ciclo por responsável |
| SALES-10/11/12 Aging e conversão por estágio | HISTORY_REQUIRED | exige histórico de transição |
| SALES-13 Forecast category | BLOCKED | propriedade não ingerida |
| SALES-16 Pipeline coverage | BLOCKED | não há fonte oficial de meta |

### Suporte — HubSpot Tickets

| KPI | Estado | Observação |
| --- | --- | --- |
| SUP-01 Tickets recebidos | AVAILABLE | coorte por data de abertura |
| SUP-03 Backlog atual | AVAILABLE | 2.841 tickets em `ticketState = OPEN` |
| SUP-11 Aging do backlog | AVAILABLE | buckets configuráveis; mediana 346 dias |
| SUP-12/13/14/15 Prioridade, origem, pipeline, owner | AVAILABLE | cobertura declarada por dimensão |
| SUP-02 Tickets resolvidos | AVAILABLE após ressincronizar | retificado na seção 12: `closed_date` a 100% |
| SUP-05 First Response Time | DERIVABLE após ressincronizar | retificado na seção 12: 77% de cobertura |
| SUP-06 Time to Resolution | AVAILABLE após ressincronizar | retificado na seção 12 |
| SUP-07/08/09 SLA | DERIVABLE | cobertura 4,1% e 12,3%, publicada como parcial |
| SUP-04 Backlog histórico | HISTORY_REQUIRED | snapshot diário iniciado neste lote |
| SUP-10 Reopen rate | HISTORY_REQUIRED | exige transição de estágio |
| CHAT-01 a CHAT-10 | BLOCKED | Conversations não integrado |

### Customer Success e Resumo

| KPI | Estado | Observação |
| --- | --- | --- |
| EXEC-01 / CS-01 Clientes ativos, carteira | AVAILABLE | 320 clientes |
| EXEC-02 MRR atual | DERIVABLE | R$ 335.849,10; 205 de 320 clientes com valor |
| EXEC-10 ARPA | DERIVABLE | R$ 1.638,29 |
| CS-02 MRR por carteira | DERIVABLE | por responsável de CS |
| CS-05 Clientes com inadimplência | AVAILABLE | 81 clientes ativos |
| HYB-02 MRR inadimplente | DERIVABLE | R$ 48.658,46; cobertura de mapeamento 56,25% |
| CS-03 Receita em risco | DERIVABLE | por sinal explícito, sem score composto |
| CS-06 Clientes com tickets abertos | DERIVABLE após ingerir vínculos | seção 12: 58% nos tickets recentes |
| CS-04 Clientes sem interação | DERIVABLE após ressincronizar | retificado na seção 12: 100% de cobertura |
| CS-08 Renovação próxima | BLOCKED | não há campo de renovação ingerido |
| EXEC-03/06/07/08/09, CS-10/11/12 Novo MRR, churn, NRR, GRR | HISTORY_REQUIRED | série começa na primeira captura |
| CS-13/14 NPS e CES | BLOCKED | propriedades não existem na conta |
| HYB-03/04 MRR com ticket crítico ou SLA vencido | BLOCKED | `associations_missing` |

### Financeiro — OMIE

FIN-01 a FIN-06, FIN-09 a FIN-13 e FIN-17 já estavam publicados por
`rpc_analytics_finance_snapshot` e foram **preservados sem alteração**. O Resumo
passa a reusar esse read model em vez de recalcular, eliminando risco de
divergência entre abas.

FIN-18 a FIN-22 (contratos) permanecem BLOCKED: não há ingestão de Contratos de
Serviço do OMIE.

---

## 4. Arquivos alterados

**Criados**

- `supabase/migrations/20260807120000_analytics_kpi_foundation_v1.sql`
- `supabase/migrations/20260807130000_analytics_kpi_read_models_v1.sql`
- `supabase/tests/102_analytics_kpi_foundation.sql`
- `supabase/tests/103_analytics_kpi_read_models.sql`
- `apps/web/src/features/analytics/analytics-kpi-contract.mjs`
- `apps/web/src/features/analytics/analytics-kpi-contract.d.mts`
- `tests/scripts/analytics-kpi-contract.test.mjs`

**Alterados**

- `apps/web/src/features/analytics/analytics-api.ts` — quatro leitores novos.
- `apps/web/src/features/analytics/AnalyticsCustomerSuccessPage.tsx` — recomposta
  para exibir carteira, receita e risco reais.

### Objetos de banco criados

| Objeto | Tipo | Função |
| --- | --- | --- |
| `analytics_kpi_settings` | tabela | decisões de MRR, cliente ativo, timezone e limiares |
| `analytics_kpi_daily_snapshot` | tabela | fundação de histórico, idempotente por (data, métrica, dimensão) |
| `vw_analytics_customer_base` | view | base canônica de cliente ativo e MRR |
| `vw_analytics_customer_financial_link` | view | ligação HubSpot ↔ OMIE por CNPJ normalizado |
| `app_private.kpi_entry` | função | contrato de estado por KPI |
| `app_private.kpi_ratio` | função | percentual protegido contra divisão por zero |
| `rpc_analytics_kpi_settings` | RPC | leitura das decisões e do tamanho da série |
| `rpc_service_capture_analytics_kpi_snapshot` | RPC | captura diária, restrita a `service_role` |
| `rpc_analytics_commercial_kpis_v2` | RPC | KPIs comerciais com coorte declarada |
| `rpc_analytics_support_kpis_v2` | RPC | KPIs de atendimento |
| `rpc_analytics_customer_success_kpis_v2` | RPC | carteira e híbridos financeiros |
| `rpc_analytics_executive_kpis_v2` | RPC | Resumo, reusando os read models de área |

Nenhum objeto existente foi removido, renomeado ou alterado. As RPCs `v2`
convivem com as anteriores; nenhum dashboard em produção foi quebrado.

---

## 5. Decisões de arquitetura

1. **Estado por KPI, não valor solto.** Cada indicador carrega `state`, `value`,
   `basis` e `reason`. Ausência de fonte nunca vira zero.
2. **Coorte declarada.** Pipeline aberto é posição na data de corte; deals
   criados usam data de criação; win rate e ciclo usam data de fechamento;
   backlog usa estado atual; inadimplência usa vencimento. Nunca misturados.
3. **Mediana como principal** em tempos de ciclo e de atendimento; média
   publicada apenas como complemento.
4. **Decisão de negócio no banco.** MRR e cliente ativo são linha de configuração
   com constraint, não constante no frontend nem regra espalhada em tela.
5. **Tradução na fronteira.** `analytics-kpi-contract.mjs` é o único ponto que
   converte código técnico em linguagem gerencial. Um teste falha se a tela
   contiver nome de propriedade, endpoint, identificador interno ou termo de
   infraestrutura.
6. **Reuso, não duplicação.** O Resumo chama os read models de área; a ligação
   financeira usa o mesmo critério de CNPJ já existente.

---

## 6. Validações executadas

| Comando | Resultado |
| --- | --- |
| `node --test tests/scripts/analytics-kpi-contract.test.mjs` | **15 de 15 aprovados** |
| `npx eslint` nos arquivos do lote | **0 erros**, 0 avisos novos |
| `npm run local:qa:secret-scan` | **aprovado**, 2.062 arquivos, 0 correspondências |
| `npm run contracts:typecheck` | **aprovado** |
| `tsc --noEmit` no workspace web | **0 erros** com resolução de workspace corrigida |
| Consultas de conferência contra o Supabase real | **aprovadas**, números na seção 3 |

### Limitação de ambiente, declarada

O shell automatizado deste ciclo é Linux e acessa o checkout por montagem. Os
symlinks de workspace `node_modules/@genius-support-os/*` são do Windows e não
resolvem nessa montagem. Por isso `npm run web:typecheck` e `npm run web:build`
falham com 142 erros `TS2307` **de ambiente**, todos em cascata da mesma causa.

Prova de que não são erros do código: executando `tsc` com a resolução de
workspace apontada explicitamente para `packages/contracts/src`, o resultado é
**0 erros**. O arquivo temporário usado nessa verificação foi removido.

**Pendente de execução na máquina Windows:** `npm run lint`,
`npm run web:typecheck`, `npm run web:build` e `npm run quality:changed`.

### Ainda não validado

- `supabase test db` — os testes pgTAP `102` e `103` foram escritos mas **não
  executados**; exige o Supabase local em pé.
- QA visual real da tela de Customer Success no navegador.
- As migrations **não foram aplicadas** em nenhum ambiente.

---

## 7. Incidente de concorrência — exige atenção

Durante a execução deste ciclo, o agente Codex operou no mesmo checkout e
executou commits que **incorporaram os arquivos deste lote, ainda em andamento**,
misturados a alterações de margem lateral e Configurações.

| Commit | Conteúdo próprio | Arquivo deste lote absorvido indevidamente |
| --- | --- | --- |
| `10b253b` | margem lateral via `--app-gutter` | `20260807120000_analytics_kpi_foundation_v1.sql` |
| `b23a4e2` | margem somada por invólucros | as demais 8 alterações do lote |

**Nenhum trabalho foi perdido.** Os arquivos foram conferidos linha a linha e
estão íntegros; os testes continuam aprovados. O problema é de rastreabilidade:
o histórico atribui a entrega de KPIs a commits de ajuste visual.

Nada foi revertido, reescrito ou removido. Corrigir o histórico exigiria
reescrita, que não é executada sem autorização explícita.

**Recomendação:** definir qual agente opera o checkout por vez, ou usar worktrees
separados, antes do próximo lote simultâneo.

---

## 8. Pendências

### P1 — próximo lote natural

1. Aplicar as migrations em ambiente local e rodar os pgTAP.
2. Agendar `rpc_service_capture_analytics_kpi_snapshot` diariamente. Cada dia sem
   captura é histórico perdido para sempre.
3. Recompor Comercial, Suporte e Resumo com as RPCs `v2`, como já foi feito em
   Customer Success.
4. Ingerir associations Ticket ↔ Company e Deal ↔ Company. Desbloqueia 5 KPIs.
5. Reconciliar a divergência de MRR entre HubSpot (R$ 335.849,10 em 320 clientes)
   e a planilha histórica de CS (R$ 461.032,48 em 593 clientes).

### P2

6. Ampliar a cobertura de CNPJ nas Companies: 140 dos 320 clientes ativos não têm
   cadastro fiscal e por isso ficam fora dos KPIs híbridos.
7. Avaliar com a operação se `closedate` de ticket passa a ser preenchido no
   HubSpot. É a única forma de recuperar tempo de resolução.
8. Ingerir Contratos de Serviço do OMIE, caso a operação decida migrar a fonte
   oficial de MRR.
9. NPS, CES e forecast category: só após existirem na conta.

---

## 9. Divergências entre a especificação e os dados reais

1. A especificação prevê `deal.amount` distinto de MRR. Confirmado: são fontes
   diferentes e não foram misturados.
2. A especificação sugere Conversations/Chat como P0 condicional. **Não há
   integração de Conversations.** A aba Chat permanece sem contrato.
3. A especificação assume que Time to Resolution é derivável por
   `close_time - created_time`. **Falso nesta conta**: não existe `close_time`.
4. A especificação assume associations disponíveis. **Não estão.**
5. `OMIE_CONTRACTS` aparece como opção viável de MRR. **Não é hoje**: não há
   ingestão de contratos.
6. O `total_deals` do read model anterior e o `won_deals` do novo divergem
   (37 contra 48) porque usam coortes diferentes: o anterior não filtra por data
   de fechamento no período. A versão `v2` declara a coorte explicitamente.

---

## 10. Estado Git

- Branch: `codex/react-router-v8-migration-20260804`.
- HEAD ao final: `b23a4e2`.
- Árvore de trabalho limpa.
- **Commit deste lote: não realizado por este agente.** Os arquivos foram
  absorvidos pelos commits do Codex descritos na seção 7.
- Sem push, merge, rebase, reset, cherry-pick ou clean.
- Sem migration remota, sem alteração de secret, sem reset de banco.

---

## 11. Lote complementar — associations e histórico de estágio

Executado no mesmo dia, após as duas perguntas: existe outro campo com a data de
encerramento, e dá para resolver as associations.

### 11.1 Resposta 1 — não existe campo alternativo utilizável

`hs_lastmodifieddate` está preenchido em 100% dos 31.530 tickets encerrados, mas
**não serve** como data de encerramento. Evidência medida:

| Data de última modificação | Tickets |
| --- | --- |
| 2026-07-17 | 9.868 |
| 2026-07-16 | 5.629 |
| 2026-07-18 | 3.391 |
| 2026-07-09 | 1.750 |
| demais 61 dias | 10.892 |

19.888 dos 31.530 se concentram em três dias de julho de 2026. Isso é rastro de
operação em massa, não de encerramento. A mediana entre criação e última
modificação é de **912,7 dias**. Usar esse campo produziria números falsos.

A fonte correta é o **histórico da propriedade de estágio**, que o HubSpot mantém
e devolve por `propertiesWithHistory`. Dele saem a data real de resolução, o
tempo de resolução, o tempo em etapa e a taxa de reabertura — **inclusive
retroativamente**, o que recupera todo o passado, e não só daqui para frente.

### 11.2 Resposta 2 — associations são resolvíveis

Não é limitação da conta: é ausência de ingestão. A leitura em lote de
associations existe na v4 e usa os escopos que a sincronização já possui. Foram
implementados o destino canônico, a gravação idempotente e o adapter.

### 11.3 O que foi construído

| Arquivo | Papel |
| --- | --- |
| `supabase/migrations/20260807140000_analytics_hubspot_relations_and_history_v1.sql` | tabelas canônicas, views derivadas e gravação de serviço |
| `supabase/migrations/20260807150000_analytics_kpi_read_models_v2.sql` | Suporte e CS religados às fontes novas |
| `supabase/functions/hubspot-associations-sync/index.ts` | ingestão de Ticket→Company e Deal→Company |
| `supabase/functions/hubspot-stage-history-sync/index.ts` | reconstrução do histórico de estágio |
| `supabase/functions/_shared/hubspot.ts` | `fetchAssociationsBatch` e `fetchStageHistoryBatch` |
| `scripts/analytics/hubspot-coverage-discovery.mjs` | sondagem somente leitura da cobertura real |
| `supabase/tests/104_analytics_hubspot_relations_and_history.sql` | 22 asserções, com golden fixture de reabertura |
| `tests/scripts/analytics-hubspot-relations-adapter.test.mjs` | 11 asserções de contrato do adapter |

Objetos de banco novos: `analytics_hubspot_associations`,
`analytics_hubspot_stage_events`, `analytics_hubspot_history_sync_state`,
`vw_analytics_ticket_resolution`, `vw_analytics_ticket_company`,
`rpc_analytics_relations_coverage`, `rpc_service_upsert_hubspot_associations` e
`rpc_service_upsert_hubspot_stage_events`.

### 11.4 Decisão de arquitetura: estado por cobertura medida

O estado de cada KPI passou a ser **função da cobertura real da ingestão, medida
em tempo de consulta**. Enquanto nada foi ingerido, o indicador continua
indisponível exatamente como hoje. Conforme a ingestão avança, ele vira parcial e
depois disponível — sem nenhuma edição de código e sem nunca apresentar número
incompleto como se fosse definitivo.

KPIs que mudam de estado sozinhos com a ingestão:

- tickets resolvidos, tempo de resolução (mediana, média e P90) e reabertura;
- clientes com atendimento aberto e recorrência com atendimento crítico.

KPIs que **continuam bloqueados**, porque a fonte não existe:

- tempo de primeira resposta — a propriedade não é ingerida;
- clientes sem interação recente — não há data de última interação;
- SLA de primeira resposta — cobertura de 4,1% na conta.

### 11.5 Garantias de segurança e reversibilidade

- Nenhuma escrita no HubSpot. Só `GET` e leitura em lote; um teste falha se
  aparecer endpoint de criação, atualização ou arquivamento.
- Idempotência por chave composta: reprocessar a mesma página não duplica.
- Retomada por marca d'água no banco, com orçamento de tempo por execução, para
  não estourar o limite da função nem reprocessar 34 mil objetos.
- Gravações restritas a `service_role`; leitura restrita por RLS.
- O script de discovery nunca imprime, grava ou loga a credencial; erros são
  sanitizados para categoria e status.

### 11.6 Validação do lote complementar

| Comando | Resultado |
| --- | --- |
| `node --test` nos dois arquivos de contrato | **26 de 26 aprovados** |
| `npm run web:build` (Windows) | **aprovado**, 933 módulos |
| `npm run lint` (Windows) | **0 erros**, 179 avisos legados |
| `npm run local:qa:secret-scan` | **aprovado**, 0 correspondências |

Ainda não validado: `supabase test db` com os pgTAP `102`, `103` e `104`;
migrations não aplicadas em nenhum ambiente; sondagem contra a API real do
HubSpot pendente de credencial disponibilizada localmente.

### 11.7 Ordem recomendada de execução

1. Aplicar as quatro migrations em ambiente local e rodar os pgTAP.
2. Rodar o script de discovery para medir a cobertura real antes de ingerir.
3. `hubspot-associations-sync` para tickets e depois para negócios — é o de maior
   retorno e o mais barato: 344 chamadas para tickets, 22 para negócios.
4. `hubspot-stage-history-sync` para negócios (43 chamadas) e, se a sondagem
   confirmar histórico preenchido, para tickets (688 chamadas).
5. Agendar a captura diária de snapshot.

---

## 12. Sondagem da API real — correção de causa raiz

Executada com credencial disponibilizada localmente pela operação. Somente
leitura. Relatório bruto: `docs/reports/hubspot-coverage-discovery.json`.

### 12.1 A causa raiz era nossa, não da conta

O diagnóstico da seção 1.3 estava **errado na atribuição**. A conta não deixa de
preencher a data de encerramento do ticket. O que acontece é outra coisa:

**A propriedade `closedate` não existe para tickets neste portal.** Das 1.147
propriedades de ticket, nenhuma tem esse nome. O ingester pedia uma propriedade
inexistente; o HubSpot ignora esse caso em silêncio, sem erro, sem aviso e sem
campo na resposta. Por isso a coluna ficava nula em 100% dos casos e o defeito
sobreviveu a todas as sincronizações anteriores.

Este é exatamente o risco que a especificação alertava: *não inferir o nome
interno de uma propriedade*. A lista de propriedades foi escrita a partir da
documentação genérica do HubSpot, não do schema real da conta.

### 12.2 O que a conta realmente tem

Medido em 100 tickets encerrados dos seis pipelines que o Dashboard publica,
de um universo de 31.531:

| Propriedade real | Cobertura |
| --- | --- |
| `closed_date` | 100% |
| `hs_last_closed_date` | 100% (idêntico a `closed_date`) |
| `time_to_close` | 100% |
| `hs_lastactivitydate` | 100% |
| `hs_time_to_first_response_in_operating_hours` | 77% |
| `time_to_first_agent_reply` | 8% |

Em empresas marcadas como cliente ativo: `notes_last_contacted` e
`hs_notes_last_activity` a 100%.

Unidades verificadas em amostra real: `time_to_close` e
`hs_time_to_first_response_in_operating_hours` vêm em **milissegundos**, apesar
do nome da segunda sugerir horas. `closed_date - createdate` confere exatamente
com `time_to_close`, o que valida as duas fontes uma contra a outra.

### 12.3 Associations

| Relação | Cobertura |
| --- | --- |
| Deal → Company | 99% |
| Ticket → Company, tickets recentes | 58% |
| Ticket → Company, base completa | 6% |

O vínculo de atendimento com empresa é recente na operação: alto nos tickets
novos, quase inexistente no histórico antigo. O KPI dependente será publicado
como parcial, com a cobertura real declarada.

### 12.4 Consequência: o plano ficou muito mais barato

A reconstrução por histórico de propriedade deixou de ser necessária para o
principal. Basta ingerir os campos certos.

| KPI | Antes | Depois |
| --- | --- | --- |
| Tickets resolvidos | BLOCKED | AVAILABLE após ressincronização |
| Tempo de resolução | BLOCKED | AVAILABLE, mediana, média e P90 |
| Tempo de primeira resposta | BLOCKED | DERIVABLE a 77% |
| Clientes sem interação recente | BLOCKED | DERIVABLE a 100% |
| Receita sem interação recente | não existia | DERIVABLE |
| Reabertura | HISTORY_REQUIRED | HISTORY_REQUIRED, inalterado |

O histórico de estágio continua implementado e ingerido, mas mudou de papel:
deixa de ser pré-requisito e passa a ser reforço para tickets sem data nativa e
fonte única de reabertura e tempo por etapa.

### 12.5 O que foi corrigido

| Arquivo | Mudança |
| --- | --- |
| `supabase/functions/_shared/hubspot-cs-runner.ts` | `closedate` → `closed_date`; três propriedades novas; `toMilliseconds` |
| `supabase/functions/hubspot-orchestrator-worker/index.ts` | empresa passa a carregar `notes_last_contacted` |
| `supabase/migrations/20260807160000_analytics_hubspot_native_dates_v1.sql` | colunas novas, precedência de fonte, promoção do staging |
| `supabase/migrations/20260807170000_analytics_kpi_read_models_v3.sql` | Suporte e CS sobre as fontes nativas |
| `scripts/analytics/hubspot-coverage-discovery.mjs` | sondagem dirigida aos pipelines publicados |
| `supabase/tests/105_analytics_hubspot_native_dates.sql` | 18 asserções de precedência, unidade e cobertura |
| `tests/scripts/analytics-hubspot-native-dates.test.mjs` | 12 asserções de contrato |

Regra de precedência implementada e testada: a **propriedade nativa vence**, o
histórico entra apenas quando ela falta, e `resolution_source` registra qual das
duas foi usada em cada ticket.

### 12.6 Validação

| Comando | Resultado |
| --- | --- |
| `node --test` nos três arquivos de contrato | **38 de 38 aprovados** |
| `npm run web:build` (Windows) | **aprovado**, 933 módulos |
| `npm run lint` (Windows) | **0 erros**, 179 avisos legados |
| `npm run local:qa:secret-scan` | **aprovado**, 0 correspondências |

Não validado: pgTAP `102` a `105` escritos e não executados; nenhuma migration
aplicada; nenhuma função publicada.

### 12.7 Ordem de execução recomendada

1. Aplicar as seis migrations em ambiente local e rodar os pgTAP.
2. Publicar `hubspot-orchestrator-worker` com a correção de propriedades.
3. Ressincronizar HubSpot. **Só isto já desbloqueia** tickets resolvidos, tempo
   de resolução, tempo de primeira resposta e clientes sem interação recente.
4. Publicar e rodar `hubspot-associations-sync` para negócios (99%) e tickets
   (58%): 22 e 344 chamadas.
5. Agendar a captura diária de snapshot.
6. Histórico de estágio por último, e apenas se reabertura e tempo por etapa
   forem prioridade — é a carga mais cara e a de menor retorno agora.

### 12.8 Higiene pendente

A credencial foi colocada em `apps/web/.env.local` para esta sondagem. O arquivo
está no `.gitignore` e o secret scan confirmou 0 correspondências em 2.062
arquivos rastreados, mas **a linha deve ser removida** agora que a sondagem
terminou.

---

## 13. Validação em banco local e correção de privilégio

As seis migrations do lote foram aplicadas no Supabase local com
`supabase migration up --local`, sem reset e sem perda de dado. Os pgTAP
revelaram três problemas reais, todos corrigidos.

### 13.1 Privilégio excessivo nas tabelas novas — corrigido

O teste `102`, asserção 7, reprovou: `authenticated` tinha DELETE, INSERT,
UPDATE, TRUNCATE, REFERENCES e TRIGGER em `analytics_kpi_settings`.

Causa: o Supabase concede privilégios padrão a `authenticated` em toda tabela
nova do schema `public`. As migrations deste lote revogavam apenas de `public` e
`anon`. A RLS já barrava a escrita, porque nenhuma policy de INSERT, UPDATE ou
DELETE foi criada — mas privilégio concedido e não usado é risco latente: uma
policy permissiva adicionada no futuro abriria o caminho sem revisão.

A convenção do projeto, verificada em `hubspot_tickets`,
`analytics_finance_receivables` e `analytics_source_config`, é não conceder nada
diretamente a `authenticated`; a leitura passa pelas RPCs `security definer`.

Corrigido em `20260807180000_analytics_kpi_least_privilege_v1.sql`, que alinha as
cinco tabelas e as quatro views novas a essa convenção.

**Este é o tipo de defeito que só um teste de contrato encontra.** Nenhuma
revisão de código o pegaria, porque a concessão não está escrita em lugar nenhum
— ela vem do comportamento padrão da plataforma.

### 13.2 `create or replace view` não aceita reordenar coluna

A migration `160000` falhou ao tentar inserir colunas no meio da projeção de
views já existentes. Corrigido derrubando as três views na ordem inversa da
dependência antes de recriá-las. Nenhuma tabela foi tocada: view não guarda dado,
e as RPCs resolvem o nome em tempo de execução.

### 13.3 Fixture incompleta

A fixture do teste `102` omitia `status_original` e `aging_bucket`, ambos
obrigatórios e o segundo validado por check. Corrigida com valores reais do
domínio.

Também foram corrigidas as contagens de `plan()` dos quatro arquivos, que
estavam abaixo do número real de asserções.

### 13.4 Resultado final da validação

Todas as sete migrations aplicadas em ambiente local com
`supabase migration up --local`, sem reset e sem perda de dado.

| Verificação | Resultado |
| --- | --- |
| pgTAP `102_analytics_kpi_foundation` | **ok**, 25 asserções |
| pgTAP `103_analytics_kpi_read_models` | **ok**, 28 asserções |
| pgTAP `104_analytics_hubspot_relations_and_history` | **ok**, 24 asserções |
| pgTAP `105_analytics_hubspot_native_dates` | **ok**, 22 asserções |
| `node --test` nos três arquivos de contrato | **38 de 38 aprovados** |
| `npm run web:build` | **aprovado**, 933 módulos |
| `npm run lint` | **0 erros**, 179 avisos legados |
| `npm run contracts:typecheck` | **aprovado** |
| `npm run local:qa:secret-scan` | **aprovado**, 2.062 arquivos, 0 correspondências |
| `git diff --check` | **aprovado** |

Total: **99 asserções de banco e 38 de contrato**, todas aprovadas.

### 13.5 Falhas remanescentes na suíte: pré-existentes, não deste lote

A suíte completa fecha com `FAIL` por quatro testes que já falhavam antes:

| Teste | Natureza |
| --- | --- |
| `004_phase1_2_function_audit`, asserção 4 | anterior a este lote |
| `052_analytics_hubspot_pipe_alignment`, asserção 1 | **drift do banco local** |
| `077_knowledge_taxonomy`, asserções 4 e 5 | configuração de taxonomia ausente no local |
| `082_release_external_surface_hardening`, asserção 18 | agendamento ativo no local |

O caso `052` merece registro porque é analítico e poderia ser confundido com
regressão deste lote. Ele exige exatamente seis pipelines de CS ativos em
`analytics_source_config`. O banco local tem **25**; o remoto tem **6**, que é o
esperado. Nenhuma migration deste lote escreve nessa tabela — verificado por
varredura: só há leitura em `join`. É drift acumulado do ambiente local, provável
efeito da reconciliação de catálogo executada por sincronizações anteriores.

### 13.6 Acoplamento verificado

As quatro views novas não são lidas diretamente pelo frontend: só as RPCs
`security definer` as consomem. Verificado por varredura em
`apps/web/src`. Por isso a revogação de privilégio da seção 13.1 não altera
nenhuma superfície existente. As views que o frontend lê direto continuam sendo
as pré-existentes, nenhuma delas tocada por este lote.

---

## 14. Publicação em produção e defeitos encontrados na execução real

Ciclo autorizado pela operação para aplicar no remoto. Foram publicadas 12
migrations e 5 Edge Functions. A carga completa expôs **quatro defeitos latentes**
que nenhuma execução incremental jamais teria revelado.

### 14.1 Ordem executada e por que ela é obrigatória

Migrations antes das funções, sempre. O worker corrigido grava `last_activity_at`
e `first_response_ms`; publicá-lo antes das migrations faria a sincronização
falhar contra colunas inexistentes.

### 14.2 Defeito 1 — orçamento de retentativa media progresso, não falha

**Impacto: crítico.** `attempts` incrementa a cada reivindicação do item de
trabalho, ou seja **uma vez por página processada**. A decisão de retentativa era
`attempts < 5`. Consequência: a partir da sexta página de qualquer partição,
nenhum erro transitório podia mais ser repetido.

Numa carga completa de 470 páginas, um único tempo limite de 20s do HubSpot
reprovava o item, e a promoção descarta todo o trabalho quando um item falha.
Observado na prática: item da partição `5034314`, página 84, `attempts` 85,
erro `timeout` — 46 mil registros perdidos por um soluço de rede.

**Correção:** o orçamento passa a medir falhas, não progresso.
`page_number` só avança em página concluída, então `attempts - page_number` é o
número de falhas acumuladas. Arquivo:
`supabase/functions/hubspot-orchestrator-worker/index.ts`.

### 14.3 Defeito 2 — falha ao promover desfazia a paginação concluída

**Impacto: alto.** O worker chamava a promoção dentro do mesmo `try` da
paginação. Se a promoção falhasse, o `catch` reescrevia o checkpoint com
`completed = false`, devolvendo à fila um item que já havia terminado. Com a
promoção falhando por tempo, a carga entrava em laço infinito: chegava a 34/34,
a promoção estourava, um item voltava para retentativa, e recomeçava.

**Correção:** paginação concluída e promoção concluída são responsabilidades
distintas. A promoção passa a ter tratamento próprio; falhar nela não invalida a
página, e a promoção é retentada pelo dispatch seguinte.

### 14.4 Defeito 3 — promoção do HubSpot sem endurecimento de tempo

**Impacto: alto.** A promoção do OMIE recebeu proteção de tempo limite em
`20260806150000`. A do HubSpot ficou de fora e nunca foi exercitada, porque a
janela incremental publica poucas dezenas de linhas.

**Correção:** `statement_timeout` explícito de 240s e trava consultiva por
transação, espelhando o que o OMIE já tinha. Migration
`20260807220000_hubspot_promotion_timeout_hardening_v1.sql`.

**Medição que mudou o diagnóstico:** executada pelo banco, a promoção de 47.159
registros levou **19,7 segundos**. A promoção nunca foi lenta. O que a matava era
o teto de tempo da própria Edge Function, somado ao defeito 1. Sem a medição, a
conclusão natural — e errada — teria sido reescrever a promoção em lotes.

### 14.5 Defeito 4 — ingestão de vínculos não persistia a marca d'água

**Impacto: médio.** A função aceitava cursor no corpo mas não o gravava. Cada
invocação recomeçava do primeiro registro e a cobertura nunca passaria da
primeira fatia. A ingestão de histórico já fazia certo; a de vínculos, não.

**Correção:** marca d'água no banco, avançada na mesma transação da gravação.
Migration `20260807200000_analytics_associations_resumable_v1.sql`.

### 14.6 Duas lacunas menores corrigidas no caminho

- `analytics-sequential-sync` era a única função da cadeia de orquestração sem
  declaração em `config.toml`, e por isso herdava verificação de JWT do gateway.
  Isso a tornava inalcançável por disparo server-side. A proteção real —
  `authorizeCsRunner` — é idêntica à das demais e continua intacta.
- Um ciclo cuja execução do HubSpot terminou em falha **após** o orquestrador já
  ter retornado ficava preso em `running` e bloqueava todos os ciclos seguintes.
  Resolvido por `rpc_admin_reconcile_analytics_sync_runs`, que já existia.

### 14.7 Resultado medido em produção

| Métrica | Antes | Depois |
| --- | --- | --- |
| Tickets com data de encerramento | 0 | **31.532** |
| Tickets com tempo de primeira resposta | 0 | 1.076 |
| Tickets com última atividade | 0 | 28.838 |
| Empresas com última interação | 0 | 5.525 |
| Vínculos ticket↔empresa | 0 | 8.240 e convergindo |
| Vínculos negócio↔empresa | 0 | 893 e convergindo |

KPIs de suporte que saíram de indisponível para número real, no ano corrente:

| KPI | Valor |
| --- | --- |
| Atendimentos resolvidos | 2.392 |
| Tempo de resolução mediano | 0,1 dia |
| Tempo de resolução médio | 4,3 dias |
| Tempo de resolução P90 | 8,9 dias |
| Primeira resposta mediana | 0,06 h (parcial, 3% de cobertura) |

Customer Success ganhou dois indicadores novos com fonte real: **273 clientes sem
interação recente**, somando **R$ 149.388,11** de recorrência exposta.

### 14.8 Fundação histórica ativada

Três agendas em `pg_cron`, todas ativas:

| Agenda | Horário UTC | Papel |
| --- | --- | --- |
| `analytics-kpi-daily-snapshot` | 06:10 | série histórica de MRR, carteira, backlog e aging |
| `analytics-associations-daily` | 06:30 | convergência dos vínculos de atendimento |
| `analytics-associations-deals-daily` | 06:40 | convergência dos vínculos de negócio |

A primeira captura foi executada e a série **começa em 2026-08-07**. O snapshot
grava a recorrência **por cliente**, não apenas o total — é esse grão que permite
reconstruir novo MRR, expansão, contração e churn comparando dois dias quaisquer.

Primeira captura: 320 clientes ativos, R$ 335.849,10 de recorrência em 205
clientes, 2.853 atendimentos em aberto, R$ 931.494,53 de recebíveis em 6 faixas
de aging e R$ 3.096.643,00 de pipeline comercial aberto.

### 14.9 Validação final

| Verificação | Resultado |
| --- | --- |
| pgTAP `102` a `105` | **ok**, 100 asserções |
| `node --test` | **38 de 38** |
| `npm run web:build` | **aprovado** |
| `npm run lint` | **0 erros** |
| `npm run local:qa:secret-scan` | **aprovado**, 0 correspondências |

### 14.10 Pendências reais

1. **Cobertura de vínculos ainda parcial** — 8.240 de 34.385 atendimentos. As
   agendas fazem convergir sem intervenção. Até lá, `customers_with_open_tickets`
   e `mrr_with_critical_ticket` seguem marcados como parciais, com a cobertura
   declarada.
2. **Histórico de estágio não foi ingerido.** Reabertura e tempo por etapa
   continuam aguardando. É a carga mais cara e a de menor retorno; ficou por
   último de propósito.
3. **Comercial, Suporte e Resumo ainda usam as RPCs anteriores no frontend.**
   Só Customer Success foi recomposto. Os read models `v2` estão publicados e
   testados, prontos para as três telas restantes.
4. **Divergência de MRR não reconciliada** — R$ 335.849,10 no HubSpot contra
   R$ 461.032,48 na planilha histórica de CS.
5. **Nenhum push realizado.** O remoto canônico entre `origin` e `genius-os`
   continua sem definição da operação.

---

## 15. Interfaces: as quatro áreas passam a mostrar os indicadores

Até aqui os read models estavam publicados e testados, mas só Customer Success
os exibia. Comercial, Suporte e Resumo continuavam nas RPCs anteriores, e por
isso o que foi construído não aparecia para quem usa o produto.

### 15.1 Componente compartilhado, tradução única

`AnalyticsKpiGrid.tsx` renderiza qualquer payload de KPI a partir de uma lista de
descritores. A tradução de código técnico para linguagem gerencial continua
acontecendo **uma única vez**, no contrato de apresentação, e as quatro áreas
herdam o mesmo comportamento: ausência de fonte nunca vira zero, cobertura
parcial é sinalizada no tom do cartão, e a coorte de data de cada indicador é
sempre declarada.

`AnalyticsKpiLimitations` exibe, em linguagem de negócio, o que limita a leitura
corrente — e some quando não há limitação, para não virar ruído.

### 15.2 O que cada tela ganhou

**Comercial:** pipeline aberto e ponderado, negócios criados, receita ganha,
taxa de ganho por coorte de fechamento, ticket mediano e médio, ciclo de vendas.
A versão anterior misturava três coortes sob o mesmo filtro sem avisar.

**Suporte:** atendimentos recebidos e resolvidos, fila em aberto, idade mediana
da fila, tempo de resolução mediano e no pior caso, primeira resposta e taxa de
reabertura. Cinco desses não existiam antes desta correção.

**Resumo:** dez indicadores consolidando as quatro áreas. **Reusa os read models
de cada área em vez de recalcular** — é o que impede a falha clássica de uma
métrica aparecer com valores diferentes entre a visão geral e a tela de origem.

### 15.3 Teste que protege a fronteira

`tests/scripts/analytics-kpi-surfaces.test.mjs` falha se qualquer tela:

- deixar de consumir o read model da sua área;
- navegar o payload cru ou comparar código de estado diretamente;
- conter nome de propriedade, endpoint ou termo de infraestrutura;
- declarar um indicador com rótulo de aparência técnica.

O teste encontrou uma violação minha na primeira execução: um comentário no
código citava o nome da propriedade corrigida. Reescrito.

### 15.4 Validação

| Verificação | Resultado |
| --- | --- |
| `node --test` nos quatro arquivos | **43 de 43** |
| `npm run web:build` | **aprovado** |
| `npm run lint` | **0 erros** |
| `npm run local:qa:secret-scan` | **aprovado**, 2.081 arquivos |

---

## 16. Os dois repositórios remotos: investigação e resolução proposta

### 16.1 O que são

Investigado por comparação direta após `git fetch --all`:

| Medida | `origin` (Central-Confi) | `genius-os` (Genius-OS) |
| --- | --- | --- |
| Branches | 31 | 31 |
| `main` | `2873bc5`, 599 commits | `2873bc5`, 599 commits |
| Divergência entre as duas `main` | — | **0 à frente, 0 atrás** |
| Branches `codex/*` divergentes | — | **0** |

**São espelhos byte a byte.** Não existe "qual é o certo": existe duplicidade
acidental. Alguém criou um repositório com o nome novo do produto e espelhou o
conteúdo inteiro, mantendo o antigo como `origin`.

O risco real nunca foi perder trabalho — era publicar em um e esquecer o outro,
criando divergência com o tempo. Foi o que quase aconteceu: a branch de trabalho
estava com 820 commits no espelho e 837 no local.

### 16.2 Nenhuma configuração depende do nome

Verificado: `vercel.json` não referencia repositório, o workflow do GitHub roda
em qualquer um, e nenhum documento fixa a origem. A conexão do Vercel é externa
ao código.

### 16.3 Resolução proposta: eliminar a escolha

Em vez de eleger um canônico e arriscar quebrar a conexão de deploy que ninguém
sabe onde está apontada, a solução é **um único remoto que publica nos dois**.
O Git suporta múltiplas URLs de push por remoto:

```
git remote set-url origin https://github.com/edebueno-confi/Genius-OS.git
git remote set-url --add --push origin https://github.com/edebueno-confi/Genius-OS.git
git remote set-url --add --push origin https://github.com/edebueno-confi/Central-Confi.git
git remote remove genius-os
```

Depois disso, `git push` sozinho publica nos dois, sempre. A ambiguidade deixa de
existir porque não há mais nada a decidir, e os espelhos não podem divergir.

O nome de leitura passa a ser o do produto; o legado continua recebendo tudo,
sem perda de histórico e sem quebrar integração externa.

**Executado em 2026-08-07.** A reconfiguração foi bloqueada pela política de
permissões do ambiente e rodada manualmente pela operação. Resultado verificado:

```
origin  https://github.com/edebueno-confi/Genius-OS.git (fetch)
origin  https://github.com/edebueno-confi/Genius-OS.git (push)
origin  https://github.com/edebueno-confi/Central-Confi.git (push)
```

O push seguinte publicou 20 commits **nos dois repositórios em um único comando**.
Verificação por `git ls-remote`: local, Genius-OS e Central-Confi apontam para o
mesmo commit `6914a7f`. A ambiguidade deixou de existir.

### 16.4 Recomendação complementar

Depois que o espelhamento estiver ativo e comprovado por alguns ciclos, arquivar
`Central-Confi` no GitHub. Arquivo, não exclusão: o histórico permanece legível e
o repositório para de aceitar escrita, o que remove a duplicidade de vez sem
perder nada.

---

## 17. Auditoria de duplicidade, vocabulário e responsividade

Levantada pela operação depois da seção 15. O defeito é meu: acrescentei os
indicadores novos **ao lado** dos antigos em vez de substituí-los.

### 17.1 O que a auditoria encontrou

**Comercial — 14 cartões, com duas colisões críticas:**

| Duplicidade | Por que é grave |
| --- | --- |
| "Receita ganha" aparecia **duas vezes com números diferentes** | Coortes de data distintas sob o mesmo nome. Num painel de decisão isso é pior que um número ausente: destrói a confiança em todos os outros. |
| "Ticket médio" aparecia duas vezes | Idem |
| "Conversão" ≡ "Taxa de ganho" | Mesma métrica, dois nomes |
| "Em aberto" (contagem) vs "Pipeline aberto" (valor) | Nomes sugerem o mesmo conceito |
| "Negócios totais" vs "Negócios criados" | Ambíguo: totais de quê, em que recorte |

**Suporte:** vocabulário misturado na mesma tela — "Tickets totais" e
"Atendimentos recebidos", "Abertos" e "Fila em aberto", "Encerrados" e
"Atendimentos resolvidos", estes dois últimos com coortes diferentes.

**Customer Success:** 11 cartões numa lista plana, sem hierarquia.

**Responsividade:** grade em duas colunas já no celular, com valores monetários
truncados em 390px; e **nove tabelas com largura mínima de 420 a 720px**,
forçando rolagem horizontal. Rolar na horizontal é o pior padrão possível num
painel, porque o rótulo sai da tela junto com o valor.

### 17.2 Decisões de vocabulário registradas

Tomadas pela operação: a unidade comercial é **negócio**; a unidade de suporte é
**atendimento**. Sinônimos ficam proibidos na interface. Os indicadores antigos
foram **substituídos**, não mantidos em paralelo.

### 17.3 Glossário canônico

`analytics-vocabulary.mjs` passa a ser a única fonte de nome de indicador. A
regra é **um conceito, um nome, uma definição, um lugar**. A tela escolhe *quais*
indicadores mostrar; nunca *como chamá-los*.

Uma chave sem rótulo canônico não cai na chave interna: devolve
"Indicador sem nome definido", porque expor nome interno ao usuário é pior que
admitir uma lacuna de contrato.

### 17.4 Hierarquia

`AnalyticsKpiGrid` passou a separar **indicadores de decisão** — no máximo
quatro, maiores e primeiro — de **indicadores de apoio**, menores e depois. Uma
grade plana de doze cartões não é um painel, é uma lista. O limite de quatro é
verificado por teste.

### 17.5 Responsividade

- Uma coluna abaixo de 640px na grade de indicadores.
- As nove tabelas ganharam `gso-analytics-responsive-table`: abaixo de 640px
  cada linha vira um cartão empilhado e **o cabeçalho de coluna passa a prefixar
  a célula** via `data-label`, então nenhum valor aparece sem o nome do que
  representa. 38 células rotuladas.
- A primeira célula vira título do cartão, separando identificação de medida.

### 17.6 Testes que impedem a reincidência

`analytics-vocabulary.test.mjs` falha se:

- dois indicadores compartilharem o mesmo rótulo;
- alguma tela usar termo fora do glossário — pegou **sete resíduos**, incluindo
  dois cartões no Resumo e uma frase que expunha vocabulário interno ao usuário;
- alguma tela declarar o mesmo indicador duas vezes;
- algum bloco primário passar de quatro indicadores.

`analytics-kpi-surfaces.test.mjs` passou a exigir que **nenhuma tela declare
rótulo próprio** — foi exatamente isso que permitiu a duplicidade original.

### 17.7 Validação

| Verificação | Resultado |
| --- | --- |
| `node --test`, cinco arquivos | **48 de 48** |
| `npm run web:build` | **aprovado** |
| `npm run lint` | **0 erros** |
| `npm run local:qa:secret-scan` | **aprovado**, 2.083 arquivos |

### 17.8 O que fica pendente de QA visual

As mudanças de layout foram validadas por build e teste de contrato, **não por
inspeção visual em navegador**. Falta abrir as cinco abas em 1920×1080, 1366×768
e 390×844, nos dois temas, e registrar evidência por rota. É o próximo passo
natural e exige a instância local em pé.

---

## 18. Painel de leitura: o visual deixa de ser grade de cartões

### 18.1 O design system já proibia o que eu tinha feito

`docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md`, seção 2, lista o que o produto
**não é**, e "coleção de cards administrativos" está na lista. A mesma seção
manda cada tela comunicar a tarefa pelo layout, não por texto explicativo.

A grade de caixas com borda falhava nos dois pontos: tratava um número de decisão
e um de apoio como iguais, e não dizia nada sobre o recorte de cada um.

### 18.2 Duas ideias, ambas vindas de defeitos reais

**A coorte organiza o espaço.** As faixas passam a se chamar "Agora", "No
período" e "Atenção" — não "Comercial" ou "Suporte". Misturar posição de hoje com
movimento do período foi exatamente o que produziu dois valores para "Receita
ganha". Agora ler o número errado exige atravessar uma divisória com título.

**A confiabilidade vive dentro do número.** Não é selo colado ao lado:

| Estado | Tratamento |
| --- | --- |
| Disponível | algarismo em peso pleno, sem cromo |
| Parcial | sublinhado pontilhado sob o próprio número, mais o medidor de cobertura na faixa |
| Indisponível | o lugar do valor recebe a frase do estado, jamais um zero |
| Alerta | régua vermelha à esquerda e valor em tom de perigo |

O medidor de cobertura **some quando a cobertura é total** — informação que não
muda decisão não merece pixel.

### 18.3 Escolhas de composição

- Sem borda em volta de cada indicador. Separação por espaço e régua fina, o que
  deixa o número respirar em Full HD, a viewport canônica do projeto.
- Tipografia como hierarquia: 1,9rem no número, 2,15rem acima de 1600px,
  1,6rem no celular. O rótulo vem **abaixo** do valor, invertendo o padrão de
  cartão — quem varre a tela lê primeiro a grandeza, depois o nome.
- Régua de 2px à esquerda como único cromo, e ela só aparece quando há algo a
  dizer.
- No celular cada indicador vira linha com divisória, não cartão empilhado.

### 18.4 Ordem dos blocos padronizada

A auditoria encontrou quatro divergências entre as abas. A pior: na Visão Geral
**o filtro de recorte aparecia depois dos indicadores** — apontada pela operação
e introduzida por mim na seção 15. Ler um número antes de saber qual recorte ele
cobre é o caminho mais curto para uma decisão errada.

Ordem agora idêntica em todas: cabeçalho → filtro → estado vazio → painel →
limitações → gráficos e tabelas.

Carteira permanece sem filtro de período **de propósito**: todos os seus
indicadores são posição atual, e um seletor de datas ali sugeriria um recorte que
não existe. A justificativa está escrita na própria tela, não só no código.

### 18.5 Financeiro

Passou pelo glossário: "status OMIE", "código de categoria do OMIE",
"CNPJ (somente dígitos)" e "A fonte respondeu" saíram. O nome do sistema de
origem permanece, porque responde de onde vem o número — que é justamente o que
a operação pediu para manter.

A grade também deixou de ser duas colunas no celular.

### 18.6 Testes que protegem o layout

`analytics-layout-structure.test.mjs` falha se:

- o filtro aparecer depois dos indicadores em qualquer aba;
- a faixa de limitações vier antes do que ela explica;
- alguma aba deixar de usar o invólucro padrão de área;
- Carteira ganhar filtro sem justificativa escrita na tela.

### 18.7 Validação

| Verificação | Resultado |
| --- | --- |
| `node --test`, seis arquivos | **53 de 53** |
| `npm run web:build` | **aprovado** |
| `npm run lint` | **0 erros** |
| `npm run local:qa:secret-scan` | **aprovado**, 2.086 arquivos |

Continua pendente a inspeção visual em navegador, agora com mais motivo: a
mudança de composição é grande e nenhum teste substitui olhar.

---

## 19. Por que o ambiente local mostra tudo indisponível

Levantado pela operação. **Não é defeito do código.**

| Medida | Banco local | Banco remoto |
| --- | --- | --- |
| Tickets com data de encerramento | **0** de 38.260 | 31.532 |
| Tickets com tempo de primeira resposta | 0 | 1.076 |
| Empresas com última interação | 0 | 5.525 |
| Vínculos ingeridos | 0 | 12.906 |
| Snapshots capturados | 0 | 8 métricas |
| Última sincronização | **2026-08-04** | 2026-08-07 |

O banco local tem dados de **três dias antes da correção**. O schema está
atualizado, porque as migrations foram aplicadas nos dois ambientes, mas as
colunas novas nunca foram preenchidas ali. O aplicativo local aponta para
`http://127.0.0.1:54321`, então é esse banco que ele lê.

A tentativa de sincronizar localmente não funcionou porque a credencial do
HubSpot foi removida de `apps/web/.env.local` ao fim da sondagem — corretamente,
por higiene. Sem ela, a função local não tem como consultar a origem.

**O painel está se comportando exatamente como projetado:** diante de campo
vazio, ele declara "Indisponível" em vez de mostrar zero. O incômodo é a prova
de que a regra funciona.

Caminhos, em ordem de custo:

1. **Apontar o aplicativo local para o banco remoto**, trocando `VITE_SUPABASE_URL`
   e a chave pública. Vê os números reais na hora, sem sincronizar nada. Risco a
   observar: os botões de sincronização passam a agir sobre produção.
2. **Sincronizar o ambiente local**, devolvendo a credencial ao arquivo de
   ambiente e repetindo a carga completa. Fiel, porém é a carga de 470 páginas.
3. **Fazer o QA visual contra o ambiente publicado**, que já tem tudo correto.
