# P1 Integration Baseline Check - 2026-05-23

## Objetivo

Verificar se os lotes recentes de Customer Account UX, Auth Redirect by Role, Internal Area Empty State e Support Workspace Visual Blueprint Alignment convivem sem conflito funcional, visual, documental ou de QA antes de iniciar nova frente de produto.

## Branches analisadas

- Branch inicial: `codex/support-workspace-visual-blueprint-alignment`
- Branch de integração criada: `codex/p1-integration-baseline-check`
- Worktree inicial: limpo

## Commits verificados

### P1-B Customer Account UX + Authenticated QA

- `1d791139 fix: ajustar UX operacional de customer account`
- `6ca57cc0 test: reforcar QA autenticado de customer account`
- `3565289b docs: registrar QA operacional de customer account`

Contenção verificada:
- `codex/p1-b-customer-account-ux-authenticated-qa`
- `codex/p1-c-auth-redirect-by-role`
- `codex/p1-d-internal-area-empty-state-navigation`
- `codex/support-workspace-visual-blueprint-alignment`
- `codex/p1-integration-baseline-check`

### P1-C Auth Redirect by Role

- `51b47b0d fix: corrigir redirect pós-login por papel`
- `d83722f4 docs: registrar matriz de redirect autenticado`

Contenção verificada:
- `codex/p1-c-auth-redirect-by-role`
- `codex/p1-d-internal-area-empty-state-navigation`
- `codex/support-workspace-visual-blueprint-alignment`
- `codex/p1-integration-baseline-check`

### P1-D Internal Area Empty State + Navigation

- `c29bf72c fix: ajustar estado vazio de acionamentos internos`
- `a935548c test: cobrir fila interna sem acionamentos`
- `741caf9d docs: registrar QA de navegação de acionamentos internos`

Contenção verificada:
- `codex/p1-d-internal-area-empty-state-navigation`
- `codex/support-workspace-visual-blueprint-alignment`
- `codex/p1-integration-baseline-check`

### Support Workspace Visual Blueprint Alignment

- `bf2fd027 feat(support): align workspace visuals with operational blueprint contracts`

Contenção verificada:
- `codex/support-workspace-visual-blueprint-alignment`
- `codex/p1-integration-baseline-check`

## Integração

Nenhum cherry-pick ou merge foi necessário. A branch inicial já continha todos os commits solicitados em ordem linear:

1. P1-B Customer Account UX
2. P1-C Auth Redirect by Role
3. P1-D Internal Area Empty State
4. Support Workspace Visual Blueprint Alignment

Não houve conflito.

## Arquivos com risco de sobreposição avaliados

- `apps/web/src/features/support/SupportWorkspacePage.tsx`
- `apps/web/src/features/login/LoginPage.tsx`
- `apps/web/src/features/login/post-login-redirect.ts`
- `apps/web/src/features/internal-actions/InternalActionsWorkspacePage.tsx`
- `apps/web/src/features/admin/TenantsPage.tsx`
- `apps/web/src/features/customer-portal/CustomerPortalPage.tsx`
- `apps/web/src/index.css`
- `docs/PROJECT_STATE.md`
- `docs/DOCUMENTATION_LEDGER.md`

Resultado: os arquivos sensíveis existem no histórico integrado, mas o baseline atual compila, testa e opera com os papéis QA principais. Não foi detectado conflito funcional ou visual bloqueante nesta validação.

## Validações executadas

- `npm run contracts:typecheck`: PASS
- `npm run web:typecheck`: PASS
- `npm run web:build`: PASS
- `npm run supabase:lint:db`: PASS
- `npm run supabase:test:db`: PASS, 43 arquivos, 892 testes
- `npm run supabase:qa:local-functional-fixture`: PASS

Observação: a fixture funcional local continua lenta, mas concluiu com sucesso e imprimiu usuários, senhas, tenant, ticket, internal actions e work item.

## Usuários QA usados

- `platform_admin`: `qa.local.platform-admin@genius.local` / `Local-QA-Admin-2026!`
- `support_manager`: `qa.local.support-manager-a@genius.local` / `Local-QA-Manager-A-2026!`
- `support_agent`: `qa.local.support-agent-a@genius.local` / `Local-QA-Agent-A-2026!`
- `internal_area_member`: `qa.local.internal-area-member@genius.local` / `Local-QA-Internal-Area-2026!`
- `internal_area_empty`: `qa.local.internal-area-empty@genius.local` / `Local-QA-Internal-Empty-2026!`
- `internal_area_non_member`: `qa.local.internal-area-non-member@genius.local` / `Local-QA-Internal-NoArea-2026!`
- `engineering_member`: `qa.local.engineering-member-a@genius.local` / `Local-QA-Engineering-A-2026!`
- `customer_user`: `marina.ops@support-qa-a.local` / `Local-QA-Customer-A-2026!`
- `customer_manager`: `gestao.portal@support-qa-a.local` / `Local-QA-Customer-Manager-A-2026!`

## IDs usados no smoke

- Tenant principal: `ba69ddb9-aa0c-4edc-b791-0c00db5e1f38`
- Ticket principal: `734a5b81-3123-435d-a4f7-f76092b79d08`
- Internal action aberta: `a0db3e33-db8c-4bcf-bfca-a0b53ce905c5`
- Work item de engenharia: `5aeaefb7-ce10-4bb6-8340-ca726a137231`
- Artigo portal/public help usado: `como-compartilhar-evidencias-em-um-ticket`

## Rotas testadas

### Admin

- `/admin/tenants`: PASS
- `/admin/customer-portal`: PASS
- `/admin/internal-areas`: PASS
- `/admin/knowledge`: PASS

Resultado: `platform_admin` redireciona para Admin e acessa rotas administrativas sem erro cru ou scroll horizontal global.

### Support

- `/support/queue`: PASS
- `/support/tickets/734a5b81-3123-435d-a4f7-f76092b79d08`: PASS
- `/support/customers`: PASS
- `/support/customers/ba69ddb9-aa0c-4edc-b791-0c00db5e1f38`: PASS

Resultado: `support_manager` redireciona para `/support/queue`; a fila, o ticket workspace, a lista de clientes e o cockpit do cliente carregam dados reais da fixture, sem scroll horizontal global, sem erro cru e sem exposição de storage path/token/secret. O ticket workspace preserva composer, ações rápidas e contexto visual do lote de blueprints.

### Support Agent

- Login `support_agent`: PASS
- Destino: `/support/queue`

### Internal Actions

- Login `internal_area_member`: PASS
- Destino: `/internal-actions/a0db3e33-db8c-4bcf-bfca-a0b53ce905c5`
- `/internal-actions`: PASS
- `/internal-actions/a0db3e33-db8c-4bcf-bfca-a0b53ce905c5`: PASS

Resultado: membro de área com itens acessa workspace/detalhe.

- Login `internal_area_empty`: PASS
- Destino: `/internal-actions`
- Empty state honesto: PASS
- Não cai em `/access-denied`: PASS

- Login `internal_area_non_member`: PASS
- Destino: `/access-denied`
- Acesso direto a `/internal-actions`: bloqueado
- Empty state enganoso: não exibido

### Engineering

- `/engineering`: PASS
- `/engineering/work-items/5aeaefb7-ce10-4bb6-8340-ca726a137231`: PASS

Resultado: `engineering_member` redireciona para `/engineering` e acessa detalhe técnico sem erro cru ou scroll horizontal global.

### Portal

- Login `customer_user`: PASS
- Destino: `/portal`
- `/portal`: PASS
- `/portal/tickets`: PASS
- `/portal/tickets/734a5b81-3123-435d-a4f7-f76092b79d08`: PASS
- `/portal/help`: PASS
- `/portal/help/como-compartilhar-evidencias-em-um-ticket`: PASS

Resultado: não foi detectado vazamento de nota interna, internal action, engenharia, audit bruto, storage path, bucket, token ou secret.

- Login `customer_manager`: PASS
- Destino: `/portal`

### Public Help

- `/help/genius`: PASS
- `/help/genius/articles`: PASS

Resultado: rotas públicas carregam sem erro cru, sem scroll horizontal global e sem sinais textuais de conteúdo interno/restricted/draft.

## Resultado por papel

- `platform_admin`: PASS
- `support_manager`: PASS
- `support_agent`: PASS
- `internal_area_member`: PASS
- `internal_area_empty`: PASS
- `internal_area_non_member`: PASS
- `engineering_member`: PASS
- `customer_user`: PASS
- `customer_manager`: PASS
- `public_anon`: PASS

## Conflitos encontrados

Nenhum conflito de Git, build, tipo, banco ou smoke autenticado foi encontrado.

## Riscos restantes

- A fixture funcional local permanece lenta e deve continuar sendo tratada como etapa de QA pesada, não como smoke rápido.
- O commit visual `bf2fd027` usa mensagem em inglês e tipo `feat(support)`, mas o histórico não foi reescrito por decisão de segurança.
- O smoke foi amplo, mas não substitui uma regressão manual profunda de todas as ações mutáveis, como envio de resposta, nota interna, alteração de status e mutações administrativas.
- O Support Workspace visual foi validado por sanity check funcional/visual, mas microajustes de conforto diário ainda dependem de revisão humana em uso real.

## Recomendação para próxima fase

O baseline P1 está pronto para abrir nova frente de produto a partir da branch `codex/p1-integration-baseline-check`.

Próximo lote recomendado: iniciar uma frente funcional pequena e isolada sobre uma rota/domínio único, mantendo este baseline como ponto de partida e preservando a disciplina de branch dedicada por foco.
