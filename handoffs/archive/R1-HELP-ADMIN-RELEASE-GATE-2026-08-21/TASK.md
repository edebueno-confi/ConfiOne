# TASK

- Task ID: `R1-HELP-ADMIN-RELEASE-GATE-2026-08-21`
- State: READY_FOR_REVIEW
- Owner: Sentinel
- Role: REVIEWER
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Coordinator: Codex
- Approval: APPROVED
- Base SHA: `acb2a959`

## Objetivo

Fechar a Central de Ajuda administrativa da Release 1 com operação coerente,
segura e baseada nos contratos reais da Knowledge Base.

## Escopo

Validar e, quando necessário dentro da allowlist, implementar lista, detalhe,
criação, edição, estados editoriais, configurações administrativas e abertura
da Central Pública. Reconciliar rotas, permissões, contratos, read models,
commands, estados loading/error/empty e link público.

## Fora do escopo

Não expor ou alterar secrets, não escrever em produção ou serviços externos,
não fazer deploy, push, merge ou migrations remotas. Não inventar conteúdo,
permissões, estados editoriais ou contratos. Preservar a revisão independente.

## Critérios de aceite

- superfícies administrativas e rotas reconciliadas com contratos reais;
- autorização consistente entre menu, guards e operações;
- lista, detalhe, criação, edição e estados editoriais funcionais ou
  explicitamente classificados conforme evidência;
- estados loading, erro, vazio e indisponibilidade honestos;
- testes, gates, limitações, divergências visuais e riscos registrados.
