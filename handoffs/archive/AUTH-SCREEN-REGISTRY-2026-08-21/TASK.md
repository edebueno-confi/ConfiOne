# TASK

- Task ID: `AUTH-SCREEN-REGISTRY-2026-08-21`
- State: READY_FOR_REVIEW
- Owner: Sentinel
- Role: REVIEWER
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Coordinator: Codex
- Approval: APPROVED
- Base SHA: `56b8119`

## Objetivo

Consolidar factual e documentalmente `domain -> screen -> route -> capabilities`
a partir da aplicação real, distinguindo publicação, menu, guard e backend.

## Escopo autorizado

- Reconciliar manifesto de release, rotas, telas, menu, guards, contratos,
  views/RPCs, capabilities, migrations e testes em documentação canônica.
- Registrar divergências, ausências, estados e dependências sem inventar telas,
  áreas, capabilities ou permissões.
- Atualizar somente documentação allowlisted e handoffs/current.

## Fora de escopo

- Alterar runtime, router, menu, guards, contratos executáveis, RPCs, views,
  policies, grants, migrations, RLS, schemas, seeds, banco ou integrações.
- Criar registry executável, regra local, simplificação de autorização ou
  promover task seguinte.
- Secrets, produção, deploy, push, merge, migrations remotas e escritas externas.

## Critérios de aceite

1. Cada item factual aponta para código, contrato, migration ou teste.
2. Publicação, menu, guard e backend são descritos separadamente.
3. Ausências e divergências são classificadas como lacuna, hipótese ou decisão.
4. `docs:validate`, auditoria de governança, `review:gates` quando aplicável e
   `git diff --check` passam.

## Transferência

Forge manteve IMPLEMENTATION.md atualizado, entregou READY_FOR_REVIEW com
Owner Sentinel e avisou Sentinel e Codex. REVIEW.md não foi alterado pelo
executor.
