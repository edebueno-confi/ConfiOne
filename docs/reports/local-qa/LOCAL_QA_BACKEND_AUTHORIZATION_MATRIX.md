# LOCAL-QA-01.2 — Matriz backend com JWT

O smoke backend agora usa uma matriz declarativa por perfil, recurso, método, endpoint, status esperado, quantidade esperada, status real, quantidade real e resultado. Divergência encerra o comando com falha.

## Cobertura

- tenants e memberships;
- tickets, mensagens públicas e notas internas;
- schedule bruto e read model;
- configuração de integração;
- snapshot Analytics;
- ticket permitido e ticket de outro tenant;
- RPCs de resposta pública e nota interna.

## Política de schedule

`platform_admin` lê o singleton bruto; `service_role` mantém acesso operacional. `dashboard_viewer`, `support_manager`, `support_agent` e `customer_user` recebem zero linhas por RLS e não emitem request de schedule na UI. RPCs de mutação exigem o gate administrativo `app_private.can_manage_analytics_schedule()`.

JWTs nunca são impressos. A execução final teve todas as assertions aprovadas.
