# REVIEW

- Task ID: `AUTH-TARGET-ACCESS-CONTRACT-2026-08-21`
- Reviewer: Sentinel (Codex Independent Reviewer)
- Review mode: SENTINEL_REQUIRED
- Estado revisado: `READY_FOR_REVIEW` após `CHANGES_REQUESTED`
- Base SHA: `32c5edc`
- Implementation SHA: `UNCOMMITTED_WORKTREE`
- Data da revisão: `2026-08-22`

## Funcionalidade revisada

Especificação documental do contrato-alvo de autorização
`Usuário -> Nível -> Área -> Tela -> READ/WRITE`, sem alteração do modelo
executável atual.

## Re-review e evidências

F-AUTHTARGET-001 foi resolvido. O de-para agora usa
`user_actor_contexts`/`public.user_actor_contexts` e separa explicitamente
`tenant_memberships` de `internal_area_memberships`. A especificação mantém a
qualificação de compatibilidade conceitual e não instrução de migração.

O documento continua separando proposta, fatos executáveis, recomendações e
decisões do proprietário. Mantém explícitos WRITE implica READ, deny by
default, precedência deny/allow proposta, escopo tenant/área, stale e
revalidação, auditoria, último administrador, autoalteração, ciclo de vida,
conflitos e limitações. Não há autorização implícita para implementação.

F-AUTHTARGET-002 foi tratado na devolução do handoff: o STATUS corrente foi
normalizado para refletir o veredito e o próximo responsável. O conteúdo de
`IMPLEMENTATION.md` permanece registro do executor e não contém alteração de
código executável.

## Gates

- `npm run docs:validate`: PASS, 0 bloqueios; alertas documentais históricos
  permanecem fora do lote.
- `npm run review:gates`: PASS, 0 regressões bloqueantes e 47 itens do
  baseline resolvidos.
- `git diff --check`: PASS.
- Verificação de nomenclatura: `user_actor_contexts` presente no contrato;
  `internal_actor_contexts` não é usado no bloco corrigido.
- Não houve chamadas externas, leitura de secrets, escrita em produção,
  alterações em HubSpot/OMIE, migration remota, deploy, push ou merge.

## Limitações

Esta aprovação cobre a especificação documental. Não prova runtime da
precedência final, revalidação de browser após revogação, equivalência ponta a
ponta de menu/guard/backend ou participação final de profile screen grants.
Esses itens permanecem decisões ou validações de tasks posteriores.

## Decisão

`APPROVED`

O lote está aprovado para finalização local pela fila previamente autorizada.
Forge pode criar o commit local exclusivo do lote, arquivar o handoff e
normalizar `current/` conforme o protocolo. Nenhuma implementação, migração,
consolidação, push, merge, deploy ou ação remota é autorizada por esta revisão.
