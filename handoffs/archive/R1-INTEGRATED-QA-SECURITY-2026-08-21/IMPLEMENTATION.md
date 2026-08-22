# IMPLEMENTATION

- Task ID: `R1-INTEGRATED-QA-SECURITY-2026-08-21`
- State: READY_FOR_REVIEW
- Owner: Sentinel
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Base SHA: `8b6f4fc5`
- Implementation SHA: UNCOMMITTED_WORKTREE

## Instrução operacional

Executar QA integrado local e read-only contra os contratos, testes, scripts,
handoffs e superfícies aprovadas da Release 1. Não alterar código de produto,
secrets ou serviços externos; se uma correção for indispensável, registrar o
achado e separar uma task específica.

## Entregáveis

- matriz de cobertura e evidências por superfície R1;
- resultados de testes, smoke, typecheck/build/lint e gates aplicáveis;
- diagnóstico de console, rede, runtime, performance e segurança;
- limitações, riscos, bloqueios e pedido de revisão independente.

## Entrega para revisão

Relatório: `docs/reports/R1_INTEGRATED_QA_SECURITY_2026-08-21.md`.

### Evidências

- `npm run test:focused`: PASS, 285/285 em 46 arquivos focados.
- `npm run web:typecheck`: PASS.
- `npm run web:build`: PASS, 945 módulos transformados.
- `npm run lint`: PASS, 0 erros e 160 warnings legados.
- `npm run docs:validate`: PASS, 0 bloqueios.
- `npm run review:gates`: PASS, 0 regressões bloqueantes e 47 itens baseline resolvidos.
- `git diff --check`: PASS.

### Matriz e limitações

As superfícies de autenticação, navegação, contratos, dados, permissões,
estados e regressões foram avaliadas por testes e evidências locais. A matriz
detalhada está no relatório. Não foram executados smoke browser autenticado,
console/network/runtime servido, teste de latência/carga, RLS/cross-tenant
ponta a ponta ou integrações HubSpot/OMIE. Os scripts de smoke disponíveis
incluem cenários de escrita, portanto foram excluídos por segurança. Não houve
leitura de secrets nem escrita externa. Nenhuma correção de produto foi
misturada ao lote.

### Transferência

Forge entrega `READY_FOR_REVIEW` ao Sentinel para revisão independente. A
implementação continua `UNCOMMITTED_WORKTREE`; não há commit, push, merge,
deploy ou ação remota neste lote.
