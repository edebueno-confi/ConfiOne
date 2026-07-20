# Fontes financeiras e importacao CS Ops — 2026-07-19

## Importacao CS Ops

A importacao controlada nao altera empresas HubSpot. Ela recebe o XLSX/CSV,
calcula o hash do arquivo, identifica a aba `BD_Clientes`, le os cabecalhos da
linha operacional, normaliza cada linha e grava o resultado em:

- `analytics_spreadsheet_import_runs`: lote, arquivo, hash, versao e contagens;
- `analytics_spreadsheet_rows`: staging auditavel, payload original e motivo
  de rejeicao.

Esses dados alimentam o proximo passo de migracao controlada para empresas
HubSpot. A migracao e separada, exige simulacao/aprovacao e grava ledger por
linha; portanto, apenas importar a planilha nao cria nem atualiza empresa.

O erro HTTP 546 foi reproduzido com o arquivo real. O parser `xlsx` carregava
todas as abas e atingia simultaneamente os limites de CPU e memoria do Edge
Runtime. O importador agora usa um parser XML enxuto, lendo somente a aba
`BD_Clientes`; CSV continua suportado.

## Financeiro: planilha e API OMIE

Enquanto a chave nao estiver configurada, a fonte efetiva continua sendo o
XLSX exportado do OMIE. O historico permanece no read model
`analytics_finance_receivables` e nao e apagado por novos lotes.

Quando a chave for cadastrada em Configuracoes > Integracoes, a funcao
`omie-sync` consultara `ListarContasReceber`, persistira a resposta normalizada
com `source_key = omie_receivables_api` e registrara a execucao em
`analytics_finance_sync_runs`. O dashboard exibira a mesma base de KPIs e
reconciliacao, agora com frescor e origem da API.

Metricas preparadas para a API, quando os campos estiverem presentes no
retorno: saldo vencido, recebido, a vencer, aging, previsao de recebimento,
categoria/origem do titulo, status, cliente, documento e datas de vencimento,
emissao e pagamento. Ausencia de campo permanece indisponivel; nenhum valor e
fabricado.

## Fallback visivel

A tela Financeiro informa separadamente:

- API OMIE: configurada, aguardando chave ou com ultima sincronizacao;
- planilha OMIE: disponivel e data da ultima carga;
- metricas que a API podera acrescentar.

O botao de sincronizacao da API fica desabilitado enquanto a credencial nao
existir no Vault.
