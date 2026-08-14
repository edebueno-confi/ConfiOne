# Analytics — Deduplicação do Dashboard CEO — 2026-08-13

## Diagnóstico

Na montagem da tela CEO, o frontend carregava o snapshot atual e depois o
histórico. O histórico chamava `rpc_analytics_ceo_snapshot` novamente para
preencher o campo `current`, portanto o mesmo período era calculado duas vezes
antes de considerar o período anterior.

## Mudança local

`supabase/migrations/20260813150911_analytics_ceo_dashboard_snapshot_dedupe_v1.sql`

Cria `public.rpc_analytics_ceo_dashboard(date,date)`, que retorna:

- `snapshot`: payload corrente;
- `history`: contrato histórico existente, com o mesmo `snapshot` corrente e
  o snapshot do período anterior.

Os RPCs `rpc_analytics_ceo_snapshot` e `rpc_analytics_ceo_history` não foram
alterados. A tela usa o novo contrato e mantém fallback para os RPCs antigos
durante a publicação.

## Evidência local

| Fluxo | Tempo | Payload |
| --- | ---: | --- |
| snapshot + histórico antigos | 457 ms | 159.003 bytes combinados |
| RPC combinado | 312 ms | 159.035 bytes |

Os payloads `snapshot` e `history` do RPC combinado foram comparados com os
RPCs antigos e ficaram byte a byte iguais na janela de 365 dias.

## Segurança e validação

- `anon` não possui `EXECUTE`;
- `authenticated` e `service_role` possuem `EXECUTE`;
- `search_path` permanece vazio e o RPC usa `SECURITY DEFINER` com autorização
  interna `app_private.can_read_analytics()`;
- pgTAP específico: 6/6;
- testes focados: 270/270;
- typecheck, build, lint e quality gate aprovados.

## Estado de publicação

A migration foi aplicada ao Supabase remoto e registrada como
`20260813152552` / `analytics_ceo_dashboard_snapshot_dedupe_v1`. Em produção,
o RPC combinado mediu aproximadamente 393 ms na janela de 365 dias.

O advisor de performance não apontou aviso específico para o novo RPC. O
advisor de segurança mantém apenas o alerta genérico de funções
`SECURITY DEFINER` executáveis por `authenticated`; isso é esperado para este
endpoint, que valida `app_private.can_read_analytics()` internamente e revoga
`EXECUTE` de `anon`.
