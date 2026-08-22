# TASK

# TASK

- Task ID: `AUTH-ADMIN-CONSOLE-SIMPLIFICATION-2026-08-21`
- State: READY_FOR_REVIEW
- Owner: Sentinel
- Role: REVIEWER
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Coordinator: Codex
- Approval: APPROVED
- Base SHA: `5529f00`

## Objetivo

Simplificar a linguagem da superfície administrativa de usuários e acessos,
sem unificar o modelo executável de permissões. A interface deve explicar a
hierarquia de acesso de forma compreensível quando houver dados reais para
fazê-lo, preservando as fontes e flags de autorização existentes.

## Allowlist mínima

- `apps/web/src/features/access/AccessPage.tsx`
- testes focados diretamente relacionados à superfície de acessos
- `handoffs/current/*`

Fora do escopo: migração estrutural, claims, scopes, policy IDs, RLS, RPC,
migrations, grants, secrets, integrações, produção, deploy, push, merge e
qualquer alteração ampla de permissões.

## Critérios

- linguagem da interface sem códigos técnicos, claims, scopes ou IDs de policy;
- distinguir somente conceitos que estejam presentes nos contratos atuais;
- explicar READ/WRITE apenas quando essa informação vier de fonte real;
- deny by default preservado pelo backend existente;
- não sugerir remoção do último administrador;
- tenant/área e auditoria permanecem derivados dos contratos existentes;
- testes focados e gates proporcionais registrados em IMPLEMENTATION.md.

## Decisão de escopo

OD-012 libera a execução restrita à UI. O runtime atual continua separando
`tenant_role`/tenant membership de memberships internas, perfis, screen grants
e capabilities. Não é permitido consolidar essas fontes nesta task.

O modelo executável Nível → Área → Tela → READ/WRITE fica registrado na task
futura `AUTH-ACCESS-MODEL-EXECUTABLE-2026-08-22`, ainda PROPOSED e sem
implementação.
