# TASK

- Task ID: `R2-CUSTOMER-CENTRAL-WORKSPACE-2026-08-21`
- State: READY_FOR_REVIEW
- Owner: Sentinel
- Role: REVIEWER
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Coordinator: Codex
- Approval: APPROVED
- Base SHA: `344f900c`

## Objetivo

Implementar localmente o workspace da Central de Clientes conforme os
blueprints aprovados, usando dados e contratos reais, sem publicar a Release 2.

## Escopo

Implementar carteira e rota dedicada do cliente, arquitetura visual dos
blueprints `CENTRAL_CLIENTES_HOME_V1` e `CLIENTE_RESUMO_V1`, tabs com dados
reais, busca global existente sem duplicação, estados loading/error/empty e
responsive desktop-first. O cliente deve abrir em workspace próprio, sem
slide-over como superfície principal.

## Fora do escopo

Não inventar dados, KPIs, contratos, clientes ou integrações. Não criar segunda
busca global, não alterar shell global fora da superfície, não publicar,
alterar produção, secrets, credenciais, HubSpot/OMIE, migrations remotas,
deploy, push ou merge. Não mascarar `NOT_PROVEN` como disponível.

## Critérios de aceite

- carteira e workspace usam fontes/read models reais e respeitam tenant/RLS;
- rota dedicada, tabs, navegação e permissões são coerentes;
- blueprints são seguidos ou divergências justificadas por dados/contratos;
- estados loading/error/empty/indisponível e responsividade são reais;
- QA visual e funcional local, testes, gates e limitações registrados.
