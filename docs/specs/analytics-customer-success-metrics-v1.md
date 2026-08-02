# Especificação — Métricas de Customer Success V1

Status: discovery; contrato de CS ainda não publicado para a aba própria.

## Decisão atual

`/admin/analytics` não deve tratar o bloco `customerSuccess` do snapshot
executivo como um read model operacional de CS. A aba própria exibe
“Indicadores de Customer Success ainda não configurados” e não reutiliza tickets
nem tenta estimar health score.

## Métricas desejadas

| Métrica | Fonte necessária | Definição exigida | Estado |
|---|---|---|---|
| clientes ativos | HubSpot Companies + regra de carteira | status ativo no recorte e tenant | não publicado |
| cobertura de responsável | Companies + owners | empresas ativas com CSM resolvido / ativas | não publicado |
| health score | propriedade/serviço de health governado | score, componentes, versão e data de cálculo | indisponível |
| clientes em risco | health score + limiar versionado | risco derivado de score, não de texto livre | indisponível |
| renovação | Deals/objeto de renovação | janela, etapa e valor definidos | não publicado |
| expansão/contração | Deals ou objeto financeiro | evento e atribuição temporal definidos | não publicado |
| onboarding | objeto/processo próprio | etapa, aging e responsável | não publicado |

## Requisitos do contrato futuro

- read model ou RPC próprio, com tenant, RLS, permissão e auditoria;
- `observed_at`, `effective_at`, `source_system`, `quality_status` e versão do
  cálculo;
- estados `not_configured`, `partial`, `stale`, `empty`, `fresh` e `error`;
- separação entre carteira, suporte/tickets, comercial e financeiro;
- explicação do denominador em toda taxa e do período em toda série;
- nenhuma regra de risco criada no React.

## Critério de aceite

A aba somente deixa o estado indisponível quando a origem, a regra e a
permissão ainda não estiverem publicadas. A Visão Geral pode continuar exibindo
seu contrato executivo existente, sem promovê-lo a contrato operacional de CS.
