# Pipelines de CS criados no HubSpot — 2026-07-19

## Escopo

Portal HubSpot `20108050`. Esta rodada criou apenas a estrutura de operação de
Customer Success solicitada. Tickets e pipelines de Suporte existentes ficaram
fora da alteração.

## Pipelines criados

| Pipeline | ID HubSpot | Estágios configurados |
|---|---:|---|
| CS \| Onboarding e Migração | `917379333` | A iniciar; Diagnóstico; Plano definido; Concluído; Em execução; Aguardando cliente; Bloqueado; Cancelado |
| CS \| Gestão de Carteira | `918901665` | Monitoramento; Contato programado; Plano de ação; Concluído; Em risco; Recuperação |

## Validação

- A tela de configuração do HubSpot confirmou sucesso ao salvar os dois
  pipelines.
- Os dois pipelines foram reabertos/consultados após a gravação e os nomes e
  estágios foram encontrados na configuração.
- Os pipelines atuais de Suporte continuaram presentes na listagem, incluindo
  `Criadouro de Tíquetes | Aftersale`, `Confi | Whatsapp`, `Suporte B2B | Confi`,
  `Fale conosco | Confi` e `Atendimento | Confi Analytics`.

## Limites desta rodada

- Nenhuma empresa, deal, ticket ou proprietário foi movido.
- Nenhuma propriedade nova foi criada.
- A criação dos pipelines não substitui a fila de migração da planilha nem o
  seed da carteira local; esses são os próximos ciclos e devem manter
  procedência e auditoria.
