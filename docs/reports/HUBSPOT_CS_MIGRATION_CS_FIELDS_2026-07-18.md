# Migração CS Ops - campos de CS no HubSpot - 2026-07-18

## Escopo

Esta rodada migrou somente dados de CS da aba `BD_Clientes`. O atendimento de
Suporte e os Tickets permaneceram fora da carga e nenhum pipeline existente de
Suporte foi alterado.

## Fonte e regra de precedência

- Fonte: planilha `CS Ops | Carteiras e Clusters -v2`, aba `BD_Clientes`.
- A planilha prevalece em conflito de valor quando a identidade da empresa é
  segura.
- A identidade foi resolvida por nome exato; quando havia mais de um candidato,
  foi usado `Hubspot_ID` ou CNPJ para desempate.
- Duplicidade de linhas com valores conflitantes ficou fora da escrita.

## Resultado

| Item | Quantidade |
|---|---:|
| Linhas lidas | 606 |
| Nomes únicos | 597 |
| Empresas HubSpot correspondidas | 398 resultados de busca |
| Empresas selecionadas sem ambiguidade | 218 |
| Empresas com atualização necessária | 216 |
| Lotes executados | 22 |
| Falhas | 0 |
| Exceções mantidas fora da escrita | 29 |

## Campos aplicados

- `Valor_MRR` -> `aftersale___mrr`.
- `CNPJ` -> `cnpj`, normalizado para dígitos.
- `Tipo_MRR` -> `tipo_de_mrr`, somente para `Minimo`, `Mensalidade` ou
  `Anual`, que são opções existentes no HubSpot.
- `Status_Contrato` -> `status_do_cliente___aftersale` somente quando a
  semântica era inequívoca: `Ativo` -> `Cliente` e texto contendo churn ->
  `Churn`.
- `Responsavel_Final` -> `cs_owner___aftersale`, usando os owners existentes.

Cluster, carteira, health/farol, frequência e status de migração foram
identificados na planilha, mas não foram gravados porque não havia propriedade
HubSpot equivalente confirmada nesta rodada.

## Suporte

Tickets, pipeline de atendimento e propriedades operacionais de Suporte não
foram escritos. A criação dos pipelines de CS permanece pendente de acesso
administrativo à configuração de pipelines, e deve ocorrer separadamente do
pipeline usado pela equipe de Suporte.
