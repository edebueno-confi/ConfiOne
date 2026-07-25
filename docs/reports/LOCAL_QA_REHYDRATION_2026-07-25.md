# LOCAL-QA-01.1 â€” ReidrataÃ§Ã£o automÃ¡tica do Supabase local

## Resultado

Ambiente local QA reidratÃ¡vel, protegido contra remoto, com cinco usuÃ¡rios locais, trÃªs empresas sintÃ©ticas, tickets e dados analÃ­ticos sintÃ©ticos. A hidrataÃ§Ã£o usa uma Ãºnica sessÃ£o PostgreSQL com `BEGIN/COMMIT`; Auth Ã© provisionado antes em etapa compensÃ¡vel.

## Contagens verificadas

5 usuÃ¡rios, 3 tenants, 18 tickets, 6 recebÃ­veis `local_qa_finance`, 3 deals, 3 tickets HubSpot sintÃ©ticos, 0 registros OMIE externos e 0 schedules ativos.

## CenÃ¡rios e seguranÃ§a

Os cenÃ¡rios `baseline`, `empty`, `partial`, `stale`, `unavailable` e `zero-real` sÃ£o determinÃ­sticos, locais, reversÃ­veis por hidrataÃ§Ã£o e nÃ£o executam sincronizaÃ§Ã£o externa. Nenhuma credencial, token, JWT, payload real ou migration remota foi usado.

## ValidaÃ§Ãµes

Dois resets completos, hidrataÃ§Ã£o repetida, smoke Playwright das cinco personas em desktop/mobile, smoke JWT, testes Node, secret scan e `supabase:verify` passaram. O lint DB passou com avisos histÃ³ricos de variÃ¡veis nÃ£o lidas.

## DocumentaÃ§Ã£o relacionada

Runbook, matriz de permissÃµes, inventÃ¡rio, smoke browser e higiene de credenciais estÃ£o em `docs/runbooks/LOCAL_QA_ENVIRONMENT.md` e `docs/reports/local-qa/`.