# TASK

- Task ID: `R1-DASHBOARD-RELEASE-GATE-2026-08-21`
- State: READY_FOR_REVIEW
- Owner: Sentinel
- Role: REVIEWER
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Coordinator: Codex
- Approval: APPROVED
- Base SHA: `9cafdaf`

## Objetivo

Fechar o Dashboard Gerencial da Release 1 com Visão Geral, Comercial,
Customer Success, Suporte, Financeiro e Produto/Desenvolvimento funcionais,
confiáveis e coerentes com os contratos reais.

## Escopo

Auditar e validar abas, filtros de operação, pipelines, stages, KPIs,
divergências, séries, evolução, metas, predição, contratos, funil,
performance, qualidade de refresh e cobertura. Investigar documentação oficial
das APIs antes de declarar uma métrica indisponível. Aplicar OD-011 para escolher
visualizações pela pergunta e pelo dado, sem variedade decorativa.

Allowlist: componentes, contratos e testes diretamente relacionados ao
Dashboard, relatórios da auditoria e handoffs. Usar somente read models, RPCs,
APIs e dados reais existentes.

## Fora do escopo

Não inventar métricas, dados, endpoints, pipelines, permissões ou fontes. Não
alterar secrets, produção, integrações externas, migrations remotas, RLS/RPC,
grants ou shell global sem task específica. Não encerrar como `Indisponível`
sem investigar a API e registrar o motivo.

## Critérios de aceite

- matriz por aba com fonte, fórmula, cobertura, frescor, filtros e limitações;
- filtro de operação consistente onde aplicável, com Financeiro explicitamente
  sem distinção quando o contrato ainda não suportar;
- divergências Todas versus operação explicadas e testadas;
- refresh e falhas 503 diferenciados de ausência de dados;
- visualizações adequadas, responsivas, acessíveis e com estados honestos;
- gates, limitações e revisão independente registrados.
