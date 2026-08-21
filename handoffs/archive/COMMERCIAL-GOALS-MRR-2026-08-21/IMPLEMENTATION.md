# Implementation

## Task ID

COMMERCIAL-GOALS-MRR-2026-08-21

## Implementador

Forge (Codex)

## Estado do handoff

DONE

## Base e SHAs

- Base SHA: `d3f26bfe6ac22f06376c5797c48d6b1221366cf2`.
- Implementation SHA: `158069d34d6ab191177cfab32d77fa5349ba9d91`.
- Branch: `main`.

## Plano de investigação

- [x] mapear fontes reais de receita, MRR, metas e períodos;
- [x] confirmar contratos e estados de ausência/cobertura;
- [x] separar semanticamente período da meta, janela histórica e data de corte;
- [x] identificar o menor lote implementável sem inventar dados;
- [x] definir testes e documentação necessários;
- [x] executar gates aplicáveis e entregar `READY_FOR_REVIEW` ao Sentinel.

## Evidência da investigação

- `rpc_analytics_customer_success_kpis_v2()` publica `mrr_total`, `arpa`,
  `mrr_overdue` e sinais relacionados à carteira, com fonte
  `company_recurring_revenue_now` e metadados `mrr_source`,
  `active_customer_rule`, `freshness_at` e `coverage_percent`.
- A mesma RPC marca `mrr_total` como `unavailable` quando `mrr_source` está
  `UNRESOLVED` e como `partial` quando a cobertura de MRR é incompleta.
- Não foi localizado contrato executável ou read model para meta financeira,
  quota, forecast, distribuição de MRR, target period ou goal amount.
- Receita Comercial (`won_amount`) usa coorte de `hs_closed_at` e não é MRR;
  não pode ser usada como proxy de meta recorrente.
- A aba de Customer Success é posição atual e não oferece filtro temporal para
  transformar MRR atual em histórico ou período de meta.

## Decisão do lote

O menor lote comprovado é documental. A nova especificação registra o contrato
de MRR disponível, a separação temporal obrigatória e os bloqueios para meta.
Não haverá código executável, migration, RPC, tabela, seed, UI ou distribuição
de valor neste lote.

## Arquivos alterados

- `docs/ANALYTICS_MRR_GOALS_FOUNDATION_V1.md`
- `docs/PROJECT_STATE.md`
- `docs/DOCUMENTATION_LEDGER.md`
- `docs/README.md`
- `handoffs/current/TASK.md`
- `handoffs/current/IMPLEMENTATION.md`
- `handoffs/current/STATUS.md`
- `handoffs/README.md`

Nenhum arquivo executável, migration, contrato backend, teste de produto ou UI
foi alterado.

## Validações

- `npm run docs:validate` — PASS; 0 documentos bloqueados. Os alertas
  preexistentes do catálogo interno foram preservados.
- Auditoria read-only
  `run-documentation-audit.mjs changed --json` — veredito `consistente com
  ressalvas`, 0 blockers e 0 security findings. Os conflitos heurísticos
  encontrados pertencem ao worktree misto e não foram tratados neste lote.
- `npm run review:gates` — PASS; 0 regressões bloqueantes e 45 itens do
  baseline resolvidos.
- `git diff --check` — PASS.

## Entrega para revisão

- Estado: `READY_FOR_REVIEW`.
- Owner: `Sentinel`.
- Reviewer active: `Sentinel`.
- Review mode: `SENTINEL_REQUIRED`.
- Implementation SHA: `UNCOMMITTED_WORKTREE`.
- Base SHA: `d3f26bfe6ac22f06376c5797c48d6b1221366cf2`.
- O lote não exige typecheck, build ou teste de runtime porque não alterou
  código executável; essa limitação foi registrada para o reviewer.

## Limites

- P-COMM-EVOLUTION-001 permanece `PROPOSED` e não está autorizado neste lote.
- Não fazer push, merge, deploy, migration remota, alteração de secrets,
  publicação ou release surface.
- Não abrir novos caminhos de produto sem evidência e sem atualizar a
  allowlist antes da implementação.

## Finalização local

- Veredito: `APPROVED` pelo Sentinel.
- Commit local exclusivo: `158069d34d6ab191177cfab32d77fa5349ba9d91`.
- Push, merge, deploy, migration remota, secrets e release surface não foram
  executados.

## Validação da correção solicitada

- `npm run docs:validate` — PASS; 0 documentos bloqueados e 9 alertas
  preexistentes preservados.
- `node .agents/skills/genius-documentation-governance/scripts/validate-governance-skill.mjs`
  — PASS; todos os recursos obrigatórios da skill presentes e sem erros.
- `node .agents/skills/genius-documentation-governance/scripts/run-documentation-audit.mjs changed --json`
  — PASS; 0 blockers e 0 security findings. O veredito permanece
  `consistente com ressalvas`, com conflitos heurísticos preexistentes no
  worktree misto.
- `npm run review:gates` — PASS; 0 regressões bloqueantes e 45 itens do
  baseline resolvidos.
- `git diff --check` — PASS.

## Entrega após correção

- Estado: `READY_FOR_REVIEW`.
- Owner: `Sentinel`.
- Reviewer active: `Sentinel`.
- Review mode: `SENTINEL_REQUIRED`.
- Implementation SHA: `UNCOMMITTED_WORKTREE`.
- O `REVIEW.md` do Sentinel foi preservado sem alterações; os findings
  permanecem auditáveis para a nova rodada.

## Resposta aos findings do Sentinel

### F-MRR-001 — RESOLVED

- A frase de decisão em `docs/ANALYTICS_MRR_GOALS_FOUNDATION_V1.md` agora
  reconhece explicitamente que o Analytics publica MRR operacional de posição
  atual.
- A lacuna foi delimitada como ausência de fonte canônica publicada para metas
  financeiras e para uma série histórica confiável de MRR. MRR atual, histórico
  e metas não são mais tratados como a mesma capacidade.

### F-MRR-002 — RESOLVED

- A documentação agora registra que `analytics_kpi_daily_snapshot` captura
  internamente `recurring_revenue_total` por data.
- Também registra que essa captura não é um contrato autenticado/publicado de
  leitura histórica: a leitura direta pelo papel autenticado permanece
  revogada pela política de least privilege, e
  `rpc_analytics_kpi_settings()` expõe apenas `history_since` e `history_days`,
  não as linhas históricas.
- Sem contrato publicado de leitura histórica, não há base comprovada para
  metas, atingimento, pacing ou distribuição. Nenhuma inferência foi criada.
