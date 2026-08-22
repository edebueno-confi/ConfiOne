# TASK

- Task ID: `AUTH-MODEL-AUDIT-2026-08-21`
- State: READY_FOR_REVIEW
- Owner: Sentinel
- Role: REVIEWER
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Coordinator: Codex
- Approval: APPROVED
- Base SHA: `da206123b77c7cfab6ee10ffe32fa3b7b8f7b498`

## Objetivo

Auditar a complexidade, redundâncias, regras legadas, ambiguidades e riscos do
modelo interno de autorização do ConfiOne após o inventário factual aprovado,
sem implementar a simplificação. O resultado deve permitir decidir o que é
necessário preservar, o que pode ser consolidado em lote futuro, o que é
legado, o que é apenas direção futura e o que exige decisão do proprietário.

## Escopo autorizado

- Reconciliar `docs/specs/AUTHORIZATION_MODEL_INVENTORY_V1.md` com código,
  contratos, migrations, views/RPCs, policies, grants e testes atuais.
- Classificar cada fonte/opção observada: `NECESSÁRIA`, `REDUNDANTE`,
  `LEGADA`, `FUTURA`, `AMBÍGUA` ou `POTENCIALMENTE_INSEGURA`, sempre com
  evidência e impacto.
- Auditar a semântica factual de `platform_admin`, papéis de tenant,
  contexto interno, membership de área, perfil, tela, capability, override,
  release surface e `READ/WRITE`, sem assumir que administrador é bypass.
- Registrar contraexemplos e dependências ocultas: cross-tenant, deny by
  default, último administrador, revogação, sessão stale, rota direta,
  divergência menu/guard/backend, `CsGate`, `SupportGate` e release gate.
- Atualizar o documento canônico existente de planejamento e/ou inventário,
  sem criar uma segunda fonte de verdade.
- Separar fatos, recomendações técnicas, decisões pendentes e itens que não
  podem ser removidos sem uma task aprovada posterior.

## Fora de escopo

- Alterar frontend, router, menu, guards, contratos executáveis, RPCs, views,
  policies, grants, migrations, RLS, schemas, seeds ou banco.
- Simplificar, remover, migrar ou consolidar permissões/usuários.
- Criar bypass de administrador, alterar `is_active`, contornar RLS ou mudar
  release surface.
- Ler ou alterar secrets, chamar HubSpot/OMIE, produção, deploy, migration
  remota, push ou merge.
- Promover `AUTH-SCREEN-REGISTRY` ou qualquer task seguinte neste lote.

## Allowlist

- `docs/specs/AUTHORIZATION_MODEL_INVENTORY_V1.md`
- `docs/specs/AUTHORIZATION_ADMIN_ACCESS_SIMPLIFICATION_PLAN_V1.md`
- `docs/AUTH_CONTEXT_STRATEGY.md` somente se uma correção factual mínima for
  necessária e separável
- `docs/PROJECT_STATE.md`, `docs/DOCUMENTATION_LEDGER.md` e `docs/README.md`
  somente para atualização documental mínima exigida pela política
- `handoffs/current/*`
- testes somente em modo read-only, se necessários para confirmar evidência

## Critérios de aceite

1. Toda classificação aponta para evidência executável ou documental vigente e
   distingue fato de hipótese.
2. Existe tabela de decisão com opção, consumidor, classificação, impacto,
   risco, destino proposto e dependências.
3. O significado de administrador é descrito por fatos, incluindo limites,
   release surface e ausência de bypass frontend/backend.
4. A auditoria lista explicitamente o que não pode ser removido sem preservar
   isolamento, RLS, deny by default, último admin, auditoria e READ/WRITE.
5. Contraexemplos de acesso negado, rota direta, sessão stale, revogação,
   cross-tenant, `CsGate`/`SupportGate` e divergência entre fontes são
   registrados ou classificados como não reproduzidos.
6. Recomendações técnicas e decisões que exigem o proprietário ficam separadas
   e não autorizam automaticamente a task seguinte.
7. `docs:validate`, auditoria de governança, `review:gates` quando aplicável e
   `git diff --check` passam; limitações são registradas no handoff.

## Transferência

Forge atualizou STATUS/IMPLEMENTATION ao iniciar e registrou HOLD explícito.
Ao concluir, entregou `READY_FOR_REVIEW` com Owner Sentinel,
`REVIEW_ACTIVE`, allowlist, evidências e gates, avisando Sentinel e Codex.
