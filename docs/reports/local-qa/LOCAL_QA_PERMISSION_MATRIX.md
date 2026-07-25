# LOCAL-QA-01.1 â€” Matriz de permissÃµes

| Perfil | Papel global | Tenants | Escopo validado |
|---|---|---|---|
| `platform_admin` | `platform_admin` | todos | Dashboard, configuraÃ§Ã£o, logs, usuÃ¡rios, roles e operaÃ§Ãµes administrativas |
| `dashboard_viewer` | `dashboard_viewer` | nenhum membership | somente `/admin/analytics`; sem configuraÃ§Ã£o, logs, integraÃ§Ã£o, exportaÃ§Ã£o ou chamadas administrativas |
| `support_manager` | `support_manager` | Aurora, Horizonte, Atlas | fila e operaÃ§Ãµes de suporte; sem configuraÃ§Ã£o, secrets e schedules |
| `support_agent` | `support_agent` | Aurora, Horizonte | fila e operaÃ§Ãµes permitidas; Atlas, tenant management, configuraÃ§Ã£o e logs administrativos bloqueados |
| `customer_user` | sem papel global | somente Aurora | portal e tickets prÃ³prios; notas internas, tenants externos e rotas internas bloqueados |

Raw tables, service role e credenciais externas nÃ£o sÃ£o expostos aos perfis. A matriz foi exercitada por smoke browser e chamadas REST/RPC com JWT real; writes locais foram reidratados apÃ³s o teste.