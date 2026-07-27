# Contratos de KPI executivo — MVP-UX-02

Cada bloco do Dashboard deve informar valor, significado, temporalidade, fonte, estado da fonte, data de atualização, cobertura e motivo quando indisponível.

| KPI | Temporalidade | Fonte | Regra de honestidade |
| --- | --- | --- | --- |
| Pipeline aberto, receita ganha, ganhos, conversão | Fluxo do período | HubSpot deals | recorte selecionado; zero só é real quando houve registros recebidos |
| Tickets criados, encerrados e prioridade | Fluxo do período | HubSpot tickets | separado de carteira CS; origem e SLA são qualidade complementar |
| Clientes ativos e atribuição CS | Posição atual | carteira CS | não apresentar health score, renovação ou churn sem fonte |
| Saldo vencido e títulos vencidos | Posição atual | snapshot OMIE/planilha | não é alterado pelo filtro temporal de desempenho |
| Produto e Desenvolvimento | Sem fonte | nenhuma | mostrar “Fonte ainda não conectada”, nunca zero ou placeholder numérico |

O estado `zero` representa zero recebido em um recorte com cobertura; `empty` representa ausência de registros no recorte. O contrato é aditivo e preserva o RPC executivo existente.
