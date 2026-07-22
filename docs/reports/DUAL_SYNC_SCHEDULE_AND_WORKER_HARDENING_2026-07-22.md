# Sincronizacao dual e hardening de limite de API - 2026-07-22

## Evidencia do incidente

O Dashboard retornava HTTP 546 ao executar `analytics-integration-run`. O log do Edge Runtime confirmou `CPU time hard limit reached` e cancelamento do worker. O endpoint `omie-sync` dedicado concluiu 3.433/3.433 titulos, portanto a credencial e a API OMIE estavam funcionais.

## Correcoes

- A atualizacao das propriedades financeiras no HubSpot passou de PATCH individual por empresa para `POST /crm/v3/objects/companies/batch/update`, em lotes de no maximo 100 empresas.
- O fluxo combinado nao repete `ListarClientesResumido` do OMIE. O enriquecimento opcional permanece no endpoint financeiro dedicado; o payload de Contas a Receber continua sendo aproveitado quando ja traz nome/CNPJ.
- Foi adicionada telemetria de fases sem dados sensiveis para diagnosticar latencia por etapa.
- Foi adicionado bloqueio de execucoes financeiras agendadas concorrentes.

## Agendamento dual

`analytics_integration_schedule` passa a armazenar dois agendamentos independentes:

- OMIE: financeiro e propriedades `omie_*` nas empresas HubSpot.
- HubSpot: empresas, Comercial, CS / Suporte, owners e estagios dos pipelines ativos.

O segundo fluxo usa `hubspot-sync` com escopo global e uma unica chamada do runner, evitando repetir a carga de empresas entre etapas. A configuracao e salva por `rpc_admin_set_sync_schedules`; o cron protegido por `ANALYTICS_SYNC_SECRET` deve chamar cada endpoint conforme sua agenda. Nenhum scheduler remoto ou deploy foi executado neste lote.

Foi preparada a Edge Function `analytics-scheduled-run` como heartbeat unico: ela chama os dois endpoints em ordem, e cada endpoint respeita sua propria cadencia. O runtime local manual desta sessao foi iniciado com um inventario de funcoes congelado antes da nova pasta; a rota do heartbeat sera carregada quando o ambiente local for recriado com a configuracao atual.

## Limite de API

- Paginacao permanece controlada.
- Backoff e retry sao usados somente em status transitorios.
- Atualizacoes HubSpot usam batch de 100.
- O enriquecimento caro nao e repetido dentro do mesmo ciclo.
- Cargas HubSpot por area continuam disponiveis para diagnostico, mas o fluxo automatico global faz a leitura consolidada uma vez.

## Validacao executada

- Endpoint local `omie-sync` autenticado: 3.433 titulos aceitos, 3.433 clientes enriquecidos.
- Endpoint local `analytics-integration-run` autenticado apos a correcao: HTTP 200, 3.433 titulos e sem cancelamento hard do worker. Naquele instante o rollup retornou 0; consulta posterior confirmou 10.163 empresas no cache e 136 grupos financeiros reconciliaveis, sem perda do read model.
- Testes do helper batch e classificacao de erros: 5/5.
- Typecheck web: aprovado.
- Migration dual aplicada apenas no banco local para validacao.

## Atencao

Para testar a atualizacao financeira em empresas, mantenha o cache HubSpot populado e use o runner combinado. A credencial OMIE nao deve ser substituida: a consulta dedicada foi comprovadamente bem-sucedida.
