# Knowledge Admin Operational Governance V3

## Objetivo
Fechar o corte operacional de governanca editorial da Knowledge Base, conectando `/admin/knowledge`, Public Help e a ponte de Knowledge no ticket a contratos reais, sem publicar conteudo nao aprovado e sem deixar o frontend decidir regra de publicacao.

## Auditoria inicial

### Contratos reaproveitados
- Tabelas base existentes: `knowledge_spaces`, `knowledge_categories`, `knowledge_articles`, `knowledge_article_revisions`, `knowledge_article_sources`, `knowledge_article_review_advisories` e `knowledge_article_editorial_drafts`.
- Enums existentes: `knowledge_visibility` e `knowledge_article_status`.
- Views administrativas existentes: `vw_admin_knowledge_spaces`, `vw_admin_knowledge_categories_v2`, `vw_admin_knowledge_articles_list_v2`, `vw_admin_knowledge_article_detail_v2` e `vw_admin_knowledge_article_review_advisories`.
- Views publicas existentes: `vw_public_knowledge_space_resolver`, `vw_public_knowledge_navigation`, `vw_public_knowledge_articles_list`, `vw_public_knowledge_article_detail` e `vw_public_help_categories`.
- RPC publica existente: `rpc_public_search_knowledge_articles`.
- RPCs administrativas v2 existentes: `rpc_admin_create_knowledge_category_v2`, `rpc_admin_create_knowledge_article_draft_v2`, `rpc_admin_update_knowledge_article_draft_v2`, `rpc_admin_submit_knowledge_article_for_review_v2`, `rpc_admin_publish_knowledge_article_v2` e `rpc_admin_archive_knowledge_article_v2`.
- RPCs de advisory existentes: `rpc_admin_update_knowledge_article_review_status` e `rpc_admin_mark_knowledge_article_reviewed`.
- RPCs de revisao editorial existentes: `rpc_admin_begin_knowledge_article_editorial_revision_v2`, `rpc_admin_update_knowledge_article_editorial_revision_v2`, `rpc_admin_publish_knowledge_article_editorial_revision_v2` e `rpc_admin_discard_knowledge_article_editorial_revision_v2`.
- Ponte segura de Knowledge no ticket existente: `vw_support_knowledge_public_link_candidates`.

### Risco encontrado
O frontend ja consumia read models reais, e o Public Help ja filtrava apenas artigos `published` + `public` no backend. A lacuna estava no contrato de mutacao: `rpc_admin_publish_knowledge_article_v2` e a publicacao de revisao editorial publicada nao exigiam, no backend, um gate unico que comprovasse advisory publico revisado e checklist humano completo antes de publicar conteudo publico.

## Contrato criado

Migration:
- `supabase/migrations/20260508164336_knowledge_admin_operational_governance_v3.sql`

Funcoes privadas:
- `app_private.public_knowledge_publish_confirmations_complete(jsonb)`
- `app_private.require_public_knowledge_publish_gate(uuid)`

RPCs endurecidas:
- `rpc_admin_publish_knowledge_article_v2(uuid, uuid)`
- `rpc_admin_publish_knowledge_article_editorial_revision_v2(uuid, uuid)`

## Regras do gate publico
Para artigo ou revisao com `visibility = public`, a publicacao agora exige no backend:
- advisory persistido para o artigo;
- `suggested_visibility = public`;
- `suggested_classification = public`;
- `review_status = reviewed`;
- `reviewed_by_user_id` preenchido;
- `reviewed_at` preenchido;
- confirmacoes humanas completas em `human_confirmations`:
  - `title_reviewed`;
  - `summary_reviewed`;
  - `body_reviewed`;
  - `category_reviewed`;
  - `visibility_reviewed`;
  - `no_sensitive_data_exposed`;
  - `ready_for_review`;
  - `ready_for_publish`.

Se qualquer criterio falhar, a RPC falha com erro de negocio antes de alterar o artigo. O frontend nao e fonte de verdade para publicar.

## RLS, grants e auditoria
- As funcoes privadas ficam no schema `app_private` e nao sao concedidas a `anon` ou `authenticated`.
- As RPCs publicas mantem uso por `authenticated` e `service_role`, com `SECURITY DEFINER` e `search_path` explicito.
- As tabelas base seguem protegidas por RLS e sem DML direto pelo frontend.
- Publicacao e publicacao de revisao editorial continuam gerando `knowledge_article_revisions` e `audit.audit_logs`.

## Frontend alterado

Arquivo:
- `apps/web/src/features/knowledge/KnowledgePage.tsx`

Alteracoes:
- `/admin/knowledge` continua lendo apenas contratos reais.
- A acao de publicar artigo publico agora tambem exige, na UI, advisory publico revisado e todas as confirmacoes humanas persistidas.
- A acao de publicar revisao editorial publica segue o mesmo criterio.
- A UI exibe copy honesta quando a publicacao publica esta bloqueada por falta de evidencia humana.
- Nenhuma acao sem contrato foi habilitada.

## Public Help
- `/help/genius`, `/help/genius/articles` e `/help/genius/articles/:slug` continuam consumindo somente read models publicos.
- Drafts, internos, restritos, playbooks internos e corpus documental bruto continuam fora da superficie publica.
- Os 8 candidatos documentais da Knowledge Base nao foram injetados, aprovados ou publicados automaticamente.

## Ticket Workspace
- A aba `Central de ajuda` segue usando apenas a ponte segura de artigos publicos publicados.
- Nao houve alteracao no fluxo de thread, composer, status, responsavel ou timeline.

## Acoes habilitadas
- Criar draft por contrato v2 existente.
- Atualizar draft por contrato v2 existente.
- Enviar draft para revisao por contrato v2 existente.
- Arquivar artigo por contrato v2 existente.
- Publicar artigo interno conforme contrato existente.
- Publicar artigo publico somente quando o novo gate backend de evidencia humana estiver completo.
- Publicar revisao editorial publica somente quando o mesmo gate estiver completo.

## Acoes bloqueadas
- Publicar publico sem advisory revisado.
- Publicar publico sem checklist humano completo.
- Expor draft/internal/restricted no Help Center publico.
- Usar os 8 candidatos documentais como conteudo publico.
- IA/advisory como decisao automatica de publicacao.
- Editor rico complexo ou indexacao por IA.
- Vinculo/envio governado de artigo ao cliente alem da leitura publica segura ja existente.

## Estado dos 8 candidatos documentais
Os 8 candidatos permanecem como documentacao interna e material inicial:
- status: pendente;
- Produto: pendente;
- Suporte/CS: pendente;
- pode publicar: nao;
- nao foram inseridos automaticamente como artigos publicos;
- nao foram aprovados;
- nao foram publicados.

## Testes executados
- `npm run supabase:db:reset`
- `npm run supabase:test:db`
- `npm run supabase:lint:db`
- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`
- `npm run supabase:qa:local-support-fixture`

## Riscos restantes
- Ainda nao existe UI especifica para coletar evidencia humana dos 8 candidatos documentais dentro do Admin.
- Acoes futuras de envio/copia governada de artigo ao cliente precisam contrato e auditoria proprios.
- Duplicacao/consolidacao editorial avancada segue fora deste corte.
- `docs/design/blueprint/Conversas.png` permanece fora do escopo.
