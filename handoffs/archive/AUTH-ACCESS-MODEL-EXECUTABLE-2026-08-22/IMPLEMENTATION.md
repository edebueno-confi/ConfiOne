# IMPLEMENTATION

- Task ID: `AUTH-ACCESS-MODEL-EXECUTABLE-2026-08-22`
- State: READY_FOR_REVIEW
- Owner: Sentinel
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Base SHA: `5a523e0e`
- Implementation SHA: UNCOMMITTED_WORKTREE

## Evidência produzida

- Relatório: `docs/reports/AUTH_ACCESS_MODEL_EXECUTABLE_AUDIT_2026-08-22.md`.
- Inventário reconciliado com migrations, views/RPCs, guards, release surface,
  contratos e testes locais.
- Escopo read-only preservado: nenhum runtime, SQL, migration, RLS, RPC, grant,
  claim, scope, secret, produção ou serviço externo foi alterado.
- Gates: governance audit PASS 0 bloqueadores; validate-governance-skill PASS;
  docs:validate PASS 0 bloqueios; review:gates PASS 0 regressões bloqueantes/
  47 baseline resolvidos; git diff --check PASS.
- Testes focused selecionados: 32/39 PASS; 7 falhas preexistentes em
  `tests/scripts/release-surface.test.mjs` sobre a expectativa de `/admin/tenants`
  não publicado no manifesto atual. Não corrigido por estar fora deste lote.
- Limitação: precedência executável única, shadow mode, pgTAP novo e paridade
  autenticada permanecem pendentes e não foram inferidos.

## Instrução operacional

Trabalhar primeiro em auditoria e especificação documental/read-only. Reconciliar
o contrato alvo com código, SQL, migrations, policies, grants, RPCs, guards,
menu e testes existentes. Não executar alterações remotas nem ler secrets.

## Entregáveis

- contrato executável alvo e matriz de de-para;
- inventário de fontes, conflitos, contraexemplos e compatibilidade;
- plano separado de implementação/migração com gates de segurança;
- testes/gates, limitações e pedido de revisão independente.
