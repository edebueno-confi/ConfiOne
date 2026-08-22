# Review

## Veredito formal

- Task ID: `OVERVIEW-QUEUE-SEMANTICS-2026-08-21`
- Reviewer: Sentinel (Codex Independent Reviewer)
- Data: 2026-08-21
- Estado recebido: `READY_FOR_REVIEW`
- Owner recebido: `Sentinel`
- Base SHA informado no handoff: `f26ef07c3f507640c37ac4f488c0a240a7b7cb9d`
- Base SHA efetivamente revisado: `f26ef07b89447950e3ec9997aa1cf4d3b46e015f`
- HEAD efetivamente revisado: `f26ef07b89447950e3ec9997aa1cf4d3b46e015f`
- Estado do código: `UNCOMMITTED_WORKTREE`

O SHA informado originalmente em TASK/IMPLEMENTATION/STATUS não existe no
Git. O SHA efetivo foi confirmado diretamente por `git rev-parse HEAD` e pelo
commit `feat(analytics): separate overview current and period snapshots`.
Essa divergência é uma observação de rastreabilidade, não bloqueia este lote.

## Escopo e diff revisados

Arquivos do lote efetivamente revisados:

- `apps/web/src/features/analytics/AnalyticsCeoPage.tsx`
- `apps/web/src/features/analytics/analytics-ceo-snapshot.mjs`
- `apps/web/src/features/analytics/analytics-ceo-snapshot.d.mts`
- `tests/scripts/analytics-ceo-snapshot.test.mjs`

O worktree contém alterações preexistentes fora da allowlist. Elas foram
excluídas da revisão e não foram stageadas nem alteradas pelo Sentinel. Não há
alteração de migration, RPC, RLS, autorização, integração externa ou release
surface no diff do lote.

## Critérios de aceitação

1. **Rótulo e semântica inequívocos: PASS**. A posição usa
   `Tickets em aberto agora`, chave `open_backlog`, período `current` e fonte
   `support.open_backlog`. O volume recebido usa
   `Atendimentos recebidos no período`, chave `created_tickets`, período
   `selected` e fonte `support.created_tickets`.
2. **Sem duplicidade interpretável: PASS**. O cartão de Suporte e a métrica de
   movimento usam `created_tickets`; a faixa corrente usa `open_backlog` e
   rótulo distinto. As definições são centralizadas em
   `getOverviewQueueMetricDefinitions()`.
3. **Separação temporal: PASS**. `buildOverviewSnapshotQueryPlan()` mantém
   datas no plano histórico e remove datas no plano corrente. O caminho
   operacional lê o movimento do payload `period` e a posição do payload
   `current`, sem fallback global.
4. **Operação, tenant, autorização e estados: PASS**. O lote reutiliza os
   payloads já escopados e preserva `unavailable`; não cria consulta, regra de
   autorização ou fonte paralela.
5. **Ausência sem zero artificial: PASS**. A disponibilidade de
   `created_tickets` controla o cartão e a métrica de movimento, que exibem
   `Indisponível` quando o KPI não é publicável. O teste cobre a distinção e a
   ausência operacional.

## Findings

### F-OVERVIEW-QUEUE-001 — INFO — rastreabilidade do SHA informado

- Evidência: `git rev-parse HEAD` retorna
  `f26ef07b89447950e3ec9997aa1cf4d3b46e015f`, enquanto o SHA registrado no
  handoff é `f26ef07c3f507640c37ac4f488c0a240a7b7cb9d`, objeto inexistente.
- Impacto: uma auditoria que copie literalmente o SHA do handoff não consegue
  resolver a base no Git.
- Tratamento: não bloqueante para o código; o SHA real foi registrado acima e
  em `STATUS.md`. TASK/IMPLEMENTATION e referências históricas ainda devem ser
  normalizados em lote documental futuro, sem alterar o escopo deste lote.

Não há findings `CRITICAL`, `HIGH` ou `MEDIUM`.

## Gates independentes

- `node --test tests/scripts/analytics-ceo-snapshot.test.mjs`: PASS, 7/7.
- `npm run web:typecheck`: PASS.
- `npm run web:build`: PASS, 943 módulos transformados.
- `npm run lint`: PASS, 0 erros e 160 warnings legados.
- `npm run review:gates`: PASS, 0 regressões e 45 itens do baseline resolvidos.
- `npm run docs:validate`: PASS, 0 bloqueios e 9 alertas documentais
  preexistentes.
- `git diff --check`: PASS.

Não foi executado pgTAP porque o lote não altera SQL, RPC, RLS ou migrations.
Não foi executada validação autenticada em navegador ou ambiente remoto; essas
ações não são necessárias para este diff e escritas remotas continuam proibidas.

## Decisão

# APPROVED

Os critérios de aceitação foram atendidos e não há regressão bloqueante. Como a
fila canônica marca `Approval = APPROVED`, Forge está autorizado a executar
`FINALIZE_LOCAL`: validar a allowlist, criar commit local exclusivo, arquivar o
handoff, marcar a task como `DONE` e abrir a próxima task elegível.

Push, merge, deploy, migration remota, alteração de secrets e release surface
continuam proibidos. A atualização documental da regra de notificação entre
Sentinel e Forge, se presente no worktree, permanece fora do commit deste lote.
