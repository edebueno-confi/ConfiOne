# Personas, Roles and Permissions

## Perfis documentados

Conforme `AUTH_CONTEXT_STRATEGY.md`, há perfis conceituais:

- Internal Admin
- Support Agent
- Support Manager
- Engineering Member
- Engineering Manager
- Customer Contact
- Viewer/Auditor

## Papéis observados no frontend

`MinimalNavigationPermissions` usa:

- `isPlatformAdmin`
- `roles`
- `screenKeys`
- `hasDashboardViewerAccess`
- `hasInternalActionAreaAccess`
- `hasCsPortfolioAccess`

Papéis citados em navegação/contratos incluem `platform_admin`, `support_manager`, `support_agent`, `engineering_manager`, `engineering_member`, `knowledge_manager`, `audit_reviewer`.

## Estado atual

Permissões existem no backend e frontend, mas a experiência administrativa ainda precisa virar uma matriz operacional clara:

- Área de atuação.
- Função na área.
- Perfil base.
- Telas pré-selecionadas.
- Dependências de telas.
- Exceções personalizadas.

## Riscos

- Permissão por tela pode divergir de permissão por domínio se não houver contrato único.
- `platform_admin` não deve virar bypass sem auditoria.
- `dashboard_viewer` é útil para teste/release, mas precisa escopo explicitamente limitado.

## Decisão pendente

Definir matriz canônica de acesso por área e função antes de publicar o shell interno completo.
