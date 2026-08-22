# TASK

- Task ID: `AUTH-SECURITY-REGRESSION-2026-08-21`
- State: READY_FOR_REVIEW
- Owner: Sentinel
- Role: REVIEWER
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Coordinator: Codex
- Approval: APPROVED
- Base SHA: `f444a95`

## Objetivo

Validar a autorização efetiva e as regressões críticas do ConfiOne após a
consolidação de guards, fallback, inventário, contrato e salvaguardas.

## Escopo inicial

Executar somente testes e inspeções locais/read-only sobre bypass, cross-tenant,
WRITE, revogação, sessão stale, usuário desativado, último administrador,
menu/guard e fallback de acesso negado. Reconciliar resultados com contratos,
policies, RPCs, views e testes existentes.

Allowlist mínima:

- testes existentes diretamente relacionados;
- novos testes de regressão focados, se necessários;
- relatório documental da auditoria;
- `handoffs/current/*`.

## Fora do escopo

Não alterar permissões, policies, claims, scopes, capabilities, RLS, RPCs,
migrations, grants, secrets, banco, produção ou integrações. Não criar mocks
que substituam a autorização efetiva e não declarar cobertura não executada.

## Critérios de aceite

- matriz de cenários, expectativa, evidência e resultado;
- testes de segurança executados ou limitação explícita quando o ambiente não
  permitir a reprodução;
- separação entre falha confirmada, hipótese e ausência de cobertura;
- gates registrados e revisão independente do Sentinel.
