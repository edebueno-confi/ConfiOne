# Analytics CS: status e responsáveis consolidados — 2026-07-19

## Problema observado

O retorno anterior agrupava status pelo ID do estágio e responsáveis pelo ID
do owner. Como pipelines diferentes podem ter estágios chamados `Novo` ou
registros sem owner resolvido, a tela mostrava a mesma categoria várias vezes.

## Solução

O RPC `rpc_analytics_cs_snapshot` agora:

- consolida `by_status` pelo nome do estágio;
- soma tickets equivalentes entre pipelines;
- aceita uma lista de IDs de estágio no filtro;
- consolida `by_owner` pelo nome resolvido;
- preserva `pipeline_breakdown` em status e responsáveis.

Na interface, o gráfico mostra uma barra única por status. O tooltip mostra o
total consolidado e a decomposição por pipeline. A área de responsáveis mostra
os totais consolidados e uma grade com os pipelines e respectivos volumes.

## Correcao adicional

O detalhamento de responsaveis tambem foi normalizado por pipeline. Quando o
mesmo nome aparece em mais de um pipeline, o total continua em uma unica linha
e cada pipeline aparece uma unica vez com seu volume. Isso evita a repeticao
observada em `Sem responsavel` sem ocultar a origem da contagem.

## Limites preservados

- O pipeline não é alterado no HubSpot.
- O cálculo continua server-side.
- A consolidação não apaga nem mistura tickets; apenas organiza o read model.
- O detalhe por pipeline permanece disponível para auditoria operacional.
