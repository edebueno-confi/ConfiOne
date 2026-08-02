# Especificação — Financeiro OMIE API V1

Status: contrato implementado localmente; sincronização real e credenciais não
validadas neste lote.

## Objetivo

Publicar no Dashboard financeiro somente o read model de contas a receber
originado da API OMIE. Registros históricos de planilhas permanecem armazenados
para auditoria e migração, mas não podem alimentar o snapshot publicado.

## Contrato de origem

- Fonte publicada: `analytics_finance_receivables` com
  `source_key = 'omie_receivables_api'` e `is_current = true`.
- RPC: `public.rpc_analytics_finance_snapshot(date,date,text,text,text)`.
- Estado mínimo: `not_configured`, `syncing`, `error`, `empty`, `stale` ou
  `fresh`.
- Payload deve expor `source`, `status`, `reason`, `last_successful_sync_at`,
  `stale_after_minutes`, `sync_run_id`, KPIs e detalhamentos agregados.
- A decisão de fonte, filtros, aging, reconciliação e agregações pertence ao
  Postgres; o frontend apenas formata o contrato.

## Estados e comportamento

| Estado | Exibição | Permite publicar valores OMIE? |
|---|---|---|
| `not_configured` | OMIE não configurado | não |
| `syncing` | sincronização em andamento | não |
| `error` | última sincronização falhou | não |
| `empty` | sincronização sem registros válidos | não |
| `stale` | último snapshot fora do limite | sim, com aviso explícito |
| `fresh` | snapshot válido | sim |

Dados de planilha nunca aparecem como fallback. Ausência vira “indisponível”,
nunca zero fabricado.

## Segurança e validação

A RPC é `SECURITY DEFINER`, fixa `search_path`, exige leitura autorizada de
Analytics e não é executável por `anon`. A migration e o teste pgTAP são,
respectivamente, `supabase/migrations/20260802004655_analytics_finance_omie_only_contract_v1.sql`
e `supabase/tests/088_analytics_finance_omie_only_contract.sql`.

## Pendências

- Validar uma sincronização OMIE real em ambiente autorizado.
- Confirmar frescor, volume e reconciliação com HubSpot após a carga.
- Executar validação remota somente com autorização explícita e sem expor
  segredos.
