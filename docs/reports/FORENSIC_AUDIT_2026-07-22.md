# Auditoria forense — Genius Support OS (dashboard + integração)

Auditor: Claude / Anthropic (papel: encontrar e documentar; NÃO corrigir).
Data: 2026-07-22. Método: 4 subagentes por domínio (backend/banco, frontend, integração/segurança, git/estrutura) + validação read-only.
Estado auditado: branch `codex/repository-cleanup-consolidation-20260721` (Codex trabalhando em paralelo — alto grau de volatilidade). Nenhuma escrita, commit ou push feito por esta auditoria.

Severidade: P0 crítico (segurança/perda de dado) · P1 alto (quebra funcional/dados) · P2 médio (qualidade/UX) · P3 baixo (cosmético/defesa em profundidade).
Nenhum P0 encontrado. Nenhum segredo versionado/hardcoded encontrado (hits de scan eram fixtures/roles/placeholders).

## Validação read-only (snapshot atual)
- `web:typecheck`: OK. `web:build`: OK (só o aviso conhecido de chunk >500 kB).
- `supabase test db` (pgTAP): NÃO executado nesta rodada (suíte longa + working tree em mudança); recomendação: Codex rodar a suíte completa antes de fechar.

## P1 — Alto

- [P1] `dashboard_viewer` pode gravar credenciais de integração — `supabase/migrations/20260718034735_managed_integrations_v1.sql:82` + gate ampliado em `20260719203000_dashboard_viewer_access_contract_v1.sql:7-8`. `rpc_admin_upsert_managed_integration` valida só `can_read_analytics()`, que passou a incluir `dashboard_viewer`; a função cria/rotaciona segredos no Vault e liga/desliga integrações. Impacto: papel de leitura pode sobrescrever credenciais HubSpot/OMIE (escalonamento de privilégio), contra o próprio comentário do contrato. Recomendação: gate `has_global_role('platform_admin')` na escrita.
- [P1] Gate de escrita da config de fontes rebaixado para viewer — `supabase/migrations/20260720220000_dashboard_viewer_content_settings_access_v1.sql:117-138`. `rpc_admin_upsert_analytics_source_config` passou de `platform_admin` para `can_read_analytics()`. Impacto: viewer edita pipelines/aliases que alimentam todo o dashboard, sem auditoria. Recomendação: confirmar intenção; se não, restaurar `platform_admin`.
- [P1] Deduplicação conflaciona matriz/filial — `supabase/migrations/20260720180000_analytics_company_matching_v1.sql:73,80` (`cnpj_raiz` score 0.9) + `supabase/functions/hubspot-company-create/index.ts:77` (`/cnpj/.test(reason)` → `skipped_cnpj_exists`). Filial legítima (CNPJ distinto, mesma raiz) é bloqueada como "CNPJ já existe" e induziria merge indevido. Impacto: viola a regra matriz/filial/grupo (CLAUDE.md); impede cadastro de filial. Recomendação: tratar `cnpj_raiz` como sinal de "possível grupo/filial" com ação própria, sem bloquear criação nem sugerir merge automático.
- [P1] Read model financeiro nunca purga títulos ausentes → saldo obsoleto no HubSpot — `supabase/functions/omie-sync/index.ts` e `analytics-integration-run/index.ts` (upsert sem delete) + `20260720190000_analytics_finance_company_rollup_v1.sql:54` (`f.balance > 0`). Títulos liquidados/removidos que somem da Omie permanecem; empresas quitadas saem do rollup e suas propriedades `omie_saldo_*` no HubSpot nunca zeram. Impacto: HubSpot exibe saldo permanentemente inflado; "fonte da verdade" diverge a cada re-sync. Recomendação: reconciliar por `sync_run_id` (expirar não vistos) e incluir no rollup empresas zeradas para reset explícito.
- [P1] Sync de saída em massa sem ledger/auditoria persistente — `supabase/functions/hubspot-omie-property-sync/index.ts:72-99`. Atualiza `omie_*` em até 5000 empresas e só devolve resultado na resposta HTTP (sem tabela de auditoria, ao contrário de create/merge). Impacto: escrita em massa no CRM sem rastro de quem/quando/o quê; impossível reconstruir/reverter. Recomendação: gravar run + itens em tabela auditada.
- [P1] Estados de erro em azul de marca (não perigo) — `AnalyticsShell.tsx:25,108`, `AnalyticsLogsPage.tsx:27`, `AnalyticsFilters.tsx:28` usam `--color-brand-blue` para erro/`syncError`/validação. Impacto: falha de sincronização aparece como estado neutro; operador não percebe o erro. Recomendação: usar `--minimal-danger-text`.
- [P1] CRLF vs LF polui o working tree (765 arquivos fantasma) — repo todo; sem `.gitattributes`, `core.autocrlf` vazio; `git diff --ignore-all-space` vazio. Impacto: `git status` inutilizável, risco de commit gigante só-de-EOL e conflitos com o Codex. Recomendação: `.gitattributes` (`* text=auto eol=lf` + regras binário/.bat), `git add --renormalize` em commit isolado, alinhar `core.autocrlf` entre as máquinas ANTES de outros commits.

## P2 — Médio

- [P2] `rpc_admin_set_integration_schedule` gravável por viewer — `20260720200000_analytics_integration_schedule_v1.sql:39` (`can_read_analytics`). Viewer altera cadência de sync em massa. Recomendação: `platform_admin`.
- [P2] Tabelas de config sem trigger de auditoria — `analytics_source_config` (`20260717150000`), `analytics_integration_schedule` (`20260720200000`). Alterações (agora graváveis por viewer) sem rastro. Recomendação: adicionar `audit.capture_row_change`.
- [P2] Sucesso pintado com cor de aviso (amarelo) — `AnalyticsConfigPage.tsx:105,117`, `AnalyticsCeoPage.tsx:137`. Mesmo elemento usa `--minimal-warning-text` para sucesso e erro. Recomendação: separar tom por resultado.
- [P2] Componente morto `ReconciliationQualityTable` — `AnalyticsCeoPage.tsx:122-124` (nunca referenciado; usa a versão agrupada). Recomendação: remover função + import de tipo associado.
- [P2] Portal ID do HubSpot hardcoded — `AnalyticsCeoPage.tsx:162-163` (`.../20108050/...`). Quebra em outro portal/tenant. Recomendação: mover para runtime-config/env.
- [P2] Escala de percentual frágil — `analytics-model.ts:504,507` (÷100) vs `:527,569` (usado 0-1). Sem validação de range. Recomendação: normalizar num ponto único e documentar em VIEW_RPC_CONTRACTS.
- [P2] Duplicata na mesma requisição de criação — `hubspot-company-create/index.ts:59-106`. Dois items com mesmo nome sem CNPJ passam e criam duas empresas. Recomendação: deduplicar items entre si + set de já-criados no loop.
- [P2] Guarda ao vivo de CNPJ depende de formato exato — `_shared/hubspot.ts:492-493` (`EQ` por dígitos) e `searchCompaniesByCnpj` engole erro → `[]`. Se `cnpj` no HubSpot tiver máscara, falso-negativo → duplicata. Recomendação: normalizar dos dois lados e falhar fechado no caminho de escrita.
- [P2] Lacunas de dedupe: nome curto/CNPJ ausente — `20260720180000:74,81` (`length>=4`) e `:53`. "3M"/"TIM" sem CNPJ podem escapar. Recomendação: ajustar piso e exigir revisão humana sem CNPJ.
- [P2] Escrita em massa sem dry-run no caminho orquestrado — `analytics-integration-run/index.ts:106-119`. Recomendação: escrita automática só no caminho agendado; manual com confirmação/limite.
- [P2] property-sync usa PATCH unitário (não batch) em até 5000 empresas — `hubspot-omie-property-sync/index.ts:76-85`. Maior exposição a rate limit/limite do worker. Recomendação: reusar `updateCompaniesBatch`.
- [P2] property-setup sem ledger — `hubspot-property-setup/index.ts:79-85` (mutação de schema do CRM sem auditoria). Recomendação: registrar em tabela auditada.
- [P2] Branch de trabalho sem upstream — destino de push ambíguo. Recomendação: `--set-upstream-to` e confirmar alvo antes de push.
- [P2] Bloat de documentação — `docs/reports/` com 237 arquivos. Recomendação: arquivar/consolidar antigos.
- [P2] Família de tokens inconsistente em ação destrutiva — `AnalyticsConfigPage.tsx:137` (`--color-warning-*` vs `--minimal-warning-*`). Recomendação: padronizar.

## P3 — Baixo / defesa em profundidade

- [P3] ACL frágil `auth.uid() is null` em `security definer` — `20260720180000:49`, `20260720190000:14`. Execute revogado de anon (não explorável hoje), mas frágil. Recomendação: restringir caminho sem uid a `service_role` real.
- [P3] PII (CPF/CNPJ) em `raw_payload` legível por todo leitor de analytics — `_shared/omie.ts:117` + `20260718060000:36-38`. Recomendação: minimizar/mascarar ou restringir leitura do raw.
- [P3] Erro upstream do HubSpot propagado ao cliente — `_shared/hubspot.ts:98-99` (body no corpo da resposta). Recomendação: logar server-side, resposta genérica.
- [P3] `create table` sem `if not exists` em ~19 tabelas novas — inconsistência de idempotência. Recomendação: padronizar.
- [P3] E-mails pessoais hardcoded em migrations — `20260719203000:17`, `20260719204000`. Recomendação: mover concessão de papel para seed de ambiente.
- [P3] Limiar trigram baixo (0.4) — falso-positivo nome curto x longo bloqueando criação. Recomendação: segmentar por comprimento + revisão humana em `nome_similar`.
- [P3] Comparação de secret sem tempo constante — `analytics-integration-run:13`, `omie-sync:9`. Recomendação: comparação constante.
- [P3] Timestamps sintéticos de migration (hora "24") — ex.: `20260721240000`. Recomendação: padronizar geração.
- [P3] Rótulo "Rodar agora" acoplado a `scheduleBusy` — `AnalyticsConfigPage` (nota: o Codex já refatorou parte disso com `runningNow`/`hubspotRunningNow`). Reavaliar.
- [P3] Mascote clicável inacessível — `GeniusMascot.tsx:74-84` (onClick sem tabIndex/teclado/button). Recomendação: se funcional, usar botão focável; se decorativo, remover semântica de ação.
- [P3] Três implementações divergentes de "breakdown" — `AnalyticsCsPage.tsx:219` vs `AnalyticsFinancePage.tsx:41` vs inline em `AnalyticsCeoPage.tsx`. Recomendação: extrair componente comum.
- [P3] Saneamento de dado sujo no frontend — `AnalyticsCsPage.tsx:214` (`WHTASAPP`). Recomendação: normalizar na ingestão.
- [P3] `analytics_company_group_resolution` dito "auditável" sem trigger — `20260719224000:26`. Recomendação: adicionar auditoria ou ajustar comentário.
- [P3] Casts sem validação em mapeadores — `analytics-model.ts:457` (`as 'economic_group'`), naming `rowsTotal` vs grupos (`:459`). Recomendação: validar contra conjunto conhecido; alinhar nomes ao contrato.
- [P3] Artefatos locais e raiz poluída — `.tmp/`, `.playwright-cli/`, `output/`, 8 `.md`/`.bat` na raiz (ignorados/allowlist). Recomendação: limpeza periódica + mover para `docs/`/`scripts/`.

## Volatilidade (Codex em paralelo)
33 arquivos untracked coerentes com trabalho em andamento: novas migrations (`20260721240000`, `20260721241000`, `20260722162254`), pgTAP `068/069`, módulos `.mjs`/`.d.mts` (analytics-permissions, hubspot-company-batch/scope), `GeniusSyncOverlay`, guard `scripts/ci/check-root-artifacts.mjs`. Vários achados de UI podem já estar sendo tratados pelo Codex. Reconferir antes de agir.

## Prioridade recomendada de correção
1. P1 de segurança de gate (viewer × escrita de credenciais/config/schedule).
2. P1 de integridade de dados (purga de títulos + reset de saldo no HubSpot; matriz/filial na dedupe).
3. P1 de auditoria (ledger no property-sync) + P1 de EOL (.gitattributes/renormalize).
4. P1 de UX (cor de erro) e P2 relevantes.
5. P3 conforme fôlego.
