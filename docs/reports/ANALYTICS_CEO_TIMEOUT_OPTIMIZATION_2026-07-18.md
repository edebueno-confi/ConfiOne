# Otimizacao do timeout da Visao Executiva - 2026-07-18

## Sintoma

Ao abrir a Visao Executiva, o dashboard retornava `canceling statement due to
statement timeout`. O problema ocorria no read model executivo, nao no filtro
visual.

## Causa confirmada

O cache local continha 3.077 titulos financeiros e 10.162 empresas HubSpot.
Cada titulo fazia uma busca textual potencialmente ampla nas empresas para
reconciliacao por CNPJ ou nome. Alem disso, o wrapper executivo chamava uma
funcao legada que repetia parte da reconciliacao. O custo crescia como uma
combinacao de titulos e empresas e excedia o limite de tempo do Postgres.

## Correcao aplicada

- Criacao da migration `20260718104000_analytics_ceo_reconciliation_indexes_v1.sql`.
- Indices de expressao para CNPJ e nome normalizados em empresas e titulos.
- A funcao legada passou a ser somente a base de Comercial e Suporte; ela nao
  reconcilia Financeiro.
- A reconciliacao financeira permanece uma unica vez no wrapper
  `rpc_analytics_ceo_snapshot`.
- O Financeiro da Visao Executiva continua sendo uma posicao ate a data final:
  titulos vencidos de meses anteriores continuam visiveis como inadimplencia,
  mesmo quando o filtro inicial esta no mes atual.
- O pipeline de Suporte nao foi alterado.

## Resultado esperado

Clientes com saldo vencido devem aparecer na Visao Executiva quando houver
correspondencia por CNPJ ou, como fallback seguro, por nome normalizado. A
qualidade dos dados informa reconciliados, sem correspondencia e ambiguos, sem
fabricar vinculos.

## Validacao

- Migrations aplicadas localmente com `npx supabase migration up`, sem reset.
- `npx supabase db lint`: aprovado; permanecem apenas warnings preexistentes
  relacionados a `v_actor`.
- `npm run web:typecheck`: aprovado.
- `npm run web:build`: aprovado; permanece o warning conhecido de chunk grande
  do Vite.
- `git diff --check`: aprovado.
- O teste de banco 056 ainda nao fecha no runner atual porque o runner nao
  materializa as migrations mais recentes no schema de teste; isso nao invalida
  a verificacao do banco local, onde as tabelas e colunas existem.
- A verificacao visual pelo Chrome ficou pendente: a URL local abriu uma pagina
  branca, sem DOM renderizado, porque o servidor web local nao estava entregando
  a aplicacao no momento da captura.

## Pendencia operacional

Reabrir a URL com o servidor web local ativo e uma sessao autenticada para
confirmar visualmente os cards e a tabela de clientes vencidos. Depois, executar
uma chamada autenticada do RPC e registrar tempo de resposta real.
