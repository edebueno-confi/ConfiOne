# Fundação de metas financeiras e MRR V1

> Status: `DISCOVERY / NOT PUBLISHED` em 2026-08-21.
>
> Este documento registra o que o ConfiOne consegue sustentar hoje e o que
> ainda não possui fonte publicada. Ele não cria meta, forecast, quota,
> distribuição de MRR, contrato de escrita ou superfície de interface.

## Decisão do lote

O Analytics possui e publica um contrato operacional de MRR de posição atual,
mas não possui uma fonte canônica publicada para metas financeiras nem para
uma série histórica confiável de MRR. Portanto, este lote entrega uma
fundação documental e não cria código executável, migration, tabela, RPC,
seed, distribuição ou UI.

Ausência de meta não é meta zero. Enquanto a fonte não existir, qualquer
indicador de atingimento, gap, pacing ou distribuição deve permanecer
`unavailable`, `PROPOSED` ou bloqueado por decisão do proprietário.

## Fontes reais encontradas

| Elemento | Fonte real | O que publica | Limite atual |
| --- | --- | --- | --- |
| Base de clientes e MRR | `vw_analytics_customer_base` | Cliente, status, owner, `mrr`, regra de cliente ativo, fonte e frescor | posição atual; não é meta nem série de MRR por período |
| Snapshot de Customer Success | `rpc_analytics_customer_success_kpis_v2()` | `mrr_total`, `arpa`, `mrr_overdue` e sinais de cobertura | sem parâmetros de período e sem target |
| Configuração de KPI | `analytics_kpi_settings` e `rpc_analytics_kpi_settings()` | `mrr_source`, `active_customer_rule`, timezone, versão e tamanho da série capturada | configuração da medição; não registra valor de meta |
| MRR por cliente | `hubspot_companies.mrr`, quando `mrr_source = HUBSPOT_RECURRING_REVENUE` | valor recorrente usado pela base canônica | nulo quando a fonte está não resolvida ou o valor não tem evidência |
| Receita Comercial | `rpc_analytics_commercial_kpis_v2()` e wrappers | `won_amount`, `created_amount`, pipeline e conversão | receita de negócios não é MRR e não pode ser usada como proxy de meta |
| Snapshots diários internos | `analytics_kpi_daily_snapshot` e `rpc_service_capture_analytics_kpi_snapshot(date)` | captura interna de `recurring_revenue_total` e outros valores observados por data | armazenamento histórico interno; não há contrato autenticado/publicado de leitura histórica |

### Regra de MRR atual

O contrato vigente resolve MRR pela configuração `mrr_source`. Quando a fonte
é `HUBSPOT_RECURRING_REVENUE`, o read model considera o valor `mrr` da empresa
HubSpot, com normalização que não transforma ausência em valor positivo. Quando
a fonte é `UNRESOLVED`, o MRR publicado fica indisponível. Cobertura incompleta
produz estado `partial`, não um zero silencioso.

O `mrr_total` publicado por Customer Success usa a base de clientes ativos e
tem a base temporal `company_recurring_revenue_now`. Isso significa fotografia
observada agora, não soma de valores cuja data de criação ou fechamento caiu em
um período escolhido.

### Histórico interno capturado, mas não publicado

O mecanismo `analytics_kpi_daily_snapshot` captura internamente o valor
histórico `recurring_revenue_total` por data. Essa captura não equivale a um
contrato autenticado e publicado de leitura de uma série histórica de MRR.
Leituras diretas para o papel autenticado permanecem revogadas pela política de
least privilege, e `rpc_analytics_kpi_settings()` expõe apenas metadados como
`history_since` e `history_days`, não as linhas históricas do snapshot. Portanto,
o armazenamento interno não fornece, por si só, base publicada para metas,
atingimento, pacing ou distribuição.

## Semântica temporal obrigatória

Uma futura meta precisa separar pelo menos três conceitos:

1. **Período da meta**: intervalo ao qual o objetivo financeiro se aplica,
   com início inclusivo, fim exclusivo e timezone operacional explícitos.
2. **Janela histórica**: intervalo usado para explicar tendência, baseline,
   sazonalidade ou capacidade. Não altera o período da meta.
3. **Data de corte (`as_of`)**: instante em que o realizado e a cobertura foram
   observados. Não deve ser substituído pela data de atualização do documento.

O realizado comparado à meta também precisa declarar sua semântica. `won_amount`
é fechado por `hs_closed_at`; `created_amount` é criado por `hs_created_at`;
`mrr_total` é posição atual pela base recorrente configurada. Misturar esses
campos como se fossem a mesma série gera atingimento incorreto.

## O que ainda não está publicado

Não foi localizado contrato executável ou read model para:

- valor de meta financeira ou MRR;
- tipo de meta, quota ou owner responsável pela meta;
- moeda e unidade da meta;
- período de vigência da meta;
- data de corte do realizado;
- contrato autenticado/publicado de leitura do histórico de MRR e baseline
  histórico versionado para a meta;
- pacing, gap, atingimento ou forecast;
- distribuição por operação, pipeline, owner, segmento ou período;
- auditoria e versionamento de alterações de meta.

Também não existe autorização para inferir esses valores a partir de:

- `mrr_total` atual;
- `won_amount` comercial;
- títulos OMIE recebidos ou em aberto;
- dados de planilha;
- média histórica sem uma regra de negócio aprovada.

## Contrato mínimo para um próximo lote

Antes de UI ou cálculo de atingimento, um próximo lote deverá decidir e
materializar uma fonte server-side com, no mínimo:

- `goal_id`, tenant/escopo e dimensão da meta;
- tipo (`mrr`, receita, expansão ou outro) e unidade/moeda;
- `period_start`, `period_end_exclusive`, timezone e versão;
- `target_amount` e política explícita para nulo;
- `as_of` do realizado, fonte do realizado e janela histórica usada;
- cobertura, qualidade e estado (`available`, `partial`, `unavailable`);
- owner, autoria, auditoria e política de alteração;
- regra para não distribuir meta quando a fonte ou a cobertura forem
  insuficientes.

Esse contrato é requisito de planejamento, não implementação deste lote.

## Estado operacional

| Capacidade | Estado | Tratamento atual |
| --- | --- | --- |
| MRR total atual | Publicado | Ler `mrr_total` e seus metadados de estado/fonte |
| Histórico de MRR | Capturado internamente, mas não publicado como série confiável | `awaiting_history` ou `unavailable`; não extrapolar nem tratar o snapshot interno como contrato de leitura |
| Meta financeira/MRR | Não publicada | `PROPOSED`; não renderizar nem calcular |
| Atingimento, gap e pacing | Não publicado | Bloqueado até contrato de meta e realizado |
| Distribuição de meta | Não publicada | Não criar sem dimensão, regra e autorização |

## Critérios de segurança e manutenção

- O backend continua sendo a fonte da verdade; a interface não calcula meta,
  MRR, período, permissão ou cobertura.
- Tenant, escopo, RLS, permissão e auditoria devem acompanhar qualquer futuro
  contrato de meta.
- Ausência, nulo, cobertura parcial e histórico insuficiente devem permanecer
  visíveis como estado, nunca virar zero por conveniência visual.
- A documentação deve registrar o campo temporal real de cada realizado, como
  `hs_created_at`, `hs_closed_at` ou uma fotografia `as_of`.

## Evidência local

- `supabase/migrations/20260807120000_analytics_kpi_foundation_v1.sql`
- `supabase/migrations/20260807180000_analytics_kpi_least_privilege_v1.sql`
- `supabase/migrations/20260809060338_analytics_finance_identity_reconciliation_v1.sql`
- `apps/web/src/features/analytics/analytics-api.ts`
- `apps/web/src/features/analytics/AnalyticsCustomerSuccessPage.tsx`
- `docs/ANALYTICS_KPI_REGISTRY_V1.md`
- `docs/GOAL_EXECUTION_PLAN.md`

Nenhuma migration, RPC, tabela, seed, UI ou serviço externo foi alterado por
este lote.
