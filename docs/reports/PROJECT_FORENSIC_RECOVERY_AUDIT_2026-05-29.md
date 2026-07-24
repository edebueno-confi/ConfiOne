# Project Forensic Recovery Audit 2026-05-29

## Resumo executivo

O repositório Genius Support OS foi retomado em `2026-05-29` com foco em status real, saneamento documental e roadmap, sem feature nova. A auditoria confirma que a base principal está estruturada como SaaS backend-first: frontend consome majoritariamente views/read models e RPCs; Supabase concentra regras de tenancy, RLS, audit, storage e workflows; e a documentação canônica existe, mas acumulou drift após vários lotes P4 e refactors visuais.

Status objetivo:
- Frontend compila e typecheck passa.
- Contracts typecheck passa.
- Build web passa.
- Supabase local não pôde ser validado neste ambiente porque Docker Desktop não está ativo.
- A frente visual preexistente `codex/p4-true-support-visual-refactor` foi classificada no lote `Worktree Visual/Blueprint Recovery Closure`: alterações em Support Workspace mantidas, blueprints reorganizados por domínio/estado e screenshots históricos restaurados.
- Não há evidência, nesta auditoria, de app lendo tabelas base críticas de ticketing diretamente; os acessos do frontend encontrados apontam para `vw_*`, RPCs e storage controlado.
- Há risco operacional em scripts legados de Knowledge com fallback literal de e-mail/senha local, mesmo com bloqueio `--local`.

## Branch usada

- Branch criada para este lote: `codex/project-forensic-recovery-audit`
- Branch anterior observada: `codex/p4-true-support-visual-refactor`
- HEAD inicial observado: `9fdc3e4 fix: corrigir fidelidade visual do support workspace`

## Estado git inicial

Modified preexistente:
- `apps/web/src/features/support/SupportWorkspacePage.tsx`
- `apps/web/src/features/support/components/SupportTicketAdvancedContextPanels.tsx`
- `apps/web/src/features/support/components/SupportTicketComposerSection.tsx`
- `apps/web/src/features/support/components/SupportTicketContextPanels.tsx`
- `apps/web/src/features/support/components/SupportTicketConversationSection.tsx`
- `apps/web/src/features/support/components/SupportWorkspacePrimitives.tsx`
- `apps/web/src/features/support/lib/SupportWorkspaceContextRail.ts`
- `apps/web/src/index.css`

Deleted preexistente:
- blueprints antigos na raiz de `docs/design/blueprint/` e em `docs/design/blueprint/suporte/`
- screenshots em `docs/reports/visual-audit/screenshots/`

Untracked preexistente:
- CSVs de limpeza em raiz: `deleted-*.csv`
- `docs/OPERATIONAL_CONTROL_PLANE_V1.md`
- blueprints reorganizados em `docs/design/blueprint/admin/` e `docs/design/blueprint/suporte/`
- relatórios `docs/reports/OPERATIONAL_CONTROL_PLANE_V1_AUDITORIA_E_PROPOSTA_2026-05-25.md` e `docs/reports/P4_SUPPORT_WORKSPACE_BLUEPRINT_COMPLIANCE_2026-05-25.md`

Ignored relevantes:
- `node_modules/`
- `apps/web/dist/`
- `.tmp/`
- `.worktrees/`
- `apps/web/.env.local`
- logs `.tmp-p4*`
- `worktree-backup.patch`, `staged-backup.patch`, `untracked-files-inventory.txt`

## Arquivos alterados neste lote

- `docs/reports/PROJECT_FORENSIC_RECOVERY_AUDIT_2026-05-29.md`
- `docs/README.md`
- `docs/PROJECT_STATE.md`
- `docs/ROADMAP_BUILDOUT_V3.md`
- `docs/DOCUMENTATION_LEDGER.md`

## Arquivos removidos e motivo

Nenhum arquivo foi removido neste lote.

As deleções já presentes no worktree foram classificadas como `pendência preexistente de consolidação visual`, não como remoção executada por esta auditoria. Antes de confirmar essas deleções em commit, a recomendação é decidir se cada PNG é:
- lixo confirmado;
- duplicado consolidado;
- histórico preservável;
- evidência regenerável;
- artefato ainda necessário para auditoria visual.

## Arquivos marcados como depreciados

Nenhum arquivo foi movido ou marcado inline como depreciado neste lote.

Classificação documental observada:
- `docs/CLEANUP_REPORT.md`: histórico, já indicado no índice como não-corrente.
- `docs/GPT/`: área auxiliar não canônica, mantida pela decisão `docs/reports/DOCS_GPT_CANONICAL_DECISION_2026-05-20.md`.
- `supabase/blueprints/`: rascunho/histórico, não executável.
- `docs/BUILDOUT_STATUS_CHECKPOINT_V3.md`: útil como checkpoint histórico, mas parcialmente superado por `PROJECT_STATE.md` e pelos relatórios P4.

## Status estrutural

Inventário por área:
- `apps`: 164 arquivos.
- `packages`: 6 arquivos.
- `supabase`: 129 arquivos.
- `docs`: 310 arquivos.
- `scripts`: 12 arquivos.
- `tests`: 4 arquivos.

Estrutura principal confirmada:
- `apps/web`: React 19, Vite 8, React Router 7, Supabase JS.
- `packages/contracts`: contratos TypeScript compartilhados.
- `supabase/migrations`: fonte executável de verdade do backend.
- `supabase/tests`: pgTAP para RLS, grants, views, RPCs e regressões.
- `supabase/functions`: edge functions de evidências.
- `scripts`: CI, Knowledge, documentação e verificação.
- `docs`: documentação canônica, relatórios e design assets.
- `raw_knowledge`: corpus bruto preservado para curadoria.

## Status frontend

Rotas confirmadas em `apps/web/src/app/router.tsx`:
- `/login`
- `/access-denied`
- `/help`, `/help/:spaceSlug`, `/help/:spaceSlug/articles`, `/help/:spaceSlug/articles/:articleSlug`
- `/portal`, `/portal/tickets`, `/portal/tickets/:ticketId`, `/portal/help`, `/portal/help/:articleSlug`
- `/admin`, `/admin/tenants`, `/admin/knowledge`, `/admin/knowledge/new`, `/admin/knowledge/:articleId/edit`
- `/admin/customer-portal`, `/admin/internal-areas`, `/admin/build-journal`, `/admin/product-docs`, `/admin/access`, `/admin/system`
- `/support/queue`, `/support/tickets`, `/support/tickets/:ticketId`, `/support/customers`, `/support/customers/:tenantId`
- `/engineering`, `/engineering/work-items/:workItemId`
- `/internal-actions`, `/internal-actions/:actionId`

Status por superfície:
- Admin: operacional parcial, conectado a `vw_admin_*` e RPCs administrativas. Sem evidência de leitura direta de tabelas base pelo frontend.
- Support Workspace: funcional e em refactor visual preexistente. Consome `vw_support_*`, `rpc_support_*`, `rpc_create_ticket`, `rpc_add_ticket_message`, storage por intents/functions.
- Ticket Workspace: funcional com timeline, mensagens, notas internas, status, classificação, SLA, evidências, Knowledge links, internal actions e engenharia.
- Customer Portal: funcional com tenant ativo backend-governed, tickets, colaboração, evidências, Knowledge autorizada, busca e recuperação de sessão/rede.
- Public Help: funcional para conteúdo `published/public`, separado do portal autenticado.
- Engineering Workspace: funcional por `vw_engineering_*` e RPCs de engenharia.
- Product Docs e Build Journal: superfícies internas estáticas/sanitizadas, com fundação documental e whitelist.

Achados UI/UX:
- Existe grande frente visual preexistente em Support Workspace ainda não fechada em git.
- Screenshots de auditoria visual foram removidos do worktree, enquanto métricas JSON permanecem. Isso quebra rastreabilidade visual se as imagens não forem regeneradas ou classificadas.
- O Design System V3 e os blueprints existem, mas a organização de assets ainda está em transição.

## Status backend/Supabase

Inventário SQL aproximado por migrations:
- 56 `create table`.
- 154 `create or replace view`.
- 21 `create view`.
- 252 `create or replace function`.
- 102 `create policy`.
- 56 `enable row level security`.
- 372 `grant`.

Domínios materializados:
- identity/tenancy;
- admin control plane;
- ticketing core;
- Knowledge Base e Public Help;
- support workspace read models;
- Customer Account;
- ticket/Knowledge linking;
- evidence storage;
- classification/SLA;
- customer portal;
- internal actions;
- engineering workspace;
- communication readiness/delivery;
- AI-native readiness sem IA real;
- internal documents.

Edge functions:
- `ticket-evidence-upload`
- `ticket-evidence-download`
- `_shared/ticket-evidence.ts`

Storage:
- `ticket-evidence`: bucket privado, intents por RPC, edge functions, grants curtos e metadata sanitizada.
- `knowledge-assets`: bucket privado para assets governados de artigos, com views/RPCs de controle.

## Status segurança/RLS

Pontos fortes:
- RLS aparece habilitada nas tabelas operacionais principais.
- Views/RPCs são o padrão de consumo do app.
- Helpers `SECURITY DEFINER` geralmente usam `set search_path = ''`.
- Tests pgTAP cobrem fases de identity, hardening, admin, ticketing, Knowledge, portal, internal actions, communication e AI readiness.
- Portal e Public Help possuem boundaries separados.
- Storage evita expor `storage_bucket`, `storage_object_path` e URL persistente ao frontend.

Pontos de atenção:
- Grants antigos para `authenticated` em tabelas administrativas base aparecem nas migrations iniciais, embora docs indiquem hardening posterior. Precisa de verificação com `supabase:lint:db` e `supabase:test:db` após Docker subir.
- `scripts/knowledge/reprocess-octadesk-article-assets.mjs` contém fallback literal para `KNOWLEDGE_ADMIN_EMAIL` e `KNOWLEDGE_ADMIN_PASSWORD`, limitado por `--local`, mas ainda ruim para higiene de segredo.
- `scripts/knowledge/publish-octadesk-public-help.mjs` executa somente local e possui scanners de risco, mas monta SQL e deve permanecer bloqueado para uso remoto.
- `docs` mencionam tokens/secrets como política e alerta, não necessariamente vazamento. O validador documental marcou alertas, sem bloqueios.

## Status documentação

Documentação canônica existe e está ampla, mas com drift:
- `PROJECT_STATE.md` é a fonte viva, porém cresceu muito e mistura histórico extenso com checkpoint corrente.
- `ROADMAP_BUILDOUT_V3.md` contém vários blocos "próximo lote" já concluídos; precisa ser tratado como histórico + retomada atual.
- `docs/README.md` tinha navegação suficiente, mas faltava apontar explicitamente para este relatório de retomada.
- `DOCUMENTATION_LEDGER.md` continua sendo trilha principal de fases e recebeu entrada deste lote.
- `supabase/README.md` está atrasado em relação ao volume atual de migrations/tests e ainda cita baseline antigo.
- `tests/README.md` está genérico e não reflete a bateria pgTAP atual.

## Pendências críticas

1. Refazer QA visual autenticado P4-F.4D para gerar screenshots atuais `p4-f4d-*` e comparar contra os blueprints aprovados.
2. Remover fallback literal de e-mail/senha em `scripts/knowledge/reprocess-octadesk-article-assets.mjs`, substituindo por env obrigatório ou fixture local documentada.
3. Atualizar `supabase/README.md` e `tests/README.md` em lote próprio de docs técnicas, com a matriz Supabase atual.
4. Decidir se a instabilidade local de `supabase_vector` exige ajuste de observabilidade ou pode permanecer como ruído não bloqueante.

## Backlog atualizado por fase

### Fase 0: estabilização da retomada
- Subir Docker local.
- Rodar `npm run supabase:db:reset` se for necessário reidratar ambiente local.
- Rodar `npm run supabase:lint:db`, `npm run supabase:test:db`, `npm run supabase:verify`.
- Registrar resultado no `PROJECT_STATE.md` e no ledger.

### Fase 1: fechamento do worktree visual
- Concluída em `docs/reports/WORKTREE_VISUAL_BLUEPRINT_RECOVERY_CLOSURE_2026-05-29.md`.
- Pendência remanescente: QA visual autenticado para gerar evidências atuais `p4-f4d-*` e revisão pixel-a-pixel.

### Fase 2: higiene de scripts e docs técnicas
- Remover defaults sensíveis dos scripts de Knowledge.
- Atualizar `supabase/README.md`.
- Atualizar `tests/README.md`.
- Adicionar inventário dos scripts operacionais e seus limites.

### Fase 3: auditoria Supabase pós-Docker
- Auditar grants efetivos após migrations.
- Confirmar ausência de DML direto de `authenticated` em tabelas base críticas.
- Confirmar `SECURITY DEFINER` + `search_path` em funções públicas.
- Confirmar policies de storage.

### Fase 4: UI/UX readiness
- Reexecutar visual QA nas rotas principais.
- Atualizar screenshots/route metrics.
- Consolidar divergências do Design System V3 e do blueprint em relatório único.

## Riscos arquiteturais

- A frente visual foi classificada, mas ainda falta evidência visual atual `p4-f4d-*` para aprovação pixel-a-pixel.
- Roadmap longo com blocos históricos pode induzir o próximo agente a repetir trabalho já concluído.
- Scripts locais antigos com defaults de credenciais podem virar padrão operacional se não forem endurecidos.
- Docker/Supabase local já foi validado no lote runtime, mas `supabase_vector` segue como ruído de observabilidade local.
- As screenshots históricas foram restauradas; a lacuna remanescente é a ausência dos screenshots atuais `p4-f4d-*` citados no relatório visual anterior.

## Validações executadas

### Atualização runtime Supabase pós-auditoria

Em `2026-05-29`, o lote `Fase 0 pós-auditoria runtime Supabase` foi executado na mesma branch `codex/project-forensic-recovery-audit`.

Resultado:
- Docker Desktop foi iniciado localmente e passou a responder no contexto `desktop-linux`.
- `npm run supabase:start` passou; a stack local ficou disponível em `127.0.0.1`.
- `npm run supabase:lint:db` passou com `No schema errors found`.
- `npm run supabase:test:db` passou com `47` arquivos e `979` testes pgTAP.
- `npm run supabase:verify` passou após correção do readiness local.

Causa raiz da falha inicial:
- `scripts/ci/wait-for-supabase-ready.mjs` estava hardcoded para portas locais antigas `55321/55322`.
- A stack Supabase local atual expõe API e Postgres nas portas resolvidas por `supabase status -o env`.
- O script foi corrigido para derivar `API_URL` e `DB_URL` do status local, preservando overrides por env (`SUPABASE_API_URL`, `SUPABASE_DB_HOST`, `SUPABASE_DB_PORT`).

Correções aplicadas:
- `scripts/ci/wait-for-supabase-ready.mjs`: readiness passa a descobrir dinamicamente URL da API e socket do banco a partir de `npx supabase status -o env`.
- Nenhuma migration foi criada.
- Nenhuma alteração de RLS, grant, policy, function, `SECURITY DEFINER`, `search_path` ou storage foi necessária.

Riscos restantes:
- `supabase_vector_genius-support-os` reiniciou em loop por falha ao listar containers Docker para coleta de logs. Isso não bloqueou `supabase:start`, lint, pgTAP ou verify.
- `supabase status` indicou serviços opcionais parados (`imgproxy`, `edge_runtime`, `pooler`); o readiness atual pula probe de Edge Runtime quando o próprio status informa que ele está parado.
- A Supabase CLI local segue em `v2.95.6` e informa disponibilidade de versão mais nova.

### Atualização worktree visual/blueprint

Em `2026-05-29`, o lote `Worktree Visual/Blueprint Recovery Closure` foi executado na mesma branch.

Resultado:
- Alterações em `apps/web/src/features/support/*` e `apps/web/src/index.css` foram classificadas como alinhadas ao relatório P4-F.4D e aos blueprints aprovados.
- Blueprints soltos foram reorganizados para `docs/design/blueprint/admin/` e `docs/design/blueprint/suporte/` por domínio/estado.
- `docs/design/blueprint/tickets e conversas.png` e `docs/design/blueprint/suporte/acionamentos geral.png` foram classificados como substituídos por blueprints mais específicos.
- 38 screenshots históricos de `docs/reports/visual-audit/screenshots/` foram restaurados.
- CSVs locais `deleted-*.csv` e `docs/reports/.serena/` foram removidos por serem artefatos locais fora da documentação canônica.
- Nenhum arquivo em `supabase/` foi alterado.

### Atualização QA visual autenticado P4-F.4D

Em `2026-05-29`, o lote `P4-F.4D Authenticated Visual QA` gerou os screenshots atuais `p4-f4d-*` e métricas JSON para Support Workspace autenticado.

Resultado:
- Status visual: `aprovado com ajustes`.
- P0: nenhum.
- P1: fluxo `Novo ticket` diverge estruturalmente do blueprint aprovado porque parte do formulario fica abaixo da dobra e o rail lateral usa orientacoes em vez de resumo operacional/SLA.
- Nenhum arquivo em `supabase/` foi alterado.
- Relatorio: `docs/reports/P4_F4D_AUTHENTICATED_VISUAL_QA_2026-05-29.md`.

Atualizacao em `2026-05-31`:
- O lote `P4-F.4D Novo Ticket Visual Alignment` corrigiu o P1 do fluxo `Novo ticket` sem criar feature, migration, backend, Supabase ou contrato novo.
- O modal passou a manter descricao/evidencias acima do footer no viewport `1672x941`.
- O rail lateral passou a exibir resumo operacional compacto e SLA `Indisponivel` quando o contrato nao fornece prazo antes da criacao.
- Evidencias: `docs/reports/visual-audit/screenshots/p4-f4d-support-queue-new-ticket-aligned.png` e `docs/reports/visual-audit/route-metrics/p4-f4d-support-queue-new-ticket-aligned.metrics.json`.
- Recomendacao atualizada: aprovar P4-F.4D, condicionado apenas a revisao humana pixel-a-pixel se exigida.

Atualizacao em `2026-06-01`:
- O lote `P4-F.4D Final Human Pixel Review & Worktree Closure` revisou os screenshots atuais contra os blueprints aprovados de fila, novo ticket, conversa, classificacao, conhecimento, evidencias, status, relacionados e acionamentos.
- Resultado final: P0 nenhum, P1 nenhum, P2 aceitos como backlog visual ou diferencas justificadas por contrato real.
- Confirmado novamente: nenhum arquivo em `supabase/` foi alterado; nenhuma migration, schema, RLS, grant, RPC, view, edge function ou fixture foi modificada.
- Recomendacao final: fechar o worktree visual/documental P4-F.4D e preparar commit.

Passou:
- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`
- `npm run documentation:validate:internal-docs` sem bloqueios; 9 documentos com alertas por menções de token/secret/service-role em contexto documental.

Falhou por ambiente:
- `npm run supabase:lint:db`: Postgres local recusou conexão em `127.0.0.1:54322`.
- `npm run supabase:test:db`: Postgres local recusou conexão em `127.0.0.1:54322`.
- `npm run supabase:start`: Docker Desktop indisponível (`dockerDesktopLinuxEngine` pipe ausente).

Não executado:
- `npm run supabase:verify` durante a auditoria inicial, porque `supabase:start`, lint e test já haviam falhado por Docker indisponível. Reexecutado com sucesso no lote runtime pós-auditoria.
- QA browser local, porque o objetivo deste lote foi forense/docs e o runtime Supabase local não ficou disponível.

## Comandos rodados

- `git status --short`
- `git status --ignored --short`
- `git branch --show-current`
- `git log -3 --oneline`
- `git switch -c codex/project-forensic-recovery-audit`
- `rg --files`
- `rg -n` para rotas, contratos, RPCs, storage, RLS, grants, TODOs, secrets e mocks
- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`
- `npm run documentation:validate:internal-docs`
- `npm run supabase:lint:db`
- `npm run supabase:test:db`
- `npm run supabase:start`
- `docker version`
- `docker ps`
- `npx supabase status`
- `npx supabase status -o env`
- `node scripts/ci/wait-for-supabase-ready.mjs`
- `npm run supabase:verify`

## Recomendação objetiva do próximo lote

Próximo prompt recomendado:

```text
Assuma o lote Fase 0 pós-auditoria: subir Docker/Supabase local, reidratar o banco se necessário, rodar supabase:lint:db, supabase:test:db e supabase:verify, investigar qualquer falha de RLS/grant/function/search_path até causa raiz, sem criar feature nova e sem mexer em produção. Atualize PROJECT_STATE, DOCUMENTATION_LEDGER e o relatório de auditoria com o resultado runtime.
```
