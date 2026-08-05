# Inventário de pipelines HubSpot — discovery somente leitura

## Resumo

O preflight do GSO encontrou 35 pipelines não arquivados: 11 de Deals e 24 de
Tickets. Não foram retornados pipelines arquivados. O catálogo local contém
35/35 definições live e mantém duas entradas adicionais de QA. O inventário
abaixo registra contagens agregadas; não classifica automaticamente os domínios.

## Deals

| Pipeline | Registros |
| --- | ---: |
| Aquisição | Aftersale | 0 |
| Expansão - Retração | Aftersale | 0 |
| Pré-POC | Aftersale | 0 |
| Retenção de Churn | Aftersale | 0 |
| Hunting - Parcerias MKT | Aftersale | 0 |
| Carteira CS | 0 |
| Renovação Contratual | 1 |
| Pipe de Vendas | 865 |
| Black Friday - Hora Hora | 0 |
| Gerenciamento Faturamento | 0 |
| Piloto Aftersale | 1.155 |

## Tickets

| Pipeline | Registros |
| --- | ---: |
| Onboarding - B2B | Confi | 503 |
| Suporte B2B | Confi | 860 |
| Suporte B2C | Confi | 7.856 |
| Fale conosco | Confi | 2.681 |
| CS | Neotrust | 748 |
| Segurança da Informação | 1.449 |
| Service Desk | 2.546 |
| Onboarding Trocas e Devoluções | Aftersale | 441 |
| Onboarding Jornada de Entrega | Aftersale | 40 |
| Criadouro de Tíquetes | Aftersale | 27.701 |
| Bug | Aftersale | 1.301 |
| Tarefas manuais | Aftersale | 2.973 |
| Aftersale - Processo Atendimento Samsung | 12 |
| User Stories | Aftersale | 959 |
| POC | Aftersale | 26 |
| Backoffice | 209 |
| Jornada do Cliente | 298 |
| Customer Sucess | 11 |
| CS | Onboarding e Migração | 0 |
| Demanda de clientes novos | 49 |
| CS | Gestão de Carteira | 0 |
| Retenção Churn | 2 |
| Atendimento | Confi Analytics | 8 |
| Confi | Whatsapp | 2.296 |

## Limitações

Os objetos têm opções de stage no schema, porém o conector usado neste lote não
entregou um mapeamento auditado de cada stage por pipeline, nem um total
confiável de owners. Por isso stages, arquivamento histórico e SLA por pipeline
estão `AVAILABLE_WITH_LIMITATIONS`/`NOT_TESTED`. A existência de “CS”,
“Aftersale”, “Suporte” ou “Whatsapp” no nome não cria classificação de negócio.

O próximo passo, após decisão do PO, é construir um catálogo configurável e
auditável por área, preservando todos os pipelines carregados e permitindo que a
seleção seja explícita.
