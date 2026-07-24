# DASHBOARD-02 — Discovery concluído

## Merge da RELEASE-01

- PR: `#1` — `Release: Dashboard Gerencial e Central de Ajuda Genius`.
- Estado: `MERGED`, sem PR aberto pendente para a RELEASE-01.
- Método observado: merge commit, não squash/rebase.
- Merge SHA: `e9f59162a84d85ffdbc10a0efb020769cd6a74fa`.
- `origin/main`: `e9f59162a84d85ffdbc10a0efb020769cd6a74fa`.
- Deploy: não executado neste lote.
- Migrations remotas: não executadas neste lote.

O merge encerra o bloco de desenvolvimento da RELEASE-01. KNOWLEDGE-01,
KNOWLEDGE-01.1, TAXONOMY-01 e TAXONOMY-01.1 permanecem concluídos e não são
reabertos por riscos ou backlog identificados neste discovery.

## Branch do discovery

- Branch: `codex/dashboard-02-discovery`.
- Base: `main` após o merge da RELEASE-01.
- SHA inicial: `e9f59162a84d85ffdbc10a0efb020769cd6a74fa`.
- HEAD desta auditoria: commit documental desta auditoria; o hash final é
  confirmado no estado Git abaixo e no log do branch.
- Working tree na abertura: limpo.
- Alterações funcionais: nenhuma; componentes, contratos, migrations e fontes
  de dados não foram alterados.
- Stash editorial preservado e não aplicado: `stash@{0}` da correção editorial
  local mantida fora do PR da RELEASE-01.

## Funcionalidades encontradas

Rota principal: `/admin/analytics` (`apps/web/src/app/router.tsx`). O shell
carrega seis áreas configuradas em `analytics-domains.ts`:

| Área | Capacidades observadas |
| --- | --- |
| Visão executiva | Cinco KPIs, evolução histórica, resumos Comercial/CS, qualidade de dados, fila de reconciliação, clientes vencidos, títulos ambíguos e links externos do HubSpot. |
| Comercial | Filtros de período/pipeline, seis KPIs, funil, série mensal, responsável e tabela de pipelines. |
| CS / Suporte | Quatro KPIs, status, série mensal, responsável, origem e seleção de pipelines. |
| Financeiro | Oito KPIs, previsibilidade, aging, devedores, reconciliação, títulos, categorias e tendência. |
| Logs | Histórico de sincronizações e mensagens operacionais; área administrativa. |
| Configuração | Agendamentos HubSpot/OMIE, fontes, pipelines e importação operacional; área administrativa. |

Também foram encontrados exportação de relatório e ações de sincronização/merge
do HubSpot, condicionadas a permissões administrativas.

## Status das features

| Feature | Estado atual | Classificação para DASHBOARD-02 |
| --- | --- | --- |
| Shell e abas do Dashboard | Existente e navegável | Manter; revisar hierarquia e densidade |
| KPIs executivos | Existentes | Discovery de semântica, frescor e comparação |
| Comercial | Existente | Revalidar escopo de pipeline e período |
| CS / Suporte | Existente | Revalidar seleção e ocupação dos pipelines |
| Financeiro | Existente | Separar claramente período de posição atual |
| Logs e Configuração | Existentes | Preservar fora do escopo do viewer |
| Loading, vazio, erro e retry | Existem, mas há degradação silenciosa em parte da cadeia | Definir contrato de estado e observabilidade |
| Exportação e ações externas | Existentes para administradores | Revisar auditoria, confirmação e escopo |
| Scheduler automático | Frequências persistidas; execução produtiva não comprovada no repositório | Validar operação antes de prometer frescor |
| Comparação de períodos | Não há visão dedicada consolidada | Candidata de fase posterior |

## Arquitetura

O fluxo encontrado é:

`HubSpot/OMIE/planilhas → Edge Functions → tabelas de cache/read models → views/RPCs → Supabase JS → mappers → React`.

O frontend usa estado local e `useEffect`; não há React Query/SWR. Os snapshots
principais são obtidos por RPCs como `rpc_analytics_ceo_snapshot`,
`rpc_analytics_commercial_snapshot`, `rpc_analytics_cs_snapshot` e
`rpc_analytics_finance_snapshot`, através de `analytics-api.ts`.

Há conversões defensivas nos mappers de Analytics (`Record<string, unknown>`),
com fallback de números ausentes para zero. Isso evita quebra visual, mas pode
transformar indisponibilidade em aparência de dado válido. A regra de negócio
continua corretamente no backend; o próximo lote deve explicitar o contrato de
`missing`, `partial`, `stale` e `ready` antes de mudar a UI.

## Fontes de dados

| Domínio | Fonte/read model observado | Semântica atual |
| --- | --- | --- |
| Comercial | Cache de deals HubSpot e RPC comercial | Período e pipelines selecionados |
| CS | Cache de tickets HubSpot e RPC de CS | Período e pipelines selecionados |
| Financeiro | Títulos/read model OMIE, reconciliação HubSpot e RPC financeiro | Mistura de recorte temporal com posição atual |
| Sincronização | `analytics_sync_runs` e configuração de schedule | Última execução registrada; não prova que o scheduler está ativo |
| Catálogo | `analytics_source_config` e estágios sincronizados | Alias local + rótulo oficial HubSpot quando sincronizado |

Estado observável no banco local utilizado para QA: `17` pipelines ativos
configurados, `0` deals, `0` tickets e `0` registros financeiros. Portanto, as
capturas atuais validam corretamente o estado vazio, mas não validam totais
positivos nem reconciliação contra dados reais.

## HubSpot e pipelines

O cliente server-side usa token gerenciado por Vault/RPC, com fallback de
ambiente somente no worker; o frontend não recebe o token. A sincronização
consulta catálogos, estágios, empresas, deals e tickets, usa cursor/paginação,
particiona tickets quando necessário e mantém cache local com histórico de runs.

Pontos relevantes para o próximo ciclo:

- deals fazem carga completa por pipeline; empresas e tickets usam incremental
  com sobreposição de cinco minutos;
- não há contrato único de frescor por objeto nem batch transacional comum
  entre HubSpot e OMIE;
- não foi encontrada reconciliação explícita de exclusões para deals/tickets;
- a Visão Executiva seleciona apenas o primeiro pipeline ativo em uma consulta
  legada, enquanto Comercial/CS consideram todos os ativos;
- as telas de CS exibem o filtro “Pipelines incluídos no recorte” com todos os
  pipelines selecionados por padrão, permitindo exclusão temporária no recorte.

### Problema de ocupação dos pipelines

No dataset local de QA, há 17 pipelines configurados e nenhuma linha de deal ou
ticket. A ocupação efetiva é, portanto, `0/17` para os objetos carregados no
cache local. Isso não significa que os pipelines estejam vazios no HubSpot: o
cache local não contém os registros necessários para inferir a ocupação remota.

A UI atualmente tende a apresentar pipeline configurado com contagem zero e
texto de origem indisponível. Essa distinção precisa ser formalizada antes de
qualquer redesign:

1. **sem registros observados** — consulta executada e resultado zero;
2. **não sincronizado** — não há run válido ou o catálogo não foi carregado;
3. **parcial/stale** — run incompleto ou frescor acima do limite;
4. **indisponível** — consulta falhou e o valor não deve ser exibido como zero.

Alternativas avaliadas:

| Alternativa | Benefício | Risco | Recomendação |
| --- | --- | --- | --- |
| A. Manter contagem simples | Baixa mudança | Confunde zero com ausência | Não suficiente |
| B. Badge por estado de sincronização | Clareza sem recalcular | Exige contrato de frescor | Recomendada para primeira fase |
| C. Ocultar pipelines zerados | Menos densidade | Esconde configuração relevante | Não recomendada |
| D. Agrupar por domínio | Boa leitura executiva | Pode perder detalhe operacional | Recomendada para visão executiva |
| E. Drill-down por pipeline | Ação operacional | Maior custo e permissão | Fase posterior |
| F. Snapshot versionado | Consistência | Requer backend/read model | Meta estrutural |

## Indicadores

### Fórmulas observadas

- Pipeline aberto: soma do valor de deals abertos (`amount_home`).
- Receita ganha: soma de deals ganhos.
- Conversão: ganhos dividido por ganhos + perdidos.
- Comercial: totais, abertos, ganhos, receita, conversão e ticket médio.
- CS: tickets totais, abertos, encerrados e taxa de encerramento.
- Financeiro: saldo aberto, vencido, projeções 30/60/90, atraso médio,
  recebido, faturado e participação de carteira.

### Divergências e semântica

- O filtro de período afeta indicadores comerciais e de suporte.
- Saldo vencido, clientes com alerta e projeções são posição atual ou usam
  `current_date`, não necessariamente o fim do período selecionado.
- A tela Financeiro pode parecer filtrada por período enquanto parte dos
  indicadores continua atual; essa diferença precisa de rótulo explícito no
  DASHBOARD-02.
- O fallback de ausência para zero pode ocultar cache incompleto.
- Dados locais atuais não permitem validar numericamente as fórmulas com casos
  positivos.

Não foram alteradas fórmulas, RPCs, views ou contratos neste discovery.

## UX/UI

O shell é funcional, com abas horizontais e estados de vazio contendo o Gênio e
ação de nova tentativa. A hierarquia ainda concentra muitos domínios e blocos
operacionais no mesmo espaço. Recomenda-se discovery de:

- uma camada executiva com poucos sinais decisivos e divulgação progressiva;
- separação persistente entre “desempenho no período” e “posição atual”;
- explicação de origem/frescor próxima ao número, não escondida em metadados;
- alerta operacional distinto de zero legítimo;
- ação seguinte clara para resolver divergência, sincronização ou reconciliação;
- exportação que preserve o recorte e indique as fontes incluídas.

As capturas públicas da Central foram usadas apenas para verificar que a release
continua disponível; nenhuma superfície da Central foi modificada nesta branch.

## Responsividade

Capturas autenticadas do viewer foram geradas em `1440`, `1366`, `1024`, `768`
e `390` px. Não houve overflow horizontal detectado pelo teste DOM nas cinco
larguras. A navegação do viewer ficou restrita à área Dashboard nas capturas.

Pontos para a próxima implementação:

- manter abas em rolagem horizontal acessível em telas estreitas;
- preservar valores tabulares sem corte e preferir divulgação progressiva;
- testar gráficos e tabelas com dados reais, pois o estado vazio não exerce a
  mesma pressão de layout;
- validar 1024 px com todos os KPIs e filtros populados;
- testar teclado, foco e leitura de status durante atualização parcial.

## Permissões

### Confirmado

- `dashboard_viewer` acessa `/admin/analytics` nas capturas autenticadas;
- menu visível contém apenas Dashboard gerencial;
- shell oculta Logs e Configuração para esse perfil;
- ações de exportação e sincronização manual estão condicionadas a
  `platform_admin` no frontend;
- `AdminGate` e `internal-route-access` redirecionam o viewer para a rota
  autorizada quando necessário;
- RPCs de escrita e funções de sincronização exigem privilégio administrativo.

### Risco estrutural

A migration `20260722221746_internal_profile_screen_access_contract_v1.sql`
registra para `dashboard_viewer` os grants `home`, `analytics`,
`customer_portal_admin`, `knowledge` e `settings`. O frontend neutraliza parte
disso com tratamento especial, mas o catálogo/grant backend não expressa o
escopo mínimo fixado pelo produto. Além disso, `can_read_analytics()` fornece
leitura mais ampla do que o mínimo necessário ao Dashboard, incluindo tabelas
analíticas e configurações. Isso exige lote específico de autorização/RLS;
não foi alterado neste discovery.

## Testes

Validações realizadas nesta auditoria:

- fixture local autenticada `dashboard_viewer` criada e acessada;
- smoke Playwright das rotas públicas da Central e do Dashboard;
- capturas autenticadas em cinco larguras, com verificação de overflow;
- capturas de estado vazio, carregamento interrompido/indisponível e tema dark
  em ambiente local, sem alteração de código;
- inspeção de console e request failures nas capturas públicas: sem erros;
- inventário de testes Node: 34 testes no total, 6 diretamente ligados ao
  Dashboard; 15 testes focados pertinentes passaram na auditoria executada;
- testes de banco estruturais/contratuais disponíveis; não há regressão E2E
  para a combinação scheduler diário + ativo;
- nenhum teste ou fixture escreveu em HubSpot/OMIE remoto.

Limitação: o estado local vazio não permite afirmar comportamento de KPIs
positivos, tabelas preenchidas, densidade real dos pipelines ou reconciliação
financeira com dados produtivos. A captura de erro foi feita abortando requests
locais e resultou em fallback de carregamento; isso evidencia uma limitação de
estado/fallback, não um erro de produção reproduzido.

## Riscos

1. Zero pode mascarar ausência, cache incompleto ou falha de consulta.
2. Frescor é implícito; não há contrato por objeto e por pipeline.
3. Scheduler produtivo não está comprovado apenas pelo código/repositório.
4. Promise.all de fontes secundárias pode derrubar a visão executiva inteira.
5. Mappers permissivos reduzem ruptura visual, mas escondem drift de contrato.
6. Viewer tem grants de tela e leitura mais amplos do que o escopo de produto.
7. HubSpot não possui reconciliação explícita de exclusões em todos os objetos.
8. Erro remoto pode carregar trecho do corpo upstream na mensagem do worker.
9. A suíte CI não executa todos os testes Node nem possui E2E autenticado do
   Dashboard; também não cobre viewer, estados, responsividade e scheduler.

## Recomendação

Não iniciar implementação visual ampla sem primeiro fechar um contrato de
frescor/estado e uma matriz de indicadores. A primeira entrega do DASHBOARD-02
deve ser uma camada de confiabilidade e clareza operacional, mantendo RPCs e
fontes até que a matriz de discrepâncias seja aprovada.

## Backlog por fases

### Fase 0 — Contrato e segurança

- definir `ready/empty/partial/stale/error/unavailable` por fonte e pipeline;
- corrigir o catálogo de grants do `dashboard_viewer` e revisar
  `can_read_analytics()`/RLS em lote separado;
- definir classificação de dados atuais versus dados do período;
- documentar limite de exposição em `vw_admin_managed_integrations`.

### Fase 1 — Confiabilidade de dados

- snapshot versionado e frescor por objeto/pipeline;
- batch/run correlation comum entre ingestões;
- reconciliação de exclusões HubSpot;
- telemetria de falhas, atraso e cobertura;
- regressão E2E do scheduler diário + ativo, sem executar escrita externa.

### Fase 2 — Experiência executiva

- reorganizar KPIs por decisão e risco;
- explicitar posição atual versus desempenho no período;
- mostrar estado do dado junto ao indicador;
- reduzir densidade por divulgação progressiva;
- comparar períodos somente após validar a semântica temporal.

### Fase 3 — Operação por pipeline

- ocupação e frescor por pipeline;
- agrupamento por domínio e drill-down seguro;
- filtros preservando URL/estado;
- exportação com proveniência e recorte auditável.

### Fase 4 — QA contínuo

- Playwright autenticado para perfis e rotas;
- estados loading/empty/error/retry;
- matriz 1440/1366/1024/768/390 com dados preenchidos;
- console, rede, overflow, acessibilidade e smoke pós-deploy.

## Relatório

Este documento é o relatório canônico do discovery. Ele registra o estado
observado após o merge da RELEASE-01 e não autoriza implementação, alteração de
contratos, RLS, migrations ou fontes de dados. As recomendações devem ser
convertidas em plano próprio antes de qualquer código.

## Evidências

Screenshots versionados em
`docs/reports/dashboard-02-discovery/screenshots/`:

- `dashboard-viewer-1440.png`, `dashboard-viewer-1366.png`,
  `dashboard-viewer-1024.png`, `dashboard-viewer-768.png`,
  `dashboard-viewer-390.png` — perfil `dashboard_viewer`;
- `dashboard-empty-1440.png` — estado vazio local;
- `dashboard-loading-1440.png` — carregamento inicial;
- `dashboard-error-1440.png` — request local abortado, fallback observado;
- `dashboard-filters-1440.png` — superfície e controles do recorte;
- `dashboard-dark-1440.png` — tema dark interno;
- `help-home-1440.png`, `help-home-390.png`, `help-articles-1440.png`,
  `help-article-1440.png` — smoke visual da Central pública.

`help-article-1440.png` representa uma rota de artigo inexistente/not-found,
não um artigo preenchido. Nenhuma evidência utiliza credencial, token ou
payload produtivo.

## Commits

- `docs(dashboard): auditar funcionalidades arquitetura e experiencia` —
  relatório e evidências documentais desta branch.

## Estado do Git

## Implementação DASHBOARD-02.1

O contrato de estados, a matriz temporal, o inventário de pipelines, as
restrições do `dashboard_viewer`, as fixtures locais e o blueprint de UX/UI
foram consolidados nos relatórios `DASHBOARD_02_FOUNDATION_2026-07-24.md`,
`DASHBOARD_02_PIPELINE_INVENTORY_2026-07-24.md` e
`DASHBOARD_02_UX_BLUEPRINT_2026-07-24.md`. Esta atualização não reabre o
discovery nem altera a Central de Ajuda, Knowledge ou Taxonomia.

- Branch: `codex/dashboard-02-discovery`.
- Base: `main` em `e9f59162a84d85ffdbc10a0efb020769cd6a74fa`.
- HEAD final: preenchido após o commit documental.
- `origin/main`: `e9f59162a84d85ffdbc10a0efb020769cd6a74fa`.
- Push desta branch: realizado após a validação, sem PR.
- Working tree: deve permanecer limpo.
- Alterações funcionais: nenhuma.
- Stash: preservado fora deste lote; não aplicado.
