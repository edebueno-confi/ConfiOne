# REVIEW

- Task ID: `AUTH-MODEL-INVENTORY-2026-08-21`
- Estado revisado: `READY_FOR_REVIEW` (re-review incremental)
- Veredito final: `APPROVED`
- Veredito da review inicial: `CHANGES_REQUESTED` (findings preservados abaixo)
- Reviewer: Sentinel (Codex Independent Reviewer)
- Review mode: `SENTINEL_REQUIRED`
- Base SHA: `76a7b867783c9303d2aca845c5b99b60c268377a`
- HEAD observado: `76a7b867783c9303d2aca845c5b99b60c268377a`
- Implementation SHA: `UNCOMMITTED_WORKTREE`
- Estado do worktree: alterações rastreadas e não rastreadas amplas, preservadas
  e fora da allowlist deste lote.

## Resumo da entrega

Foi produzido `docs/specs/AUTHORIZATION_MODEL_INVENTORY_V1.md`, um inventário
documental do fluxo de autenticação e autorização interna. A funcionalidade
melhorada é a capacidade de governança do produto: agora existe uma visão
documentada de identidade, contexto, papéis, telas, capabilities, guards,
menu, router, backend, estados de acesso e lacunas para orientar a futura
auditoria do modelo sem simplificação prematura.

O documento cobre a maior parte dos critérios da TASK e separa fatos,
hipóteses, decisões pendentes e limitações. A decisão não altera runtime,
SQL, migrations, RLS, policies, contratos executáveis ou UI.

## Findings

### F-AUTH-001 — HIGH — Runtime de workspace descrito por contrato histórico

- **Evidência:** o inventário afirma que o caminho de membership exige tenant
  ativo, área ativa, `tenant_memberships` ativa e perfil ativo no modo
  `profile`, citando `supabase/migrations/20260722221746_internal_profile_screen_access_contract_v1.sql:488-556`.
  Esse contrato foi substituído no runtime pela função
  `app_private.internal_actor_workspace_context()` e pelo RPC público em
  `supabase/migrations/20260727173000_access_01_3_workspace_context_runtime_hardening.sql:10-124`.
  A função vigente verifica profile ativo, membership interna ativa, tela
  ativa/publicada e `has_internal_capability`; não faz join com
  `tenant_memberships` ou `tenants.status` e não possui o ramo de
  `permission_mode = profile` descrito pelo inventário.
- **Impacto:** a matriz não é reproduzível contra o contrato backend vigente e
  pode levar a futura auditoria a classificar incorretamente isolamento,
  revogação de tenant e resolução de perfil. Como a task é uma fundação factual
  de autorização, isso impede aprovação.
- **Correção esperada:** reescrever a seção 4.3 e as referências de backend
  usando o RPC/função vigente. Separar explicitamente o contrato histórico
  preservado do runtime efetivo e registrar como lacuna qualquer divergência
  entre custom/profile, membership de tenant e status do tenant.

### F-AUTH-002 — MEDIUM — Guard de Customer Success atribuído a `screen/role` sem evidência runtime

- **Evidência:** a linha da matriz de Customer Success atribui ao `CsGate`
  contexto `vw_cs_customer_portfolio`, `screen/role` e dados de carteira
  (`docs/specs/AUTHORIZATION_MODEL_INVENTORY_V1.md:142`). O router envolve
  `/cs` com `ReleaseSurfaceGate` e `CsGate`
  (`apps/web/src/app/router.tsx:510-527`). O `CsGate` efetivamente bloqueia
  `dashboard_viewer` e decide acesso por carteira retornada, permitindo
  `platform_admin` quando a carteira está vazia
  (`apps/web/src/features/cs/CsGate.tsx:147-205`). A função
  `canOpenInternalRoute()` que verifica `cs_portfolio`/`hasCsPortfolioAccess`
  (`apps/web/src/features/auth/internal-route-access.ts:117-119`) não é o
  wrapper usado pelo ramo `/cs` do router. O backend da carteira usa
  `can_access_cs_customer_portfolio()` e membership ativa de
  `customer_success`, conforme
  `supabase/migrations/20260604193000_cs_portfolio_contract_foundation.sql:1-32`.
- **Impacto:** o inventário pode induzir a próxima auditoria a procurar um
  screen grant ou role global que não é o gate efetivo dessa superfície e a
  perder a distinção entre autorização de dados e autorização de rota.
- **Correção esperada:** corrigir a matriz para descrever o gate efetivamente
  executado no router e separar a função utilitária de rota, se permanecer sem
  consumo nessa família. Registrar claramente que a proteção server-side da
  carteira é baseada no helper/membership e que a checagem de tela não foi
  demonstrada nesse fluxo.

### F-AUTH-003 — MEDIUM — Engenharia e Acionamentos descritos com gates próprios inexistentes

- **Evidência:** a matriz declara “gates próprios” e “screen key, role ou
  contexto de área” para Engenharia e Acionamentos
  (`docs/specs/AUTHORIZATION_MODEL_INVENTORY_V1.md:144`). O router usa
  `SupportGate` para as duas famílias
  (`apps/web/src/app/router.tsx:590-646`). O `SupportGate` só autoriza
  `platform_admin`, `support_manager`, `support_agent` ou screen keys de
  suporte (`apps/web/src/features/support/SupportGate.tsx:102-120`); os
  `engineering_*` e `internal_actions` não aparecem nessa decisão. As regras
  correspondentes em `canOpenInternalRoute()` estão em
  `apps/web/src/features/auth/internal-route-access.ts:129-139`, mas esse
  utilitário não é usado como wrapper pelo router dessas rotas.
- **Impacto:** o mapa de autorização fica divergente do caminho realmente
  executado, especialmente nos cenários de bypass por URL, role de Engenharia
  e capability de Acionamentos. Isso compromete o objetivo da task de localizar
  consumidores reais e separar regra implementada de regra apenas declarada.
- **Correção esperada:** atualizar a matriz e a seção do router com o gate real,
  registrar a divergência entre `SupportGate` e `canOpenInternalRoute()` como
  lacuna/finding de auditoria e não apresentar roles/contextos de Engenharia ou
  Acionamentos como proteção efetiva sem prova de execução.

## Gates e validações independentes

- `npm run docs:validate` — PASS; 0 documentos bloqueados, 9 alertas de
  sensibilidade preexistentes no catálogo interno.
- `npm run review:gates` — PASS; 0 regressões bloqueantes, 45 itens do baseline
  resolvidos.
- `node --test tests/scripts/access-denied-feedback.test.mjs
  tests/scripts/access-control-v2-contract.test.mjs
  tests/scripts/release-surface.test.mjs
  tests/scripts/minimal-navigation.test.mjs` — PASS; 42/42.
- `node --test tests/scripts/auth-admin-denial-root-cause.test.mjs` — PASS;
  5/5.
- `git diff --check` — PASS.
- Typecheck, build, lint, pgTAP e QA de navegador não foram executados pelo
  Sentinel porque o lote não altera comportamento executável. A validação
  documental não constitui prova de integração runtime.
- Scan automatizado de segurança diferencial não esteve disponível nesta
  sessão por indisponibilidade do ambiente/conector. Foi feita inspeção manual
  dos caminhos de autorização citados; os findings acima são de precisão do
  inventário, não de alteração de runtime introduzida por este lote.

## Decisão e próximo passo

`CHANGES_REQUESTED`. O inventário é útil e os gates passam, mas Forge deve
corrigir os três pontos de precisão factual e devolver o handoff em
`READY_FOR_REVIEW` para re-review incremental. Nenhuma alteração de produto,
commit, push, merge, deploy, migration remota, secret ou escrita externa foi
realizada pelo Sentinel.

## Re-review incremental — 2026-08-22

**Reviewer: Sentinel (Codex Independent Reviewer)**

- **Task ID:** `AUTH-MODEL-INVENTORY-2026-08-21`
- **Estado revisado:** `READY_FOR_REVIEW`
- **Base SHA:** `76a7b867783c9303d2aca845c5b99b60c268377a`
- **HEAD observado:** `76a7b867783c9303d2aca845c5b99b60c268377a`
- **Implementation SHA:** `UNCOMMITTED_WORKTREE`
- **Escopo:** somente `docs/specs/AUTHORIZATION_MODEL_INVENTORY_V1.md` e handoff; nenhuma alteração executável foi aceita como parte deste lote.

### Findings reavaliados

- **F-AUTH-001 — RESOLVIDO.** A seção 4.3 e a linha de membership da seção 3
  identificam `app_private.internal_actor_workspace_context()` e o RPC
  vigente, distinguem grants de papel global e membership interno, e registram
  explicitamente que o runtime não valida diretamente
  `tenant_memberships.status`, `tenants.status` ou `permission_mode = profile`.
  O migration `20260722221746` ficou classificado como evidência histórica,
  e a divergência entre grants de tela e capability por perfil foi preservada
  como lacuna.
- **F-AUTH-002 — RESOLVIDO.** A matriz de Customer Success descreve
  `ReleaseSurfaceGate + CsGate`, o bloqueio de `dashboard_viewer`, a carga da
  carteira e a exceção de `platform_admin`. A proteção server-side por
  `can_access_cs_customer_portfolio()` e membership ativa de Customer Success
  foi separada do utilitário `canOpenInternalRoute()`, que não é apresentado
  como wrapper efetivo do ramo `/cs`.
- **F-AUTH-003 — RESOLVIDO.** A matriz e a seção do router descrevem
  `ReleaseSurfaceGate + SupportGate` para Engenharia e Acionamentos. As regras
  de `canOpenInternalRoute()` foram classificadas como divergência a auditar,
  não como gate efetivo dessas rotas.

### Gates independentes do re-review

- `npm run docs:validate` — **PASS**, 0 documentos bloqueados; 9 alertas de
  sensibilidade preexistentes.
- `npm run review:gates` — **PASS**, 0 regressões bloqueantes; 45 itens do
  baseline resolvidos.
- `node --test tests/scripts/access-denied-feedback.test.mjs tests/scripts/auth-admin-denial-root-cause.test.mjs tests/scripts/access-control-v2-contract.test.mjs tests/scripts/minimal-navigation.test.mjs tests/scripts/release-surface.test.mjs` — **PASS**, 47/47.
- `git diff --check` — **PASS**.
- Typecheck, build, lint, pgTAP e QA de navegador não foram executados porque
  o lote permanece documental e não altera comportamento executável.
- Scan automatizado de segurança diferencial não esteve disponível nesta
  sessão; a inspeção manual dos caminhos de autorização citados não encontrou
  novo finding no escopo documental.

### Veredito final

`APPROVED`. Os três findings foram resolvidos com evidência documental
compatível com o código e o router atuais. A aprovação não autoriza push,
merge, deploy, migration remota, alteração de secrets ou release. O próximo
passo autorizado é o Forge realizar a finalização local do lote, com commit
exclusivo apenas da allowlist aprovada, arquivamento do handoff e normalização
do estado corrente.
