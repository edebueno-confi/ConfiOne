# Ciclo Financeiro Analytics — 2026-07-18

## Entrega

Foi criado o read model `analytics_finance_receivables` para Contas a Receber,
preservando a situação original do Omie, valores líquido/recebido/saldo,
cliente, documento, vencimento, emissão, aging, cancelamento, recebimento
parcial e provenance da importação.

O RPC `rpc_analytics_finance_snapshot` calcula no backend KPIs, distribuição
por situação, aging e tendência mensal. A rota `/admin/analytics` ganhou a área
Financeiro com filtros por período, situação, aging e cliente.

## Fonte carregada

- Arquivo: `financas_554753004352157 (1).xlsx`
- Origem declarada: exportação Omie — Contas a Receber
- Registros carregados: 3.077
- Valor líquido: R$ 3.997.092,79
- Saldo calculado: R$ 1.455.040,79
- Execução registrada em `analytics_spreadsheet_import_runs`, com hash do arquivo.

## Validação

- Snapshot autenticado sem filtro: 3.077 títulos, 610 atrasados, saldo de R$ 1.455.040,79.
- Snapshot autenticado com situação `Atrasado`: 332 títulos.
- RLS, grants e `search_path` cobertos pelo teste pgTAP 054.
- Nenhuma credencial Omie foi usada; a API continua preparada como fonte read-only futura.

## Pendências

- Validar reconciliação entre a API Omie e a exportação quando App Key/App Secret forem disponibilizados.
- Definir regra oficial de inadimplência com o Financeiro; o painel mantém cancelados e recebimentos parciais separados.
