# Addendum de reconciliação Git e estado documental — 2026-08-01

## Objetivo

Corrigir o drift identificado nos relatórios de release e atualizar os documentos
canônicos para o estado real do checkout único. Este addendum não reescreve
relatórios históricos; ele registra o estado posterior que os substitui como
fonte corrente.

## Fonte canônica

- Checkout: `C:\Projetos\GSO-old`
- Branch: `main`
- HEAD no fechamento: o commit que contém este addendum; confirme com `git rev-parse HEAD`
- Upstream: `origin/main`
- Divergência no fechamento: `git rev-list --left-right --count origin/main...HEAD` = `0 39`
- Worktrees ativos: 1, somente o checkout canônico
- Stash: preservado (`stash@{0}`)
- Refs de arquivo: 24 em `refs/archive/gso-git-cleanup/`

O grafo confirma que `origin/main` é ancestral do `main` atual. Os commits da
origem não foram perdidos e não houve reaplicação destrutiva. Branches sem
upstream, branches com commits locais não publicados e refs de arquivo foram
preservadas; não houve exclusão de branch remota.

## Drift corrigido

Os blocos correntes de `docs/PROJECT_STATE.md`,
`docs/DOCUMENTATION_LEDGER.md` e `docs/plan.md` ainda apontavam para snapshots
anteriores (`3dabf7d`, 15 commits à frente ou 21 commits à frente). Eles agora
apontam para o HEAD real `884a7d3` e para `0 32`.

Os relatórios anteriores continuam históricos. O relatório de auditoria de
release registrava `0 15`, o delta de Analytics registrava `0 21` e os relatórios
intermediários apontavam para a branch de auditoria. Essas informações continuam
válidas para seus respectivos momentos, mas não são mais o estado corrente.

## Preservação de trabalho

- A árvore funcional consolidada permanece em `main`.
- O stash continua disponível.
- As refs de arquivo continuam disponíveis.
- O conjunto de qualidade de código também estava em trabalho local não
  commitado: alterações em `check-project-patterns.mjs` e
  `run-quality-gate.mjs`, referências da skill, `validate-skill.mjs` e a
  documentação de engenharia, além dos testes em
  `.agents/skills/genius-code-quality/tests/`. Ele foi preservado, auditado e
  incluído no fechamento; não foi apagado nem descartado.

## Pendências técnicas que permanecem reais

1. Reexecutar a validação completa no HEAD atual após qualquer novo commit local.
2. QA autenticado das quatro superfícies do primeiro release com capturas reais.
3. Remover o editor legado somente após confirmar ausência de referências.
4. Endurecer grants/DML de `vw_admin_managed_integrations` com migration
   forward-only, RLS e pgTAP.
5. Separar namespaces de fixture entre `local:qa:hydrate` e pgTAP.
6. Revalidar o estado do pgTAP, pois os relatórios históricos têm evidências
   diferentes sobre extensão/disponibilidade.
7. Validar sincronização HubSpot/OMIE somente com credencial autorizada.

## Segurança e limites

Não foram lidos ou expostos secrets. Não houve reset, clean, rebase, merge,
cherry-pick, push, deploy, migration remota, sync externo ou alteração de banco
neste lote.

## Veredito

`consistente com ressalvas`: o estado Git está reconciliado e preservado; a
documentação corrente foi atualizada. A validação funcional completa do HEAD e
as pendências técnicas acima continuam separadas e não devem ser declaradas
concluídas por inferência.
