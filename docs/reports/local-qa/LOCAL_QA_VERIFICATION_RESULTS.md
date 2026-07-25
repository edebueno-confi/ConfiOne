# LOCAL-QA-01.1 â€” Resultados de verificaÃ§Ã£o

## ExecuÃ§Ãµes aprovadas

- `npm run local:qa:reset`: passou duas vezes, com hidrataÃ§Ã£o e verificaÃ§Ã£o.
- `npm run local:qa:hydrate`: passou repetidamente sem duplicaÃ§Ã£o.
- `npm run local:qa:verify`: passou com contagens baseline estÃ¡veis.
- `npm run local:qa:smoke`: cinco personas, desktop/mobile, navegaÃ§Ã£o e bloqueios de rota passaram sem erros funcionais.
- `node scripts/local-qa/backend-smoke.mjs`: REST/RPC com JWT real dos cinco usuÃ¡rios; writes locais reidratados depois.
- `npm run supabase:verify`: reset, 1.308 testes DB e verificaÃ§Ã£o de importaÃ§Ã£o passaram.
- `npm run local:qa:secret-scan`: 1.541 arquivos rastreados, zero matches.

## Contagens baseline

| Recurso | Contagem |
|---|---:|
| UsuÃ¡rios obrigatÃ³rios | 5 |
| Empresas/tenants QA | 3 |
| Tickets | 18 |
| RecebÃ­veis `local_qa_finance` | 6 |
| Deals | 3 |
| Tickets HubSpot sintÃ©ticos | 3 |
| Schedules ativos | 0 |

## Limites

NÃ£o foram executadas chamadas externas, sincronizaÃ§Ãµes HubSpot/OMIE, migration remota ou deploy. Os avisos do lint DB sÃ£o preexistentes e nÃ£o bloquearam o schema.