# IMPLEMENTATION

- Task ID: ANALYTICS-METRIC-METHODOLOGY-2026-08-21
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

## Resultado da auditoria

O registro canônico foi reconciliado somente por leitura contra:

- `apps/web/src/features/analytics/analytics-api.ts`, `analytics-model.ts` e
  `analytics-kpi-contract.mjs`;
- migrations dos read models V1/V2/V3, sem alterá-las;
- RPCs executáveis de Executivo, Comercial, Suporte, Customer Success e
  Financeiro, além dos testes locais de Analytics;
- `docs/PROJECT_STATE.md`, `docs/README.md` e `docs/DOCUMENTATION_LEDGER.md`.

### Evidências e decisões

- Visão Geral: composição de RPCs existentes; período e posição corrente são
  chamadas distintas, e o frescor vem dos metadados dos read models.
- Comercial: `hs_created_at` sustenta criados, `hs_closed_at` sustenta fechados
  e conversão, e o estágio atual sustenta a posição aberta. Aging/conversão por
  etapa permanecem `awaiting_history`.
- Suporte: `hs_created_at`, resolução/primeira resposta e estado atual são
  bases diferentes; SLA, resolução, reabertura e histórico preservam cobertura
  e reason em vez de converter ausência em zero.
- Customer Success: MRR, atraso e tickets dependem de vínculo financeiro e
  associação ticket→empresa. Cobertura insuficiente permanece `partial` ou
  `unavailable` com motivo explícito.
- Financeiro: a superfície publicada é OMIE/read model local de contas a
  receber. `received_amount` depende da data/valor de pagamento; saldo aberto,
  vencido e aging dependem dos campos de posição. Planilhas não são fallback.
- Produto/Desenvolvimento: o contrato local só expõe `status`, `source` e
  `reason`; sem read model executável, GitHub/roadmap/releases/deployments/PRs
  permanecem indisponíveis e não foram convertidos em KPIs.

Fatos foram separados de hipóteses, lacunas e histórico. Não foram criados
KPIs, fórmulas, fontes ou estados de cobertura. Nenhum runtime, SQL, migration,
contrato executável, integração ou secret foi alterado.

## Gates

- `npm run docs:validate`: PASS, 0 documentos bloqueados; 9 alertas históricos.
- Auditoria de governança documental: PASS, 0 bloqueadores; ressalvas
  heurísticas/históricas permanecem sem alteração.
- `npm run review:gates`: PASS, 0 regressões bloqueantes e 47 itens baseline
  resolvidos.
- `git diff --check`: PASS após normalizar as linhas finais de TASK/REVIEW.
- Não foram necessários typecheck, build ou lint: nenhum runtime, contrato
  executável, teste de produto ou UI foi alterado.

## Resposta ao F-METH-001

- Corrigida a referência histórica que dizia que
  `DATA-PIPELINE-OPERATION-GOVERNANCE-2026-08-21` ainda precisava ser validada;
  o registry agora registra a validação concluída e arquivada.
- Corrigido o estado da própria `ANALYTICS-METRIC-METHODOLOGY-2026-08-21` de
  `PROPOSED` para `READY_FOR_REVIEW`, sem declarar aprovação antecipada.
- Removida a linha da própria task em “Próximas evoluções autorizadas”; a
  evolução que permanece proposta é somente `ANALYTICS-METRIC-CONTEXT-UI`.
- `REVIEW.md` não foi alterado e nenhum runtime, SQL, migration, contrato ou
  integração foi tocado.
