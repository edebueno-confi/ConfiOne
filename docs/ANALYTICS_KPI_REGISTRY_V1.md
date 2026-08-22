# Registro canônico de KPIs do Analytics V1

> Status: canônico para os indicadores publicados por contratos locais reconciliados em 2026-08-21.
>
> Escopo: registro técnico-legível das métricas já publicadas ou explicitamente indisponíveis na Visão Geral, Comercial, Suporte, Customer Success, Financeiro e Produto/Desenvolvimento. Este documento não cria KPI, não altera fórmula e não autoriza exposição adicional na interface.

## Como ler este registro

Cada indicador possui quatro dimensões que não podem ser misturadas:

1. Posição atual: estado observado agora, normalmente pelo estágio, situação ou vencimento corrente. Não muda porque o usuário escolheu outro período.
2. Coorte de criação: registros cuja data de criação caiu no período.
3. Coorte de fechamento ou resolução: registros cujo encerramento ou resolução caiu no período.
4. Histórico: mudança entre estados ao longo do tempo. Só é publicado quando existe série suficiente.

Um mesmo painel pode consultar a posição atual e o período em chamadas separadas. Somar ou comparar esses grupos sem respeitar a coorte produz uma leitura incorreta.

## Fontes e precedência

As fontes de cálculo são server-side. A interface lê o payload do RPC e não recalcula regra, permissão, coorte ou fórmula.

| Domínio | Fonte publicada | Contrato de leitura | Observação |
|---|---|---|---|
| Comercial | HubSpot Deals sincronizado | rpc_analytics_commercial_kpis_by_operation, rpc_analytics_commercial_snapshot_by_operation e rpc_analytics_commercial_kpis_v2 | Pipeline ativo vem de analytics_source_config; classificação vem de hubspot_pipeline_stages.is_closed/is_won. |
| Suporte | HubSpot Tickets sincronizado | rpc_analytics_support_kpis_by_operation, rpc_analytics_cs_snapshot_by_operation e rpc_analytics_support_kpis_v2 | Estado aberto/fechado vem do estágio e do histórico nativo de resolução quando aplicável. |
| Customer Success | HubSpot Companies com ligação financeira auditável | rpc_analytics_customer_success_kpis_v2 | MRR, cliente ativo e cobertura dependem de configuração e do vínculo HubSpot ↔ OMIE. |
| Financeiro | OMIE via read model local de contas a receber | rpc_analytics_finance_snapshot e rpc_analytics_finance_source_status | Planilhas são históricas/staging; não são fallback do Dashboard publicado. |
| Visão Geral | Composição dos read models acima | rpc_analytics_executive_kpis_v2 e rpc_analytics_ceo_snapshot | A Visão Geral reutiliza os domínios e não possui fórmula paralela. |
| Produto/Desenvolvimento | Nenhuma fonte executável publicada no Analytics atual | bloco `product`/`development` de `rpc_analytics_ceo_snapshot` | O contrato retorna estado, fonte e motivo de indisponibilidade; não há KPI numérico publicado nem read model GitHub/roadmap neste lote. |

Precedência em caso de divergência: código executável, migrations/views/RPCs e testes; depois contratos e documentação corrente; por último relatórios históricos. ANALYTICS_METRIC_CATALOG_V1.md permanece como catálogo histórico de contexto e não substitui este registro corrente.

## Regras comuns

### Período e timezone

- O calendário operacional é America/Sao_Paulo.
- Timestamps de origem permanecem em UTC.
- O backend transforma a data inicial em limite inclusivo e a data final em limite exclusivo do dia seguinte no fuso operacional.
- A interface oferece semana, mês, mês passado, trimestre atual, trimestre passado, ano, ano passado e todo o período. O valor enviado é um intervalo de datas, não um intervalo arbitrário de horas.

### Estado do valor

Cada entrada de KPI tem state, value, basis e, quando necessário, reason:

| Estado | Significado operacional | Valor exibido |
|---|---|---|
| available | Fonte e cobertura suficientes para a regra publicada | número |
| partial | Existe valor, mas a cobertura é incompleta | número com aviso de dados parciais |
| unavailable | Não há fonte, denominador ou data suficiente | Indisponível |
| awaiting_history | A regra exige série histórica ainda não disponível | Aguardando histórico |

Ausência nunca deve ser convertida silenciosamente em zero. Zeros legítimos continuam possíveis quando a regra realmente calcula zero; alguns produtores usam nullif para tratar valor monetário zero sem evidência como indisponível. O estado do payload, e não uma inspeção visual isolada, é a fonte da decisão.

### Proveniência, frescor e evidência mínima

Os contratos `KpiEntry` e `KpiMeta` preservam `basis`, `state`, `reason`,
`freshness_at`, `period_from`, `period_to`, `history_days` e avisos de cobertura
quando o RPC os publica. A origem material é a tabela/read model indicada na
coluna de fonte, e não o label mostrado na interface. `freshness_at` é o maior
`synced_at` observado pelo read model do domínio; não significa que todos os
registros do período estejam completos. Quando a função não publica cobertura,
frescor ou denominador, isso é uma lacuna de evidência, não uma autorização para
inferir disponibilidade.

| Dimensão auditada | Regra documental | Evidência executável reconciliada |
| --- | --- | --- |
| Fonte e contrato | registrar RPC chamado e objeto/read model consumido | `analytics-api.ts`, `analytics-model.ts` e migrations dos RPCs |
| Data/coorte | separar `*_created_at`, `*_closed_at`, resolução e posição atual | `app_private.kpi_entry` e os campos `basis` dos RPCs |
| Período/timezone | `America/Sao_Paulo`, início inclusivo e fim exclusivo; timestamps de origem em UTC | migration `20260821100000_analytics_temporal_semantics_timezone_v1.sql` |
| Estado/nulo | `available`, `partial`, `unavailable` e `awaiting_history`; zero não substitui ausência | `analytics-kpi-contract.mjs` e `app_private.kpi_entry` |
| Frescor | declarar o `freshness_at` efetivamente publicado, sem prometer completude | metadados dos read models HubSpot/OMIE |
| Filtros/escopo | filtros server-side e autorização do RPC; operação não é regra local de UI | `analytics-api.ts` e `20260822070000_analytics_pipeline_operation_governance_v1.sql` |

## Matriz de disponibilidade auditada por domínio

| Domínio | Estado atual | Fonte/contrato | Coorte ou posição | Cobertura, frescor e limitação |
| --- | --- | --- | --- | --- |
| Visão Geral | publicado para os blocos com read model; Produto/Desenvolvimento indisponível | `rpc_analytics_executive_kpis_v2` e `rpc_analytics_ceo_snapshot` | período e posição corrente em chamadas separadas | composição reutiliza Comercial, Suporte, CS e Financeiro; frescor é o metadado máximo dos domínios; não há fórmula paralela |
| Comercial | publicado | `hubspot_deals`, `hubspot_pipeline_stages`, `analytics_source_config`; RPCs `*_commercial_*` | `hs_created_at`, `hs_closed_at` ou estágio atual | depende de pipeline ativo/classificação e cobertura de amount/probability/datas; históricos de etapa aguardam série |
| Suporte | publicado/partial por KPI | `hubspot_tickets`, `hubspot_pipeline_stages`, `analytics_ticket_resolution_history`; RPCs `*_support_*` e snapshot CS | `hs_created_at`, resolução/primeira resposta ou estado atual | SLA, resolução, reabertura e histórico expõem cobertura/estado; snapshot executivo usa a coorte criada e estado atual |
| Customer Success | publicado/partial por cobertura | `hubspot_companies`, vínculos financeiros e associações ticket→empresa; `rpc_analytics_customer_success_kpis_v2` | posição atual de empresa, títulos e tickets associados | MRR, atraso e tickets dependem de vínculo/associação válida; sem cobertura suficiente, o contrato deve permanecer partial/unavailable com reason |
| Financeiro | publicado somente por API OMIE/read model local | `analytics_finance_receivables`, `rpc_analytics_finance_snapshot`, `rpc_analytics_finance_source_status` | posição financeira e datas do título/pagamento conforme contrato | frescor vem de `analytics_finance_sync_runs`; planilha não é fallback; ausência de sync/read model é unavailable |
| Produto/Desenvolvimento | indisponível | `rpc_analytics_ceo_snapshot` retorna `status`, `source`, `reason`, sem métricas numéricas | não há coorte nem posição publicada | GitHub, roadmap, releases, deployments e PRs não têm contrato/read model executável neste lote; não inferir throughput, lead time ou estabilidade |

### Campos financeiros e semântica de pagamento

No read model financeiro, `received_amount` usa o valor recebido associado à
data de pagamento (`dDtPagamento`/campo normalizado de pagamento), enquanto
`open_receivables`, `overdue_receivables` e `overdue_rate` usam o saldo aberto,
vencimento e aging da posição (`nValAberto`, data de vencimento e bucket de
aging). O valor líquido (`nValLiquido`) e o valor pago (`nValPago`) são campos
da origem de movimentos quando disponíveis para reconciliação, mas não devem
ser tratados como uma segunda fonte publicada sem read model/contrato
correspondente. O frescor é o último sync OMIE bem-sucedido, não a data de
alteração da página. A migration `20260802020000_analytics_finance_api_only_surface_v1.sql`
explicita que o Dashboard não usa planilha como fallback.

### Produto e Desenvolvimento: indisponibilidade explícita

O `CeoSnapshot` tipa `product` e `development` como blocos com `status`,
`source` e `reason`. Esse contrato é uma declaração de estado de fonte, não um
KPI. Sem ingestão/read model oficial para PRs, reviews, releases, deployments,
projetos, incidentes ou ambientes, o estado correto é `unavailable` ou
`not_configured` com motivo explícito. Não há base local para declarar
`created_at`, `closed_at`, throughput, lead time, taxa de falha ou cobertura de
deploy. Essa lacuna é fato do contrato local; a disponibilidade futura de APIs
externas é hipótese/escopo de outro lote.

### Filtros e escopo

O filtro temporal é p_from/p_to. Conforme a tela e o domínio, também podem ser aplicados responsável, pipeline, estágio, prioridade, empresa/grupo de operação e pipelines excluídos. O recorte de operação é preferência de leitura server-side, não uma nova permissão. A autorização continua sendo aplicada por app_private.can_read_analytics() e pelos grants dos RPCs. A correspondência entre pipeline, área e operação foi validada e arquivada pela task `DATA-PIPELINE-OPERATION-GOVERNANCE-2026-08-21`; não se deve inferir operação pelo nome textual do pipeline.

## Visão Geral

Contrato: rpc_analytics_executive_kpis_v2(p_from, p_to) e composição do snapshot executivo. A tela consulta uma resposta para o período e outra para a posição atual.

| Chave publicada | Nome de negócio | Base temporal ou posição | Fórmula/definição | Unidade e nulo |
|---|---|---|---|---|
| active_customers | Clientes ativos | company_status_now | Contagem conforme active_customer_rule configurada | contagem; indisponível se a regra não estiver resolvida |
| mrr_total | MRR total | company_recurring_revenue_now | Soma do MRR elegível da base ativa | moeda BRL; parcial se parte da base não tem MRR |
| new_mrr | Novo MRR | customer_status_transition | Mudança de entrada de MRR | indisponível/aguardando histórico até existir série suficiente |
| churned_mrr | MRR perdido | customer_status_transition | Mudança de saída de MRR | indisponível/aguardando histórico até existir série suficiente |
| nrr | NRR | customer_status_transition | Retenção líquida baseada em série de estados | percentual; aguardando histórico |
| open_pipeline_amount | Pipeline em aberto | posição do estágio atual | Soma de amount_home de negócios não fechados | moeda; posição atual, não coorte do período |
| win_rate | Conversão | deal_closed_at | ganhos / negócios fechados no mesmo período | percentual de 0 a 100; nulo sem universo válido |
| won_amount | Receita ganha | deal_closed_at | Soma do valor doméstico dos ganhos fechados no período | moeda; nulo quando não há valor confiável |
| open_backlog | Atendimentos abertos | ticket_state_open_now | Contagem de tickets em estágio aberto | contagem; posição atual |
| created_tickets | Atendimentos criados no período | ticket_created_at | Contagem de tickets criados no intervalo | contagem |
| first_response_sla_coverage_percent | Cobertura de SLA de primeira resposta | ticket_sla_status | linhas com status de SLA de primeira resposta / tickets avaliados | percentual; parcial ou indisponível conforme cobertura |
| received_amount | Recebido | title_paid_at | Soma dos valores recebidos no read model financeiro | moeda; depende da fonte OMIE e do recorte financeiro |
| open_receivables | Contas a receber em aberto | title_due_date_now | Saldo de títulos em aberto | moeda; posição pelo vencimento/status corrente |
| overdue_receivables | Recebíveis vencidos | title_due_date_now | Saldo em aberto cujo aging é atrasado | moeda; posição atual |
| overdue_rate | Taxa de atraso | title_due_date_now | Percentual de atraso conforme o snapshot financeiro | percentual; respeita o contrato financeiro |
| mrr_overdue | MRR de clientes em atraso | company_recurring_revenue_now | MRR da base com saldo vencido e vínculo financeiro | moeda; parcial quando o vínculo HubSpot ↔ OMIE é incompleto |

## Comercial

Contratos principais: rpc_analytics_commercial_kpis_v2, rpc_analytics_commercial_snapshot e wrappers *_by_operation.

### KPIs publicados

| Chave | Nome de negócio | Base temporal ou posição | Fórmula/definição | Filtros e estado |
|---|---|---|---|---|
| open_pipeline_amount | Pipeline em aberto | stage_open_now | Soma de amount_home nos deals cujo estágio atual não é fechado | pipeline ativo, responsável e operação; posição atual |
| open_deals | Negócios em aberto | stage_open_now | Contagem de deals cujo estágio atual não é fechado | posição atual; não é criado no período |
| weighted_pipeline_amount | Pipeline ponderado | stage_open_now | Soma de amount_home × stage_probability onde a probabilidade existe | partial quando parte dos abertos não tem probabilidade; unavailable quando nenhum tem |
| created_deals | Negócios criados | deal_created_at | Contagem de hs_created_at dentro do período operacional | período, responsável e operação |
| created_amount | Valor criado | deal_created_at | Soma de amount_home dos deals criados no período | moeda doméstica do HubSpot |
| won_deals | Negócios ganhos | deal_closed_at | Contagem de ganhos com hs_closed_at no período | estágio fechado e data de fechamento válida |
| lost_deals | Negócios perdidos | deal_closed_at | Contagem de fechados não ganhos com hs_closed_at no período | não inclui deal reaberto como perdido |
| won_amount | Receita ganha | deal_closed_at | Soma de amount_home dos ganhos na coorte de fechamento | valor doméstico do HubSpot |
| win_rate | Conversão | deal_closed_at | ganhos / total de negócios fechados na mesma coorte | pontos percentuais de 0 a 100; nulo com denominador zero ou universo inválido |
| avg_deal_amount | Ticket médio | deal_closed_at | Média de amount_home dos ganhos da coorte | moeda; sem ganhos, indisponível |
| median_deal_amount | Ticket mediano | deal_closed_at | Mediana de amount_home dos ganhos da coorte | moeda; sem ganhos, indisponível |
| median_sales_cycle_days | Ciclo mediano | deal_closed_at | Mediana de hs_closed_at - hs_created_at dos ganhos com as duas datas | dias; só inclui datas válidas |
| avg_sales_cycle_days | Ciclo médio | deal_closed_at | Média do mesmo intervalo criação → fechamento | dias; só inclui datas válidas |
| stage_aging_days | Aging da etapa | histórico de entrada na etapa | Idade baseada na entrada na etapa | awaiting_history; não há série suficiente publicada |
| stage_conversion_rate | Conversão por etapa | histórico de transição | Conversão baseada em mudanças de etapa | awaiting_history; não inferir da contagem atual |

### Regra explícita de datas comerciais

No código, deal_created_at corresponde a hubspot_deals.hs_created_at e deal_closed_at corresponde a hubspot_deals.hs_closed_at. O nome sem o prefixo hs_ é a linguagem do contrato; não é um campo alternativo.

- Criados, quantidade e valor criados usam hs_created_at.
- Ganhos, perdas, receita ganha, conversão, ticket e ciclo usam hs_closed_at; o ciclo também precisa de hs_created_at.
- A posição aberta usa o estágio atual e independe do período selecionado.
- A tendência mensal agrupa a criação por mês operacional. O ganho mostrado nessa série acompanha o deal criado; não deve ser lido como ganho no mês de fechamento.
- Deal fechado sem hs_closed_at não é atribuído silenciosamente ao período.

## Suporte e Customer Success

### Suporte

Contrato: rpc_analytics_support_kpis_v2 e wrappers rpc_analytics_support_kpis_by_operation/rpc_analytics_cs_snapshot_by_operation.

| Chave | Nome de negócio | Base temporal ou posição | Fórmula/definição | Estado e limitação |
|---|---|---|---|---|
| created_tickets | Atendimentos criados | ticket_created_at | Contagem de tickets com hs_created_at no período | disponível conforme ingestão |
| open_backlog | Fila aberta | ticket_state_open_now | Contagem de tickets em estágio aberto na consulta | posição atual |
| median_backlog_age_days | Idade mediana da fila | ticket_created_at | Mediana de agora menos hs_created_at para tickets abertos | dias; depende da data de criação |
| resolved_tickets | Atendimentos resolvidos | ticket_resolved_at | Contagem de tickets cuja resolução do histórico caiu no período | partial/unavailable conforme cobertura do histórico |
| median_time_to_resolution_days | Tempo mediano de resolução | ticket_resolved_at | Mediana de resolution_days dos tickets resolvidos no período | dias; cobertura explícita |
| avg_time_to_resolution_days | Tempo médio de resolução | ticket_resolved_at | Média de resolution_days dos tickets resolvidos no período | dias; cobertura explícita |
| p90_time_to_resolution_days | P90 de resolução | ticket_resolved_at | Percentil 90 de resolution_days | dias; cobertura explícita |
| median_first_response_hours | Primeira resposta mediana | ticket_first_response_at | Mediana do tempo nativo de primeira resposta | horas; indisponível ou parcial quando a origem não cobre os tickets |
| avg_first_response_hours | Primeira resposta média | ticket_first_response_at | Média do tempo nativo de primeira resposta | horas; cobertura explícita |
| p90_first_response_hours | P90 de primeira resposta | ticket_first_response_at | Percentil 90 do tempo nativo de primeira resposta | horas; cobertura explícita |
| reopen_rate | Taxa de reabertura | ticket_stage_transition | Reaberturas / tickets resolvidos, usando histórico de estágio | percentual; aguardando ou parcial sem histórico suficiente |
| first_response_sla_coverage_percent | Cobertura de SLA de primeira resposta | ticket_sla_status | Tickets com status de SLA de primeira resposta / total avaliado | percentual; não é o tempo da resposta |
| close_sla_coverage_percent | Cobertura de SLA de fechamento | ticket_sla_status | Tickets com status de SLA de fechamento / total avaliado | percentual; não é a taxa de fechamento |
| historic_backlog | Fila histórica | ticket_state_open_at_date | Posição aberta em cada data capturada | awaiting_history até existir série diária suficiente |

### Snapshot de Suporte consumido pela Visão Geral

O snapshot `rpc_analytics_cs_snapshot_by_operation` também publica um bloco
de Suporte usado pela composição da Visão Geral. Diferentemente de
`open_backlog`, que representa a posição corrente do read model operacional,
essas chaves são calculadas sobre a coorte selecionada por
`hubspot_tickets.hs_created_at`. Portanto, `open_tickets` e `closed_tickets`
descrevem o estado atual dos tickets que nasceram no recorte; não são uma
coorte de fechamento baseada em `closed_at` nem uma contagem global da fila
atual.

| Chave publicada | Nome de negócio | Base temporal ou posição | Fórmula/definição | Unidade, nulo e exclusão |
|---|---|---|---|---|
| total_tickets | Atendimentos criados no recorte | ticket_created_at | Contagem de todos os tickets da coorte criada no período | contagem; sem tickets, o snapshot retorna zero |
| created_tickets | Atendimentos criados no recorte | ticket_created_at | Mesmo universo de `total_tickets` no snapshot | contagem; não é uma segunda contagem de atendimentos abertos |
| open_tickets | Atendimentos ainda abertos entre os criados no recorte | estado atual do estágio | Contagem da coorte cujo estágio atual não está marcado como fechado | contagem; não equivale a `open_backlog` e exclui estágios fechados |
| closed_tickets | Atendimentos fechados entre os criados no recorte | estado atual do estágio | Contagem da coorte cujo estágio atual está marcado como fechado | contagem; não usa `closed_at` para formar a coorte |
| closed_rate | Proporção fechada da coorte | estado atual do estágio | `closed_tickets / total_tickets`, com escala de 0 a 1 e zero quando não há tickets | proporção; denominador vazio não vira indisponível neste snapshot |
| high_priority_open | Atendimentos de alta prioridade ainda abertos | estado atual do estágio + prioridade | Contagem de tickets não fechados cujo `priority`, normalizado em maiúsculas, é `HIGH` | contagem; prioridade vazia ou diferente de `HIGH` é excluída |
| first_response_sla_tracked | Atendimentos com SLA de primeira resposta acompanhado | cobertura de status SLA | Contagem de tickets com `time_to_first_response_sla_status` preenchido | contagem de cobertura; não é taxa de cumprimento e vazios são excluídos |
| close_sla_tracked | Atendimentos com SLA de fechamento acompanhado | cobertura de status SLA | Contagem de tickets com `time_to_close_sla_status` preenchido | contagem de cobertura; não é taxa de fechamento e vazios são excluídos |
| source_filled | Atendimentos com fonte preenchida | cobertura de origem | Contagem de tickets com `source_type` preenchido | contagem de cobertura; nulo ou string vazia é excluído |

O filtro de período desse snapshot é aplicado a `hs_created_at`, com limite
inicial inclusivo e final exclusivo no contrato da função. Os campos de
estado usam `hubspot_pipeline_stages.is_closed`; o snapshot não infere
fechamento pela existência de `closed_at`. Os indicadores `by_source`,
`by_pipeline` e `by_owner` são detalhamentos do mesmo universo e não criam
novos KPIs agregados neste registro.

No código, ticket_created_at corresponde a hubspot_tickets.hs_created_at. Para resolução, a versão corrente usa a data nativa disponível ou a resolução derivada do histórico, com estado de cobertura; closedate/hs_closed_at não é tratado como preenchido quando a origem não o fornece. Uma série de criação e uma série de fechamento não formam automaticamente a mesma coorte. No snapshot descrito acima, o recorte é de criação e o fechamento é apenas o estado atual do ticket dentro dessa coorte.

### Customer Success

Contrato: rpc_analytics_customer_success_kpis_v2().

| Chave | Nome de negócio | Base temporal ou posição | Fórmula/definição | Estado e limitação |
|---|---|---|---|---|
| active_customers | Clientes ativos | company_status_now | Contagem segundo active_customer_rule | indisponível se a regra não estiver resolvida |
| mrr_total | MRR total | company_recurring_revenue_now | Soma do MRR da base ativa | parcial sem MRR em toda a base; indisponível sem fonte resolvida |
| arpa | Receita média por cliente | company_recurring_revenue_now | mrr_total / clientes ativos com MRR | moeda; sem base com MRR, indisponível |
| overdue_customers | Clientes com atraso | title_due_date_now | Contagem de clientes ativos com saldo vencido | posição atual |
| overdue_amount | Valor vencido | title_due_date_now | Soma do saldo vencido ligado por CNPJ normalizado | moeda; não usar nome/domínio/e-mail como match |
| mrr_overdue | MRR em atraso | company_recurring_revenue_now | MRR dos clientes com saldo vencido | parcial por cobertura do vínculo HubSpot ↔ OMIE |
| mapping_coverage_percent | Cobertura de conciliação | company_tax_id_now | clientes com vínculo financeiro / clientes ativos | percentual; mede cobertura, não sucesso financeiro |
| customers_with_open_tickets | Clientes com atendimento aberto | ticket_state_open_now | Clientes ativos associados a tickets abertos | parcial/indisponível conforme associations |
| mrr_with_critical_ticket | MRR com atendimento crítico | ticket_state_open_now | MRR associado a atendimento crítico | parcial/indisponível conforme associations |
| customers_without_recent_activity | Clientes sem atividade recente | company_last_activity_at | Clientes acima do limite de inatividade configurado | parcial/indisponível sem data de atividade |
| mrr_without_recent_activity | MRR sem atividade recente | company_last_activity_at | MRR da mesma população sem atividade recente | parcial/indisponível sem data de atividade |
| logo_churn_rate, churned_mrr, new_mrr, nrr, grr | Evolução da carteira | customer_status_transition | Dependem de comparação entre snapshots | awaiting_history; não são zero nem calculados sem série |

A regra de cliente ativo, a fonte de MRR e o limiar de inatividade são metadados do contrato. Se estiverem UNRESOLVED, o registro deve permanecer indisponível, sem escolher uma regra implícita.

## O que não está publicado como calculado

- Nenhuma métrica de planilha é fonte ou fallback do Dashboard.
- SLA e tempo de resposta só são publicados quando há cobertura do campo ou do status correspondente; ausência não é interpretada como cumprimento.
- Aging de etapa, conversão por etapa, churn, NRR, GRR e backlog histórico dependem de histórico e permanecem awaiting_history quando a série é insuficiente.
- Chat, conversas e outras fontes externas não entram neste registro sem contrato executável.
- `ANALYTICS-METRIC-METHODOLOGY-2026-08-21` é o lote corrente de documentação da metodologia, entregue para revisão; `ANALYTICS-METRIC-CONTEXT-UI-2026-08-21` continua PROPOSED. Este registro não expõe ainda a metodologia na interface.

## Evidência executável

- Contrato de apresentação e tradução de basis/estados: apps/web/src/features/analytics/analytics-kpi-contract.mjs.
- Mapeamento dos payloads: apps/web/src/features/analytics/analytics-model.ts.
- Chamadas e filtros: apps/web/src/features/analytics/analytics-api.ts.
- Faixas Agora, No período e Apoio: AnalyticsCeoPage.tsx, AnalyticsCommercialPage.tsx e AnalyticsKpiBoard.tsx.
- Read models e estados: migrations 20260807130000_analytics_kpi_read_models_v1.sql, 20260807150000_analytics_kpi_read_models_v2.sql, 20260807170000_analytics_kpi_read_models_v3.sql e 20260821150000_analytics_commercial_conversion_semantics_v1.sql.
- Coortes, escopo e timezone: migrations 20260808290000_analytics_operation_scope_v1.sql, 20260821100000_analytics_temporal_semantics_timezone_v1.sql e 20260821113000_analytics_commercial_reconciliation_cohorts_v1.sql.
- Fonte financeira publicada: migration 20260802020000_analytics_finance_api_only_surface_v1.sql.

## Próximas evoluções autorizadas na fila

1. ANALYTICS-METRIC-CONTEXT-UI-2026-08-21 (PROPOSED): expor o contexto no produto sem obrigar leitura do código ou deste repositório.
2. DATA-PIPELINE-OPERATION-GOVERNANCE-2026-08-21 (DONE): mapa de pipelines HubSpot por objeto, área e operação validado e arquivado; filtros e reconciliações server-side permanecem sujeitos ao contrato executável.
3. R1-UTF8-ENCODING-INTEGRITY-2026-08-21 (DONE): integridade de charset tratada como mitigação defensiva e handoff arquivado; a causa de corrupção permanece não confirmada no runtime local.

Essas evoluções não fazem parte deste lote e não foram marcadas como prontas.
