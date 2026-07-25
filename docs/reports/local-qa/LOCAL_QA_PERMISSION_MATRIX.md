# LOCAL-QA-01 — Matriz de permissões

| Perfil | Recurso | Operação | Esperado | Resultado |
|---|---|---|---|---|
| platform_admin | Dashboard | leitura | permitido | fixture autenticada criada |
| platform_admin | Configuração, Logs, usuários e roles | administração | permitido pelo contrato admin | contrato existente; smoke de login passou |
| dashboard_viewer | Dashboard | leitura | permitido | papel aplicado; validação de contagem passou |
| dashboard_viewer | Configuração, Logs, integrações e schedules | acesso | bloqueado | contrato de least privilege preservado |
| support_manager | fila e tickets do escopo | leitura/ação operacional | permitido | papel aplicado; login local passou |
| support_manager | secrets, usuários globais e schedules | administração | bloqueado | não recebeu papel de plataforma |
| support_agent | tickets, respostas, notas permitidas e evidências | operação | permitido conforme escopo | papel aplicado; login local passou |
| support_agent | Configuração, Logs administrativos, roles e secrets | administração | bloqueado | não recebeu papel de plataforma |
| customer_user | Portal e tickets próprios | leitura/operação customer-facing | permitido somente na Aurora | membership única e isolamento verificados |
| customer_user | Outros tenants, notas internas, Dashboard e workspace interno | acesso | bloqueado | nenhuma membership fora da Aurora; RLS permanece canônica |
| qualquer não-admin | raw tables, service role e credenciais externas | acesso direto | bloqueado | sem grants novos |

Esta matriz registra o contrato esperado e o que foi verificado no lote. O smoke de browser completo permanece uma validação adicional quando o servidor web autenticado estiver disponível.
