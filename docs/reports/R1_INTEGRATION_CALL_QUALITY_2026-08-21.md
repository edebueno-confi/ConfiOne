# R1 Integration Call Quality

## Escopo e limites

Este relatório registra o diagnóstico local read-only da task
`R1-INTEGRATION-CALL-QUALITY-2026-08-21`. O objetivo foi separar configuração,
autorização, chamada OMIE, resposta, normalização, persistência, read model,
frescor e refresh do Dashboard.

Não foram lidos ou alterados segredos, não houve chamada ao portal OMIE ou ao
HubSpot, não houve escrita externa, migration remota, produção ou fallback
silencioso. O relatório não corrige código, SQL, RPC, view, policy, contrato ou
UI.

## Veredito local

O bloqueio reproduzido no banco local é de disponibilidade do snapshot publicado,
não de uma falha confirmada na fórmula do Dashboard:

1. A configuração local do OMIE possui uma integração habilitada e uma
   referência de credencial, mas nenhum segredo foi lido.
2. `analytics_finance_sync_runs` não possui execução local registrada.
3. O estado publicado retorna OMIE `never_synced`, sem `currentRunId`, sem
   `lastSuccessAt` e com `hasValidSnapshot = false`.
4. `rpc_analytics_finance_snapshot` retorna `source = none`, `status = empty`,
   `sync_run_id = null` e motivo equivalente a “sem registros válidos”.
5. Existem seis linhas locais `current`, mas todas têm `source_key =
   local_qa_finance` e não `omie_receivables_api`. O contrato atual publica
   somente o segundo valor, portanto a fixture não pode alimentar o Dashboard.
6. O runtime Edge local não está ativo. `POST
   http://127.0.0.1:54321/functions/v1/omie-sync` respondeu HTTP 503. Assim, não
   foi possível reproduzir a chamada autenticada completa sem violar os limites
   da task.

Conclusão: o painel preserva corretamente a ausência de um snapshot OMIE válido;
o próximo passo é recuperar a execução local autorizada do worker e observar o
resultado por `sync_run`. Não é correto converter a fixture local em fonte
publicada nem afirmar que HTTP 200 externo seria sucesso funcional.

## Paridade local versus produção

O proprietário informou que a versão de produção funciona. Isso é uma
informação operacional válida para orientar a comparação, mas não foi verificada
por este agente. A análise abaixo usa somente código, migrations, manifests,
configuração e estado local não sensível.

| Área | Fato local observado | Paridade/hipótese | Exige validação autorizada |
|---|---|---|---|
| Código e migrations | O checkout está em `24dce2e`; o banco local possui 287 migrations aplicadas até `20260821150000`, igual ao migration mais recente do checkout consultado. | Não há evidência local de perda do código ou de migration pendente. | Comparar o commit/artefato efetivamente implantado e a versão de schema do projeto produtivo, sem fazer deploy ou migration. |
| Banco/fixtures | O volume do banco foi criado em `2026-08-16`; o container iniciou em `2026-08-21`. Há zero `analytics_finance_sync_runs`, seis linhas `local_qa_finance` e agenda local OMIE desligada (`enabled=false`, `frequency=off`). | Forte hipótese de estado local recriado, reidratado ou separado do estado que continha runs OMIE; isso não prova perda de dados produtivos. | Confirmar, em ambiente autorizado, se o banco produtivo possui runs OMIE recentes, snapshot `omie_receivables_api`, agenda habilitada e histórico coerente. |
| Edge Runtime | O container local foi criado em `2026-08-16`, encerrou em `2026-08-18` com exit code 255 e permanece parado; o endpoint local retornou 503. | Fato local de indisponibilidade do runtime. É hipótese de drift que isso explique a diferença para produção funcional. | Confirmar health, logs, versão e deploy das Edge Functions no ambiente autorizado. Não reiniciar, recriar ou alterar containers neste lote. |
| Manifest de funções | `supabase/config.toml` declara `omie-sync`, `analytics-integration-run` e `analytics-scheduled-run` com `verify_jwt=false`, mas não possui bloco explícito para `analytics-sequential-sync`, embora frontend, scheduler e migrations o invoquem. | Possível drift de configuração entre checkout local e configuração efetiva do projeto implantado. Não é prova de falha em produção, pois a função pode ter configuração remota equivalente não versionada. | Comparar a configuração efetiva da função e o modo de autenticação do gateway, sem revelar secrets e sem alterar a configuração. |
| Nomes de secrets | O código usa `ANALYTICS_SYNC_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` e, em fachadas legadas, `OMIE_CREDENTIALS`/`HUBSPOT_PRIVATE_APP_TOKEN`; o caminho canônico lê a credencial OMIE pelo RPC gerenciado. | Divergência de nome, ausência ou escopo do segredo pode explicar um scheduler local inativo, mas não foi comprovada e nenhum valor foi lido. | Validar somente presença, vínculo e rotação controlada no ambiente autorizado, sem expor valores. |
| Scheduler | O banco local possui jobs de associações, KPI, driver HubSpot e reapers, mas não possui job explícito que invoque `analytics-scheduled-run`; a agenda de integração está desligada. Migrations versionadas usam `pg_net` e o nome `gso_analytics_sync_scheduler`. | Possível diferença entre jobs aplicados localmente, jobs de produção e configuração da agenda. | Comparar nomes, cron, ativo/inativo, URL lógica e última execução no ambiente autorizado, sem executar chamadas. |
| Cadeia de deploy | Não há script local autorizado neste lote que publique funções ou sincronize configuração remota; a análise não executou deploy. | Não é possível afirmar que produção recebeu exatamente o checkout atual. | Validar commit implantado, bundle das funções, configuração e migrations no pipeline de release autorizado. |

Classificação: os itens de banco, runtime, agenda e resposta 503 são fatos locais;
drift de configuração/deploy é hipótese; versão implantada, saúde de produção,
segredos efetivos, scheduler remoto e paridade de dados exigem validação em
ambiente autorizado. Nenhum container ou volume foi alterado.

## Cadeia executável

```text
credencial gerenciada
  -> autorização platform_admin ou scheduler interno
  -> analytics-sequential-sync
       -> HubSpot primeiro
       -> omie-sync
  -> runOmieSnapshot
       -> ListarContasReceber
       -> normalização e identidade estável
       -> enriquecimento opcional de clientes
       -> staging em lotes
       -> rpc_service_promote_omie_snapshot
       -> analytics_finance_sync_runs + telemetria
  -> vw_analytics_finance_sync_runs_read / rpc_analytics_source_status
  -> rpc_analytics_finance_snapshot
  -> AnalyticsFinancePage
```

O modo legado `analytics-integration-run` permanece como fachada de
compatibilidade, mas a configuração atual usa o orquestrador sequencial. O
HubSpot e o OMIE são etapas independentes depois da conclusão terminal do
HubSpot; uma falha terminal produz resultado `partial`, não sucesso integral.

## Matriz de qualidade das chamadas

| Camada | Evidência atual | Resultado/limitação |
|---|---|---|
| Autorização | `supabase/functions/omie-sync/index.ts` e `analytics-sequential-sync/index.ts` | Manual exige sessão com `platform_admin`; scheduler usa segredo interno. Nenhuma credencial foi lida neste diagnóstico. |
| Endpoint OMIE | `_shared/omie.ts`, `OMIE_BASE_URL` | POST para `https://app.omie.com.br/api/v1/financas/contareceber/`, método `ListarContasReceber`. A URL foi confirmada por código, não chamada neste lote. |
| Payload | `buildOmieReceivablesRequest` | `pagina`, `registros_por_pagina = 500` e `apenas_importado_api = 'N'`, além de `call`, `app_key` e `app_secret` vindos da credencial gerenciada. |
| Paginação | `fetchOmieReceivablesWithMetadata` | Serial, até 100 páginas, valida progresso, página vazia intermediária e `total_de_registros`. |
| Timeout/retry | `_shared/omie.ts` | Timeout padrão de 15 s, máximo configurável de 3 retries, retry para 429 e 5xx, telemetria por tentativa e `Retry-After` sanitizado. |
| Resposta | `classifyOmieError` e `fetchOmieReceivablesWithMetadata` | Falha funcional em HTTP 200, formato inválido, total divergente e resposta vazia ambígua não promovem snapshot. |
| Normalização | `normalizeOmieApiReceivables` | Exige identidade oficial ou composição estável; deriva status, saldo e recebido, preserva `sync_run_id` e redige payload sensível. |
| Enriquecimento | `ListarClientesResumido` | Leitura auxiliar por cliente, com cache de 15 min; cache parcial/stale é explicitamente classificado, não vira snapshot completo de títulos. |
| Persistência | `runOmieSnapshot` | Registra run, grava staging em lotes de 500 e promove por RPC atômica. Falha parcial, vazia, colisão ou rejeição preserva o snapshot anterior. |
| Observabilidade | `sync-request-telemetry.ts` e read models | Registra endpoint lógico, tentativa, página, status, duração, retries, rate limit e códigos sanitizados. Não registra URL completa, payload ou segredo. |

## Persistência, fonte e frescor

O `rpc_analytics_finance_snapshot` seleciona apenas linhas `is_current` com
`source_key = 'omie_receivables_api'`. Esse filtro é deliberado no contrato
OMIE-only e impede que `local_qa_finance` ou vestígios históricos de planilha
sejam tratados como dado produtivo.

O `rpc_analytics_source_status` e o read model
`vw_analytics_finance_sync_runs_read` são as superfícies de diagnóstico usadas
pela UI. Sem execução concluída e sem linha OMIE atual, o Financeiro fica em
estado de ausência. `empty`, `never_synced`, `failed`, `partial` e `stale` não
equivalem a saldo zero e não devem ser colapsados em sucesso.

## Chamadas de refresh do Dashboard

| Superfície | Comportamento observado no código | Cobertura local |
|---|---|---|
| `AnalyticsShell` | Carrega estado de fonte na montagem; dispara `analytics-sequential-sync`; aguarda polling de 1,5 s, com teto padrão de 5 min; remonta o domínio via `reloadKey` após o ciclo. | Fluxo estático coberto; execução Edge bloqueada pelo runtime parado. |
| `AnalyticsFinancePage` | Consulta snapshot financeiro e reconciliação em paralelo; consulta status OMIE e o último run; recarrega por `onRetry`. | Contrato confirmado; snapshot local devolveu `none/empty`. |
| `DashboardSourcesSettingsPage` | Atualiza uma fonte ou o painel completo; acompanha status; chama `load()` após a conclusão e preserva último estado em erro/timeout. | A camada de chamada foi verificada; não houve acionamento de integração. |
| Histórico | Lê `vw_analytics_dashboard_sync_status` e `vw_analytics_finance_sync_runs_read`, com filtros e limites publicados. | View OMIE local sem linhas; HubSpot possui histórico separado. |

Estados de loading, erro, vazio, stale, concorrência e timeout têm caminhos
explícitos no código. A validação visual autenticada e uma execução Edge real
não foram possíveis neste lote.

## Hipóteses descartadas e lacunas

- Não foi encontrada evidência de fallback atual de planilha no caminho do
  Dashboard; o contrato publicado rejeita essa substituição silenciosa.
- Não foi tratado HTTP 200 como prova de sucesso. O cliente valida fault
  funcional, paginação, total e promoção antes de considerar o snapshot válido.
- A existência da referência de credencial não prova validade, permissão,
  conectividade ou retorno do portal OMIE.
- Não foi possível distinguir falha de credencial, transporte ou payload no
  portal porque a função Edge local não pôde ser executada sem uma chamada
  real. Esses cenários permanecem hipóteses não confirmadas.
- Não há evidência local neste lote de que filtros, fórmulas ou RPCs do
  Dashboard sejam a causa primária. A ausência do snapshot precede a leitura da
  página.

## Próximo lote recomendado

1. Reativar apenas o runtime Edge local, sem reset ou reidratação, e executar o
   caminho com fixture/credencial de teste autorizada, mantendo a chamada ao
   provedor externo explicitamente proibida até decisão específica.
2. Validar a cadeia interna com um `sync_run` controlado: autorização,
   telemetria, status, staging, promoção, view de histórico e snapshot.
3. Se a execução local permanecer bloqueada, separar em task própria a
   disponibilidade do runtime/fixture, sem transformar `local_qa_finance` em
   fonte publicada.
4. Só depois investigar credencial, transporte e contrato do portal OMIE em
   ambiente autorizado. Nenhum desses passos autoriza escrita externa.

## Atualização de radar — evidência adicional de disponibilidade local — 2026-08-22

O proprietário informou nova ocorrência observada no navegador durante o uso do
ambiente local:

| Sinal | Classificação | Evidência e limite |
|---|---|---|
| `hubspot-orchestrator-start` respondeu HTTP 503 | Bloqueador local de runtime/endpoint | Reproduzido no console do navegador em `127.0.0.1:54321/functions/v1/hubspot-orchestrator-start`; não foi feita nova chamada POST neste registro para evitar acionar integração externa. |
| `analytics-sequential-sync` respondeu HTTP 503 | Bloqueador local de runtime/endpoint | Reproduzido no console do navegador em `127.0.0.1:54321/functions/v1/analytics-sequential-sync`; a ocorrência é consistente com o Edge Runtime local parado já documentado, mas a causa efetiva da falha ainda exige health/log do runtime. |
| `127.0.0.1` recusou conexão | Indisponibilidade do servidor local do painel ou porta incorreta | A porta canônica do painel de controle é `4178`, não a raiz sem porta. Após iniciar o servidor read-only, `GET http://127.0.0.1:4178` e `GET /api/snapshot` responderam HTTP 200. |
| Aviso do React DevTools | Informativo, não bloqueador | A mensagem de disponibilidade das ferramentas de desenvolvimento não indica falha da aplicação e não entra como incidente de integração. |

Este registro amplia o radar do lote já concluído sem criar uma task duplicada.
Permanece pendente a recuperação controlada do runtime local e a validação da
cadeia de refresh, sem chamadas externas, alteração de credenciais, produção,
secrets ou migration remota.

## Evidência e reprodutibilidade

- `npm run supabase:status`: banco local acessível; Edge Runtime listado como
  parado.
- `docker inspect`/`docker volume inspect`: banco iniciado em `2026-08-21`,
  volume criado em `2026-08-16`; Edge Runtime criado em `2026-08-16` e
  encerrado em `2026-08-18` com exit code 255.
- Consulta local de `cron.job`: jobs de associações, KPI, driver HubSpot e
  reapers presentes; nenhum job explícito de `analytics-scheduled-run`.
- `supabase/config.toml`: funções de OMIE e scheduler declaradas com
  `verify_jwt=false`; não há bloco explícito de `analytics-sequential-sync`.
- `POST http://127.0.0.1:54321/functions/v1/omie-sync`: HTTP 503.
- Consulta local read-only via `docker exec ... psql`: zero runs OMIE; seis
  linhas `local_qa_finance`; zero linhas em `vw_analytics_finance_sync_runs_read`;
  OMIE `never_synced`; snapshot `none/empty` sem `sync_run_id`.
- Código e contratos: `supabase/functions/_shared/omie.ts`,
  `supabase/functions/_shared/omie-sync-service.ts`,
  `supabase/functions/omie-sync/index.ts`,
  `supabase/functions/analytics-sequential-sync/index.ts`,
  `apps/web/src/features/analytics/analytics-api.ts`,
  `apps/web/src/features/analytics/AnalyticsShell.tsx`,
  `apps/web/src/features/analytics/AnalyticsFinancePage.tsx` e
  `supabase/migrations/20260809093201_analytics_finance_manual_reconciliation_v1.sql`.

Este relatório é diagnóstico documental. Nenhum código de produto, teste,
migration, RPC, view, policy, configuração executável ou integração foi
alterado.
