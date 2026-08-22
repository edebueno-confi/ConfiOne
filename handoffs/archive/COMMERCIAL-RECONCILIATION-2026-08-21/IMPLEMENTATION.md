# Archived Implementation

## Task ID

COMMERCIAL-RECONCILIATION-2026-08-21

## Implementador

Forge (Codex)

## Base SHA

`8d9e7da1c70d1aee8aad21e4e0896c3bf325d2d2`

## Implementation SHA

`0f603b7c1d15a5993634f118ab2f94f2574bc60e`

## Status final

COMPLETED. A implementação foi integrada localmente após aprovação formal do
Sentinel.

## Diagnóstico

O literal histórico `208 versus 206` não foi reproduzido no snapshot local
atual. A divergência estrutural foi reproduzida no contrato executável:
`rpc_analytics_commercial_snapshot` filtrava todo o universo por
`hs_created_at` e calculava totais, abertos, ganhos e perdidos no mesmo
conjunto, misturando coorte de criação, posição atual e coorte encerrada.

## Correção

A migration
`supabase/migrations/20260821113000_analytics_commercial_reconciliation_cohorts_v1.sql`
separou:

- `total_deals`: coorte criada no período, por `hs_created_at`;
- `open_deals`: posição atual por estágio aberto;
- `won_deals`, `lost_deals`, `won_revenue` e `conversion_rate`: coorte fechada
  no período, por `hs_closed_at`;
- funil, pipeline e responsável: posição atual;
- tendência mensal: criações do período.

O payload declara `meta.cohorts` e as fronteiras temporais do backend.

## Allowlist integrada

- `supabase/migrations/20260821113000_analytics_commercial_reconciliation_cohorts_v1.sql`
- `supabase/tests/122_analytics_commercial_reconciliation.sql`
- `docs/ANALYTICS_METRIC_CATALOG_V1.md`

Os handoffs correntes foram arquivados separadamente na mesma operação
administrativa. Alterações preexistentes do worktree e tarefas propostas da
fila não foram incluídas no commit de implementação.

## Validações

- Teste pgTAP direcionado: PASS, 8/8.
- Suíte pgTAP: PASS, 124 arquivos e 1.902/1.902.
- `npm run review:gates`: PASS, 0 regressões bloqueantes.
- `npm run web:typecheck`: PASS.
- `npm run web:build`: PASS.
- `npm run lint`: PASS, 0 erros e 160 avisos legados.
- `npm run docs:validate`: PASS, 0 bloqueios.
- `git diff --check`: PASS.
- `npm run test:all`: 575/576; P-GOV-001 permanece fora do escopo por não
  aceitar `Owner = Sentinel` no teste histórico.

## Limitações

O snapshot histórico que originou `208 versus 206` não está disponível localmente.
Não houve QA visual autenticado, integração remota, migration remota ou
validação em produção.

## Finalização local

- Commit local exclusivo: `0f603b7c1d15a5993634f118ab2f94f2574bc60e`.
- Push, merge, deploy, migration remota, secrets e release surface: não
  executados.
