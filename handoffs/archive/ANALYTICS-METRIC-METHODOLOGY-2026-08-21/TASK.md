# TASK

- Task ID: ANALYTICS-METRIC-METHODOLOGY-2026-08-21
- Objetivo: auditar e completar a metodologia e a proveniência dos KPIs publicados pelo Analytics.
- State: READY_FOR_REVIEW
- Owner: Sentinel
- Role: REVIEWER
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Coordinator: Codex
- Agent coordination: REVIEW_ACTIVE
- Approval: APPROVED
- Base SHA: 7c8f819
- Implementation SHA: UNCOMMITTED_WORKTREE

## Critérios de aceitação

1. Auditar o registro canônico de KPIs contra código executável, contratos TypeScript, migrations, views/RPCs e testes reais.
2. Cobrir Visão Geral, Comercial, Suporte, Customer Success, Financeiro e Produto/Desenvolvimento, distinguindo publicado, indisponível, parcial e aguardando histórico.
3. Para cada KPI publicado ou explicitamente indisponível, registrar fonte, contrato, objeto/campo de origem, coorte ou posição, timezone/período, fórmula/definição, unidade, nulo, cobertura, frescor, filtros, estado e limitação.
4. Identificar divergências entre documentação e runtime como fato, hipótese, lacuna ou documentação histórica, sem inventar fórmula ou disponibilidade.
5. Completar a fonte canônica existente, preferencialmente docs/ANALYTICS_KPI_REGISTRY_V1.md; não criar segundo registry nem KPI novo.
6. Preservar a precedência do backend e registrar evidências com arquivo, contrato ou teste verificável.
7. Executar validação documental e gates proporcionais, sem modificar runtime, banco ou integrações.

## Allowlist

- docs/ANALYTICS_KPI_REGISTRY_V1.md;
- docs/README.md, docs/PROJECT_STATE.md e docs/DOCUMENTATION_LEDGER.md somente em trechos mínimos necessários para registrar o lote;
- relatório documental específico em docs/reports/ somente se o registro canônico não comportar a evidência sem duplicação;
- handoffs/current/;
- scripts read-only de governança documental e validações relacionadas.

## Fora de escopo

- não criar, alterar ou migrar tabelas, views, RPCs, policies, contratos executáveis ou código de produto;
- não alterar fórmulas para adequar documentação;
- não criar KPI, fonte, dado ou estado de cobertura;
- não fazer chamadas externas, sync, escrita em HubSpot/OMIE/produção, migration remota, deploy, push ou merge;
- não ler ou alterar secrets;
- não editar ou apagar histórico para esconder divergência;
- se houver conflito material de produto, registrar OWNER_DECISION_REQUIRED.

## Entrega

Forge deve atualizar IMPLEMENTATION.md com fontes e evidências, executar docs:validate, auditoria de governança, review:gates quando aplicável e git diff --check, mudar STATUS.md para READY_FOR_REVIEW com Owner Sentinel e avisar Sentinel/Codex. Sentinel revisará somente documentação e evidências, sem alterar código executável.
