# Task

## Task ID

OVERVIEW-SNAPSHOT-FLOW-2026-08-21

## Título

Separar Agora de No período na Visão Geral

## Estado

APPROVED / FINALIZE_LOCAL

## Contexto

A Visão Geral apresenta simultaneamente indicadores de movimento no período e
uma faixa de posição atual. O contrato visual declara que a posição atual não é
afetada pelo recorte selecionado, mas o caminho executivo atual envia o mesmo
período para o snapshot e deriva os dois blocos da mesma resposta.

## Objetivo

Garantir que indicadores de posição atual permaneçam estáveis quando o usuário
troca o período histórico, enquanto os indicadores de fluxo continuem
respondendo ao recorte. Dimensões que não possuem contrato para a posição atual
devem permanecer explicitamente indisponíveis, sem inventar filtros locais.

## Escopo

- investigar o RPC executivo, o snapshot da Visão Geral, o mapeamento e o
  consumo dos blocos Agora/No período;
- separar a consulta ou composição de posição atual da consulta histórica,
  reutilizando contratos backend existentes quando possível;
- preservar a semântica de operação, autorização, tenant, fonte e estados
  explícitos onde houver suporte contratual;
- adicionar contra-testes para troca de período e para dimensões não aplicáveis.

## Fora de escopo

- alterar fórmulas de KPIs comerciais, suporte, financeiro ou Customer Success
  sem evidência específica deste lote;
- criar tabela, integração, catálogo ou regra frontend paralela;
- mudar permissões, RLS, release surface, rotas ou integrações externas;
- corrigir findings não relacionados.

## Requisitos de aceitação

1. A posição atual não pode depender de `from/to` histórico quando a fonte a
   define como posição corrente.
2. Os indicadores de movimento continuam respeitando o período selecionado.
3. Uma troca de período deve ter teste comportamental que prove a separação.
4. Filtros de operação só podem afetar dimensões cujo contrato os suporte;
   dimensões não aplicáveis devem permanecer indisponíveis ou explicitamente
   globais.
5. Tenant isolation, autorização, fonte backend e estados de indisponibilidade
   devem ser preservados.
6. Não mascarar ausência de dados com zeros artificiais.

## Documentos normativos aplicáveis

- `AGENTS.md`
- `docs/PROJECT_STATE.md`
- `docs/README.md`
- `docs/ANALYTICS_METRIC_CATALOG_V1.md`
- `docs/VIEW_RPC_CONTRACTS.md`
- `docs/engineering/REVIEW_PROTOCOL.md`
- `handoffs/README.md`

## Base e autorização

- Base commit SHA: `5bf4cc3caab4f6487b0733eeac81e92d7dd176b0`
- Branch: `main`
- Owner: Forge
- Reviewer active: Sentinel
- Approval: APPROVED na fila canônica
- Dependências: `DATA-TEMPORAL-SEMANTICS-2026-08-21`, DONE.

## Allowlist refinada após investigação

1. `apps/web/src/features/analytics/analytics-api.ts`
2. `apps/web/src/features/analytics/analytics-ceo-snapshot.mjs`
3. `apps/web/src/features/analytics/analytics-ceo-snapshot.d.mts`
4. `tests/scripts/analytics-ceo-snapshot.test.mjs`
5. `handoffs/current/TASK.md`
6. `handoffs/current/IMPLEMENTATION.md`
7. `handoffs/current/REVIEW.md`
8. `handoffs/current/STATUS.md`
9. `handoffs/README.md`

A investigação confirmou que os RPCs existentes aceitam datas nulas. Por isso,
`AnalyticsCeoPage.tsx`, `analytics-model.ts`, migration e teste pgTAP não foram
alterados nem incluídos neste lote. Não absorver alterações preexistentes.

## Task ID

COMMERCIAL-OWNER-STAGE-2026-08-21

## Título

Corrigir filtro de estágio por responsável

## Estado

READY_FOR_IMPLEMENTATION

## Contexto

O snapshot comercial aplica corretamente a conjunção de filtros de período,
responsável e estágio aos dados. Porém, a tela monta as opções de estágio a
partir do funil já filtrado. Ao selecionar um responsável, stages que existem
no catálogo operacional, mas não aparecem na combinação atual, desaparecem do
filtro; se um stage previamente selecionado não for compatível com o novo
responsável, o recorte pode ficar vazio sem deixar claro que o catálogo foi
reduzido pelo filtro anterior.

## Objetivo

Preservar as opções de stage compatíveis com a operação e os pipelines
selecionados quando o usuário filtra por responsável, mantendo a conjunção
`owner + stage` na consulta dos dados. A ausência de dados para uma combinação
deve permanecer explícita, não ser mascarada pela remoção silenciosa da opção.

## Escopo

- investigar o caminho executável da tela comercial, do filtro ao RPC e ao
  mapeamento do funil;
- separar o catálogo de stages da consulta de dados filtrada por responsável e
  estágio, reutilizando o RPC e contratos existentes;
- adicionar teste comportamental para troca de responsável, stage compatível e
  combinação sem dados;
- preservar operação, pipeline excluído, período, tenant, autorização e o
  payload publicado.

## Fora de escopo

- alterar a fórmula ou a fonte dos KPIs comerciais;
- criar tabela, RPC ou catálogo paralelo sem evidência de necessidade;
- mudar permissões, RLS, integrações externas ou release surface;
- redesenhar a tela ou corrigir findings não relacionados.

## Requisitos de aceitação

1. O catálogo de stages não deve desaparecer apenas porque um responsável foi
   selecionado.
2. Os dados exibidos devem continuar obedecendo simultaneamente aos filtros de
   responsável e stage.
3. Uma combinação sem dados deve resultar em estado vazio explícito, sem
   remover ou reinterpretar silenciosamente o stage.
4. A compatibilidade operação → pipeline → stage e a exclusão de pipelines
   devem permanecer preservadas.
5. O teste deve cobrir uma regressão em que o stage existe no catálogo, mas não
   possui registros para o responsável escolhido.
6. Não introduzir regra frontend que substitua autorização ou fonte backend.

## Documentos normativos aplicáveis

- `AGENTS.md`
- `docs/PROJECT_STATE.md`
- `docs/README.md`
- `docs/ANALYTICS_METRIC_CATALOG_V1.md`
- `docs/VIEW_RPC_CONTRACTS.md`
- `docs/engineering/REVIEW_PROTOCOL.md`
- `handoffs/README.md`

## Base e autorização

- Base commit SHA: `63efe05f566dd63a2a74e7d4089abf14fa381373`
- Branch: `main`
- Owner: Forge
- Reviewer active: Sentinel
- Approval: APPROVED na fila canônica
- Dependência: `DATA-PIPELINE-STAGE-SCOPE-2026-08-21`, DONE.

## Allowlist inicial

1. `apps/web/src/features/analytics/AnalyticsCommercialPage.tsx`
2. `apps/web/src/features/analytics/analytics-stage-scope.mjs`
3. `apps/web/src/features/analytics/analytics-stage-scope.d.mts`
4. `tests/scripts/analytics-stage-scope.test.mjs`
5. `handoffs/current/TASK.md`
6. `handoffs/current/IMPLEMENTATION.md`
7. `handoffs/current/REVIEW.md`
8. `handoffs/current/STATUS.md`
9. `handoffs/README.md`

A allowlist pode ser refinada em `IMPLEMENTATION.md` somente se a investigação
demonstrar que outro arquivo do mesmo contrato é indispensável. Não absorver
alterações preexistentes do worktree.
