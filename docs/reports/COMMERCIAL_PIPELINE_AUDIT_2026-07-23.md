# Auditoria do recorte Comercial — 2026-07-23

## Resultado executivo

O Dashboard Comercial estava limitado ao pipeline configurado `892833861`
(Piloto Aftersale). A leitura do portal HubSpot `20108050` mostrou atividade
relevante também em `727372071` (Pipe de Vendas) e uma ocorrência em
`10888352` (Renovação Contratual). Por isso, o recorte não deve depender de um
único pipeline fixo.

## Evidência observada no HubSpot

Os dados foram consultados em modo somente leitura, sem criação, alteração ou
exclusão no HubSpot.

| Pipeline | ID | Negócios observados | Evidência recente |
|---|---:|---:|---|
| Piloto Aftersale | `892833861` | 1.150 | AFTERSALE - Gregory Modas; Agendamento site - VYTA LTDA |
| Pipe de Vendas | `727372071` | 865 | Kabum Neotrust; Softys Falcon |
| Renovação Contratual | `10888352` | 1 | Zaxy \| Grendene |

Também foram encontrados pipelines disponíveis sem negócios no recorte atual:
Aquisição, Expansão - Retração, Pré-POC, Retenção de Churn, Hunting -
Parcerias MKT, Carteira CS, Black Friday - Hora Hora e Gerenciamento
Faturamento. O status `arquivado` deve ser confirmado pela sincronização do
catálogo; a busca de negócios, isoladamente, só comprova presença ou ausência
de registros.

## Implementação realizada

- `hubspot-sync` agora consulta o catálogo de pipelines de Deals e Tickets.
- Pipelines não arquivados descobertos são registrados localmente como fontes
  inativas, sem substituir alias ou estado já escolhido por um administrador.
- O Dashboard Comercial passou a carregar os pipelines comerciais ativos e
  permite excluir temporariamente pipelines do recorte sem alterar a
  configuração persistida.
- O snapshot comercial ganhou agregação `by_pipeline` e o filtro é aplicado no
  Postgres, antes da agregação de KPIs, funil, responsáveis e tendência.
- O contrato antigo de quatro argumentos permanece disponível para consumidores
  legados.
- O catálogo inicial do portal foi semeado localmente para permitir navegação
  antes do primeiro sync. Novos ambientes devem usar a descoberta dinâmica.

## Como usar

1. Execute uma sincronização HubSpot concluída para atualizar o catálogo oficial
   e os estágios dos pipelines selecionados.
2. Em `Dashboard Gerencial > Configuração > Fontes de dados`, revise cada
   pipeline comercial descoberto.
3. Ative somente os pipelines que devem compor o painel e defina alias interno
   quando necessário. O nome original do HubSpot permanece preservado.
4. Na aba `Comercial`, use o bloco `Pipelines incluídos no recorte` para uma
   análise temporária. O filtro não altera a configuração salva.

## Limites e próximo passo

- A ativação de pipeline é uma decisão administrativa; nenhum pipeline novo foi
  ativado automaticamente além do recorte já existente.
- O sincronizador ainda mantém Deals em carga completa por pipeline, conforme o
  contrato atual; a próxima otimização deve avaliar uma fronteira incremental
  suportada pelo objeto Deals sem perder alterações de etapa/valor.
- Depois de uma sincronização autenticada com o catálogo atualizado, validar
  os KPIs com `Piloto Aftersale + Pipe de Vendas` e comparar o resultado com a
  visão nativa do HubSpot.
