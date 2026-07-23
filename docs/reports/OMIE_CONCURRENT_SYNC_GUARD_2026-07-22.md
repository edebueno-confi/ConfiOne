# Guarda contra sincronizações OMIE concorrentes — 2026-07-22

## Diagnóstico

O Edge Runtime local estava ativo e as rotas respondiam. A falha não era ausência
da Edge Function: duas execuções — OMIE dedicado e orquestrador OMIE ↔ HubSpot —
podiam entrar simultaneamente, e a API OMIE rejeitava a segunda chamada com
`REDUNDANT`/`8020`. Quando o worker era interrompido, a execução permanecia em
`processing`, permitindo novas colisões e mensagens genéricas de indisponibilidade.

## Correção

- Nova migration cria índice único parcial para permitir somente uma execução
  financeira `processing` por vez.
- Execuções `processing` abandonadas há mais de 15 minutos são encerradas como
  `failed`, com motivo auditável.
- Os dois handlers (`omie-sync` e `analytics-integration-run`) fazem preflight
  de execução ativa e tratam a corrida no insert como `409` controlado.
- A paginação dos métodos OMIE permanece serializada: o provedor rejeita
  chamadas concorrentes do mesmo método com `8020`/`REDUNDANT`.
- O orquestrador agora marca o `analytics_finance_sync_runs` como `failed` no
  caminho de erro, evitando registros órfãos.
- A mensagem do frontend diferencia colisão/conclusão pendente de indisponibilidade
  do runtime.

## Validação

- `node --test tests/scripts/omie-client.test.mjs`: 10/10 aprovados.
- `npm run web:typecheck`: aprovado.
- Ambiente local: índice `analytics_finance_sync_runs_one_processing_idx` criado.
- Duas chamadas simultâneas autenticadas foram exercitadas: uma foi bloqueada
  com `409 OMIE_SYNC_IN_PROGRESS`; a outra encontrou uma requisição anterior do
  provedor ainda em janela de proteção e retornou erro detalhado, sem criar uma
  segunda execução financeira concorrente.

## Operação

Não clicar em “Sincronizar OMIE API” e “Rodar agora” ao mesmo tempo. Se houver
uma execução ativa, aguardar sua conclusão; o dashboard agora informa a condição
e o botão pode ser acionado novamente após a janela indicada.
