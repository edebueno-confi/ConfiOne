# HubSpot — campos nativos de tickets e execução autônoma

**Data:** 2026-08-08
**Estado:** aplicado e validado no Supabase remoto.

## Diagnóstico

O worker já solicitava ao HubSpot `subject`, `first_agent_reply_date`,
`hs_ticket_reopened_at`, `time_to_close`, `hs_is_one_touch_ticket` e campos
customizados de encerramento. Porém, a Edge Function remota ainda estava numa
versão anterior e o staging/finalizador não promoviam esses valores para
`analytics_hubspot_tickets`.

Havia ainda uma segunda lacuna: `rpc_analytics_hubspot_start_run` criava a
execução e seus itens, mas não acionava o dispatcher. O fluxo só prosseguia se
um ciclo sequencial ou uma intervenção manual chamasse o dispatcher.

## Alterações aplicadas

- `20260808260000_hubspot_ticket_native_fields_promotion.sql`: adiciona os
  campos nativos ao staging e os promove ao snapshot canônico.
- `20260808270000_analytics_native_reopen_rate.sql`: o KPI de reabertura usa a
  evidência nativa de `hs_ticket_reopened_at`; sem ela, permanece explícito como
  indisponível ou parcial.
- `20260808280000_hubspot_dispatch_autostart_and_continuation.sql`: um trigger
  em `hubspot_sync_runs` chama o enfileirador privado já existente. Ele lê o
  segredo exclusivamente no Vault, sem expô-lo ao RPC ou à UI.
- `hubspot-orchestrator-worker` foi publicado na versão 39 e
  `hubspot-orchestrator-dispatcher` na versão 32. O dispatcher processa até 12
  itens por invocação, agenda a continuação em segundo plano quando necessário e
  tenta a promoção final ao encontrar a fila ociosa.

## Evidência da carga completa

A carga completa `5ff00e0d-a0e9-4c45-aa28-1dccdf4424a9` foi concluída com
sucesso: 45.065 registros promovidos, 44.850 recebidos, 457 páginas e marca
d'água avançada. A cobertura posterior no snapshot de tickets foi:

| Campo | Tickets com valor |
| --- | ---: |
| `subject` | 34.379 |
| `first_agent_reply_at` | 9.092 |
| `reopened_at` | 61 |
| `time_to_close_ms` | 31.166 |
| `is_one_touch` | 1.334 |
| `closure_type` | 1.976 |

Campos que a origem não preencheu (`closure_marked_at` e `resolution_note`)
permanecem nulos; o produto os trata como indisponíveis, sem fabricar valores.

## Validação do acionamento automático

Depois da publicação, foi iniciada diretamente pelo RPC a execução incremental
`5f8f017e-2c6a-4554-8d8b-5984b84db6ce`, com nove itens. Sem chamada manual ao
dispatcher, ela atingiu `success`, promoveu 282 registros, recebeu 67 itens de
origem, processou nove páginas e marcou a paginação como completa.

O contrato do gatilho está em
`supabase/tests/109_hubspot_dispatch_autostart_and_continuation.sql` e confirma
existência, escopo privado e ausência de `EXECUTE` direto para `authenticated` e
`service_role`.

## Limites conhecidos

- O reenvio automático preserva os limites de retentativa existentes. Falhas
  transitórias que entrem em backoff continuam visíveis no histórico; não são
  escondidas como sucesso.
- O valor de reabertura pode ser zero em um intervalo sem tickets reabertos. O
  estado do KPI agora é `available` porque a evidência nativa cobre a base, não
  porque um número foi inferido.
