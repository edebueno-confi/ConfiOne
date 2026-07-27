# Matriz de cobertura de dados executivos — MVP-UX-02

Data de auditoria: 2026-07-27. Escopo: contratos locais, migrations, views e read models do Dashboard. Não foram executadas chamadas novas às APIs externas.

| Área | Fonte | Cobertura confirmada | Estado de uso | Lacuna relevante |
| --- | --- | --- | --- | --- |
| Comercial | `hubspot_deals`, pipelines e stages | deals, valor, pipeline, stage, owner, datas e ganho/perda | Disponível e ingerido | propriedades customizadas e associações completas não fazem parte do contrato atual |
| Customer Success | `vw_cs_customer_portfolio` | clientes ativos, atribuição, carteira e sinais de saúde quando registrados | Parcial, read-only | score de health, renovação, churn e expansão não têm fonte confirmada |
| Suporte | `hubspot_tickets`, pipelines e stages | abertura, estado, prioridade, origem, owner e SLAs monitorados | Disponível e ingerido | conversas, inbox, CSAT/NPS e atividades não estão ingeridos |
| Financeiro | `analytics_finance_receivables` e reconciliação HubSpot | títulos, valores, vencimento, aging, correspondência e alertas | Snapshot disponível | histórico completo, alterações retroativas e previsão dependem de contrato adicional |
| Produto | nenhuma fonte contratada | nenhum indicador | Não configurado | requer fonte operacional validada |
| Desenvolvimento | nenhuma fonte contratada | nenhum indicador | Não configurado | requer fonte operacional validada |

O read model marca estados de frescor, cobertura, vazio, indisponibilidade e zero real. Nenhum número foi fabricado para preencher lacunas.
