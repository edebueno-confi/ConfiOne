# TASK

- Task ID: `DATA-PIPELINE-OPERATION-GOVERNANCE-2026-08-21`
- State: `READY_FOR_REVIEW`
- Owner: `Sentinel`
- Role: `REVIEWER`
- Reviewer active: `Sentinel`
- Review mode: `SENTINEL_REQUIRED`
- Coordinator: `Codex`
- Agent coordination: `REVIEW_ACTIVE`
- Approval: `APPROVED`
- Base SHA: `051ce0b`
- Current SHA: `UNCOMMITTED_WORKTREE`
- Dependencies: `DATA-OPERATION-SCOPE-2026-08-21`,
  `DATA-PIPELINE-STAGE-SCOPE-2026-08-21`, `KPI-REGISTRY-2026-08-21`

## Objetivo

Fechar a governança do vínculo entre pipeline HubSpot, área e operação para
que os filtros e métricas do Dashboard usem escopo operacional correto.

## Escopo obrigatório

- Inventariar pipelines e objetos usados por After Sales, Conf e Neo Trust,
  com evidência no código, contratos e documentação oficial já disponível.
- Criar ou validar o mapa canônico `pipeline_id -> área -> operação`, sem
  inferir pelo nome quando houver identificador ou propriedade real.
- Identificar vínculos ausentes, ambíguos, conflitantes e dados que não podem
  ser classificados.
- Corrigir o filtro server-side para Visão Geral, Comercial, Customer Success,
  Suporte e Produto/Desenvolvimento, preservando a distinção por operação.
- Reconciliar o resultado de Todas as operações contra cada operação e
  registrar divergências reproduzíveis.
- Manter Financeiro fora enquanto não houver dimensão de área/operação
  aprovada para esse domínio.

## Critérios de aceite

- A fonte de verdade do vínculo pipeline/área/operação está documentada e
  validada contra os contratos executáveis.
- Os filtros não dependem de regra local no frontend nem de fallback silencioso.
- As abas incluídas retornam resultados consistentes por operação e Todas, com
  estado explícito para ausência, ambiguidade ou cobertura insuficiente.
- São adicionados ou atualizados testes focados para escopo, isolamento e
  reconciliação.
- Gates relevantes passam e o handoff retorna a `READY_FOR_REVIEW` para o
  Sentinel.

## Fora do escopo

Não executar chamadas de escrita no HubSpot, OMIE ou produção; não alterar
secrets, credenciais, migrations remotas, deploy, push ou merge. Não incluir
Financeiro nessa dimensão nem inventar dados ausentes.
