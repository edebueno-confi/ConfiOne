# Analytics: backend como fonte de verdade — 2026-08-13

## Objetivo

Remover regras operacionais calculadas no navegador e publicar os resultados derivados nos read models do Supabase, mantendo o frontend como camada de normalização, formatação e navegação.

## Implementação

A migration `20260813154129_analytics_backend_read_models_v1.sql` adiciona:

- `rpc_analytics_support_customer_debt_read_model()`: prioridade por empresa e agregados derivados, preservando o contrato legado.
- `rpc_analytics_support_queue_health_read_model(text)`: disponibilidade, medição, movimento, taxa, cobertura, avisos e `suggests_inbox` por pipeline.
- `app_private.analytics_ceo_executive_sections(jsonb)`: ranking e exceções do cockpit executivo.
- ampliação de `rpc_analytics_ceo_dashboard(date, date)` para transportar as seções executivas sem recalcular o snapshot corrente no histórico.

O acesso segue restrito: `public`/`anon` não recebem execução; `authenticated` e `service_role` recebem apenas os RPCs públicos necessários. O wrapper mantém `app_private.can_read_analytics()` e o escopo operacional existente.

## Frontend

`analytics-customer-debt.mjs`, `analytics-queue-health.mjs` e `analytics-executive.ts` agora adaptam campos publicados pelo backend. A ordenação de exportação e a formatação de moeda/dias continuam sendo apresentação; regras de prioridade, disponibilidade, cobertura, taxa, sugestão e risco foram removidas do browser.

## Validação

- 29 testes focados passaram.
- Typecheck web passou.
- SQL aplicado diretamente no banco local, sem reset.
- Os RPCs locais retornaram os campos novos e o snapshot executivo continuou idêntico entre `snapshot` e `history.current`.
- O `db push --local` encontrou drift preexistente e tentou reaplicar migrations já registradas; o banco local não foi resetado.
- Migration remota aplicada com sucesso e registrada pelo Supabase como `20260813160823` (`analytics_backend_read_models_v1`). No Supabase remoto, a dívida retornou `high_priority=229` e `in_worked_queue=1489`; a fila retornou `available=true`, `measured=4952` e taxa `87.0`; o dashboard executivo retornou arrays de pipelines/exceções e `snapshot = history.current`.
- As permissões remotas foram verificadas: os três RPCs têm `anon_execute=false` e `authenticated/service_role=true`.

## Estado final

A migration foi aplicada ao Supabase remoto e validada. O único ponto separado continua sendo o drift histórico do banco local, que não foi corrigido com reset destrutivo.
