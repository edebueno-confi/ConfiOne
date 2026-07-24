# HubSpot — execução faseada e recuperação do timeout — 2026-07-21

## Diagnóstico

- O HTTP 503 inicial de HubSpot e OMIE era causado pelo Edge Runtime local
  parado; os dois endpoints retornavam `ServiceUnavailable` antes de executar
  a função.
- Depois que o runtime foi iniciado, o OMIE concluiu normalmente com 3.433
  títulos aceitos.
- A primeira carga monolítica do HubSpot excedeu o limite de CPU/tempo do
  worker e o cliente recebeu HTTP 504. O worker continuou no servidor e acabou
  persistindo um snapshot completo: 10.162 empresas, 1.147 deals e 34.131
  tickets.

## Implementação

- `supabase/functions/_shared/hubspot-sync-scope.mjs` define os escopos
  `companies`, `commercial` e `cs`.
- `supabase/functions/hubspot-sync/index.ts` aceita `scope`, reaproveita um
  snapshot global bem-sucedido como fronteira incremental e evita processar
  pipelines durante a etapa de empresas.
- `apps/web/src/features/analytics/analytics-api.ts` executa as três etapas
  sequencialmente por padrão e agrega os contadores; chamadas legadas com
  `phased: false` continuam disponíveis.
- A sincronização permanece read-only nas APIs externas: os writes são apenas
  no read model local do Supabase.

## Validação real

Após a alteração, foram executadas as três etapas autenticadas localmente:

| Etapa | HTTP | Modo | Empresas | Deals | Tickets | Owners | Estágios |
|---|---:|---|---:|---:|---:|---:|---:|
| companies | 200 | incremental | 2 | 0 | 0 | 31 | 0 |
| commercial | 200 | incremental | 0 | 1.147 | 0 | 0 | 12 |
| cs | 200 | incremental | 0 | 0 | 0 | 0 | 31 |

Tempo total do lote faseado validado: aproximadamente 20 segundos, sem novo
HTTP 503/504 e sem nova execução presa em `running`.

O QA autenticado do Dashboard também confirmou que o cabeçalho agrega as três
etapas e exibe `2 empresas, 1147 deals, 0 tickets`, em vez de mostrar apenas a
última etapa `cs`. O preset `Mês passado` foi aplicado no Financeiro (`2026-06-01`
a `2026-06-30`) e permaneceu ao navegar para Comercial.

Além do smoke autenticado, `contracts:typecheck`, `web:typecheck`, `web:build`,
`supabase:lint:db`, `supabase:test:db` (67 arquivos, 1.194 testes), validação
documental e `git diff --check` passaram.

Os testes específicos do agrupamento de execuções passaram em 2/2 e foram
registrados em `tests/scripts/analytics-sync-run-grouping.test.mjs`.

## Operação local

Antes de testar integrações, o Edge Runtime precisa estar ativo:

```powershell
npm run supabase:functions:serve
```

O processo foi iniciado nesta sessão e permanece ativo. A UI do Dashboard já
usa a execução faseada por padrão.

## Pendências

- Atualizar o runner remoto/scheduler para chamar os três escopos sequenciais,
  ou migrá-lo para uma fila assíncrona protegida; nenhum write remoto foi feito.
- Manter uma política de timeout/observabilidade para detectar workers órfãos e
  registrar a execução como `partial` quando uma etapa falhar.
