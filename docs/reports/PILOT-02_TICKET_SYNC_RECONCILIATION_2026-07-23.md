# PILOT-02 — Reconciliação da contagem de tickets

## Constatação

O status da última sincronização HubSpot pode informar `0 tickets`, enquanto o Dashboard Gerencial apresenta tickets ativos.

## Fontes verificadas

- A função `supabase/functions/hubspot-sync/index.ts` executa sincronização incremental usando a janela desde a última execução bem-sucedida, com margem operacional de cinco minutos.
- O contador `tickets_synced` registra somente tickets processados na execução corrente; não representa o total persistido.
- A tabela `hubspot_tickets` mantém o snapshot acumulado.
- As views/RPCs de analytics consultam o snapshot persistido, aplicando pipeline ativo e período selecionado.

## Conclusão

A divergência é semântica e explicável: `0 tickets` significa que nenhum ticket foi alterado na janela incremental, enquanto o Dashboard calcula o recorte sobre o snapshot acumulado. Não há evidência local de que o KPI esteja incompleto ou de que seja necessário migration, RLS ou alteração estrutural de autorização.

## Correção aplicada

O Dashboard passou a distinguir explicitamente:

- tickets atualizados nesta execução;
- snapshot acumulado usado pelos KPIs.

Quando a execução bem-sucedida não processa tickets, a interface informa que nenhum ticket foi alterado naquela execução e que o Dashboard usa o snapshot acumulado.

## Risco residual

O snapshot depende da última carga bem-sucedida e dos filtros de pipeline/período. Uma falha ou atraso de sincronização pode reduzir a atualidade dos dados, mas não deve ser interpretado como ausência total de tickets. O status da execução continua sendo a referência de frescor do cache.
