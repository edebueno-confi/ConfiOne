# Dashboard — diagnóstico do timeout e hardening aplicado

**Data:** 2026-08-08
**Estado:** migration remota aplicada e validada diretamente no banco; validação
HTTP autenticada permanece como monitoramento operacional.

## Diagnóstico

O incidente dos três RPCs executivos não foi causado pela reescrita de
`vw_analytics_ticket_resolution`. No banco remoto atual, a contagem da view em
34.392 tickets executou em 42 ms; `analytics_hubspot_stage_events` está vazio.

O problema é a pressão de memória no PostgREST: `authenticated` e
`authenticator` usam `statement_timeout=8s` e `work_mem=2184kB`. As estatísticas
históricas da rota PostgREST registram máximos de 6,79 s no Snapshot, 7,68 s no
Histórico e 6,71 s no Resumo Executivo.

`EXPLAIN (ANALYZE, BUFFERS)` isolou os read models que derramam em arquivos
temporários:

| Operação | Padrão global | Sessão com ajuste | Evidência |
| --- | ---: | ---: | --- |
| `rpc_analytics_support_kpis_v2` | 1,60 s, 9.541 páginas temporárias lidas | 0,79 s com 16 MB | CTE `scoped` é percorrida por vários agregados |
| `rpc_analytics_ceo_snapshot` (todo período) | 1,42 s, 34.008 páginas temporárias lidas | 0,49 s com 64 MB | reconciliação financeira deixa de derramar |
| `rpc_analytics_executive_kpis_v2` | 1,83 s, 11.095 páginas temporárias lidas | 1,01 s com 16 MB de sessão | herda o custo de Suporte |

O ajuste é limitado à entrada e à saída de cada função, conforme o `SET` de
configuração de função do PostgreSQL. Não aumenta o `work_mem` global do
PostgREST nem altera fórmulas, dados, RLS, grants ou contratos.

## Alteração aplicada

- Migration: `supabase/migrations/20260808250000_analytics_dashboard_timeout_hardening.sql`.
- `rpc_analytics_support_kpis_v2(date,date,text,text)` recebe `work_mem=16MB`.
- `rpc_analytics_ceo_snapshot(date,date)` recebe `work_mem=64MB`; o Histórico
  invoca esse Snapshot e herda o hardening.
- Teste pgTAP: `supabase/tests/106_analytics_dashboard_timeout_hardening.sql`.
  Ele foi executado em vermelho antes da migration (2 falhas de configuração) e
  verde depois dela.

## OMIE

O HTTP 502 atual é independente. As duas falhas mais recentes registram erro
500 do provedor OMIE; a promoção local do snapshot não foi iniciada. A promoção
anterior de 3.768 títulos concluiu em 42,2 s, e os timeouts de promoção de
2026-08-06 são anteriores ao hardening que define `statement_timeout=120s` na
`rpc_service_promote_omie_snapshot`.

## Validação local

- `npm run supabase:db:reset`;
- `npm run supabase:test:db` — 108 arquivos, 1.694 testes;
- `npm run supabase:lint:db` — sem erro; avisos antigos fora do lote;
- `npm run quality:changed` — aprovado, zero findings;
- `npm run web:build`;
- `npm run local:qa:secret-scan` — 2.133 arquivos, zero ocorrências.

## Validação remota após aplicação

A migration `20260808250000` foi aplicada no projeto Supabase remoto em
2026-08-08. O catálogo confirma `work_mem=16MB` em
`rpc_analytics_support_kpis_v2` e `work_mem=64MB` em
`rpc_analytics_ceo_snapshot`.

`EXPLAIN (ANALYZE, BUFFERS)` das chamadas remotas de 2026-08-01 a 2026-08-08
concluiu dentro do orçamento autenticado de 8 s:

| RPC | Tempo após aplicação |
| --- | ---: |
| `rpc_analytics_support_kpis_v2` | 4,37 s |
| `rpc_analytics_ceo_snapshot` (todo período) | 2,91 s |
| `rpc_analytics_executive_kpis_v2` | 1,24 s |
| `rpc_analytics_ceo_history` | 299 ms |

O resumo executivo ainda apresentou I/O temporário pequeno (1.554 páginas lidas,
881 escritas), mas permaneceu amplamente abaixo do timeout. A próxima leitura
operacional deve observar `pg_stat_statements` e a rota autenticada do Dashboard
sob tráfego real, sem alterar o limite global do PostgREST.
