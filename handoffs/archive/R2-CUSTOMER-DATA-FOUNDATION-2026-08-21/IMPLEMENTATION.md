# IMPLEMENTATION

- Task ID: `R2-CUSTOMER-DATA-FOUNDATION-2026-08-21`
- State: APPROVED
- Owner: Forge
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Base SHA: `f73be1a3`
- Implementation SHA: UNCOMMITTED_WORKTREE

## Instrução operacional

Reconciliar a fundação de dados da Central de Clientes com código, contratos,
read models, migrations e testes locais existentes. Trabalhar localmente e
read-only quando a evidência exigir integração externa. Não ler secrets nem
executar chamadas ou escritas HubSpot/OMIE.

## Entregáveis

- matriz de fontes, identidade, tenant, importação, referências e matching;
- auditoria de ambiguidades, duplicidades, cobertura e idempotência;
- testes focused e gates aplicáveis;
- relatório, limitações e pedido de revisão independente.

## Entrega para revisão

Relatório: `docs/reports/R2_CUSTOMER_DATA_FOUNDATION_AUDIT_2026-08-21.md`.

A auditoria reconcilia identidade, cliente ativo HubSpot, importação, fontes,
referências externas, tenant, deduplicação, proveniência, idempotência e
ambiguidades. A evidência histórica de 264 empresas After Sale V1 foi mantida
como histórica/local; não foi tratada como estado remoto atual. Matching OMIE
permanece `NOT_PROVEN` e sem fuzzy matching. A Central R2 não foi implementada.

Gates: docs:validate PASS 0 bloqueios, review:gates PASS 0 regressões
bloqueantes/47 baseline resolvidos e git diff --check PASS. Não houve chamada
ou escrita HubSpot/OMIE, leitura de secrets, alteração de credenciais,
produção ou migration remota. O NO-GO externo da Release 1 permanece.

Forge transfere `READY_FOR_REVIEW` ao Sentinel. Implementation SHA permanece
`UNCOMMITTED_WORKTREE`; não há commit, push, merge, deploy ou ação externa.
