# Staging Pilot Candidate Checklist - 2026-05-24

## Escopo

Checklist para promover o MVP de candidato local para piloto em staging controlado. Esta fase nao executou deploy remoto, nao aplicou migrations remotas e nao criou secrets.

## Auditoria de ambiente

| Item | Resultado | Evidencia |
| --- | --- | --- |
| Branch dedicada | OK | `codex/p4-d-staging-pilot-candidate` |
| Worktree inicial | OK com artefatos locais removidos | `.agents/` e `skills-lock.json` eram artefatos de skill, fora do produto |
| Staging explicito no repo | NAO ENCONTRADO | Nao ha script dedicado de staging nem `.supabase/config.toml` versionado |
| Supabase local | OK | `supabase/config.toml` aponta para ambiente local |
| Scripts de staging seguros | NAO ENCONTRADO | `package.json` nao possui gate remoto de staging dedicado |
| Secrets no repo | NAO ENCONTRADO | `.env.example` contem placeholders vazios; `.env.local` permanece local e nao foi lido |
| Risco de producao | CONTROLADO | comandos remotos documentados exigem `supabase link`, token/projeto/senha e autorizacao humana |

## Gates locais executados

| Gate | Resultado |
| --- | --- |
| `npm run contracts:typecheck` | OK |
| `npm run web:typecheck` | OK |
| `npm run web:build` | OK |
| `npm run supabase:lint:db` | OK |
| `npm run supabase:test:db` | OK, 47 arquivos / 979 testes |
| `npm run supabase:qa:local-functional-fixture` | OK |
| `npm run supabase:qa:local-functional-fixture` segunda execucao | OK, idempotente |

## Staging gates

Status: NAO EXECUTADO.

Motivo: nao existe ambiente staging explicitamente configurado no reposititorio e nao ha autorizacao para apontar comandos a projeto remoto. A proxima execucao deve informar:

- URL staging;
- Supabase project ref staging;
- credenciais QA staging;
- confirmacao de que nao e producao;
- checklist humano antes de qualquer `supabase link`, `migration list --linked` ou `db push --linked`.

## Smoke local

| Area | Rotas | Resultado |
| --- | --- | --- |
| Admin | `/admin/system`, `/admin/tenants`, `/admin/customer-portal` | OK |
| Support | `/support/queue`, `/support/tickets/:ticketId` | OK |
| Portal | `/portal`, `/portal/tickets/:ticketId`, `/portal/help` | OK |
| Public Help | `/help/genius`, `/help/genius/articles`, `/help/genius/articles/:articleSlug` | OK |
| Internal Actions | `/internal-actions`, `/internal-actions/:actionId` | OK |
| Engineering | `/engineering`, `/engineering/work-items/:workItemId` | OK |

## Go/No-Go

GO para candidato local de piloto.

NO-GO para execucao staging nesta fase, ate existir ambiente staging explicitamente configurado e autorizado.

NO-GO para producao ou cliente real.
