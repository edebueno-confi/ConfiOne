# LOCAL-QA-01.1 — Smoke browser real

## Execução

`npm run local:qa:smoke` inicia o Vite automaticamente, aguarda healthcheck, executa Playwright e encerra o processo. Foram validadas cinco personas em 1440×900 e 390×844.

## Resultado

- `platform_admin`: `/inicio`, áreas administrativas acessíveis conforme rota; sem erro funcional.
- `dashboard_viewer`: `/admin/analytics`; configuração, logs, integração, exportação e chamadas administrativas bloqueados.
- `support_manager`: fila e operações de suporte; configuração e schedules bloqueados.
- `support_agent`: escopo de Aurora/Horizonte; Atlas e gestão administrativa bloqueados.
- `customer_user`: `/portal`; rotas internas e tenants fora de Aurora bloqueados.
- Console errors, page errors, request failures e respostas inesperadas: zero no smoke final.
- Nenhum processo web órfão ficou ativo; porta liberada no `finally`.

Screenshots são geradas localmente em `output/local-qa/` e excluídas do Git.

