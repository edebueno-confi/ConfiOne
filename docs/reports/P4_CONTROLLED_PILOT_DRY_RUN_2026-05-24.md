# P4-C Controlled Pilot Dry Run & Release Candidate Gate

Data: 2026-05-24
Branch: `codex/p4-c-controlled-pilot-dry-run`
Base commit: `e5185bd9`

## Objetivo

Executar um dry run controlado de piloto do MVP usando o pacote de release readiness criado em P4-B, produzindo decisao Go/No-Go baseada em evidencias textuais locais.

Esta fase nao abriu piloto para cliente real, nao executou deploy remoto, nao executou `db push` remoto, nao alterou production/staging, nao criou feature, nao criou migration, nao alterou backend/frontend, nao criou segredo, nao ativou provider externo e nao ativou IA real.

## Ambiente usado

- Workspace: `C:\Trabalho`.
- Shell: PowerShell.
- Banco: Supabase local.
- Frontend: Vite local em `http://127.0.0.1:5173`.
- Browser smoke: viewport `1440x900`.
- Fixture: `npm run supabase:qa:local-functional-fixture`, executada duas vezes.

## Auditoria inicial resumida

- Branch inicial: `codex/p4-b-mvp-release-readiness`.
- Worktree inicial: limpo.
- Commit base: `e5185bd9 docs: criar pacote de release readiness do MVP`.
- Documentos P4-B obrigatorios lidos: checklist, matriz de regressao, rollback, observabilidade, smoke runbook, relatorio P4-B, `PROJECT_STATE.md`, `LOCAL_QA_AUTH.md` e `DOCUMENTATION_LEDGER.md`.
- Nenhum arquivo nao rastreado ou alterado antes da criacao da branch P4-C.

## Comandos executados

| Comando | Resultado |
| --- | --- |
| `git checkout -b codex/p4-c-controlled-pilot-dry-run` | PASS |
| `npm run contracts:typecheck` | PASS |
| `npm run web:typecheck` | PASS |
| `npm run web:build` | PASS |
| `npm run supabase:lint:db` | PASS |
| `npm run supabase:test:db` | PASS - 47 arquivos, 979 testes |
| `npm run supabase:qa:local-functional-fixture` | PASS - rodada 1 |
| `npm run supabase:qa:local-functional-fixture` | PASS - rodada 2 idempotente |

## Usuarios/senhas QA

- `platform_admin`: `qa.local.platform-admin@genius.local` / `LOCAL_QA_ADMIN_PASSWORD`
- `support_manager`: `qa.local.support-manager-a@genius.local` / `LOCAL_QA_SUPPORT_MANAGER_PASSWORD`
- `support_agent`: `qa.local.support-agent-a@genius.local` / `LOCAL_QA_SUPPORT_AGENT_PASSWORD`
- `internal_area_member`: `qa.local.internal-area-member@genius.local` / `LOCAL_QA_INTERNAL_AREA_MEMBER_PASSWORD`
- `internal_area_empty`: `qa.local.internal-area-empty@genius.local` / `LOCAL_QA_INTERNAL_AREA_EMPTY_PASSWORD`
- `internal_area_non_member`: `qa.local.internal-area-non-member@genius.local` / `LOCAL_QA_INTERNAL_AREA_NON_MEMBER_PASSWORD`
- `engineering_member`: `qa.local.engineering-member-a@genius.local` / `LOCAL_QA_ENGINEERING_PASSWORD`
- `customer_user`: `marina.ops@support-qa-a.local` / `LOCAL_QA_CLIENT_PASSWORD`
- `customer_manager`: `gestao.portal@support-qa-a.local` / `LOCAL_QA_CUSTOMER_MANAGER_PASSWORD`
- `public_anon`: sem credencial.

## IDs uteis

- Tenant QA A: `c12185f7-cc66-4731-b1e5-aa81023ef1a8`
- Ticket principal: `b86df683-9756-4047-b954-350e02063aa2`
- Internal action retornada: `cdf38392-0505-49d5-a7ca-973643c65163`
- Internal action aberta: `a8ff272d-5fd2-47fc-85d6-ad632c9fcbec`
- Engineering work item: `46a2a89f-0788-46a0-a5de-8b2a6158e4fb`
- Artigo publico: `como-compartilhar-evidencias-em-um-ticket`

## Rotas testadas

- `/admin/system`
- `/support/queue`
- `/support/tickets/b86df683-9756-4047-b954-350e02063aa2`
- `/portal`
- `/portal/tickets/b86df683-9756-4047-b954-350e02063aa2`
- `/portal/help`
- `/internal-actions`
- `/access-denied`
- `/engineering`
- `/engineering/work-items/46a2a89f-0788-46a0-a5de-8b2a6158e4fb`
- `/help/genius`
- `/help/genius/articles`
- `/help/genius/articles/como-compartilhar-evidencias-em-um-ticket`

## Fluxos validados

1. Admin abriu `/admin/system` e visualizou readiness de canais e AI-native readiness.
2. Support abriu fila e ticket principal.
3. Support enviou uma resposta publica real via Portal no ticket principal.
4. Support adicionou uma nota interna real no ticket principal.
5. Portal viu a resposta publica enviada no dry run.
6. Portal nao viu a nota interna enviada no dry run.
7. Support abriu Knowledge no ticket e confirmou artigos publicos/sugeridos e vinculos governados.
8. Knowledge internal/restricted nao virou envio automatico ao cliente.
9. Customer Portal Help exibiu apenas Knowledge autorizada.
10. Public Help exibiu apenas published/public.
11. Evidence nao expôs bucket, storage path ou audit bruto ao cliente.
12. Internal Actions exibiu fila, detalhe e retorno da area.
13. Area interna vazia exibiu empty state honesto.
14. Area interna sem membership foi bloqueada em `/access-denied`.
15. Engineering abriu fila e work item tecnico.
16. Auth por papel redirecionou para areas corretas ou bloqueio real.
17. AI readiness apareceu apenas no Admin; Support/Portal nao exibiram Copilot ou geracao de resposta.
18. Nenhum provider externo, segredo, token, API key, IA real ou deploy remoto foi criado.

## Resultado por papel

| Papel | Resultado |
| --- | --- |
| `platform_admin` | PASS - Admin/system validado com readiness de release, canais e AI-native |
| `support_manager` | PASS - Queue, ticket, resposta publica, nota interna, Knowledge e Acionamentos validados |
| `support_agent` | PASS - Landing em `/support/queue` validada |
| `internal_area_member` | PASS - Fila/detalhe de acionamento interno validado |
| `internal_area_empty` | PASS - Empty state honesto validado |
| `internal_area_non_member` | PASS - `/access-denied` validado; sem fila enganosa |
| `engineering_member` | PASS - Fila tecnica e work item validados |
| `customer_user` | PASS - Portal e ticket customer-facing validados |
| `customer_manager` | PASS - Portal manager validado sem dados internos |
| `public_anon` | PASS - Public Help published/public validado |

## Boundaries confirmados

- Portal nao ve nota interna.
- Portal nao ve Internal Actions.
- Portal nao ve Engenharia interna.
- Portal nao ve audit bruto.
- Portal nao ve storage path/bucket.
- Portal nao ve provider/readiness interno.
- Portal nao ve AI readiness.
- Public Help so mostra published/public.
- Support nao simula provider externo.
- Delivery continua via Portal.
- IA nao executa acao.
- Nenhum segredo/token/API key foi criado.
- Nenhum dado real, CSV, dump, screenshot ou raw corpus foi usado.

## Achados

- Gate tecnico: todos verdes.
- Fixture: concluiu duas vezes com IDs estaveis e sem hang.
- Browser smoke: sem scroll horizontal global observado nas rotas inspecionadas.
- Console: houve um 403 de logout durante troca manual de sessoes por limpeza de storage no browser; nao bloqueou fluxo funcional nem gerou falha de rota.
- Risco de copy: Public Help tem CTA legado `Genius Avatar AI` / `Conversar com o Avatar`, que navega para artigo publico e nao ativa IA real. Antes de abrir para cliente real, revisar copy para nao prometer chatbot/IA ativa.

## Decisao Go/No-Go

Decisao: GO para piloto controlado local/staging.

Condições:

- Repetir gates tecnicos e fixture no ambiente alvo.
- Nao abrir cliente real sem execucao humana do checklist P4-B.
- Revisar a copy publica de Avatar AI antes de comunicacao externa ampla.
- Manter provider externo, IA real, secrets e deploy remoto fora do escopo ate autorizacao explicita.

## Evidencias criadas

- `docs/release/PILOT_DRY_RUN_EVIDENCE_2026-05-24.md`
- `docs/reports/P4_CONTROLLED_PILOT_DRY_RUN_2026-05-24.md`

## Proxima fase recomendada

Executar `P4-D Staging Pilot Candidate`, limitado a ambiente staging autorizado, repetindo gates P4-C, revisando copy publica de IA/Avatar e validando observabilidade manual antes de qualquer cliente real.
