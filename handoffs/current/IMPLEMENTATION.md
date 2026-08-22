# IMPLEMENTATION

- Task ID: `AUTH-ADMIN-DENIAL-ROOT-CAUSE-2026-08-21`
- State: `READY_FOR_IMPLEMENTATION`
- Owner: `Forge`
- Reviewer active: `Sentinel`
- Base SHA: `56e5fd3b0a5812fac6f22572f136b2feb82fd8e1`
- Current SHA: `UNCOMMITTED_WORKTREE`
- Implementation SHA: `UNCOMMITTED_WORKTREE`

## Plano

1. Confirmar branch, HEAD, worktree e a allowlist antes de tocar arquivos.
2. Reconstituir o fluxo de autenticação e autorização com evidência de código,
   contratos, rotas e testes existentes.
3. Reproduzir o caso de administrador válido recebendo `Acesso negado`, sem
   alterar estado remoto ou mascarar falhas.
4. Corrigir somente a causa mínima comprovada e adicionar regressão focada.
5. Executar os gates aplicáveis, registrar limitações e entregar a Sentinel.

## Estado da implementação

Implementação ainda não iniciada. Nenhum arquivo de produto foi alterado neste
lote após a abertura do handoff.

## Validações

Ainda não executadas para esta task. Serão registradas após a reprodução e a
correção, incluindo testes focados, typecheck, build, lint aplicável,
`review:gates` e `git diff --check`.

## Limitações e riscos

- A reprodução autenticada pode depender de um ambiente local configurado e de
  um usuário de teste válido; se isso impedir a reprodução, a limitação será
  registrada sem inventar evidência.
- Não serão executadas escritas remotas, alterações de secrets, deploys ou
  migrations remotas.
