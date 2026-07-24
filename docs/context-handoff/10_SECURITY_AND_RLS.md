# Security and RLS

## Regras canônicas

- Backend valida permissões.
- Frontend não infere autorização.
- Dado sensível exige RLS/read model seguro.
- Ações administrativas passam por RPCs auditáveis.
- `platform_admin` não elimina necessidade de auditoria.
- Secrets, tokens, service roles, cookies e `.env` não devem ser enviados ao chat.

## Evidências

- 156 policies e 103 habilitações de RLS em migrations.
- Testes pgTAP incluem fases de identity/tenancy/RLS, hardening de functions e controle administrativo.
- `AUTH_CONTEXT_STRATEGY.md` define separação entre Admin Console e Portal Cliente.
- Edge Functions usam secrets via `rpc_service_get_managed_integration_secret` em integrações.

## Pontos de atenção

- O pacote não inspecionou secrets nem `.env`, por regra de segurança.
- Worktree sujo impede afirmar que todo contrato novo está commitado.
- O contexto de acesso por telas e papéis precisa de validação ponta a ponta antes de publicar o shell amplo.

## Recomendações

1. Rodar suíte completa DB local antes de qualquer release.
2. Validar `dashboard_viewer`, admin, CS e suporte com usuários distintos.
3. Não ativar scheduler remoto sem revisar secrets, consumo de API e logs.
