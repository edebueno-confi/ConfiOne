# Plano de execução UX/UI V3 — checkpoint 2026-07-22

## Direção

O produto é um cockpit operacional B2B. A prioridade é leitura rápida, decisão
segura e operação confortável em mouse, teclado e toque. O mascote Gênio é uma
assinatura de estado e orientação, não decoração permanente.

## Estado observado

- HubSpot está operacional: 2.021 empresas, 1.148 deals e 21 tickets na última
  carga incremental informada pelo ambiente.
- OMIE está operacional: 3.433 títulos na fonte API.
- O shell interno já possuía drawer mobile, porém com alvos menores, sem retorno
  de foco e sem área de usuário/tema dentro do menu.
- O sistema possuía várias implementações de avatar e estados sem o mascote
  consistente.
- O portal do cliente ainda precisa de um drawer próprio abaixo de 1024px.

## Ciclo executado

1. Criado `components/Avatar.tsx`, com foto, iniciais determinísticas, fallback
   opcional para o Gênio, rótulo acessível e modo acionável.
2. O mascote interativo agora responde a Enter/Espaço e expõe semântica de botão.
3. Estados genéricos de carregamento, vazio, erro, permissão, indisponibilidade
   e sessão expirada passaram a usar o mascote adequado.
4. Shell interno recebeu drawer mobile com `aria-controls`, `role=dialog`, foco
   inicial, Escape para fechar, retorno de foco e área de usuário/tema/Sair.
5. Alvos essenciais do shell foram elevados para 44px e a sidebar desktop foi
   ajustada para 248px.
6. Avatar ganhou paleta determinística baseada somente em tokens do sistema.

## Plano completo por ciclos

### C0 — Fundamentos transversais, concluído parcialmente

- Avatar, mascote e estados compartilhados.
- Menu interno mobile acessível.
- Tokens, `prefers-reduced-motion`, foco visível e alvos de toque.
- Próximo gate: substituir avatares ad hoc em Inbox, Suporte, Portal e autores.

### C1 — Dashboard Gerencial

- Toolbar única com período global, origem, frescor, exportação e sincronização.
- KPIs com delta contra período anterior, unidade, hint de cálculo e fonte.
- Gráficos com tokens semânticos: receita positiva, atraso crítico, atenção em
  amarelo e informação em azul.
- Grades com `minmax(0, 1fr)`, sem overflow horizontal, tabelas colapsáveis e
  modo mobile com filtros em progressive disclosure.
- Aceite: 375, 768, 1024, 1440 e 1920px nos temas claro/escuro.

### C2 — Navegação e shell

- Sidebar desktop expandida/rail com persistência e atalho Ctrl/Cmd+B.
- Menu mobile dedicado em todas as áreas, com foco, Escape, backdrop e safe area.
- Grupos de navegação coerentes por permissão real, sem depender de pathname.
- Topbar com usuário, tema e Sair sem ocupar a área operacional.

### C3 — Suporte e tabelas operacionais

- Refluxo 768–1279px com drawer/acordeão para fila e contexto.
- Tabelas densas convertidas em linhas responsivas com `data-label`, sem ocultar
  dados essenciais.
- Filtros e paginação com alvos de toque de 44px.
- Paridade light/dark para fila, thread, rail, composer e ações internas.

### C4 — Portal, Central de Ajuda e conteúdo

- Drawer mobile do portal com navegação, troca de conta, avisos e Sair.
- Remoção de `h-screen` em favor de `--app-viewport-height`.
- Conteúdo Markdown, imagens, vídeos e artigos relacionados com leitura mobile.
- Mascote em estados de carregamento, vazio, erro e sucesso, respeitando reduced
  motion.

### C5 — Admin, Engenharia e acabamento

- Unificação gradual de primitives UI, estados, tabelas e KPI.
- Remoção de cores fixas e grids sem `minmax(0, ...)`.
- Revisão de contraste WCAG AA, teclado, foco, labels e textos pt-BR.
- QA visual autenticado nos dois temas e auditoria final de bundle/performance.

## AtualizaÃ§Ã£o de execuÃ§Ã£o — lote seguinte

- O `PortalShell` passou a ter header responsivo e drawer mobile dedicado abaixo
  de `lg`, com navegaÃ§Ã£o operacional, Tickets, Central autorizada, Sair e avatar
  com fallback do GÃªnio.
- O drawer do portal usa alvo mÃ­nimo de 44px, `role=dialog`, backdrop, foco no
  fechamento, Escape e retorno de foco ao botÃ£o de abertura.
- A navegaÃ§Ã£o fecha automaticamente quando a rota muda, evitando que o drawer
  permaneÃ§a aberto sobre uma nova tela.
- QA mÃ³vel validou `/portal` em 390x844 sem overflow horizontal; o ambiente local
  respondeu com o estado real de acesso revogado, sem mascarar a indisponibilidade
  do vÃ­nculo customer-facing.
- `web:typecheck`, `web:build` e `git diff --check` passaram apÃ³s o lote.

PrÃ³ximo gate: aplicar o mesmo padrÃ£o de menu e estado de contexto Ã s telas de
Suporte/Inbox e substituir os avatares ad hoc restantes, depois executar a matriz
visual autenticada em 375/768/1024/1440px nos dois temas.

## AtualizaÃ§Ã£o de execuÃ§Ã£o — C3 e QA de superfÃ­cies

- O avatar das mensagens de conversa do Suporte foi migrado para o componente
  compartilhado `Avatar`, preservando nome, e-mail, iniciais determinÃ­sticas e
  fallback do GÃªnio.
- A fila operacional do Suporte foi verificada em 390x844 sem overflow horizontal;
  a fila renderizou o estado real de zero tickets sem fabricar dados.
- A matriz do Dashboard Gerencial foi verificada em 375, 768, 1024 e 1440px;
  todos os quatro tamanhos permaneceram sem overflow horizontal global.
- O build final foi repetido apÃ³s os ajustes de portal, Central de Ajuda e Suporte.

PrÃ³ximo gate: executar a substituiÃ§Ã£o dos avatares restantes em Inbox/rails e
fazer a inspeÃ§Ã£o visual autenticada dos temas claro e escuro, incluindo contraste
semÃ¢ntico dos estados crÃ­tico, atenÃ§Ã£o, sucesso e informativo.

## AtualizaÃ§Ã£o de execuÃ§Ã£o — C2 e semÃ¢ntica visual

- A sidebar desktop agora possui modo rail de 64px, modo expandido de 248px,
  persistÃªncia por usuÃ¡rio/navegador e atalho Ctrl/Cmd+B.
- O rail preserva os Ã­cones, oferece `title` nos itens e nÃ£o altera as rotas nem
  as permissÃµes da navegaÃ§Ã£o.
- A paleta dos grÃ¡ficos analÃ­ticos deixou de usar hex/rgba fixos no componente:
  eixos, grade, cursor, sucesso, atenÃ§Ã£o, erro e neutro passaram a tokens que
  mudam com o tema claro/escuro.
- QA autenticado confirmou sidebar 248px expandida, 64px recolhida e persistÃªncia
  apÃ³s reload, sem overflow horizontal.

PrÃ³ximo gate: revisar as superfÃ­cies administrativas e de Knowledge para aplicar
o mesmo padrÃ£o de rail, estados, contraste e foco; depois fechar a auditoria
visual dos dois temas.

## AtualizaÃ§Ã£o de execuÃ§Ã£o — identidade Genius tecnolÃ³gica

- Cards de integraÃ§Ã£o da ConfiguraÃ§Ã£o receberam superfÃ­cie tecnolÃ³gica com
  brilho ciano, acento rosa, indicador de integraÃ§Ã£o gerenciada e elevaÃ§Ã£o sutil
  no hover.
- A decoraÃ§Ã£o usa tokens do Design System, respeita tema claro/escuro e nÃ£o
  interfere em foco, leitura, credenciais ou regras de integraÃ§Ã£o.
- QA mÃ³vel confirmou quatro cards e quatro indicadores em 390px sem overflow.
- A mesma direÃ§Ã£o visual fica registrada para replicar em OperaÃ§Ã£o, Knowledge,
  Portal, Dashboard e estados de sincronizaÃ§Ã£o: base navy/blue, energia pink,
  brilho cyan, superfÃ­cies profundas e semÃ¢ntica de status preservada.

PrÃ³ximo gate: aplicar o tratamento de identidade aos headers e cards de
Dashboard/Knowledge/Portal e realizar uma revisÃ£o de contraste para garantir que
o efeito de tecnologia nÃ£o reduza a clareza operacional.

## Definition of Done

- Nenhum scroll horizontal global.
- Nenhuma função essencial escondida no mobile.
- Alvos de toque de pelo menos 44px.
- Estados loading, vazio, erro, permissão e sucesso cobertos.
- Mascote e avatar usam componentes compartilhados.
- Tema claro/escuro com contraste AA.
- `web:typecheck`, `web:build`, testes e QA visual aprovados.
- Nenhuma alteração externa, secret ou deploy sem aprovação explícita.

## Atualização de execução — navegação orientada a perfil e design operacional

- A navegação deixou de usar os agrupamentos genéricos `Trabalho` e `Engenharia`.
  O shell agora apresenta `Minha rotina`, `Inteligência` e `Administração`; Produto
  é uma entrada de rotina condicionada aos papéis de engenharia, enquanto
  `Acionamentos` é tratado como fluxo operacional.
- `MinimalAppShell` recebe os papéis reais do actor junto das flags de acesso. A
  visibilidade do menu não depende mais de `pathname` para conceder acesso. O
  backend continua sendo o guardião final das rotas.
- A entrada `Início` foi liberada para os papéis internos reconhecidos e flags
  operacionais existentes, preparando o cockpit pessoal por área sem inventar
  métricas. Ainda falta um contrato de área/função financeira no backend para
  criar uma rotina financeira real.
- A sidebar desktop não cria uma área de rolagem própria: grupos secundários
  iniciam recolhidos, o grupo aberto fecha os demais e a rota ativa permanece
  visível. O drawer mobile conserva rolagem interna e acessibilidade.
- `FilterTabs` passou a aceitar desabilitação e foi aplicado à fila operacional,
  Inbox e recortes da fila. O estado ativo agora é preenchido de forma única;
  abas sublinhadas ficam reservadas para navegação de conteúdo.
- O botão de limpeza da fila passou a ter texto visível em desktop e a busca
  recebeu `aria-label`, reduzindo ambiguidade operacional.
- A direção visual foi formalizada na skill global `gso-operational-design` e
  complementada pela skill oficial experimental `frontend-design`: tecnologia
  discreta, azul/rosa sem excesso, sem estética genérica de IA, urgência
  semântica e espaçamento baseado em tokens/múltiplos de 4px.

### Evidência do lote

- `npm run web:typecheck` passou.
- `node --test tests/scripts/minimal-navigation.test.mjs` passou (5 testes).
- QA autenticado no Chrome local: `/support/queue` em 1440px sem overflow
  horizontal; 3 grupos de navegação; filtros unificados; sidebar sem scroll
  próprio; drawer mobile em 390px sem overflow global.

Próximo gate: criar `SearchField` e `ActiveFilterChips` compartilhados, substituir
o drawer responsivo da fila abaixo de 1280px, e depois migrar os tokens legados
do workspace de suporte sem remover funcionalidades.
