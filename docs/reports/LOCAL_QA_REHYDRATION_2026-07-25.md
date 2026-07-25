# LOCAL-QA-01 — Reidratação automática do Supabase local

## Resultado

Ambiente local QA reidratável implementado em branch própria, com proteção contra remoto, cinco usuários locais, três empresas sintéticas, tickets, dados comerciais e financeiros sintéticos, schedules externos desativados e verificação idempotente.

## Segurança

As senhas foram configuradas localmente e omitidas. O arquivo `.env.local.qa` é ignorado pelo Git. Nenhuma credencial, token, JWT, payload real, dado real de cliente ou migration remota foi usado.

## Contagens verificadas

5 usuários, 3 tenants, 18 tickets, 6 recebíveis `local_qa_finance`, 3 deals, 3 tickets HubSpot sintéticos e 0 schedules ativos.

## Scripts

- `npm run local:qa:reset`
- `npm run local:qa:hydrate`
- `npm run local:qa:verify`
- `npm run local:qa:smoke`
- `npm run local:qa:scenario -- baseline`

## Validações

Dois resets completos, hidratação repetida, verificação de contagens, login local dos cinco perfis e testes unitários do guard remoto passaram. O smoke browser completo não foi executado neste lote.

## Documentação

Runbook, matriz de permissões, inventário de fixtures e resultados detalhados estão em `docs/runbooks/LOCAL_QA_ENVIRONMENT.md` e `docs/reports/local-qa/`.
