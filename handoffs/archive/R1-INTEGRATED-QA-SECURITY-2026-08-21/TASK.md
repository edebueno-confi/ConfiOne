# TASK

- Task ID: `R1-INTEGRATED-QA-SECURITY-2026-08-21`
- State: READY_FOR_REVIEW
- Owner: Sentinel
- Role: REVIEWER
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Coordinator: Codex
- Approval: APPROVED
- Base SHA: `8b6f4fc5`

## Objetivo

Validar localmente a Release 1 ponta a ponta, cobrindo autenticação, navegação,
dados, permissões, isolamento, auditoria, performance, console, rede, runtime
e regressões, sem declarar como comprovado o que depender de ambiente externo.

## Escopo

Executar os testes e smoke checks existentes, reconciliar as superfícies R1
com os contratos e handoffs aprovados, verificar estados loading/error/empty,
rotas e guards, cobertura de autorização e sinais de integração. Registrar
evidências separando código compilado, página renderizada, fluxo funcional,
integração real e limitações ambientais.

## Fora do escopo

Não ler secrets, não escrever em serviços externos, não alterar produção,
credenciais, migrations remotas, RLS/RPC/grants, deploy, push ou merge. Não
usar HTTP 200 isoladamente como prova de saúde funcional. Não mascarar falhas
nem alterar baseline para obter aprovação.

## Critérios de aceite

- matriz de cobertura das superfícies R1 e contratos afetados;
- testes e smoke checks locais executados com resultados reproduzíveis;
- segurança, isolamento e permissões avaliados com limitações explícitas;
- console, rede, runtime, performance e regressões registrados;
- bloqueios e riscos classificados, com OWNER_DECISION_REQUIRED quando aplicável.
