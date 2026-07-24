# Customer Portal Search And Discoverability V3

## Objetivo
Fechar a busca autenticada e a descoberta de Knowledge no Portal Cliente B2B, permitindo que o cliente encontre apenas artigos autorizados, públicos e vinculados aos próprios tickets, sem expor draft, internal, advisory, revisão editorial ou operação interna.

## Auditoria inicial

### Reaproveitado
- `vw_customer_portal_knowledge_articles`
- `vw_customer_portal_knowledge_article_detail`
- `vw_customer_portal_ticket_knowledge_links`
- `rpc_public_search_knowledge_articles`
- `knowledge_article_entitlements`
- `ticket_knowledge_links`
- rotas já existentes:
  - `/portal`
  - `/portal/help`
  - `/portal/help/:articleSlug`
  - `/portal/tickets/:ticketId`

### Faltava
- busca autenticada dedicada no backend
- filtros reais por categoria/origem no portal
- descoberta contextual por ticket sem IA
- prova explícita de boundary entre busca pública e autenticada

## Decisão de produto e contrato
- A busca autenticada ficou concentrada em `rpc_customer_search_knowledge_articles`.
- A listagem base continua vindo de `vw_customer_portal_knowledge_articles`.
- Não foi criado ranking inteligente; a ordenação segue regra simples e segura do backend.
- Não foi criada busca fake no frontend.
- Não foi criado tenant switcher neste lote.

## RPC final

### `rpc_customer_search_knowledge_articles`
Parâmetros:
- `p_tenant_id`
- `p_search_query`
- `p_category_name`
- `p_source`
- `p_ticket_id`
- `p_limit`
- `p_offset`

Retorno:
- `article_id`
- `slug`
- `title`
- `summary`
- `category_name`
- `source`
- `source_label`
- `relation_reason`
- `published_at`
- `updated_at`
- `match_reason`

### Regras materializadas
- `tenant_id` explícito é obrigatório.
- O ator precisa ser customer-facing ativo no tenant.
- `ticket_id` só é aceito quando o ticket pertence ao tenant e é acessível ao ator.
- `source` aceito:
  - `all`
  - `public`
  - `customer_portal`
  - `ticket_linked`
- termo vazio retorna apenas a lista segura já autorizada.
- termo curto sem filtro não vaza toda a base.

## Boundary de segurança
- artigo `public` publicado aparece.
- artigo `customer_portal` aparece apenas com entitlement ativo.
- artigo `ticket_linked` aparece apenas se o cliente puder acessar o ticket.
- artigo `restricted` só aparece com entitlement legítimo ou vínculo ticket-linked permitido.
- `draft` nunca aparece.
- `internal` nunca aparece.
- entitlement arquivado remove o artigo do resultado.
- a busca não revela existência de artigo sem permissão.
- a busca pública continua separada e não retorna artigo autenticado.

## Frontend

### `/portal`
- ganhou entrada clara para a Central autorizada
- reforçou discoverability com cards reais já autorizados
- manteve copy honesta sem contador enganoso adicional

### `/portal/help`
- busca conectada ao contrato real
- filtros por categoria e origem conectados ao backend
- labels seguras de origem:
  - `Público`
  - `Autorizado no portal`
  - `Relacionado ao ticket`
- estados reais:
  - loading
  - vazio
  - erro
  - contrato indisponível

### `/portal/help/:articleSlug`
- continua abrindo apenas artigo autorizado
- não vaza `restricted` sem entitlement
- não exibe corpo de revisão interna

### `/portal/tickets/:ticketId`
- exibe artigos vinculados autorizados
- ganhou busca contextual segura por `ticket_id`
- não expõe link admin
- não cria recomendação IA

## Testes e fixture
- Novo pgTAP: `supabase/tests/033_customer_portal_search_and_discoverability.sql`
- Ajuste de auditoria: `supabase/tests/004_phase1_2_function_audit.sql`
- A fixture QA já cobria os cenários necessários e foi revalidada com:
  - artigo público pesquisável
  - artigo `customer_portal`
  - artigo `ticket_linked`
  - artigo `restricted` com entitlement
  - artigo `restricted` sem entitlement
  - artigo `draft`
  - artigo `internal`
  - ticket com artigo relacionado

## Validação
- `npm run supabase:db:reset`
- `npm run supabase:test:db`
- `npm run supabase:lint:db`
- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`
- `npm run supabase:qa:local-support-fixture`

## Ações habilitadas
- buscar artigo público no portal autenticado
- buscar artigo com entitlement do tenant
- buscar artigo relacionado a ticket permitido
- filtrar por categoria real
- filtrar por origem real
- abrir detalhe autorizado por slug

## Ações bloqueadas
- IA
- recomendação inteligente
- ranking opaco
- busca em draft/internal
- busca em `restricted` sem entitlement
- tenant switcher customer-facing
- busca administrativa nova

## Riscos restantes
- o portal ainda usa o contexto customer-facing principal; falta seleção explícita de tenant quando houver múltiplos vínculos
- o tenant switching customer-facing segue pendente e depende de `active_tenant_id` governado por backend

## Observação de continuidade
- a regressao observada em `/admin/customer-portal` durante a regressao rapida deste lote foi tratada depois em `Customer Portal Admin Session Regression Fix And Tenant Context Prep V3`.

## Próximo lote recomendado
`Customer Portal Tenant Context And Switching V3`

## Atualização posterior
- A fase `Customer Portal Tenant Context And Switching V3` fechou a seleção explícita de tenant com `active_tenant_id` backend-governed, preservando esta busca sempre filtrada pelo tenant ativo efetivo.
- A regressao posterior de visibilidade em tenant B nao veio da RPC de busca nem do read model.
- A causa raiz ficou no seed local, que mantinha ativo um entitlement declarado como arquivado.
- Regra reafirmada pela regressao:
  - entitlement arquivado nao retorna artigo em `rpc_customer_search_knowledge_articles`
  - `vw_customer_portal_knowledge_articles` nao lista artigo `restricted` sem entitlement ativo
  - `vw_customer_portal_knowledge_article_detail` retorna estado seguro para slug arquivado
  - `ticket_linked` arquivado/desvinculado nao aparece mais na busca contextual por `ticket_id`
