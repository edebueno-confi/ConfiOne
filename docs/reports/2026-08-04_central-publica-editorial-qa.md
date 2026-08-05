# Central Pública — origem editorial e QA local

## Escopo

Este registro documenta o lote de consistência da Central Pública, sem expor
credenciais, tokens ou dados de autenticação.

## Origem dos dados

- O resolvedor da central pública usa `vw_public_knowledge_space_resolver`.
- A navegação e as categorias são lidas de
  `vw_public_knowledge_navigation`.
- A listagem pública usa `vw_public_knowledge_articles_list`.
- O corpo e os metadados dos artigos são resolvidos pelo contrato público de
  detalhe; os assets publicados usam `vw_public_knowledge_article_assets`.
- O conteúdo editorial importado permanece no banco como artigo publicado. A
  interface não cria contagem, categoria ou imagem fictícia.
- Imagens são referenciadas no conteúdo por `knowledge-asset:<uuid>` e só são
  renderizadas quando existe uma URL pública assinada no read model.

## Ajustes realizados

- Categorias da Home passaram a ser derivadas do catálogo real, sem mapa fixo
  de nomes ou IDs.
- A tela administrativa de Conhecimento passou a abrir o gerenciador de
  categorias pelo botão existente e permite editar categorias preservando o
  slug canônico usado pelo RPC de upsert.
- O botão “Ver todas” informa quando a lista completa de categorias está
  expandida.
- O editor de artigo remonta ao trocar de um artigo aberto para “Novo artigo”,
  evitando reaproveitamento de conteúdo anterior.
- O editor administrativo passou a reservar uma coluna persistente para
  propriedades em telas largas; em telas menores, o mesmo painel continua
  acessível como drawer sem duplicar o estado editorial.
- Os controles e a superfície do editor administrativo passaram a usar tokens
  do design system no dark mode, incluindo toolbar, campos, tags, status,
  popovers e mídia incorporada.
- O parser público reconhece imagens em linhas com prefixo de heading e não
  publica marcadores internos de origem.
- Falhas de imagem apresentam uma mensagem de leitura, mantendo o texto do
  artigo disponível e sem expor instruções internas de operação.
- O botão “Entrar no portal” informa amigavelmente que o espaço está em
  preparação, com o Gênio, sem prometer uma área ainda indisponível.

## Evidência local observada em 04/08/2026

- `http://127.0.0.1:4173/help/genius` carregou sem erro de página.
- O catálogo exibiu as categorias-raiz `Configurações` (39 artigos), `Erros
  comuns e soluções` (3 artigos) e `Integrações e API` (12 artigos).
- `http://127.0.0.1:4173/help/genius/articles` exibiu 54 artigos publicados,
  paginados em 6 páginas.
- O artigo `configurando-parametrizacao-geral` carregou 9 de 9 imagens, todas
  com `complete=true` e largura natural maior que zero.
- A abertura de `/portal` continua protegida pelo gateway de autenticação; o
  botão público não navega diretamente e apresenta o aviso de preparação.
- Não foram encontrados no texto público os marcadores
  `knowledge-asset-source`, `VITE_`, `RPC`, `Supabase` ou `tenant`.

## Validação pendente de fechamento

- Capturas autenticadas das rotas administrativas alteradas em claro e escuro.
- A validação automatizada do fechamento foi executada depois deste registro:
  typecheck web, build web, testes focados de Knowledge, Settings e Access,
  `git diff --check` e quality gate passaram. O lint permanece não configurado.

## Limites

- A evidência acima é QA local de leitura pública; não substitui validação
  autenticada das permissões administrativas nem execução de publicação remota.
- A observação sobre compilação, typecheck e testes era válida antes da retomada
  deste lote; as validações automatizadas foram executadas posteriormente e
  estão registradas na seção de validação de fechamento acima.

### Validação visual adicional — 04/08/2026

Foi feita uma captura real no Chrome autenticado em `127.0.0.1:4174` para o
fluxo de Conhecimento em tema claro e escuro. O filtro, a tabela, a rail de
categorias e as ações de edição permaneceram legíveis e sem sobreposição.

Também foi exercido o caminho `Gerenciar categorias` → `Editar` e confirmado o
carregamento do formulário de edição. O formulário de categoria foi ajustado
para uma única coluna em desktop estreito, eliminando a compressão de Nome,
Slug, categoria pai e visibilidade.

O módulo de Acessos e áreas foi capturado em tema escuro, com a trilha
`Configurações / Usuários e acesso`, e o botão `Convidar usuário` abriu o fluxo
com Nome, E-mail, Área, Função, Perfil e Validade. A tela de Configurações foi
capturada em tema claro e escuro, incluindo o histórico aninhado em Fontes do
Dashboard.

## Retomada do lote — 04/08/2026

- A seleção de telas por colaborador agora respeita a área escolhida quando a
  mesma pessoa possui mais de uma área, usando o `membership_id` real de cada
  equipe antes de salvar as permissões.
- A interface de acessos foi revisada para apresentar pessoas, equipes,
  permissões e convites em linguagem operacional, sem exibir rotas internas ou
  chaves técnicas ao usuário.
- Foram corrigidos textos com codificação quebrada no portal do cliente, no
  atendimento e na administração de áreas.
- A tela Fontes do Dashboard passou a explicar o comportamento de atualização
  sem expor detalhes de implementação: o histórico continua sendo a referência
  para volume, duração e chamadas de cada ciclo.

## Retomada do lote — permissões e cabeçalho gerencial

- O contrato canônico foi revalidado antes de ampliar a tela de acessos: a concessão de telas é persistida por membership/profile e as ações ficam nas capabilities existentes. Não foi criado um controle local sem persistência.
- A tela de perfis agora separa explicitamente “Telas para consultar” de “Ações permitidas”, mantendo a associação por RPC existente. A tela individual continua selecionando a área correta quando o colaborador possui mais de um vínculo.
- O cabeçalho da Visão Geral foi alinhado para colocar o estado das fontes à esquerda, seguido do título e da ação, preservando a altura compacta da linguagem High-Density. O estado de execução do OMIE continua junto ao cabeçalho do Financeiro e o do HubSpot junto aos domínios operacionais.
