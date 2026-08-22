# R1 Help Admin Release Gate

## Escopo e base

- Task: `R1-HELP-ADMIN-RELEASE-GATE-2026-08-21`
- Base SHA: `acb2a95969c968be45f8fbfabba051136a151fdb`
- Auditoria local, sem leitura de secrets, chamadas externas, escrita em
  produção, publicação remota ou migration remota.
- O relatório não trata existência de rota, HTTP 200 ou presença de registro
  como prova isolada de publicação funcional.

## Matriz de superfícies

| Superfície | Evidência local | Estado e limites |
|---|---|---|
| Lista editorial | `apps/web/src/features/knowledge/KnowledgePage.tsx`; `listAdminKnowledgeArticlesV2`; `listAdminKnowledgeCategoriesV2`; `listAdminKnowledgeSpaces` | A página possui carregamento, erro, contrato indisponível, lista vazia, filtros de status/visibilidade/origem/classificação e detalhe selecionável. O read model e os filtros são a fonte do estado; nenhum conteúdo foi inventado. |
| Detalhe | `getAdminKnowledgeArticleDetailV2`, `listAdminKnowledgeArticleAssets`, advisories e revisões | O detalhe separa preview, revisão, classificação, checklist e dados avançados. Ausência de detalhe, contrato indisponível e erro têm estados próprios. Assets e rascunho editorial são carregados por contratos específicos. |
| Criação e edição | `createKnowledgeArticleDraftV2`, `updateKnowledgeArticleDraftV2`, `beginKnowledgeArticleEditorialRevisionV2`, `updateKnowledgeArticleEditorialRevisionV2`; `KnowledgeArticleEditorPage.tsx` | Rascunho novo e revisão editorial de artigo publicado são fluxos distintos. O editor preserva Markdown, categoria, visibilidade, resumo e tags conforme os contratos. Nenhuma operação de escrita foi executada nesta auditoria. |
| Estados editoriais | contratos `KnowledgeArticleStatus` e `KnowledgeArticleReviewStatus`; comandos de submit, review, publish e archive em `admin-api.ts` | Estados observados no código: `draft`, `review`, `published` e `archived`. Publicação pública exige confirmação editorial humana e evidência própria; não foi presumida por status visual. |
| Rotas e menu | `apps/web/src/app/router.tsx`, `release-surface.test.mjs`, `shell-navigation-auth-integration.test.mjs` | Rotas administrativas `/admin/knowledge`, `/admin/knowledge/new` e `/admin/knowledge/:articleId/edit`; Central pública em `/help`, `/help/:spaceSlug` e subrotas de artigos/categorias. O teste de release registra a superfície e o papel `knowledge_manager`, mas parte do diff do teste está preexistente e fica fora deste lote. |
| Permissões | `AdminGate`, `ReleaseSurfaceGate`, `canOpenInternalRoute` e testes `release-surface`/`pilot-02-contract` | O acesso depende da composição de gate, rota publicada e contexto de autorização real. O código não deve inferir permissão pelo menu. A validação ponta a ponta com sessão autenticada não foi executada. |
| Central pública e link | `features/help-center/*`, `public-api.ts`, `HelpCenterPage.tsx`, `HelpCenterHomePage.tsx`, `HelpCenterArticlesPage.tsx`, `HelpCenterArticlePage.tsx` | A superfície pública resolve espaços, navegação, categorias e artigos publicados. Estados de carregamento, vazio, contrato indisponível, erro e artigo não encontrado estão previstos. URLs e contatos públicos são sanitizados no código local. |

## Fatos reproduzidos

- Testes focados relacionados passaram em conjunto: **33/33 PASS**.
- A regra editorial usa revisão separada para artigo publicado e mantém criação
  de rascunho separada da edição editorial.
- A data pública usa `published_at`, não uma data de atualização arbitrária.
- O fluxo de publicação exige confirmações humanas e não expõe conteúdo interno
  automaticamente.
- Os comandos administrativos são chamados por RPCs/contratos existentes no
  `admin-api.ts`; nenhum comando foi executado neste lote.

## Hipóteses não promovidas a fato

- O checkout não comprova que uma publicação local esteja disponível no portal
  externo ou em produção.
- Não é possível confirmar validade de permissões, sessão, RLS, storage,
  scheduler ou configuração externa sem ambiente autorizado.
- A presença de artigos publicados no read model local não prova que o link
  público esteja acessível fora da aplicação local.

## Contaminação e allowlist

`apps/web/src/features/admin/admin-api.ts` e
`tests/scripts/release-surface.test.mjs` possuem alterações preexistentes fora
do lote documental. Não foram modificados nem serão incluídos automaticamente.
O lote desta entrega fica limitado ao relatório, handoffs e testes já existentes
executados sem alteração.

## Limitações

- Não houve QA autenticado de navegador, inspeção de console/rede, chamada a
  serviço externo, publicação real, upload de asset ou escrita administrativa.
- A revisão de Sentinel deve confirmar se a implementação preexistente pode ser
  aceita como superfície da task sem misturar alterações de outros lotes.
