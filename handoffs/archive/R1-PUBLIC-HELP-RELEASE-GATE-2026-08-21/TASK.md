# TASK

- Task ID: `R1-PUBLIC-HELP-RELEASE-GATE-2026-08-21`
- State: READY_FOR_REVIEW
- Owner: Sentinel
- Role: REVIEWER
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Coordinator: Codex
- Approval: APPROVED
- Base SHA: `e83bcaaa`

## Objetivo

Fechar a Central Pública de Ajuda da Release 1 expondo somente conteúdo
publicado e estados públicos coerentes.

## Escopo

Validar home, lista, categorias, busca, artigo, relacionados, rotas públicas,
read models, filtros de publicação, estados loading/error/empty/not found e
links. Reconciliar contratos reais e manter a Central Pública separada da
administração interna.

## Fora do escopo

Não publicar conteúdo, fazer upload, alterar secrets, escrever em produção ou
serviços externos, fazer deploy, push, merge ou migrations remotas. Não expor
rascunhos, conteúdo em revisão ou dados administrativos.

## Critérios de aceite

- somente conteúdo com estado publicado é elegível para exibição;
- superfícies públicas e rotas reconciliadas com contratos reais;
- busca, categorias, artigo e relacionados não vazam conteúdo não publicado;
- estados de ausência, erro e indisponibilidade são honestos;
- testes, gates, limitações e divergências registradas.
