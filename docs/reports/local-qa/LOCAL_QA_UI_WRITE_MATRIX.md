# LOCAL-QA-01.2 — Matriz de writes pela interface

| Perfil | Operação | Evidência | Persistência | Resultado |
|---|---|---|---|---|
| support_manager | atribuir ticket 17 | controle visual de responsável | confirmada após reload | PASS |
| support_manager | alterar status | painel visual de status | confirmada após reload | PASS |
| support_manager | nota interna | composer visual interno | confirmada | PASS |
| support_manager | resposta pública | composer visual público | confirmada | PASS |
| support_manager | upload sintético | `qa-local-e2e-evidence.txt` | storage local confirmado e baseline restaurado | PASS |
| support_agent | resposta pública em ticket permitido | composer visual público | confirmada após reload | PASS |
| customer_user | resposta em ticket próprio | composer do portal | confirmada após reload | PASS |

Os marcadores temporários `[QA E2E]` foram removidos pelo reset determinístico. Nenhum arquivo de evidência foi versionado.
