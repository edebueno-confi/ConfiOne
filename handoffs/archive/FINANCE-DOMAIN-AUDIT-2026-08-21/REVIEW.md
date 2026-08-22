# REVIEW: FINANCE-DOMAIN-AUDIT-2026-08-21

## Veredito

`APPROVED`

## Identificação

- Reviewer: Sentinel (Codex Independent Reviewer)
- Task ID: `FINANCE-DOMAIN-AUDIT-2026-08-21`
- Estado revisado: `READY_FOR_REVIEW`
- Base SHA: `55c097e18016ecdcf8d561a8b46980f771e6acf2`
- HEAD efetivamente revisado: `934e740a1b5b462ecba874483ac2e60dcb6ca61e`
- Implementation SHA: `UNCOMMITTED_WORKTREE`
- Funcionalidade revisada: auditoria documental do Financeiro, separando
  recebido, a receber, vencido, aging, posição atual, histórico e ausência de
  dados
- Worktree: amplo e preexistente; o lote foi analisado pela allowlist e pelos
  contratos financeiros citados

## Findings

### F-FIN-001 — MEDIUM — Descoberta oficial do fluxo de recebimentos incompleta — RESOLVED

**Evidência:**

- `docs/ANALYTICS_FINANCE_DOMAIN_AUDIT_V1.md:47,64,74,89-91` documenta apenas
  `ListarContasReceber` e trata “Recebido no período” como pendência do contrato
  local, mas não reconcilia a alternativa oficial `ListarMovimentos`.
- A documentação oficial do OMIE mostra o endpoint
  `https://app.omie.com.br/api/v1/financas/mf/` e os campos
  `dDtPagamento`, `nValPago`, `nValAberto` e `nValLiquido` para movimentos
  financeiros em
  [Exemplos de query no Excel](https://ajuda.omie.com.br/pt-BR/articles/6595981-exemplos-de-query-no-excel).
- `supabase/functions/_shared/omie.ts:211-219` registra que
  `ListarContasReceber` não retorna valor pago/saldo e deriva o recebido pelo
  status quando não há valor explícito; o código não consulta movimentos e não
  reconhece o nome oficial `nValPago` nesse caminho.

**Impacto:**

A auditoria não cumpre integralmente a descoberta ativa exigida para o KPI de
recebimento. Sem registrar essa fonte oficial, o próximo lote pode concluir
incorretamente que “Recebido no período” é apenas uma lacuna local ou criar uma
segunda leitura baseada em status, sem preservar `paid_at`, valor pago e
movimento. O resultado não deve ser classificado como `API_LIMITATION`.

**Correção esperada:**

Reconciliar no documento do lote a fonte oficial de movimentos, endpoint,
campos, paginação, permissões/credencial, tenant, frescor e limitações de
histórico. Registrar que o contrato atual não possui read model de movimentos
e classificar a capacidade como `REQUIRES_NEW_INGESTION` e/ou
`PENDING_LOCAL_CONTRACT_VALIDATION`, conforme a decisão temporal. Não executar
chamada externa nem alterar código neste lote.

### F-FIN-002 — MEDIUM — Contradição de tenant/RLS entre especificação e implementação — RESOLVED

**Evidência:**

- `docs/specs/analytics-finance-omie-v1.md:63-73` afirma que a RPC possui
  `tenant/RLS` e que pgTAP cobre tenant/RLS.
- A implementação auditada em
  `supabase/migrations/20260802004655_analytics_finance_omie_only_contract_v1.sql:28-30`
  usa apenas `app_private.can_read_analytics()`; a tabela e as RPCs não
  apresentam filtro `tenant_id`. A própria auditoria em
  `docs/ANALYTICS_FINANCE_DOMAIN_AUDIT_V1.md:124-133` reconhece a ausencia de
  isolamento tenant-aware.

**Impacto:**

Um consumidor pode tratar o Financeiro como isolado por tenant com base na
especificação, embora o contrato executável auditado só aplique o gate global
de Analytics. Isso é risco de segurança e de decisão de produto, não apenas
diferença editorial.

**Correção esperada:**

Registrar explicitamente no documento do lote essa contradição, classificando
o trecho de tenant/RLS da especificação como não confirmado/aspiracional até
que um lote autorizado alinhe modelagem, RLS, autorização, auditoria e testes
cross-tenant. Não declarar isolamento existente nem alterar migrations ou
policies nesta revisão.

## Resolução verificada

- F-FIN-001: `docs/ANALYTICS_FINANCE_DOMAIN_AUDIT_V1.md` agora reconcilia
  `ListarMovimentos`, o endpoint oficial `financas/mf`, paginação,
  `dDtPagamento`, `nValPago`, `nValAberto`, `nValLiquido` e `nCodTitulo`.
  Registra que não existe read model local dessa fonte e classifica o próximo
  trabalho como `REQUIRES_NEW_INGESTION`, sem usar `API_LIMITATION`.
- F-FIN-002: o documento agora explicita a divergência entre a especificação
  que afirma tenant/RLS e o contrato executável sem `tenant_id` ou filtro
  tenant-aware, classificando a afirmação como intenção não confirmada e
  mantendo a necessidade de lote próprio para autorização, modelagem, RLS e
  testes cross-tenant.

## Aspectos aprovados

- A auditoria separa posição atual de recortes por vencimento/emissão e não
  apresenta o recorte atual como histórico `as_of`.
- `received`, `receivable`, `overdue` e `aging` não são tratados como
  equivalentes; estados de fonte, frescor e ausência estão explícitos e não
  autorizam converter ausência em zero.
- A fonte publicada OMIE-only e a ausência de fallback de planilhas estão
  reconciliadas com o contrato local.
- Não foram encontrados sinais de alteração de código, SQL, migrations, RLS,
  RPC, UI, contrato executável ou integração externa no lote Financeiro.

## Gates executados

- `npm run docs:validate` — PASS; 0 documentos bloqueados; alertas históricos
  preservados.
- `node .agents/skills/genius-documentation-governance/scripts/validate-governance-skill.mjs`
  — PASS; `valid: true`, sem erros.
- `node .agents/skills/genius-documentation-governance/scripts/run-documentation-audit.mjs changed --json`
  — PASS; 0 blockers e 0 security findings; veredito heurístico
  `consistente com ressalvas`, com ressalvas do worktree amplo.
- `npm run review:gates` — PASS; 0 regressões bloqueantes e 45 itens do
  baseline resolvidos.
- `git diff --check` — PASS.
- Testes de produto, typecheck, build, lint e pgTAP — não executados; o lote é
  documental e não altera superfície executável.

## Decisão operacional

- State: `APPROVED`
- Owner: `Forge`
- Role: `EXECUTOR`
- Reviewer active: `Sentinel`
- Push, merge, deploy, migration remota, secrets e release continuam proibidos.
