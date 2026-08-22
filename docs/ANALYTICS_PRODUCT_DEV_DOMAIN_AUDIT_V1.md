# Auditoria do domínio Produto e Desenvolvimento V1

## Status e escopo

- **Data:** 2026-08-21
- **Tipo:** descoberta e fundação documental; sem alteração executável.
- **Executor:** Forge
- **Reviewer ativo:** Sentinel
- **Fontes externas:** documentação pública oficial do GitHub foi consultada
  para a discovery; nenhuma chamada foi feita ao portal, organização ou
  repositório do ConfiOne. Não foram lidos ou alterados secrets.
- **Fora deste lote:** código de produto, SQL, migrations, RLS, RPCs, ingestão,
  integração externa, UI, contratos executáveis, push, merge, deploy e release.

Este documento responde se o ConfiOne possui uma fonte confiável para indicadores
de Produto e Desenvolvimento e separa três coisas que não devem ser misturadas:

1. métricas analíticas publicadas para o Dashboard;
2. operação técnica local já existente;
3. planejamento ou hipótese futura de Produto, GitHub e releases.

## Resumo executivo

Não existe hoje um contrato analítico publicado para Produto e Desenvolvimento.
A rota está conscientemente em modo de espera: `AnalyticsProductDevelopmentPage`
declara GitHub como integração futura, não executa `fetch`, Supabase, Axios ou
XHR e mostra categorias sem dados demonstrativos. A tela não deve ser interpretada
como evidência de que roadmap, releases, pull requests, throughput ou lead time
estejam disponíveis.

Existe, contudo, um contrato real para **demandas técnicas originadas de
Suporte**. `engineering_work_items` e suas views/RPCs permitem fila, ownership,
status, prioridade, updates e retorno ao Suporte. Esse contrato é tenant-aware e
operacional. Ele não representa backlog de Produto, sprint, release ou GitHub e
não deve ser promovido silenciosamente a KPI de Produto/Desenvolvimento.

Também existe um Development Control Plane local que lê handoffs, fila e Git
para operação dos agentes. Ele é read-only, local e orientado a governança do
repositório. Seus contadores e timeline não são um read model de produto, não
possuem contrato de tenant para o Dashboard e não provam entrega publicada.

## Precedência e evidências auditadas

### Contrato analítico executivo

`supabase/migrations/20260718101000_analytics_ceo_risk_readmodel_v1.sql:3-126`
publica em `rpc_analytics_ceo_snapshot(date, date)` somente os blocos
`commercial`, `support`, `finance`, `financial_alerts` e `data_quality`. Não há
payload `product` ou `development` nessa RPC. O acesso passa por
`app_private.can_read_analytics()` e os grants são para `authenticated` e
`service_role`.

O frontend acrescenta tipos defensivos para `product` e `development` em
`apps/web/src/features/analytics/analytics-model.ts:422-428,747-800`, mas
quando o payload não contém esses blocos o estado vira `not_configured` com
fonte e motivo de ausência. Isso é um fallback de contrato, não uma métrica.

### Superfície de Produto e Desenvolvimento

`apps/web/src/features/analytics/AnalyticsUnavailablePages.tsx:1-57` registra:

- categorias previstas: Roadmap, Entregas, Releases, Pull requests, Lead time,
  Throughput, Incidentes, Bugs, Bloqueios e Ambientes;
- fonte prevista: GitHub, ainda não conectado;
- contrato de leitura: indisponível;
- decisão pendente: definir fonte e contrato antes de publicar indicadores.

`tests/scripts/analytics-domain-layout-v1-1.test.mjs:23-28` protege justamente
essa fronteira: a aba existe como espera pública e não pode fazer leitura de
dados ou criar números ilustrativos.

`docs/specs/GENIUS_HIGH_DENSITY_INTERFACE_V1.md:165-168` mantém a mesma decisão:
GitHub é hipótese futura, sem chamada, token, secret, contrato ou métrica nesta
etapa.

### Engineering Workspace operacional

As migrations
`supabase/migrations/20260508210614_support_ticket_attachments_and_escalation_v3.sql:1-44`
e `supabase/migrations/20260508214852_engineering_workspace_operational_core_contracts_v3.sql:39-71,702-951`
materializam:

- `engineering_work_items` com `tenant_id`, tipo (`bug`, `improvement`,
  `technical_task`, `investigation`), status, prioridade, título, descrição,
  criador, responsável, `created_at` e `updated_at`;
- `engineering_work_item_updates` com tipo de update, status, resumo,
  próximo passo, ator e `created_at`;
- links entre work items técnicos e tickets;
- `vw_engineering_work_items_queue`, detalhe, links e updates;
- RPCs de atribuição, status, update e retorno estruturado ao Suporte.

O documento `docs/ENGINEERING_WORKSPACE_OPERATIONAL_CORE_V3.md` explicita que o
workspace não é Jira interno, não possui sprint, backlog genérico, chat interno,
notificação externa ou gestão ampla de Produto. Portanto, seus dados podem
explicar a operação técnica vinculada a tickets, mas não medem entrega de
Produto, fluxo de pull requests, releases ou estabilidade de ambientes.

### Development Control Plane local

`tools/dev-control/server.mjs:13-18,136-178,187-267` lê os quatro handoffs
correntes, arquivos arquivados, fila e Git local. Ele expõe no máximo uma visão
local de task corrente, owner, estado, dirty count, últimos commits e timeline
de handoffs. `tools/dev-control/public/queue-state.js:1-68` apenas normaliza cards
e estados para o Kanban local.

Essa capacidade é útil para operação de desenvolvimento do próprio repositório,
mas não é uma fonte de KPI de Produto. Em particular:

- Git commit não equivale a pull request aprovado, release publicada ou deploy;
- `DONE` na fila de handoff não equivale a feature liberada para cliente;
- dirty count não equivale a dívida técnica, bug ou incidente;
- a fila e os handoffs não formam histórico analítico estável com esquema,
  cobertura e retenção próprios.

### Discovery oficial da fonte GitHub

O GitHub possui fontes oficiais suficientes para uma futura ingestão read-only,
mas isso não prova que a organização, os repositórios, a instalação do App, os
scopes ou a retenção efetiva do ConfiOne estejam configurados. A discovery abaixo
é de capacidade publicada na API, não de disponibilidade no portal do cliente.

| Capacidade | Endpoint oficial e objeto | Campos, estado e recorte temporal | Permissão read-only e paginação | Histórico e classificação atual |
| --- | --- | --- | --- | --- |
| Pull requests | `GET /repos/{owner}/{repo}/pulls`; objeto Pull Request | `number`, `state`, `draft`, `created_at`, `updated_at`, `closed_at`, `merged_at`, `merged`, `head.sha`, `base.sha`, autor, labels e reviewers; filtros `state`, `sort` e `direction` | GitHub App user/installation token ou fine-grained PAT com **Pull requests: read**; `per_page` máximo 100 e `page`, seguindo o header `Link` | O endpoint expõe itens e timestamps do PR, mas não um histórico completo de todas as transições; reviews podem ser lidos por `GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews`. Para o ConfiOne: `REQUIRES_SCOPE` + `REQUIRES_NEW_INGESTION` |
| Reviews de pull request | `GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews`; objeto review | Estado da revisão, autor, `submitted_at`, `commit_id` e associação ao PR | **Pull requests: read**; paginação REST por `per_page`/`page` e header `Link` | Fornece revisões registradas, não uma semântica pronta de aprovação ou lead time do produto; exige regra local e retenção de snapshots. `REQUIRES_SCOPE` + `REQUIRES_NEW_INGESTION` |
| Releases | `GET /repos/{owner}/{repo}/releases`; objeto Release | `tag_name`, `target_commitish`, `created_at`, `published_at`, `draft`, `prerelease`, `immutable`, autor e assets; não inclui tags Git sem release | GitHub App user/installation token ou fine-grained PAT com **Contents: read**; `per_page` máximo 100 e `page` | A lista contém releases associadas, com datas de criação/publicação, mas não comprova rollout, ambiente ou cobertura de clientes; drafts privados exigem acesso. `REQUIRES_SCOPE` + `REQUIRES_NEW_INGESTION` |
| Deployments | `GET /repos/{owner}/{repo}/deployments`; objeto Deployment, complementado por `GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses` | `sha`, `ref`, `task`, `environment`, `original_environment`, `created_at`, `updated_at`, `creator`, `production_environment`; filtros por `sha`, `ref`, `task` e `environment` | GitHub App user/installation token ou fine-grained PAT com **Deployments: read**; parâmetros de paginação devem ser tratados conforme o contrato do endpoint e o header `Link` | O deployment e seus statuses são eventos do GitHub, não prova de disponibilidade, sucesso de negócio ou cobertura por tenant; exige ingestão dos statuses e regra de ambiente. `REQUIRES_SCOPE` + `REQUIRES_NEW_INGESTION` |
| GitHub Projects | `GET /orgs/{org}/projectsV2`, `GET /orgs/{org}/projectsV2/{project_number}/fields` e `GET /orgs/{org}/projectsV2/{project_number}/items`; objetos Project, ProjectField e ProjectItem | Project: `state`, `created_at`, `updated_at`, `closed_at`, `start_date`, `target_date`; fields: nome, tipo, opções/configuração e timestamps; items: conteúdo associado, `created_at`, `updated_at` e `archived_at` | Projects: **organization read** para App user/installation token ou fine-grained PAT; endpoints usam `per_page` até 100 e cursor `before`/`after` quando aplicável, com `Link` | Projects pode ser a fonte de roadmap, mas isso depende de confirmar que o time realmente o utiliza e de normalizar campos customizados; a API não define semântica de roadmap do ConfiOne. `REQUIRES_SCOPE` + `REQUIRES_NEW_INGESTION` |

#### Rate limits, retenção e limites de interpretação

- A API REST documenta limites primários diferentes por autenticação: 60
  requisições/hora sem autenticação para dados públicos, 5.000/hora para
  usuários autenticados, 5.000/hora como piso para instalações de GitHub App e
  até 15.000/hora em organizações GitHub Enterprise Cloud, sujeitos às regras
  específicas da instalação.
- Também existem limites secundários, incluindo no máximo 100 requisições
  concorrentes e limites por endpoint que podem variar. A ingestão deverá ler
  `x-ratelimit-remaining`, `x-ratelimit-reset` e respostas 403/429, aplicar
  backoff e registrar falhas sem transformar ausência temporária em zero.
- A paginação REST usa o header `Link`; a maioria dos endpoints aceita no máximo
  100 itens por página. A futura ingestão deve persistir cursor/página, janela de
  coleta e `collected_at`, sem assumir que uma primeira página represente a
  cobertura total.
- A API expõe timestamps e o estado atual dos objetos retornados, mas a
  retenção histórica, a remoção/arquivamento, alterações de campos e transições
  passadas não formam automaticamente um histórico analítico. Para lead time,
  throughput, aging e estabilidade será necessário snapshot/event log próprio,
  com proveniência do endpoint e regra explícita de reconstrução.
- Não foi confirmada nenhuma organização, repositório, projeto, GitHub App,
  permissão efetiva, plano ou política de retenção do ConfiOne. O próximo lote
  deve fazer discovery autenticada read-only somente após autorização e sem
  criar secret neste lote.

## Matriz de indicadores candidatos

Estados usados nesta auditoria:

- `AVAILABLE_NOW`: existe contrato local real para a capacidade indicada, com
  escopo e permissões identificáveis;
- `REQUIRES_SCOPE`: a fonte existe ou é conhecida, mas a permissão/escopo efetivo
  ainda precisa ser confirmado;
- `REQUIRES_NEW_INGESTION`: não há read model local do sinal, mesmo que uma fonte
  futura seja tecnicamente possível;
- `API_LIMITATION`: limitação comprovada da API. Nenhum item abaixo foi
  classificado assim sem evidência oficial.

| Indicador ou capacidade | Fonte real | Campo de data e período | Timezone, frescor e cobertura | Permissão/proveniência | Estado | Decisão operacional |
| --- | --- | --- | --- | --- | --- | --- |
| Fila técnica atual | `vw_engineering_work_items_queue` | `status` atual; ordenação por `updated_at`; sem período histórico | Timestamps `timestamptz` gravados em UTC; frescor depende da leitura do read model; cobre apenas work items existentes | `can_access_engineering_workspace(tenant_id)`; views para `authenticated` e `service_role`; origem local do ConfiOne | `AVAILABLE_NOW` | Pode apoiar o workspace de Engenharia, não o Dashboard de Produto |
| Work items por tipo/status/prioridade | `engineering_work_items` e fila | Posição atual; `created_at` e `updated_at` existem, mas não há snapshot diário | Cobertura limitada aos itens técnicos criados; sem série de estados completa | Tenant explícito, membership/role de Engenharia ou `platform_admin`, auditoria nas mutações | `AVAILABLE_NOW` | Sinal operacional de suporte técnico, não throughput de produto |
| Updates e próximo passo técnico | `vw_engineering_work_item_updates` | `created_at` do update; não existe SLA/lead time canônico | UTC; frescor depende da última atualização; cobertura apenas dos updates registrados | `can_access_engineering_workspace(tenant_id)` e actor autorizado nas escritas | `AVAILABLE_NOW` | Pode explicar andamento de um work item, sem formar métrica agregada ainda |
| Demandas técnicas originadas de tickets | `engineering_ticket_links` e `vw_support_ticket_engineering_links` | `created_at` do vínculo e timestamps do ticket; não é intake de Produto | Tenant e associação explícitos; cobertura somente de tickets vinculados | Acesso por tenant e papel; suporte lê vínculo, não altera work item | `AVAILABLE_NOW` | Separar demanda técnica de backlog de Produto |
| Roadmap de Produto | `docs/ROADMAP_BUILDOUT_V3.md` e handoffs | Texto de planejamento; sem `period`, `as_of` ou evento estruturado | Não há frescor, cobertura ou série computável | Documento versionado, não read model autorizado para Analytics | `REQUIRES_NEW_INGESTION` | Usar como direção, não exibir contagem ou progresso calculado |
| Entregas e releases | Git, handoffs e GitHub Releases | GitHub Release possui `created_at`/`published_at`, tag e prerelease; datas de commit/review continuam não representando release/deploy | API oficial paginada; cobertura de releases, ambiente, versão publicada e clientes não confirmada | Contents: read para releases; portal e escopo efetivos não confirmados | `REQUIRES_SCOPE` + `REQUIRES_NEW_INGESTION` | Não converter commit ou `DONE` em entrega publicada; reconciliar release com deploy/status |
| Pull requests e revisão de código | GitHub REST Pull Requests e Pull Request Reviews; nenhuma fonte conectada localmente | `created_at`, `updated_at`, `closed_at`, `merged_at`, `submitted_at` e SHAs; sem histórico local de transições | Paginação e rate limits oficiais conhecidos; cobertura, retenção e frescor do ConfiOne não confirmados | Pull requests: read; organização, repositórios, instalação e permissões efetivas não confirmados | `REQUIRES_SCOPE` + `REQUIRES_NEW_INGESTION` | Confirmar owner, organização, repositórios e escopo read-only; ingerir PR e reviews com snapshots |
| Lead time de mudança | Nenhum contrato | Exigiria eventos de abertura, aprovação, merge e deploy; ausentes | Histórico e correlação de ambientes ausentes | Nenhuma fonte/proveniência operacional publicada | `REQUIRES_NEW_INGESTION` | Não inferir de `created_at` e `updated_at` de work item |
| Throughput de produto/engenharia | Nenhum read model | Exigiria unidade, janela e definição de concluído; ausentes | Sem série histórica nem denominador | Sem fonte autorizada | `REQUIRES_NEW_INGESTION` | Não usar contagem de cards/handoffs como throughput |
| Bugs e incidentes | Work item técnico aceita tipo `bug`; não há contrato de incidente | `created_at`/`updated_at` do work item; sem severidade de incidente e sem histórico | Cobertura limitada a bugs técnicos ligados ao fluxo de suporte | Tenant-aware no work item; não cobre incidentes de plataforma ou produção | `AVAILABLE_NOW` para fila técnica; `REQUIRES_NEW_INGESTION` para KPI de incidentes | Preservar a distinção entre bug de work item e incidente operacional |
| Bloqueios | Status `waiting_external` e updates técnicos existem | Momento do status não é versionado em série; apenas update quando registrado | Cobertura parcial e sem duração de bloqueio | Permissão do workspace técnico; auditoria das mutações | `AVAILABLE_NOW` como estado operacional; `REQUIRES_NEW_INGESTION` para aging agregado | Não publicar dias bloqueado sem histórico de transições |
| Ambientes e estabilidade | Nenhuma fonte de runtime/observabilidade integrada | Nenhum evento de deploy, erro, disponibilidade ou incidente | Sem frescor, retenção ou cobertura | Nenhum contrato de observabilidade publicado | `REQUIRES_NEW_INGESTION` | Não criar status verde ou saúde inferida na UI |
| Produtos, planos e assinaturas locais | Catálogo e `customer_product_subscriptions`/views administrativas | `started_at`, `ended_at`, `renewal_at`, `created_at`, `updated_at`; posição atual | Tenant explícito; cobertura depende de registros manuais locais | Leitura administrativa por `platform_admin`; não é fonte de roadmap ou uso do produto | `AVAILABLE_NOW` como operação de catálogo/assinatura | Não tratar assinatura como adoção, uso, feature delivery ou MRR sem contrato próprio |

## Semântica temporal e ausência

O único recorte temporal confiável para os work items atuais é o registro do
próprio evento local: `created_at` e `updated_at`/`last_update_at`, armazenados
como `timestamptz` e produzidos em UTC. Eles respondem quando o item ou update
foi registrado, não quando uma mudança foi aprovada, integrada, publicada ou
disponibilizada ao cliente.

Para roadmap, releases, pull requests, lead time, throughput, incidentes,
ambientes e estabilidade, não existe campo de data local suficiente. A UI deve
mostrar ausência explícita, nunca zero, e não pode escolher `created_at`, data de
commit ou data de review como substituto sem contrato de produto.

## Permissões, tenant e proveniência

- Work items e updates técnicos têm `tenant_id` e são filtrados por
  `app_private.can_access_engineering_workspace(tenant_id)`. A migration bloqueia
  DML direto para `authenticated`; mutações passam por RPCs com actor e
  auditoria.
- Catálogo/assinaturas de Produto são contratos administrativos e não provam
  acesso analítico por tenant ou uso do produto.
- O Development Control Plane local roda em `127.0.0.1` e lê o checkout. Ele
  não é superfície online autenticada e não deve ser publicado como Dashboard.
- A integração GitHub não possui neste lote organização, repositórios, scopes,
  instalação, permissões efetivas, retenção histórica ou mapeamento
  tenant/projeto confirmados. A documentação oficial confirma endpoints e
  permissões read-only para Pull Requests, Reviews, Releases, Deployments e
  Projects, mas a classificação correta para o ConfiOne continua sendo
  pendência de escopo e nova ingestão, não limitação comprovada da API.

## Estado atual por capacidade

| Capacidade | Estado atual | Evidência | Próximo passo mínimo |
| --- | --- | --- | --- |
| Exibir área Produto/Desenvolvimento sem dados falsos | `AVAILABLE_NOW` | Componente de espera e teste de ausência de chamadas | Manter até existir contrato de leitura aprovado |
| Operar fila técnica derivada de tickets | `AVAILABLE_NOW` | Views/RPCs e testes do Engineering Workspace | Não promover a backlog de Produto |
| Ler roadmap como documento | `AVAILABLE_NOW` | Roadmap versionado | Não calcular progresso sem eventos estruturados |
| Consolidar pull requests, releases e deploys | `REQUIRES_SCOPE` + `REQUIRES_NEW_INGESTION` | GitHub apenas como fonte futura declarada | Confirmar owner, organização, repositórios e scopes read-only |
| Medir lead time/throughput/aging de bloqueio | `REQUIRES_NEW_INGESTION` | Não há histórico de transições e eventos de entrega | Definir eventos, unidade, janela, timezone e retenção |
| Medir incidentes/estabilidade de ambientes | `REQUIRES_NEW_INGESTION` | Nenhum contrato de observabilidade local | Escolher fonte e contrato server-side próprios |

Não há evidência suficiente para declarar `API_LIMITATION`. A ausência atual é
de contrato, escopo confirmado, ingestão e histórico, não de capacidade técnica
comprovadamente impossível.

## Menor próximo lote recomendado

1. Decidir se GitHub é a fonte oficial de código, pull requests, releases e
   issues, ou se outra ferramenta é a fonte de Produto.
2. Fazer discovery read-only do portal/organização/repositórios, scopes,
   paginação, rate limits, campos de data, retenção, histórico e associação a
   tenant/produto. Não criar secret ou escrever no GitHub durante o discovery.
3. Definir separadamente os contratos de demanda de Produto, work item de
   Engenharia, incidente, release e deploy. Não reutilizar
   `engineering_work_items` como backlog de Produto.
4. Criar, em task posterior, um read model server-side com proveniência,
   frescor, cobertura, estados de ausência e autorização explícita. Só depois
   avaliar uma superfície de interface para metodologia e indicadores.

## Veredito da auditoria

**Consistente com ressalvas.** A ausência de indicadores de Produto e
Desenvolvimento está explícita e a interface não fabrica números. O ConfiOne já
possui operação técnica real e governada para work items originados de Suporte,
mas não possui contrato de analytics de Produto, GitHub, releases, throughput,
lead time, incidentes ou ambientes. Qualquer publicação desses sinais exige
decisão de fonte, descoberta de permissões, ingestão histórica e contrato
server-side próprio.

## Referências principais

- `apps/web/src/features/analytics/AnalyticsUnavailablePages.tsx:1-57`
- `apps/web/src/features/analytics/analytics-domains.ts:9-27`
- `apps/web/src/features/analytics/analytics-model.ts:422-428,747-800`
- `tests/scripts/analytics-domain-layout-v1-1.test.mjs:23-28`
- `supabase/migrations/20260718101000_analytics_ceo_risk_readmodel_v1.sql:3-126`
- `supabase/migrations/20260508210614_support_ticket_attachments_and_escalation_v3.sql:1-44`
- `supabase/migrations/20260508214852_engineering_workspace_operational_core_contracts_v3.sql:39-71,702-951`
- `docs/ENGINEERING_WORKSPACE_OPERATIONAL_CORE_V3.md`
- `tools/dev-control/server.mjs:13-18,136-267`
- `docs/OPERATIONAL_CONTROL_PLANE_V1.md`
- [GitHub REST API: Pull requests](https://docs.github.com/en/rest/pulls/pulls)
- [GitHub REST API: Pull request reviews](https://docs.github.com/en/rest/pulls/reviews)
- [GitHub REST API: Releases](https://docs.github.com/en/rest/releases/releases)
- [GitHub REST API: Deployments](https://docs.github.com/en/rest/deployments/deployments)
- [GitHub REST API: Projects](https://docs.github.com/en/rest/projects/projects)
- [GitHub REST API: Project fields](https://docs.github.com/en/rest/projects/fields)
- [GitHub REST API: Project items](https://docs.github.com/en/rest/projects/items)
- [GitHub REST API: Rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
- [GitHub REST API: Pagination](https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api)
