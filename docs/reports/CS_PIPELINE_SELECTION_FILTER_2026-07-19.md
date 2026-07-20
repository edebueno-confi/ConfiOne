# Seleção de pipelines no Dashboard Gerencial — 2026-07-19

## Entrega

- A aba `Configuração` permite editar o campo `Ativo` de cada fonte HubSpot.
- A configuração persistida continua sendo server-side via
  `rpc_admin_upsert_analytics_source_config`.
- A aba `CS / Suporte` lista os pipelines de tickets ativos por padrão.
- Cada pipeline pode ser desmarcado temporariamente para recalcular o
  snapshot; isso não altera a configuração global nem o HubSpot.
- A exclusão é enviada ao Postgres pelo parâmetro
  `p_excluded_pipeline_ids`, portanto KPIs, status, origem, responsáveis e
  tendência são recalculados no backend.
- O retorno `by_pipeline` passou a carregar `source_summary`, permitindo exibir
  no ícone de informação a distribuição observada em `source_type` no recorte.
  O texto diferencia origem confirmada de pipeline apenas sugestivo e informa
  quando os tickets não têm origem preenchida.

## Compatibilidade e segurança

- O contrato novo é `rpc_analytics_cs_snapshot(date, date, text, text, text[])`.
- O contrato anterior com quatro argumentos permanece disponível como wrapper
  sem exclusões, evitando quebra de clientes existentes.
- A migration mantém RLS e os grants de leitura/execução já exigidos pelo
  Analytics; nenhum ticket ou pipeline do HubSpot é alterado.

## Validação

- Migration aplicada somente no banco local, sem reset e sem alteração remota.
- Snapshot autenticado de julho/2026: todos os pipelines ativos = 286 tickets;
  excluindo `5034314` = 40 tickets.
- No recorte de julho, `Criadouro de Tiquetes | Aftersale` aparece com 129
  tickets `EMAIL` e 117 `CHAT`; `Confi | Whatsapp` aparece com 11 tickets sem
  `source_type` preenchido, portanto o nome do pipeline não é tratado como
  confirmação da origem.
- `supabase/tests/053_analytics_filtered_snapshots.sql`: 8 testes aprovados.
- `npm run web:typecheck`: aprovado.
- `npm run web:build`: aprovado; permanece apenas o warning conhecido de
  chunk grande do Vite.
