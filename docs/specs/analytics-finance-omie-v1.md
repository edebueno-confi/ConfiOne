# Especificação — Financeiro OMIE API V1

Status: contrato OMIE-only implementado localmente; sincronização real,
credenciais externas e volume corrente ainda não validados neste lote.

## Fonte e regra de publicação

O Dashboard financeiro só pode ler `analytics_finance_receivables` quando
`source_key = 'omie_receivables_api'` e `is_current = true`. Registros de
planilha continuam armazenados para auditoria/migração, mas nunca são fallback.
Zero linhas atuais significa ausência de dados, não saldo zero.

RPCs publicadas no lote:

- `public.rpc_analytics_finance_snapshot(date,date,text,text,text)`;
- `public.rpc_analytics_finance_unmatched_clients(text,integer)`;
- `public.rpc_analytics_finance_source_status()`.

Migration e teste: `supabase/migrations/20260802004655_analytics_finance_omie_only_contract_v1.sql`
e `supabase/tests/088_analytics_finance_omie_only_contract.sql`.

## Estados

| Estado | Significado | Publica valor? | UI |
|---|---|---|---|
| `not_configured` | OMIE não configurado | não | fonte OMIE não configurada |
| `syncing` | carga em andamento | não | sincronização em andamento |
| `error` | última carga falhou | não | dados OMIE indisponíveis + diagnóstico/retry |
| `empty` | carga válida sem títulos | não | nenhum dado financeiro |
| `stale` | último snapshot excedeu frescor | sim, com aviso | valores com alerta de frescor |
| `fresh` | snapshot atual válido | sim | valores e `observed_at` |

## Catálogo de métricas

| Métrica/campo | Fórmula/definição | Granularidade/período | Fonte OMIE necessária | Estado atual / nulo |
|---|---|---|---|---|
| Títulos | `count(título válido)` | cliente, categoria e período | receivable ID, issue/due/status | Contrato; sem título = indisponível |
| Saldo aberto | soma do saldo não liquidado | fotografia em `observed_at` | balance/status/paid amount | Contrato; sem saldo = indisponível |
| Saldo vencido | soma de títulos vencidos abertos | fotografia | due_date, balance, status | Contrato; data inválida fora do cálculo |
| Títulos vencidos | `count(due_date < as_of e aberto)` | fotografia | due_date/status | Contrato |
| A vencer 30 dias | soma aberto com vencimento em 0–30 dias | janela relativa a `as_of` | due_date/balance | Indisponível sem `as_of` |
| A vencer 60 dias | soma aberto com vencimento em 31–60 dias | janela relativa | due_date/balance | Indisponível sem data |
| A vencer 90 dias | soma aberto com vencimento em 61–90 dias | janela relativa | due_date/balance | Indisponível sem data |
| Recebido no período | soma liquidado com `paid_at` na janela | período selecionado | paid_at/paid amount/status | Nulo não vira zero |
| Faturado/emitido | soma do valor emitido na janela | `issue_date` | issue_date/gross amount | Disponível somente se política OMIE confirmar campo |
| Aging | distribuição por faixas de dias vencidos | título e fotografia | due_date/as_of/balance | Faixa desconhecida = qualidade parcial |
| Atraso médio | média de `paid_at - due_date` dos pagos elegíveis | títulos pagos na janela | paid_at/due_date | Sem títulos elegíveis = indisponível |
| Taxa de inadimplência | `saldo vencido / saldo aberto` | cliente e fotografia | balance/due_date/status | denominador zero = indisponível |
| Projeção de recebimento | soma a vencer por janela, sem promessa | cliente/categoria/janela | due_date/balance | Não estimar sem títulos atuais |
| Concentração | saldo/top clientes sobre saldo aberto | cliente e fotografia | cliente resolvido + balance | vínculo não resolvido fica fora e na reconciliação |
| Títulos por cliente | total, aberto, vencido e saldo | cliente e período | client ID/name, receivable fields | nome não é identidade |
| Estado de sincronização | estado/frescor da última carga | execução | sync run ID, started/finished/error | sempre deve ser exposto |
| Reconciliação HubSpot | títulos sem/ambíguo/com vínculo resolvido | título e tenant | matching result + Company | não publicar como saldo de cliente sem vínculo |

## Filtros e contratos

Período, cliente, categoria e status devem ser parâmetros do RPC/view. O
backend define timezone, aging, status liquidado e janela; o frontend apenas
serializa filtros e formata números. O payload deve conter `source`, `status`,
`reason`, `last_successful_sync_at`, `stale_after_minutes`, `sync_run_id`,
`observed_at`, `quality_status` e agregados/detalhes.

## Segurança e limitações

A RPC é `SECURITY DEFINER`, fixa `search_path`, exige leitura autorizada de
Analytics, possui tenant/RLS e não é executável por `anon`. O lote local não
confirma credenciais, plano ou volume OMIE real; qualquer validação remota,
sync real ou alteração de secret exige autorização explícita. Planilhas não
alimentam o Dashboard em nenhum estado.

## Critérios de aceite

pgTAP deve cobrir origem OMIE-only, estados, tenant/RLS, grants e ausência de
fallback. A UI deve capturar `not_configured`, `error`, `empty`, `stale` e
`fresh`; dados ausentes devem ser indisponíveis e nunca simulados.
