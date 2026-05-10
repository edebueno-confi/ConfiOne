# Customer Portal Access Administration V3

## Objetivo
Criar a administracao operacional do Portal Cliente B2B no Admin Console, sem shell novo e sem permissao inventada no frontend, para governar acesso customer-facing, entitlements de Knowledge e vinculos ticket-artigo com contratos reais.

## Ponto de entrada escolhido
- Rota dedicada: `/admin/customer-portal`
- Shell reutilizado: `AdminConsoleShell`
- Motivo:
  - o escopo mistura governanca de usuarios customer-facing e entitlements de Knowledge
  - manter tudo em `/admin/access` ou `/admin/knowledge` aumentaria duplicacao e deixaria a navegacao ambigua

## Auditoria inicial

### Reaproveitado
- `knowledge_article_entitlements`
- `ticket_knowledge_links`
- `vw_customer_portal_auth_context`
- `vw_customer_portal_knowledge_articles`
- `vw_customer_portal_knowledge_article_detail`
- `vw_customer_portal_ticket_knowledge_links`
- `rpc_admin_grant_knowledge_article_entitlement`
- `rpc_admin_archive_knowledge_article_entitlement`
- `rpc_admin_link_knowledge_article_to_ticket`
- `rpc_admin_unlink_knowledge_article_from_ticket`
- RPCs genericas de membership:
  - `rpc_admin_update_tenant_member_role`
  - `rpc_admin_update_tenant_member_status`

### Faltava
- read models administrativos proprios do portal
- consolidacao visual da governanca customer-facing no Admin Console
- contagem administrativa segura de artigos autorizados por tenant/usuario
- visao operacional segura de ticket-linked Knowledge no contexto do portal

## Contratos finais

### Views administrativas
- `vw_admin_customer_portal_access_overview`
- `vw_admin_customer_portal_tenant_access`
- `vw_admin_customer_portal_users`
- `vw_admin_customer_portal_user_detail`
- `vw_admin_knowledge_entitlements`
- `vw_admin_knowledge_entitlement_detail`
- `vw_admin_ticket_knowledge_links`
- `vw_admin_customer_portal_article_candidates`
- `vw_admin_customer_portal_ticket_candidates`

### O que as views expõem
- tenant, usuario customer-facing, role, status e ultimo acesso quando a fonte real existe
- contagem de tickets visiveis e de artigos autorizados sem depender do frontend
- entitlements ativos/arquivados com article slug, source, relation reason e actor seguro
- vinculos ticket-artigo customer-facing com tenant, ticket e status do vinculo

### O que as views bloqueiam
- password, token, segredo ou path de storage
- draft body
- article internal
- advisory/review interno
- metadata bruta
- audit bruto

## UI administrativa entregue
- `/admin/customer-portal`
  - visao geral customer-facing
  - filtro por tenant, acesso e entitlement
  - lista de usuarios do portal
  - lista de entitlements de Knowledge
  - lista de ticket links customer-facing
  - rail com detalhe, troca de role/status e acoes de grant/archive/link/unlink
- `/admin/access`
  - passou a rotular `customer_user` e `customer_manager` sem cair em `Indisponível`
- `/portal`
  - contador antigo `publicArticleCount` deixou de aparecer como numero enganoso nos cards de ticket
  - copy honesta: `Artigos autorizados: Indisponível`

## Ações habilitadas
- atualizar role customer-facing existente
- atualizar status customer-facing existente
- conceder entitlement de artigo publicado ao tenant
- arquivar entitlement
- vincular artigo autorizado a ticket
- desvincular artigo de ticket

## Ações bloqueadas
- publicar artigo
- aprovar artigo
- expor draft/internal/advisory
- busca autenticada no portal
- IA ou recomendacao inteligente
- qualquer DML direto nas tabelas base

## Fixtures e testes
- fixture local agora cobre:
  - `customer_user` ativo
  - `customer_manager` ativo
  - usuario customer-facing revogado
  - artigo `customer_portal`
  - artigo `ticket_linked`
  - entitlement arquivado
- teste pgTAP novo:
  - `032_customer_portal_access_administration.sql`

## Riscos restantes
- ainda nao existe UI administrativa dedicada para criar novo membership customer-facing do zero; a trilha generica de membership continua sendo o caminho de expansao futura
- o portal ainda nao possui busca autenticada dedicada
- o portal continua sem tenant switcher customer-facing

## Continuidade fechada em seguida
- A busca autenticada customer-facing foi fechada em `Customer Portal Search And Discoverability V3`.
- `/portal/help` passou a operar com `rpc_customer_search_knowledge_articles`.
- `/portal/tickets/:ticketId` passou a usar descoberta contextual segura por `ticket_id`.
- O Help publico permaneceu separado e nao passou a exibir artigos autenticados.

## Validacao
- `npm run supabase:db:reset`
- `npm run supabase:test:db`
- `npm run supabase:lint:db`
- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`
- `npm run supabase:qa:local-support-fixture`

## Estabilizacao posterior
- Em `2026-05-10`, a regressao de loading persistente em `/admin/customer-portal` foi corrigida sem criar auth paralela.
- Causa raiz:
  - o bootstrap inicial da tela usava `useEffectEvent` como dependencia de `useEffect`, disparando o carregamento em loop e recolocando a pagina em `loading` apos troca de sessao customer -> admin.
- Correcao:
  - bootstrap inicial alinhado ao padrao das outras superficies admin, executado uma unica vez por montagem
  - timeout explicito no carregamento inicial e nos detalhes, para converter travamento silencioso em erro real
  - regressao backend adicionada para confirmar que customer-facing nao le as views administrativas do portal
