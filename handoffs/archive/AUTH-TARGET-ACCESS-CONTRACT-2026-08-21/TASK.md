# TASK

- Task ID: `AUTH-TARGET-ACCESS-CONTRACT-2026-08-21`
- State: READY_FOR_REVIEW
- Owner: Sentinel
- Role: REVIEWER
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Coordinator: Codex
- Approval: APPROVED
- Base SHA: `32c5edc`

## Objetivo

Especificar o contrato-alvo de acesso interno na linguagem do produto, partindo
do modelo factual auditado e da direção `Usuário -> Nível -> Área -> Tela ->
READ/WRITE`. Este lote deve produzir uma especificação implementável para
decisão posterior, sem alterar o modelo executável atual.

## Escopo autorizado

- Definir níveis mínimos e sua semântica, sem confundir nível com papel global,
  tenant membership, área, tela, capability ou release surface.
- Definir que `WRITE` implica `READ`, como deny by default, precedência de
  deny/allow, escopo tenant/área e comportamento de conflitos.
- Especificar proteção do último administrador, autoalteração, usuário
  inativo, contexto suspenso/revogado, concessão/remoção e auditoria.
- Descrever estados de sessão/cache stale após mudança de acesso e o que exige
  revalidação, sem afirmar comportamento não comprovado.
- Produzir de-para conceitual entre fontes atuais e contrato-alvo, marcando
  equivalências, incompatibilidades, lacunas e decisões do proprietário.
- Atualizar somente a especificação canônica de planejamento, preservando o
  inventário e o registry aprovados.

## Fora de escopo

- Implementar ou migrar níveis, áreas, telas, capabilities, grants ou
  READ/WRITE.
- Alterar router, menu, guards, RPCs, views, policies, RLS, migrations, seeds,
  contratos executáveis, banco ou dados de usuários.
- Criar grupos/perfis customizados, remover fontes atuais ou tratar admin como
  bypass.
- Alterar `is_active`, sessão, release surface ou comportamento de acesso.
- Ler/alterar secrets, chamar integrações, produção, deploy, migration remota,
  push ou merge.
- Promover `AUTH-RESOLUTION-GUARDS-NAVIGATION` ou qualquer task posterior.

## Allowlist

- `docs/specs/AUTHORIZATION_ADMIN_ACCESS_SIMPLIFICATION_PLAN_V1.md`
- `docs/specs/AUTHORIZATION_MODEL_INVENTORY_V1.md` somente para referência ou
  correção factual mínima e separável
- `docs/AUTH_CONTEXT_STRATEGY.md` somente se exigido por reconciliação factual
- `docs/README.md`, `docs/PROJECT_STATE.md` e `docs/DOCUMENTATION_LEDGER.md`
  somente para atualização documental mínima
- `handoffs/current/*`

## Critérios de aceite

1. O contrato define níveis, áreas, telas e READ/WRITE sem ambiguidade e sem
   substituir as fontes executáveis antes de uma task de implementação.
2. `WRITE` sempre exige `READ`; deny by default e precedência de deny estão
   explícitos para perfil, área, capability, override e contexto.
3. Escopo tenant/área, isolamento, último admin, autoalteração, revogação,
   usuário inativo, sessão stale e auditoria têm regras e estados definidos.
4. O de-para mostra o destino de cada fonte atual e interrompe itens ambíguos,
   incompatíveis ou sem evidência, sem conversão silenciosa.
5. A distinção entre `platform_admin`, nível do produto, papel de tenant,
   capability e publicação de release permanece explícita.
6. Decisões do proprietário, recomendações e fatos executáveis ficam separados;
   nada no documento autoriza alteração estrutural automaticamente.
7. `docs:validate`, auditoria de governança, `review:gates` quando aplicável e
   `git diff --check` passam; limitações são registradas.

## Transferência

Forge deve atualizar STATUS/IMPLEMENTATION ao iniciar e registrar HOLD
explícito se necessário. Ao concluir, entregar `READY_FOR_REVIEW`, Owner
Sentinel, `REVIEW_ACTIVE`, evidências e gates, avisando Sentinel e Codex.
