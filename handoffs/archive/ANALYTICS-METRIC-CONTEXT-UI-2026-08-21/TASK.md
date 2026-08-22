# TASK

- Task ID: `ANALYTICS-METRIC-CONTEXT-UI-2026-08-21`
- State: `READY_FOR_IMPLEMENTATION`
- Owner: Forge
- Role: IMPLEMENTER
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Coordinator: Codex
- Approval: APPROVED
- Base SHA: `0f514f9f1509c081f3f422212c856e7f64179656`

## Objetivo

Expor no Dashboard Gerencial o contexto metodológico dos indicadores de forma
acessível e útil para decisão, sem exigir leitura do código ou do repositório.
O usuário deve conseguir entender o que o número mede, qual período/coorte
foi usado, qual fonte e frescor sustentam a leitura, qual cobertura existe e
quais limitações ou estados se aplicam.

## Escopo autorizado

- Evoluir a superfície compartilhada de KPIs e seus estilos para apresentar
  contexto sob demanda, sem transformar cada KPI em um card excessivo.
- Reutilizar `readKpi`, `readKpiMeta`, `describeKpiBasis`,
  `describeKpiLimitation` e os estados já definidos no contrato vigente.
- Cobrir as superfícies que usam `AnalyticsKpiBoard`, incluindo Visão Geral,
  Comercial, Suporte e Customer Success, respeitando os payloads existentes.
- Exibir, quando disponível no contrato, período, coorte/campo de data,
  estado, cobertura, frescor, fonte e ressalvas em linguagem do produto.
- Garantir acessibilidade de teclado, foco, leitura por tecnologia assistiva,
  responsividade e estados de dado ausente.
- Atualizar testes de contrato/superfície e o registry canônico apenas para
  registrar a exposição concluída e suas limitações reais.

## Fora de escopo

- Criar ou alterar RPCs, views, migrations, tabelas, policies, endpoints ou
  payloads sem evidência de que o contrato atual não atende ao objetivo.
- Calcular fórmula, cobertura, frescor, permissão, estado ou regra de negócio
  no frontend.
- Inventar fonte, data, período ou explicação quando o payload não fornecer o
  dado; nesse caso, preservar estado honesto e indicar indisponibilidade.
- Redesenhar o shell, navegação, filtros, gráficos ou outras superfícies não
  necessárias ao contexto metodológico.
- Chamar HubSpot, OMIE ou qualquer integração externa; ler ou alterar secrets;
  produção, deploy, migration remota, push ou merge.

## Allowlist

- `apps/web/src/features/analytics/AnalyticsKpiBoard.tsx`
- `apps/web/src/features/analytics/analytics-board.css`
- `apps/web/src/features/analytics/analytics-kpi-contract.mjs` e seu contrato
  de tipos somente se a apresentação exigir ajuste compatível, sem mudar o
  contrato de dados
- testes Analytics existentes diretamente relacionados à superfície/contrato
- `docs/ANALYTICS_KPI_REGISTRY_V1.md`
- `handoffs/current/*`
- `docs/PROJECT_STATE.md`, `docs/DOCUMENTATION_LEDGER.md` e `docs/README.md`
  somente se a política documental exigir atualização mínima e separável

## Critérios de aceite

1. Um usuário consegue abrir o contexto de um KPI sem sair da tela e sem
   depender de hover; teclado e leitor de tela conseguem alcançar e anunciar o
   conteúdo.
2. A explicação usa dados reais do payload e distingue posição atual, período
   selecionado, coorte/campo de data e histórico quando o contrato os fornece.
3. Estados `available`, `partial`, `unavailable` e `awaiting_history` continuam
   honestos; ausência nunca vira zero nem texto técnico cru.
4. Cobertura e frescor são exibidos somente quando presentes; ausência é
   tratada explicitamente, sem estimativa inventada.
5. A mesma solução funciona nas páginas que reutilizam `AnalyticsKpiBoard`, sem
   duplicar fonte de verdade ou criar divergência por domínio.
6. Loading, erro, vazio, responsividade e conteúdo longo têm comportamento
   validado.
7. Testes focados, typecheck, build, lint aplicável, `git diff --check` e
   `docs:validate` passam; limitações são registradas no handoff.

## Transferência

Ao iniciar, Forge deve atualizar STATUS/IMPLEMENTATION com `IMPLEMENTING` e,
se precisar exclusividade temporária, registrar HOLD explícito. Ao concluir,
deve entregar `READY_FOR_REVIEW`, Owner Sentinel, `REVIEW_ACTIVE`, SHAs,
allowlist, gates e limitações, avisando Sentinel e Codex.
