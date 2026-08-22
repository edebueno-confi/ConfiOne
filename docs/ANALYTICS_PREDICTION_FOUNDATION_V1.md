# Fundação de predição comercial explicável V1

> Status: `DISCOVERY / NOT PUBLISHED` em 2026-08-21.
>
> Este documento delimita os sinais comerciais que podem sustentar uma
> predição explicável e as lacunas que impedem um forecast publicado. Ele não
> cria fórmula local, usa IA generativa para matemática, inventa dados nem
> publica uma data ou probabilidade que o backend não sustente.

## Decisão do lote

O backend já publica sinais suficientes para descrever o estado atual do
pipeline e alguns resultados observados, mas não publica um contrato dedicado
de forecast. Portanto, este lote entrega uma fundação documental e mantém
qualquer predição futura como `PROPOSED`, `awaiting_history` ou `unavailable`
quando faltar fonte, cobertura ou regra aprovada.

## Sinais reais disponíveis

| Sinal | Fonte e semântica | Uso permitido | Limite |
| --- | --- | --- | --- |
| Pipeline aberto | `rpc_analytics_commercial_kpis_by_operation` / `rpc_analytics_commercial_kpis_v2()`; posição atual por etapa aberta | descrever estoque atual e valor aberto | não é receita futura garantida |
| Pipeline ponderado | `weighted_pipeline_amount`; soma de `amount_home × stage_probability` para negócios abertos com probabilidade configurada | sinal explicável de valor esperado do pipeline atual | fica `partial` ou `unavailable` quando a cobertura de probabilidade é insuficiente |
| Conversão | `win_rate`; ganhos divididos por negócios fechados na coorte de `hs_closed_at` | descrever resultado observado da coorte fechada | não é probabilidade calibrada para cada negócio futuro |
| Ticket | `avg_deal_amount` e `median_deal_amount`; valores de negócios ganhos na coorte de fechamento | informar valor típico observado | não define meta, distribuição ou valor futuro por si só |
| Lead time | `median_sales_cycle_days` e `avg_sales_cycle_days`; diferença entre `hs_created_at` e `hs_closed_at` para ganhos | informar duração observada do ciclo | não há histórico suficiente para data prevista ou aging de etapa |

## Separação temporal

Os sinais não compartilham automaticamente o mesmo recorte:

1. pipeline aberto é posição atual na data de corte;
2. conversão, ticket e ciclo são calculados sobre negócios fechados por
   `hs_closed_at` no período selecionado;
3. o ciclo usa `hs_created_at` como início e `hs_closed_at` como fim;
4. histórico de transição e entrada em etapa permanece indisponível enquanto
   `stage_conversion_rate` e `stage_aging_days` estiverem em
   `awaiting_history`.

Uma futura predição precisa declarar `period_start`, `period_end_exclusive`,
timezone, `as_of`, coorte, filtros de pipeline/owner/operação e cobertura. Não
é válido combinar a posição atual do pipeline com uma conversão de outra coorte
sem registrar a regra e a diferença temporal.

## O que pode e não pode ser chamado de predição

Pode ser exposto como sinal explicável:

- valor ponderado do pipeline atual, desde que sua cobertura de probabilidade
  seja exibida;
- estatística observada de conversão, ticket e ciclo da coorte fechada;
- estado `partial`, `awaiting_history` ou `unavailable` quando a evidência não
  sustenta um número.

Ainda não pode ser publicado como forecast:

- data provável de fechamento;
- probabilidade individual ou calibrada de ganho;
- receita prevista por período;
- confiança, intervalo, cenário, pacing ou atingimento;
- distribuição por owner, pipeline, segmento ou meta.

Não há contrato server-side publicado que combine esses sinais, nem histórico
suficiente de transições para validar tal combinação. O frontend não calcula
esses valores localmente e não substitui o backend como fonte da verdade.

## Contrato mínimo para próximo lote

Antes de uma superfície de predição, o backend deverá publicar, com tenant,
permissão, auditoria e estado de cobertura:

- fórmula e versão do cálculo;
- coorte e campo de data de cada entrada;
- `as_of`, janela de treino/observação e timezone;
- sinal observado, valor derivado e valor projetado separados;
- cobertura de probabilidade e histórico de transições;
- política explícita para nulo, ausência e amostra insuficiente;
- intervalo ou confiança somente se houver método validado;
- explicação dos fatores usados e dos fatores não disponíveis.

## Evidência local

- `supabase/migrations/20260807130000_analytics_kpi_read_models_v1.sql`
- `supabase/migrations/20260807150000_analytics_kpi_read_models_v2.sql`
- `supabase/migrations/20260807170000_analytics_kpi_read_models_v3.sql`
- `supabase/migrations/20260821150000_analytics_commercial_conversion_semantics_v1.sql`
- `apps/web/src/features/analytics/analytics-api.ts`
- `apps/web/src/features/analytics/analytics-model.ts`
- `apps/web/src/features/analytics/analytics-kpi-contract.mjs`
- `docs/ANALYTICS_KPI_REGISTRY_V1.md`

Nenhuma migration, RPC, tabela, seed, integração externa ou release surface foi
alterada por este lote de descoberta.
