# LOCAL-QA-01.2 — Smoke browser real

`npm run local:qa:smoke` executou sessões isoladas de cinco personas em 1440×900 e 390×844.

- `platform_admin`: `/inicio` e áreas administrativas permitidas.
- `dashboard_viewer`: `/admin/analytics`; configuração e requests administrativos bloqueados.
- `support_manager`: fila operacional e rota permitida; configuração e schedule bruto bloqueados.
- `support_agent`: Aurora/Horizonte permitidos; Atlas e gestão administrativa bloqueados.
- `customer_user`: `/portal`; ticket próprio permitido, tenant externo e rotas internas bloqueados.

Console errors: 0. Page errors: 0. Request failures: 0. Respostas inesperadas 400/401/403/404/409/422/500: 0. Overflow horizontal: 0.

O classificador não trata mais qualquer `403` como esperado; somente operações explicitamente proibidas entram nessa categoria. As screenshots finais são geradas em `output/local-qa/` e permanecem fora do Git.
