# TASK

- Task ID: `OVERVIEW-GOVERNANCE-DENSITY-2026-08-21`
- State: `COMPLETED`
- Owner: `Forge`
- Role: `EXECUTOR`
- Reviewer active: `Sentinel`
- Review mode: `SENTINEL_REQUIRED`
- Approval: `APPROVED`
- Base SHA: `a1265a80f98095c56a60355327f7f06dd1912cd9`
- Implementation SHA: `UNCOMMITTED_WORKTREE`
- Final commit SHA: `60bff9577de1bb4477d096e2989dae3d392df782`

## Objetivo

Reorganizar a Visão Geral para que Atenção, governança/cobertura e sinais
gerenciais tenham hierarquia clara, removendo ruído técnico sem eliminar
informação operacional acionável.

## Escopo autorizado

- Auditar a composição atual de `AnalyticsCeoPage` e seus testes de contrato.
- Ajustar a hierarquia e os rótulos da superfície executiva dentro do padrão
  visual existente.
- Manter a separação entre posição atual e desempenho no período.
- Manter as fontes, read models, fórmulas, filtros, estados de ausência,
  cobertura, permissões e links existentes.
- Atualizar testes focados somente quando a estrutura ou o texto aprovado da
  Visão Geral mudar.
- Registrar no `IMPLEMENTATION.md` a evidência de que nenhum KPI foi
  recalculado no frontend.

## Fora de escopo

- Alterar RPCs, views, migrations, RLS, contratos de dados ou integrações.
- Criar métricas, fontes, cálculos locais ou dados de preenchimento.
- Implementar Produto/Desenvolvimento, GitHub, releases, deploys ou ambientes.
- Redesenhar o shell global, navegação, outras áreas ou blueprints aprovados.
- Alterar secrets, fazer push, merge, deploy, publicação ou escrita externa.

## Critérios de aceitação

1. A Visão Geral distingue visualmente posição atual, desempenho do período,
   Atenção e governança/cobertura.
2. Sinais gerenciais acionáveis permanecem acessíveis e não são confundidos
   com diagnóstico técnico de fonte.
3. O ranking ou detalhe técnico que não for necessário à decisão executiva é
   removido da hierarquia principal ou explicitamente rebaixado, sem apagar a
   fonte operacional correspondente.
4. Estados `Indisponível`, `parcial`, `sem registros` e cobertura continuam
   explícitos; ausência nunca vira zero.
5. Filtros continuam precedendo os indicadores que governam e os testes
   focados, typecheck, build, lint aplicável, `review:gates` e
   `git diff --check` são registrados.
6. A entrega para Sentinel ocorre com `State = READY_FOR_REVIEW` e
   `Owner = Sentinel`.

## Allowlist do lote

- `apps/web/src/features/analytics/AnalyticsCeoPage.tsx`
- `apps/web/src/features/analytics/analytics-board.css`
- `apps/web/src/features/analytics/high-density.css`
- `tests/scripts/dashboard-02-executive.test.mjs`
- `tests/scripts/mvp-ux-02-executive-integrated.test.mjs`
- `tests/scripts/analytics-layout-structure.test.mjs`
- `handoffs/current/TASK.md`
- `handoffs/current/IMPLEMENTATION.md`
- `handoffs/current/REVIEW.md`
- `handoffs/current/STATUS.md`
- `handoffs/README.md`

Arquivos da allowlist só devem ser alterados se a evidência do lote exigir.
Qualquer arquivo fora dela exige decisão de escopo antes de inclusão.
