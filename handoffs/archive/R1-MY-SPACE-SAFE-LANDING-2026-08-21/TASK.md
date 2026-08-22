# TASK

- Task ID: `R1-MY-SPACE-SAFE-LANDING-2026-08-21`
- State: READY_FOR_REVIEW
- Owner: Sentinel
- Role: REVIEWER
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Coordinator: Codex
- Approval: APPROVED
- Base SHA: `cce0fdd`

## Objetivo

Consolidar `Meu Espaço` como safe landing universal para todo usuário interno
autenticado, oferecendo uma superfície permitida e um retorno seguro quando a
rota solicitada estiver indisponível ou não autorizada.

## Escopo

Validar e implementar somente o fluxo existente de landing, fallback, retorno
de Acesso Negado e contexto de permissões, usando os contratos e guards reais.
Cobrir sessão autenticada, rota sem autorização, rota não publicada, ausência
de workspace, loading, erro e vazio sem loops.

Allowlist mínima: runtime existente de auth/landing/navigation diretamente
relacionado, testes focados e handoffs. Não redesenhar shell global.

## Fora do escopo

Não alterar backend, RLS, RPC, migrations, grants, policies, secrets,
integrações, produção ou rotas externas. Não inventar workspace, permissão ou
dados; o fallback deve usar somente superfícies efetivamente permitidas.

## Critérios de aceite

- usuário autenticado sempre recebe landing válida ou estado explícito;
- Acesso Negado oferece retorno para uma superfície permitida;
- fallback não cria loop nem libera rota não autorizada;
- menu, guard e landing permanecem alinhados;
- estados loading/error/empty são cobertos;
- testes e limitações autenticadas registrados para revisão independente.
