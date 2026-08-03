# UI_REFACTOR_BACKLOG.md

## Próxima frente oficial — DASHBOARD-02

`DASHBOARD-02 — Evolução do Dashboard Gerencial` foi registrada como próxima frente de produto, sem implementação nesta branch.

Discovery deverá detalhar: clareza dos indicadores, hierarquia da informação, utilidade operacional, filtros e períodos, comparação de resultados, estados vazios e ausência de dados, permissões por perfil, responsividade e qualidade/origem dos dados.

## Objetivo
Registrar o backlog oficial de polimento e evolucao de UX das superficies internas, sem misturar isso com entrega de backend ou feature nova.

## Itens pendentes

### DASHBOARD-07 — Dashboard Blueprint System V2 completo

Status: enfileirado em 03/08/2026; não iniciado neste registro.

Objetivo: criar uma nova direção visual e analítica para o Dashboard Gerencial,
sem copiar a composição atual e sem alterar o V1.1 até a aprovação individual
dos blueprints pelo Product Owner.

Escopo do macro-lote:

- auditar o baseline V1.1 nas cinco áreas analíticas, telas administrativas e
  estados do Gênio;
- documentar a arquitetura de leitura em quatro camadas: leitura instantânea,
  evolução, composição e ação/detalhe;
- definir temporalidade única: curto prazo com KPIs e microtendências, médio
  prazo com séries semanais e longo prazo com séries mensais/trimestrais;
- produzir blueprints individuais desktop e referências mobile para Visão Geral,
  Comercial, Customer Success, Suporte & Chat, Financeiro, Integrações, Fontes,
  Histórico e estados do Gênio;
- manter Customer Success honesto sobre denominadores e dados ainda não
  consolidados;
- tratar Integrações, Fontes e Histórico como operação administrativa, não como
  analytics decorativo;
- consolidar a identidade do Gênio como avatar técnico, sólido e amigável,
  sem linguagem sobrenatural ou aparência fantasmagórica;
- criar a especificação canônica, matriz de KPIs/temporalidade, índice de
  artefatos, revisão crítica e manifesto de validação.

Restrições:

- não alterar `apps/web`, contratos, banco, migrations, RPCs, views, métricas,
  fórmulas, integrações, dados, rotas ou CSS runtime;
- não executar reset, clean, merge, rebase, cherry-pick, stash apply/pop, push,
  deploy, migration ou sincronização HubSpot/OMIE;
- não usar dados pessoais ou dados reais identificáveis nos blueprints;
- não declarar conclusão sem inspeção visual individual, dimensões, links,
  spelling, secret scan, documentação e qualidade validados.

Entregáveis esperados:

- `docs/specs/DASHBOARD_BLUEPRINT_SYSTEM_V2.md`;
- `docs/specs/DASHBOARD_KPI_TEMPORAL_MATRIX_V1.md`;
- `docs/design/blueprint/dashboard-v2/README.md`;
- imagens individuais em `desktop/`, `mobile/` e `genio/`;
- relatório Delta com auditoria, decisões, revisão crítica, validação, limites
  e commits locais separados por frente, sem push.

Dependências: leitura dos documentos canônicos e do baseline V1.1; confirmação
do HEAD real e do estado Git inicial; uso efetivo das skills de design,
analytics, UX, documentação, qualidade e validação previstas na autorização.

Critério de parada: entregar especificação, matriz, blueprints individuais,
referências mobile, revisão crítica, relatório e manifesto; então parar e
aguardar aprovação individual do Product Owner antes de implementar o frontend.

## Decisão do Product Owner — separação de escopos — 2026-08-02

O relatório anterior que agrupava `UI-05`, `DASHBOARD-05` e `DASHBOARD-06` está
superado. Os itens abaixo têm naturezas, dependências e lotes diferentes.

### UI-05 — Gênio em ação

Status: autorizado para implementação no macro-lote `DASHBOARD VISUAL SYSTEM
V1`, somente frontend/documentação/testes.

- micro-lote isolado de design system, motion, loading e feedback de sistema;
- especificação executável: `docs/specs/UI_05_GENIO_EM_ACAO_V1.md`;
- depende somente do lifecycle atual, estado publicado, snapshot válido, asset
  vigente e tokens visuais;
- validar estados de snapshot, falha, timeout, abandono, reduced motion e ARIA;
- não alterar backend, contratos, integrações, assets ou dados neste ciclo.

### Regra de precedência

O bloco acima e a especificação UI-05 prevalecem sobre qualquer recomendação
histórica de implementar os três itens como um único macro-lote.

## Fila adicionada em 2026-08-02 — Knowledge/editor, histórico e exportação

### DASHBOARD-04 — Sincronização controlada na Visão Geral

Status: pendente de implementação; item adicionado à fila em 02/08/2026.

Adicionar na aba **Visão Geral** uma ação única e explícita para sincronizar as
bases operacionais, usando o orquestrador real HubSpot → OMIE. A ação não deve
criar uma regra paralela no frontend nem chamar diretamente os provedores.

Escopo obrigatório:

- apresentar a ação junto ao estado agregado das fontes, com destaque menor que
  os KPIs;
- exibir `Sincronizar bases` apenas para perfis autorizados pelo contrato real;
- bloquear nova execução quando já houver ciclo `queued` ou `running`;
- mostrar loading, sucesso, falha parcial, timeout e indisponibilidade de
  credencial com mensagens sanitizadas;
- registrar e exibir `cycle_id`, `correlation_id`, duração e contadores no
  Histórico, sem expor tokens ou detalhes internos;
- encaminhar a pessoa para o Histórico após iniciar ou concluir a execução;
- preservar o modelo de fonte única: HubSpot para Comercial/CS/Suporte e OMIE
  para Financeiro;
- executar somente operações read-only nos provedores e nunca inventar métricas
  durante a sincronização;
- cobrir desktop/mobile, claro/escuro, teclado, foco, erro, vazio e overflow;
- adicionar testes de contrato e captura visual real da Visão Geral alterada.

Dependências: provisão autorizada de `ANALYTICS_SYNC_SECRET` no runtime das
Edge Functions, ciclo sequencial validado, permissões/RLS auditadas e contrato
de Histórico disponível. Não implementar enquanto o ciclo protegido não estiver
validado.

### DASHBOARD-05 — Visão Gerencial HD na aba CEO

Status: autorizado para reconstrução visual no macro-lote `DASHBOARD VISUAL
SYSTEM V1`; contratos, métricas, denominadores e fontes permanecem congelados.

Superfície-alvo: `/admin/analytics?tab=ceo`.

Reconstruir a apresentação da visão gerencial para que os indicadores executivos
sejam a superfície dominante, com leitura limpa em desktop e adaptação real para
notebook e mobile. O lote deve revisar os cards hoje desalinhados em relação às
abas Comercial, Customer Success, Suporte & Chat e Financeiro.

Escopo obrigatório:

- padronizar a gramática dos cards: hierarquia de título, valor, unidade,
  contexto, estado de frescor e indisponibilidade;
- diferenciar visualmente posição atual, desempenho no período, mapa das áreas,
  trilha de integridade e sinais gerenciais, sem transformar cada bloco em uma
  caixa administrativa pesada;
- aproveitar melhor a largura disponível, evitando cards estreitos, linhas
  quebradas desnecessárias e espaços mortos;
- preservar a origem factual dos indicadores e exibir `Indisponível` quando o
  contrato não fornecer um valor, sem fabricar dados para preencher o layout;
- manter a ação de sincronização subordinada aos indicadores, com estado
  agregado das fontes e mensagens sanitizadas;
- revisar light/dark, 390, 768, 1024 e 1440px, teclado, foco, loading, erro,
  vazio e overflow horizontal;
- capturar a tela real antes/depois e registrar decisões de design, contratos
  consumidos e limitações de dados.

Critério de parada: concluir a reconstrução do shell, Visão Geral, Comercial e
as superfícies autorizadas, executar duas rodadas de QA visual e registrar as
limitações antes da revisão visual do Product Owner. Usar `frontend-design`
antes da implementação e `web-design-guidelines` na revisão final.

### DASHBOARD-06 — Fonte financeira alinhada ao cabeçalho da aba Financeiro

Status: backlog técnico de runtime e dados; não é item do próximo lote visual.

Superfície-alvo: aba **Financeiro** do Dashboard Gerencial.

Reposicionar o container que informa `Fonte financeira · Fonte: API OMIE` para o
mesmo nível horizontal e hierárquico do cabeçalho `OMIE · Contas a Receber`,
`Financeiro` e `Recebíveis, aging e posição financeira atual`. A informação deve
continuar factual e legível, mas deixar de ocupar uma faixa vertical isolada
entre o cabeçalho e os filtros.

Critérios de aceite:

- manter origem, timestamp de atualização, estado de frescor e ação `Gerenciar
  OMIE` sem duplicar dados;
- alinhar a composição com a gramática visual das demais abas;
- revisar claro/escuro, 390, 768, 1024 e 1440px, teclado, foco e overflow;
- capturar a aba Financeiro real após a alteração e validar que os cards e
  filtros continuam no fluxo correto.

### KNOWLEDGE-03 — Reconstrução do cockpit de Artigos

Status: pendente de execução; item adicionado à fila, sem alteração funcional neste registro.

Escopo obrigatório:

- reconstruir a tela de Artigos com a lista editorial como superfície dominante,
  sem tentar remendar o layout atual;
- corrigir a sobreposição da coluna de categorias, com comportamento responsivo
  real em 390, 768, 1024 e 1440px, nos temas claro e escuro;
- fazer `Gerenciar categorias` abrir uma superfície real baseada no contrato
  existente de categorias, com permissão, RLS, auditoria e estados de erro/vazio;
- fazer `Ver todas` produzir uma mudança observável e reversível de contexto
  (filtro, rota ou drawer), sem botão sem efeito;
- manter a origem factual dos artigos, categorias, status, visibilidade e
  consumo; nenhum dado editorial deve ser inventado no frontend;
- revisar a legibilidade do editor em dark mode e garantir que `Novo artigo`
  sempre inicialize título, resumo, slug, corpo e metadados vazios, sem carregar
  o artigo anteriormente aberto.

Direção de design: cockpit editorial enxuto, lista dominante, ações de gestão em
toolbar/drawer contextual, hierarquia tipográfica clara e uma única indicação
de estado ativo. Usar `frontend-design` antes da implementação e
`web-design-guidelines` depois do código.

### KNOWLEDGE-03.1 — Propriedades do artigo em dark mode

Status: pendente de execução; item adicionado à fila em 02/08/2026 a partir de
evidência visual da rota `/admin/knowledge/new`.

Superfície-alvo: drawer/painel **Propriedades do artigo**, incluindo os campos
de categoria, tags, visibilidade, espaço público, status editorial, pré-visualização
e informações do artigo.

Problema observado: no modo escuro, a composição mistura superfícies claras e
escuras e deixa textos auxiliares, labels e estados com contraste insuficiente;
o painel não parece seguir de forma consistente os tokens do tema dark.

Critérios de aceite:

- usar tokens semânticos do design system para fundo, borda, texto primário,
  texto secundário, foco, seleção, erro e estado editorial;
- garantir contraste legível em todos os campos, contadores, helper text,
  badges, cards de status e seções de pré-visualização;
- revisar select, input de tags, botão `+`, estados desabilitados, hover, foco
  por teclado e scrollbar no modo dark;
- manter a mesma semântica e hierarquia no modo claro, sem regressão de responsividade
  em 390, 768, 1024 e 1440px;
- validar a rota com captura real antes/depois e testes focados de acessibilidade,
  sem alterar contratos, permissões, RLS ou inventar dados editoriais.

### KNOWLEDGE-03.2 — Editor e propriedades em composição persistente

Status: pendente de execução; item adicionado à fila em 02/08/2026 a partir de
evidência visual da tela `/admin/knowledge/new`.

Direção de design: cockpit editorial de densidade controlada, com o editor
deslocado para a esquerda e as **Propriedades do artigo** sempre visíveis em
uma coluna lateral fixa/sticky à direita. O painel não deve depender de drawer
sobreposto para revelar campos essenciais nem exigir rolagem para alcançar o
conjunto de propriedades.

Escopo:

- substituir a abertura modal/sobreposta de propriedades por layout persistente
  de duas colunas quando houver largura suficiente;
- reservar largura real para categoria, tags, visibilidade, espaço público,
  status editorial, pré-visualização e informações do artigo;
- permitir que o editor ocupe a coluna esquerda integralmente, com toolbar e
  área de edição sem ficar comprimido pelo painel;
- manter ações de salvar/revisar no cabeçalho sem sobreposição e preservar foco,
  teclado, acessibilidade e contratos existentes;
- definir comportamento responsivo explícito para 1024, 768, 390 e 1440px,
  sem criar uma segunda fonte de verdade para os metadados.

Critérios de aceite:

- em 1440px e 1024px, propriedades essenciais ficam visíveis simultaneamente
  ao editor, sem drawer obrigatório e sem scroll interno para descobrir campos;
- o editor permanece utilizável com título, corpo e toolbar visíveis, sem
  sobreposição horizontal ou perda de foco;
- em larguras menores, o comportamento de degradação é deliberado e acessível,
  documentado antes da implementação, sem simplesmente esconder propriedades;
- validar claro/escuro, foco por teclado, contraste, overflow e capturas reais
  antes/depois; usar `frontend-design` antes do código e registrar a decisão
  visual no lote.

### DASHBOARD-03 — Exportação visual e PDF profissional

Status: pendente de execução; depende de especificação curta da superfície
exportada e validação dos dados disponíveis.

- revisar a experiência de exportação de imagem e PDF, removendo shell, menus,
  controles e estados internos do artefato final;
- produzir uma fonte estática HTML com narrativa, indicadores, definições,
  origem dos dados e limitações visíveis;
- converter HTML para PDF por Chrome headless, preservando texto selecionável,
  tabelas, gráficos e paginação profissional;
- gerar PNG em viewport definida, com composição própria para leitura e sem
  reduzir a página inteira a uma captura improvisada;
- verificar PDF e PNG quanto a páginas em branco, cortes, overflow, dados
  indisponíveis, controles indevidos e ausência de proveniência;
- persistir manifesto/evidência de exportação fora do bundle de produção.

Skills previstas: `data-analytics:build-report`, `report-to-pdf`,
`artifact-template-design-report` e `web-design-guidelines`.

### KNOWLEDGE-04 — Contratos de navegação e categorias

Status: pendente de auditoria backend antes da implementação.

- mapear o read model e os comandos reais de categoria antes de criar telas;
- cobrir `Gerenciar categorias`, `Ver todas`, paginação, filtros e retorno para
  a lista sem perder o contexto;
- adicionar testes de contrato para impedir ações no-op e regressão de layout.

### UI-04 — Hardening de superfícies já publicadas

Status: pendente de execução; preserva o lote de estabilização em andamento.

- corrigir o dark mode do editor rico, incluindo parágrafos, links, blocos,
  callouts, popovers, seleção e mídia;
- compactar o Histórico de atualizações com ciclos recolhíveis e abertura
  inicial apenas do ciclo mais recente;
- padronizar os cards de Financeiro com a mesma gramática visual de Comercial
  e Suporte, mantendo estados de frescor e indisponibilidade;
- avaliar um botão `Testar conexão` somente após existir contrato backend
  read-only, autenticado, tenant-safe e com erro sanitizado. Não reutilizar uma
  sincronização com escrita como se fosse teste de conectividade;
- manter a correção do editor `/admin/knowledge/new` como requisito funcional,
  não apenas visual.

Critérios comuns de aceite: contratos reais preservados, sem secrets no
frontend, sem mocks, typecheck/build/testes focados aprovados e capturas reais
das superfícies alteradas em claro/escuro e nas larguras publicadas.

### 1. Polimento final do Support Workspace
- calibrar ainda mais o rail do ticket para crescimento futuro de contexto
- revisar densidade da conversa com volume real maior
- garantir que nenhum estado vazio ou erro volte a usar linguagem tecnica
- avaliar um destino global melhor para `Customers` na sidebar quando nao houver tenant ja em foco

### 2. Polimento do Admin/Knowledge
- revisar peso visual entre lista editorial e detalhe em datasets maiores
- calibrar checklist, advisory e trilha de origem para revisoes longas
- reduzir ainda mais o ruido visual em estados de publicacao e arquivamento
- revisar se a subsidebar editorial precisa de recolhimento independente em notebooks menores

### 3. Customer Account Profile UI de edicao futura
- definir superficie administrativa de manutencao do perfil operacional
- separar claramente o que suporte ve do que plataforma edita

### 4. Ticket -> Knowledge Base assistive linking
- propor apoio operacional entre ticket e artigo sem transformar suporte em editor

### 5. Ticket -> Engineering work item
- definir o contrato de escalonamento para engenharia sem virar board completo dentro do suporte

### 6. SLA
- definir como SLA aparece operacionalmente sem poluir a tratativa

### 7. Kanban ou Board View operacional
- avaliar necessidade real para times de suporte ou CS antes de construir

### 8. Portal B2B do cliente
- definir superficie separada e segura para leitura do proprio cliente

### 12. Navegacao contextual entre shells internos
- revisar como Support, Admin e Knowledge compartilham atalhos sem misturar navegacao global com contexto de rota
- decidir quando uma subsidebar precisa de memoria local de ultimo contexto valido

### 9. Historico tecnico paginavel sob demanda
- abrir camada de navegacao adicional para timeline completa sem carregar tudo na primeira tela

### 10. Catalogo e governanca de integrations e features
- formalizar rotulos, grupos e ordem de exibicao do contexto do cliente

### 11. Role especifica de CS
- avaliar se suporte e CS precisam de separacao formal de permissao e leitura
## Próxima frente oficial — HIGH-DENSITY-01

### HIGH-DENSITY-01 — Reconstrução High-Density do cockpit e superfícies administrativas

Status: implementação frontend concluída na branch
`codex/high-density-ui-rebuild-20260803`; validação visual parcial, pendente
apenas dos contratos ampliados já registrados e de sincronização externa
autorizada.

Objetivo: implementar diretamente a direção visual das referências vigentes em
`docs/design/blueprint/Dashboard PO/` e `docs/design/blueprint/Suporte e conversas/`.
O produto deve comunicar mais informação útil na tela Full HD, com baixa carga
perceptual, sem alterar métricas, contratos, fontes, dados ou regras.

Escopo: shell, Visão Geral, Comercial, Customer Success, Suporte & Chat,
Financeiro, Integrações, Fontes, Histórico, temas, responsividade,
acessibilidade e Gênio em ação.

Especificação: `docs/specs/GENIUS_HIGH_DENSITY_INTERFACE_V1.md`.

Critérios: títulos até 32px, KPIs compactos, filtros em linha, grids densos,
blocos analíticos simultâneos, tabelas legíveis, sem overflow, dados ausentes
como `Indisponível`, foco visível e QA real em cinco viewports e dois temas.
O reteste de Configurações também confirmou carregamento sob demanda sem 403
de read model fora da seção aberta.

### DASHBOARD-07 — Dashboard Blueprint System V2 completo

Status: SUPERADO PARA IMPLEMENTAÇÃO em 03/08/2026. A direção V2 de novos
blueprints não será implementada. A execução vigente é HIGH-DENSITY-01, baseada
nas referências atuais já presentes no checkout.
