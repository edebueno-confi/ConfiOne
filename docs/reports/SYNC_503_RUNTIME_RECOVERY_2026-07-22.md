# Recuperação dos 503 de sincronização — 2026-07-22

## Diagnóstico

Os três endpoints locais (`omie-sync`, `hubspot-sync` e
`analytics-integration-run`) retornavam HTTP 503 inclusive em `OPTIONS`. O
Kong, o banco e o Studio estavam saudáveis, mas o container
`supabase_edge_runtime_genius-support-os` estava encerrado com código 255,
`OOMKilled=false` e política de reinício desativada. Portanto, a falha
observada na tela ocorria antes de autenticação e antes de qualquer chamada ao
OMIE ou ao HubSpot.

Os logs anteriores também registram encerramentos de isolates por limite de
tempo durante cargas longas. Isso é um risco separado do 503 de runtime parado:
o HubSpot já possui execução faseada; a orquestração automática OMIE ↔ HubSpot
continua candidata a ser dividida em etapas assíncronas.

## Correção aplicada

- Container local do Edge Runtime reativado.
- Política local alterada para `unless-stopped`, evitando que uma parada do
  processo deixe o gateway permanentemente indisponível após a próxima subida
  do Docker.
- Frontend passou a classificar erros de sincronização: 503/`BOOT_ERROR`,
  546/`WORKER_LIMIT` e erros funcionais retornados pelo provedor não são mais
  apresentados como a mesma mensagem genérica.
- Nenhuma credencial foi lida, exposta ou alterada neste lote.
- Nenhuma sincronização real contra OMIE ou HubSpot foi disparada durante o
  diagnóstico.

## Evidência

Antes da recuperação:

- `OPTIONS /functions/v1/omie-sync` → 503;
- `OPTIONS /functions/v1/hubspot-sync` → 503;
- `OPTIONS /functions/v1/analytics-integration-run` → 503.

Depois da recuperação:

- os três endpoints retornaram `OPTIONS` → 200;
- chamadas `POST` sem credencial aos três handlers retornaram 403, confirmando
  que o runtime está roteando e executando a autorização interna;
- container em estado `running`, sem OOM e com política `unless-stopped`.

## Validação de código

- `node --test tests/scripts/analytics-sync-error.test.mjs` — 3/3 aprovados;
- o teste cobre 503, 546 e preservação de erro funcional 502.

## Pendência técnica

O próximo ciclo deve executar uma sincronização autenticada em ambiente local
com janela operacional acompanhada. Se a carga automática voltar a ultrapassar
o limite do worker, o fluxo deve ser materializado em etapas persistidas (OMIE,
read model e atualização HubSpot), sem transformar uma etapa concluída em erro
total.
