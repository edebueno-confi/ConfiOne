# Importação CS Ops — implementação 2026-07-19

## Entrega

Foi habilitada a fonte `cs_ops_consolidated` no Edge Function existente
`analytics-spreadsheet-import`, sem criar um segundo caminho de ingestão.

- a aba `BD_Clientes` é localizada pelo nome, mesmo com acentos ou variação de
  maiúsculas;
- o cabeçalho é detectado pela presença de `Cliente_ID` e `Nome_Plataforma`,
  evitando depender de uma posição fixa quando a exportação muda;
- as linhas operacionais são gravadas em `analytics_spreadsheet_rows` como
  staging bruto sanitizado;
- CNPJ e HubSpot ID recebem versões normalizadas para reconciliação posterior;
- linhas sem identificador, nome ou razão social são rejeitadas explicitamente;
- o hash do arquivo e a versão do mapeamento mantêm a importação idempotente;
- requisições que não sejam `multipart/form-data` retornam 400, sem virar erro
  interno 500;
- CSV exportado como `Sheet1` é aceito somente se o conteúdo comprovar os
  cabeçalhos CS Ops; arquivos de outra origem são rejeitados sem mutação;
- nenhuma empresa, ticket ou propriedade do HubSpot é escrita nesta etapa.

## Uso

Na aba `Configuração` do Dashboard Gerencial, em `Importação controlada da
planilha CS Ops`, selecione um XLSX/CSV exportado da planilha e envie o lote.
O arquivo deve conter a aba `BD_Clientes` ou, no caso de CSV, o cabeçalho dessa
aba.

## Qualidade

O mapper foi separado em `supabase/functions/_shared/cs-ops.ts` e coberto por
testes de normalização de cabeçalho, identidade, CNPJ, HubSpot ID e rejeição de
linha sem identidade.

## Limite intencional

O lote apenas recebe e registra a fonte. A atualização/criação no HubSpot será
um segundo comando, com seleção de matches únicos, confirmação, auditoria por
linha e retry; isso impede que um upload acidental execute escrita em massa.

## Diagnóstico corrigido

O erro reproduzido era um HTTP 500 quando o cliente enviava JSON para uma rota
que exigia multipart. A função agora responde 400 com orientação explícita. O
runtime local foi iniciado e respondeu nos testes autorizados; um XLSX válido
sem a aba CS retornou 422 específico, confirmando que o parser foi alcançado.
