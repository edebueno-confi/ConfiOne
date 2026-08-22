# TASK

- Task ID: `AUTH-LEGACY-MIGRATION-SAFEGUARDS-2026-08-21`
- State: READY_FOR_REVIEW
- Owner: Sentinel
- Role: REVIEWER
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Coordinator: Codex
- Approval: APPROVED
- Base SHA: `a1c6993`

## Objetivo

Auditar e classificar o de-para entre usuários, memberships, perfis, áreas,
telas e capabilities existentes, definindo salvaguardas para eventual
normalização futura sem perda de acesso válido, escalada de privilégio,
remoção do último administrador ou inconsistência de sessão.

## Escopo desta fase

Somente leitura documental e inspeção de código, contratos, SQL, migrations,
policies, grants e testes existentes. Registrar evidências, divergências,
contraexemplos, riscos e pré-condições para uma futura implementação segura.

Allowlist mínima:

- `docs/specs/*` diretamente relacionado à autorização e migração;
- `docs/reports/*` diretamente relacionado à auditoria;
- `handoffs/current/*`;
- testes documentais/read-only diretamente relacionados, se necessários.

## Fora do escopo

Não alterar migrations, RLS, RPCs, grants, policies, claims, scopes,
capabilities, secrets, integrações, banco, produção ou dados. Não executar
normalização nem escrever em ambiente remoto ou local.

## Critérios de aceite

- matriz factual do de-para e das fontes de autoridade;
- identificação de perda de acesso, escalada, último administrador, tenant,
  área, stale e compatibilidade;
- salvaguardas e pré-condições para qualquer futura execução;
- revisão independente do Sentinel e separação explícita entre fato, hipótese
  e decisão pendente.
