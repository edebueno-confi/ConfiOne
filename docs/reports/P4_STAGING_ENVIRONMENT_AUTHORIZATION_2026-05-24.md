# P4-E Staging Environment Authorization & Remote Dry Run

## Objetivo

Preparar a autorizacao de ambiente staging e executar dry run remoto somente se houvesse ambiente seguro, project ref conhecido, confirmacao de que nao e producao e autorizacao humana registrada. Como esses requisitos nao estavam presentes, a fase ficou limitada a auditoria, gates locais, smoke local e documentacao de bloqueio.

## Branch

`codex/p4-e-staging-environment-authorization`

## Auditoria inicial

- Branch anterior: `codex/p4-d-staging-pilot-candidate`.
- Base: `95d06c7a docs: registrar candidato de piloto staging do MVP`.
- Worktree inicial: limpo.
- Branch dedicada criada antes de alteracoes.

## Ambiente auditado

- `package.json`: sem script dedicado de staging; scripts Supabase do MVP sao locais por padrao.
- `supabase/config.toml`: ambiente local com `project_id = "genius-support-os"`, portas locais e seed desabilitado.
- `.env.example`: placeholders vazios, sem valores reais.
- `.env.local` na raiz: ausente.
- `apps/web/.env.local`: presente localmente; somente nomes de chaves foram verificados e valores nao foram impressos.
- `docs/REMOTE_SUPABASE_DEPLOY_RUNBOOK.md`: existe, mas exige token, project ref, senha e aprovacao explicita.
- `.supabase/config.toml`: nao encontrado como configuracao versionada de staging.
- Project ref staging versionado/documentado: nao encontrado.
- URL staging autorizada: nao encontrada.

## Respostas da auditoria local

1. Existe staging explicitamente configurado? Nao.
2. Ha project ref de staging versionado ou documentado? Nao.
3. Ha risco de apontar para producao? Sim, se alguem usar variaveis locais ou runbook remoto sem identificar o ambiente; por isso nenhum comando remoto foi executado.
4. Ha scripts seguros de staging? Nao ha script dedicado de staging.
5. Ha scripts perigosos? Ha comandos remotos no runbook (`supabase link`, `migration list --linked`, `db push --linked`) que sao seguros apenas com autorizacao e ambiente confirmado; `supabase:db:reset:*` e explicitamente local.
6. Ha secrets expostos no repo? Nao foram encontrados valores em arquivos versionados; `.env.example` e placeholder.
7. Ha dados reais versionados? Nao foi encontrado dado real no escopo de release; a fixture usa dados sinteticos locais.
8. O que pode ser executado localmente? Typechecks, build, lint local, pgTAP local, fixture local e smoke local.
9. O que exige autorizacao humana? Qualquer `supabase link`, query remota, migration list remoto, db push remoto, deploy, health remoto privado ou login staging.
10. Decisao preliminar: staging bloqueado.

## Gates locais

- `npm run contracts:typecheck` - PASS.
- `npm run web:typecheck` - PASS.
- `npm run web:build` - PASS.
- `npm run supabase:lint:db` - PASS.
- `npm run supabase:test:db` - PASS, 47 arquivos / 979 testes.
- `npm run supabase:qa:local-functional-fixture` - PASS.
- `npm run supabase:qa:local-functional-fixture` segunda execucao - PASS, idempotente.

## Smoke local

| Papel | Rotas | Resultado |
| --- | --- | --- |
| `platform_admin` | `/admin/system`, `/admin/tenants`, `/admin/customer-portal` | PASS |
| `support_manager` | `/support/queue`, `/support/tickets/b86df683-9756-4047-b954-350e02063aa2` | PASS |
| `customer_user` | `/portal`, `/portal/tickets/b86df683-9756-4047-b954-350e02063aa2`, `/portal/help` | PASS |
| `internal_area_member` | `/internal-actions` | PASS |
| `engineering_member` | `/engineering` | PASS |
| `public_anon` | `/help/genius`, `/help/genius/articles`, `/help/genius/articles/como-compartilhar-evidencias-em-um-ticket` | PASS |

## Usuarios QA locais

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

## Copy e boundaries

Busca textual em `apps/web/src/features/help-center`, `apps/web/src/features/customer-portal` e `apps/web/src/features/login` nao encontrou promessa publica/customer-facing ativa para:

- `Genius Avatar AI`;
- `Conversar com o Avatar`;
- `Perguntar ao Avatar`;
- `Falar com o Avatar`;
- `Avatar AI`;
- `IA ativa`;
- `chatbot ativo`;
- `resposta automatica`.

Boundary local confirmado:

- Portal nao ve nota interna, internal actions, engenharia interna, audit bruto, storage path/bucket, provider/readiness interno ou AI readiness.
- Public Help so mostra published/public e nao promete IA ativa.
- Admin mostra AI readiness como inativa/governada.
- Support nao simula provider externo.
- Nenhum secret, token, API key, provider externo, IA real ou dado real foi criado.

## Remote dry run

Nao executado.

Motivo: ausencia de staging explicitamente configurado e ausencia de autorizacao humana preenchida.

## Decisao Go/No-Go

- Local: GO.
- Staging: NO-GO para remote dry run ate autorizacao humana e ambiente staging explicito.
- Producao: NO-GO.

## Riscos restantes

- Staging ainda precisa URL, project ref, credenciais QA e confirmacao de que nao e producao.
- Observabilidade remota ainda precisa ser confirmada no ambiente alvo.
- Qualquer comando `--linked` ainda depende de autorizacao humana e lista de comandos permitidos.
- Existe um PNG de blueprint modificado fora do escopo no worktree; nao foi stageado nem revertido.

## Proxima fase recomendada

P4-F Authorized Staging Smoke, somente depois de preencher `docs/release/STAGING_ENVIRONMENT_AUTHORIZATION_CHECKLIST_2026-05-24.md` com ambiente, responsavel, project ref, URL, comandos permitidos e confirmacao formal de que nao e producao.
