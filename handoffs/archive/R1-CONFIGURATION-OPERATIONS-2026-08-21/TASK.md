# TASK

- Task ID: `R1-CONFIGURATION-OPERATIONS-2026-08-21`
- State: READY_FOR_REVIEW
- Owner: Sentinel
- Role: REVIEWER
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Coordinator: Codex
- Approval: APPROVED
- Base SHA: `0e7d7c1`

## Objetivo

Fechar as Configurações Operacionais da Release 1 dentro da boundary de
segurança, cobrindo Integrações, Governança de Dados, Histórico de
Sincronizações, Marcas e as superfícies administrativas relacionadas.

## Escopo

Auditar e validar fontes, cobertura, integridade, dependências, status de
conexões, execuções de sincronização, resultados de erro/sucesso e marcas.
Preservar segredo e separação entre configuração local e serviço externo.

Allowlist: páginas, contratos, read models, RPCs e testes diretamente
relacionados às configurações, além de relatório e handoffs. Somente leitura e
ações locais não destrutivas nesta fase.

## Fora do escopo

Não ler ou alterar secrets, não fazer chamadas externas que escrevam, não
alterar credenciais, produção, migrations remotas, RLS/RPC, grants ou integrações
externas. Não declarar conexão saudável por HTTP 200 sem sucesso funcional.

## Critérios de aceite

- matriz de superfícies, fontes, dependências e permissões;
- histórico de sync com estados, erros e frescor reais;
- governança evidencia cobertura e integridade do Dashboard;
- marcas respeitam o modelo atual;
- testes, gates, limitações e riscos externos registrados.
