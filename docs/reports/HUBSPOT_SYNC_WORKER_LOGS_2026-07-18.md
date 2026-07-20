# HubSpot Sync Worker e logs — 2026-07-18

## Correção

O erro `Worker failed to boot` foi causado por uma declaração duplicada de
`Deno.serve` antes de `syncDeals` em `supabase/functions/hubspot-sync/index.ts`.
A declaração extra foi removida. O arquivo agora possui uma única entrada
`Deno.serve` no final.

## Logs no Dashboard

A aba `Logs` foi adicionada ao Dashboard Gerencial. Ela consulta
`hubspot_sync_runs` e mostra:

- início e fim da execução;
- domínio sincronizado;
- status;
- deals, tickets, owners e estágios processados;
- mensagem de erro retornada pelo Worker.

Uma falha anterior ao boot não consegue criar uma linha em `hubspot_sync_runs`,
porque o código ainda não iniciou. Nessa situação, o Dashboard continua exibindo
o erro da chamada e o histórico não registra uma execução fictícia.

## Validação

- `rg` confirmou uma única declaração `Deno.serve` no Worker.
- `npm run web:typecheck`: aprovado.
- `npm run web:build`: aprovado.

## Falha 400 ao buscar tickets — 2026-07-18 23:40

### Causa raiz

Após a ativação dos pipes atuais de CS, a sincronização passou a consultar o
pipe `5034314`, que possui 27.538 tickets. A Search API do HubSpot permite no
máximo 10.000 resultados para uma única busca paginada. Por isso, empresas e
deals eram gravados normalmente, mas a busca de tickets falhava ao alcançar o
limite, com a mensagem genérica `There was a problem with the request.`.

### Correção aplicada

`fetchTicketsByPipeline` agora particiona a busca pelo intervalo de
`createdate`. Cada intervalo é dividido recursivamente quando o total supera
10.000; somente intervalos abaixo do limite seguem a paginação normal. Os
intervalos são semiabertos (`GTE`/`LT`), evitando duplicidade na data de corte.
Falhas futuras passam a informar o pipeline e o intervalo que falhou.

### Evidência

- Consulta read-only no portal 20108050 confirmou 27.538 tickets no pipe
  `5034314`.
- A mesma consulta limitada a 2024–2025 retornou 11.322, confirmando que uma
  única janela também poderia ultrapassar o limite.
- O último run com erro registrou `companies_synced=10161`,
  `deals_synced=1148`, `stages_synced=19` e `tickets_synced=0`; o cache
  anterior permaneceu preservado.

### Validação após a correção

- Nova execução autenticada concluída com `companies=10161`, `deals=1148`,
  `tickets=33339` e `stages=38`.
- Cache final por pipe: `1429283=739`, `2013870=859`, `23949674=2646`,
  `5034314=27538`, `53130860=8`, `95268403=2288`.
- A visão de CS passou a exibir Rodolfo Turra com 143 tickets no recorte do
  mês atual.
