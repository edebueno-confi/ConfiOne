# Plano corrente — Dashboard Visual System V1 — 2026-08-03

## Fechamento do macro-lote visual

- Branch de trabalho: `codex/dashboard-visual-system-v1-20260803`.
- Escopo entregue: shell do Dashboard, cinco superfícies analíticas, estados
  visuais de atualização/UI-05, Integrações, Fontes e Histórico.
- A Visão Geral recebeu hierarquia editorial compacta para desktop de alta
  resolução; títulos não usam escala maximalista e o filtro por domínio não
  retorna como navegação duplicada.
- Nenhuma regra de negócio, métrica, denominador, origem, contrato, RPC,
  integração, sincronização ou credencial foi alterada.
- Evidência visual persistida fora do Git em
  `C:\Projetos\GSO-artifacts\dashboard-visual-system-v1-20260803`.
- Relatório final: `docs/reports/2026-08-03_dashboard-visual-system-v1.md`.
- QA visual: `docs/reports/visual-audit/design-qa.md`.

## Próximo lote recomendado

1. discovery e decisão do denominador de Customer Success;
2. catálogo executivo de métricas, antes de qualquer novo redesenho;
3. lote técnico separado para status/frescor OMIE e observabilidade do fluxo;
4. micro-lote isolado para testes de integração somente quando houver contrato
   e autorização para chamada externa read-only.

Após este fechamento, parar e aguardar revisão visual do Product Owner.

# Plano histórico — superfície operacional do primeiro release — 2026-08-01

## Objetivo

Publicar e evoluir no checkout único `C:\Projetos\GSO-old` somente o Dashboard Gerencial, Configurações aprovadas, Central de Ajuda e Knowledge/editor, sem remover módulos ainda não publicados e sem inventar dados no frontend.

## Estado Git reconciliado

- `main` usa `origin/main` como upstream e mantém esse histórico como ancestral; o HEAD exato deve ser obtido com `git rev-parse HEAD`.
- A divergência corrente deve ser obtida com `git rev-list --left-right --count origin/main...HEAD`; os commits da origem estão contidos no histórico local.
- Há um único worktree ativo, stash preservado e refs de arquivo para a reconciliação anterior.
- O drift anterior de `PROJECT_STATE.md` e `DOCUMENTATION_LEDGER.md` foi corrigido neste lote.
- Nenhuma operação destrutiva, push, deploy, migration remota ou alteração de secret foi executada.

Evidência: `docs/reports/2026-08-01_git-state-reconciliation-addendum.md`.

## Sequência de execução

1. Fechar o inventário Git e manter a proveniência em refs de arquivo.
2. Validar contratos, typechecks, build, suíte Node, higiene e secrets.
3. Fazer QA browser autenticado real das quatro superfícies aprovadas.
4. Remover o editor legado não referenciado em lote isolado.
5. Endurecer a superfície de integrações no backend com grants/RLS/pgTAP.
6. Resolver a colisão entre hydrate e pgTAP e revalidar Auth local.
7. Preparar commits separados e só publicar após autorização explícita.

## Critérios de aceite

- uma única origem operacional: `C:\Projetos\GSO-old`;
- `origin/main` preservado e contido no histórico local;
- dashboard viewer limitado ao dashboard executivo;
- dados ausentes exibidos como `Indisponível`;
- editor sem `window.prompt/alert` no caminho ativo;
- nenhuma credencial, segredo ou service role versionado;
- captura real das superfícies alteradas e evidência persistida.

Relatório do diagnóstico: `docs/reports/2026-08-01_repository-and-release-surface-audit.md`.

## Delta executado neste ciclo

- Customer Success agora declara indisponibilidade honesta até existir read
  model próprio; não reutiliza snapshot executivo nem tickets.
- Financeiro publica somente OMIE API, com estado de configuração, execução,
  frescor e vazio; planilha histórica não é fallback.
- Ações de sincronização permanecem em Configurações e o loop de render da
  página foi corrigido.
- RPC de contexto de workspace foi aplicado localmente após evidência HTTP 404;
  não houve reset ou exclusão.
- Especificações e backlog: `docs/specs/` e
  `docs/plans/analytics-macro-lote-0.4-backlog-v1.md`.

## Fila adicionada após a estabilização visual — 2026-08-02

- `DASHBOARD-05`: reconstrução visual HD da aba CEO (`/admin/analytics?tab=ceo`),
  com cards padronizados, hierarquia executiva, melhor uso da largura e QA
  responsivo claro/escuro. A execução fica separada da correção de sincronismo
  em andamento e aguarda aprovação visual antes de ser propagada às demais abas.
- `DASHBOARD-06`: alinhar o container de fonte financeira da aba Financeiro ao
  cabeçalho `OMIE · Contas a Receber`, mantendo origem, frescor e gerenciamento
  no mesmo nível visual dos demais elementos da área.
- `UI-04`: hardening do dark mode/editor, reset limpo de `Novo artigo`,
  histórico recolhível, padronização dos cards financeiros e avaliação de
  teste read-only das integrações.
- `KNOWLEDGE-03`: reconstrução completa do cockpit de Artigos, corrigindo
  ações sem efeito e sobreposição da coluna de categorias.
- `DASHBOARD-03`: exportação profissional de imagem e PDF a partir de fonte
  estática, com proveniência, texto selecionável e verificação do artefato.
- `KNOWLEDGE-04`: auditoria e cobertura dos contratos de categorias, filtros,
  paginação e retorno contextual.

Detalhamento e critérios: `docs/UI_REFACTOR_BACKLOG.md`. Nenhum item acima é
declarado implementado por este registro documental.

# Discovery HubSpot concluído como investigação — 2026-08-02

- O discovery somente leitura foi registrado nos cinco relatórios
  `docs/reports/2026-08-02_hubspot-*.md` e no JSON sanitizado correspondente.
- Nenhuma métrica foi implementada e nenhum denominador CS foi selecionado.
  A próxima especificação deve transformar o universo escolhido pelo Product
  Owner em configuração auditável por área, sem descartar pipelines legados.
- Conversas/Feedback e navegação autenticada no Chrome seguem pendentes; não
  usar `source_type=CHAT` ou propriedade CSAT/NPS/CES isoladamente como prova de
  fonte autoritativa.

# Revisão do próximo macro-lote — decisão do Product Owner — 2026-08-02

- Delta e especificação: `docs/reports/2026-08-02_ui-05-specification-delta.md`
  e `docs/specs/UI_05_GENIO_EM_ACAO_V1.md`.
- `UI-05` é um micro-lote isolado de design system, motion, loading e feedback
  de sincronização. Está aprovado conceitualmente, mas não autorizado para
  implementação neste ciclo.
- `DASHBOARD-05` fica bloqueado até a conclusão do discovery HubSpot, decisão do
  denominador de Customer Success e aprovação do catálogo de métricas.
- `DASHBOARD-06` sai do lote visual e permanece no backlog técnico de runtime e
  dados, por depender da consistência entre OMIE, status, snapshot e read model.
- Ordem obrigatória: discovery HubSpot, denominador CS, catálogo de métricas,
  micro-lote UI-05, aprovação visual, especificação/implementação DASHBOARD-05
  e, separadamente, DASHBOARD-06.

# Genius Support OS - Plano operacional vivo

## Smoke autenticado de release - 2026-07-23

### Executado

- Criado `tests/scripts/release-smoke-playwright.mjs` para QA local autenticado
  de release, lendo credenciais do fixture local sem gravar senha no script.
- Restaurado o usuario admin local pelo fixture `supabase:qa:local-admin-fixture`.
- Validado o fluxo em navegador real nas rotas:
  - `/admin/analytics`;
  - `/help/genius`;
  - `/help/genius/articles`;
  - primeiro artigo publico encontrado em `/help/genius/articles/:slug`.
- Ajustado `AnalyticsShell` para conter o lazy loading dos dominios do Dashboard
  em uma `Suspense` interna. Assim, a shell do Dashboard permanece visivel
  enquanto a aba ativa carrega os indicadores.

### Validado

- Smoke Playwright local: sem erros de console, sem falhas de request e sem
  overflow horizontal nas quatro rotas verificadas.
- RPCs executivas medidos diretamente no PostgREST autenticado:
  `rpc_analytics_ceo_snapshot`, `rpc_analytics_ceo_history`,
  `rpc_analytics_ceo_reconciliation_quality_grouped` e
  `rpc_analytics_ceo_ambiguous_overdue` retornaram HTTP 200.
- `npm run web:typecheck`: aprovado.
- `npm run contracts:typecheck`: aprovado.
- Testes focados de scripts: 5/5 aprovados.
- `npm run web:build`: aprovado.

### Atencao

- `npm run supabase:qa:local-support-fixture` ainda ficou lento/preso na etapa
  de Knowledge/Public Help e foi encerrado localmente pelo PID especifico. Isso
  deve virar um lote separado de performance/idempotencia do fixture; nao
  bloqueia o smoke autenticado do release porque a Central ja esta hidratada.

## Plano revisado de publicação e evolução contínua — 2026-07-23

### Progresso do release urgente

- Central de Ajuda local reidratada a partir do corpus Octadesk versionado:
  57 artigos importados, 7 categorias, 44 publicados e 13 bloqueados pelo
  gate editorial.
- Links dos cards de categoria corrigidos para não duplicar o caminho da rota;
  teste focado e QA browser aprovados sem erros de console.
- A fixture completa de suporte excedeu 244 segundos sem alterar o espaço
  público; a preparação específica de Knowledge foi executada pelo fluxo
  editorial oficial, sem publicar dados remotamente.

### Resultado da validacao local deste ciclo - 2026-07-23

- O Dashboard Gerencial inicializa o seletor de periodo a partir do intervalo
  recebido, evitando o primeiro paint inconsistente entre datas do mes atual e
  a opcao "Todo o periodo".
- A regressao de navegacao dos cards de categoria foi coberta por teste focado;
  os testes de scripts agora fecham em 76/76.
- `npm run web:build`: aprovado.
- `npm run contracts:typecheck`: aprovado.
- `node --test tests/scripts/*.test.mjs`: 76/76 aprovados.
- `npm run repository:check-root`: aprovado; nenhuma entrada fora da allowlist.
- `npm run documentation:validate:internal-docs`: concluido sem bloqueios; os
  alertas existentes sao mencoes documentais de tokens/segredos e nao foram
  alterados neste lote.
- `git diff --check`: aprovado; apenas avisos de normalizacao CRLF/LF.
- O timeout da fila foi reproduzido como SQLSTATE `57014` no RPC autenticado e
  corrigido com um read model de passagem unica. O RPC agora responde em cerca
  de 433 ms, com 50 itens na pagina 1 e 50 na pagina 2 de um total de 628.
- Evidencia tecnica: `docs/reports/SUPPORT_QUEUE_TIMEOUT_ROOT_CAUSE_2026-07-23.md`.

### Decidido

- Não reiniciar nem apagar o projeto.
- O release urgente até o fim de 2026-07-24 concentra Dashboard Gerencial e
  Central de Ajuda pública, com o mínimo de administração necessário.
- Os demais módulos estão incompletos funcionalmente e visualmente, mas não
  serão abandonados: permanecem no roadmap e continuarão sendo desenvolvidos
  em lotes separados.
- A allowlist/feature flag controla somente a superfície publicada; não remove
  código, dados, migrations ou contratos existentes.
- Áreas internas definem contexto e defaults; papéis definem grants; membros
  vinculam identidade, área e função; carteiras são entidades editáveis com
  vínculos e histórico próprios.
- O frontend não é fonte de verdade: tokens, catálogo de navegação,
  dependências, papéis, carteiras e status devem ser tipados/configuráveis.

### Pendente prioritário para publicação até 2026-07-24

1. Confirmar que o Dashboard carrega com os dados locais disponíveis e sem
   bloqueadores de autenticação, integração, timeout ou estado vazio.
2. Confirmar Central de Ajuda pública, busca, artigos, mídia e responsividade.
3. Validar light/dark, loading, erro, vazio, sincronização e navegação móvel.
4. Executar typecheck, testes, build e smoke test autenticado de release.

### Próximos lotes pós-publicação

1. Diagnosticar a causa raiz dos HTTP 500 em `vw_support_tickets_queue` e
   `rpc_support_ticket_queue_page`, adicionando teste de contrato.
2. Consolidar primitives do design system e tokens sem hardcode de negócio nas
   páginas.
3. Implementar contratos de áreas, memberships, papéis, grants e carteiras
   com RLS, RPC, auditoria e histórico.
4. Redesenhar Acessos e Áreas internas como workspaces contextuais, sem rail
   permanente comprimindo a lista.
5. Executar QA de manutenção: typecheck, testes, build, acessibilidade,
   responsividade, light/dark, estados de erro/vazio/loading e revisão de
   legibilidade do código.

### Critério de qualidade

Cada lote deve registrar arquivos, decisões, validações e atenção. Código novo
deve ser tipado, componentizado, formatado, sem regras duplicadas, sem código
morto e sem hardcode de regras de negócio ou de configuração visual.

## Lote de contexto HubSpot no cockpit B2B — 2026-07-23

### Feito

- Criado `customer-relationship-model.ts` para normalizar o contrato read-only de relacionamento HubSpot.
- Criado `customer-relationship-api.ts`, com chamada paginada limitada a 100 registros e sem escrita externa.
- Clientes B2B passou a exibir um resumo compacto da fonte HubSpot: entidades legais, negócios e grupos econômicos resolvidos.
- O texto da tela deixa explícito que esses totais são globais e que nenhuma associação cliente–empresa foi inferida.

### Validado

- Teste focado do normalizador: 3/3.
- QA autenticado em `/support/clientes`: contrato carregado do cache local e resumo exibido sem duplicar os KPIs da conta.

### Atenção

- O contrato ainda não fornece o vínculo interno `tenant_id` ↔ `hubspot_company_id`; a tela não exibe deals dentro do detalhe individual até esse vínculo ser criado com fonte e auditoria.

### Próximo lote

1. Criar contrato explícito e auditável de vínculo entre conta B2B e empresa HubSpot.
2. Consumir entidades legais e negócios dentro do detalhe somente para vínculos confirmados.
3. Repetir QA em light/dark e larguras móveis.

## Lote de implementação CS/B2B — 2026-07-23

### Feito

- Criado `cs_customer_portfolio_assignments`, uma atribuição editável por cliente com carteira, status, cluster, modelo de atendimento, cadência, saúde, prioridade, origem e observações.
- Criado `cs_customer_portfolio_assignment_history`, com histórico imutável de alterações e auditoria de linha.
- Criado `rpc_admin_upsert_cs_customer_portfolio`, protegido por contexto de gestor de Customer Success ou `platform_admin`; owner só pode ser perfil ativo com membership CS ativa no cliente.
- Ampliado `vw_cs_customer_portfolio` com os campos estruturados da carteira, sem remover o read model anterior.
- O frontend passou a consumir e editar o contrato real da carteira, mantendo o seed CS Ops como QA e sem promover os owners `qa.local.*`.
- Clientes B2B passou a usar tabela operacional dominante com KPIs, busca e detalhe em drawer contextual.
- Carteira CS passou a usar cockpit tabular com atenção semântica, filtros, busca e drawer de detalhe/edição.
- Contas B2B deixou de exibir a coluna de ferramentas e o detalhe passou a ocupar drawer; filtros foram movidos para o cabeçalho; `Membros` foi normalizado para `Usuários da conta`.

### Validado

- Teste pgTAP do contrato novo: 12/12.
- `npm run contracts:typecheck`, `npm run web:typecheck` e `npm run web:build` aprovados.
- Testes Node: 68/68 aprovados.
- QA autenticado local em `http://127.0.0.1:4173`: Carteira CS, Clientes B2B e Contas B2B carregaram com dados do banco; o detalhe administrativo só abre por ação explícita.
- Capturas QA salvas em `output/playwright/cs-portfolio-final.png`, `output/playwright/customers-final.png` e `output/playwright/tenants-final-no-selection.png`.

### Atenção

- O contrato novo foi aplicado somente no banco local; publicação remota permanece bloqueada por segurança.
- A tela permite editar atributos da carteira, mas a seleção de owner real depende de colaboradores produtivos com identidade e membership validadas.
- A administração de Contas B2B ainda contém blocos históricos ocultos no arquivo; eles não são renderizados, mas devem ser removidos numa rodada posterior.
- Há registros legados do seed local com `�` no texto persistido. Não foi feita substituição automática: a correção deve usar a fonte original e uma migração auditável para não alterar nomes reais por suposição.

### Próximo lote

1. Materializar o mapeamento seguro dos responsáveis da planilha para perfis/memberships internas.
2. Expor na carteira os contratos de grupo econômico, entidade legal e negócios já criados.
3. Completar o detalhe dedicado de conta, contatos e usuários da conta.
4. Executar matriz visual autenticada em light/dark e 390/768/1024/1440; o smoke test desktop autenticado já foi concluído.

## Auditoria 2026-07-23 - dados reais de CS, carteira B2B e redesign de navegação

### Executado

- A planilha `CS Ops _ Carteiras e Clusters -v2.xlsx` foi auditada em modo somente leitura: a aba `BD_Clientes` possui 42 colunas e 606 registros; os campos foram separados em identidade, contrato/produto, operação, risco/saúde, roteamento e scores.
- O backend local foi confrontado com a planilha: clientes, assinaturas, segmentos e owners existem, mas parte dos campos CS permanece comprimida em `internal_notes`, `operational_flags` e `metadata`.
- Foi confirmado que a atribuição de CSM está no nível da assinatura e que os owners QA ainda não possuem memberships de área internas. A carga atual é fixture local de QA, não carga produtiva.
- Foi criado o relatório canônico de de/para, lacunas e direção visual em `docs/reports/CS_B2B_PORTFOLIO_UX_DATA_AUDIT_2026-07-23.md`.
- Foi definida a direção UX: máximo de duas zonas de trabalho; Clientes B2B como cockpit de contas; Carteira CS como cockpit de relacionamento; detalhes em workspace/rota/drawer, sem coluna fixa de ferramentas ou rail permanente.

### Estado consolidado

- Concluído/validado: integrações HubSpot/OMIE, dashboard gerencial, catálogo comercial, fila de suporte paginada no backend, contrato analítico de relacionamento, central de ajuda/editor, perfis de acesso e mascote/estados compartilhados.
- Parcial: seed CS Ops local, cadastro B2B editável, Carteira CS, vínculo de colaboradores/áreas, consumo do relacionamento econômico/legal/deals e unificação visual do sistema.
- Pendente de implementação: contrato real de carteira CS, campos CS estruturados, memberships seguras dos responsáveis, área organizacional de Suporte quando necessária, redesign de Clientes B2B/Carteira CS/Contas B2B, kit visual único, copy PT-BR e QA responsivo/autenticado.
- Bloqueado/gated: correspondência dos owners QA com identidades reais, carga produtiva, migrations/deploy remotos, scheduler remoto e integração GitHub.

### Próximo ciclo ordenado

1. Criar contrato backend de carteira/atribuição CS com RLS, RPCs, auditoria, histórico e testes pgTAP.
2. Estruturar campos da planilha em modelo editável e versionado, mantendo proveniência; não promover automaticamente e-mails QA a identidades reais.
3. Materializar memberships internas apenas para identidades seguras e definir o catálogo de áreas/funções, incluindo Suporte se o roteamento exigir.
4. Refatorar o cockpit Clientes B2B para busca global, filtros, tabela densa, atenção semântica, avatar/logo e detalhe dedicado.
5. Refatorar Carteira CS para escopo por permissão, ownership, health, cadência, prioridade, grupo econômico e ações de relacionamento.
6. Simplificar Contas B2B/Administração: toolbar de ações, lista dominante, detalhe dedicado e nomenclatura `Usuários da conta`.
7. Executar a rodada visual e comportamental em light/dark e 390/768/1024/1440, com typecheck, build e pgTAP.

### Fonte detalhada

O relatório completo, incluindo evidências locais, contratos existentes, lacunas e critérios de aceite, está em `docs/reports/CS_B2B_PORTFOLIO_UX_DATA_AUDIT_2026-07-23.md`.

## Lote 2026-07-23 - pipelines comerciais ativos, fila paginada e relacionamento B2B

### Executado

- Os 11 pipelines comerciais conhecidos foram ativados no seed local e podem
  ser habilitados ou desabilitados na tela de Configuracao pelo administrador.
- A fila de suporte usa `rpc_support_ticket_queue_page`: filtros, busca,
  contagem e paginação são calculados no backend, além dos 50 primeiros itens.
- `rpc_analytics_customer_relationship_contract` formaliza grupo econômico
  resolvido manualmente, entidade legal HubSpot e deals paginados; associações
  ausentes não são inferidas.

### Validado

- pgTAP: 73 arquivos e 1.230 testes aprovados.
- Contracts/web typecheck, build web e `git diff --check` aprovados.
- Migrations aplicadas somente no banco local; não houve write remoto, deploy,
  push ou alteração de segredo.

### Pendente

- QA autenticado navegando para a página 2+ da fila com dados reais.
- Consumir o contrato nas telas B2B/Carteira CS depois de definir associações
  operacionais dos deals.

### Worktree

- O worktree herdado foi preservado: ele mistura lotes de UX, acesso,
  integrações, documentação e migrations anteriores. Não foram executados
  `git reset --hard`, `git clean` ou descarte amplo.
- O próximo fechamento deve separar os lotes por escopo antes de commits
  objetivos; arquivos gerados e bundles permanecem em triagem.

## Lote Comercial — catálogo e seleção de pipelines — 2026-07-23

### Feito

- Auditado o portal HubSpot `20108050` em modo somente leitura: `Piloto
  Aftersale` (1.150 negócios), `Pipe de Vendas` (865) e `Renovação Contratual`
  (1) são os pipelines com atividade observada.
- Implementada descoberta dinâmica de pipelines não arquivados no
  `hubspot-sync`; candidatos novos entram inativos e não alteram a seleção
  administrativa existente.
- Implementado filtro temporário de pipelines na aba Comercial e agregação
  `by_pipeline` no RPC comercial, mantendo a regra no Postgres.
- Preservado o contrato RPC comercial legado de quatro argumentos.

### Validado

- pgTAP: 72 arquivos, 1.223 testes, todos aprovados.
- `npm run contracts:typecheck`, `npm run web:typecheck` e `npm run web:build`
  aprovados.
- Testes Node: 68 aprovados.
- Nenhuma escrita foi feita no HubSpot.

### Próximo passo

- Executar uma sincronização HubSpot concluída, revisar os candidatos em
  `Dashboard Gerencial > Configuração` e ativar explicitamente os pipelines que
  devem compor o painel. Depois comparar os KPIs do recorte combinado com a
  visão nativa do HubSpot.

### Atenção

- O catálogo inicial do portal foi semeado apenas para navegação local; a
  sincronização dinâmica deve prevalecer em cada ambiente.
- Deals continuam em carga completa por pipeline até que uma fronteira
  incremental segura seja confirmada.

## Lote CS Ops - seed local baseado na planilha - 2026-07-22

### Feito

- Criado `supabase/qa/create-local-cs-ops-fixture.mjs` para extrair diretamente a aba `BD_Clientes` da planilha local.
- Criado o comando `npm run supabase:qa:local-cs-ops-fixture`.
- Materializados localmente clientes, perfis operacionais, clusters, assinaturas, responsáveis, tickets, histórico e ações de CS.

### Validado

- 606 registros extraídos e materializados.
- 575 vínculos de responsáveis identificados.
- Reexecução concluída sem duplicação.
- Nenhuma escrita no HubSpot, OMIE ou ambiente remoto.

### Pendente

- QA autenticado das telas Clientes B2B, Carteira CS, Tickets e Acionamentos usando o seed.
- Definir o contrato futuro de grupo econômico, entidades legais e negócios antes da carga produtiva.

### Bloqueado

- Nenhum bloqueio local. Migração remota e sincronização externa continuam gates humanos.

## Lote de performance da fila de suporte - 2026-07-23

### Feito

- Corrigido o custo duplicado de `vw_support_tickets_queue`: o conjunto de
  tickets visíveis agora é materializado uma vez e reutilizado nos contextos de
  SLA e canal.
- O carregamento do frontend passou a solicitar explicitamente apenas as
  colunas da fila e limita o primeiro recorte a 50 tickets mais recentes.
- Criada e aplicada localmente a migration
  `20260723151602_optimize_support_ticket_queue_read_model.sql`.

### Validado

- A consulta autenticada de 607 tickets deixou de exceder o timeout local.
- `/support/tickets` e `/support/queue` carregam com 50 tickets recentes.
- `/support/clientes` e `/cs/portfolio` exibem 607 clientes.
- `/internal-actions` exibe 606 acionamentos derivados da planilha.

### Pendente

- Adicionar paginação server-side completa para navegar além do primeiro
  recorte de 50 tickets sem depender somente de filtros.
- Fechar o contrato de grupo econômico, entidade legal e negócios antes de
  qualquer carga produtiva.

### Bloqueado

- Nenhum bloqueio local. A migration ainda não foi publicada em banco remoto.

## Lote de ACL e suíte de banco - 2026-07-23

### Feito

- Criada `20260723162000_harden_screen_dependency_function_acl.sql` para
  tornar explícita a proteção das funções de trigger do catálogo de telas.
- Revogada a execução para papéis de API e mantida apenas a ACL do owner do
  banco.

### Validado

- `npm run supabase:test:db`: 71 arquivos, 1.219 testes, PASS.
- O teste de auditoria de funções deixou de reportar as três funções internas.

### Pendente

- Publicação da migration continua dependente do gate de deploy/migration
  remota aprovado pelo responsável.

### Bloqueado

- Nenhum bloqueio local.

## Lote atual - governanca de identidade e acesso por contexto - 2026-07-22

### Decidido

- Uma pessoa pode pertencer a varias areas e clientes; area, funcao e tela
  autorizada sao dimensoes diferentes e nao devem ser comprimidas em um papel
  global.
- `internal_area_memberships` continua sendo o vinculo canonico. O novo
  catalogo backend de telas e os grants por vinculo definem o acesso efetivo.
- Perfis nomeados reutilizaveis podem servir de preset; excecoes usam o modo
  personalizado por telas. Financeiro e Produto entram pelo mesmo contrato.

### Executado

- Criada a migration `20260722221746_internal_profile_screen_access_contract_v1.sql`
  com catalogo de telas, grants por vinculo, perfis nomeados, grants de perfil,
  contexto autenticado do ator, RLS, auditoria e RPCs administrativas.
- A pagina `/admin/internal-areas` agora configura cliente, colaborador, area,
  funcao, status, perfil nomeado ou telas personalizadas.
- Contratos TypeScript e `admin-api` foram atualizados para carregar perfil,
  modo de permissao e catalogo de telas.

### Validado

- DDL completo executado em transacao no Postgres local com `ROLLBACK`.
- `npx supabase db lint --local` sem erro novo; permanecem apenas avisos
  preexistentes de variaveis `v_actor` em RPCs legadas.
- `npm run web:typecheck`, `npm run web:build`, teste de navegacao e
  `git diff --check` passaram.

### Pendente

- Aplicar a migration no ambiente alvo mediante gate de deploy/migration remota.
- Fazer CRUD visual dos perfis nomeados em Acessos/Configuracoes.
- Migrar `post-login-redirect` e o shell para consumir o contexto backend de
  telas, preservando a compatibilidade dos papeis globais legados.
- Validar QA autenticado de operador, gestor, financeiro, produto e QA com
  combinações distintas de telas, incluindo viewport mobile.

### Bloqueado

- Nenhuma alteracao remota foi executada. Deploy, push e migration remota
  continuam dependentes de autorizacao explicita.

## Estado atual e fechamento do lote OMIE↔HubSpot — 2026-07-22

- Baseline versionado: branch `codex/repository-cleanup-consolidation-20260721`,
  HEAD `5cb4eea` (`feat(analytics): configure dual integration schedules`).
- Concluído localmente: agenda independente de OMIE e HubSpot, sincronização
  global do HubSpot, atualização de empresas em lote, eliminação de chamadas
  OMIE repetidas no fluxo combinado, bloqueio de concorrência e observabilidade
  de fases/erros.
- Validado localmente: OMIE dedicado com 3.433/3.433 títulos; runner combinado
  com HTTP 200; `web:typecheck`, `web:build`, suíte pgTAP (70 arquivos/1.207
  testes) e testes Node direcionados aprovados antes do commit.
- Estado de agenda: OMIE local ativo em frequência diária; HubSpot global
  configurável, desligado por padrão para não consumir a API sem decisão
  explícita. O heartbeat agendado está implementado, mas o runtime Edge local
  precisa ser recarregado para reconhecer a nova função; o `OPTIONS` 404 atual
  é uma limitação do inventário congelado do runtime local.
- Restam somente gates externos: publicar migrations/functions, configurar o
  scheduler remoto protegido e executar deploy/push quando houver autorização.
  Nenhum write remoto foi realizado neste lote.
- As seções históricas abaixo permanecem para auditoria. Elas não são a fila
  corrente quando mencionam credencial OMIE, implementação do cockpit ou
  sincronização inicial como pendências; esses pontos foram superados pela
  configuração e validação registradas em 2026-07-22.

## Protocolo SDD de continuidade — 2026-07-21

- Spec guarda-chuva: `docs/superpowers/specs/2026-07-21-gso-release-readiness-and-next-cycles.md`.
- Plano executável: `docs/superpowers/plans/2026-07-21-gso-release-readiness-and-next-cycles.md`.
- Ordem corrente: W0 governança e baseline; W1 higiene documental; W2/W3
  Dashboard e integrações em paralelo; W4 CS Ops/carteira; W5 Help Center e
  Portal; W6 segurança/performance; W7 release pack e handoff.
- O baseline versionado permanece no HEAD `7c7d291`; o worktree agora contém
  somente o lote W1 ainda não commitado (scanner, teste, package e documentação).
  O próximo baseline deve corrigir o drift documental antes de qualquer decisão
  de release.
- Pendências P0: baseline único atual, QA autenticado da exportação PDF/PNG,
  reidratação e sync verificável do cache HubSpot, reconciliação do ledger CS Ops
  e confirmação da semântica financeira derivada do OMIE.
- Pendências externas: push/merge/deploy, publicação remota de migrations e
  functions, scheduler protegido e qualquer write externo; permanecem bloqueadas
  sem aprovação humana explícita.
- Regra de retorno: todo lote reporta Feito, Validado, Atenção, Git e Próximo
  passo, com critérios de aceite para o lote seguinte.

## Execução W1 — higiene read-only — 2026-07-21

- Feito: criado `scripts/ci/check-root-artifacts.mjs` e seu teste TDD em
  `tests/scripts/root-artifacts-hygiene.test.mjs`.
- Feito: adicionado `npm run repository:check-root`.
- Feito: movidos 10 logs/dumps transitórios para `.tmp/logs/2026-07-21--local-environment/`.
- Validado: teste TDD 3/3; `contracts:typecheck`, `web:typecheck`, `web:build`,
  `supabase:lint:db`, `supabase:test:db`, `documentation:validate:internal-docs`,
  `git diff --check` e smoke HTTP local passaram. O verificador atual reporta
  somente `output/` e o bundle local `Recreação do mascote Genius-handoff/`.
- Atenção: esses dois itens permanecem preservados até decisão de classificação;
  nenhum documento histórico foi arquivado ou removido. O lint do banco ainda
  emite 12 alertas conhecidos sobre `v_actor` não utilizado em RPCs legadas; a
  validação não encontrou falha.
- Ambiente local: web em `http://127.0.0.1:4173`, API/DB/Studio Supabase em
  `http://127.0.0.1:54321`, `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
  e `http://127.0.0.1:54323`. O runtime local de Edge Functions, imgproxy e
  pooler permanecem parados no status do CLI; não foram iniciados neste lote.
- Próximo passo: revisar o conteúdo de `output/` e decidir se o bundle do
  mascote deve permanecer como referência local ignorada ou ser movido para
  `.tmp/quarantine/`, sem excluir nada automaticamente.

## Execução W3 — HubSpot faseado e runtime local — 2026-07-21

- Diagnóstico: HTTP 503 era Edge Runtime local parado; HTTP 504 era o cliente
  desistindo de uma carga HubSpot monolítica que excedia o limite do worker.
- Feito: endpoint faseado por empresas, comercial e CS; a UI chama as etapas
  sequencialmente e agrega os contadores. O snapshot legado de sucesso também
  virou fronteira incremental para evitar uma nova carga completa artificial.
- Validado: OMIE autenticado localmente com 3.433/3.433 títulos; HubSpot faseado
  com HTTP 200 nas três etapas, aproximadamente 20 segundos no lote incremental
  e contadores separados (2 empresas, 1.147 deals, 0 tickets na etapa CS por
  não haver alteração na janela incremental). Contracts/web typecheck, build e
  pgTAP (67 arquivos, 1.194 testes) também passaram.
- Atenção: o endpoint legado sem `scope` ainda é monolítico; scheduler remoto
  precisa ser migrado para as três chamadas, sem publicação remota neste lote.
- Evidência: `docs/reports/HUBSPOT_SYNC_PHASED_EXECUTION_2026-07-21.md`.

## Ciclo Central de integração OMIE↔HubSpot (Claude) — 2026-07-20

### Feito

- Deduplicação robusta de empresas (`rpc_analytics_company_candidates`): CNPJ
  exato/raiz + nome por palavra + trigram (razão social e nome fantasia).
- Criação governada de empresas (`hubspot-company-create`) com dry-run, dedup,
  ledger; drill-down de empresas sem cadastro; caso Malwee corrigido por merge.
- Propriedades `omie_*` criadas no HubSpot (`hubspot-property-setup`).
- Sincronização de saída (`hubspot-omie-property-sync` + rollup): 196/196
  empresas atualizadas, 0 falhas.
- Agendamento configurável (`analytics_integration_schedule`) + orquestração
  (`analytics-integration-run`) admin/secret + UI em Configuração; validado
  ponta a ponta (3.433 títulos, 196/196 empresas).
- Copy do dashboard humanizada (Comercial/CS), sem jargão, acentuação corrigida.

### Validado

- Dry-runs e execuções reais auditadas; `web:typecheck`/`web:build` verdes.

### Pendente

- Ativar cron com `ANALYTICS_SYNC_SECRET` (produção) conforme runbook em
  `docs/reports/OMIE_HUBSPOT_INTEGRATION_HUB_2026-07-20.md`.
- Rollout visual das abas restantes (Fase 2 da SPEC) e suíte pgTAP dos novos RPCs.

## Ciclo OMIE API-first + cockpit financeiro (Claude) — 2026-07-20

### Feito

- Contrato real da API OMIE corrigido (o anterior era fictício):
  `ListarContasReceber` com `pagina/registros_por_pagina/apenas_importado_api` e
  lista `conta_receber_cadastro`; erro expõe `faultstring`; retry não re-tenta 500.
- Enriquecimento de clientes via `ListarClientesResumido` (join
  `codigo_cliente_fornecedor=codigo_cliente`): nome/CNPJ em 3.433/3.433 títulos.
- `rpc_analytics_finance_snapshot` reescrito API-first (fonte ativa = API,
  planilha fallback, sem dupla contagem) com posição da carteira, previsibilidade,
  aging por faixa de dias, categorias, maiores devedores e cruzamento
  financeiro × CS/HubSpot por CNPJ.
- Painel Financeiro reescrito como cockpit (KPIs coloridos, tags, cabeçalhos,
  formato BR, responsivo, sem jargão, sem histórico de arquivos).
- Estado de carregamento com o mascote Gênio animado, flutuante, centralizado.
- SPEC de upgrade do dashboard: `docs/DASHBOARD_GERENCIAL_UX_SPEC_V1.md`.

### Validado

- Sync real 3.433 títulos; saldo aberto R$ 750.553,79; vencido 49,1%; atraso
  médio 221 dias; cruzamento CS reconciliado R$ 636.615,80.
- `node --test` adapter 8/8; `web:typecheck` e `web:build` verdes.

### Pendente

- Rollout visual das abas Comercial/CS (Fase 2 da SPEC) e consolidação de Logs.
- Teste pgTAP do RPC do cockpit + suíte `supabase test db`.
- QA visual autenticado claro/escuro e responsivo; ativação remota (gates).

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
- Analytics oferece exportação visual do recorte gerencial em PDF/PNG, com seleção
  de abas e relatório dedicado sem shell; CSV e impressão bruta do navegador foram
  removidos. A tela de logs ganhou filtro por status e atualização manual.
- ExecuÃ§Ã£o adicional 2026-07-20: criado o read model histÃ³rico `rpc_analytics_ceo_history`, que compara o recorte atual com o perÃ­odo anterior de mesma duraÃ§Ã£o sem duplicar regras no frontend. A VisÃ£o Executiva exibe Receita ganha, ConversÃ£o e Saldo vencido com variaÃ§Ã£o semÃ¢ntica e base comparativa.
- Validado: teste de banco passou com 62 arquivos e 1.164 testes; `npm run web:typecheck` e `npm run web:build` passaram. O build emite apenas o alerta conhecido de chunks acima de 500 kB.
- AtenÃ§Ã£o: PNG/PDF renderizado, ledger de escrita CS Ops, seed da carteira local, origem operacional detalhada de tickets e adapter GitHub permanecem dependentes de contratos/fontes externos nÃ£o confirmados; nÃ£o foram simulados.
- Execucao adicional 2026-07-20: exportacao visual refeita. O Dashboard agora
  monta um relatorio proprio, permite selecionar as abas e gera PDF em janela
  dedicada ou PNG renderizado localmente. O antigo print do shell e o botao CSV
  da Visao Executiva foram removidos.
- Evidencia: `docs/reports/ANALYTICS_VISUAL_EXPORT_2026-07-20.md`.
- Continuidade OMIE, CS Ops e acesso restrito: HubSpot permanece como fonte
  operacional de CS; a importação CS Ops foi removida da Configuração e o
  backend de staging foi preservado para auditoria e migração futura.
- A orquestração OMIE-HubSpot usa concorrência limitada e timeout individual por
  chamada, reduzindo o risco de timeout do upstream sem perder contagem de falhas.
- O papel `dashboard_viewer` e a concessão por e-mail de Maurício permanecem
  preparados; a conta Auth real e senha dependem do fluxo seguro de convite.
- Evidência: `docs/reports/OMIE_CSOPS_TIMEOUT_ACCESS_CONTINUATION_2026-07-20.md`.

## Revisão de finalização do Dashboard — 2026-07-20

- Corrigido o bloqueio do papel `dashboard_viewer`: o resolvedor de rota agora
  permite somente o Dashboard Gerencial e a configuração da Área do cliente;
  o menu restrito mantém a Central de ajuda como terceiro destino.
- Validado no navegador local com fixture QA: login, redirecionamento,
  restrição de `/admin/settings`, acesso a `/admin/customer-portal`, abas do
  dashboard, período compartilhado, Financeiro, Logs e viewport móvel.
- Corrigida ACL explícita de `app_private.normalize_company_name(text)` e
  ajustado o teste da integração OMIE para aceitar estado habilitado somente
  quando a credencial gerenciada existe.
- Evidência: `docs/reports/DASHBOARD_FINALIZATION_REVIEW_2026-07-20.md`.
- Pendências de encerramento: convite real do usuário Maurício, publicação
  remota das migrations/functions, cron protegido por secret e confirmação de
  campos de origem específicos dos tickets.
- Atenção operacional: `supabase:verify` recria o banco local por desenho;
  o cache sincronizado local foi removido e os fixtures QA foram recriados.
  Repopular dados de HubSpot exige nova sincronização autorizada.

## Central de Ajuda, conteúdo e acesso gerencial — 2026-07-20

- Feito: o `dashboard_viewer` agora pode abrir Dashboard, Área do cliente,
  Central de Ajuda, Conteúdo e Configurações.
- Feito: a tela de Configurações fica restrita ao grupo Integrações para esse
  perfil; os demais parâmetros administrativos continuam ocultos.
- Feito: Knowledge Base passou a aceitar o papel para leitura operacional,
  criação/edição de artigos e fluxo editorial; a fonte permanece backend/RLS.
- Feito: os 58 artigos locais do corpus legado foram importados como drafts,
  preservando origem e hash; nenhum artigo foi publicado automaticamente.
- Feito: Acessos ganhou concessão/revogação governada de `dashboard_viewer`.
- Validado: `npm run web:typecheck`, `npm run supabase:verify` e QA navegador
  autenticado. Evidência em
  `docs/reports/HELP_CENTER_CONTENT_VIEWER_ACCESS_2026-07-20.md`.
- Atenção: a ativação local do space `genius` foi feita somente para QA;
  publicação pública exige revisão humana conforme o runbook.

## Publicação da Central de Ajuda e retomada da migração CS Ops — 2026-07-20

- Feito: publicação local controlada do corpus Octadesk aprovado, com 44
  artigos publicados nesta execução e 12 bloqueados por risco
  técnico/administrativo.
- Feito: `source_path` e `source_hash` foram preservados; os bloqueios não foram
  contornados.
- Validado: dry-run e apply do script oficial
  `publish-octadesk-public-help.mjs` no space `genius`.
- Próximo ciclo: fechar o contrato das propriedades de CS, expor o dry-run e a
  aplicação da migração no Dashboard e executar a carga auditada da planilha.
- Evidências: `docs/reports/HELP_CENTER_PUBLICATION_2026-07-20.md` e
  `docs/reports/CS_HUBSPOT_MIGRATION_CONTINUATION_PLAN_2026-07-20.md`.
- Atenção: a publicação foi local; o ambiente remoto exige publicação de
  migrations/functions e execução controlada no projeto-alvo.
### Assets e formatação da Central de Ajuda — 2026-07-20

- Decidido: tratar `https://o205658-f7a.octadesk.com/kb/` como fonte canônica e usar a exportação local para reprocessamento auditável.
- Executado: 54 artigos selecionados; 129 PNGs detectados no corpus; 97 assets aprovados movidos para `knowledge-public-assets`; artigos publicados atualizados pela revisão editorial; rascunhos/restritos permaneceram protegidos.
- Executado: corrigida ACL da view pública e criado bucket público dedicado, sem abrir o bucket privado de curadoria.
- Validado: leitor público exibiu 6/6 imagens do artigo de teste; editor exibiu 6/6 nós de mídia; imagens retornaram HTTP 200 e dimensões naturais; console sem erros da aplicação.
- Pendente: inserir vídeos somente quando a equipe fornecer IDs oficiais; revisar manualmente os 12 artigos bloqueados pela curadoria pública.
- Evidência: `docs/reports/HELP_CENTER_ASSETS_FORMATTING_2026-07-20.md`.

### Contatos centralizados e artigo em revisão — 2026-07-20

- Feito: contatos operacionais removidos do conteúdo derivado dos artigos e
  centralizados em `Configurações → Central de ajuda`.
- Feito: rodapé público passou a renderizar e-mail, WhatsApp e site a partir do
  contrato sanitizado do espaço, sem duplicar a informação em cada artigo.
- Feito: `Como alterar ou aprovar os produtos de uma solicitação?` foi marcado
  como revisão interna e retirado do público por estar desatualizado; nenhum
  procedimento foi inventado.
- Validado: 67 arquivos/1.192 testes pgTAP, `npm run web:typecheck`, resolver
  público local e ausência dos contatos antigos no artigo em revisão.
- Pendente: receber a versão oficial revisada do procedimento antes de
  republicar o artigo.
- Evidência: `docs/reports/HELP_CENTER_CONTACTS_AND_ARTICLE_REVIEW_2026-07-20.md`.

## CS Ops — importação controlada e correção do ledger — 2026-07-21

- Feito: a importação local da aba `BD_Clientes` recebeu 606/606 linhas, sem
  rejeições, com hash, origem e versão de mapeamento preservados.
- Corrigido: a Edge Function `hubspot-cs-migration` agora grava as contagens com
  os nomes snake_case do ledger Postgres; o contrato foi coberto por teste
  unitário no helper compartilhado.
- Feito: Configuração voltou a expor o fluxo controlado de CS Ops: importação,
  dry-run e aplicação com confirmação explícita. O fluxo não altera tickets.
- Validado: dry-run local concluído com ledger e zero alterações externas.
- Atenção: o cache local de empresas está vazio após a reconstrução do banco;
  o dry-run local classificou 606 linhas como criação. É necessário reidratar
  o cache HubSpot antes de aplicar qualquer lote, para evitar duplicidades.
- Evidência: `docs/reports/CS_OPS_MIGRATION_DRY_RUN_2026-07-21.md`.

## Confirmação OMIE e continuidade dos lotes — 2026-07-21

- Atualizado pelo usuário: credencial OMIE configurada e sincronização real
  concluída com sucesso.
- Observado localmente: referência gerenciada para OMIE e 3.433 títulos no
  snapshot financeiro, sem exposição de credenciais.
- Pendentes: publicar funções/migrations no ambiente remoto, ativar scheduler
  protegido e repetir a reconciliação no ambiente alvo.
- Evidência: `docs/reports/OMIE_SYNC_CONFIRMATION_2026-07-21.md`.

## Mascote Gênio e estados de sincronização — 2026-07-21

- Corrigido: o braço desprendido no avatar do overlay de sincronização; a causa
  era uma transformação CSS aplicada a um grupo SVG com origem incompatível.
- Feito: mantidos loading, vazio, sucesso e avatar como superfícies do
  componente; sucesso usa expressão `wink` e carregamento mantém a magia com o
  olhar direcionado para baixo.
- Validado: `npm run web:typecheck` e `npm run web:build` aprovados.
- Evidência: `docs/reports/GENIUS_MASCOT_ARM_FIX_2026-07-21.md`.
- Atenção: a confirmação visual autenticada do overlay depende de uma sessão
  local válida; a tela pública/login foi verificada após a compilação.

## Hardening das sincronizações HubSpot e OMIE — 2026-07-21

- Feito: empresas e tickets do HubSpot passaram a usar atualização incremental
  com janela de segurança de cinco minutos; tickets evitam a varredura de
  partições históricas nessa janela; Deals continuam em carga completa por
  pipeline porque `hs_lastmodifieddate` não foi confirmado nesse objeto.
- Feito: execuções concorrentes recentes são recusadas com conflito controlado;
  execuções antigas presas em `running` são encerradas como interrompidas pelo
  runtime e permanecem auditáveis.
- Feito: a interface informa modo e contadores da sincronização.
- Feito: OMIE salvo no read model não é mascarado por falha posterior de
  atualização de propriedades no HubSpot; o resultado passa a ser `partial`.
- Validado: typecheck/build web, lint do banco, 1.192 testes pgTAP e carga local
  das duas Edge Functions sem autenticação (403 esperado).
- Evidência: `docs/reports/HUBSPOT_OMIE_SYNC_HARDENING_2026-07-21.md`.
- Pendente: primeira carga completa autenticada, publicação remota e scheduler
  protegido.

## Preflight seguro da migração CS Ops — 2026-07-21

- Feito: o ledger agora retorna a quantidade de linhas de origem, linhas válidas,
  empresas e responsáveis carregados, além da origem do catálogo usado no
  preflight.
- Feito: `apply` é bloqueado server-side quando a consulta ao HubSpot retorna
  zero empresas (`409 HUBSPOT_COMPANY_CATALOG_EMPTY`).
- Feito: a Configuração explica ao administrador que criações em massa durante
  dry-run com cache vazia são artificiais e exige reidratação antes da aplicação.
- Validado: 7 testes unitários CS Ops, typecheck/build web, lint do banco,
  1.192 testes pgTAP e `git diff --check`.
- Evidência: `docs/reports/CS_OPS_PREFLIGHT_GUARD_2026-07-21.md`.
- Pendente: reidratar o cache por sincronização HubSpot autenticada e só então
  revisar/aplicar o ledger; nenhum write externo foi executado neste lote.

## Revisão de segurança e integridade do handoff — 2026-07-21

- Feito: revisão local das funções `security definer`, views administrativas,
  RLS/grants, acesso `dashboard_viewer`, secrets server-side, CORS e scheduler.
- Corrigido: a migration de acesso do `dashboard_viewer` reafirma grants
  explícitos da função privada, da view `vw_admin_knowledge_spaces` e da RPC de
  configuração; o teste pgTAP 063 cobre leitura autenticada e bloqueio anônimo.
- Validado: nenhum segredo exposto no frontend, nenhum bypass de papel ou função
  recente sem `search_path` vazio foi identificado no escopo revisado; a suíte
  local fechou com 67 arquivos e 1.194 testes.
- Atenção: CORS curinga compartilhado e comparação direta do segredo de scheduler
  permanecem observações de hardening futuro; não foram alterados sem inventário
  de consumidores e procedimento de rotação.
- Evidência: `docs/reports/SECURITY_AND_DIFF_REVIEW_2026-07-21.md`.
- Pendente: fazer QA autenticado das superfícies alteradas e separar o diff
  herdado por domínio antes de qualquer commit/publicação.

## QA autenticado do Dashboard e agregação de sincronização faseada — 2026-07-21

- Corrigido: o cabeçalho do Dashboard não exibe mais somente a última etapa
  `cs` como se fosse o lote inteiro; as etapas `companies`, `commercial` e `cs`
  são agregadas quando pertencem à mesma janela faseada concluída.
- Feito: criado helper puro `aggregateLatestHubspotSyncRuns`, com janela de
  coerência de dois minutos e fallback para a execução mais recente quando o
  lote está incompleto, stale ou não é faseado.
- Validado: testes unitários do agrupamento (2/2), typecheck web e QA
  autenticado no navegador. O cabeçalho exibiu `2 empresas, 1147 deals,
  0 tickets`; o preset `Mês passado` selecionou `2026-06-01` a `2026-06-30`
  no Financeiro e permaneceu aplicado ao navegar para Comercial.
- Evidências: `output/playwright/gso-qa-analytics-after-grouping.md`,
  `output/playwright/gso-qa-finance-month-previous-final.md` e
  `output/playwright/gso-qa-commercial-month-previous-final.md`.
- Atenção: os testes foram locais e autenticados; scheduler remoto e publicação
  continuam gates separados. Nenhum write externo foi realizado.

## Higiene final da raiz — 2026-07-21

- Corrigido: `output/` e `Recreação do mascote Genius-handoff/` foram
  classificados na allowlist do verificador como artefatos locais ignorados,
  sem apagar evidências ou o pacote de referência do mascote.
- Validado: `npm run repository:check-root` deve reportar zero violações após a
  classificação; o teste de higiene continua cobrindo entradas não autorizadas.

## Help Center — ativação idempotente da Central Genius — 2026-07-21

- Corrigido: a central `genius` criada pelo bootstrap permanecia em `draft`,
  impedindo qualquer artigo público mesmo após o pipeline editorial; a
  migration `20260721240000_activate_genius_public_help_space_v1.sql` a torna
  `active` de forma idempotente.
- Limite: a migration não publica artigos nem altera conteúdo; publicação segue
  dependente do pipeline Octadesk com allowlist e revisão editorial.
- Teste: `supabase/tests/068_genius_public_help_space_status.sql` cobre a
  existência da tabela e o estado ativo da central.
- Execução local concluída: corpus Octadesk importado com 58 artigos; pipeline
  editorial publicou 44 artigos públicos e manteve 13 bloqueios para revisão.
- QA: `/help/genius/articles` carregou a Central Genius ativa com navegação,
  categorias e artigos; console sem erro de aplicação.

## Segurança — ACL do snapshot executivo legado e scheduler declarativo — 2026-07-21

- Corrigido: a RPC `rpc_analytics_ceo_snapshot_legacy` deixou de ser executável
  por `anon`/`authenticated`; permanece disponível apenas para
  `service_role`, como dependência interna do wrapper protegido.
- Corrigido: `omie-sync` e `analytics-integration-run` agora declaram
  `verify_jwt = false`, alinhando o gateway ao contrato interno de autorização
  por JWT administrativo ou segredo do scheduler.
- Teste: pgTAP 069 cobre a ACL da RPC legada; o smoke do segredo remoto ainda é
  gate separado e não foi executado neste lote.
- Auditorias read-only concluídas: CS Ops permanece bloqueado até reimportação
  e fingerprint do catálogo; integração/performance tem riscos priorizados em
  `docs/reports/INTEGRATION_SECURITY_PERFORMANCE_AUDIT_2026-07-21.md`.
- Hardening local: `source_record_id` duplicado agora bloqueia o lote antes do
  ledger e criações reconsultam CNPJ com falha fechada antes do POST.
## Auditoria de UX, navegação, segurança e higiene — 2026-07-22

- Feito: auditoria read-only do shell, rotas, gates de acesso, superfície
  pública de Knowledge, sinks de DOM, armazenamento local e assinaturas de
  secrets.
- Corrigido: exportação do relatório gerencial deixou de usar `document.write`;
  a impressão agora navega para um Blob HTML isolado e revoga a URL temporária.
- Validado: teste de regressão `analytics-export-security.test.mjs`, screenshots
  atuais da Central pública e do redirecionamento sem sessão para login, além
  de métricas de viewport/overflow.
- Atenção: o fixture local de `dashboard_viewer` não foi reprovisionado porque
  o binário do Supabase CLI retornou `spawnSync ... UNKNOWN`; isso é um bloqueio
  de ambiente local, não uma alteração de produto.
- Próximos ciclos: configurar contatos públicos pelo painel, cobrir payloads
  maliciosos do editor rico, implementar lease/cursor por escopo das integrações
  e repetir QA autenticado do shell depois de reparar o fixture local.
- Evidência: `docs/reports/UX_NAVIGATION_SECURITY_AUDIT_2026-07-22.md`.
# Ciclo de recuperação das sincronizações — 2026-07-22

- **Executado:** reproduzido o HTTP 503 nos endpoints locais de OMIE, HubSpot e
  orquestração; identificado Edge Runtime encerrado com código 255.
- **Executado:** runtime local reativado e configurado com reinício
  `unless-stopped`; camada de erro do frontend classifica 503, 546 e falhas
  funcionais.
- **Validado:** `OPTIONS` retornou 200 e `POST` sem credencial retornou 403 nos
  três endpoints; teste de mensagens passou 3/3.
- **Pendente:** executar uma sincronização autenticada acompanhada; dividir a
  orquestração automática OMIE ↔ HubSpot em etapas persistidas se o limite do
  worker voltar a ser atingido.
## Correcao de autorizacao da configuracao Analytics - 2026-07-22

- Feito: alinhada a UI ao contrato server-side de `platform_admin` para operacoes de escrita e sincronizacao.
- Feito: perfil `dashboard_viewer` passou a ter configuracao Analytics em modo somente leitura, mantendo ultimo status e historico visiveis.
- Validado: teste de permissao, typecheck web, build web e `git diff --check` aprovados.
- Atencao: QA autenticado visual permanece pendente por `JWT issued at future` no login local; nao e falha da autorizacao desta tela.
- Proximo passo: corrigir a divergencia de relogio do ambiente de autenticacao local e executar QA com os perfis `platform_admin` e `dashboard_viewer`.
## Hardening de sincronizacao e agenda dual - 2026-07-22

- Feito: reduzidas chamadas HubSpot financeiras com API batch e removida repeticao do enriquecimento opcional OMIE no runner combinado.
- Feito: criada configuracao independente para agenda OMIE e agenda HubSpot global.
- Feito: UI passou a expor duas cadencias e duas execucoes manuais separadas para `platform_admin`.
- Validado: OMIE dedicado 3.433/3.433; runner combinado HTTP 200 apos a correcao; migration aplicada somente localmente.
- Atencao: o primeiro teste combinado retornou 0/0 no rollup naquele instante; a consulta posterior confirmou 10.163 empresas e 136 grupos financeiros reconciliaveis no cache local.
- Pendente externo: ativar o scheduler remoto protegido por secret e publicar migrations/functions somente com aprovacao.
# Lote concluído — autorização contextual no shell — 2026-07-22

## Decidido

- A autorização efetiva de rotina deve vir das telas concedidas no vínculo de área ou no perfil reutilizável, não apenas de papéis globais.
- Papéis globais permanecem como compatibilidade e governança administrativa; não substituem a matriz contextual.

## Executado

- `fetchAdminActorContext` passou a carregar as telas do `vw_internal_actor_workspace_context`.
- Gate e redirecionamento pós-login aceitam usuários com vínculo contextual ativo, sem exigir `platform_admin` ou `dashboard_viewer`.
- Shell global monta a navegação operacional, de inteligência e administração a partir dos `screen_keys` autorizados.
- Rotas de suporte, CS, produto e console administrativo consultam a mesma matriz contextual, preservando os fallbacks de papéis existentes.
- Testes de rota e navegação foram ampliados para cobrir usuário sem papel global com acesso a Dashboard, Conhecimento e Documentos.

## Validado

- `npm run web:typecheck`: aprovado.
- `node --test tests/scripts/cs-route-access.test.mjs tests/scripts/minimal-navigation.test.mjs`: 9/9 aprovados.
- `npm run web:build`: aprovado.
- Navegação local em `/admin/internal-areas`: contrato carregado, sem estado de indisponibilidade e sem overflow horizontal.

## Pendente

- Expor CRUD de perfis nomeados na tela de Acessos, mantendo a matriz detalhada em Áreas internas.
- Migrar gradualmente telas que ainda consultam somente papéis antigos para os comandos/contextos canônicos.
- Criar usuários de QA/produção somente mediante solicitação explícita e credenciais fornecidas fora do repositório.

## Bloqueado

- Nenhum bloqueio local neste lote.
- Aplicação da migration equivalente em ambiente remoto, deploy e criação de usuários continuam fora deste ciclo por exigirem autorização operacional explícita.
# Lote concluído — recomendações e dependências de telas — 2026-07-22

## Executado

- Criadas as relações `internal_screen_area_defaults` e `internal_screen_dependencies`.
- Catálogo administrativo passou a expor `default_area_keys` e `dependency_screen_keys`.
- Áreas Customer Success, Engenharia, Financeiro, Operações, Produto e outras receberam recomendações iniciais.
- A tela de seleção pré-marca recomendações por área e expande dependências recursivamente.
- Dependências necessárias não podem ser desmarcadas enquanto outra tela selecionada depender delas.
- Triggers garantem dependências em grants de vínculo e em grants de perfil.

## Validado

- Migration executada em transação com rollback e aplicada no banco local.
- Trigger validado em transação: `analytics` adicionou `home` automaticamente.
- Catálogo local confirmou recomendações de Financeiro, Produto e Operações e dependências de `support_queue`, `support_tickets`, `analytics` e `product`.
- Typecheck, build, testes de rota/navegação e lint local aprovados.

## Pendente

- Expor edição administrativa das recomendações e dependências no CRUD de perfis/configurações, caso a governança precise alterar o catálogo sem migration.
# Lote concluído — reparo dos perfis nomeados — 2026-07-22

- Corrigidos os nomes exibidos dos cinco perfis de sistema.
- Reaplicados os grants: CS Gestor (4), CS Operador (6), Financeiro Gestor (2), Produto Operador (3) e QA Dashboard/conhecimento (4).
- Migration idempotente; não remove grants existentes e respeita as dependências declaradas.
- Validado no banco local com rollback, aplicação efetiva e consulta de contagem por perfil.
# Context Pack V2 - correção documental e evidências - 2026-07-23

## Decidido

- O Context Pack V1 foi parcialmente aceito; o macro-lote permanece aberto.
- O único próximo lote autorizado foi correção documental/evidências, sem
  implementação, redesign, deploy, migration ou normalização Git.

## Executado

- Gerado `genius-support-os-context-pack-v2.zip` por staging explícito.
- Criados `22_UI_EVIDENCE_MATRIX.md` e `23_GIT_PROVENANCE.md`.
- Enriquecidos documentos ausentes no upload individual com rotas, métricas,
  testes, duplicidades e arquitetura principal.
- Capturadas evidências visuais V2 e movidas capturas V1 ambíguas para legado.

## Validado

- Conteúdo interno do ZIP V2: 24 Markdown, 23 screenshots e 1 JSON.
- Captura visual V2: 22 rotas capturadas, 0 falhas, 0 overflow horizontal
  detectado pelo script; 1 rota de settings registrou HTTP 403 no console.

## Pendente

- Upload do ZIP V2 e dos oito documentos individuais ausentes no chat oficial.
- Aguardar avaliação do chat oficial antes de qualquer próximo macro-lote.

# Context Pack de direção assistida - 2026-07-23

## Decidido

- O novo protocolo operacional entra como regra de condução: Codex executa
  tecnicamente; a direção de produto será validada no chat oficial indicado.
- O primeiro macro-lote é documental/read-only quanto ao produto: auditar estado
  real e produzir `docs/context-handoff/`, sem novas funcionalidades.

## Executado

- Criado Context Pack local com 22 documentos Markdown.
- Copiadas 8 evidências visuais recentes para `docs/context-handoff/screenshots/`.
- Atualizados `docs/README.md`, `docs/DOCUMENTATION_LEDGER.md` e
  `docs/PROJECT_STATE.md` para apontar o pacote.

## Validado

- Validação documental e higiene de diff serão executadas antes do fechamento
  deste macro-lote.

## Pendente

- Avaliação do Context Pack pelo chat oficial de direção.
- Autorização explícita do próximo macro-lote.
- Upload no chat oficial, caso a navegação/autenticação permita.
## Atualizacao do macro-lote Dashboard API-only - 2026-08-02

- Branch de trabalho: `codex/dashboard-management-rebuild-20260802`.
- Escopo concluido: cinco areas ativas (`ceo`, `commercial`, `customer_success`, `support`, `finance`), sem Produto/Desenvolvimento na navegacao ativa e sem planilhas no caminho operacional.
- Implementado: contrato/catalogo, surface de configuracao, Chat indisponivel sem contrato confirmado, executor sequencial HubSpot -> OMIE e shell com rolagem confinada.
- Validacao: build web, typecheck web/contratos, testes focados, quality gate e validador documental aprovados; QA autenticado e sync real permanecem dependentes de sessao/credencial externa.
- Evidencia detalhada: `docs/reports/2026-08-02_dashboard-api-only-audit.md`.
- Proximo gate: capturas autenticadas, pgTAP/migration sem reset, auditoria de zeros/indisponibilidade e decisao sobre scheduler.

## Macro-lote Configuracoes e Fontes do Dashboard - 2026-08-02

### Decidido

- Não alterar as páginas analíticas do Dashboard nem executar sincronização real.
- Consolidar Configurações em rotas próprias, com um único shell e sem a barra
  interna “Dashboard e Analytics”.
- Manter HubSpot e OMIE como únicas integrações publicadas; OMIE recebe
  `APP_KEY` e `APP_SECRET` separados na UI e mantém o segredo somente no
  secret store.
- Descobrir pipelines via API, ativar novos não arquivados por padrão e
  separar Comercial, Customer Success, Suporte, Chat e A classificar.

### Em execução

- Refatorar Integrações, Fontes do Dashboard e Histórico.
- Auditar/remover diagnóstico somente após substituir seus testes por contratos
  de ausência e confirmar todos os consumidores.
- Registrar origem, cobertura e critério de classificação no read model e na UI.

### Critério de parada

- Typecheck, build, testes focados, quality gates e QA empacotado nas três rotas
  de Configurações, em claro/escuro e nos quatro viewports definidos.
- Worktree limpo, commits locais separados e relatório Delta persistido.
- Aguardar aprovação visual do Product Owner; sem push, deploy, sync real ou
  correção de fixtures pgTAP.
