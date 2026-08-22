# IMPLEMENTATION

- Task ID: `AUTH-ADMIN-CONSOLE-SIMPLIFICATION-2026-08-21`
- State: READY_FOR_REVIEW
- Owner: Sentinel
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Base SHA: `5529f00`
- Implementation SHA: UNCOMMITTED_WORKTREE

## Decisão de escopo aplicada

OD-012, de 2026-08-22, autorizou a redução desta task para simplificação da
linguagem e da apresentação da UI. O modelo executável atual e suas fontes
permanecem intactos. A futura definição e implementação de Nível → Área →
Tela → READ/WRITE foi registrada separadamente como
`AUTH-ACCESS-MODEL-EXECUTABLE-2026-08-22`.

## Diagnóstico inicial

Fato: `apps/web/src/features/access/AccessPage.tsx` concentra Usuários,
Papéis, Convites e Permissões, mas mistura linguagem de produto com papéis
técnicos (`tenant_admin`, `tenant_viewer`) e apresenta o acesso ao Dashboard
como perfil global separado.

Fato: os dados atuais vêm de views administrativas e RPCs existentes em
`admin-api.ts`; esta task não autoriza alterar essas fontes.

Fato: a tela já recebe flags de capacidade como `can_update_role`,
`can_update_status` e `can_archive`, que devem continuar sendo a autoridade
para ações.

Hipótese de implementação: é possível melhorar a linguagem e explicar a
hierarquia de acesso somente na superfície `AccessPage.tsx`, sem novo modelo
executável. Se a proteção de último administrador não estiver comprovada no
contrato retornado, a tarefa será limitada/documentada e não inventará um
bloqueio no frontend.

## Evidências e bloqueio

- `AccessPage.tsx` usa `TenantRole` e memberships B2B para usuários, papéis,
  convites e permissões; `dashboard_viewer` é tratado separadamente.
- `InternalAreasAdminPage.tsx` usa memberships internas, perfis e screen
  catalog/grants, sem expor nível de produto nem READ/WRITE único.
- `admin-api.ts` chama read models e RPCs existentes; não há contrato único
  autorizado para salvar a cadeia completa somente pela UI.
- Proteções de escopo, auditoria e último administrador pertencem ao backend e
  não podem ser reproduzidas por regra local.

### Limite preservado

Cumprir integralmente o objetivo histórico exigiria reconciliar tenant
memberships com áreas internas e definir a representação executável de
READ/WRITE, com possível impacto em permissões, contratos, RLS/RPC, migrations
e auditoria. Isso permanece fora da allowlist. A implementação autorizada deve
alterar somente a linguagem/presentação de `AccessPage.tsx`, testes focados e
handoffs, sem alteração de código de autorização, SQL, RLS, RPC, migration,
  grants, secrets ou integrações.

## Implementação do lote OD-012

- Alterado somente `apps/web/src/features/access/AccessPage.tsx` e o teste
  `tests/scripts/admin-access-language-contract.test.mjs`.
- A interface agora usa linguagem de produto para acesso aos indicadores,
  usuário, cliente, função e situação, sem exibir `Perfil global` ou
  `Referência manual` como conceitos principais.
- As fontes e flags atuais permaneceram intactas: `can_update_role`,
  `can_update_status`, papéis existentes e chamadas de API não foram alterados.
- Não foi inventada semântica READ/WRITE: a tela não apresenta esses termos
  como dado porque o contrato atual não os fornece diretamente.
- A mensagem de proteção permanece explicativa e não promete alteração quando
  a fonte backend não autoriza.

## Gates

- `node --test tests/scripts/admin-access-language-contract.test.mjs`: PASS, 2/2.
- `npm run web:typecheck`: PASS.
- `npm run web:build`: PASS.
- `npm run lint`: PASS, sem erro bloqueante.
- `npm run docs:validate`: PASS.
- `npm run review:gates`: PASS.
- `git diff --check`: PASS.

Limitações: não houve QA visual autenticado; não houve alteração ou validação
de backend, RLS, RPC, migrations, grants, secrets ou integrações. O contrato
executável unificado Nível → Área → Tela → READ/WRITE continua fora deste lote.
