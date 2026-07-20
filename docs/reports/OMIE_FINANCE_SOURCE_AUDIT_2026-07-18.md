# Auditoria da fonte financeira Omie — 2026-07-18

## Resultado executivo

O checkout `C:\Projetos\GSO-old` não possui integração Omie implementada.
Não foram encontrados adapter, endpoint, migration, função Edge, variável de
ambiente ou cliente HTTP relacionado ao Omie/contas a receber.

A integração direta é tecnicamente viável. A documentação oficial do Omie
lista serviços financeiros para Contas a Receber, Contas a Pagar, Extrato,
Fluxo de Caixa, Resumo e Pesquisa de Títulos. A autenticação usa App Key e
App Secret fornecidos por um usuário administrador do Omie.

## Fonte recebida

- Arquivo: `financas_554753004352157 (1).xlsx`
- Aba: `financas`
- Origem declarada: exportação do Omie
- Relatório: `SEND4 - Finanças - Contas a Receber`
- Emissão do relatório: 22/06/2026 15:24
- Linhas de dados: 3.077
- Colunas: 13

## Perfil observado

| Situação | Linhas | Valor líquido (R$) | Valor recebido (R$) |
|---|---:|---:|---:|
| Recebido | 2.103 | 2.544.845,72 | 2.545.710,20 |
| Vence hoje (boleto gerado) | 221 | 121.432,31 | 0,00 |
| Atrasado | 332 | 212.044,80 | 0,00 |
| A vencer (boleto gerado) | 91 | 226.525,03 | 0,00 |
| Recebido (cancelado) | 1 | 280,00 | 280,00 |
| Cancelado | 50 | 752.693,48 | 0,00 |
| Atrasado (boleto gerado) | 278 | 138.613,93 | 0,00 |
| Recebido Parcialmente | 1 | 657,52 | 350,00 |

Totais brutos do arquivo: R$ 3.997.092,79 em valor líquido e R$ 2.546.340,20
recebidos. Há 974 linhas que não estão com a situação exatamente `Recebido`;
isso não deve ser convertido diretamente em inadimplência sem uma regra de
negócio que trate cancelamentos, recebimento parcial e boletos gerados.

Períodos observados:

- Emissão: 05/12/2025 a 18/06/2026.
- Vencimento: 20/01/2025 a 10/09/2026.
- `Último Recebimento` ausente em 972 linhas.
- `Data de Emissão` ausente em 548 linhas.
- `Observação` ausente em 2.517 linhas.
- Todas as linhas estão marcadas como `Considerada` na coluna de fluxo.

## Contrato preliminar para o dashboard

O primeiro recorte financeiro deve ser um read model de contas a receber,
com provenance e data de atualização, contendo no mínimo:

- status financeiro original do Omie;
- valor líquido, valor recebido e saldo calculado;
- vencimento e classificação de aging;
- cliente por CNPJ/CPF e nome;
- número do documento;
- flag de cancelamento, recebido parcial e boleto gerado;
- fonte, janela do relatório, hash do arquivo ou execução da API.

O saldo, inadimplência e aging devem ser calculados no backend. O frontend não
deve inferir que todo status diferente de `Recebido` é inadimplência.

## Próximo ciclo recomendado

1. Confirmar com o Financeiro se a API Omie pode ser habilitada e qual
   aplicativo/empresa deve ser usado.
2. Receber App Key e App Secret por canal seguro; nunca versionar ou inserir
   as chaves no frontend.
3. Implementar primeiro uma consulta read-only de `Contas a Receber`, com
   paginação, idempotência, logs de execução e reconciliação contra este XLSX.
4. Manter o XLSX como fallback controlado até a API passar a reconciliação.
5. Só depois ampliar para Contas a Pagar, Fluxo de Caixa e DRE/Resumo.

## Evidências externas

- Portal oficial de serviços: https://developer.omie.com.br/service-list/
- Consulta de informações via API: https://ajuda.omie.com.br/pt-BR/articles/8250117-listando-as-informacoes-via-api
- Credenciais de integração: https://ajuda.omie.com.br/pt-BR/articles/499061-obtendo-a-chave-de-acesso-para-integracoes-de-api
- Contas a Receber via API: https://ajuda.omie.com.br/pt-BR/articles/8250002-cadastrando-uma-conta-a-receber-via-api

## Limites desta auditoria

Nenhuma chamada autenticada ao Omie foi feita, pois não há credenciais
disponibilizadas e a solicitação atual era verificar a existência e a
viabilidade da integração. Nenhum dado financeiro foi enviado para serviço
externo.
