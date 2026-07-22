# Correção do schema cache PostgREST — 2026-07-22

## Sintoma

O painel exibia falha na reconciliação OMIE informando que a coluna
`is_current` não existia no schema cache de `analytics_finance_receivables`.

## Causa raiz

A coluna já existia no PostgreSQL e a migration de hardening estava registrada
no banco local, mas o PostgREST havia iniciado com o cache de schema anterior à
migration. O erro era de descoberta do contrato REST, não de ausência da coluna
nem de credencial OMIE.

## Correção

- Recarregado o schema do PostgREST com `NOTIFY pgrst, 'reload schema'`.
- Criada a migration idempotente
  `20260722180547_refresh_postgrest_schema_after_finance_hardening.sql` para
  repetir o reload em novos ambientes após a migration financeira.
- Nenhum dado financeiro, secret ou ambiente remoto foi alterado.

## Validação

- `analytics_finance_receivables.is_current` confirmado no PostgreSQL local.
- Leitura REST de `is_current`: HTTP 200.
- `rpc_analytics_finance_company_rollup`: HTTP 200.
- `supabase db lint --local`: concluído com os 12 avisos legados conhecidos de
  variável `v_actor` não utilizada; sem falha nova.
- O sync autenticado passou a retornar apenas `409` de configuração porque a
  fixture local não possui credencial OMIE; o erro de schema cache não voltou.
