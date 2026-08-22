# IMPLEMENTATION

- Task ID: `AUTH-RELEASE-SURFACE-REGRESSION-2026-08-22`
- State: READY_FOR_REVIEW
- Owner: Sentinel
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Base SHA: `8d16f40b`
- Implementation SHA: UNCOMMITTED_WORKTREE

## Evidência produzida

- Alterações funcionais limitadas a `apps/web/src/app/release-surface.mjs` e
  `tests/scripts/shell-navigation-auth-integration.test.mjs`.
- `tenants` foi adicionado ao manifesto first-release e `/admin/tenants` passou
  a resolver para o screen key existente `tenants`.
- `platform_admin` alcança a rota publicada; perfil sem screen key `tenants`
  permanece negado pelo guard existente. Nenhum bypass, backend ou autorização
  nova foi criado.
- Teste allowlisted `tests/scripts/shell-navigation-auth-integration.test.mjs`:
  4/4 PASS.
- Comando oficial `npm run test:focused`: 285/285 PASS.
- A contagem anterior 40/40 estava incorreta e foi removida; não há outro
  comando reproduzível deste lote que sustente essa contagem.
- `npm run web:typecheck`: PASS; `npm run web:build`: PASS, 945 módulos.
- `npm run lint`: PASS, 0 erros e 160 warnings legados.
- `npm run docs:validate`: PASS, 0 bloqueios.
- `npm run review:gates`: PASS, 0 regressões bloqueantes e 47 baseline resolvidos.
- `git diff --check`: PASS.

## Checklist de deploy e rollback, não executado

- pré-condição: revisão Sentinel APPROVED e commit local exclusivo somente da
  allowlist;
- confirmar branch `main`, SHA revisado, variáveis de release e destino Vercel
  autorizados, sem revelar valores sensíveis;
- executar deploy somente após autorização operacional separada e validar
  `/admin/tenants` com `platform_admin` e perfil sem `tenants`;
- rollback: restaurar o artefato anterior conhecido, confirmar manifesto sem
  `tenants`, repetir smoke de rota/guard e registrar evidência;
- nenhum deploy, push, merge, produção, secret ou chamada externa foi executado
  neste lote.

## Instrução operacional

Reconciliar o manifesto de release com a rota `/admin/tenants`, seus contratos,
screen key, guards e testes existentes. Trabalhar sem alterar banco ou
integrações. Executar o checklist de deploy apenas como preparação até a
aprovação independente.

## Entregáveis

- alteração allowlisted do release surface e testes de regressão;
- evidência de guards, navegação e perfis;
- gates locais completos;
- checklist de deploy/rollback e limitações;
- pedido de revisão independente ao Sentinel.
