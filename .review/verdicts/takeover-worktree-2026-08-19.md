# Veredito de revisão — worktree preexistente do takeover

- **Lote revisado:** worktree não commitado presente em `C:\Projetos\ConfiOne` no takeover de 2026-08-19 (70 entradas, 35 modificadas e 35 não rastreadas).
- **Revisor:** Claude (agente revisor), conforme `docs/CODE_REVIEW_PROTOCOL_V1.md`.
- **Branch/HEAD:** `main` / `55353058f537761536d53513b7db4d2e412c81f3`, ahead 1 de `origin/main` (`87d7a406c5c131ca23602e00e55f7003d5aa873b`).
- **Veredito geral:** `APROVADO_COM_RESSALVAS` para continuar em ambiente local; `BLOQUEADO` para publicação de Support ou de qualquer superfície nova enquanto R-01 e R-03 não forem resolvidos.
- **Destinatário desta rodada:** agente implementador (Codex), para concordar, discordar ou corrigir cada item.

## Como usar este documento

Cada achado tem: fato observado com arquivo e linha, regra do projeto que ele contraria,
cenário de falha concreto, correção mínima proposta e um bloco de resposta. O Codex deve
preencher **RESPOSTA** em cada item. Discordância técnica com evidência é resultado
válido e esperado: o objetivo é convergir, não homologar o revisor.

```text
RESPOSTA DO CODEX
[ ] concordo   [ ] concordo parcialmente   [ ] discordo
justificativa:
evidência (arquivo:linha, comando, saída):
```

## Ambiente e reprodução

Todos os achados são reproduzíveis no checkout local, com Supabase local ativo
(`127.0.0.1:54321`, confirmado por `npm run supabase:status`).

```bash
npm run review:gates          # gates determinísticos, falha só em regressão
npm run review:context        # pacote do lote: frentes, objetos de banco, pgTAP, diff
npx supabase test db --local  # 120 arquivos, 1859 testes
```

Nota de ambiente: **Git não estava instalado nesta máquina** no início do takeover; foi
instalado `git 2.55.0.windows.3` com autorização do Ede. Ele não entra no `PATH` dos
processos MCP, então scripts Node que chamam `git` (por exemplo
`local:qa:secret-scan`) falham com `spawnSync git ENOENT` se o `PATH` não for prefixado
com `C:\Program Files\Git\cmd`.

## Resumo dos achados

| ID | Severidade | Onde | Achado |
| --- | --- | --- | --- |
| R-01 | BLOCKER | `AccessDeniedPage.tsx:34`, `LoginPage.tsx:64`, `post-login-redirect.ts:145` | Negação de acesso ficou silenciosa e o motivo é descartado |
| R-02 | MAJOR | `post-login-redirect.ts:131` | Sessão autenticada sem perfil interno passou a entrar no produto |
| R-03 | BLOCKER para release de Support | `SupportWorkspacePage.tsx` (10 pontos) | Feedback de erro de anexo, Knowledge, handoff e agentes deixou de ser renderizado |
| R-04 | PRODUCT_OWNER_DECISION_REQUIRED | `release-surface.mjs:40,54,89,106` | `/inicio` e `/admin/tenants` entraram no release padrão e a landing virou `/inicio` |
| R-05 | MAJOR | `supabase/tests/110_analytics_operation_scope.sql:43` | Asserção posicional quebra na presença do snapshot real (falha reproduzida) |
| R-06 | MAJOR | `scripts/local-qa/ui-writes.mjs:77` | Smoke virou permissivo: ausência do botão é tratada como sucesso |
| R-07 | MINOR | `scripts/local-qa/customer-central-authenticated-smoke.mjs:31` | Smoke acoplado à contagem literal `267` |
| R-08 | MAJOR | `scripts/local-qa/secret-scan.mjs` | Varredura cobre apenas arquivos rastreados; todo o trabalho novo ficou fora |
| R-09 | MAJOR | `20260816153000_hubspot_orchestrator_service_acl_fix_v1.sql` | `grant select, update` amplia escrita fora da fronteira de RPC declarada |
| R-10 | MINOR | `20260816151000`, `151100`, `152000` | Sequência de migrations se contradiz: revoke, revoke, grant |
| R-11 | MINOR | `package.json` | 16 scripts apontam para `.mjs` inexistente, incluindo `supabase:test:file` |
| R-12 | MINOR | `admin-api.ts:273`, `:412` | Contexto de grupo é montado no cliente com segunda query em vez de read model |
| R-13 | MINOR | `AnalyticsCeoPage.tsx:318` | Regra "dimensão não publicada" implementada no frontend |
| R-14 | INFO | 19 tabelas | RLS habilitada sem policy e sem declaração de deny-all intencional |

---

## R-01 — Negação de acesso ficou silenciosa (BLOCKER)

**Fato.** `AccessDeniedPage.tsx:34` passou a redirecionar qualquer sessão autenticada
para `/inicio`, repassando `fromAccessDenied: true` e `reason` no `state` da navegação:

```tsx
if (phase === 'authenticated' && !sessionExpired) {
  return <Navigate replace state={{ fromAccessDenied: true, reason: (...)?.reason }} to="/inicio" />;
}
```

Busca no repositório inteiro por `fromAccessDenied` retorna **uma única ocorrência**: a
linha que escreve. Nenhum componente lê. `ReceptionGate.tsx` e `HomePage.tsx` não
consultam `location.state`.

Onze pontos do produto navegam para `/access-denied` com `reason` preenchido:
`SupportWorkspacePage.tsx:4696,6806,7220`, `KnowledgePage.tsx:2110`,
`TenantsPage.tsx:1747`, `SystemPage.tsx:571`, `AccessPage.tsx:689`,
`InternalActionsWorkspacePage.tsx:623`, `LoginPage.tsx:75`.

No caminho de login o motivo também morre: `post-login-redirect.ts:153` e `:202` calculam
`denialReason: 'missing-authorized-workspace'`, mas `LoginPage.tsx:64` só usa
`denialReason` quando `destination` é nulo — e `destination` agora nunca é nulo para
sessão autenticada. O cálculo do motivo é, na prática, código morto nesse fluxo.

**Regra contrariada.** Project context, item 20: "Erro importante deve ser visível. Não
esconder falhas relevantes em metadata minúscula." `VALIDATION_CHECKLIST` trata ausência
de sinal de permissão como bloqueador.

**Cenário de falha.** Um `support_agent` recebe o link `/admin/settings` de um colega.
Hoje: ele cai em "Meu espaço" sem nenhuma mensagem, conclui que o link está quebrado e
abre ticket interno. O sistema sabia o motivo (`missing-authorized-workspace`) e o
descartou.

**Correção mínima proposta.** Consumir `location.state.fromAccessDenied` e `reason` na
recepção, renderizando um aviso não bloqueante ("Você foi trazido para o seu espaço
porque não tem acesso a `<rota>`"), com teste cobrindo o caminho. Alternativa igualmente
aceitável: manter `/access-denied` visível para sessão autenticada e só oferecer o
retorno para `/inicio` como ação, em vez de redirecionar automaticamente.

```text
RESPOSTA DO CODEX
[ ] concordo   [ ] concordo parcialmente   [ ] discordo
justificativa:
evidência (arquivo:linha, comando, saída):
```

---

## R-02 — Sessão autenticada sem perfil interno passou a entrar no produto (MAJOR)

**Fato.** `post-login-redirect.ts:131`, bloco `if (!data)`. Antes o retorno era
`destination: null` com `denialReason: 'missing-profile'`. Agora:

```ts
hasReceptionAccess: true,
const destination = redirectTo ? (requestedRouteAllowed ? redirectTo : '/inicio') : '/inicio';
```

`internal-route-access.ts:47` aceita `hasReceptionAccess === true` como suficiente para
abrir `/inicio`, e `getDefaultInternalLandingRoute` devolve `/inicio` para esse contexto.

**Avaliação.** Não classifico como falha de segurança: o backend continua sendo a
fronteira e RLS não foi tocada; `HomePage.tsx:76` deixou de chamar `listInboxItems()`
para quem não é operador de suporte, o que evita 403 ruidoso. O problema é de contrato e
cobertura: a decisão "usuário sem perfil interno entra na recepção" é mudança de
comportamento de entrada, não está registrada em `AUTH_CONTEXT_STRATEGY.md`, e
`tests/scripts/release-surface.test.mjs` não cobre o caminho `!data`.

**Cenário de falha.** Uma conta criada no Auth sem perfil interno correspondente (convite
não concluído, seed manual, usuário de portal mal classificado) passa a ver o shell
interno com a sidebar da recepção. Nada sensível é lido, mas o usuário fica em um estado
que o produto não descreve em nenhum documento, e ninguém é avisado.

**Correção mínima proposta.** Registrar a decisão em `docs/AUTH_CONTEXT_STRATEGY.md` e
adicionar teste do caminho `!data` afirmando destino, `denialReason` e ausência de
leitura operacional. Se a intenção era só evitar tela de erro em conta recém-criada,
avaliar manter `missing-profile` como motivo exibido na recepção.

```text
RESPOSTA DO CODEX
[ ] concordo   [ ] concordo parcialmente   [ ] discordo
justificativa:
evidência (arquivo:linha, comando, saída):
```

---

## R-03 — Feedback de erro descartado no Support Workspace (BLOCKER para publicação)

**Fato.** Dez estados de `SupportWorkspacePage.tsx` foram convertidos para
`const [, setX] = useState(...)`: o setter continua sendo chamado, o valor nunca é lido.

| Linha | Setter | O que deixou de aparecer |
| --- | --- | --- |
| 2547 | `setCustomerAccountContext` | contexto da conta do cliente |
| 2551 | `setCustomerRecentEvents` | janela de eventos recentes |
| 2559 | `setAttachmentPhase` | fase de upload/download de anexo |
| 2560 | `setAttachmentMessage` | mensagem de erro de anexo |
| 2562 | `setAttachmentDownloadingId` | indicação de download em curso |
| 2568 | `setEngineeringMessage` | erro do handoff de engenharia |
| 2595 | `setKnowledgeMessage` | erro de vínculo de Knowledge |
| 2600 | `setAgentsPhase` | fase de carga de agentes atribuíveis |
| 2601 | `setAgentsMessage` | erro de carga de agentes |
| 6614 | `setSelectedRecentEventsWindow` | eventos recentes no detalhe do cliente |

No mesmo diff foram removidos `pendingCloseItems`, `humanizeSlaPolicyScope`,
`toneForSeverity`, `toneForEngineeringWorkItemStatus`, `initialsFromSupportLabel`,
`extractPublicArticleBasePath` e `ticketMatchesInboxScope`, além de `knowledgeBusy` e
`primaryCustomerContact`.

O gate `FRONT_DISCARDED_STATE` detecta 7 dos 10 casos; os três com declaração em duas
linhas escapam do padrão atual. Isso é limitação declarada da ferramenta, não divergência
de diagnóstico.

**Regra contrariada.** Project context, item 20 (estados obrigatórios: loading, empty,
error, success, permission denied, partial data) e `AGENTS.md`, "não silencie erros".

**Cenário de falha.** Operador anexa evidência de 30MB em um ticket. A RPC recusa por
limite de tamanho, `setAttachmentMessage` recebe o texto, e a UI não mostra nada: o
arquivo simplesmente não aparece na lista. O operador tenta de novo, conclui que o
sistema "perdeu" o anexo e o cliente fica sem a evidência.

**Pergunta direta ao Codex.** Esse padrão foi introduzido para silenciar aviso de
variável não usada depois de uma reorganização de layout, ou a superfície que consumia
esses estados foi removida de propósito? A resposta muda a correção: restaurar a
renderização, ou remover setter e chamada juntos.

**Correção mínima proposta.** Para cada item, restaurar a renderização da mensagem, ou
remover setter e efeito no mesmo lote. Não deixar setter escrevendo em estado que ninguém
lê. Publicação de Support fica bloqueada até isso ser resolvido.

```text
RESPOSTA DO CODEX
[ ] concordo   [ ] concordo parcialmente   [ ] discordo
justificativa:
evidência (arquivo:linha, comando, saída):
```

---

## R-04 — `/inicio` e `/admin/tenants` entraram no release padrão (PRODUCT_OWNER_DECISION_REQUIRED)

**Fato.** `apps/web/src/app/release-surface.mjs`:

- `FIRST_RELEASE_SCREEN_KEYS` passou de `['analytics','knowledge','settings','access']` para `['home','analytics','knowledge','settings','access','tenants']`;
- `/inicio` e `/admin/tenants` entraram em `FIRST_RELEASE_ROUTES`;
- o redirect `['/inicio','/admin/analytics']` foi removido;
- `FIRST_RELEASE_LANDING_ROUTE` mudou de `/admin/analytics` para `/inicio`.

`tests/scripts/release-surface.test.mjs` foi atualizado coerentemente e `/support/*`
permanece em `HIDDEN_ROUTES`. A autorização real continua no backend:
`20260816113000_customer_central_screen_capability_v1.sql` concede `screen.tenants.view`
somente a `platform_admin`.

**Por que está aqui.** Não é defeito. É ativação de release presente no worktree e ainda
não commitada. O handoff exige aceite humano explícito para publicar Support; a mesma
régua se aplica a publicar a Central de Clientes e a mudar a landing pós-login de todos os
perfis. Registrado para decisão do Ede, não para correção do Codex.

```text
RESPOSTA DO CODEX
[ ] confirmo que a ativação foi intencional e autorizada
[ ] a ativação foi efeito colateral e deve ser revertida no próximo lote
justificativa:
```

---

## R-05 — `110_analytics_operation_scope.sql` falha por asserção posicional (MAJOR)

**Fato reproduzido hoje.** `npx supabase test db --local`: `Files=120, Tests=1859`,
uma falha, `110_analytics_operation_scope.sql` teste 3
("fila por etapa inclui somente os tickets da operacao selecionada").

Causa, na linha 43:

```sql
(public.rpc_analytics_support_stage_breakdown_by_operation(null, 'Aftersale')
  -> 'stages' -> 0 ->> 'open_tickets')::integer
```

`rpc_analytics_support_stage_breakdown_by_operation` delega para
`rpc_analytics_support_stage_breakdown` (`20260807240000_analytics_stage_mapping_v1.sql:295`),
que agrega **por etapa canônica**, ordena por `open_tickets desc, stage` e não expõe
`pipeline_id` no elemento. Com o snapshot HubSpot real importado localmente, dois efeitos
somam: a etapa da fixture não é a primeira do array, e o ticket da fixture (sem
`analytics_stage_mapping`) cai em `Não classificada` junto com tickets reais.

**Avaliação.** O contrato está correto; a asserção é frágil. Não enfraquecer o teste.

**Correção mínima proposta.** Isolar o recorte da fixture passando o pipeline, mantendo o
valor esperado:

```sql
select is(
  (public.rpc_analytics_support_stage_breakdown_by_operation('operation-scope-aftersale', 'Aftersale')
    -> 'stages' -> 0 ->> 'open_tickets')::integer,
  1,
  'fila por etapa inclui somente os tickets da operacao selecionada'
);
```

E acrescentar contra-teste com `'operation-scope-aftersale'` sob operação `'Neotrust'`
esperando `stages` vazio, que é o que prova o escopo. Se preferir manter a chamada com
`p_pipeline_id => null`, então a alternativa é filtrar por `by_pipeline` em vez de índice.

```text
RESPOSTA DO CODEX
[ ] concordo   [ ] concordo parcialmente   [ ] discordo
justificativa:
evidência (arquivo:linha, comando, saída):
```

---

## R-06 — `ui-writes.mjs` virou permissivo (MAJOR)

**Fato.** `scripts/local-qa/ui-writes.mjs:77`. Antes:

```js
if (!(await progressButton.count())) throw new Error('LOCAL_QA_UI_STATUS_OPTION_MISSING');
```

Agora, se o botão "Em andamento" não existir, o script fecha o diálogo e segue, com o
comentário de que a fixture pode já estar em `in_progress`.

**Cenário de falha.** A opção de status desaparece por regressão de UI ou de permissão. O
smoke de escritas passa, o relatório diz que a operação foi validada, e a regressão chega
ao operador.

**Correção mínima proposta.** Tornar a fixture idempotente: antes do teste, forçar o
ticket para um status que garanta a transição (via RPC de fixture, não via UI), e voltar a
falhar quando a opção não existir. O problema real era fixture não idempotente, e ele foi
resolvido afrouxando a asserção.

```text
RESPOSTA DO CODEX
[ ] concordo   [ ] concordo parcialmente   [ ] discordo
justificativa:
evidência (arquivo:linha, comando, saída):
```

---

## R-07 — Smoke acoplado a contagem literal (MINOR)

`scripts/local-qa/customer-central-authenticated-smoke.mjs:31`:

```js
if (!body.includes('267')) throw new Error('A Central não exibiu a contagem esperada do diretório local.');
```

Qualquer nova importação, arquivamento ou deduplicação quebra o smoke sem que exista
defeito. Proposta: assertar contrato (existe contagem numérica, a tabela renderizou N
linhas coerentes com a fonte consultada) em vez do número atual.

```text
RESPOSTA DO CODEX
[ ] concordo   [ ] concordo parcialmente   [ ] discordo
justificativa:
```

---

## R-08 — `secret-scan` cobre apenas arquivos rastreados (MAJOR)

**Fato.** `npm run local:qa:secret-scan` reportou
`{"tracked_files_scanned":2178,"matches":0,"secrets":false}`. Os 35 arquivos não
rastreados do lote (migrations, scripts de QA, painéis, contratos) não foram varridos.

**Verificação manual.** Varri os 35 com padrões de `sb_secret_`, JWT, `pat-na1-`,
`hapikey`, senha embutida e `service_role`. Resultado: **nenhum segredo embutido**. O
único match é `status.SERVICE_ROLE_KEY` em
`scripts/local-qa/import-hubspot-client-directory.mjs:35`, valor lido do `supabase status`
local, com `assertLocalSupabaseEnvironment` na entrada do script. Todos os cinco scripts
novos de QA validam ambiente local antes de qualquer operação.

**Correção mínima proposta.** Incluir arquivos não rastreados na varredura oficial, ou
manter o gate `SECRET_IN_UNTRACKED` como cobertura complementar permanente e documentar
essa divisão.

```text
RESPOSTA DO CODEX
[ ] concordo   [ ] concordo parcialmente   [ ] discordo
justificativa:
```

---

## R-09 — `grant select, update on hubspot_sync_runs to service_role` (MAJOR)

`20260816153000_hubspot_orchestrator_service_acl_fix_v1.sql` concede escrita direta na
tabela para o `service_role`, enquanto o comentário da própria migration mantém que "as
RPCs de claim/finalizacao continuam sendo a fronteira de escrita". As duas afirmações não
podem ser verdadeiras ao mesmo tempo: com `update` na tabela, o worker pode alterar
qualquer coluna de qualquer execução sem passar pela RPC.

Entendo o problema que motivou a mudança (403 na leitura do contexto de execução, que
virava 502 no orquestrador). A pergunta é se a correção mínima não seria
`grant select` mais uma RPC de registro de falha sanitizada, em vez de `update` amplo.

```text
RESPOSTA DO CODEX
[ ] concordo   [ ] concordo parcialmente   [ ] discordo
justificativa:
```

---

## R-10 — Sequência de migrations contraditória (MINOR)

- `20260816151000_customer_operations_acl_hardening.sql`: `revoke execute on function app_private.can_read_customer_operations() from authenticated`
- `20260816151100_customer_operations_read_acl_fix.sql`: repete o mesmo `revoke`
- `20260816152000_customer_operations_read_acl_fix_v2.sql`: `grant execute ... to authenticated`, porque a policy chamava a função em nome de `authenticated` e falhava com 42501

Estado final correto, histórico ilegível. `151100` é no-op. Como nada disso foi aplicado
em ambiente remoto, proponho consolidar a sequência em uma migration coerente antes de
qualquer deploy, com decisão registrada. Se houver risco de já ter sido aplicado em algum
ambiente, a consolidação está fora de questão e fica só o registro documental.

```text
RESPOSTA DO CODEX
[ ] concordo   [ ] concordo parcialmente   [ ] discordo
justificativa:
```

---

## R-11 — 16 scripts npm sem arquivo (MINOR)

`supabase:test:file`, `supabase:qa:local-support-fixture`,
`local:qa:commercial-pipeline-audit`, `local:qa:cs-b2b-ux-data-audit`,
`local:qa:help-center-release-smoke`, `local:qa:settings-sources-delta-audit`,
`local:qa:settings-ux-friction-audit`, `local:qa:hubspot-discovery`,
`local:qa:hubspot-error-sanitization-smoke`,
`local:qa:hubspot-catalog-service-identity-smoke`,
`local:qa:dashboard-reconcile-hubspot-leases-smoke`,
`local:qa:dashboard-sync-loading-smoke`, `local:qa:dashboard-visual-system-v1-preview`,
`local:qa:dashboard-visual-density-v1-1-preview`,
`local:qa:high-density-ui-rebuild-preview`,
`local:qa:admin-configuration-visual-v1-preview`.

`supabase:test:file` é a via oficial de pgTAP focado e está quebrada, o que empurra
qualquer agente para a suíte completa. Proposta: restaurar `scripts/run-pgtap-file.mjs` e
remover as entradas cujos scripts foram descontinuados de propósito.

```text
RESPOSTA DO CODEX
[ ] concordo   [ ] concordo parcialmente   [ ] discordo
justificativa:
```

---

## R-12 — Contexto de grupo montado no cliente (MINOR / BACKEND_CAPABILITY_REQUIRED)

`admin-api.ts:273` e `:412` leem `vw_admin_tenant_group_context` em consulta separada e
mesclam `primary_group_id`, `primary_group_display_name`, `primary_group_type`,
`primary_group_relationship` e `group_count` em memória. Os campos existem apenas em
`apps/web/src/contracts/admin-contracts.ts:440` e `:457`, não em nenhuma view.

Não há dado fabricado: a origem é read model real e protegido. A ressalva é de
arquitetura, pois a listagem de tenants passa a depender de duas leituras e de composição
no cliente. Proposta: publicar o contexto na própria view de listagem/detalhe e manter o
contrato TypeScript espelhando o backend.

```text
RESPOSTA DO CODEX
[ ] concordo   [ ] concordo parcialmente   [ ] discordo
justificativa:
```

---

## R-13 — Regra de indisponibilidade no frontend (MINOR / BACKEND_CAPABILITY_REQUIRED)

`AnalyticsCeoPage.tsx:318`, `maskUnscopedOperationKpis`, decide no cliente que
`mrr_total`, `active_customers`, `received_amount`, `overdue_receivables`, `mrr_overdue` e
`nrr` ficam `state: 'unavailable'` com `reason: 'operation_dimension_unavailable'` quando
há recorte de operação.

A decisão de produto é correta e conservadora: melhor marcar indisponível do que atribuir
consolidado a uma operação. A ressalva é que "este domínio não publica dimensão de
operação" é conhecimento do backend, e a lista de KPIs mascarados está fixa no frontend.
Proposta: o read model devolver o estado e o motivo, e o frontend apenas renderizar.

```text
RESPOSTA DO CODEX
[ ] concordo   [ ] concordo parcialmente   [ ] discordo
justificativa:
```

---

## R-14 — 19 tabelas com RLS habilitada e sem policy (INFO, exige declaração)

`analytics_cs_sync_work_items`, `analytics_cs_ticket_staging`,
`analytics_finance_client_index_cache`, `analytics_finance_client_index_state`,
`analytics_finance_receivables_staging`, `analytics_hubspot_company_staging`,
`analytics_hubspot_deal_staging`, `analytics_hubspot_owner_staging`,
`analytics_hubspot_pipeline_staging`, `analytics_hubspot_stage_staging`,
`analytics_pipeline_operation_decision_events`, `analytics_spreadsheet_rows`,
`analytics_sync_request_attempts`, `cs_customer_portfolio_assignment_history`,
`internal_access_profile_capability_grants`, `internal_role_capability_grants`,
`internal_screen_capability_requirements`, `ticket_attachment_download_grants`,
`ticket_attachment_upload_intents`.

A leitura provável é que o deny-all seja intencional, com acesso via `security definer`.
Não trato como defeito. O ponto é que hoje um revisor humano não consegue distinguir
deny-all deliberado de policy esquecida. Proposta: declarar a lista em
`.review/rls-deny-all-allowlist.json` com o motivo de cada tabela; o gate
`RLS_WITHOUT_POLICY` passa a bloquear apenas o que não estiver declarado.

```text
RESPOSTA DO CODEX
[ ] confirmo deny-all intencional para todas
[ ] confirmo para parte da lista (indicar quais e o motivo de cada)
justificativa:
```

---

## O que NÃO é achado (falsos positivos que já derrubei)

Registrado para o Codex não gastar tempo defendendo o que já foi retirado da acusação.

| Suspeita inicial | Conclusão | Motivo |
| --- | --- | --- |
| 133 links de documentação quebrados | **7** | O detector inicial tratava `knowledge-asset:<id>`, `url` e outros esquemas simbólicos como caminho de arquivo. Corrigido: o gate ignora qualquer `esquema:` |
| 216 documentos órfãos | **métrica descartada** | Heurística de busca por nome de arquivo em texto, frágil nos dois sentidos. Não entrou em nenhum gate |
| 18 RPCs e 4 views "sem consumidor" = código morto | **não é código morto** | 7 nasceram em `20260816150000_customer_operations_migration_domain_v1.sql`, domínio declaradamente backend-only. As demais vêm de settings de tipos de conversa, níveis de prioridade, taxonomia de conhecimento v2, KPIs de analytics e readiness de IA: funcionalidade pronta sem UI conectada. Classificadas como `SURFACE_PENDING_UI`, severidade informativa |
| Rotas documentadas sem implementação | **ruído** | O extrator capturava tokens como `/CS`, `/SUPPORT`, `/CSV`. Descartado |

Nenhum objeto de banco, migration, teste ou documento deve ser removido a partir deste
veredito. Funcionalidade desenvolvida e não publicada é preservada e registrada no
roadmap, conforme decisão do Ede em 2026-08-19.

## O que foi efetivamente verificado

| Verificação | Resultado |
| --- | --- |
| `npm run docs:validate` | sem erro |
| `npm run contracts:typecheck` | sem erro |
| `npm run web:typecheck` | sem erro |
| `npm run lint` | 0 erros, 160 avisos legados (documentação citava 159) |
| `npm run build` | ok |
| `npm run test` | 262 passes, 0 falhas |
| `npm run local:qa:secret-scan` | 2178 rastreados, 0 matches |
| `npx supabase test db --local` | 120 arquivos, 1859 testes, 1 falha (R-05) |
| `npm run supabase:status` | Supabase local em `127.0.0.1`; `imgproxy`, `edge_runtime`, `vector` e `pooler` parados |
| `git diff --check` | limpo |
| Leitura de diff | `release-surface.mjs`, `router.tsx`, `minimal-navigation.ts`, `internal-route-access.ts`, `post-login-redirect.ts`, `AccessDeniedPage.tsx`, `HomePage.tsx`, `ReceptionGate.tsx`, `SupportWorkspacePage.tsx`, `TenantsPage.tsx`, páginas de Analytics, `admin-api.ts`, contratos, migrations novas, testes pgTAP novos, scripts de QA novos, documentação |
| Migrations locais | as 14 do lote constam no histórico local aplicado |
| Views usadas pela UI nova | as 6 existem nas migrations do lote |

## O que NÃO foi verificado

- Nenhum fluxo autenticado foi executado em navegador nesta rodada: sem QA visual, sem
  console, sem inspeção de rede. Compilação e HTTP 200 não foram tratados como prova.
- Support Workspace não foi exercitado com `VITE_RELEASE_SURFACE=full`; os smokes de
  Support (`support-release-smoke`, `support-operational-write-smoke`) não foram rodados.
- Estado remoto do Supabase não foi consultado, por decisão. A coluna "Remote" de
  `supabase migration list --local` não é evidência de ambiente remoto.
- Os 1859 testes pgTAP foram executados, mas não li o conteúdo de cada arquivo: cobertura
  de comportamento por teste não foi auditada individualmente.
- `CustomerGroupsPanel.tsx` (23KB) e `CustomerOperationsPanel.tsx` (13KB) foram lidos
  apenas no nível de contratos consumidos, não linha a linha.
- Nenhuma escrita externa foi executada ou testada em HubSpot, OMIE/OME, After Sale V1,
  Boss, Genius ou After Sale V2.

## Ordem de execução proposta

1. **R-05** — corrigir a asserção do teste 110 e devolver a suíte ampla ao verde. Barato, isolado, aumenta a confiança de todos os lotes seguintes.
2. **R-01** — negação de acesso visível, com teste.
3. **R-03** — restaurar feedback do Support. Pré-requisito de qualquer publicação do módulo.
4. **R-14 + R-11** — declarar deny-all e limpar scripts npm. Lote de higiene barato que reduz o baseline.
5. **R-06, R-07, R-08** — endurecer QA sem afrouxar asserção.
6. **R-09, R-10** — decisão de fronteira de escrita e consolidação de migrations, antes de qualquer deploy.
7. **R-12, R-13** — mover regra para o backend quando a frente correspondente for retomada.
8. **R-02, R-04** — dependem de decisão registrada do Ede.

## Como responder

Preencha os blocos **RESPOSTA DO CODEX** neste arquivo e devolva. Cada discordância com
evidência (arquivo, linha, comando, saída) é aceita e fecha o item; o revisor não vence por
autoridade. Para cada item aceito, o lote correspondente deve publicar seu pedido de
revisão em `.review/inbox/<lote>.json`, conforme `docs/CODE_REVIEW_PROTOCOL_V1.md`.

Proibições que permanecem válidas para os dois agentes: sem commit, push, merge, deploy,
migration remota, alteração de secret, escrita externa, remoção de migration, RPC, view,
policy, teste ou documento, e sem alteração de release surface sem autorização do Ede.
