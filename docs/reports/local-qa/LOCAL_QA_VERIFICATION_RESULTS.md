# LOCAL-QA-01.2 — Resultados de verificação

## Execuções aprovadas

- `npm run supabase:db:reset`: passou com a migration de menor privilégio do schedule.
- `npm run local:qa:hydrate`: passou com baseline determinístico.
- `npm run local:qa:verify`: 5 usuários, 3 tenants, 18 tickets, 6 recebíveis, 3 deals, 3 tickets HubSpot e 0 schedules ativos.
- `node scripts/local-qa/backend-smoke.mjs`: matriz declarativa JWT com assertions de status e quantidade, todas aprovadas.
- `npm run local:qa:writes`: writes reais pela interface para manager, agent e customer, com reload e isolamento confirmados.
- `npm run local:qa:smoke`: cinco personas em 1440×900 e 390×844, sem erros de console, rede ou overflow.
- `npm run local:qa:secret-scan`: 1.548 arquivos rastreados, zero matches.

## Cenários

`baseline`, `empty`, `partial`, `stale`, `unavailable` e `zero-real` permanecem locais, sintéticos e reversíveis. Nenhuma sincronização HubSpot/OMIE, migration remota, deploy ou write externo foi executado.

## Limitações

A criação de ticket pelo customer não faz parte da superfície exercitada neste gate; a resposta em ticket próprio foi validada.
