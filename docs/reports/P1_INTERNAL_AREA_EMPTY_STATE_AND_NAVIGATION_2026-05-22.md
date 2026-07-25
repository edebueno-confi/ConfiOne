# P1-D - Internal Area Empty State + Navigation Hardening

Data: 2026-05-22
Branch: `codex/p1-d-internal-area-empty-state-navigation`

## Sumário

O lote corrigiu o risco deixado pelo P1-C: membro de área interna com membership ativo, mas sem acionamentos visíveis, não podia ser diferenciado de usuário sem workspace autorizado quando o redirect usava apenas a fila `vw_internal_action_queue_by_area`.

A correção criou o read model `vw_internal_action_area_auth_context`, que expõe somente contexto mínimo de membership ativo por tenant/área e contagem operacional. A fila continua sendo o read model de itens; o contexto passa a ser a prova backend-safe de que o usuário tem workspace de área interna mesmo quando a fila está vazia.

## Auditoria inicial

1. Membro com membership e zero acionamentos: a fila retornava zero linhas, então o redirect podia ignorar `/internal-actions`.
2. Usuário sem membership: a mesma fila retornava zero linhas, indistinguível do caso autorizado sem demanda.
3. A view de fila não diferenciava “sem itens” de “sem acesso”.
4. O frontend tinha empty state, mas a copy misturava vazio operacional com orientação para confirmar membership.
5. A navegação habilitava `Acionamentos` para suporte dentro do shell operacional, mesmo quando o usuário não tinha membership de área.
6. O estado vazio não era específico para área sem demanda.
7. O CTA seguro ficou restrito a atualizar a fila; não foi criado botão de criação ou ação fake.

## Contrato criado

- `vw_internal_action_area_auth_context`

Campos principais:
- `tenant_id`
- `tenant_slug`
- `tenant_display_name`
- `area_key`
- `area_label`
- `role`
- `status`
- `visible_open_action_count`
- `can_view_queue`

Regras:
- retorna somente memberships ativos do usuário autenticado;
- exige profile ativo, tenant membership ativo e área ativa;
- não expõe tickets, conversas, notas internas, storage, audit bruto ou dados do portal;
- não cria RPC nova;
- não altera `ticket.status`.

## Frontend

- `resolvePostLoginRedirect` passou a consultar `vw_internal_action_area_auth_context` para reconhecer workspace de área interna.
- `/internal-actions` carrega contexto de área e fila em paralelo.
- Membro autorizado sem itens vê: “Nenhum acionamento pendente para sua área.”
- Usuário sem membership e sem contexto é redirecionado para `/access-denied`.
- A navegação interna só habilita `Acionamentos` quando há `platform_admin`, rota atual autorizada ou contexto de área interna retornado pelo backend.

## Fixture QA

Usuários relevantes:

- `qa.local.internal-area-member@genius.local` / `LOCAL_QA_INTERNAL_AREA_MEMBER_PASSWORD`
  - membership: `finance`
  - esperado: vê fila com acionamentos persistidos
- `qa.local.internal-area-empty@genius.local` / `LOCAL_QA_INTERNAL_AREA_EMPTY_PASSWORD`
  - membership: `operations`
  - esperado: cai em `/internal-actions` e vê empty state honesto
- `qa.local.internal-area-non-member@genius.local` / `LOCAL_QA_INTERNAL_AREA_NON_MEMBER_PASSWORD`
  - sem membership de área
  - esperado: `/access-denied`, sem empty state enganoso
- `qa.local.support-manager-a@genius.local` / `LOCAL_QA_SUPPORT_MANAGER_PASSWORD`
  - esperado: landing em `/support/queue`; sem fila interna se não tiver membership
- `qa.local.platform-admin@genius.local` / `LOCAL_QA_ADMIN_PASSWORD`
  - esperado: comportamento administrativo preservado

## Rotas a validar

- `/login`
- `/internal-actions`
- `/internal-actions/:actionId`
- `/access-denied`
- `/support/queue`

## Boundary

- Empty state não substitui access denied.
- Support não ganha acesso à fila interna por estar no shell operacional.
- Internal Actions não aparecem no Portal Cliente.
- Internal Actions não alteram `ticket.status`.
- Não houve bridge automática com `engineering_work_items`.
- PNGs de blueprint ficaram fora do lote.

## Validações

Executadas no fechamento:

- `npm run contracts:typecheck` - PASS
- `npm run web:typecheck` - PASS
- `npm run web:build` - PASS
- `npm run supabase:lint:db` - PASS
- `npm run supabase:test:db` - PASS, 43 arquivos e 892 testes
- `npm run supabase:qa:local-functional-fixture` - PASS
- segunda execução de `npm run supabase:qa:local-functional-fixture` - PASS, IDs estáveis e fixture idempotente

Smoke browser autenticado:

- `internal_area_member` entrou em `/internal-actions/:actionId`, viu fila com 2 itens e detalhe do acionamento.
- `internal_area_empty` entrou em `/internal-actions`, viu empty state “Nenhum acionamento pendente para sua área.”, com área `Operações` e sem `/access-denied`.
- `internal_area_non_member` caiu em `/access-denied`; acesso direto a `/internal-actions` também redirecionou para `/access-denied`.
- `support_manager` caiu em `/support/queue`; acesso direto a `/internal-actions` redirecionou para `/access-denied`.
- `platform_admin` preservou landing em `/admin/tenants` e acesso direto a `/internal-actions`.
- Viewport principal: `1366x768`; `/internal-actions` sem scroll global após incluir a rota no shell operacional.
- Console browser: sem erros relevantes no fechamento do smoke.

## Riscos restantes

- QA browser autenticado depende do runtime local estar estável após a fixture.
- O script legado de suporte ainda pode emitir warning `DEP0190`.
- A navegação interna ainda usa leitura assíncrona no shell; em rede lenta, o item `Acionamentos` pode aparecer desabilitado até o contexto carregar.
