# Auditoria do domínio de Customer Success V1

**Status:** DISCOVERY / NOT PUBLISHED
**Task:** `CS-DOMAIN-AUDIT-2026-08-21`
**Data:** 2026-08-21
**Escopo:** carteira, risco, churn, expansão e renovação

## Resumo executivo

O ConfiOne possui uma carteira de Customer Success baseada em tenant, com
assinaturas cliente-produto-plano, owner de CS, contadores de tickets e uma
atribuição operacional de carteira. Também possui sinais analíticos server-side
de posição atual, atraso financeiro, tickets abertos e ausência de atividade.

Essas fontes não formam um health score canônico nem uma série publicada de
churn ou expansão. A documentação oficial do HubSpot confirma uma capacidade
externa de Customer Success Health Score, mas a existência das propriedades,
dos scopes e da configuração correspondente no portal usado pelo ConfiOne
ainda não foi verificada. Portanto, a ausência local não é tratada como
limitação da API. Renovação possui uma data observada (`renewal_at`/`renewalAt`)
quando preenchida, mas continua sem janela de alerta, responsável de renovação,
estado `due_soon` ou vínculo publicado com MRR por assinatura. O domínio deve
manter ausência como `unavailable`, `partial` ou `awaiting_history`, conforme a
fonte, e nunca converter lacuna em zero.

Este lote é documental. Não cria cálculo, contrato, alerta, UI, migration, RPC,
view, policy, integração ou publicação.

## Fontes locais e precedência

Código executável, migrations, views, RPCs e testes prevalecem sobre documentos
históricos. As fontes auditadas foram:

| Fonte | Evidência | O que sustenta |
| --- | --- | --- |
| `supabase/migrations/20260604193000_cs_portfolio_contract_foundation.sql:1-183` | `app_private.can_access_cs_customer_portfolio` e `vw_cs_customer_portfolio` base | Carteira por tenant, owner de CS, assinaturas ativas/suspensas, tickets atuais, estado de health indisponível e marca de atualização operacional. |
| `supabase/migrations/20260723203000_cs_real_portfolio_contract_v1.sql:5-64,98-155,182-371` | `cs_customer_portfolio_assignments`, histórico, gate de gestão, RPC de upsert e view enriquecida | Atribuição operacional editável, `health_status` manual, prioridade, proveniência, histórico e permissões. |
| `packages/contracts/src/ticketing.ts:2240-2308` | `CsCustomerPortfolioProductContext`, `CsCustomerPortfolioAssignment` e `CsCustomerPortfolio` | Contrato TypeScript dos campos expostos e dos estados de ausência. |
| `apps/web/src/features/cs/cs-api.ts:5-56` | Leitura da view e escrita pelo RPC administrativo | Consumidor real da carteira; a UI não possui RPC analítico separado para health/churn/expansão. |
| `apps/web/src/features/cs/cs-model.ts:10-95` | Mapeamento da resposta | Conversão de tipos sem cálculo de score; `healthSummaryStatus` permanece `unavailable`. |
| `docs/ANALYTICS_CONTRACT_EXPIRY_FOUNDATION_V1.md:21-134` | Fundação de contratos próximos do vencimento | Semântica atual de `renewal_at`, lacunas de janela, owner, MRR e alertas. |
| `docs/ANALYTICS_KPI_REGISTRY_V1.md:170-189` | Registro analítico corrente de Customer Success | KPIs de posição atual e estados `partial`, `unavailable` e `awaiting_history`. |

## Contrato de carteira

### O que está publicado

`vw_cs_customer_portfolio` retorna uma linha por tenant visível no escopo
autorizado. A view informa nome e status do tenant, owner corrente de CS,
quantidade de assinaturas e produtos ativos, contextos de produto, contagem de
tickets e membros de Customer Success. Os contextos de produto incluem
`startedAt`, `endedAt`, `renewalAt`, status, produto, plano e contagens de
features e owners.

As assinaturas incluídas nos contextos da carteira são somente `active` ou
`suspended`. A contagem de tickets é uma posição atual por status: tickets em
`resolved`, `closed` e `cancelled` são excluídos de `open_ticket_count`; não há
período de consulta nessa view.

O contrato também publica `last_operational_update_at`, derivado do maior
entre a atualização do tenant, a última atualização de assinatura e a última
atualização de ticket. Isso é uma marca de frescor aproximada do read model,
não um snapshot histórico nem uma data de cálculo de KPI.

### Tenant, permissões e escrita

A leitura exige `platform_admin` ou membership ativa do usuário na área
`customer_success`, com membership de tenant ativa, perfil ativo e papel
`viewer`, `member` ou `manager`. A escrita da atribuição passa por
`rpc_admin_upsert_cs_customer_portfolio` e exige o gate de gestor da área de
Customer Success. A tabela e o histórico têm RLS; o histórico é concedido para
`service_role`, enquanto a atribuição possui leitura autenticada governada pelo
tenant.

`cs_customer_portfolio_assignments` tem uma atribuição por tenant, com
`portfolio_name`, owner, cluster, modelo de atendimento, frequência, prioridade,
`health_status`, notas e `source`. O histórico registra operação, `changed_at`,
ator e estado anterior/posterior.

## Separação semântica dos sinais

| Domínio | Estado observado | O que não pode ser inferido |
| --- | --- | --- |
| Carteira | Tenant, produtos/planos ativos ou suspensos, owner de CS, atribuição de carteira e contadores atuais de tickets. | Valor de carteira, segmento comercial, sucesso do cliente ou tendência temporal. |
| Risco operacional | `open_ticket_count`, tickets críticos nos read models analíticos, ausência de atividade, atraso financeiro e campos manuais de prioridade/saúde. | Um score agregado, probabilidade de churn, causalidade ou severidade comparável entre clientes. |
| Churn | `logo_churn_rate`, `churned_mrr`, `new_mrr`, `nrr` e `grr` estão registrados como dependentes de histórico e permanecem `awaiting_history` quando não há série suficiente. | Churn atual por tenant, churn projetado ou uso de status legado do HubSpot como série canônica. |
| Expansão | Mais de um produto ou assinatura pode aparecer no portfolio; projetos podem possuir o tipo técnico `expansion`. | Evento de expansão, delta de MRR, expansão líquida, cross-sell ou upsell sem contrato de evento e série temporal. |
| Renovação | `renewalAt` é exposto por assinatura ativa/suspensa quando preenchido. | Janela `due_soon`, vencimento calculado, probabilidade de renovação, owner de renovação ou MRR em risco por contrato. |

### Health score não publicado

O contrato base fixa `health_summary_status = 'unavailable'` e explica que o
health score não foi materializado. O contrato TypeScript preserva esse estado
e o mapeador não cria valor substituto.

Existe um campo operacional livre `portfolio_health_status` em
`cs_customer_portfolio_assignments`, mantido por RPC administrativo. Ele é um
atributo manual de atribuição, com proveniência e histórico, não uma fórmula,
versão de score ou série analítica. A tela também usa a combinação local de
tickets abertos, `healthStatus = risk` e ausência de owner para exibir uma
indicação visual de atenção. Essa indicação é apresentação operacional e não
deve ser lida como health score publicado.

## Descoberta oficial de APIs, portal e disponibilidade

Esta seção registra capacidade oficial e plano de verificação. Ela não afirma
que o portal ConfiOne possui as propriedades, o plano, o seat ou os scopes
necessários. Nenhuma chamada ao HubSpot, inspeção de token, leitura de portal
ou sincronização externa foi executada neste lote.

### Matriz de descoberta

| Capacidade | Objeto, endpoint e propriedade a verificar | Escopo, plano e permissão | Paginação, limite e histórico | Classificação atual |
| --- | --- | --- | --- | --- |
| Health Score e Health Status | Customer Success Workspace cria propriedades de saúde em empresas ou contatos. Descobrir os nomes internos via `GET /crm/properties/2026-03/companies` e, se aplicável, `/contacts`; depois testar leitura de registros por `GET /crm/objects/2026-03/companies/{recordId}?properties=<health_score_property>,<health_status_property>`. Os nomes internos não são presumidos neste documento. | A criação/configuração exige Service Hub Professional ou Enterprise, Service Seat e `Manage Customer Success Settings` ou Super Admin. Os scopes de leitura CRM do objeto precisam ser confirmados no app/portal. | Leitura de registros usa `limit`/`after`; histórico pode ser solicitado com `propertiesWithHistory`, mas a propriedade e a retenção precisam ser confirmadas no portal e na resposta. | `REQUIRES_NEW_INGESTION` como hipótese mínima; pode mudar para `REQUIRES_SCOPE` se a descoberta confirmar propriedade com scope ausente. Não é `API_LIMITATION`. |
| Atividades e sinais de relacionamento | Pesquisar atividades associadas a empresas/contatos em `/crm/objects/2026-03/{calls,emails,meetings,notes,tasks}/search`; consultar associações por `GET /crm/v4/objects/{fromObjectType}/{objectId}/associations/{toObjectType}` ou batch read. | Requer scopes de leitura dos objetos e associações correspondentes. O conjunto local documentado hoje cobre deals, tickets, owners e schemas desses objetos, não prova acesso a atividades ou ao workspace de CS. | Search usa `limit` e cursor `after`; a documentação oficial informa até 200 objetos por página, cinco requisições por segundo e teto de 10.000 resultados por consulta. A coleta deve persistir cursor, frescor e partições. | `REQUIRES_NEW_INGESTION`; `REQUIRES_SCOPE` permanece condicional à verificação do app. |
| Empresa, contato e associações | CRM Objects/Associations APIs permitem ler empresas, contatos e relações. Os tipos e labels da conta devem ser descobertos antes de atribuir atividade ou contato a uma empresa. | Scopes CRM de leitura para os objetos e associações; plano e permissões do portal ainda não verificados. | Batch read de associações admite até 1.000 entradas por requisição segundo a documentação oficial; cada associação pode possuir paginação própria por `after`. | `REQUIRES_NEW_INGESTION`; não há contrato local de ingestão CS dessas relações. |
| Churn e expansão | Não existe endpoint nativo presumido para o KPI ConfiOne. A investigação deve procurar propriedades, objetos, eventos e históricos em empresas, deals, assinaturas e atividades, usando Properties/Object/Search APIs e associações; a regra de coorte e a data de corte continuam sendo contrato local. | Scopes, plano, propriedades de receita e permissões do portal precisam ser confirmados. O token de deals/tickets existente não prova acesso a histórico de Customer Success. | `createdate`, `closedate`, `hs_lastmodifieddate` e propriedades com histórico não substituem uma série de transições aprovada. A coleta deve registrar cursores, limites, frescor e retenção. | `REQUIRES_NEW_INGESTION` pendente de verificação do portal; `awaiting_history` continua sendo o estado analítico local enquanto não houver série suficiente. Não classificar como `API_LIMITATION` sem evidência oficial. |

### Prioridade: inventário read-only das propriedades reais

O Health Score nativo do HubSpot é uma premissa do fluxo-alvo do produto. A
configuração e o cálculo devem ocorrer no HubSpot; `Health score`, `Health
status` e eventual histórico são fontes upstream. O ConfiOne deve apenas ler
pela API oficial, ingerir e expor o read model com tenant, proveniência,
cobertura, frescor, permissões e estados de ausência explícitos, sem recalcular
o score localmente. A diretriz corrente do proprietário também prioriza o
inventário read-only das propriedades customizadas e dos objetos efetivamente
usados no portal. A informação de uso de reuniões/agendamentos, tarefas,
pipelines de deals e propriedades customizadas é contexto operacional do
proprietário e ainda precisa ser confirmada por resposta da API, sem tratá-la
como fato de cobertura.

O inventário autorizado, quando houver task própria para executá-lo, deve
consultar apenas metadados e leituras sem escrita e registrar, por objeto e
associação:

| Objeto ou atividade | Inventário mínimo | Classificação antes da verificação |
| --- | --- | --- |
| Empresas, negócios, contatos e tickets | `name` interno, `label`, tipo, grupo, opções, descrição, arquivada, cobertura/valores observados, histórico disponível, origem e associações; incluir `createdate`, `closedate`, `hs_lastmodifieddate` e propriedades customizadas descobertas. | `REQUIRES_NEW_INGESTION`; `REQUIRES_SCOPE` se o endpoint ou objeto responder sem autorização. |
| Deals, pipelines e stages | Pipelines e stages, IDs, labels, estado de fechamento, owners, propriedades de receita, timestamps e histórico de estágio. | Campos já presentes no sincronizador local podem ser `AVAILABLE_NOW` somente para o escopo publicado; inventário customizado e histórico permanecem `REQUIRES_NEW_INGESTION`. |
| Reuniões, tarefas, ligações e e-mails | Propriedades, timestamps, owners, status, associações com empresa/contato/deal e cobertura observada; não converter atividade em “última interação” sem regra. | `REQUIRES_NEW_INGESTION`; `REQUIRES_SCOPE` se faltarem scopes de atividades. |
| Health Score nativo | Verificar se o workspace está configurado, quais propriedades internas foram criadas, empresa/contato alvo, versão/perfil, histórico e plano/seat/permissão. O fluxo-alvo é configuração/cálculo no HubSpot, leitura pela API oficial e ingestão/read model no ConfiOne. | Capacidade alvo suportada, atualmente `REQUIRES_NEW_INGESTION` e possivelmente `REQUIRES_SCOPE` até confirmar configuração e scopes; nunca recalcular no ConfiOne nem classificar como `API_LIMITATION`. |

Para Properties API, o endpoint oficial `GET
/crm/properties/2026-03/{objectType}` é a fonte de metadados por objeto. A
leitura de registros usa Object/Search APIs e deve solicitar somente as
propriedades descobertas, além de `propertiesWithHistory` quando o histórico
for necessário. A coleta deve preservar o nome interno retornado, não inferir
nomes a partir de labels ou de convenções `hs_*`.

O resultado do inventário deve separar quatro situações: `AVAILABLE_NOW` para
campos já publicados e validados no contrato local; `REQUIRES_SCOPE` para
capacidade existente com permissão ausente; `REQUIRES_NEW_INGESTION` para
metadado/dado que existe no portal mas ainda não possui ingestão local; e
`API_LIMITATION` somente quando a documentação oficial e a resposta da API
provarem uma limitação real. Sem chamada autorizada ao portal, as novas
propriedades e atividades permanecem `REQUIRES_NEW_INGESTION` por hipótese, e
não `API_LIMITATION`. Para o Health Score, a capacidade está aprovada como
fonte upstream do produto, mas sua disponibilidade operacional ainda depende
da configuração do portal, scopes e ingestão/read model.

### Escopos atualmente documentados no checkout

`docs/ANALYTICS_HUBSPOT.md:133-135` e
`supabase/functions/_shared/hubspot.ts:1-4` documentam os scopes esperados para
o sincronizador atual: `crm.objects.deals.read`,
`crm.objects.tickets.read`, `crm.objects.owners.read`,
`crm.schemas.deals.read` e `crm.schemas.tickets.read`. Isso é evidência do
contrato local esperado, não inspeção do token efetivamente configurado nem
prova de `crm.objects.companies.read`, atividades, propriedades de CS ou
associações no portal. Nenhum secret foi lido ou exposto.

### Limites e histórico que o próximo discovery deve registrar

- A Search API oficial aceita filtros por propriedade e associação, pagina com
  `paging.next.after`, suporta até 200 objetos por página e limita uma consulta
  a 10.000 resultados; a taxa documentada para Search é cinco requisições por
  segundo por conta. A ingestão deve particionar consultas que possam exceder
  o teto e registrar a janela temporal usada.
- As Object APIs paginam com `limit` e `after`, e aceitam
  `propertiesWithHistory` para solicitar valores históricos. Isso demonstra
  capacidade técnica, mas não garante que uma propriedade de Health Score,
  churn ou expansão exista, esteja preenchida ou tenha retenção suficiente na
  conta.
- A documentação de uso da API informa que limites gerais variam por tipo de
  app, conta e endpoint; os headers de rate limit devem ser preservados quando
  houver integração autorizada. A Search API possui regras próprias e não
  deve ser tratada como se herdasse o limite geral.
- A verificação futura precisa registrar endpoint chamado, objeto, propriedade
  e nome interno retornado, status HTTP, scopes efetivos sem revelar token,
  plano/seat/permissão, cursores, contagem, timestamp de coleta, janela de
  histórico e motivo da classificação.

### Fontes oficiais consultadas

- [Criar health score no Customer Success Workspace](https://knowledge.hubspot.com/help-desk/customize-a-health-score-in-the-customer-success-workspace)
- [Usar o Customer Success Workspace](https://knowledge.hubspot.com/customer-success/use-the-customer-success-workspace)
- [Using Object APIs](https://developers.hubspot.com/docs/api-reference/latest/crm/using-object-apis)
- [Search the CRM](https://developers.hubspot.com/docs/api-reference/latest/crm/search-the-crm)
- [Understanding the CRM APIs](https://developers.hubspot.com/docs/api-reference/latest/crm/understanding-the-crm)
- [Associations overview](https://developers.hubspot.com/docs/api-reference/latest/crm/associations/overview)
- [API usage guidelines and limits](https://developers.hubspot.com/docs/developer-tooling/platform/usage-guidelines)

Essas fontes comprovam a capacidade documentada do produto HubSpot, não a
disponibilidade no portal ConfiOne. O menor próximo lote para transformar a
hipótese em `AVAILABLE_NOW` continua dependendo de uma descoberta autorizada
somente leitura do portal e do contrato de ingestão. Sem essa evidência,
health score, sinais de atividade, churn e expansão não são publicados no
ConfiOne.

## Customer Success analítico

`rpc_analytics_customer_success_kpis_v2()` e o registro corrente de KPIs
publicam sinais com bases distintas:

- clientes ativos e MRR são posição atual, condicionados à regra de cliente
  ativo, fonte de MRR e cobertura do vínculo HubSpot ↔ OMIE;
- atraso financeiro usa a posição de títulos e o vínculo por CNPJ normalizado;
- tickets abertos e tickets críticos usam estado atual e associações disponíveis;
- ausência de atividade usa `company_last_activity_at` e o limiar configurado;
- evolução da carteira depende de comparação entre snapshots e fica
  `awaiting_history` quando a série não é suficiente.

Esse RPC não é uma fonte temporal da carteira CS nem possui parâmetros de
período para transformar os sinais em coorte de churn ou expansão. A presença
de `mrr_at_risk` ou `mrr_without_recent_activity` descreve causas observadas
na base analítica, não uma decisão de health score de Customer Success.

## Temporalidade, frescor e timezone

- A view da carteira é uma posição corrente. Ela não recebe `from`, `to`,
  `as_of` ou timezone operacional.
- `created_at`, `updated_at`, `started_at`, `ended_at`, `renewal_at`,
  `changed_at` e as datas dos tickets são timestamps com timezone nas fontes
  aplicáveis. Não existe calendário de negócio ou conversão oficial para data
  local neste contrato.
- `last_operational_update_at` ajuda a informar atualização do conjunto, mas
  não prova que todos os componentes tenham sido sincronizados no mesmo
  instante.
- `renewal_at = null` significa que a data contratada não está informada. Não
  significa que a renovação não exista, que não haverá renovação ou que a data
  possa ser estimada.
- Dados históricos de churn, expansão ou health não devem ser fabricados a
  partir de `updated_at`, do status atual ou da diferença entre duas leituras
  sem snapshot e regra de coorte explícitos.

## Estados de disponibilidade

| Situação | Estado correto | Interpretação |
| --- | --- | --- |
| Health não materializado localmente | `unavailable` + `REQUIRES_NEW_INGESTION` | Existe carteira local e há capacidade oficial externa documentada, mas a propriedade, o scope, o portal e a ingestão ainda não foram verificados. |
| MRR ou associações incompletas | `partial` ou `unavailable` | A cobertura da fonte não permite tratar o número como universo completo. |
| Série histórica insuficiente | `awaiting_history` | A métrica depende de snapshots/transições ainda não disponíveis. |
| `renewal_at` nulo | Data indisponível no registro | Não criar zero, data estimada ou alerta. |
| Carteira sem atribuição | Atribuição `unconfigured` | Não confundir ausência de configuração com ausência de cliente. |

## Fatos, hipóteses e lacunas

### Fatos observados

- A carteira e seus sinais básicos existem em views/RPCs locais e têm
  isolamento por tenant e área.
- O HubSpot documenta Health Score/Health Status, APIs de propriedades,
  objetos, busca, atividades e associações; isso não equivale à
  disponibilidade no portal ConfiOne.
- A assinatura possui datas de início, fim e renovação, mas não MRR nem
  probabilidade de renovação.
- A atribuição de carteira possui saúde e prioridade manuais, com histórico,
  mas não possui contrato de cálculo.
- Churn e expansão não têm série de eventos publicada no contrato de CS.

### Hipóteses que não devem virar regra

- Ticket aberto não prova risco de churn.
- Atraso financeiro não prova risco de renovação.
- Mais produtos não prova expansão recente.
- `health_status = risk` manual não prova um score calculado.
- `ended_at`, `renewal_at` e status atual não definem sozinhos uma janela de
  renovação.

### Lacunas para decisão

- Definir se health será manual, calculado ou híbrido e qual versão do método
  será auditável.
- Definir eventos e coortes de churn e expansão, com datas, fonte e regra de
  exclusão.
- Definir a chave e a granularidade que ligarão MRR a assinatura/produto.
- Definir janela, timezone, owner e estados de renovação.
- Definir estados de cobertura, frescor, nulos e indisponibilidade que serão
  expostos aos usuários.
- Confirmar no portal as propriedades internas, scopes, plano, seat,
  permissões, paginação, rate limits, retenção histórica e relações de empresa,
  contato e atividade, classificando cada capacidade como `AVAILABLE_NOW`,
  `REQUIRES_SCOPE`, `REQUIRES_NEW_INGESTION` ou `API_LIMITATION`.

## Menor próximo lote implementável

O menor lote seguro é uma decisão de produto e contrato server-side para uma
única capacidade, preferencialmente um read model de sinais de saúde ou de
renovação. Antes da UI, esse lote deve especificar fonte, grão, data de corte,
timezone, tenant, autorização, frescor, auditoria, fórmula/versionamento,
tratamento de nulos e testes de indisponibilidade.

Enquanto essa decisão não existir, a interface pode explicar a carteira e as
datas observadas, mas deve manter health score, churn, expansão, alerta de
renovação e MRR por contrato como indisponíveis ou aguardando histórico. A
documentação futura para usuários deve mostrar, por indicador, fonte, campo de
data, período ou posição atual, timezone, filtros, fórmula e limitações, sem
exigir leitura do código.

## Limites desta auditoria

Não foram executados banco local, migrations, sincronizações externas ou
validação de dados em produção. A auditoria reconcilia contratos e fontes
versionadas no checkout; não afirma que a cobertura dos dados locais atuais é
completa. Nenhum arquivo executável foi alterado neste lote.
