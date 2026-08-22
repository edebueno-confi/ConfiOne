# TASK

- Task ID: `R1-INTEGRATION-CALL-QUALITY-2026-08-21`
- State: `READY_FOR_REVIEW`
- Owner: `Sentinel`
- Role: `REVIEWER`
- Reviewer active: `Sentinel`
- Review mode: `SENTINEL_REQUIRED`
- Coordinator: `Codex`
- Agent coordination: `REVIEW_ACTIVE`
- Approval: `APPROVED`
- Base SHA: `24dce2e`
- Current SHA: `UNCOMMITTED_WORKTREE`
- Allowlist: diagnóstico documental e validação local da cadeia de integração e
  atualização do Dashboard; sem alteração de secrets, escrita externa,
  produção, migration remota ou fallback silencioso.

## Objetivo

Identificar por que a atualização financeira local não está funcionando e
verificar a qualidade das chamadas de integração e das chamadas de atualização
dos painéis, separando falha de credencial, transporte, contrato, persistência,
read model, `sync_run`, frescor e refresh do Dashboard.

## Escopo obrigatório

- rastrear a cadeia OMIE Financeiro e integrações consumidas pelo Dashboard;
- verificar configuração, endpoint, método, headers, payload, paginação,
  timeout, retry, rate limit, resposta e normalização sem expor segredos;
- verificar persistência, histórico de sincronização, read models, frescor,
  invalidação, filtros e chamadas de atualização das abas;
- reproduzir somente em ambiente local e com leitura/validação segura;
- registrar causa confirmada, hipóteses descartadas, lacunas e próximo lote;
- atualizar documentação e entregar em `READY_FOR_REVIEW`.

## Critérios de aceite

- a falha financeira é classificada por camada, sem tratar HTTP 200 como prova
  de funcionamento;
- nenhuma credencial é revelada, rotacionada ou alterada;
- nenhuma escrita é feita em HubSpot, OMIE, produção ou serviço externo;
- loading, erro, vazio, stale, concorrência, duplicidade, filtros e refresh
  ficam cobertos ou explicitamente limitados;
- a cadeia do Dashboard é documentada com evidência em arquivos, contratos,
  testes e resultados locais;
- a entrega termina com gates proporcionais e revisão independente do Sentinel.

## Fora do escopo

Não corrigir código, migration, RPC, view, policy ou contrato neste diagnóstico
sem evidência suficiente e sem um lote específico autorizado. Não criar
fallback de planilha, dado sintético ou regra local para mascarar a falha.
