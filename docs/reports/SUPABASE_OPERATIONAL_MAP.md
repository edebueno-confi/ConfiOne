# Supabase Operational Map

## Objetivo
Mapear a operação Supabase real do repositório para continuidade segura, sem resetar banco local, sem tocar ambiente remoto e sem executar migrations destrutivas.

## Escopo auditado
- `supabase/config.toml`
- `supabase/migrations/*.sql`
- `supabase/tests/*.sql`
- `supabase/bootstrap/*`
- `supabase/qa/*`
- `supabase/seeds/README.md`
- `scripts/ci/run-supabase-verify.mjs`
- `scripts/ci/run-supabase-db-reset.mjs`
- `scripts/ci/wait-for-supabase-ready.mjs`
- `.github/workflows/supabase-db.yml`
- docs operacionais relacionadas (`supabase/README.md`, `docs/SECURITY_RLS_TEST_PLAN.md`, `docs/REMOTE_SUPABASE_DEPLOY_RUNBOOK.md`)

## Inventário operacional atual
- Migrations versionadas: 46 arquivos em `supabase/migrations/`
- Testes pgTAP versionados: 40 arquivos em `supabase/tests/`
- Edge Functions versionadas: 3 arquivos sob `supabase/functions/`
- Seeds desabilitados por padrão em `supabase/config.toml` (`[db.seed].enabled = false`)
- Workflow CI dedicado: `.github/workflows/supabase-db.yml`

## Estrutura de operação
### 1. Fonte executável
- Fonte real do banco: `supabase/migrations/*.sql`
- Cobertura de segurança/contrato: `supabase/tests/*.sql`
- Bootstrap controlado de primeiro admin: `supabase/bootstrap/bootstrap-first-platform-admin.mjs`
- Fixtures locais de QA:
  - `supabase/qa/create-local-admin-fixture.mjs`
  - `supabase/qa/create-local-support-fixture.mjs`
- Orquestração local/CI:
  - `scripts/ci/run-supabase-verify.mjs`
  - `scripts/ci/run-supabase-db-reset.mjs`
  - `scripts/ci/wait-for-supabase-ready.mjs`

### 2. Scripts npm relevantes
Extraídos de `package.json`:
- `npm run supabase:start`
- `npm run supabase:wait:ready`
- `npm run supabase:db:reset:raw`
- `npm run supabase:db:reset`
- `npm run supabase:test:db`
- `npm run supabase:lint:db`
- `npm run supabase:verify`
- `npm run supabase:bootstrap:first-admin`
- `npm run supabase:qa:local-admin-fixture`
- `npm run supabase:qa:local-support-fixture`
- `npm run knowledge:verify:octadesk:space-aware`

## Fluxos reais e fronteiras seguras
### A. Start local
Comando-base:
- `npm run supabase:start`

Readiness:
- `npm run supabase:wait:ready`
- o script faz probe HTTP de `rest-admin` e `functions/_internal/health`, além de probe TCP do Postgres
- o script decide dinamicamente se precisa verificar Edge Runtime

Quando usar:
- para subir stack local antes de QA manual, pgTAP, fixtures ou frontend local

Quando não automatizar:
- não usar como inferência de que o banco está “pronto” sem passar pelo readiness script; a própria automação do repositório separa start de readiness

### B. Reset local
Comandos:
- bruto: `npm run supabase:db:reset:raw`
- envelopado com retry/readiness: `npm run supabase:db:reset`

Comportamento real:
- `scripts/ci/run-supabase-db-reset.mjs` roda readiness antes do reset
- há retry configurável por `SUPABASE_DB_RESET_ATTEMPTS` e `SUPABASE_DB_RESET_RETRY_DELAY_MS`
- o reset é explicitamente local (`supabase db reset --local --yes`)

Fronteira:
- é operação destrutiva sobre banco local
- não deve rodar durante auditoria, investigação documental ou quando o objetivo for apenas leitura do estado
- não deve ser usada como “atalho” para corrigir bug sem hipótese clara

### C. Verify local completo
Comando:
- `npm run supabase:verify`

Pipeline real em `scripts/ci/run-supabase-verify.mjs`:
1. `supabase:db:reset`
2. `supabase:test:db`
3. `knowledge:verify:octadesk:space-aware`
4. `supabase:lint:db`
5. fora de CI, readiness de novo
6. fora de CI, reidratação do fixture admin com `supabase:qa:local-admin-fixture --with-denied-user`

Leitura operacional:
- `supabase:verify` não é smoke test leve
- `supabase:verify` reescreve o banco local via reset antes de testar
- `supabase:verify` também tem efeito de fixture no ambiente local fora da CI

Fronteira:
- não automatizar esse comando em ambiente compartilhado/local com dados de trabalho que precisem ser preservados
- não usar como “checagem rápida” quando a restrição da tarefa proíbe reset

### D. Testes de banco
Comando:
- `npm run supabase:test:db`

Cobertura declarada pelo repositório:
- identidade/tenancy/RLS
- hardening administrativo
- auditoria estrutural de functions/views
- Knowledge Base
- Support Workspace
- Customer Portal
- Internal Actions
- Internal Documents

Documento de apoio:
- `docs/SECURITY_RLS_TEST_PLAN.md`

Fronteira:
- seguro para validar contrato local após stack pronta
- depende de banco local coerente com migrations atuais

### E. Lint de banco
Comando:
- `npm run supabase:lint:db`

Uso:
- checa schema local
- entra como etapa obrigatória na CI e no `supabase:verify`

### F. Bootstrap do primeiro platform_admin
Comando-base:
- local: `npm run supabase:bootstrap:first-admin -- --local --user-id <uuid>`
- remoto: requer `SUPABASE_DB_URL` e não deve ser executado sem janela aprovada

Garantias implementadas:
- exige UUID explícito
- falha se já existir `platform_admin`
- valida existência de profile ativo
- usa `app_private.platform_admin_bootstrap_status()` e `app_private.bootstrap_first_platform_admin(...)`
- não depende de seed demo
- não abre policy temporária

Fronteira:
- local: controlado, mas ainda é mutação privilegiada
- remoto: requer confirmação humana e janela operacional aprovada

### G. Fixtures locais de QA
#### Admin fixture
Arquivo: `supabase/qa/create-local-admin-fixture.mjs`

Guardrails reais:
- bloqueia se `API_URL`/`DB_URL` não forem locais
- exige `SERVICE_ROLE_KEY` local
- usa Auth Admin API local (`/auth/v1/admin/users`)
- pode opcionalmente criar usuário negado com `--with-denied-user`
- encadeia bootstrap local do primeiro admin quando necessário

#### Support fixture
Arquivo: `supabase/qa/create-local-support-fixture.mjs`

Guardrails reais:
- bloqueia se `API_URL`/`DB_URL`/chaves não forem locais
- exige `SERVICE_ROLE_KEY` e `ANON_KEY` locais
- usa Auth Admin API local para montar usuários QA
- usa RPCs reais do produto para compor cenários (`rpc_create_ticket`, `rpc_support_link_ticket_article`, `rpc_support_mark_documentation_gap`, upload governado de anexos e handoff para engenharia)
- sobe `supabase functions serve` com env file temporário quando precisa servir funções localmente

Leitura operacional:
- o fixture de suporte é volumoso e cobre cenários ricos de inbox, timeline, anexos, handoff e portal
- ele é útil para QA de produto, mas não é um smoke check barato

Fronteira:
- ambos os fixtures são restritos ao ambiente local
- não devem ser apontados para remoto
- não devem ser tratados como seed de produto

### H. Remoto
Documento base:
- `docs/REMOTE_SUPABASE_DEPLOY_RUNBOOK.md`

Fluxo documentado:
- `supabase login`
- `supabase link`
- `supabase migration list --linked`
- `supabase db push --linked --dry-run`
- `supabase db push --linked`
- bootstrap remoto opcional do primeiro admin, somente com aprovação

Fronteira:
- qualquer ação remota permanece fora do escopo de automação segura sem confirmação explícita
- especialmente proibidos nesta frente: reset remoto, seed remota, uso de `service_role` como atalho de schema, bootstrap remoto fora de janela

## CI real do repositório
Arquivo: `.github/workflows/supabase-db.yml`

Etapas atuais:
1. checkout
2. setup Node 24
3. `npm ci`
4. `npm run contracts:typecheck`
5. `npm run web:typecheck`
6. `npm run web:build`
7. `npm run supabase:start`
8. `npm run supabase:wait:ready`
9. `npm run supabase:db:reset`
10. `npm run supabase:test:db`
11. `npm run knowledge:verify:octadesk:space-aware`
12. `npm run supabase:lint:db`
13. diagnósticos via `supabase status` e `docker logs` em falha
14. `supabase stop`

Leitura operacional:
- o repositório trata frontend + contratos + banco como pipeline acoplado de validação
- qualquer mudança Supabase relevante precisa considerar impacto em `contracts`, `web:typecheck` e `web:build`, não só nos testes SQL

## Riscos e inconsistências encontradas
### 1. Drift entre `config.toml` e o restante da operação local
- `supabase/config.toml` hoje expõe portas `54321-54327`
- `scripts/ci/wait-for-supabase-ready.mjs` usa `55321/55322`
- `docs/PROJECT_STATE.md` afirma que as portas locais foram remapeadas para `55321-55327`
- `apps/web/README.md` orienta `VITE_SUPABASE_URL=http://127.0.0.1:55321`

Impacto:
- start/readiness/frontend/documentação não estão alinhados sobre qual é a porta oficial local
- esse drift pode quebrar bootstrap local e QA manual mesmo sem erro de schema

Ação recomendada:
- tratar isso como correção P1 antes de depender de automação local repetível
- alinhar `supabase/config.toml`, readiness script, docs e setup frontend para uma única faixa oficial

### 2. `supabase:verify` é mais destrutivo do que o nome sugere
Evidência:
- o primeiro passo do verify é `supabase:db:reset`
- fora da CI, o verify ainda reidrata fixture admin local

Impacto:
- alto risco de uso indevido como comando “seguro” de checagem rápida

Ação recomendada:
- manter esse detalhe explícito em runbooks e handoffs
- evitar agendar `supabase:verify` em automações recorrentes cegas sem contexto do banco local

### 3. Documentação histórica de Supabase está parcialmente defasada
Evidência:
- `supabase/README.md` e `docs/REMOTE_SUPABASE_DEPLOY_RUNBOOK.md` ainda carregam resultados históricos como `Files=6, Tests=93` e janela validada das 4 migrations iniciais
- o estado atual do repositório já está em 46 migrations e 40 arquivos de teste SQL

Impacto:
- operadores podem tomar números históricos como fotografia atual

Ação recomendada:
- revisar os documentos históricos para separar claramente “fechamento validado da época” de “estado corrente”

### 4. Fixture de suporte concentra muita lógica operacional em um único script
Evidência:
- `supabase/qa/create-local-support-fixture.mjs` tem milhares de linhas e cobre auth, RPCs, anexos, knowledge links, engineering handoff e cenários múltiplos

Impacto:
- manutenção difícil
- regressões localizadas podem passar despercebidas
- custo alto para auditoria humana

Ação recomendada:
- fatiar por domínio/etapa em tarefas futuras sem alterar contrato funcional agora

## O que pode ser automatizado sem confirmação extra
- leitura de `migrations`, `tests`, `config.toml`, docs e scripts locais
- `supabase:start`
- `supabase:wait:ready`
- `supabase:test:db`, desde que a stack/local DB correta já esteja pronta e que reset seja permitido no contexto
- `supabase:lint:db`
- inspeção de grants, views e RPCs por leitura local
- geração de relatórios/documentação operacional

## O que não deve ser automatizado sem confirmação
- qualquer operação remota (`db push`, `migration list --linked`, bootstrap remoto, query remota)
- qualquer reset local quando o contexto pedir preservação do banco atual
- qualquer mutation privilegiada fora do fluxo explícito de bootstrap/fixture
- qualquer uso de `SERVICE_ROLE_KEY` fora dos scripts locais que já validam ambiente local
- migrations destrutivas ou ajuste manual ad hoc em schema remoto

## Backlog recomendado para Kanban
1. `SUPABASE P2 · alinhar portas locais e readiness`
   - objetivo: eliminar drift entre `supabase/config.toml`, `scripts/ci/wait-for-supabase-ready.mjs`, docs e frontend local
   - aceite: uma única faixa oficial de portas, com documentação e automação coerentes

2. `SUPABASE P2 · separar verify destrutivo de smoke verify`
   - objetivo: criar comando leve de smoke/check que não execute reset nem fixture
   - aceite: nomenclatura explícita e runbook atualizado para `verify-full` vs `verify-smoke` ou equivalente

3. `SUPABASE P2 · atualizar docs operacionais legadas`
   - objetivo: revisar `supabase/README.md` e `docs/REMOTE_SUPABASE_DEPLOY_RUNBOOK.md` para distinguir estado histórico de estado atual
   - aceite: números e guardrails atuais sem ambiguidade

4. `SUPABASE P3 · modularizar fixture de suporte`
   - objetivo: quebrar `create-local-support-fixture.mjs` por domínio (auth, knowledge, attachments, engineering, portal)
   - aceite: mesma cobertura funcional com scripts menores e testáveis isoladamente

5. `SUPABASE P3 · inventário contratual automatizado`
   - objetivo: gerar relatório derivado de migrations/tests/views/RPCs para reduzir auditoria manual recorrente
   - aceite: script ou doc gerado com contagem e mapa de cobertura

## Evidências principais por path
- Config local: `supabase/config.toml`
- Start/reset/verify/readiness: `package.json`, `scripts/ci/run-supabase-verify.mjs`, `scripts/ci/run-supabase-db-reset.mjs`, `scripts/ci/wait-for-supabase-ready.mjs`
- Bootstrap: `supabase/bootstrap/bootstrap-first-platform-admin.mjs`, `supabase/bootstrap/README.md`
- Fixtures: `supabase/qa/create-local-admin-fixture.mjs`, `supabase/qa/create-local-support-fixture.mjs`
- Cobertura de segurança: `docs/SECURITY_RLS_TEST_PLAN.md`, `supabase/tests/*.sql`
- Pipeline CI: `.github/workflows/supabase-db.yml`
- Operação remota controlada: `docs/REMOTE_SUPABASE_DEPLOY_RUNBOOK.md`

## Validação desta auditoria
- leitura direta dos arquivos listados acima
- inventário local das migrations/tests/scripts reais do repositório
- nenhuma mutation de banco local ou remoto executada
- nenhum reset, fixture apply ou deploy remoto disparado nesta auditoria
