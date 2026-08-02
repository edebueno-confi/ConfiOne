# Dashboard Truth V2 — evidência de fontes e denominadores

Data: 2026-08-02 15:10 UTC (ambiente Supabase local)

## Fontes e sincronismo

| Fonte | Execução observada | Estado canônico | Processados | Último sucesso |
| --- | --- | --- | ---: | --- |
| HubSpot | `all`, leitura real concluída | `fresh` | 36.315 | 2026-08-02 14:58:22 UTC |
| OMIE | leitura real tentada, falha | `failed` | 0 | inexistente |

O HubSpot promoveu 36.315 registros, normalizou 36.315 e rejeitou zero. A
tentativa OMIE terminou sem linhas aceitas; a mensagem exibida pelo contrato é
sanitizada. O ciclo completo não foi executado porque o runtime retornou 502
antes de iniciar a orquestração.

As configurações `cs_spreadsheet` e `commercial_spreadsheet` permanecem no
banco para preservar histórico, mas estão desativadas. As fontes publicadas
ativas são somente HubSpot e OMIE.

## Denominadores observados

| Universo | Total observado | Regra/limite |
| --- | ---: | --- |
| Empresas no cache HubSpot | 10.317 | catálogo sincronizado, não carteira CS |
| Deals no recorte comercial | 2.021 | pipelines comerciais configurados |
| Tickets no recorte executivo | 34.294 | pipelines de Suporte/CS configurados |
| Deals ganhos | 358 | estágio HubSpot marcado como ganho |
| Deals perdidos | 496 | estágio fechado não ganho |
| Conversão | 41,92% | 358 / (358 + 496); abertos não entram |
| Títulos OMIE atuais | indisponível | última execução não produziu snapshot válido |

Na inspeção do cache de empresas, 533 possuem `client_status`, 409 possuem
`contract_status`, 242 possuem owner, 10.075 não possuem owner e 251 possuem
MRR numérico positivo. Esses números são diagnóstico de preenchimento, não
medidas de carteira ativa.

## Decisão de Customer Success

O read model agora retorna `unavailable` e a mensagem “Dados de carteira ainda
não consolidados”. O denominador de cliente ativo, health e risco continua
pendente de regra de negócio e read model aprovados. Nenhuma dessas métricas é
tratada como zero.

## Critério de apresentação

- `never_synced`: “Sincronização ainda não realizada”;
- `syncing`: progresso da execução, mantendo o último snapshot válido quando
  existir;
- `fresh`/`stale`/`partial`: sempre acompanhados do último sucesso;
- `failed`: falha distinta de fonte indisponível;
- `unavailable`: contrato ou credencial da fonte não disponível;
- ausência de sucesso OMIE bloqueia valores financeiros no resumo executivo.

## Limitações

Não houve execução read-only bem-sucedida do OMIE, nem ciclo completo. A
validação de Customer Success fecha o problema de denominador na publicação,
mas não cria a regra de carteira. O contrato pgTAP existente não foi alterado
neste lote.
