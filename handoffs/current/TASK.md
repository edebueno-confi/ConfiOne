# TASK

- Task ID: `DASHBOARD-UX-DENSITY-2026-08-21`
- State: `READY_FOR_IMPLEMENTATION`
- Owner: `Forge`
- Role: `EXECUTOR`
- Reviewer active: `Sentinel`
- Review mode: `SENTINEL_REQUIRED`
- Approval: `APPROVED`
- Base SHA: `60bff9577de1bb4477d096e2989dae3d392df782`
- Current SHA: `UNCOMMITTED_WORKTREE`

## Objetivo

Refinar a densidade visual e a qualidade de decisão do Dashboard Gerencial,
partindo da hierarquia aprovada da Visão Geral e mantendo leitura clara em
desktop Full HD, sem redesign gratuito, preenchimento decorativo ou perda de
contexto operacional.

## Escopo autorizado

- Auditar a composição atual das superfícies analíticas e seus testes
  estruturais, com referência prioritária a 1920×1080.
- Ajustar somente espaçamento, composição, agrupamento visual e tipografia
  necessários para reduzir ruído e destacar a decisão principal.
- Preservar a hierarquia `Atenção executiva`, `Governança e cobertura`,
  `Atenção operacional` e `Fila operacional` aprovada no lote anterior.
- Preservar estados `Indisponível`, `parcial`, `sem registros`, cobertura,
  fontes, read models, fórmulas, filtros, permissões e links existentes.
- Atualizar testes focados somente para proteger a estrutura ou o layout
  realmente alterado.
- Registrar em `IMPLEMENTATION.md` qualquer limitação entre validação estática,
  build e renderização autenticada.

## Fora de escopo

- Alterar RPCs, views, migrations, RLS, contratos, integrações ou dados.
- Criar métricas, cálculos locais, fontes, mock data ou estados artificiais.
- Alterar a semântica dos KPIs, os rótulos aprovados ou o shell global.
- Implementar a documentação metodológica dos KPIs ou a exposição de contexto
  na interface; essas são tasks posteriores da fila.
- Fazer push, merge, deploy, publicação, alteração de secrets ou escrita externa.

## Critérios de aceitação

1. A composição da Visão Geral e das superfícies diretamente envolvidas mantém
   a hierarquia aprovada e melhora a leitura da decisão principal em 1920×1080.
2. O refinamento reduz espaçamento redundante ou ruído visual sem esconder
   fonte, cobertura, ausência, recorte temporal ou ação operacional.
3. A composição permanece responsiva nos breakpoints existentes e não cria
   overflow horizontal intencional ou navegação duplicada.
4. Nenhum KPI é recalculado no frontend e nenhum contrato de backend é alterado.
5. Testes focados, typecheck, build, lint aplicável, `review:gates` e
   `git diff --check` são executados e registrados.
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
