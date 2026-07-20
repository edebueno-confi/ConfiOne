# Relatorio de ambiguidades HubSpot x OMIE - 2026-07-18

## Objetivo e escopo

Auditar as correspondencias entre os titulos do read model financeiro e as
empresas armazenadas no cache HubSpot, para decidir se a unificacao de empresas
e segura. Nenhuma empresa foi unificada ou alterada nesta auditoria.

Fontes auditadas localmente:

- `analytics_finance_receivables`: 3.077 titulos.
- `hubspot_companies`: 10.162 empresas sincronizadas.
- Chaves analisadas: CNPJ normalizado e nome normalizado.

## Resultado executivo

| Indicador | Resultado |
| --- | ---: |
| Titulos com correspondencia | 2.860 |
| Titulos sem correspondencia | 217 |
| Titulos com mais de uma empresa candidata | 247 |
| Titulos ambiguos atrasados | 27 |
| Saldo atrasado dentro das ambiguidades | R$ 14.881,64 |
| Grupos de empresas com CNPJ repetido | 107 |
| Empresas dentro desses grupos | 274 |
| Grupos com nome repetido/normalizado | 393 |
| Empresas dentro desses grupos | 814 |

## O que a evidencia mostra

A ambiguidade nao significa automaticamente duplicidade. O mesmo CNPJ aparece
associado a empresas HubSpot com nomes e dominios diferentes. Exemplos
encontrados:

- CNPJ `49.669.856/0001-43`: `Restoque Varejo`, `Le Lis Blanc`,
  `Restoque Atacado` e `fabricadedoces.com` foram candidatos para titulos da
  Restoque.
- CNPJ `02.314.041/0021-21`: `IGUASPORT LTDA` e `Decathlon`.
- CNPJ `00.422.351/0006-03`: duas empresas com nome `SAWARY CONFECCOES LTDA`.
- CNPJ `32.847.611/0001-66`: `Dezoitok Joias` e uma empresa sem nome.

Tambem ha repeticoes de nome que podem ser filiais, registros historicos,
contas de teste ou entidades diferentes. Exemplos: `Confi` aparece seis vezes,
`Facebook` quatro vezes e `Instagram` quatro vezes, em dominios diferentes.

## Classificacao de risco

### Alta, nao unificar automaticamente

- CNPJ igual e nome/dominio diferentes.
- Mais de um registro com contrato vigente ou com CSM diferente.
- Titulo financeiro atrasado atingido por mais de uma empresa candidata.
- CNPJ com formato suspeito, como zeros ou base possivelmente compartilhada.

### Media, revisar por lote

- Mesmo nome normalizado, mas apenas um registro possui dominio ou CNPJ.
- Um registro tem contrato/CSM e o outro esta sem esses dados.
- Duplicidade produzida por importacao historica, sem titulos financeiros ativos.

### Baixa, possivel limpeza posterior

- Mesmo nome, mesmo dominio, mesmo CNPJ e mesmos dados operacionais.
- Registro vazio ou sem atividade, sem contrato, sem CSM e sem titulos.

## Recomendacao

Nao recomendo executar uma unificacao em massa agora. A decisao segura e criar
uma fila de revisao por grupo, com um registro mestre escolhido por evidencias:

1. Confirmar a entidade legal pelo CNPJ e dominio.
2. Preservar como mestre o registro com contrato vigente, CSM e historico
   operacional mais completo.
3. Copiar campos faltantes para o mestre somente depois da confirmacao.
4. Associar os titulos financeiros e demais objetos ao mestre.
5. Arquivar o duplicado somente apos verificar tickets, deals, contatos,
   atividades e associações.
6. Guardar um mapa `empresa_origem -> empresa_mestre` para auditoria e rollback
   logico.

Unificar empresas com CNPJ igual mas nomes diferentes sem confirmação pode
misturar grupos econômicos, filiais, marcas ou cadastros contaminados. Isso
afetaria CS, cobrança, tickets e atribuição de CSM.

## Próxima decisão solicitada

O próximo lote pode gerar uma fila operacional priorizada com os 27 títulos
atrasados ambíguos e seus candidatos HubSpot, para decisão humana. Depois da
aprovação de cada grupo, a operação de unificação pode ser executada de forma
controlada e auditável.

## Evidencia reproduzivel

- `scripts/analytics/ambiguity-audit.sql`
- `scripts/analytics/hubspot-duplicate-groups.sql`
- `scripts/analytics/hubspot-duplicate-summary.sql`
- Consulta executada com `npx supabase db query --local` em 18/07/2026.

## Acesso operacional no dashboard

A Visao Executiva agora possui a visualizacao `Somente ambiguos (27)`. Ela
consulta o RPC read-only `rpc_analytics_ceo_ambiguous_overdue`, preserva cada
titulo individualmente e exibe todas as empresas candidatas. Cada candidata
possui link direto para o registro de empresa no portal HubSpot `20108050`.

O link serve para investigacao. Ele nao executa unificacao, arquivamento,
alteracao de propriedade ou associacao automaticamente.
