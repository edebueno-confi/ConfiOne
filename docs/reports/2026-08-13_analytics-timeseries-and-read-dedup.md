# Analytics — Séries Temporais e Deduplicação de Leituras — 2026-08-13

## Evidência

O `pg_stat_statements` de produção mostrou que as séries temporais estavam
entre as leituras mais custosas. A implementação anterior fazia `left join ...
on true` entre todos os registros do domínio e todos os buckets e aplicava as
datas somente dentro dos agregadores.

Baseline remoto em uma janela de 365 dias:

| Domínio | Antes | Depois | Pontos |
| --- | ---: | ---: | ---: |
| Suporte | 6,7 s | 3,8 s | 13 |
| Comercial | 260 ms | 70 ms | 13 |
| Financeiro | 1,45 s | 584 ms | 13 |

No banco local, o mesmo contrato mediu aproximadamente 430 ms em Suporte,
56 ms em Financeiro e 17 ms em Comercial depois da mudança.

## Mudança aplicada

`supabase/migrations/20260813144227_analytics_timeseries_join_perf_v1.sql`

- restringe a junção ao intervalo do bucket antes da agregação;
- preserva períodos sem registros com `generate_series` e `left join`;
- mantém os contratos de abertura, resolução, recebimento, previsto,
  vencido, mediana e legenda;
- mantém `SECURITY DEFINER`, `search_path` vazio, timeout de 15 segundos e os
  grants somente para os papéis previstos.

A migration foi aplicada ao Supabase remoto e registrada como
`20260813144456` / `analytics_timeseries_join_perf_v1`.

## Frontend

`getFinanceSnapshot` passou a usar `readAnalyticsRpc`, o deduplicador de
requisições em voo já existente na API de Analytics. Isso evita duas chamadas
idênticas simultâneas quando a tela financeira e a exportação compartilham o
mesmo filtro, sem introduzir cache persistente ou inventar dados no cliente.

## Validação

- 270 testes focados aprovados.
- Typecheck e build web aprovados.
- Quality gate aprovado com uma observação informativa preexistente em
  `scripts/recovery/export-codex-context.mjs`.
- Auditoria de dependências: zero vulnerabilidades critical/high/moderate/low.
- Secret scan: 2.196 arquivos rastreados, zero correspondências.
- Advisors pós-migration: nenhum novo aviso de performance relacionado à
  função. Os avisos de `SECURITY DEFINER` são lints gerais sobre RPCs públicos;
  esta função mantém a autorização interna `app_private.can_read_analytics()`
  e os grants sem `anon`.

## Próxima frente recomendada

O maior custo restante está nos read models executivos, observados em produção
com médias aproximadas de 34 s para `rpc_analytics_ceo_snapshot`, 17 s para
`rpc_analytics_executive_kpis_v2`, 14,6 s para `rpc_analytics_ceo_history` e
4,2 s para a fila de reconciliação. Eles precisam de uma otimização própria,
comparando payloads e cobertura antes de substituir os planos atuais.
