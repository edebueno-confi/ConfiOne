# Minimal Operational Redesign

Data: `2026-06-09`

Status: aprovado como direcao visual pelo usuario, pendente plano de implementacao.

## Decisao

O Genius Support OS deve passar por uma refatoracao visual completa. A direcao aprovada e **Minimalista Operacional**, combinando:

- foco, velocidade e baixo ruido inspirados em Linear;
- foco contextual e componentes de tarefa inspirados em Stripe Dashboard e Stripe UI Components;
- robustez, consistencia e vocabulario de componentes inspirados em Atlassian Design System;
- acessibilidade, tokens, semantica e previsibilidade inspirados em GitHub Primer.

A implementacao atual deve ser tratada como **legado funcional**, nao como referencia estetica. Ela permanece util para:

- rotas;
- gates de auth;
- contratos de dados;
- permissoes;
- chamadas Supabase;
- fluxos reais ja validados;
- estados de loading, erro, vazio e indisponivel que dependem do backend.

Ela nao deve ser usada para preservar:

- composicao visual;
- densidade atual;
- quantidade de cards;
- quantidade de pills;
- hierarquia de textos;
- sidebar atual;
- rails atuais;
- headers atuais;
- repeticao de copy;
- excesso de botoes;
- padrao visual de dashboard.

## Diagnostico atual

O problema central nao e apenas estilo. E carga cognitiva.

Evidencias coletadas no app local:

- Login repete a mesma intencao em blocos diferentes: acesso, entrar e orientacao de conta.
- `/admin/tenants` exibiu 23 botoes, 37 links, 51 paragrafos e 41 pills.
- `/support/queue` exibiu 41 botoes e 69 pills.
- `/cs/portfolio` esta mais controlada, mas ainda herda sidebar carregada e detalhe textual demais.

Consequencia:

- o usuario precisa decidir onde olhar antes de decidir o que fazer;
- acoes principais competem com contexto secundario;
- badges e textos perdem valor porque tudo tem peso visual;
- o shell rouba atencao do fluxo;
- usuarios novos ficam desorientados;
- usuarios experientes perdem velocidade.

## Objetivo do redesign

Criar uma experiencia interna limpa, objetiva e confiavel, onde cada tela responde rapidamente:

1. Onde estou?
2. Qual e a tarefa principal aqui?
3. O que merece minha atencao agora?
4. Qual e a proxima acao segura?
5. Onde encontro detalhe sem poluir o fluxo principal?

## Principios visuais

### 1. Uma tela, uma intencao

Cada rota deve ter uma tarefa primaria dominante.

Exemplos:

- `/support/queue`: triar e escolher o proximo ticket.
- `/support/tickets/:ticketId`: resolver ou encaminhar um ticket.
- `/cs/portfolio`: entender carteira e risco operacional sem inventar score.
- `/admin/tenants`: governar clientes B2B.
- `/admin/access`: entender e governar acesso.
- `/admin/system`: observar saude, auditoria e eventos reais.
- `/admin/knowledge`: revisar, editar e publicar conhecimento governado.

Tudo que nao ajuda essa tarefa deve ser removido, rebaixado ou colocado sob demanda.

### 2. O shell deve desaparecer

O shell nao pode competir com a tarefa.

Direcao:

- sidebar mais estreita;
- grupos de navegacao reduzidos;
- icones e labels consistentes;
- perfil e logout discretos;
- nada de card pesado de usuario;
- nada de menu longo sempre aberto;
- navegacao renderizada por permissao e contexto.

O usuario deve perceber o shell como infraestrutura, nao como conteudo.

### 3. Menos cards, mais estrutura

Cards so entram quando separam uma unidade real de decisao.

Remover:

- grids de cards com metricas repetidas;
- cards aninhados;
- blocos decorativos;
- caixas com texto que repete o titulo;
- hero cards em telas operacionais.

Preferir:

- listas densas;
- tabelas limpas;
- linhas selecionaveis;
- detail rail sob demanda;
- tabs quando ha troca real de contexto;
- toolbars compactas.

### 4. Pills e badges sao excecao, nao textura

Pills devem aparecer apenas quando ajudam a decidir.

Usos permitidos:

- status;
- prioridade;
- risco;
- permissao;
- visibilidade;
- SLA;
- bloqueio.

Usos proibidos:

- decorar cada linha;
- repetir informacao textual;
- compensar falta de hierarquia;
- criar carnaval de estados sem decisao.

Regra pratica: se uma tela parece cheia de etiquetas, ela falhou.

### 5. Copy curta, operacional e sem eco

Cada texto deve ter funcao.

Remover:

- subtitulos que repetem o titulo;
- paragrafo introdutorio obvio;
- explicacao tecnica desnecessaria;
- labels uppercase em excesso;
- termos como RPC, RLS, Supabase, view, schema, seed, fixture ou role crua.

Padrao:

- titulo curto;
- contexto minimo;
- acao clara;
- indisponivel explicado em uma frase.

### 6. Hierarquia por silencio

O redesign deve usar mais espaco negativo, menos bordas, menos sombras e menos cor.

Direcao:

- fundo neutro claro;
- superficies brancas ou levemente tintadas;
- bordas sutis;
- sombra quase imperceptivel;
- azul apenas para foco, selecao e acao primaria;
- cores semanticas apenas quando ha estado real;
- tipografia menor, mais consistente e menos agressiva.

### 7. Detalhe sob demanda

Detalhe nao deve competir com fluxo.

Padroes:

- lista ou tabela principal domina a tela;
- detalhe abre em rail, painel ou modo foco;
- informacao avancada fica em tabs como `Resumo`, `Atividade`, `Auditoria`, `Avancado`;
- dados indisponiveis aparecem como indisponiveis, mas sem ocupar area nobre.

### 8. Foco contextual

Inspiracao Stripe: quando o usuario entra em uma tarefa especifica, a UI deve reduzir o fundo.

Aplicacao no Genius:

- criar ticket;
- editar cliente;
- revisar artigo;
- responder ticket;
- alterar acesso;
- publicar conhecimento;
- criar ou alterar subscription.

Esses fluxos devem usar um **Focus Surface**:

- conteudo principal claro;
- passos ou secoes curtas;
- contexto lateral minimo;
- fundo menos competitivo;
- acao primaria fixa ou previsivel;
- cancelamento claro.

### 9. Acessibilidade como base

Requisitos:

- contraste AA;
- foco visivel;
- navegação por teclado;
- targets de clique adequados;
- labels associadas a inputs;
- estados nao dependem apenas de cor;
- responsividade sem overflow horizontal;
- preferencia por componentes nativos quando possivel.

### 10. Densidade inteligente

Minimalista nao significa vazio.

Telas operacionais precisam de densidade, mas a densidade deve estar no lugar certo:

- fila de suporte pode ser densa;
- tabela de acessos pode ser densa;
- timeline de ticket pode ser densa;
- headers, cards e rails nao devem ser densos.

## Mapa de referencias

### Linear

Usar como referencia para:

- foco;
- velocidade;
- reducao de ruido;
- hierarquia de produto orientada a momentum;
- listas limpas;
- navegacao economica.

Referencia oficial: `https://linear.app/` e `https://linear.app/method/introduction`.

Aplicacao no Genius:

- menos ornamentacao;
- estado selecionado claro;
- listas como superficie principal;
- filtros compactos;
- fluxo sem interrupcao.

### Stripe Dashboard e Stripe UI Components

Usar como referencia para:

- organizacao de produto complexo;
- busca e atalhos;
- foco contextual;
- padroes de componente;
- separacao entre contexto e tarefa.

Referencias oficiais:

- `https://docs.stripe.com/dashboard/basics`
- `https://docs.stripe.com/stripe-apps/components`
- `https://docs.stripe.com/stripe-apps/components/focusview`
- `https://docs.stripe.com/stripe-apps/components/contextview`

Aplicacao no Genius:

- command/search para navegar;
- Focus Surface para tarefas;
- Context Surface para detalhe lateral;
- links para acoes sutis;
- botoes primarios raros e evidentes.

### Atlassian Design System

Usar como referencia para:

- fundamentos;
- componentes reutilizaveis;
- padroes consistentes;
- estado de botao;
- tables, flags, empty states, forms e navigation.

Referencias oficiais:

- `https://atlassian.design/`
- `https://atlassian.design/components`
- `https://atlassian.design/design-system`

Aplicacao no Genius:

- vocabulario unico de componentes;
- componentes com estados completos;
- tokens de spacing e typography;
- padroes de formulario e feedback previsiveis.

### GitHub Primer

Usar como referencia para:

- acessibilidade;
- tokens;
- tipografia;
- spacing;
- componentes robustos para produto denso.

Referencia oficial: `https://primer.style/`.

Aplicacao no Genius:

- foco em semantica;
- navegacao previsivel;
- componentes simples;
- estados claros;
- densidade sem poluicao.

## Arquitetura visual proposta

### App Shell unico

Criar um shell interno unificado para Admin, Support, CS, Internal Actions e Engineering.

Estrutura:

```text
---------------------------------------------------------------+
| compact sidebar | top context bar                            |
|                 |---------------------------------------------|
|                 | page toolbar                                |
|                 |---------------------------------------------|
|                 | primary work area       | optional context  |
|                 |                         | rail              |
+---------------------------------------------------------------+
```

Regras:

- sidebar global mostra apenas dominios disponiveis ao usuario;
- top context bar mostra ambiente, busca global, usuario e atalhos;
- page toolbar mostra titulo curto, escopo e acao primaria;
- area principal carrega lista, tabela, thread ou editor;
- rail so aparece quando ha item selecionado ou contexto real;
- mobile e notebook podem recolher sidebar e rail.

### Sidebar minimalista

Antes:

- muitos grupos expandidos;
- muitos links simultaneos;
- usuario e logout ocupando area nobre.

Depois:

- grupos colapsaveis;
- maximo 5 a 7 destinos visiveis por perfil;
- labels curtos;
- item ativo forte;
- itens sem acesso ocultos por padrao, ou mostrados apenas em modo debug/admin;
- usuario em menu discreto.

### Top context bar

Funcoes:

- busca global ou command;
- contexto atual;
- status local discreto;
- usuario e logout;
- atalhos.

Nao deve:

- repetir o titulo da pagina;
- virar dashboard;
- ter card de perfil grande.

### Page toolbar

Composicao:

- titulo curto;
- escopo ou contador essencial;
- uma acao primaria;
- acoes secundarias em menu ou links sutis;
- filtros principais compactos.

Regra: se ha mais de uma acao primaria visual, a tela falhou.

### Primary work area

Deve ser a maior area da tela.

Tipos:

- lista;
- tabela;
- thread;
- editor;
- formulario em foco;
- leitura documental.

### Context rail

Usar quando houver item selecionado.

Conteudo:

- resumo;
- proxima acao;
- metadados uteis;
- tabs de detalhe;
- auditoria sob demanda.

Nao deve:

- repetir a lista;
- conter todos os dados possiveis;
- competir com a area principal.

## Padroes por dominio

### Login

Objetivo: entrar.

Redesign:

- remover repeticao textual;
- manter um unico bloco de login;
- mascote opcional, pequeno ou removido;
- titulo curto: `Entrar`;
- subtitulo curto: `Use sua conta autorizada.`;
- campos e botao como foco;
- link ou nota discreta para acesso restrito.

### Admin Tenants

Objetivo: governar clientes B2B.

Redesign:

- remover cards de resumo competindo com lista;
- lista/tabela central como superficie principal;
- filtros compactos na toolbar ou subpanel;
- rail de cliente selecionado com tabs: `Resumo`, `Acessos`, `Produto`, `Atividade`;
- metricas apenas se ajudarem decisao operacional.

### Support Queue

Objetivo: escolher e triar proximo ticket.

Redesign:

- tabela/lista limpa e dominante;
- filtros como chips discretos;
- remover excesso de pills por linha;
- status e SLA com codificacao minima;
- preview lateral com acao `Atender ticket`;
- contadores no topo limitados a 3 ou 4 e sem cards pesados.

### Ticket Workspace

Objetivo: resolver ticket.

Redesign:

- thread central limpa;
- composer claro;
- tabs: `Conversa`, `Contexto`, `Conhecimento`, `Atividade`;
- rail sintetico de cliente e SLA;
- nota interna visualmente diferente, mas sem alarmismo;
- acoes avancadas recolhidas.

### CS Portfolio

Objetivo: entender carteira e priorizar acompanhamento.

Redesign:

- lista de clientes mais limpa;
- detalhe com blocos muito menores;
- produto/plano e tickets como linhas, nao cards;
- health indisponivel em estado discreto;
- owner e proxima acao no topo;
- sem simular playbook, tarefas ou score.

### Admin Access

Objetivo: entender quem acessa o que.

Redesign:

- tabela principal de usuarios/memberships;
- filtros compactos;
- rail com permissao efetiva;
- acoes governadas em Focus Surface;
- auditoria em tab secundaria.

### Admin System

Objetivo: observar saude e auditoria.

Redesign:

- feed de eventos/checks como superficie principal;
- indicadores compactos;
- severidade com cor contida;
- detalhe sanitizado no rail;
- nada de dashboard decorativo.

### Admin Knowledge

Objetivo: revisar e governar conhecimento.

Redesign:

- lista editorial limpa;
- editor/revisor em Focus Surface;
- status editorial discreto;
- preview em area dedicada;
- checklist e auditoria sob demanda.

## Sistema de componentes alvo

### Foundations

- `AppShell`
- `Sidebar`
- `TopContextBar`
- `PageToolbar`
- `PrimaryWorkspace`
- `ContextRail`
- `FocusSurface`
- `CommandSearch`

### Data display

- `DataList`
- `DataTable`
- `CompactMetric`
- `StatusText`
- `StatusPill`
- `MetadataRow`
- `ActivityFeed`

### Interaction

- `Button`
- `IconButton`
- `LinkAction`
- `MenuButton`
- `FilterBar`
- `SegmentedControl`
- `Tabs`
- `SearchInput`

### Feedback

- `SkeletonBlock`
- `EmptyState`
- `UnavailableState`
- `ErrorState`
- `InlineNotice`
- `Toast`

### Forms

- `Field`
- `FieldGroup`
- `Textarea`
- `Select`
- `Combobox`
- `FormSection`
- `ActionFooter`

## Tokens visuais

### Tema

Light mode principal.

Cena: operadores internos trabalham em monitores desktop durante o expediente, alternando entre triagem, tickets, clientes e governanca. A interface precisa ser calma, clara e rapida em ambiente de trabalho iluminado.

### Cor

Estrategia: restrained.

Uso:

- neutros frios como base;
- azul para foco, selecao e acao primaria;
- vermelho, amarelo e verde apenas para estados reais;
- rosa Genius apenas como detalhe de marca muito contido;
- sem gradientes decorativos;
- sem fundos saturados em cards inativos.

### Tipografia

- sistema sans ou Inter;
- escala compacta;
- h1 entre 20 e 24px em telas internas;
- labels entre 11 e 12px;
- body entre 13 e 14px;
- metadados entre 12 e 13px;
- evitar uppercase excessivo.

### Spacing

- usar escala 4/8;
- reduzir paddings de cards;
- aumentar espaco entre zonas principais;
- diminuir ruido dentro de cada zona;
- evitar gaps iguais em tudo.

### Elevation

- preferir borda e background a sombra;
- sombra muito leve apenas para rail, popover e focus surface;
- nada de glassmorphism.

## Regras de reducao de carga cognitiva

1. Maximo de 3 zonas principais por tela.
2. Maximo de 1 acao primaria visivel.
3. Maximo de 4 metricas resumidas no topo.
4. Maximo de 2 linhas de descricao por estado vazio.
5. Maximo de 1 nivel de card dentro de uma superficie.
6. Pills apenas para estados reais.
7. Acoes secundarias em menu, toolbar compacta ou link discreto.
8. Detalhe tecnico em tab secundaria.
9. Busca sempre visivel em telas de lista.
10. A UI deve funcionar para usuario distraido que voltou depois de uma interrupcao.

## Contrato de implementacao

### O que preservar

- contratos backend;
- RLS e gates;
- rotas existentes;
- fixtures locais;
- testes;
- validacoes;
- comportamento real;
- copy operacional aprovada quando estiver correta.

### O que substituir

- shell visual atual;
- sidebar atual;
- headers inflados;
- grids de cards;
- excesso de pills;
- composicoes de rail;
- repeticoes de texto;
- estilos de botoes inconsistentes;
- estados visuais carregados.

### Ordem recomendada

1. Criar foundations do novo shell e tokens visuais.
2. Refatorar login e access denied para limpar entrada e estados.
3. Refatorar shell interno global.
4. Refatorar Support Queue.
5. Refatorar Ticket Workspace.
6. Refatorar CS Portfolio.
7. Refatorar Admin Tenants.
8. Refatorar Admin Access.
9. Refatorar Admin System.
10. Refatorar Admin Knowledge.
11. Consolidar componentes e remover estilos legados.

## Criterios de aceite

Uma tela so passa se:

- nao lembra visualmente a tela atual;
- mantem o fluxo funcional existente;
- tem uma intencao primaria evidente;
- reduz textos, cards, pills e botoes;
- usa o shell minimalista novo;
- nao tem scroll horizontal;
- nao tem scroll global em cockpit interno;
- passa typecheck e build;
- e validada no Browser em desktop e notebook;
- tem estados loading, erro, vazio e indisponivel;
- nao expõe termo tecnico interno;
- nao inventa regra de negocio no frontend.

## Fora de escopo desta spec

- implementar agora;
- criar health score;
- criar follow-ups, tarefas ou projetos de CS;
- criar mutation sem RPC existente;
- alterar schema Supabase sem lote proprio;
- deploy remoto;
- redesenhar Public Help como landing de marketing.

## Proximo passo

Criar plano de implementacao detalhado com fases pequenas, começando por:

1. foundations do shell;
2. tokens/componentes base;
3. login e estados;
4. uma tela operacional piloto para validar a linguagem antes de propagar.
