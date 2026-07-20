# Genius Support OS — Plano operacional vivo

## Ciclo de normalização do índice Git (Claude) — 2026-07-20

### Feito

- Diagnóstico: índice congelado em 17/07 + `index.lock` obsoleto produziam
  staging fantasma de 232 arquivos e falso "untracked" das migrations/testes.
- Confirmado por `git ls-tree b7ce25e`: o commit contém os 16 arquivos de
  Analytics, as 47 migrations (20260716–20260720) e os 11 testes pgTAP (049–059).
- No host (Desktop Commander): removido o lock obsoleto (sem processo git ativo)
  e executado `git reset --mixed HEAD`; working tree preservado.
- `.gitignore` recebeu `.playwright-cli/`, `output/playwright/`, `/.tmp-*.txt`,
  `/seed-functional-log.txt`.

### Validado

- Pós-reset no host: staging 0, modificados 0, `git diff --shortstat` vazio
  (árvore idêntica a `b7ce25e`), 27 untracked só de artefatos/temporários + docs.
- Diff de 919 arquivos visto no sandbox era artefato de fim de linha/filemode via
  mount; git nativo do Windows confirma árvore limpa.

### Pendente

- Baseline no host: `web:typecheck`, `web:build`, `supabase:test:db`.
- QA autenticado do Dashboard; sincronização HubSpot; API OMIE; ledger CS Ops.
- Decidir versionamento de `CLAUDE.md` e commit local (sem push) do lote de
  normalização.

## Ciclo de fila financeira agrupada por cliente — 2026-07-19

### Feito

- A fila de qualidade passou a carregar grupos por cliente na nova RPC
  `rpc_analytics_ceo_reconciliation_quality_grouped`.
- O resumo preserva saldo total, quantidade de titulos, vencimento mais antigo
  e mais recente, status de reconciliacao e candidatas HubSpot.
- Cada grupo mantem os titulos financeiros em detalhes expansíveis; nenhum
  registro de origem foi removido ou alterado.
- A unificacao continua auditada e manual, agora apresentada uma vez por
  cliente ambiguo.

### Validado

- Restoque retornou 1 grupo, 7 titulos, R$ 35.000,00 e 3 candidatas para o
  filtro por CNPJ/nome.
- `npm run web:typecheck` passou.
- `npm run web:build` passou; permanecem apenas os avisos conhecidos de chunks
  Vite acima de 500 kB.
- `npx supabase db lint --local` passou com os avisos preexistentes de
  `v_actor` nao lido.

### Pendente

- Validar visualmente a nova tabela no Chrome com os dados completos do ambiente
  que estiver sendo usado pelo usuario.
- Considerar paginacao server-side para bases maiores que 1.000 grupos.

## Resolucao de matriz/filial e grupo economico — 2026-07-19

### Feito

- Criada resolução auditável por CNPJ em
  `analytics_company_group_resolution`.
- Registrado o caso informado do Grupo Restoque, com Restoque Atacado como
  matriz e Le Lis Blanc como empresa do grupo.
- A fila exibe `Grupo econômico`, identifica a matriz e não oferece merge para
  empresas cobertas por uma resolução humana.
- Os KPIs executivos passaram a descontar essas ocorrências das ambiguidades.
- O caminho de reconciliação do snapshot foi otimizado para evitar timeout com
  milhares de empresas e títulos.

### Validado

- Grupo Restoque: 7 títulos resolvidos, R$ 35.000,00 e 3 candidatas exibidas.
- Snapshot: 7 títulos de grupo econômico, 89 ambiguidades reais e 214 sem
  correspondência.
- Validação visual local confirmou a presença do indicador `Grupos econômicos
  resolvidos` no Dashboard Gerencial.

### Pendente

- Cadastrar novos grupos somente após confirmação humana ou sincronização de
  associações matriz/filial do HubSpot.

## Ciclo de consolidação CS por status e responsável — 2026-07-19

### Feito

- O alias interno passou a ser opcional. A fonte exibe Area, Tipo, ID, nome
  oficial do HubSpot em modo somente leitura e alias; sem alias, o nome
  oficial e usado no dashboard.
- O periodo agora e compartilhado pelo shell do Dashboard Gerencial entre
  Visao Executiva, Comercial, CS / Suporte e Financeiro.
- O shell global moveu tema e usuario para o header, deixando a sidebar
  exclusivamente para navegacao.
- Foi criado o contrato do papel `dashboard_viewer` para acesso restrito a
  Dashboard operacional, Area do cliente e Central de ajuda; o seed por email
  aguarda a existencia do auth user para aplicar o papel sem senha hardcoded.
- A visao historica executiva foi registrada em
  `docs/reports/CEO_EXECUTIVE_HISTORY_PLAN_2026-07-19.md`.
- O read model de CS agora resolve o alias com fallback server-side para o
  nome oficial do HubSpot e, por ultimo, para o ID do pipeline.
- O acesso `dashboard_viewer` foi validado no banco local; a concessao por
  e-mail esta registrada, mas a conta/autenticacao de Mauricio depende do
  fluxo seguro de convite.

- A migration incremental `20260719200000_analytics_cs_owner_pipeline_breakdown_fix_v1.sql`
  reaplica o detalhamento de responsaveis por pipeline, evitando que o mesmo
  pipeline seja repetido no tooltip ou na lista explicativa.

- O snapshot CS agora consolida estágios com o mesmo nome entre pipelines antes
  de devolver `by_status`.
- O filtro de status aceita o conjunto de IDs dos estágios equivalentes, sem
  perder o comportamento dos filtros existentes.
- Responsáveis com o mesmo nome são consolidados antes de `by_owner`; o total
  não se repete por pipeline.
- Status e responsáveis continuam carregando `pipeline_breakdown`, permitindo
  explicar no tooltip e no detalhamento em quais pipelines cada contagem foi
  encontrada.

### Validado

- Migration `20260719193000_analytics_cs_consolidated_breakdowns_v1.sql`
  aplicada localmente.
- `supabase/tests/053_analytics_filtered_snapshots.sql`: 8 testes aprovados.
- `supabase/tests/057_analytics_cs_pipeline_exclusion_filter.sql`: 4 testes
  aprovados.
- `npm run web:typecheck` e `npm run web:build`: sucesso.
- `npx supabase db lint --local`: executado com somente warnings preexistentes
  de `v_actor` não lida.

### Atenção

- O novo detalhamento será visível depois que a página recarregar consumindo o
  RPC atualizado. Não houve alteração de tickets nem de pipelines no HubSpot.

## Ciclo de origem estruturada, identidade visual e mascote — 2026-07-19

### Feito

- O hint de origem de cada pipeline CS / Suporte foi reorganizado em blocos:
  pipeline e ID, evidência usada, distribuição observada, cobertura e limites
  da interpretação.
- A tela deixa explícito que `source_type` informa um canal genérico, mas não
  prova sozinho o widget, formulário, URL, inbox ou número de WhatsApp de
  entrada.
- O campo de configuração passou a ser apresentado como `Alias interno`,
  separado conceitualmente do ID imutável do pipeline no HubSpot. O alias é o
  nome usado nos gráficos e na leitura operacional; salvar não altera o
  HubSpot.
- A configuração agora preserva também `Nome no HubSpot`, preenchido pela
  definição oficial do pipeline durante a sincronização. A UI mostra lado a
  lado o nome oficial, o alias interno e o ID.
- A paleta observada no site oficial foi adicionada como aliases de tokens para
  novas superfícies: azul `#1C326F`, rosa `#E10098`, ciano `#6AD1E7` e apoio
  `#EBEFFB`. Os tokens existentes do Design System permanecem preservados para
  evitar uma troca global não validada.
- O Gênio local passou a ter um componente reutilizável com flutuação, brilho e
  partículas discretas, com suporte a `prefers-reduced-motion`.

### Pendente / backlog

- Adicionar exportação do recorte filtrado do dashboard em PNG e PDF, mantendo
  período, filtros, fonte, data de atualização e aviso de dados indisponíveis.
- Avaliar compartilhamento por e-mail com snapshot auditável ou link seguro,
  sem enviar dados sensíveis por padrão.
- Para responder a origem específica (widget, formulário, site ou WhatsApp),
  ampliar o adapter HubSpot com metadados de canal/formulário somente após
  confirmar quais propriedades estão preenchidas no portal.
- Avaliar uma versão Lottie/Rive do Gênio para efeitos mais ricos; a versão
  atual em SVG/CSS é a opção leve e acessível para o produto.

### Validado neste lote

- `npm run web:typecheck`: sucesso.
- `npm run web:build`: sucesso, com o warning já conhecido de chunks acima de
  500 kB.
- Migration `20260719180000_analytics_source_pipeline_names_v1.sql` aplicada
  no banco local sem reset; a coluna `hubspot_pipeline_label` foi confirmada.
- `npx supabase db lint --local`: executado; somente os avisos preexistentes de
  variáveis `v_actor` não lidas permaneceram.
- `git diff --check` nos arquivos alterados: sucesso; os avisos restantes são
  apenas conversão LF/CRLF do worktree Windows.
- Smoke visual local em `/login`: Gênio animado visível, cartão e controles sem
  deslocamento ou overflow.

## Ciclo de seleção de pipelines CS — 2026-07-19

### Feito

- A edição de fontes em `/admin/analytics` passou a permitir habilitar ou
  desabilitar cada pipeline pelo campo `Ativo`.
- A aba `CS / Suporte` passou a carregar os pipelines de tickets ativos e
  permitir exclusão temporária por checkbox, sem alterar a configuração
  persistida.
- Cada pipeline agora possui hint contextual de origem, calculado a partir da
  distribuição de `source_type` dos tickets no período selecionado. `CHAT` é
  descrito como chat/widget, `FORM` como formulário e `EMAIL` como e-mail;
  ausência de `source_type` permanece explicitamente não confirmada.
- O RPC CS recebeu filtro server-side de exclusão de pipelines, com wrapper de
  quatro argumentos para compatibilidade com clientes antigos.
- Migration criada e aplicada localmente:
  `20260719155547_analytics_cs_pipeline_exclusion_filter_v1.sql`.
- Relatório: `docs/reports/CS_PIPELINE_SELECTION_FILTER_2026-07-19.md`.

### Validado

- Snapshot autenticado local de julho/2026: 286 tickets com todos os pipelines
  ativos e 40 ao excluir o pipeline `5034314`.
- `supabase/tests/053_analytics_filtered_snapshots.sql`: 8 testes aprovados.
- `npm run web:typecheck`: sucesso.
- `npm run web:build`: sucesso, com apenas o warning conhecido de chunk grande.

### Atenção

- A migration foi aplicada somente no banco local; não houve deploy ou
  alteração remota.
- O estado dos checkboxes é temporário por carregamento da tela. Para excluir
  definitivamente uma fonte do escopo, o administrador deve desmarcar `Ativo`
  na aba Configuração e salvar.

## Ciclo CS Support multi-pipeline e fila de reconciliação — 2026-07-19

### Feito

- Confirmada via HubSpot live a atividade de Rodolfo Turra: owner `298856506`,
  143 tickets criados no mês no pipeline `5034314`.
- Corrigida a seleção legada que explicava os 12 tickets: `1429283` ficou
  inativo e cinco pipelines operacionais de CS foram configurados.
- Criada a aba `Configuração` dentro do Dashboard Gerencial para consultar e
  ajustar as fontes por área, tipo, ID e rótulo.
- CS/CEO agora expõem tickets criados, pipeline, origem e responsável.
- Criada fila server-side de qualidade financeira para títulos reconciliados,
  sem correspondência e ambíguos, com busca, links e unificação confirmada.

### Validado

- Migration `20260719022422_analytics_cs_pipeline_config_and_reconciliation_queue_v1.sql`
  aplicada no banco local.
- RPC de qualidade autenticado no fixture local retornou 3.070 títulos, 2.617
  reconciliados, 217 sem correspondência e 236 ambíguos.
- `npm run web:typecheck`: sucesso.
- `npm run web:build`: sucesso.
- `npx supabase db lint --local`: sucesso com os avisos preexistentes de
  variáveis `v_actor` não lidas.

### Atenção

- O cache local ainda não contém os tickets dos novos pipelines; é necessário
  executar uma sincronização HubSpot pela interface para atualizar o read model.
- Os totais podem variar da fotografia anterior (214/234) quando a planilha ou
  o recorte de datas mudar; a fila mede títulos, não clientes.
- Nenhuma unificação é automática e nenhuma alteração foi feita no HubSpot
  neste ciclo.

### Correção de normalização da fila CS Ops — 2026-07-19

- Corrigida a normalização de IDs exportados como número decimal pelo Google
  Sheets (por exemplo, `4147148759.0`); o sufixo `.0` é removido antes da
  comparação com IDs do HubSpot.
- Recalculada a fila somente de leitura: 307 matches únicos (301 ativos),
  19 ambíguos e 280 sem correspondência (273 ativos), totalizando 606 linhas
  e 593 ativas.
- O relatório corrigido é
  `docs/reports/HUBSPOT_CS_SHEET_RECONCILIATION_QUEUE_2026-07-19.md`.

## Decidido

- O dashboard será construído dentro do GSO Old em `/admin/analytics`.
- HubSpot, planilhas e Omie serão adapters de ingestão; o dashboard consumirá
  read models locais. Para CS, o HubSpot será a fonte operacional única após a
  migração; a planilha será staging temporário e não uma segunda fonte de
  operação.
- O HubSpot será configurável por pipe e não ficará preso ao pipe legado
  `892833861`.
- Omie começará em modo read-only e será habilitado com App Key/App Secret
  somente depois que o Financeiro disponibilizar as credenciais.
- A configuração das integrações ficará na aba existente `/admin/settings`.
- Segredos serão tratados apenas server-side; a UI verá somente estado,
  máscara e data de atualização.
- Planilha manual continuará disponível como fallback durante a implantação da
  API Omie.

## Executado e validado

- Takeover e handoff documentados em
  `docs/reports/CODEX_CONTINUATION_HANDOFF_2026-07-17.md`.
- Banco local do GSO Old reidratado com migrations e seed.
- `/admin/tenants` e `/admin/analytics` validados com sessão administrativa.
- HubSpot conectado em leitura: 2.015 Deals; pipes atuais e 22 pipes de
  Tickets catalogados.
- Exportação Omie analisada: 3.077 linhas de Contas a Receber, R$
  3.997.092,79 em valor líquido e R$ 2.546.340,20 recebidos.
- Auditoria Omie registrada em
  `docs/reports/OMIE_FINANCE_SOURCE_AUDIT_2026-07-18.md`.

## Em execução neste ciclo

- Materializar configuração segura e não sensível das fontes no backend.
- Expor configuração, status e última execução em `/admin/settings`.
- Preparar contrato de importação manual da planilha Omie e fonte de planilha
  comercial/CS.
- Preparar adapter read-only Omie sem exigir credenciais agora.
- Corrigir a seleção de pipes HubSpot para refletir os pipes ativos reais.

## Pendente

- App Key/App Secret do Omie e autorização do Financeiro.
- Decisão de quais pipes HubSpot representam Comercial, CS e Suporte para o
  painel oficial.
- Repositório/organização GitHub da Janaína para o domínio Produto.
- Contrato de métricas de Produto, Financeiro, onboarding e inadimplência.
- Scheduler externo ou pg_cron para atualizações recorrentes.

## Ciclo de analises filtraveis - 2026-07-18

### Feito

- Criados os RPCs `rpc_analytics_commercial_snapshot` e `rpc_analytics_cs_snapshot`, com agregacao server-side e filtros por periodo, responsavel/estagio e prioridade.
- O dashboard passou a oferecer navegacao historica por intervalo de datas, selecao de responsavel, estagio/status e prioridade quando a fonte fornece o valor.
- O estado sem dados deixou de exibir KPIs falsamente zerados: o recorte agora informa explicitamente que nao ha dados e preserva os filtros para nova consulta.
- Erros HTTP da sincronizacao agora exibem o status sanitizado retornado pelo backend, sem expor credenciais ou payload sensivel.

### Validado

- `npm run supabase:db:reset`: migrations aplicadas, incluindo os novos RPCs.
- `npm run supabase:test:db`: 56 arquivos, 1.131 testes, sucesso.
- `npm run web:typecheck` e `npm run web:build`: sucesso.
- `git diff --check`: sem erros de whitespace; warnings de conversao LF/CRLF sao preexistentes do worktree Windows.
- Sincronizacao local do HubSpot: HTTP 200, 1.148 deals, 739 tickets, 31 responsaveis e 17 estagios.
- Validacao no navegador: dashboard comercial com dados historicos, filtro por estagio `Ganho` (8 deals, 100% conversao) e dashboard CS com 739 tickets.

## Ciclo financeiro read model - 2026-07-18

### Feito

- Criado o read model financeiro de Contas a Receber, com provenance de importacao, situacao original, saldo, aging, cliente e datas.
- Criado o RPC `rpc_analytics_finance_snapshot`, com filtros server-side por periodo, situacao, aging e cliente.
- Adicionada a area Financeiro ao dashboard gerencial.
- Importada a exportacao real do Omie: 3.077 titulos, R$ 3.997.092,79 liquidos e R$ 1.455.040,79 de saldo calculado.

### Validado

- `npm run supabase:test:db`: 57 arquivos, 1.138 testes, sucesso.
- `npm run web:typecheck` e `npm run web:build`: sucesso.
- Snapshot autenticado sem filtro e com filtro `Atrasado`: 3.077/332 titulos.

### Proximo checkpoint

- Criar importador operacional de XLSX/CSV pela interface, reaproveitando a tabela de staging e mantendo idempotencia por hash.
- Reconciliar a exportacao com a API Omie quando as credenciais forem disponibilizadas.

### Proximo checkpoint

- Adicionar read models de Financeiro/Produto e filtros proprios quando as fontes forem persistidas; nenhuma area sem fonte confirmada sera preenchida com mock.

## Bloqueado

- Consulta autenticada ao Omie: bloqueada por ausência de credenciais; o código
  pode ser preparado, mas a validação real da API só ocorrerá após configuração.
- Escrita de credenciais em secrets, deploy remoto e sincronização externa real:
  bloqueados até configuração autorizada.

## Ciclo OMIE — hardening da importação de planilhas - 2026-07-18

### Feito

- O importador agora valida extensão e planilha vazia antes de criar lote.
- Linhas sem cliente, situação ou valor líquido válido ficam no staging como
  rejeitadas e não entram no read model financeiro.
- Lotes parciais e falhos passaram a ter status e mensagem de erro explícitos.
- A interface foi corrigida para usar OMIE, sem alterar a fonte original.
- Relatório: `docs/reports/OMIE_SPREADSHEET_IMPORT_HARDENING_2026-07-18.md`.

### Validado

- 7 testes Node de Omie/comercial aprovados.
- `npm run web:typecheck` aprovado.
- `npm run web:build` aprovado.

### Atenção

- O runtime local não possui `deno` nem o binário `supabase`; a Edge Function
  ainda precisa de validação ponta a ponta com sessão `platform_admin`.
- Nenhum upload real foi executado neste lote; o próximo passo é validar a
  planilha OMIE real e repetir o mesmo arquivo para confirmar idempotência.

## Gates deste ciclo

## Fechamento do ciclo 2026-07-18

### Feito

- Criados `docs/spec.md`, `docs/plan.md` e o plano executável em
  `docs/superpowers/plans/2026-07-18-integrations-configuration-and-management-dashboard.md`.
- Criada a migration `20260718034735_managed_integrations_v1.sql` com RLS,
  Vault, view administrativa sem segredo descriptografado e RPCs separadas para
  administração e leitura server-side.
- Criada a tela de integrações em `/admin/settings`, incluindo HubSpot, Omie,
  planilhas CS/comercial e GitHub como fontes configuráveis.
- HubSpot passou a resolver a credencial do Vault antes do fallback de ambiente.
- Criados normalizador do export Omie, cliente read-only da API e Edge Function
  `omie-sync`, sem exigir credencial real nesta etapa.

### Validado

- `npm run supabase:verify`: reset local, 54 arquivos, 1.121 testes, sucesso.
- `npm run supabase:lint:db`: sucesso, com warnings preexistentes de variáveis
  `v_actor` não lidas em RPCs antigas.
- `npm run contracts:typecheck`, `npm run web:typecheck` e `npm run web:build`:
  sucesso. O build mantém apenas warning de chunk grande do Analytics.
- Testes Node de parsers/Omie: 7 testes, sucesso.

### Próximo checkpoint

- Adicionar o read model financeiro persistente e importar o XLSX Omie com hash,
  provenance e qualidade de linha.
- Construir o importador XLSX/Google Sheets manual para as fontes CS e comercial.
- Expor seleção editável de pipes HubSpot na configuração, após confirmar com o
  gestor os pipes oficiais de Comercial, CS e Suporte.
- Na segunda-feira, cadastrar App Key/App Secret do Omie e validar a chamada
  real read-only; nenhuma credencial real foi gravada neste ciclo.

## Correção de sincronização HubSpot - 2026-07-18

- Causa raiz da falha inicial: a chave pessoal criada no Developer Overview
  retornou 401 na REST API; ela é apropriada para o HubSpot CLI, não para o
  conector REST do GSO.
- Correção: criada a Service Key `GSO Old Analytics Readonly` com escopos
  mínimos de Deals, Owners, schema de Deals e Tickets; a chave foi validada com
  HTTP 200 em Deals, Tickets e Owners e armazenada no Vault local.
- Causa raiz de lentidão do Suporte: o pipe legado `5034314` fazia a função
  varrer 27.530 tickets antes de filtrar.
- Correção: `fetchTicketsByPipeline` passou a usar Search API filtrada e a
  configuração de CS foi alinhada ao pipe `1429283` (`CS | Neotrust`).
- Evidência da sincronização completa: `deals=1148`, `tickets=739`,
  `owners=31`, `stages=17`, HTTP 200.
- O pipe oficial de Suporte B2B/B2C permanece pendente de decisão de domínio;
  não foi inferido automaticamente.

- Testes unitários dos parsers e normalizadores.
- `npm run contracts:typecheck`.
- `npm run web:typecheck`.
- `npm run web:build`.
- `npm run supabase:lint:db`.
- `npm run supabase:test:db`.
- `npm run supabase:verify`.
- Smoke autenticado de `/admin/settings` e `/admin/analytics`.
- `git diff --check` e preservação do worktree misto.
## Ciclo financeiro - importação operacional de planilhas - 2026-07-18

### Feito

- Criada a Edge Function `analytics-spreadsheet-import`, protegida por `platform_admin`, para receber XLSX/CSV da fonte Omie, calcular SHA-256 e rejeitar lotes repetidos.
- O lote registra arquivo, hash, versão do mapeamento, contagem, status e usuário executor em `analytics_spreadsheet_import_runs`; as linhas brutas ficam em `analytics_spreadsheet_rows`.
- O mapeamento Omie V1 atualiza `analytics_finance_receivables` por `source_key + source_record_id`, preservando o histórico de execuções.
- A área Financeiro ganhou upload controlado e histórico dos últimos lotes.

### Validado

- `npm run web:typecheck` passou.
- `npm run web:build` passou; permanece apenas o warning já conhecido de chunks grandes do Vite.
- `git diff --check` não apontou erro de whitespace nos arquivos avaliados.

### Atenção

- A função foi preparada no repositório, mas não foi chamada pela interface nesta rodada porque a sessão autenticada do navegador expirou; a validação de ponta a ponta depende de iniciar a sessão administrativa local.
- A fonte operacional aprovada nesta primeira versão é a exportação de Contas a Receber da Omie. CS e Comercial continuam com seus contratos de staging, mas exigem mapeamentos específicos antes de publicar métricas.

### Próximo checkpoint

- Validar upload real no ambiente local com o fixture `platform_admin`, incluindo repetição do mesmo hash e inspeção do lote criado.
- Reconciliar os aliases de cabeçalho do parser com os nomes reais de cada exportação OMIE e adicionar teste de contrato com cabeçalho Unicode.
- Depois, evoluir a configuração de fonte na aba Admin > Configurações para permitir selecionar mapeamento/aba sem alterar código.
## Ciclo visão executiva e transparência de métricas - 2026-07-18

### Feito

- Criado `rpc_analytics_ceo_snapshot`, consolidando HubSpot Comercial, HubSpot CS/Suporte e OMIE Financeiro em um contrato backend único.
- Acrescentados indicadores executivos: pipeline aberto, receita ganha, conversão, ticket médio, ciclo médio de vendas, deals sem responsável, tickets críticos, cobertura de SLA, saldo financeiro e saldo em atraso.
- Criada a aba `Visão executiva` com filtros de período e explicações de fonte/cálculo nos ícones de informação.
- Adicionados presets de período: semana, mês, trimestre atual, trimestre passado, ano atual, ano passado e todo o período.
- A visão executiva inicia no mês atual por padrão e mantém o intervalo selecionado sincronizado com o backend.
- O endpoint local da Edge Function de importação foi iniciado; o 404 anterior era ausência do servidor local de Functions, não falha do arquivo.

### Validado

- RPC autenticado retornou 1.148 deals, 739 tickets e 3.077 títulos no recorte completo.
- `npm run web:typecheck` passou.
- `npm run web:build` passou.
- Endpoint local `OPTIONS /functions/v1/analytics-spreadsheet-import` respondeu HTTP 200.

### Atenção

- A validação do POST do upload depende da sessão administrativa autenticada no navegador; o servidor local agora está disponível.
- Os campos de SLA do HubSpot estão presentes em parte dos tickets, mas o dataset atual não traz duração em minutos; por isso o CEO vê cobertura dos campos, não tempo médio inventado.
## Decisão de fonte híbrida para CS - 2026-07-18

### Decisão

- O HubSpot continua sendo a fonte primária para tickets, pipeline de atendimento, status, prioridade e campos de SLA que estejam preenchidos.
- A planilha do CS será uma fonte complementar temporária para dados de carteira, cliente, cluster, MRR, risco e evolução da migração Genius V1 → After Sale V2 quando esses campos não existirem ou estiverem incompletos no HubSpot.
- A ausência de um valor no HubSpot não será convertida automaticamente em zero. O read model deverá distinguir `preenchido`, `ausente_na_fonte` e `não_aplicável`.
- O dashboard exibirá a origem de cada indicador e manterá a data/hash da importação da planilha.

### Regra de composição

1. Identificar o cliente por `HubSpot_ID` quando disponível; `Cliente_ID` será a chave auxiliar da planilha.
2. Para atendimento, contar tickets somente do read model HubSpot; a planilha enriquece o contexto, mas não duplica tickets.
3. Para carteira/migração/MRR/cluster, usar a planilha enquanto o contrato correspondente não existir no HubSpot.
4. Quando as duas fontes tiverem o mesmo campo, preservar os dois valores e marcar `source_system`; não sobrescrever silenciosamente.
5. Conflitos de cliente ou divergências de data entram em uma fila de qualidade para revisão, não em uma métrica executiva automática.

### Cobertura conhecida da planilha

- O catálogo interno aponta as abas `Dashboard_CS`, `BD_Clientes`, `Clusters`, `Contato_Inicial_CS` e `Dash_Data` como candidatas a read models de CS.
- A estrutura real deve ser revalidada antes do primeiro carregamento, pois a planilha é operacional e pode mudar abas/cabeçalhos.
- A planilha será tratada como fonte temporária; a substituição futura por HubSpot completo ou integração governada não exige mudar os contratos do dashboard.

### Próximo ciclo

- Ler a estrutura atual das abas com acesso autenticado ou exportação revisada.
- Criar mapeamentos versionados por aba e importar para staging com hash/idempotência.
- Materializar um read model CS enriquecido com origem por campo, frescor e status de qualidade.
- Expor no dashboard indicadores de carteira/migração sem misturá-los com tickets do HubSpot.
## Auditoria HubSpot para migração de CS - 2026-07-18

- A estrutura real da planilha CS foi lida nas abas operacionais e documentada em `docs/reports/HUBSPOT_CS_MIGRATION_AUDIT_2026-07-18.md`.
- O portal confirmou objetos e equipes suficientes para a migração, além de propriedades Aftersale já existentes que devem ser reutilizadas antes de criar novas.
- Foi encontrado risco de correspondência: alguns `Hubspot_ID` da planilha não resolvem diretamente no portal. A carga usará CNPJ/nome como fallback controlado e bloqueará ambiguidades.
- Nenhuma alteração externa foi executada neste lote; a próxima etapa é gerar o relatório de correspondência e a amostra de migração.
- A pré-matriz encontrou 7 correspondências por ID, 68 por CNPJ único, 211 por nome único e 320 casos sem correspondência segura; 10 páginas do catálogo HubSpot ainda serão reconsultadas.
- Antes de qualquer escrita, a amostra de propriedades e o relatório antes/depois serão apresentados para confirmação da carga.

## HubSpot como fonte única e migração operacional de CS - 2026-07-18

### Decisão do usuário

- O HubSpot será a única fonte de verdade operacional para CS, atendimento e
  acompanhamento das carteiras depois do corte.
- A planilha `CS Ops | Carteiras e Clusters -v2` será usada somente como staging
  temporário para migrar e reconciliar dados que hoje não estão completos no
  HubSpot.
- A migração precisa ser transparente para agentes, CSMs e gerente: os campos,
  regras, responsáveis e rotina diária serão documentados antes do corte.

### Escopo de migração

- Empresa: carteira, CSM, MRR, cluster, health, prioridade, status de contrato e
  status da migração V1 → V2, reutilizando propriedades Aftersale existentes.
- Atendimento: registros de `Contato_Inicial_CS` serão convertidos para a
  operação de tickets/atividades definida no HubSpot, sem duplicar tickets já
  existentes.
- Projetos e tarefas: permanecem fora da primeira carga até que o objeto e o
  pipeline operacional sejam confirmados; não serão criados registros em alvo
  ambíguo.

### Controle de qualidade e corte

1. Resolver empresa por HubSpot ID; depois CNPJ único; depois nome único apenas
   quando não houver conflito.
2. Rejeitar IDs inválidos, nomes duplicados sem CNPJ e linhas de teste.
3. Produzir relatório de correspondência, campos alterados, rejeições e hash da
   planilha antes de qualquer lote externo.
4. Migrar em lotes pequenos, validar amostra e manter a planilha congelada como
   evidência; após o aceite, orientar o time a atualizar somente o HubSpot.
5. Manter uma fila de exceções para casos sem correspondência segura, sem
   fabricar dados ou sobrescrever a empresa errada.

### Documentação de uso

- Guia operacional: `docs/CS_HUBSPOT_OPERATING_GUIDE.md`.
- O guia cobre agentes de atendimento, CSMs, gerente de CS, rotina pós-corte,
  origem das métricas, qualidade e escalonamento.

## Migração CS Ops para HubSpot - lote 2 - 2026-07-18

### Feito

- Atualizadas 6 empresas existentes no HubSpot, somente no campo
  `aftersale___mrr`, usando valores normalizados da planilha CS Ops.
- O lote foi aprovado explicitamente antes da escrita e limitado a registros
  com correspondência exata e MRR HubSpot vazio.

### Validado

- Retorno da escrita: 6 processados, 6 atualizados e 0 falhas.
- Leitura posterior dos seis IDs: todos encontrados e com os valores esperados.
- Nenhum MRR existente foi sobrescrito; nenhum ticket, pipeline ou empresa foi
  criado.

### Atenção

- A planilha estava filtrada em 187 de 606 linhas; este lote não representa a
  migração integral.
- Conflitos de MRR, nomes variantes, IDs antigos e empresas sem correspondência
  inequívoca continuam pendentes de reconciliação manual ou nova evidência.

### Próximo checkpoint

- Obter a visualização completa das 606 linhas da aba `BD_Clientes`.
- Gerar novo lote de no máximo 10 atualizações somente para correspondências
  seguras e repetir aprovação e leitura de conferência.
- Depois do MRR, migrar campos de carteira/CSM/status apenas após mapear as
  enumerações do HubSpot e validar cada correspondência de responsável.

## Migração CS Ops para HubSpot - carga em massa MRR - 2026-07-18

### Feito

- A aba completa `BD_Clientes` foi lida: 606 linhas; 593 ativas; 327 ativas
  com MRR maior que zero.
- Foram atualizadas 74 empresas existentes no HubSpot, somente no campo
  `aftersale___mrr`, em 8 lotes controlados.
- A confirmação ampla do operador foi aplicada apenas à execução desta fila;
  os critérios de correspondência segura permaneceram ativos.

### Validado

- 74/74 escritas confirmadas pelo retorno do HubSpot.
- 74/74 valores conferidos por leitura posterior.
- 0 falhas.

### Atenção

- 80 registros já possuíam o mesmo valor e não exigiram alteração.
- 54 conflitos de MRR, 34 ambiguidades e 85 sem correspondência segura foram
  mantidos fora da escrita automática.
- A migração de status, carteira, CSM, cluster, saúde, migração e demais
  campos ainda exige mapeamento de propriedades e enumerações antes de nova
  carga. Nenhuma empresa, ticket ou pipeline foi criado nesta etapa.

### Próximo checkpoint

- Gerar relatório operacional das exceções com CNPJ, ID e motivo de bloqueio.
- Mapear propriedades HubSpot para status/CSM/cluster e preparar segunda fila
  somente após validação de enumerações e responsáveis.
- Revisar os 85 casos sem correspondência, priorizando CNPJ e IDs legados.

## Migração CS Ops - prioridade da planilha nos conflitos - 2026-07-18

### Feito

- Aplicada a regra aprovada pelo operador: nos conflitos com identidade segura,
  o valor da planilha passou a prevalecer sobre o HubSpot.
- Atualizadas 54 empresas adicionais no campo `aftersale___mrr`, em 6 lotes.

### Validado

- 54/54 escritas confirmadas pelo HubSpot.
- 54/54 valores conferidos por leitura posterior.
- 0 falhas.
- Resultado acumulado: 128 empresas atualizadas e 154 já iguais à planilha.

### Atenção

- 34 correspondências continuam ambíguas e 85 não possuem correspondência
  segura; nenhuma delas foi gravada no alvo errado.
- Esta rodada finalizou a reconciliação do MRR. A migração de status, tipo de
  MRR, CSM, cluster, saúde, integração e operação exige mapeamento explícito
  entre colunas da planilha e propriedades/enumeracoes do HubSpot.

## Migração CS Ops - campos operacionais e preservação do Suporte - 2026-07-18

### Feito

- Mantida a regra operacional: nenhum Ticket foi criado ou atualizado e nenhum
  pipeline de Suporte foi alterado.
- Reconciliadas 606 linhas de `BD_Clientes` contra empresas HubSpot por nome
  exato, com desempate por `Hubspot_ID` ou CNPJ quando disponível.
- Atualizadas 216 empresas existentes, em 22 lotes de até 10 registros, com os
  campos compatíveis `aftersale___mrr`, `cnpj`, `tipo_de_mrr`,
  `status_do_cliente___aftersale` e `cs_owner___aftersale`.

### Validado

- 216 processados, 216 atualizados e 0 falhas no retorno do HubSpot.
- Conferência posterior de 10 registros: todos encontrados com os valores
  esperados.
- A sessão visual do HubSpot retornou página de erro na configuração de
  Tickets; por segurança, a operação de Suporte permaneceu intocada.

### Atenção

- 29 ocorrências ficaram fora da fila por duplicidade de empresa ou linhas com
  valores conflitantes; não houve escrita em alvo ambíguo.
- Cluster, carteira, health/farol, frequência e status de migração ainda não
  possuem propriedade HubSpot equivalente confirmada nesta rodada.
- A criação dos pipelines de CS está pendente de acesso administrativo à API
  ou à tela de configuração de pipelines. O pipeline de Suporte não será usado
  como substituto.

### Próximo checkpoint

- Criar somente `CS | Onboarding e Migração` e `CS | Gestão de Carteira`, fora
  do pipeline de Tickets de Suporte.
- Resolver exceções e empresas sem correspondência antes de criar novos
  registros; registrar cada novo ID HubSpot em ledger de migração.

## Reestruturação da operação HubSpot - CS e Suporte - 2026-07-18

### Feito

- Confirmada a capacidade atual da conta: Company, Ticket, Contact e Deal com
  leitura/escrita pelo conector.
- Confirmados 242 registros com CSM, 47 com status contratual para revisão e
  213 em status de cliente não ativo ou de exceção.
- Definidas visões para Sirlei, Mary, sem CSM, sem contrato, churn/bloqueio e
  MRR zero.
- Definidos os pipelines de CS `CS | Onboarding e Migração` e
  `CS | Gestão de Carteira`, mantendo Suporte fora da reestruturação.

### Validado

- Consultas autenticadas no portal `20108050`, com totais e URLs de registros
  retornados pelo HubSpot.
- Pesquisa na documentação oficial confirmou que pipelines adicionais de
  Tickets exigem API/UI administrativa e escopo próprio.
- Nenhuma empresa foi excluída ou arquivada e nenhum Ticket/pipeline de
  Suporte foi alterado.

## Pipelines de CS criados no HubSpot - 2026-07-19

### Feito

- Criado o pipeline de Tickets `CS | Onboarding e Migração` no portal
  `20108050`, ID `917379333`.
- Criado o pipeline de Tickets `CS | Gestão de Carteira` no portal `20108050`,
  ID `918901665`.
- Configurados, no primeiro pipeline, os estágios `A iniciar`, `Diagnóstico`,
  `Plano definido`, `Concluído`, `Em execução`, `Aguardando cliente`,
  `Bloqueado` e `Cancelado`.
- Configurados, no segundo pipeline, os estágios `Monitoramento`, `Contato
  programado`, `Plano de ação`, `Concluído`, `Em risco` e `Recuperação`.

### Validado

- O HubSpot exibiu confirmação de sucesso após salvar cada pipeline.
- Os dois nomes e todos os estágios foram confirmados na tela de configuração
  após a gravação.
- Os pipelines de Suporte existentes permaneceram listados: `Criadouro de
  Tíquetes | Aftersale`, `Confi | Whatsapp`, `Suporte B2B | Confi`, `Fale
  conosco | Confi` e `Atendimento | Confi Analytics`.

### Atenção

- Os pipelines foram criados como estrutura operacional; nenhuma empresa, deal,
  ticket ou proprietário foi movido automaticamente para eles nesta rodada.
- A migração da planilha continua exigindo fila por empresa, prioridade da
  planilha em conflitos e ledger com correspondência, criação e exceção.

### Próximo checkpoint

- Gerar a fila final de migração da planilha e separar correspondências seguras,
  empresas sem correspondência e duplicidades para decisão auditável.
- Só depois do ledger validado, preparar o seed da carteira local `/cs/portfolio`
  a partir das empresas HubSpot efetivas, sem criar dados fictícios no frontend.

### Atenção

- O conector desta sessão não expõe criação de pipelines, views salvas,
  permissões de equipe ou propriedades administrativas.
- O navegador não abriu a tela administrativa do HubSpot; a criação efetiva
  requer sessão administrativa autenticada ou credencial com escopo de
  pipelines.
- A limpeza de empresas sem contrato é destrutiva e não será automática.

### Próximo checkpoint

- Após disponibilizar acesso administrativo, criar os dois pipelines de CS e as
  visões salvas por usuário.
- Revisar os 47 registros contratuais antes de qualquer arquivamento.

## Correção da paginação de tickets HubSpot - 2026-07-18

- Diagnóstico: o pipe `5034314` possui 27.538 tickets, acima do teto de 10.000
  resultados da Search API; a mensagem 400 era genérica e ocorria ao paginar.
- Implementado: particionamento recursivo por `createdate`, com filtros
  `GTE`/`LT`, antes de seguir o cursor de cada janela segura.
- Implementado: erro contextual com pipeline e intervalo temporal, para a tela
  de logs do Dashboard Gerencial registrar a causa operacional.
- Validado: nova sincronização autenticada concluída com 10.161 empresas,
  1.148 deals, 33.339 tickets e 38 estágios; o cache por pipeline foi conferido
  e os dados anteriores foram preservados durante a execução.
- Criar as propriedades faltantes de cluster/carteira/health/migração apenas
  depois de confirmar que não existem equivalentes reutilizáveis.

## Fila de reconciliação CS Ops - 2026-07-19

- Executado: leitura autenticada, somente leitura, da aba `BD_Clientes` da planilha `CS Ops | Carteiras e Clusters -v2`, linhas 5-610, contra 10.161 empresas no cache local HubSpot.
- Validado: 606 linhas lidas; 593 ativas; 306 matches únicos; 19 ambiguidades; 281 sem correspondência; IDs históricos não encontrados foram tratados com fallback por CNPJ/nome, sem criação automática.
- Executado: distribuição operacional preservada para futura migração: Rodolfo 257, Mary 187, Sirlei 131, Sem CSM 29; Health Verde 381, Vermelho 190, Amarelo 33.
- Atenção: a escrita em massa ainda precisa de lote idempotente com hash, payload por linha, resultado e retry. Os 19 ambíguos não devem ser unificados automaticamente.
- Atenção: a carteira local continua sem base real (`1` tenant, `0` assinaturas, `0` registros na view); catálogo de produtos/planos e perfis locais de CSM ainda precisam ser governados antes do seed.
- Evidência: `docs/reports/HUBSPOT_CS_SHEET_RECONCILIATION_QUEUE_2026-07-19.md`.
- Próximo checkpoint: implementar o ledger/importador CS Ops e executar primeiro o lote de 306 matches únicos; depois revisar a fila de criação e as ambiguidades.

## Ciclo financeiro OMIE e resiliencia do importador — 2026-07-19

- Corrigido HTTP 546: o parser XLSX anterior estourava CPU/memoria ao carregar
  todas as abas; agora a Edge Function le somente `BD_Clientes` via XML enxuto.
- Validado com o arquivo real: 606/606 linhas aceitas, staging em
  `analytics_spreadsheet_rows` e `sheet_name = BD_Clientes`.
- Financeiro preparado para API OMIE com status de fonte, fallback de planilha,
  `analytics_finance_sync_runs` e persistencia futura de `ListarContasReceber`.
- QA local criado com papel `dashboard_viewer`, sem alterar o acesso real de
  Mauricio.
- Pendente: cadastrar a chave OMIE e publicar as Edge Functions no ambiente
  remoto mediante autorizacao explicita.

## Importador CS Ops - 2026-07-19

- Feito: estendida a Edge Function `analytics-spreadsheet-import` para aceitar `cs_ops_consolidated`, localizar a aba `BD_Clientes`, detectar o cabeçalho e gravar staging auditável.
- Feito: adicionada a ação de importação na aba `Configuração` do Dashboard Gerencial.
- Feito: adicionados mapeamento compartilhado, normalização de CNPJ/HubSpot ID e rejeição de linhas sem identidade.
- Validado: 6 testes unitários passaram; `npm run web:typecheck` passou; `npm run web:build` passou antes do último ajuste, sem regressão no frontend; `git diff --check` passou.
- Atenção: ainda não existe comando de escrita em massa no HubSpot; o importador é deliberadamente staging-only.
- Evidência: `docs/reports/CS_OPS_IMPORT_IMPLEMENTATION_2026-07-19.md`.
- Correção: a Edge Function passou a validar `multipart/form-data`, responder 400 para JSON/multipart inválido e aceitar CSV de aba única quando os cabeçalhos comprovam CS Ops; logs de diagnóstico não registram nome de arquivo nem conteúdo.
- Validado: runtime local iniciou; POST JSON autorizado retornou 400; multipart sem arquivo retornou 400; XLSX válido sem `BD_Clientes` retornou 422 específico.

## Busca e filtro da fila de reconciliação - 2026-07-19

- Feito: a busca da fila de qualidade de dados passou a aplicar debounce de 300 ms, evitando uma consulta a cada tecla digitada.
- Feito: durante a busca e a troca do filtro, o estado existente permanece montado; isso preserva o foco do campo e impede que o card nativo seja desmontado e recolhido.
- Feito: adicionado filtro de grupo econômico com as opções `Todos os grupos`, `Somente matriz/filial` e `Sem resolução de grupo`.
- Feito: a contagem exibida no rodapé da fila acompanha os grupos atualmente visíveis.
- Validado: no navegador, após digitar no campo de busca, o foco permaneceu no input, `qualityOpen` permaneceu `true` e a opção `Somente matriz/filial` ficou disponível.
- Validado: `npm run web:typecheck`, `npm run web:build` e `git diff --check`.
- Atenção: o filtro de grupo é aplicado sobre os grupos retornados pela consulta atual; se a fila crescer além do limite de carregamento, o próximo incremento deve mover esse recorte para o contrato server-side.

## Plano de conclusão integral do backlog - 2026-07-19

- Plano versionado: `docs/superpowers/plans/2026-07-19-gso-backlog-completion.md`.
- Execução iniciada pelo baseline local e pelos contratos seguros de OMIE, migração
  CS Ops, observabilidade, analytics, exportação e governança.
- O baseline encontrou falhas de testes já existentes; a ACL ausente da função
  trigger `apply_dashboard_viewer_email_grant` foi corrigida por migration local.
- Os testes de pipeline CS e cache de empresas permanecem em investigação porque
  refletem contratos que evoluíram para múltiplos pipelines e snapshots reais; não
  serão silenciados apenas para obter uma suíte verde.

## Execução contínua do backlog - baseline e OMIE - 2026-07-20

- Corrigida a suíte de banco: 60 arquivos e 1.154 testes passaram.
- Corrigida a ACL explícita da função trigger de concessão do papel
  `dashboard_viewer`.
- Atualizado o contrato de teste para os seis pipelines CS ativos, sem reintroduzir
  a premissa de pipeline único.
- Corrigido o parser de valores decimais da API OMIE e adicionados timeout e retry
  limitado para falhas transitórias.
- Evidência: `docs/reports/BACKLOG_EXECUTION_BASELINE_2026-07-19.md`.
- Próximo lote local: completar reconciliação do read model OMIE com a planilha,
  depois avançar para ledger CS Ops e observabilidade de sincronizações.
- A Configuração agora lista o último lote CS Ops e permite executar uma simulação
  `dry_run` do ledger; nenhuma escrita no HubSpot ocorre nessa ação.
- O filtro de grupo econômico da fila agora também é aplicado pelo RPC server-side
  antes da paginação, preservando o contrato legado de seis parâmetros.
- Evidência adicional: teste `058_analytics_reconciliation_group_filter.sql`, com
  5 asserções aprovadas.
- Analytics agora oferece exportação CSV do recorte executivo e impressão/PDF pelo
  navegador; a tela de logs ganhou filtro por status e atualização manual.
- ExecuÃ§Ã£o adicional 2026-07-20: criado o read model histÃ³rico `rpc_analytics_ceo_history`, que compara o recorte atual com o perÃ­odo anterior de mesma duraÃ§Ã£o sem duplicar regras no frontend. A VisÃ£o Executiva exibe Receita ganha, ConversÃ£o e Saldo vencido com variaÃ§Ã£o semÃ¢ntica e base comparativa.
- Validado: teste de banco passou com 62 arquivos e 1.164 testes; `npm run web:typecheck` e `npm run web:build` passaram. O build emite apenas o alerta conhecido de chunks acima de 500 kB.
- AtenÃ§Ã£o: PNG/PDF renderizado, ledger de escrita CS Ops, seed da carteira local, origem operacional detalhada de tickets e adapter GitHub permanecem dependentes de contratos/fontes externos nÃ£o confirmados; nÃ£o foram simulados.
- Execucao adicional 2026-07-20: exportacao visual refeita. O Dashboard agora
  monta um relatorio proprio, permite selecionar as abas e gera PDF em janela
  dedicada ou PNG renderizado localmente. O antigo print do shell e o botao CSV
  da Visao Executiva foram removidos.
- Evidencia: `docs/reports/ANALYTICS_VISUAL_EXPORT_2026-07-20.md`.
