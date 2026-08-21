# Implementation

## Task ID

SUPPORT-DOMAIN-AUDIT-2026-08-21

## Implementador

Forge (Codex)

## Estado do handoff

READY_FOR_REVIEW

## Base e SHAs

- Base SHA: `8c3eff708811bcb19e28e56dbafda6131d89ea35`.
- Implementation SHA: `UNCOMMITTED_WORKTREE`.
- Branch: `main`.

## Plano

- [x] localizar fontes reais de fila, tickets, conversas, chat, SLA, aging e
  prioridade;
- [x] confirmar semântica temporal, tenant, permissões, frescor e proveniência;
- [x] separar fatos publicados, inferências, lacunas e próximos lotes;
- [x] documentar somente o menor contrato sustentado pelas fontes;
- [x] executar os gates aplicáveis;
- [x] entregar `READY_FOR_REVIEW` ao Sentinel.

## Evidências

- Documento principal: `docs/ANALYTICS_SUPPORT_DOMAIN_AUDIT_V1.md`.
- O contrato local foi reconciliado com `public.tickets`, mensagens, eventos,
  atribuições, views/RPCs do Support Workspace e
  `rpc_support_ticket_queue_page`.
- A auditoria separa `conversation_type_key` como classificação, timeline
  vinculada ao ticket como mensagens/eventos e `ticket_source = chat` como
  canal sem resposta direta integrada.
- O contrato analítico `rpc_analytics_support_kpis_v2` foi tratado como read
  model HubSpot separado, com bases distintas para criação, resolução,
  atividade, frescor e snapshots históricos.
- `docs/PROJECT_STATE.md`, `docs/DOCUMENTATION_LEDGER.md`, `docs/README.md` e
  `handoffs/README.md` foram atualizados dentro da allowlist. Nenhum arquivo de
  código, migration, view, RPC, RLS, contrato executável, teste de produto,
  integração ou UI foi alterado por esta task.

## Resposta aos findings do Sentinel

- **F-SUPPORT-001:** resolvido documentalmente. A auditoria agora referencia
  `docs/specs/analytics-support-conversations-v1.md` como fonte da descoberta
  oficial, registra Conversations API, inboxes, canais, threads, mensagens,
  atores, associação opcional a tickets, `conversations.read`, paginação por
  cursor, tenant/proveniência e as lacunas de portal, plano, permissões,
  rate limits, histórico e frescor. A capacidade oficial é distinguida da
  ausência de read model local (`REQUIRES_NEW_INGESTION`) e da confirmação de
  scope (`REQUIRES_SCOPE`); não foi classificada como `API_LIMITATION`.
- **F-SUPPORT-002:** resolvido documentalmente. SLA local por horas
  úteis/feriados agora é `PENDING_LOCAL_CONTRACT_VALIDATION`, pois depende de
  semântica e teste local. `REQUIRES_SCOPE` ficou reservado à capacidade
  externa com scope identificado, como `conversations.read`.

## Validações

- `node .agents/skills/genius-documentation-governance/scripts/validate-governance-skill.mjs`
  -> PASS (`valid: true`, sem erros).
- `node .agents/skills/genius-documentation-governance/scripts/run-documentation-audit.mjs changed --json`
  -> PASS, 0 blockers, 0 security findings; ressalvas heurísticas existentes,
  40 candidatos de drift/conflito no inventário amplo e 6 links quebrados já
  presentes no baseline.
- `npm run docs:validate` -> PASS, 0 documentos bloqueados; alertas de
  whitelist são preexistentes e não impedem o gate.
- `npm run review:gates` -> PASS, 0 regressões bloqueantes, 45 itens de
  baseline resolvidos.
- `git diff --check` -> PASS.
- Typecheck, build, lint, testes de produto e pgTAP não foram executados porque
  o lote é estritamente documental e não altera runtime, contratos ou banco.

## Limites

Nenhum código, migration, view, RPC, RLS, contrato compartilhado, teste de
produto, integração ou UI deve ser alterado sem evidência e expansão explícita
da allowlist.
