# Discovery operacional de Customer Success no HubSpot

**Status:** concluído como investigação; decisões de produto e implementação
permanecem pendentes.

## Fontes e limites

Foram usados o preflight somente leitura do GSO e o conector HubSpot em buscas
agregadas, propriedades, pipelines e amostras de associações. A diferença entre
os totais externos e snapshots locais pode refletir horário, fonte e recorte.
Não foram lidos ou persistidos registros individuais, nem executadas escritas.

## Universos observados

O total geral retornado foi 10.317 Companies, 2.021 Deals, 52.975 Tickets e
35.025 Contacts. O catálogo geral não deve ser apresentado como carteira CS.

### Alternativas de denominador para Companies

| Sinal candidato | Contagem | Percentual do catálogo Companies | Interpretação |
| --- | ---: | ---: | --- |
| `e_cliente_aftersale_ = Sim` | 264 | 2,56% | marca operacional explícita |
| `status_do_cliente___aftersale = Cliente` | 320 | 3,10% | status de cliente |
| `csm_owner___aftersale` preenchido | 299 | 2,90% | atribuição de CSM |
| `aftersale___mrr > 0` | 251 | 2,43% | sinal financeiro |
| marca Aftersale + CSM preenchido | 99 | 0,96% | interseção mais restritiva observada |
| status Cliente + MRR positivo | 205 | 1,99% | alternativa contratual/financeira |

Nenhum desses denominadores foi escolhido como verdade. Os sinais divergem e
precisam de decisão de domínio.

### Alternativas de Tickets

| Sinal candidato | Contagem | Percentual do catálogo Tickets | Limite |
| --- | ---: | ---: | --- |
| pipeline `Customer Sucess` | 11 | 0,02% | nome tem erro histórico e não prova escopo |
| `area_responsavel = CS` | 33 | 0,06% | pode depender de preenchimento |
| `csm_owner___aftersale` preenchido | 8.855 | 16,71% | inclui tickets fora da carteira |
| `source_type = CHAT` | 19.138 | 36,12% | não prova conversa/thread de CS |
| SLA de fechamento vencido | 5.244 | 9,90% | sinal de operação, não de universo CS |
| pipeline Jornada do Cliente | 298 | 0,56% | candidato de processo, precisa validação |

As buscas de interseção `source_type=CHAT` com os pipelines Suporte B2B e
Customer Success retornaram zero no snapshot; isso reforça que o campo não
deve ser usado sozinho para classificar Chat.

## Propriedades candidatas

Foram identificados candidatos em Companies para cliente, status, owner de CS,
MRR, churn, renovação e sentimento; em Deals para pipeline, etapa, amount,
fechamento, churn e renovação; e em Tickets para pipeline, etapa, prioridade,
origem, responsável, SLA e última avaliação. Exemplos de nomes estão no catálogo
JSON sanitizado. A existência de uma propriedade não valida sua qualidade,
preenchimento ou semântica histórica.

## Atividades e associações

Totais agregados observados: Calls 12.131, Tasks 74.530, Meetings 10.856,
Emails 150.187 e Notes 14.341. A amostra de associação confirmou que o
conector consegue consultar vínculos, mas não é representativa da cobertura
global. Não foram publicados IDs ou payloads da amostra.

## Feedback, conversas e contratos

Há propriedades de última avaliação CSAT/NPS/CES no objeto Ticket, mas os
recursos de Feedback/Survey não estão expostos no conector atual. Há campos de
contrato, renovação, churn e MRR em Companies/Deals, além de um pipeline de
renovação com um registro no snapshot; isso não basta para definir receita
recorrente, retenção ou churn.

Não foi possível provar uma fonte de thread, inbox, mensagem, NPS, CSAT ou CES
com semântica autoritativa neste lote. Navegação autenticada no HubSpot pelo
Chrome não foi executada porque a ferramenta de navegador não estava disponível
no contexto desta tarefa; portanto essa etapa está `NOT_TESTED`.

## Conclusão operacional

O HubSpot pode alimentar um inventário CRM amplo, mas o produto ainda precisa de
um contrato de seleção do universo CS. Antes de redesenhar ou publicar métricas
de CS, o Product Owner deve escolher o denominador, declarar a precedência entre
marca/status/owner/MRR e decidir se Tickets fazem parte da carteira ou apenas da
operação de suporte.
