# TASK

- Task ID: `R2-CUSTOMER-DATA-FOUNDATION-2026-08-21`
- State: APPROVED
- Owner: Forge
- Role: EXECUTOR
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Coordinator: Codex
- Approval: APPROVED
- Base SHA: `f73be1a3`

## Objetivo

Fechar a fundação local de dados da Central de Clientes, preservando o `NO-GO`
da Release 1 para publicação externa e sem publicar a Release 2.

## Escopo

Auditar e, quando necessário dentro da allowlist, consolidar identidade
canônica, cliente ativo HubSpot, importação segura, referências externas e
matching com OMIE. Reconciliar contratos, read models, tenant, deduplicação,
proveniência, estados de importação e tratamento de ambiguidades.

## Fora do escopo

Não fazer chamadas ou escritas em HubSpot/OMIE, não ler secrets, não alterar
credenciais, produção, publicação, deploy, push, merge ou migrations remotas.
Não usar fuzzy matching silencioso, não inventar cliente ativo ou referência
externa e não implementar a Central de Clientes sem contrato real.

## Critérios de aceite

- identidade e cliente ativo têm fonte canônica e cobertura explícita;
- importação, referências externas e matching são auditáveis e idempotentes;
- ambiguidades, duplicidades e ausência de dados têm estados honestos;
- tenant, permissões e isolamento são considerados;
- testes, gates, limitações e quaisquer dependências externas são registrados.
