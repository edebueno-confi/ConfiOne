# Catálogo de métricas do Analytics V1

> **Status histórico:** as planilhas e amostras abaixo documentam a auditoria e
> a migração anteriores ao corte. Elas não são fonte, fallback, contingência ou
> consumidor ativo do Dashboard publicado em 2026-08-02. O contrato corrente
> está em `docs/reports/2026-08-02_dashboard-delta-final.md`.

Status: Ciclo A0 iniciado em 2026-07-17. Este documento descreve o contrato
observado antes da inclusão de planilhas; não declara dados disponíveis que
ainda não foram ingeridos.

## Fontes de planilha observadas — 2026-07-18

### CS Ops | Carteiras e Clusters -v2

Fonte: [planilha CS](https://docs.google.com/spreadsheets/d/1qdn81NNFQoWLwIHHx8Q3sJMtv2ReUsYI0R-cnu6_65I/edit?gid=166975768#gid=166975768)

- 17 abas visíveis de operação/configuração e uma aba `Dash_Data` oculta.
- Read models úteis: `Dashboard_CS`, `BD_Clientes`, `Clusters`,
  `Contato_Inicial_CS` e `Dash_Data`.
- Amostra observada: 593 clientes ativos, MRR ativo de R$ 461.032,48,
  MRR com CSM de R$ 454.472,88, cobertura de 99% e 188 clientes em risco vermelho.
- Chaves candidatas: `Cliente_ID`, `Hubspot_ID`, cliente, `MRR_Mensal`, cluster,
  carteira, responsável, health, prioridade, contato inicial e projetos.
- `BD_Clientes` deve ser tratado como fonte operacional editável; o dashboard
  consolidado não deve ser ingerido como registro bruto.

### Controle de tarefas diárias — Comercial Aftersale

Fonte: [planilha Comercial](https://docs.google.com/spreadsheets/d/189Y5Wio50Bows1FmJIzoFb2TCyiXf6uQWJT0WobzLYQ/edit?gid=1064484662#gid=1064484662)

- 44 abas diárias observadas, com datas em formatos diferentes, espaços à
  esquerda em alguns nomes e duas abas não operacionais (`Página18`).
- As abas recentes variam a quantidade de colunas e o vocabulário: `Leads
  Minerados`, `Conexões Linkedin`, `E-mails Enviados`, `Msg Enviaddas`,
  `Ligações`, `FUP`, `Reuniões Agendadas`, `Demos Realizadas`, `Propostas
  Enviadas`, `Hubspot` e `Agendas Extra Comercial`.
- A ingestão deve descobrir abas e normalizar linhas chave/valor, preservando
  `sheet_name`, data operacional, responsável, métrica, valor bruto, observação
  e versão do mapeamento. Não é seguro depender de uma aba fixa ou de posição
  fixa de coluna.

### Decisão de produto para o A1

- Não será criada uma aba diária nova no produto.
- O importador deve varrer abas elegíveis, normalizar datas e nomes de métricas,
  registrar a aba de origem e produzir um fato diário idempotente.
- Abas consolidadas de CS e métricas de atividade comercial serão fontes
  distintas, com reconciliação explícita quando `Hubspot_ID`/cliente permitirem.
- Valores ausentes, cabeçalhos inesperados e abas incompatíveis devem aparecer
  como `partial`/`rejected`, nunca ser preenchidos por inferência silenciosa.

O parser inicial foi materializado em
`scripts/analytics/commercial-daily-sheet-parser.mjs`. Ele aceita as linhas
extraídas das abas, normaliza aliases (inclusive `Msg Enviaddas`), converte
datas `dd/MM/yy` e `dd/MM/yyyy`, rejeita valores inválidos e gera chaves
idempotentes por planilha/aba/linha. O teste está em
`tests/scripts/commercial-daily-sheet-parser.test.mjs`.

## Brief do painel

- Público inicial: gestores e administradores internos autorizados.
- Superfície: `/admin/analytics` dentro do Genius Support OS.
- Perguntas principais: qual é o volume, o valor, o movimento, a distribuição
  e o risco operacional de Comercial e CS/Suporte?
- Fontes atuais: HubSpot sincronizado server-side.
- Fonte futura do Ciclo A1: CSV/XLSX importado de forma controlada.
- Timezone operacional padrão: ainda precisa ser confirmado; até lá, views
  devem preservar timestamps UTC e a UI deve indicar a convenção adotada.
- Janela padrão atual: todo o histórico disponível na fonte. Filtros temporais
  e comparação entre períodos são evolução do painel, não estão implementados
  no contrato V1 atual.

## Regras de confiança

1. Nenhum número é preenchido por mock ou fallback inventado.
2. A ausência de fonte, estágio, owner ou período aparece como indisponível ou
   é excluída com caveat documentado.
3. O estado de deals e tickets vem dos metadados dos estágios sincronizados,
   não do rótulo visível.
4. A agregação ocorre no Postgres; a UI apenas mapeia e formata.
5. Cada futura fonte deve preservar sistema de origem, id externo, versão/hash,
   instante de ingestão, data de referência e qualidade da linha.

## Comercial — fonte HubSpot Deals

| Métrica | Read model atual | Definição observada | Grão | Estado |
|---|---|---|---|---|
| Deals totais | `vw_analytics_commercial_kpis.total_deals` | Contagem de deals no pipeline comercial ativo | deal | disponível após sync |
| Deals abertos | `open_deals` | Deals cujo estágio não está fechado | deal | disponível após stages |
| Deals ganhos | `won_deals` | Deals em estágio marcado `is_won` | deal | disponível após stages |
| Deals perdidos | `lost_deals` | Deals fechados e não ganhos | deal | disponível após stages |
| Receita ganha | `won_revenue` | Soma de `amount_in_home_currency` nos ganhos | deal | depende de valor/currency confiável |
| Conversão | `conversion_rate` | Ganhos / deals fechados | deal fechado | disponível; equivalente a ganho/(ganho+perdido) se estados forem completos |
| Ticket médio | `avg_ticket` | Receita ganha / deals ganhos | deal ganho | disponível; não é média de todos os deals |
| Funil por estágio | `vw_analytics_commercial_funnel` | Contagem e receita por estágio, inclusive estágio vazio | estágio | disponível após stages |
| Deals por responsável | `vw_analytics_commercial_by_owner` | Deals, ganhos e receita por `owner_id` resolvido | owner | disponível; owner ausente vira “Sem responsável” |
| Tendência de criação/ganho | `vw_analytics_commercial_monthly` | Deals criados por mês; ganhos agrupados pelo mês de criação | deal/mês | disponível; não representa mês de fechamento |

### Caveats comerciais

- A view atual usa o pipeline ativo configurado em `analytics_source_config`.
- Receita é tratada como valor doméstico do HubSpot; a moeda e a política
  financeira precisam ser exibidas quando a planilha entrar.
- Deals ganhos na tendência mensal são atribuídos ao mês de criação, conforme
  a view atual. Uma tendência por mês de fechamento será métrica distinta.
- Campos customizados vazios no portal HubSpot permanecem fora da V1.

## CS/Suporte — fonte HubSpot Tickets

| Métrica | Read model atual | Definição observada | Grão | Estado |
|---|---|---|---|---|
| Tickets totais | `vw_analytics_cs_kpis.total_tickets` | Contagem de tickets no pipeline CS ativo | ticket | disponível após sync |
| Tickets abertos | `open_tickets` | Tickets cujo estágio não está fechado | ticket | disponível após stages |
| Tickets encerrados | `closed_tickets` | Tickets em estágio fechado | ticket | disponível após stages |
| Taxa encerrada | `closed_rate` | Encerrados / total | ticket | disponível; denominator explícito |
| Tickets por status | `vw_analytics_cs_by_status` | Contagem por estágio, inclusive estágio vazio | estágio | disponível após stages |
| Tendência criada/encerrada | `vw_analytics_cs_monthly` | Criação por `createdate` e encerramento por `closedate` | ticket/mês | disponível; séries usam datas diferentes |

### Caveats de suporte

- SLA existe no staging de tickets, mas ainda não há métrica de SLA exposta nas
  views V1.
- A série de encerramento usa `closedate`, enquanto a de criação usa
  `createdate`; não devem ser interpretadas como cohort sem uma view específica.
- Status desconhecido ou sem stage resolvido não deve ser convertido em fechado.

## Planilha — contrato futuro do Ciclo A1

Nenhuma métrica de planilha está disponível neste Ciclo A0. Antes de aceitar
um arquivo, o Ciclo A1 precisa definir:

- tipo de fonte: CSV/XLSX, versão e hash;
- aba/arquivo e linha de cabeçalho;
- chave externa ou chave composta para deduplicação;
- colunas obrigatórias, tipos, timezone, moeda e tratamento de nulos;
- período de referência e data de atualização;
- mapeamento para entidades canônicas, sem leitura direta pelo frontend;
- precedência em caso de conflito com HubSpot;
- linhas aceitas, rejeitadas e motivo de rejeição;
- status de qualidade: `valid`, `partial`, `stale`, `invalid`;
- usuário executor, auditoria e política de retenção do arquivo original.

## Modelo mínimo de provenance

Todo read model multi-fonte futuro deve conseguir expor ou derivar:

```text
source_system
source_record_id
source_version_or_hash
observed_at
effective_at
quality_status
mapping_version
```

Sem esses campos, o painel pode mostrar uma métrica, mas não deve apresentá-la
como reconciliada entre HubSpot e planilha.

## Critérios de aceite do Ciclo A0

- Métricas atuais mapeadas para views e definições reais.
- Diferenças de período, denominador, estágio e moeda explicitadas.
- Planilha marcada como indisponível até o contrato A1 existir.
- Próximo ciclo implementável sem depender de dado real ou secret.
- Documento indexado e referenciado no handoff de continuidade.
## Decisao de publicacao vigente - 2026-08-02

- HubSpot e a fonte oficial de empresas, deals, pipelines, stages, owners e
  tickets; Chat so e publicado quando existir contrato real de
  Conversations/Inbox/Chat.
- OMIE API e a fonte oficial de contas a receber, titulos, recebidos, abertos,
  aging, atraso e reconciliacao.
- Planilhas sao somente historico, staging de migracao, auditoria e QA. Nao
  sao fonte, fallback ou contingencia de qualquer metrica do Dashboard.
- Ausencia de fonte ou dado deve ser apresentada como `Indisponivel`, com
  estado de frescor/execucao quando o contrato o fornecer.

O inventario de consumidores e gaps esta em
`docs/reports/2026-08-02_dashboard-api-only-audit.md`.
