# P4-B MVP Release Readiness & Pilot Control Pack

Data: 2026-05-24
Branch: `codex/p4-b-mvp-release-readiness`

## Objetivo

Preparar o MVP operacional do Genius Support OS para piloto controlado com checklist de release, matriz de regressao, plano de rollback, observabilidade minima, runbook de smoke e criterios claros de go/no-go.

Esta fase nao implementou feature nova, nao criou migration, nao alterou backend, frontend, fixture, Supabase remoto, secrets, provider externo, IA real ou deploy.

## Auditoria inicial resumida

### Git

- Branch inicial: `codex/p4-a-mvp-operational-closure`.
- Branch P4-B criada a partir de worktree limpo.
- Ultimo commit herdado: `ce660e5f docs: registrar fechamento operacional do MVP`.
- Nao havia arquivos untracked ou modificados antes da fase.

### Supabase

- Migrations recentes estao ordenadas e cobrem P2/P3 ate `20260524034815_ai_native_operational_readiness_foundation.sql`.
- Testes recentes cobrem ate `044_ai_native_operational_readiness.sql`.
- Nenhuma migration nova foi necessaria para readiness de release.
- Fixture funcional local e o gate canonico para QA autenticado.

### Frontend

- O P4-A ja validou Admin, Support, Portal, Internal Actions, Engineering e Public Help em browser smoke.
- O P4-B nao mudou UI; a validacao visual foi de sanity check e continuidade.
- Rotas criticas continuam dependentes de views/RPCs, nao de mock.

### Docs

- `PROJECT_STATE.md`, `PRODUCT_VISION.md`, `LOCAL_QA_AUTH.md` e `DOCUMENTATION_LEDGER.md` refletiam P4-A.
- Faltava pacote explicito de release readiness para piloto: matriz, checklist, rollback, observabilidade e smoke runbook.

## Respostas da auditoria de release

1. O MVP esta pronto para piloto local/staging controlado: sim, desde que os gates deste pacote sejam executados no ambiente alvo.
2. Bloqueios reais atuais: nenhum bloqueio tecnico novo foi encontrado nesta fase documental/QA.
3. Riscos aceitaveis: fixture pesada em Windows, observabilidade manual, QA exploratorio humano ainda recomendado e canais/IA reais fora do MVP.
4. Riscos impeditivos: falha em gates, vazamento customer-facing, botao fake, secret no diff, provider/IA real ativado ou migration irreversivel sem plano.
5. Fora do MVP: IA real, provider externo, WhatsApp/e-mail real, Omni Inbox, chatbot, analytics avancado, CRM generico e deploy remoto.
6. Checklist manual necessario: smoke por papel, boundaries customer-facing, logs Supabase/console, evidencia, Knowledge, Internal Actions, Engineering e rollback.

## Documentos criados

- `docs/release/MVP_REGRESSION_MATRIX_2026-05-24.md`
- `docs/release/MVP_RELEASE_CHECKLIST_2026-05-24.md`
- `docs/release/MVP_ROLLBACK_PLAN_2026-05-24.md`
- `docs/release/MVP_OBSERVABILITY_MINIMUM_2026-05-24.md`
- `docs/release/MVP_SMOKE_TEST_RUNBOOK_2026-05-24.md`
- `docs/reports/P4_MVP_RELEASE_READINESS_2026-05-24.md`

## Documentos atualizados

- `docs/PROJECT_STATE.md`
- `docs/PRODUCT_VISION.md`
- `docs/DOCUMENTATION_LEDGER.md`
- `docs/LOCAL_QA_AUTH.md`

## Matriz de regressao

A matriz minima cobre:

- Auth por papel: Admin, suporte, area interna, engenharia, portal e anonimo.
- Admin: tenants, customer portal, internal areas, knowledge e system.
- Support: queue, ticket workspace, customers e Customer Account.
- Portal: tickets, conversa, evidencias, Knowledge autorizada.
- Public Help: apenas published/public.
- Knowledge: envio seguro apenas de artigo public/published.
- Internal Actions: criacao, fila da area, empty state e retorno.
- Engineering: work item, update e retorno ao suporte.
- Communication: delivery via Portal e canais externos bloqueados.
- AI Readiness: governanca visivel apenas no Admin, sem IA ativa.

## Checklist de release

O checklist define:

- pre-release com git limpo, migrations revisadas, secrets ausentes e gates tecnicos;
- release controlado sem `db reset` remoto e sem provider externo;
- pos-release com smoke, logs, audit, delivery e boundaries;
- criterios de Go/No-Go;
- aprovacao por engenharia, produto/operacao, suporte/CS e seguranca tecnica.

## Plano de rollback

O plano cobre:

- rollback de frontend;
- rollback ou fix forward de migration;
- estrategia para migration irreversivel;
- pausa do piloto;
- preservacao de tickets, mensagens, anexos, audit logs, delivery, AI audit, Internal Actions e Engineering;
- proibicoes explicitas: reset remoto, drop sem backup, apagar users/Auth, remover storage e limpar audit log.

## Observabilidade minima

O pacote assume observabilidade sem ferramenta externa:

- `audit.audit_logs`;
- `ticket_events`;
- `ticket_message_deliveries`;
- `ai_usage_audit_events` preparado, sem prompt/output/provider;
- ledgers de Internal Actions e Engineering;
- `/admin/system`;
- logs Supabase/Auth/REST/Edge Functions/Storage;
- console do browser no smoke.

## Runbook de smoke

O runbook cobre:

1. Admin.
2. Portal cria ticket.
3. Support responde e salva nota interna.
4. Portal valida resposta e boundary.
5. Knowledge publico seguro.
6. Evidence sanitizada.
7. Internal Actions.
8. Area interna vazia e non-member.
9. Engineering.
10. Encerramento com console, scroll horizontal, IDs e PASS/FAIL.

## QA autenticado final

Credenciais locais documentadas e usadas como matriz de release:

- `platform_admin`: `qa.local.platform-admin@genius.local` / `LOCAL_QA_ADMIN_PASSWORD`
- `support_manager`: `qa.local.support-manager-a@genius.local` / `LOCAL_QA_SUPPORT_MANAGER_PASSWORD`
- `support_agent`: `qa.local.support-agent-a@genius.local` / `LOCAL_QA_SUPPORT_AGENT_PASSWORD`
- `internal_area_member`: `qa.local.internal-area-member@genius.local` / `LOCAL_QA_INTERNAL_AREA_MEMBER_PASSWORD`
- `internal_area_empty`: `qa.local.internal-area-empty@genius.local` / `LOCAL_QA_INTERNAL_AREA_EMPTY_PASSWORD`
- `internal_area_non_member`: `qa.local.internal-area-non-member@genius.local` / `LOCAL_QA_INTERNAL_AREA_NON_MEMBER_PASSWORD`
- `engineering_member`: `qa.local.engineering-member-a@genius.local` / `LOCAL_QA_ENGINEERING_PASSWORD`
- `customer_user`: `marina.ops@support-qa-a.local` / `LOCAL_QA_CLIENT_PASSWORD`
- `customer_manager`: `gestao.portal@support-qa-a.local` / `LOCAL_QA_CUSTOMER_MANAGER_PASSWORD`

## Rotas criticas

- `/admin/tenants`
- `/admin/system`
- `/support/queue`
- `/support/tickets/:ticketId`
- `/portal`
- `/portal/tickets/:ticketId`
- `/help/genius`
- `/internal-actions`
- `/engineering`

## Boundaries de release

Confirmar em todo smoke:

- Portal nao ve nota interna.
- Portal nao ve internal actions.
- Portal nao ve engenharia interna.
- Portal nao ve audit bruto.
- Portal nao ve storage path.
- Portal nao ve provider/readiness interno.
- Portal nao ve AI readiness.
- Public Help so mostra published/public.
- Support nao simula provider externo.
- IA nao executa acao.
- Nenhum segredo/token/API key e criado.
- Nenhum dado real e usado.

## Validacoes executadas nesta fase

- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`
- `npm run supabase:lint:db`
- `npm run supabase:test:db`
- `npm run supabase:qa:local-functional-fixture`
- `npm run supabase:qa:local-functional-fixture` novamente para idempotencia.
- Browser sanity em viewport `1440x900`:
  - `platform_admin`: login e `/admin/system`.
  - `support_manager`: login, `/support/queue` e `/support/tickets/b86df683-9756-4047-b954-350e02063aa2`.
  - `customer_user`: login, `/portal`, `/portal/tickets/b86df683-9756-4047-b954-350e02063aa2`, `/help/genius` e bloqueio em `/internal-actions`.
  - `engineering_member`: login, `/engineering` e `/engineering/work-items/46a2a89f-0788-46a0-a5de-8b2a6158e4fb`.
  - `internal_area_member`: login e `/internal-actions/cdf38392-0505-49d5-a7ca-973643c65163`.

## Go/No-Go atual

Go para piloto local/staging controlado se os gates acima permanecerem verdes no ambiente alvo.

No-Go se qualquer boundary customer-facing falhar, se qualquer gate tecnico falhar, se houver secret/dado real no diff, se provider externo/IA real aparecer como ativo ou se migration irreversivel nao tiver plano aprovado.

## Riscos restantes

- Observabilidade ainda e manual e precisa disciplina operacional.
- QA exploratorio humano segue recomendado antes de abrir piloto para mais usuarios internos.
- Release remoto/staging ainda depende de decisao explicita e nao foi executado nesta fase.
- Provider externo, Omni Inbox, IA real e automacoes seguem fora do MVP.

## Proxima fase recomendada

`P4-C Controlled Pilot Dry Run`: executar o runbook em ambiente alvo de staging/local-prod-like, registrar evidencias textuais, IDs, logs e decisoes Go/No-Go, ainda sem abrir para clientes reais.
