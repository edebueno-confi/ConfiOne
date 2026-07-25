# LOCAL-QA-01 — Resultados de verificação

## Execuções

- `npm run local:qa:reset`: passou após reset local, hidratação e verificação.
- `npm run local:qa:hydrate`: passou duas vezes sem duplicação.
- `npm run local:qa:verify`: passou após a primeira hidratação, após a repetição e após o segundo reset.
- `npm run local:qa:smoke`: cinco logins locais passaram.
- Proteção remota: localhost e `127.0.0.1` permitidos; URL remota, project ref remoto e confirmação ausente bloqueados.

## Contagens estáveis

| Recurso | Contagem |
|---|---:|
| Usuários obrigatórios | 5 |
| Empresas/tenants QA | 3 |
| Tickets | 18 |
| Recebíveis `local_qa_finance` | 6 |
| Deals | 3 |
| Tickets HubSpot sintéticos | 3 |
| Schedules ativos | 0 |

## Limites

O smoke executado nesta etapa valida autenticação e estado do backend local. Não foram executadas chamadas externas, sincronizações HubSpot/OMIE, migration remota, deploy ou browser smoke completo.
