# R1 Public Help Release Gate

## Escopo e base

- Task: `R1-PUBLIC-HELP-RELEASE-GATE-2026-08-21`
- Base SHA: `e83bcaaa68685d4d446fb593598f250665ae6474`
- Auditoria local/read-only. Nenhum secret foi lido, conteúdo foi publicado,
  asset foi enviado ou serviço externo foi escrito.
- HTTP 200, rota existente ou registro local isolado não foram tratados como
  prova de publicação funcional.

## Matriz pública

| Superfície | Contrato e implementação local | Proteção de publicação |
|---|---|---|
| Home e espaços | `/help`, `/help/:spaceSlug`, `HelpCenterPage`, `HelpCenterHomePage`, `listPublicKnowledgeSpaces`, `getPublicKnowledgeSpace` e `vw_public_knowledge_space_resolver` | A resolução usa espaços/rotas públicas do read model. Estados loading, vazio, contrato indisponível e erro são explícitos. A existência do espaço local não prova disponibilidade externa. |
| Lista e busca | `HelpCenterArticlesPage`, `listPublicKnowledgeArticlePage` e `rpc_public_search_knowledge_articles` | A lista usa `vw_public_knowledge_articles_list`, limita página, sanitiza busca e filtra por espaço/categoria. A busca usa RPC pública dedicada. Os contratos SQL filtram `status='published'` e `visibility='public'`. |
| Categorias | `HelpCenterCategoriesPage`, `listPublicKnowledgeNavigation` e `vw_public_knowledge_navigation` | Categorias e contagens vêm da navegação pública. A navegação filtra categoria pública e artigos publicados/públicos; categorias sem conteúdo permanecem como estado público de ausência, não como conteúdo administrativo. |
| Artigo e não encontrado | `HelpCenterArticlePage`, `getPublicKnowledgeArticle` e `vw_public_knowledge_article_detail` | O detalhe é resolvido por espaço e slug no read model público. O SQL exige artigo publicado e público. Ausência, erro e contrato indisponível são tratados sem fallback para `knowledge_articles` administrativo. |
| Relacionados | `HelpCenterArticlePage`, artigos da navegação pública e mesma categoria | Relacionados são derivados somente do conjunto público carregado no contexto. Não há consulta ao detalhe administrativo nem inclusão de rascunhos/revisões. |
| Assets | `listPublicKnowledgeArticleAssets`, `vw_public_knowledge_article_assets` e storage público/signed URL | Assets são buscados por artigo público. O caminho público usa bucket público permitido; demais buckets dependem de URL assinada. A auditoria não acessou storage nem gerou URLs. |
| Rotas | `apps/web/src/app/router.tsx` e testes de release/navigation | As rotas públicas ficam separadas de `/admin/knowledge`. O gate de publicação é o read model/contrato público, não o menu administrativo. |

## Fatos reproduzidos

- Os read models públicos de navegação, lista e detalhe filtram conjuntamente
  status `published` e visibility `public`.
- O RPC público de busca aplica a mesma condição de publicação e visibilidade.
- A UI tem estados explícitos de loading, error, empty, contract-unavailable e
  article-not-found.
- Busca, categoria, paginação, artigo e relacionados usam o espaço público e
  os dados públicos carregados, sem fallback para read models administrativos.
- Testes públicos/editoriais existentes passaram em conjunto: **33/33 PASS**.

## Hipóteses e limites

- O checkout não prova publicação efetiva em produção, acessibilidade externa,
  configuração de DNS, storage ou RLS aplicada no ambiente em execução.
- Não houve QA autenticado/anônimo de navegador, inspeção real de console/rede,
  chamada externa, upload ou validação de conteúdo publicado no portal.
- As migrations são evidência do contrato versionado local, não prova de que
  todas estejam aplicadas no ambiente remoto.

## Contaminação e allowlist

O worktree contém alterações preexistentes em runtime, migrations, contratos e
testes. Este lote é documental/read-only: somente o relatório, handoffs e os
testes existentes executados sem alteração pertencem à entrega. Nenhum arquivo
executável ou migration foi modificado.
