# P4-D Staging Pilot Candidate + Public Copy Safety Pass

## Objetivo

Preparar e validar um candidato de piloto em staging/autorizado, sem abrir para cliente real, sem deploy remoto, sem db push remoto, sem IA real e sem provider externo. Como nao ha staging explicitamente configurado no repositorio, a fase manteve a execucao local e registrou o bloqueio de staging.

## Ambiente auditado

- Branch: `codex/p4-d-staging-pilot-candidate`.
- Base: `f16f0a0b docs: registrar dry run controlado do piloto MVP`.
- Ambiente: Windows/PowerShell, Supabase local e Vite em `http://127.0.0.1:5173`.
- Staging: nao encontrado como ambiente explicitamente configurado no repositorio.

## Auditoria de staging

1. Nao ha script dedicado e seguro de staging em `package.json`.
2. `supabase/config.toml` descreve ambiente local.
3. Nao ha `.supabase/config.toml` versionado com link de staging.
4. `.env.example` contem placeholders vazios, sem secrets.
5. `.env.local` existe apenas como arquivo local/ignorado e nao foi lido.
6. O runbook remoto existente exige `supabase link`, project ref, token/senha e autorizacao humana.
7. Nenhum comando remoto foi executado.

Conclusao: GO local, NO-GO para execucao staging nesta fase.

## Copy publica

O risco P4-C de copy publica legada foi tratado. A landing Public Help deixou de prometer Avatar/IA ativa e passou a falar de busca, artigos, guia recomendado e suporte pelo Portal.

Arquivo alterado:

- `apps/web/src/features/help-center/HelpCenterHomePage.tsx`

## Rotas testadas

| Papel | Rotas | Resultado |
| --- | --- | --- |
| `platform_admin` | `/admin/system`, `/admin/tenants`, `/admin/customer-portal` | OK, readiness visivel apenas no Admin, sem campo de segredo ou ativacao de IA |
| `support_manager` | `/support/queue`, `/support/tickets/b86df683-9756-4047-b954-350e02063aa2` | OK, sem Copilot, botao de IA ou envio externo simulado |
| `customer_user` | `/portal`, `/portal/tickets/b86df683-9756-4047-b954-350e02063aa2`, `/portal/help` | OK, sem nota interna, provider/readiness, storage path ou IA interna |
| `internal_area_member` | `/internal-actions`, `/internal-actions/cdf38392-0505-49d5-a7ca-973643c65163` | OK, fila interna operacional |
| `engineering_member` | `/engineering`, `/engineering/work-items/46a2a89f-0788-46a0-a5de-8b2a6158e4fb` | OK, workspace tecnico operacional |
| `public_anon` | `/help/genius`, `/help/genius/articles`, `/help/genius/articles/como-compartilhar-evidencias-em-um-ticket` | OK, published/public only e sem copy falsa de IA |

## Usuarios QA

- `qa.local.platform-admin@genius.local` / `Local-QA-Admin-2026!`
- `qa.local.support-manager-a@genius.local` / `Local-QA-Manager-A-2026!`
- `qa.local.support-agent-a@genius.local` / `Local-QA-Agent-A-2026!`
- `qa.local.internal-area-member@genius.local` / `Local-QA-Internal-Area-2026!`
- `qa.local.internal-area-empty@genius.local` / `Local-QA-Internal-Empty-2026!`
- `qa.local.internal-area-non-member@genius.local` / `Local-QA-Internal-NoArea-2026!`
- `qa.local.engineering-member-a@genius.local` / `Local-QA-Engineering-A-2026!`
- `marina.ops@support-qa-a.local` / `Local-QA-Customer-A-2026!`
- `gestao.portal@support-qa-a.local` / `Local-QA-Customer-Manager-A-2026!`

## IDs uteis

- Tenant: `c12185f7-cc66-4731-b1e5-aa81023ef1a8`
- Ticket principal: `b86df683-9756-4047-b954-350e02063aa2`
- Internal action retornada: `cdf38392-0505-49d5-a7ca-973643c65163`
- Internal action aberta: `a8ff272d-5fd2-47fc-85d6-ad632c9fcbec`
- Engineering work item: `46a2a89f-0788-46a0-a5de-8b2a6158e4fb`
- Artigo publico: `como-compartilhar-evidencias-em-um-ticket`

## Validacoes executadas

- `npm run contracts:typecheck` - OK
- `npm run web:typecheck` - OK
- `npm run web:build` - OK
- `npm run supabase:lint:db` - OK
- `npm run supabase:test:db` - OK, 47 arquivos / 979 testes
- `npm run supabase:qa:local-functional-fixture` - OK
- `npm run supabase:qa:local-functional-fixture` segunda execucao - OK, idempotente

## Boundaries confirmados

- Portal nao ve nota interna.
- Portal nao ve internal actions.
- Portal nao ve engenharia interna.
- Portal nao ve audit bruto.
- Portal nao ve storage path/bucket.
- Portal nao ve provider/readiness interno.
- Portal nao ve AI readiness.
- Public Help so mostra conteudo published/public.
- Public Help nao promete IA ativa.
- Support nao simula provider externo.
- Admin mostra AI readiness como inativa/governada.
- Nenhum secret, token, API key, provider, job, webhook, IA real ou dado real foi criado.

## Decisao

GO para candidato local de piloto.

NO-GO para staging execution ate existir ambiente staging explicitamente configurado e autorizado.

NO-GO para producao/cliente real nesta fase.

## Riscos restantes

- Observabilidade continua minima/manual.
- Repetir gates em staging autorizado antes de abrir piloto.
- Confirmar URL, project ref e credenciais QA staging antes de qualquer comando remoto.
- Revisao humana final ainda e obrigatoria para comunicacao externa ampla.

## Proxima fase recomendada

P4-E Staging Environment Authorization & Remote Dry Run, limitada a identificar staging, confirmar que nao e producao, repetir gates nao destrutivos e executar smoke com credenciais QA proprias do ambiente alvo.
