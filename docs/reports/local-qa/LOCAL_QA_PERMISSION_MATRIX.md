# LOCAL-QA-01.1 — Matriz de permissões

| Perfil | Papel global | Tenants | Escopo validado |
|---|---|---|---|
| `platform_admin` | `platform_admin` | todos | Dashboard, configuração, logs, usuários, roles e operações administrativas |
| `dashboard_viewer` | `dashboard_viewer` | nenhum membership | somente `/admin/analytics`; sem configuração, logs, integração, exportação ou chamadas administrativas |
| `support_manager` | `support_manager` | Aurora, Horizonte, Atlas | fila e operações de suporte; sem configuração, secrets e schedules |
| `support_agent` | `support_agent` | Aurora, Horizonte | fila e operações permitidas; Atlas, tenant management, configuração e logs administrativos bloqueados |
| `customer_user` | sem papel global | somente Aurora | portal e tickets próprios; notas internas, tenants externos e rotas internas bloqueados |

Raw tables, service role e credenciais externas não são expostos aos perfis. A matriz foi exercitada por smoke browser e chamadas REST/RPC com JWT real; writes locais foram reidratados após o teste.
