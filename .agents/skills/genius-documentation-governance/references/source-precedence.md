# Precedência de fontes

## Ordem operacional

1. comportamento e contratos reais: código, migrations, views, RPCs, policies, testes e schemas;
2. documentos atuais declarados canônicos e confirmados por evidência;
3. Context Pack mais recente aprovado;
4. relatórios recentes com comandos, datas e saída verificável;
5. Product Docs e Build Journal;
6. histórico, handoffs antigos e snapshots;
7. prompts, chats, protótipos e artefatos experimentais.

## Regra de divergência

Não corrigir código para agradar documentação nem atualizar documentação para esconder bug. Primeiro classificar: documentação stale, contrato divergente, implementação incorreta, ambiente diferente ou decisão pendente. Se o contrato real contradisser uma decisão canônica, bloquear a conclusão e registrar a decisão necessária.

## Fontes GSO a conferir

- `AGENTS.md` e `CLAUDE.md`, quando existentes;
- `docs/PROJECT_STATE.md`, `docs/README.md`, `docs/DOCUMENTATION_LEDGER.md`;
- `docs/DOCUMENTATION_UPDATE_POLICY.md` e `docs/DOCUMENTATION_GOVERNANCE_RUNBOOK.md`;
- arquitetura, contratos, auth, AI governance e design system;
- `docs/context-handoff/`, `docs/reports/`, `docs/specs/` e documentação de área.

Não crie um novo registry ou índice sem auditar esses equivalentes.

