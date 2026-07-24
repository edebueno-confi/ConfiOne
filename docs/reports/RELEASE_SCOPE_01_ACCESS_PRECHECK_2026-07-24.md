# RELEASE-SCOPE-01 — Precheck de acesso e escopo

## Objetivo

Registrar o recorte de acesso previsto para o primeiro deploy da Release 01 e os
limites verificados no código, contratos e migrations. Este documento não
substitui o smoke autenticado do ambiente publicado.

## Superfícies públicas

- `/help/genius`: home pública da Central de Ajuda, em tema claro fixo.
- `/help/genius/articles`: lista pública, busca e paginação.
- `/help/genius/articles/:slug`: artigo publicado e seus assets aprovados.
- `/help/genius/categories/:slug`: categoria pública com conteúdo publicado.
- `/portal`: entrada para a área autenticada do cliente; não é uma rota pública
  de conteúdo.

O conteúdo público é filtrado por status publicado, visibilidade pública e pelos
contratos de leitura da Knowledge Base. Assets públicos dependem de associação
aprovada, caminho de objeto governado e bucket permitido.

## Superfícies internas

- `/admin/analytics`: Dashboard Gerencial.
- `/admin/knowledge`: gestão editorial da Knowledge Base.
- `/admin/settings`, `/admin/system`, `/admin/logs` e demais rotas `/admin/*`:
  áreas internas protegidas por tela e perfil.
- `/admin/customer-portal`, `/cs`, `/support`, `/engineering` e
  `/internal-actions`: áreas internas fora do escopo de acesso do viewer.

## Matriz de primeiro deploy

| Perfil | Dashboard | Knowledge/admin | Central pública | Portal cliente |
| --- | --- | --- | --- | --- |
| anônimo | não | não | sim | não |
| cliente autenticado | não | não | sim | conforme vínculo do cliente |
| `dashboard_viewer` | somente `/admin/analytics` | não | sim | não |
| `knowledge_manager` | conforme telas atribuídas | editorial governado | sim | não |
| `platform_admin` | sim | sim | sim | conforme vínculo |

`dashboard_viewer` é tratado em duas camadas: a navegação e o guard de rota
restringem a superfície interna ao Dashboard, enquanto o gate backend
`app_private.can_manage_knowledge_base()` exclui esse perfil das views, RPCs,
policies e assets editoriais. O perfil `knowledge_manager` permanece no gate
editorial existente para não remover uma capacidade legítima.

## RPCs, views e RLS auditados

Foram revisados os contratos que dependem de `can_manage_knowledge_base`, as
views administrativas de Knowledge, as RPCs editoriais e a leitura pública de
artigos/assets. O ajuste desta release é forward-only: a migration corretiva
reafirma o gate sem reescrever migrations históricas.

O bucket `knowledge-public-assets` permanece público somente para leitura. A
escrita, atualização e remoção continuam condicionadas a usuário autenticado,
gate editorial e associação de asset legível/aprovada. Não há operação de
remoção de linhas na reconciliação de assets.

## Lacunas e condições de aceite

- A aplicação remota da migration não é executada neste lote; o workflow do PR
  valida reset, lint e pgTAP localmente. A aplicação remota depende do gate de
  merge/deploy.
- O smoke autenticado de produção e a confirmação final de políticas no
  ambiente publicado permanecem pré-condições do deploy.
- URLs de API Docs, Swagger, produção, QA e mock são configuráveis por
  ambiente, aceitam somente HTTPS e possuem fallback seguro versionado.
- Nenhum segredo, token, payload real ou caminho local funcional faz parte do
  escopo versionado.

## Evidência de precheck

- Guard frontend: `apps/web/src/features/auth/internal-route-access.ts`.
- Gate backend: `app_private.can_manage_knowledge_base()` e migration
  `20260724200000_restrict_dashboard_viewer_knowledge_access.sql`.
- Bucket/policies: migrations `20260720231000`, `20260720232000` e
  `20260720233000`.
- Regressão: testes pgTAP 063, 064, 065, 066 e 078, além de
  `tests/scripts/release-011-security.test.mjs`.
