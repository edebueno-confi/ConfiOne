# TASK

- Task ID: `R2-CUSTOMER-CENTRAL-QA-2026-08-21`
- State: READY_FOR_REVIEW
- Owner: Sentinel
- Role: REVIEWER
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Coordinator: Codex
- Approval: APPROVED
- Base SHA: `16faa01b`

## Objetivo

Validar localmente a Central de Clientes V1 contra os blueprints aprovados,
arquitetura de informação, contratos, segurança, tenant, performance e
estados, sem publicar a Release 2.

## Escopo

Executar QA visual e funcional proporcional ao ambiente, incluindo rota,
guard, renderização, navegação, tabs, loading/error/empty, responsividade,
console/network, fontes de dados e divergências contra
`CENTRAL_CLIENTES_HOME_V1` e `CLIENTE_RESUMO_V1`. Avaliar tenant/RLS e
performance com evidência local, sem inferir validação servida.

## Fora do escopo

Não publicar R2, não ler secrets, não fazer chamadas/escritas HubSpot/OMIE,
não alterar produção, credenciais, migrations remotas, deploy, push ou merge.
Não declarar segurança, performance ou dados atuais como comprovados sem
execução correspondente.

## Critérios de aceite

- matriz de fidelidade visual e arquitetura de informação contra blueprints;
- rota, guard, navegação e estados avaliados em runtime quando possível;
- tenant, autorização, isolamento e dados reais classificados por evidência;
- performance, console/network e responsividade registrados;
- divergências, limitações e próximos gates explícitos.
