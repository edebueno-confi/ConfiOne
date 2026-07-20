# Revisao da fila de reconciliacao por cliente — 2026-07-19

## Diagnostico do caso Restoque

O caso exibido nao e uma duplicacao tecnica da importacao. Existem tres titulos
financeiros distintos no read model:

| Titulo | Saldo | Vencimento | Registro de origem |
| --- | ---: | --- | --- |
| 3898 | R$ 7.000,00 | 20/06/2026 | 2361 |
| 3899 | R$ 7.000,00 | 20/06/2026 | 2360 |
| 3900 | R$ 7.000,00 | 20/06/2026 | 2362 |

Cada linha preserva o documento, o saldo e a origem para auditoria. O mesmo
CNPJ `49.669.856/0001-43` encontra tres empresas no cache HubSpot:

- Restoque Atacado — `35396127929`;
- Le Lis Blanc — `54489440359`;
- fabricadedoces.com — `9169451935`.

Por isso cada titulo recebe a mesma classificacao `ambigua` e os mesmos tres
candidatos. A fila esta correta para reconciliacao por titulo, mas inadequada
para a leitura executiva por cliente.

## Melhoria recomendada

Manter duas camadas na mesma tela:

1. **Resumo por cliente** como visao padrao: agrupar por CNPJ normalizado e
   conjunto de candidatos, exibindo quantidade de titulos, saldo total, maior
   atraso, vencimento mais antigo e quantidade de candidatas.
2. **Detalhes por titulo** recolhidos: documentos, datas, valores e origem,
   preservando a auditoria e permitindo conferir cada linha.

O saldo deve permanecer no detalhe e no total agregado, porque ajuda a
priorizar o risco financeiro; ele nao deve ocupar uma coluna repetida em cada
linha quando a decisão e sobre a empresa. A ação de unificação deve existir
somente no resumo do cliente, exigindo escolha do mestre e mantendo o link dos
candidatos.

Essa alteração não deve unificar automaticamente as três empresas: o CNPJ
compartilhado pode representar marcas, cadastros legados ou um erro de base.
Primeiro é necessário confirmar a empresa mestre; depois a operação atual de
merge auditado pode ser reutilizada.

## Implementacao do ciclo

Em 19/07/2026 foi criada a RPC `rpc_analytics_ceo_reconciliation_quality_grouped`
e a tela passou a consumi-la. O agrupamento usa CNPJ normalizado quando
disponivel e nome normalizado como fallback; o resumo exibe um registro por
cliente, saldo total, quantidade de titulos, intervalo de vencimentos e
candidatas no HubSpot. Os titulos ficam dentro de `titles` e podem ser
expandidos para auditoria. A acao de merge continua disponivel apenas para
grupos ambiguos e exige escolha explicita do mestre.

Validacao local: para Restoque, o endpoint retornou 1 cliente, 7 titulos,
R$ 35.000,00 e 3 candidatas. Typecheck, build e lint do banco passaram.

## Resolucao de grupo economico

O cache local do HubSpot nao trazia a associacao matriz/filial, portanto a
repeticao do CNPJ nao pode ser interpretada automaticamente como hierarquia.
Foi criada a tabela auditavel `analytics_company_group_resolution`, com regra
explicita por CNPJ, justificativa, empresa mestre e membros conhecidos.

O caso informado foi registrado como `Grupo Restoque`, com Restoque Atacado
como matriz e Le Lis Blanc entre as empresas do grupo. A fila agora mostra
`Grupo econômico`, marca a matriz, conserva os links das empresas e desabilita
merge para esse grupo. A ambiguidade só continua sendo exibida quando não há
resolução humana registrada.

Validação adicional: o snapshot executivo voltou a responder em cerca de 1
segundo localmente, retornando 7 títulos resolvidos, 89 ambiguidades reais e
214 títulos sem correspondência. O timeout observado durante a implementação
foi eliminado separando os joins indexáveis de CNPJ, nome e grupo econômico.
