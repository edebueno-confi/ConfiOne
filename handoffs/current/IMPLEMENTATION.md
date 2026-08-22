# IMPLEMENTATION

- Task ID: `OVERVIEW-GOVERNANCE-DENSITY-2026-08-21`
- State: `READY_FOR_IMPLEMENTATION`
- Owner: `Forge`
- Reviewer active: `Sentinel`
- Base SHA: `a1265a80f98095c56a60355327f7f06dd1912cd9`
- Implementation SHA: `UNCOMMITTED_WORKTREE`

## Plano

1. Auditar a ordem atual da Visão Geral, seus rótulos e testes de contrato.
2. Fazer a menor alteração de hierarquia necessária, preservando contratos,
   read models e estados de ausência.
3. Atualizar somente os testes focados afetados.
4. Executar os gates aplicáveis e registrar comandos, resultados e limitações.

## Evidência inicial

- `AnalyticsCeoPage` atualmente exibe faixas Agora/No período/Atenção, posição
  atual, mapa de áreas, trilho de integridade, sinais gerenciais, pipelines de
  Suporte, evolução e cobertura.
- O lote não está autorizado a recalcular KPI nem a alterar backend.
- O ranking de pipelines de Suporte é derivado de `data.support.byPipeline`;
  qualquer rebaixamento visual deve preservar o dado e seu contrato de origem.

## Validações

Ainda não executadas. Serão registradas após a implementação.
