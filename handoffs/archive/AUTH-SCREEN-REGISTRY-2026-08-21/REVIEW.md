# REVIEW

- Task ID: `AUTH-SCREEN-REGISTRY-2026-08-21`
- State: READY_FOR_IMPLEMENTATION
- Reviewer: Sentinel
- Review mode: SENTINEL_REQUIRED

A revisão independente ocorrerá somente após READY_FOR_REVIEW. Sentinel deve
registrar APPROVED, CHANGES_REQUESTED ou BLOCKED sem alterar código executável.

## Revisão independente — 2026-08-22

- **Task ID:** `AUTH-SCREEN-REGISTRY-2026-08-21`
- **Reviewer:** Sentinel (Codex Independent Reviewer)
- **Estado revisado:** `READY_FOR_REVIEW`
- **Base SHA:** `56b8119`
- **Implementation SHA:** `UNCOMMITTED_WORKTREE`

### Funcionalidade e ganho

O lote documenta o mapa `domain -> screen -> route -> capabilities`, separando
manifesto de publicação, menu como descoberta, guards como proteção de UX e
backend/RLS/RPC como boundary efetivo. O ganho potencial é reduzir confusão
entre uma rota disponível, uma opção de menu e uma autorização de dados antes
de qualquer consolidação executável.

### Finding

#### F-AUTHSCREEN-001 — HIGH — registry inventa capability e amplia publicação

- **Requisito:** cada item factual deve apontar para evidência vigente; não
  inventar capability, rota ou estado de publicação.
- **Evidência 1:** a linha de Analytics em
  `docs/specs/AUTHORIZATION_ADMIN_ACCESS_SIMPLIFICATION_PLAN_V1.md` registra o
  backend como `analytics.dashboard_viewer`/helpers. `rg` no código,
  contratos, migrations e testes não encontra essa capability. A migration
  `20260727033235_access_01_internal_control_plane.sql` registra `analytics.view`
  como capability, enquanto `dashboard_viewer` é papel global, não capability.
- **Evidência 2:** o manifesto
  `apps/web/src/app/release-surface.mjs` publica no primeiro release somente
  `home`, `analytics`, `knowledge`, `settings`, `access` e `tenants`. Não há
  rota `/support`, `/engineering` ou `/portal` em `FIRST_RELEASE_ROUTES` nem
  essas chaves em `FIRST_RELEASE_SCREEN_KEYS`. As linhas do registry que dizem
  Support “parcialmente publicada”, Engenharia “rota interna” e Portal como
  superfície disponível não distinguem claramente “existe no router” de
  “publicada no release atual”.
- **Impacto:** o documento pode orientar uma futura implementação para uma
  capability inexistente e fazer consumidores entenderem que superfícies não
  publicadas estão disponíveis. Em autorização, isso é risco de desenho e de
  segurança, mesmo sem alteração executável neste lote.
- **Correção esperada:** substituir `analytics.dashboard_viewer` pela
  capability/role correta com referência explícita, e classificar Support,
  Engenharia e Portal como não publicados no primeiro release ou indicar
  expressamente o modo de release que os publica, mantendo router/menu/guard e
  backend como fontes distintas. Preservar a limitação de não equivalência
  ponta a ponta.

### Validações

`npm run docs:validate` PASS com 0 bloqueios, auditoria de governança read-only
PASS, `npm run review:gates` PASS sem regressões bloqueantes e `git diff --check`
PASS. Não houve alteração de runtime, SQL, RLS, RPC, migrations, grants,
secrets ou integrações.

### Veredito formal

`CHANGES_REQUESTED`.

O princípio arquitetural está correto, mas os dois erros factuais acima impedem
aprovação do registry. `Owner = Forge` deve corrigir somente a documentação
allowlisted, preservar este REVIEW.md e devolver o handoff para re-review.

## Re-review incremental — resposta a F-AUTHSCREEN-001 — 2026-08-22

- **Reviewer:** Sentinel (Codex Independent Reviewer)
- **Estado revisado:** `READY_FOR_REVIEW`
- **Base SHA:** `56b8119`
- **Implementation SHA:** `UNCOMMITTED_WORKTREE`

F-AUTHSCREEN-001 está resolvido. Analytics agora referencia a capability real
`analytics.view` e distingue `dashboard_viewer` como papel global. Customer
Success, Support e Engenharia estão explicitamente classificados como não
publicados em `first-release`, enquanto Portal está fora do registry interno
como superfície customer-facing separada. O documento preserva a distinção
entre router existente, publicação, menu, guard e boundary backend.

O diff permanece documental e allowlisted. `npm run docs:validate`, auditoria de
governança, `npm run review:gates` e `git diff --check` permanecem aprovados.
As limitações de QA visual/autenticado e de equivalência ponta a ponta estão
registradas como limitações, não tratadas como prova de autorização.

### Veredito formal

`APPROVED`.

O registry agora não inventa capability nem amplia a publicação do primeiro
release. `Owner = Forge` para finalização local autorizada, com commit exclusivo
e arquivamento; sem push, merge, deploy, produção, secrets ou promoção de task
seguinte por esta revisão.
