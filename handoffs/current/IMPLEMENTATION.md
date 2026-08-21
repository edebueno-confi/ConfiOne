# Implementation

## Task ID

CONTRACT-EXPIRY-2026-08-21

## Implementador

Forge (Codex)

## Estado do handoff

READY_FOR_REVIEW

## Base e SHAs

- Base SHA: `667a4a31b0a9764427d7488ef54ecb68378d70ed`.
- Implementation SHA: `UNCOMMITTED_WORKTREE`.
- Branch: `main`.

## Plano

- [ ] localizar fontes reais de vencimento, renovação, responsável e MRR;
- [ ] confirmar semântica temporal, tenant, permissões e estados de cobertura;
- [ ] separar fato observado, hipótese e lacuna de contrato;
- [ ] documentar o menor lote implementável, sem UI parcial;
- [ ] executar os gates aplicáveis;
- [ ] entregar `READY_FOR_REVIEW` ao Sentinel.

## Evidências produzidas

- `public.customer_product_subscriptions` possui `renewal_at`, `ended_at`,
  status, produto, plano e referência contratual. As datas podem ser nulas e a
  constraint somente valida `renewal_at <= ended_at` quando ambos existem.
- `public.vw_admin_customer_product_subscriptions` publica as datas de
  assinatura e é protegido para `platform_admin`.
- `public.vw_cs_customer_portfolio` expõe `renewalAt` no contexto de produtos
  ativos ou suspensos e seleciona o `cs_owner` ativo. Não publica janela,
  classificação ou owner de renovação.
- Os read models financeiros publicam MRR atual e sinais observados como
  `mrr_overdue` e `contract_not_current`; não publicam MRR por assinatura nem
  previsão de risco por renovação futura.
- A ingestão HubSpot observada traz MRR, `contract_status` e owner de CS, mas
  não traz data de renovação. Não há chave e contrato publicados que unam esse
  MRR à assinatura cliente-produto-plano.

## Decisão do lote

O menor lote comprovado é documental. Não existe base suficiente para criar
lista de próximos vencimentos, alerta, cálculo de MRR em risco ou UI. A
fundação registra as fontes existentes, as permissões e as lacunas que exigem
decisão de produto e contrato server-side.

## Arquivos alterados

- `docs/ANALYTICS_CONTRACT_EXPIRY_FOUNDATION_V1.md`
- `docs/PROJECT_STATE.md`
- `docs/DOCUMENTATION_LEDGER.md`
- `docs/README.md`
- `handoffs/current/TASK.md`
- `handoffs/current/IMPLEMENTATION.md`
- `handoffs/current/STATUS.md`

Nenhum arquivo executável, migration, view, RPC, RLS, contrato compartilhado,
teste de produto, integração ou UI foi alterado.

## Validações

- `npm run docs:validate` — PASS; 0 documentos bloqueados e 9 alertas
  preexistentes preservados.
- `node .agents/skills/genius-documentation-governance/scripts/validate-governance-skill.mjs`
  — PASS; `valid: true`, sem erros.
- `node .agents/skills/genius-documentation-governance/scripts/run-documentation-audit.mjs changed --json`
  — PASS; 0 blockers e 0 security findings. Veredito heurístico
  `consistente com ressalvas`, com conflitos preexistentes do worktree misto.
- `npm run review:gates` — PASS; 0 regressões bloqueantes e 45 itens do
  baseline resolvidos.
- `git diff --check` — PASS.

Typecheck, build, lint, testes de runtime e validações de banco não são
necessários para a fundação documental e serão reportados como não executados.

## Entrega para revisão

- Estado: `READY_FOR_REVIEW`.
- Owner: `Sentinel`.
- Reviewer active: `Sentinel`.
- Review mode: `SENTINEL_REQUIRED`.
- Implementation SHA: `UNCOMMITTED_WORKTREE`.
- Base SHA: `667a4a31b0a9764427d7488ef54ecb68378d70ed`.

## Resposta ao finding F-CONTRACT-001

- Corrigido: o bloco inicial deste artefato e `handoffs/current/TASK.md` agora
  usam a mesma base canônica `667a4a31b0a9764427d7488ef54ecb68378d70ed`, que
  é o HEAD que abriu o lote corrente.
- `667a4a31b0a9764427d7488ef54ecb68378d70ed` é filho direto do commit funcional
  anterior `fd2a0407601b77004baf75c227cf057c2740b6da`; este último permanece
  apenas como histórico do lote anterior, não como base do lote corrente.

## Limites

Nenhum código executável, SQL, migration, RPC, RLS, integração, secret ou UI
será alterado sem evidência de contrato e necessidade dentro da allowlist.
