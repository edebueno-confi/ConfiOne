# VIEW_RPC_CONTRACTS.md

## Regra canônica
- Leitura do app deve passar por views/read models contratuais.
- Escrita do app deve passar por RPCs transacionais.
- O app autenticado não deve ler nem escrever diretamente nas tabelas base de ticketing.

## Estado executável atual

Fase P2 - Ticket Intake, Sources & Communication Foundation:
- Origem/canal de ticket agora é contrato de leitura derivado no backend, sem integração externa real.
- Read models novos:
  - `vw_admin_ticket_channel_definitions`
  - `vw_support_ticket_channel_context`
  - `vw_support_ticket_communication_capabilities`
- Read models ampliados:
  - `vw_support_tickets_queue`
  - `vw_support_ticket_detail`
  - `vw_ticket_timeline`
  - `vw_support_ticket_timeline`
  - `vw_support_ticket_timeline_recent`
  - `vw_customer_portal_ticket_list`
  - `vw_customer_portal_ticket_detail`
  - `vw_customer_portal_ticket_timeline`
- RPCs ajustadas para gravar metadata de comunicação:
  - `rpc_create_ticket`
  - `rpc_add_ticket_message`
  - `rpc_add_internal_ticket_note`
  - `rpc_support_get_ticket_timeline`
  - `rpc_customer_create_ticket`
  - `rpc_customer_add_ticket_message`
- `can_reply_now`, `reply_mode` e `reason_if_unavailable` são derivados por backend; o frontend não decide se canal externo pode responder.
- Canais `email`, `chat` e `api` permanecem preparados para futuro e bloqueados para resposta direta até integração explícita.
- O Portal Cliente recebe apenas labels customer-facing e continua sem nota interna, internal actions, engenharia, audit bruto, storage path ou enum técnico.

Fase Knowledge Assets V1:
- A Central de Ajuda possui fundacao governada para imagens de artigos:
  - `knowledge_article_assets`
  - bucket privado `knowledge-assets`
- Leitura administrativa de assets por artigo:
  - `vw_admin_knowledge_article_assets`
- Leitura publica filtrada de assets aprovados:
  - `vw_public_knowledge_article_assets`
- Mutacoes administrativas:
  - `rpc_admin_unpublish_knowledge_article_v2`
  - `rpc_admin_upsert_knowledge_article_asset_v1`
  - `rpc_admin_update_knowledge_article_asset_review_v1`
- O frontend publico renderiza apenas placeholders governados `knowledge-asset:<id>` resolvidos pela view publica de assets; URL externa arbitraria no markdown nao e renderizada como imagem.
- `anon` nao recebe SELECT direto em `knowledge_article_assets`; `authenticated` administra via views/RPCs e policies de storage.

Fase 1.2:
- RPCs administrativas de tenancy e identidade continuam vigentes.

Fase 2:
- Ticketing core já possui views de leitura e RPCs de escrita materializadas em migration oficial.
- `authenticated` não possui `SELECT`, `INSERT`, `UPDATE` nem `DELETE` direto em `tickets`, `ticket_messages`, `ticket_events`, `ticket_assignments` e `ticket_attachments`.
- As views de tickets aplicam filtro explícito por caller via `auth.uid()` e helpers em `app_private`.

Fase 2.1:
- Os contratos tipados de ticketing foram materializados em `packages/contracts`.
- A auditoria estrutural das views foi formalizada em pgTAP.

Fase 2.3:
- O Admin Console agora possui views contratuais dedicadas para leitura administrativa.
- `platform_admin` lê a superfície administrativa global apenas por:
  - `vw_admin_tenants_list`
  - `vw_admin_tenant_detail`
  - `vw_admin_tenant_memberships`
  - `vw_admin_audit_feed`
- A escrita administrativa continua restrita às RPCs já materializadas na Fase 1.2.

Fase 3.1:
- O gate autenticado do Admin Console agora possui read model contratual próprio.
- O frontend consome o contexto do usuário autenticado apenas por:
  - `vw_admin_auth_context`
- O frontend do Admin Console não lê mais `profiles` nem `user_global_roles` diretamente.
- O client browser usa `storageKey` isolada por ambiente e o gate não volta para `idle` em refresh de token equivalente.
- A QA local real já confirmou as superfícies:
  - `/admin/tenants` -> `vw_admin_tenants_list` + `vw_admin_tenant_detail`
  - `/admin/access` -> `vw_admin_tenant_memberships`
  - `/admin/system` -> `vw_admin_audit_feed`
  - `/access-denied` -> bloqueio sem vazamento para usuário autenticado sem `platform_admin`

Fase 3.2:
- O Admin Console agora possui contrato explícito de lookup global de usuários existentes para memberships.
- O frontend administrativo consome a busca de usuários apenas por:
  - `vw_admin_user_lookup`
- `authenticated` não possui mais `SELECT` direto em `public.profiles`.
- A tela `Access` usa nome/email -> `user_id` pela view contratual e mantém fallback manual controlado apenas quando necessário.

Fase Access/System Hardening V3:
- `/admin/access` agora possui read models dedicados de control plane:
  - `vw_admin_access_users`
  - `vw_admin_access_user_detail`
  - `vw_admin_access_memberships`
- `/admin/system` agora possui read models dedicados de observabilidade segura:
  - `vw_admin_system_audit_events`
  - `vw_admin_system_health_checks`
  - `vw_admin_system_operational_summary`
- `vw_admin_system_audit_events` substitui a leitura bruta de `vw_admin_audit_feed` na tela System e nao expoe `metadata`, `before_state` ou `after_state` brutos.
- Severidade, servico, acao, impacto e contexto sanitizado do audit feed administrativo sao derivados no backend.
- `rpc_admin_add_tenant_member`, `rpc_admin_update_tenant_member_role` e `rpc_admin_update_tenant_member_status` foram endurecidas contra autopromocao e transicoes fora do contrato.

Fase 8.6:
- O intake operacional de tickets agora possui read models dedicados para a fila do suporte:
  - `vw_support_ticket_intake_tenants`
  - `vw_support_ticket_intake_contacts`
- `/support/queue` passou a abrir tickets apenas por:
  - `rpc_create_ticket`
- O frontend do intake nao le `tenants` nem `tenant_contacts` diretamente.
- O backend continua controlando o status inicial em `new`, cria `ticket_created` e preserva o audit trail existente.
- Categoria inicial continua sem contrato de dominio proprio e, por isso, nao foi habilitada no intake.

Fase 8.9:
- O storage seguro de evidências de ticket agora foi materializado com bucket privado, metadata governada, signed URL curta e isolamento explícito por `tenant_id` + `ticket_id`.
- O bucket oficial do domínio é:
  - `ticket-evidence`
- O frontend autenticado continua sem ler `ticket_attachments` nem `storage.objects` diretamente.
- A leitura contratual de evidências continua por:
  - `vw_support_ticket_attachments`
- A escrita contratual de evidências passa a existir por:
  - `rpc_support_create_ticket_attachment_upload`
  - `rpc_support_register_ticket_attachment`
  - `rpc_support_get_ticket_attachment_download_url`
- O upload binário segue fluxo governado:
  - intent por RPC
  - envio para `ticket-evidence-upload`
  - registro final via `rpc_support_register_ticket_attachment`
- O download não expõe `bucket`, `path` nem URL persistente:
  - grant curto por RPC
  - resolução por `ticket-evidence-download`

Fase 8.10:
- A classificacao operacional de tickets agora possui dominio proprio, separado de Knowledge:
  - `ticket_categories`
  - `ticket_operational_reasons`
  - `ticket_sla_policies`
- O frontend le opcoes e SLA apenas por:
  - `vw_support_ticket_classification_options`
  - `vw_support_ticket_sla_context`
  - `vw_support_tickets_queue`
  - `vw_support_ticket_detail`
- O frontend escreve classificacao, prioridade/severidade e status apenas por:
  - `rpc_create_ticket`
  - `rpc_support_update_ticket_classification`
  - `rpc_support_update_ticket_priority_severity`
  - `rpc_support_update_ticket_status_v2`
- `rpc_create_ticket` passou a aceitar categoria e motivo inicial opcionais, sem tornar categoria obrigatoria para tickets legados.
- SLA e governanca interna calculada no backend por politica ativa; o frontend nao calcula prazo nem timer.
- Transicoes invalidas de status falham no backend e mudancas relevantes geram `ticket_event` e `audit.audit_logs`.

Fase 8.11:
- A governanca de SLA evoluiu para politicas tenant-aware com fallback global controlado.
- O calendario de negocio MVP foi materializado como metadata governada, sem ainda aplicar calculo completo por horario util/feriado.
- Estruturas novas ou ampliadas:
  - `business_calendars`
  - `business_calendar_weekly_hours`
  - `business_calendar_holidays`
  - `ticket_sla_policies.tenant_id`
  - `ticket_sla_policies.business_calendar_id`
  - `ticket_sla_policies.archived_at`
- O frontend continua lendo SLA apenas por:
  - `vw_support_ticket_sla_context`
  - `vw_support_tickets_queue`
  - `vw_support_ticket_detail`
- Admin/operacao governada de policy passa por:
  - `vw_admin_ticket_sla_policies`
  - `rpc_admin_upsert_business_calendar`
  - `rpc_admin_upsert_ticket_sla_policy`
  - `rpc_admin_archive_ticket_sla_policy`
  - `rpc_support_recalculate_ticket_sla`
- `app_private.resolve_ticket_sla_policy(tenant_id, category_id, priority, severity)` aplica precedencia tenant > global, com teste cobrindo match especifico e fallback.
- O frontend nao calcula due date, status de SLA, origem de policy, pausa ou breach; esses sinais sao derivados no backend/read model.
- Pausa por status, notificacao externa e calculo por horario util completo continuam fora do contrato ate decisao explicita.

Fase 8.15:
- A fundacao customer-facing do Portal Cliente B2B foi materializada sem auth paralela e sem frontend como source of truth.
- `tenant_role` agora inclui papeis customer-facing:
  - `customer_user`
  - `customer_manager`
- O acesso customer-facing exige membership ativa, tenant explicito e contato ativo vinculado ao usuario autenticado.
- A leitura do portal cliente passa apenas por:
  - `vw_customer_portal_auth_context`
  - `vw_customer_portal_profile_context`
  - `vw_customer_portal_ticket_list`
  - `vw_customer_portal_ticket_detail`
  - `vw_customer_portal_ticket_timeline`
  - `vw_customer_portal_ticket_attachments`
  - `vw_customer_portal_knowledge_articles`
- A escrita customer-facing passa apenas por:
  - `rpc_customer_create_ticket`
  - `rpc_customer_add_ticket_message`
  - `rpc_customer_get_attachment_download_url`
  - `rpc_customer_acknowledge_ticket_update`
- As views removem contexto interno de suporte, notas internas, engenharia, SLA interno, audit bruto, advisory, drafts, Knowledge interna/restrita e storage path.
- Download de evidencia no portal usa grant curto e a edge function `ticket-evidence-download`; o frontend nao recebe `storage_bucket`, `storage_object_path` ou URL permanente.
- `customer_ticket_update_acknowledgements` registra leitura customer-facing sem permitir DML direto por `authenticated`.
- `customer_user` ve tickets do proprio contato/criacao; `customer_manager` ve tickets do proprio tenant; ambos continuam bloqueados contra cross-tenant.
- O frontend em `/portal`, `/portal/tickets` e `/portal/tickets/:ticketId` consome somente esses contratos e nao calcula permissao, SLA, status, analytics ou roteamento.

Fase 8.17:
- A colaboracao customer-facing do portal foi consolidada sem expor operacao interna.
- `vw_customer_portal_ticket_timeline` foi endurecida para expor apenas mensagens `customer` e eventos seguros para cliente, sem nota interna, engenharia, audit bruto, advisory, metadata sensivel ou anexo interno.
- Novo read model:
  - `vw_customer_portal_ticket_collaboration_state`
- O read model deriva no backend:
  - `can_reply`
  - `can_acknowledge`
  - `can_confirm_resolution`
  - `can_request_reopen`
  - `unread_count`
  - `has_new_updates`
  - `last_customer_message_at`
  - `last_support_response_at`
- RPCs customer-facing finais do lote:
  - `rpc_customer_add_ticket_message`
  - `rpc_customer_acknowledge_ticket_update`
  - `rpc_customer_confirm_ticket_resolved`
  - `rpc_customer_request_ticket_reopen`
- `rpc_customer_add_ticket_message` bloqueia tickets `resolved`, `closed` e `cancelled`, limita body a 4000 caracteres, gera `ticket_event`/`audit_log` e, quando aplicavel, move `waiting_customer` para `waiting_support` no backend.
- `rpc_customer_acknowledge_ticket_update` permanece idempotente e agora valida que o timeline entry informado pertence a timeline customer-facing autorizada.
- Confirmacao de resolucao pelo cliente so fecha ticket que ja esta `resolved`; reabertura so existe para `resolved`/`closed` com motivo obrigatorio.
- Cliente continua sem permissao para prioridade, severidade, categoria, SLA, notas internas, engenharia, audit bruto, advisory, drafts, Knowledge internal/restricted ou qualquer DML direto.

Fase 8.18:
- O acesso customer-facing a Knowledge autenticada passou a ter camada propria de entitlement, sem substituir o gate editorial publico e sem delegar filtro de seguranca ao frontend.
- Estruturas novas:
  - `knowledge_article_entitlements`
  - `knowledge_article_entitlement_scope`
  - `knowledge_article_entitlement_status`
- O modelo de entitlement aceita somente:
  - `tenant`
  - `customer_portal`
  - `ticket_linked`
- `public` continua derivado exclusivamente do gate editorial da Knowledge publica e nao pode ser concedido por entitlement administrativo.
- A leitura customer-facing de Knowledge agora passa apenas por:
  - `vw_customer_portal_knowledge_articles`
  - `vw_customer_portal_knowledge_article_detail`
  - `vw_customer_portal_ticket_knowledge_links`
- Os read models expõem somente:
  - `article_id`
  - `slug`
  - `title`
  - `summary`
  - `category_name`
  - `published_at`
  - `updated_at`
  - `relation_reason`
  - `source`
  - `source_label`
  - `body_md` apenas no detalhe autorizado
- Os read models continuam removendo `draft body`, notas internas, checklist editorial, advisory, metadata bruta, motivo interno de visibilidade, autor interno nao seguro e qualquer dado de engenharia/auditoria.
- A administracao minima de entitlement/link passa apenas por:
  - `rpc_admin_grant_knowledge_article_entitlement`
  - `rpc_admin_archive_knowledge_article_entitlement`
  - `rpc_admin_link_knowledge_article_to_ticket`
  - `rpc_admin_unlink_knowledge_article_from_ticket`
- Essas RPCs exigem artigo `published`, bloqueiam artigo `draft` e `internal`, exigem `tenant_id` explicito, validam `ticket_id` quando aplicavel e geram `audit.audit_logs`.
- `ticket_linked` para cliente autenticado depende de `ticket_knowledge_links` em `sent_to_customer` e do ticket ainda ser visivel ao ator customer-facing.
- O frontend do portal em `/portal`, `/portal/help`, `/portal/help/:articleSlug` e `/portal/tickets/:ticketId` continua apenas renderizando read models; o Public Help em `/help/:spaceSlug` segue publico e independente de sessao customer.

Fase Internal Documents Foundation V3/V4:
- Documentos internos oficiais passam a ter fundação backend-first própria, separada da Knowledge Base:
  - `internal_documents`
  - `internal_document_versions`
- A leitura contratual futura para Product Docs e Build Journal deve passar apenas por:
  - `vw_internal_documents_catalog`
  - `vw_internal_document_detail`
- As views filtram documentos `archived` e `blocked`, expõem apenas a versão atual válida/warning e aplicam autorização no backend por `platform_admin` neste corte.
- `anon`, customer-facing e `authenticated` sem papel administrativo não recebem dados pelas views.
- `authenticated` não possui `SELECT`, `INSERT`, `UPDATE` ou `DELETE` direto nas tabelas base.
- Não foi criada RPC de sync/publicação neste lote; a escrita inicial é feita por script server-side controlado, usando whitelist versionada e sem aceitar path arbitrário por CLI.
- Product Docs e Build Journal ainda não consomem essas views neste lote; a migração de frontend fica para V5.

Fase 8.19:
- A administracao operacional do portal cliente passou a ter uma superficie propria no Admin Console, sem criar shell novo e sem delegar seguranca ao frontend.
- A nova rota `/admin/customer-portal` le apenas:
  - `vw_admin_customer_portal_access_overview`
  - `vw_admin_customer_portal_tenant_access`
  - `vw_admin_customer_portal_users`
  - `vw_admin_customer_portal_user_detail`
  - `vw_admin_knowledge_entitlements`
  - `vw_admin_knowledge_entitlement_detail`
  - `vw_admin_ticket_knowledge_links`
  - `vw_admin_customer_portal_article_candidates`
  - `vw_admin_customer_portal_ticket_candidates`
- Essas views expõem apenas o necessario para governanca customer-facing:
  - tenant
  - usuario
  - role/status
  - ultimo acesso quando houver fonte real
  - contagem de tickets visiveis
  - contagem de artigos autorizados
  - relation_reason
  - ticket vinculado quando aplicavel
- Essas views bloqueiam:
  - password/auth secret/token
  - draft body
  - article internal
  - advisory/review interno
  - raw metadata
  - audit bruto
  - storage path
- A mutacao no Admin Console do portal cliente continua passando apenas por RPC:
  - `rpc_admin_grant_knowledge_article_entitlement`
  - `rpc_admin_archive_knowledge_article_entitlement`
  - `rpc_admin_link_knowledge_article_to_ticket`
  - `rpc_admin_unlink_knowledge_article_from_ticket`
  - `rpc_admin_update_tenant_member_role` para `customer_user`/`customer_manager`
  - `rpc_admin_update_tenant_member_status` para memberships customer-facing existentes
- Entitlement continua sem publicar, aprovar ou bypassar gate editorial.
- Como ainda nao existe contrato dedicado de contagem autorizada para os cards resumidos do portal, o frontend remove o numero enganoso e renderiza `Artigos autorizados: Indisponível`.

Fase 4:
- Knowledge Base agora possui núcleo editorial real com views internas contratuais e RPCs administrativas próprias.
- O frontend administrativo futuro deve consumir a superfície de leitura apenas por:
  - `vw_admin_knowledge_categories`
  - `vw_admin_knowledge_articles_list`
  - `vw_admin_knowledge_article_detail`
- A escrita editorial deve passar apenas por:
  - `rpc_admin_create_knowledge_category`
  - `rpc_admin_create_knowledge_article_draft`
  - `rpc_admin_update_knowledge_article_draft`
  - `rpc_admin_submit_knowledge_article_for_review`
  - `rpc_admin_publish_knowledge_article`
  - `rpc_admin_archive_knowledge_article`
- A importação Octadesk só cria drafts locais, preserva `source_path`/`source_hash` e nunca usa HTML como corpo principal.

Fase 4.2:
- A fundação multi-brand foi materializada de forma 100% aditiva no backend.
- O Admin Console agora possui read models administrativos novos para governança e marcas:
  - `vw_admin_organizations_list`
  - `vw_admin_organization_detail`
  - `vw_admin_knowledge_spaces`
- `knowledge_categories` e `knowledge_articles` agora aceitam `knowledge_space_id` nullable, mantendo `tenant_id` e os contratos atuais intactos.
- Não existem ainda RPCs v2 space-aware, views públicas de help center nem mudança de comportamento no frontend.
- As RPCs atuais de Knowledge Base continuam sendo a única superfície de escrita editorial exposta nesta fase.

Fase 4.3:
- O corpus atual da Knowledge Base foi associado ao `knowledge_space` oficial `genius`.
- O backend agora possui camada v2 space-aware para leitura e escrita editorial, sem quebrar a superfície legada.
- O import Octadesk agora exige destino explícito por `knowledge_space`.
- As views e RPCs antigas continuam disponíveis para compatibilidade e o frontend atual não foi alterado.

Fase 4.4:
- O Admin Console agora possui a rota `/admin/knowledge` como superfície mínima de curadoria editorial.
- O frontend dessa rota lê apenas:
  - `vw_admin_knowledge_spaces`
  - `vw_admin_knowledge_categories_v2`
  - `vw_admin_knowledge_articles_list_v2`
  - `vw_admin_knowledge_article_detail_v2`
- O frontend dessa rota escreve apenas:
  - `rpc_admin_create_knowledge_category_v2`
  - `rpc_admin_create_knowledge_article_draft_v2`
  - `rpc_admin_update_knowledge_article_draft_v2`
  - `rpc_admin_submit_knowledge_article_for_review_v2`
  - `rpc_admin_publish_knowledge_article_v2`
  - `rpc_admin_archive_knowledge_article_v2`
- Nenhuma tabela base de Knowledge Base, multi-brand ou import legado e consumida diretamente pelo frontend.

Fase 4.5:
- A Central de Ajuda pública continua sem UI, mas agora possui contratos oficiais de leitura endurecidos.
- `anon` e `authenticated` leem a superfície pública apenas por:
  - `vw_public_knowledge_space_resolver`
  - `vw_public_knowledge_navigation`
  - `vw_public_knowledge_articles_list`
  - `vw_public_knowledge_article_detail`
- Essas views expõem somente `knowledge_spaces` ativos, categorias públicas e artigos `published` + `public`.
- Nenhuma tabela base de multi-brand ou Knowledge Base fica exposta para `anon`.

Fase 4.6:
- A Central de Ajuda pública mínima agora existe como UI de leitura em `/help` e rotas filhas por `spaceSlug`.
- O frontend público lê apenas:
  - `vw_public_knowledge_space_resolver`
  - `vw_public_knowledge_navigation`
  - `vw_public_knowledge_articles_list`
  - `vw_public_knowledge_article_detail`
- O frontend público não escreve em nenhuma RPC nesta fase.
- O detalhe público renderiza apenas `body_md` com Markdown seguro; HTML legado segue fora do contrato.

Fase 4.7:
- O resolver público agora também transporta branding público sanitizado para a Central de Ajuda.
- `anon` e `authenticated` continuam lendo branding apenas por:
  - `vw_public_knowledge_space_resolver`
- Campos públicos permitidos no resolver:
  - `brand_name`
  - `logo_asset_url`
  - `theme_tokens` sanitizado por allowlist
  - `seo_defaults` sanitizado por allowlist
  - `support_contacts` sanitizado por allowlist
- O frontend público continua sem escrever em RPCs e valida novamente os valores antes de aplicar CSS, meta tags ou links.

Fase 4.9:
- A Central Pública agora possui contrato oficial de busca textual simples.
- O frontend público consulta busca apenas por:
  - `rpc_public_search_knowledge_articles`
- A RPC pública retorna apenas metadados mínimos de resultado (`article_id`, `title`, `slug`, `summary`, `category_name`, `rank_score`, `updated_at`) e nunca expõe `body_md` completo.
- A busca continua sem IA, embeddings, chat, portal B2B ou abertura pública de ticket.

Fase 5.3:
- A curadoria editorial agora possui contrato backend advisory persistente e separado do artigo canonico.
- O backlog legado passa a alimentar `knowledge_article_review_advisories` por `source_hash` e `source_path`, sem alterar `body_md`, `status` ou `visibility` automaticamente.
- O Admin Console autenticado le apenas `vw_admin_knowledge_article_review_advisories` para sinais de apoio editorial persistidos.
- A escrita administrativa dessa camada acontece apenas por:
  - `rpc_admin_update_knowledge_article_review_status`
  - `rpc_admin_mark_knowledge_article_reviewed`
- O advisory continua sendo apoio de revisao humana, nunca decisao automatica de publish.

Fase 6.1:
- O Support Workspace agora possui read models contratuais proprios e mais restritos que o ticketing core generico.
- O frontend futuro de suporte deve ler apenas:
  - `vw_support_tickets_queue`
  - `vw_support_ticket_detail`
  - `vw_support_ticket_timeline`
  - `vw_support_customer_360`
- A escrita continua nas RPCs de ticketing ja existentes:
  - `rpc_update_ticket_status`
  - `rpc_assign_ticket`
  - `rpc_add_ticket_message`
  - `rpc_add_internal_ticket_note`
  - `rpc_close_ticket`
  - `rpc_reopen_ticket`
- A revisao de authz desta fase fechou o workspace como superficie interna de suporte:
  - `platform_admin` tem acesso global;
  - `support_agent` e `support_manager` precisam de membership ativo no tenant;
  - membros comuns do tenant nao entram no workspace;
  - engenharia continua operando pelo ticketing core e fica fora destes read models, ate existir workspace/contrato proprio.

Fase 6.3:
- O Support Workspace agora possui um diretório contratual de agentes atribuiveis para remover a dependencia operacional de `user_id` manual no fluxo principal.
- O frontend de suporte passa a ler tambem:
  - `vw_support_assignable_agents`
- A atribuição continua escrita apenas por:
  - `rpc_assign_ticket`
- O diretório de agentes segue o mesmo boundary operacional da atribuição:
  - lista apenas `platform_admin`, `support_manager` e `support_agent` ativos;
  - exige membership ativo no tenant quando aplicavel;
  - nao expande acesso cross-tenant nem abre `SELECT` direto nas tabelas base.

Fase 6.4:
- O Support Workspace agora possui guardrails contratuais de volume para timeline e customer context.
- O frontend de suporte passa a ler tambem:
  - `vw_support_ticket_timeline_recent`
  - `vw_support_customer_recent_tickets`
  - `vw_support_customer_recent_events`
- Regras:
  - a timeline inicial do ticket carrega apenas a janela recente com `recent_limit`, `total_available_count` e `has_more`;
  - o customer context operacional passa a consumir recortes recentes separados para tickets e eventos;
  - a primeira tela deixa de depender de historico infinito ou arrays longas no payload principal.

Fase 6.8:
- O backend do Customer Account Profile agora foi materializado como dominio proprio, separado de ticketing, KB e portal.
- O app autenticado continua sem qualquer leitura direta em tabela-base desse dominio.
- A leitura contratual disponivel passa a existir por:
  - `vw_support_customer_account_context`
  - `vw_admin_customer_account_profiles`
- A escrita administrativa passa a existir apenas por:
  - `rpc_admin_upsert_customer_account_profile`
  - `rpc_admin_add_customer_integration`
  - `rpc_admin_update_customer_integration`
  - `rpc_admin_add_customer_customization`
  - `rpc_admin_update_customer_customization`
  - `rpc_admin_add_customer_account_alert`
  - `rpc_admin_archive_customer_account_alert`
  - `rpc_admin_set_customer_feature_flag`
- Regras:
  - `tenant_id` e obrigatorio em todas as tabelas;
  - suporte e CS internos leem apenas o contexto operacional autorizado por tenant;
  - `platform_admin` continua sendo o write actor garantido do primeiro corte;
  - o dominio bloqueia tokens, senhas, chaves, payloads sigilosos e endpoints sensiveis antes de persistir ou auditar.

Fase P1 Customer Account Operations Buildout:
- O dominio Customer Account foi fechado como operacao minima governada para Admin e Support, sem transformar o produto em CRM generico.
- Novas views administrativas dedicadas:
  - `vw_admin_customer_account_profile_detail`
  - `vw_admin_customer_account_integrations`
  - `vw_admin_customer_account_customizations`
  - `vw_admin_customer_account_alerts`
  - `vw_admin_customer_account_features`
- Novos aliases operacionais de suporte:
  - `vw_support_customers_list`
  - `vw_support_customer_detail`
- Novas RPCs administrativas:
  - `rpc_admin_archive_customer_integration`
  - `rpc_admin_archive_customer_customization`
  - `rpc_admin_update_customer_account_alert`
- Permanecem vigentes:
  - `rpc_admin_upsert_customer_account_profile`
  - `rpc_admin_add_customer_integration`
  - `rpc_admin_update_customer_integration`
  - `rpc_admin_add_customer_customization`
  - `rpc_admin_update_customer_customization`
  - `rpc_admin_add_customer_account_alert`
  - `rpc_admin_archive_customer_account_alert`
  - `rpc_admin_set_customer_feature_flag`
- `/admin/tenants` passa a usar a aba `Conta B2B` para editar perfil, adicionar/arquivar integracoes, adicionar/arquivar customizacoes, adicionar/arquivar alertas e atualizar feature flags por RPC.
- O frontend continua sem ler `customer_account_*` diretamente e sem persistir estado local como fonte de verdade.
- Portal Cliente permanece limitado a contexto customer-facing seguro; alertas internos, customizacoes, integracoes detalhadas, observacoes internas, audit bruto e paths de storage continuam fora das views do Portal.

Fase 6.15:
- O backend minimo do vinculo ticket -> Knowledge Base agora foi materializado como dominio auditavel proprio, sem abrir tabela-base ao frontend.
- O app autenticado continua sem `SELECT` direto em `ticket_knowledge_links`.
- A leitura contratual disponivel passa a existir por:
  - `vw_support_ticket_knowledge_links`
  - `vw_support_knowledge_article_picker`
- A leitura futura segura de portal foi reservada por:
  - `vw_customer_portal_ticket_knowledge_links`
- A escrita contratual passa a existir apenas por:
  - `rpc_support_link_ticket_article`
  - `rpc_support_archive_ticket_article_link`
  - `rpc_support_mark_documentation_gap`
  - `rpc_support_mark_article_needs_update`

Fase 8.4:
- A governanca operacional da Knowledge Base endureceu a publicacao publica v2 sem alterar a regra de leitura publica existente.
- O frontend administrativo continua lendo apenas:
  - `vw_admin_knowledge_spaces`
  - `vw_admin_knowledge_categories_v2`
  - `vw_admin_knowledge_articles_list_v2`
  - `vw_admin_knowledge_article_detail_v2`
  - `vw_admin_knowledge_article_review_advisories`
- O Public Help continua lendo apenas:
  - `vw_public_knowledge_space_resolver`
  - `vw_public_knowledge_navigation`
  - `vw_public_knowledge_articles_list`
  - `vw_public_knowledge_article_detail`
  - `vw_public_help_categories`
  - `rpc_public_search_knowledge_articles`
- O ticket workspace continua lendo candidatos compartilhaveis apenas por:
  - `vw_support_knowledge_public_link_candidates`
- A publicacao publica por `rpc_admin_publish_knowledge_article_v2` e `rpc_admin_publish_knowledge_article_editorial_revision_v2` agora exige gate backend de evidencia humana revisada:
  - advisory persistido;
  - classificacao publica;
  - visibilidade publica sugerida;
  - `review_status = reviewed`;
  - `reviewed_by_user_id` e `reviewed_at`;
  - checklist humano completo em `human_confirmations`.
- As funcoes privadas `app_private.public_knowledge_publish_confirmations_complete` e `app_private.require_public_knowledge_publish_gate` nao sao superficie publica do frontend.
- Os 8 candidatos documentais da Knowledge seguem fora da base publica e nao foram injetados automaticamente.
- Regras:
  - `sent_to_customer` exige artigo `public` + `published`;
  - artigo `internal` ou `restricted` nunca pode entrar no fluxo de envio ao cliente;
  - `documentation_gap` e `suggested_article` podem existir sem `article_id`;
  - o vinculo e append-only com arquivamento logico, sem delete fisico;
  - o backend nao duplica `body_md` nem publica artigo automaticamente;
  - `note` passa por bloqueio de termos tecnicos e sensiveis antes de persistir.

Fase 6.17:
- A revisao documental do contrato de link publico seguro confirmou uma lacuna entre o picker do suporte e os read models publicos da KB.
- `vw_support_knowledge_article_picker` hoje informa se o artigo pode ser enviado ao cliente, mas nao devolve a rota publica segura pronta para uso.
- Recomendacao atual:
  - manter `vw_support_knowledge_article_picker` como read model geral de busca e vinculo
  - adicionar uma view dedicada para candidatos a link publico seguro
  - manter a decisao de `can_send_to_customer` e da rota publica no backend, sem concatenacao fragil no frontend
- Shape minimo recomendado para a proxima fase:
  - `ticket_id`
  - `article_id`
  - `knowledge_space_slug`
  - `article_slug`
  - `article_title`
  - `article_visibility`
  - `article_status`
  - `public_article_path`
  - `can_send_to_customer`
  - `reason_if_blocked`

Fase 8.2:
- O lote `Support Ticket Operational Flow V3` materializou o contrato operacional faltante para historico paginado do ticket e link publico seguro de Knowledge dentro do workspace.
- O frontend de `/support/tickets/:ticketId` passa a usar:
  - `rpc_support_get_ticket_timeline`
- O backend passa a oferecer:
  - `vw_support_knowledge_public_link_candidates`
- Regras:
  - a timeline completa continua sendo lida por contrato, sem `SELECT` direto em `ticket_messages` ou `ticket_events`;
  - o carregamento de historico anterior usa cursor estavel por `occurred_at` + `timeline_entry_id`;
  - link publico seguro de Knowledge so aparece quando o artigo esta publicado, publico e possui rota publica resolvida no backend;
  - nenhuma acao de envio automatico ao cliente foi criada nesta fase.

## Views contratuais vigentes

### `vw_tickets_list`
- Finalidade: lista operacional de tickets por tenant.
- Retorna: identidade do ticket, tenant, requester, título, origem, status, prioridade, severidade, autor, assignee quando permitido, timestamps principais, contadores visíveis de mensagens e flags de permissão.
- Regras:
  - só retorna tickets de tenants acessíveis ao caller;
  - só expõe `assigned_to_*` quando o caller pode ver conteúdo interno;
  - `internal_message_count` fica zerado para perfis sem acesso interno;
  - `last_message_at` considera apenas mensagens visíveis ao caller.
  - usa `security_barrier = true`.

### `vw_ticket_detail`
- Finalidade: read model detalhado de um ticket.
- Retorna: dados completos do ticket, requester contact, motivo de fechamento, contadores visíveis de mensagens e anexos, assignee quando permitido e flags de permissão.
- Regras:
  - só retorna tickets de tenants acessíveis ao caller;
  - requester contact é carregado do mesmo tenant do ticket;
  - anexos e mensagens internas só entram nas contagens quando o caller pode ver conteúdo interno.
  - usa `security_barrier = true`.

### `vw_ticket_timeline`
- Finalidade: timeline unificada de mensagens e eventos de ticket.
- Retorna: `message` e `event` em um shape único com `timeline_entry_id`, `entry_type`, `visibility`, `occurred_at`, `actor_user_id`, `message_id`, `event_id`, `event_type`, `assignment_id`, `body` e `metadata`.
- Regras:
  - mensagens públicas e eventos públicos ficam visíveis para membros do tenant;
  - mensagens internas e eventos internos só ficam visíveis para perfis com permissão interna;
  - timeline não depende de `SELECT` direto nas tabelas base.
  - usa `security_barrier = true`.

## Views contratuais administrativas

### `vw_admin_auth_context`
- Finalidade: read model do contexto autenticado do Admin Console.
- Retorna: `id`, `full_name`, `email`, `avatar_url`, `is_active` e `roles` como array de `user_global_roles.role`.
- Regras:
  - retorna no máximo uma linha;
  - filtra explicitamente por `auth.uid()`;
  - não expõe contexto de outro usuário autenticado;
  - permite ao frontend resolver sessão, profile ativo e role global sem `SELECT` direto em `profiles` e `user_global_roles`;
  - usa `security_barrier = true`.

### `vw_admin_tenants_list`
- Finalidade: lista global de tenants do Admin Console.
- Retorna: identidade do tenant, nomes operacionais, status, região, timestamps, actor de criação/atualização, contadores agregados de memberships e contatos e resumo do contato primário.
- Regras:
  - retorna linhas apenas para `platform_admin` com `profile.is_active = true`;
  - não depende de seleção direta do frontend nas tabelas `tenants`, `tenant_memberships` e `tenant_contacts`;
  - agrega contagens no backend para manter a home de `Tenants` operacional e estável;
  - usa `security_barrier = true`.

### `vw_admin_user_lookup`
- Finalidade: lookup global de usuários existentes para o fluxo administrativo de memberships.
- Retorna: `user_id`, `full_name`, `email`, `is_active` e `created_at`.
- Regras:
  - retorna linhas apenas para `platform_admin` com `profile.is_active = true`;
  - não expõe `avatar_url`, `locale`, `timezone`, `updated_at` nem metadados de autoria;
  - não depende de leitura direta do frontend em `public.profiles`;
  - usa `security_barrier = true`.

### `vw_admin_organizations_list`
- Finalidade: lista administrativa global de organizations.
- Retorna: identidade da organization, nomes legais e operacionais, status, timestamps, autoria resolvida e contadores agregados de tenants, memberships e knowledge spaces.
- Regras:
  - retorna linhas apenas para `platform_admin` com `profile.is_active = true`;
  - não depende de leitura direta do frontend em `organizations`, `organization_memberships` ou `knowledge_spaces`;
  - agrega contagens no backend para manter a governança multi-brand operacional sem joins no client;
  - usa `security_barrier = true`.

### `vw_admin_organization_detail`
- Finalidade: read model detalhado de uma organization para contexto administrativo de governança.
- Retorna: metadados completos da organization, contadores agregados e payloads `jsonb` de `tenants`, `knowledge_spaces` e `organization_memberships`.
- Regras:
  - retorna linhas apenas para `platform_admin` com `profile.is_active = true`;
  - não vaza detalhe organizacional para `tenant_admin`, `tenant_manager` ou membros comuns;
  - mantém o payload agregado no backend para evitar leitura direta do frontend nas tabelas base novas;
  - usa `security_barrier = true`.

### `vw_admin_knowledge_spaces`
- Finalidade: lista administrativa global de knowledge spaces.
- Retorna: identidade do space, organization, tenant dono quando houver, branding principal, domínio primário, locale, status e contadores agregados de categorias e artigos.
- Regras:
  - retorna linhas apenas para `platform_admin` com `profile.is_active = true`;
  - não depende de leitura direta do frontend em `knowledge_spaces`, `knowledge_space_domains`, `brand_settings`, `knowledge_categories` ou `knowledge_articles`;
  - preserva o eixo oficial `knowledge_space` como unidade editorial/publica sem alterar as RPCs atuais da KB;
  - usa `security_barrier = true`.

### `vw_admin_tenant_detail`
- Finalidade: read model detalhado de um tenant para contexto lateral ou tela dedicada.
- Retorna: metadados completos do tenant, contadores de memberships, contadores de contatos e `contacts` agregados em `jsonb` com payload legível do contato e do usuário vinculado.
- Regras:
  - retorna linhas apenas para `platform_admin` com `profile.is_active = true`;
  - não vaza detalhe administrativo para `tenant_admin`, `tenant_manager` ou membros comuns;
  - mantém os contatos como payload contratual único para evitar join de frontend em tabelas base;
  - usa `security_barrier = true`.

### `vw_admin_tenant_memberships`
- Finalidade: read model global de memberships por tenant.
- Retorna: identidade do membership, tenant associado, status do tenant, `user_id`, nome, email, avatar, `is_active`, role e status do membership, além do convidante quando existir.
- Regras:
  - retorna linhas apenas para `platform_admin` com `profile.is_active = true`;
  - bloqueia inclusive leitura do próprio tenant para atores que não sejam `platform_admin`;
  - evita que o frontend faça join manual entre `tenant_memberships`, `tenants` e `profiles`;
  - usa `security_barrier = true`.

### `vw_admin_audit_feed`
- Finalidade: feed administrativo mínimo de rastreabilidade.
- Retorna: identidade do log, horário, ator, tenant resolvido, tabela/entidade afetada, ação, `before_state`, `after_state` e `metadata`.
- Regras:
  - retorna linhas apenas para `platform_admin` com `profile.is_active = true`;
  - restringe o feed às entidades administrativas:
    - `profiles`
    - `user_global_roles`
    - `tenants`
    - `tenant_memberships`
    - `tenant_contacts`
  - resolve contexto de tenant também para eventos da própria tabela `tenants` usando `entity_id`;
  - usa `security_barrier = true`.

### `vw_admin_knowledge_categories`
- Finalidade: lista administrativa de categorias da Knowledge Base.
- Retorna: identidade da categoria, escopo de tenant, relação com categoria pai, visibilidade, metadados editoriais básicos e contadores agregados de artigos por status.
- Regras:
  - retorna linhas apenas para `platform_admin` com `profile.is_active = true`;
  - não depende de leitura direta do frontend em `knowledge_categories` nem `knowledge_articles`;
  - mantém contadores agregados no backend para evitar joins editoriais no client;
  - usa `security_barrier = true`.

### `vw_admin_knowledge_articles_list`
- Finalidade: lista administrativa de artigos da Knowledge Base.
- Retorna: identidade do artigo, tenant/categoria, `visibility`, `status`, metadados editoriais, `source_path`, `source_hash`, revisão atual e contagem de revisões.
- Regras:
  - retorna linhas apenas para `platform_admin` com `profile.is_active = true`;
  - expõe apenas trilha editorial aprovada para operação administrativa;
  - não depende de leitura direta do frontend em `knowledge_articles`, `knowledge_article_revisions` ou `knowledge_article_sources`;
  - usa `security_barrier = true`.

### `vw_admin_knowledge_article_detail`
- Finalidade: detalhe administrativo de artigo com histórico editorial e trilha de origem.
- Retorna: payload completo do artigo, `body_md`, `source_path`, `source_hash`, revisões agregadas e fontes agregadas em `jsonb`.
- Regras:
  - retorna linhas apenas para `platform_admin` com `profile.is_active = true`;
  - preserva rastreabilidade de importação legado e versionamento editorial no backend;
  - não expõe HTML legado como contrato de frontend;
  - usa `security_barrier = true`.

### `vw_admin_knowledge_categories_v2`
- Finalidade: lista administrativa space-aware de categorias da Knowledge Base.
- Retorna: contexto de `organization`, `knowledge_space`, tenant legado quando existir, relação com categoria pai, visibilidade e contadores editoriais por status.
- Regras:
  - retorna linhas apenas para `platform_admin` com `profile.is_active = true`;
  - expõe apenas categorias com `knowledge_space_id` não nulo;
  - não depende de leitura direta do frontend em `knowledge_categories` ou `knowledge_articles`;
  - usa `security_barrier = true`.

### `vw_admin_knowledge_articles_list_v2`
- Finalidade: lista administrativa space-aware de artigos da Knowledge Base.
- Retorna: contexto de `organization`, `knowledge_space`, tenant legado quando existir, categoria, visibilidade, status, trilha de origem e estatísticas de revisão.
- Regras:
  - retorna linhas apenas para `platform_admin` com `profile.is_active = true`;
  - expõe apenas artigos com `knowledge_space_id` não nulo;
  - é a lista contratual principal para a futura camada editorial multi-brand;
  - usa `security_barrier = true`.

### `vw_admin_knowledge_article_detail_v2`
- Finalidade: detalhe administrativo space-aware de artigo.
- Retorna: payload completo do artigo com `organization`, `knowledge_space`, tenant legado quando existir, `body_md`, revisões e fontes agregadas.
- Regras:
  - retorna linhas apenas para `platform_admin` com `profile.is_active = true`;
  - expõe apenas artigos com `knowledge_space_id` não nulo;
  - preserva rastreabilidade de backfill e importação legado por `source_path` e `source_hash`;
  - usa `security_barrier = true`.

### `vw_admin_knowledge_article_review_advisories`
- Finalidade: read model administrativo persistente de apoio editorial para revisao da Knowledge Base.
- Retorna: artigo, `knowledge_space`, trilha de origem (`source_path`, `source_hash`), `suggested_visibility`, `suggested_classification`, `classification_reason`, `duplicate_group_key`, `duplicate_group_article_count`, `risk_flags`, `human_confirmations`, `review_status`, `review_notes` e trilha de autoria/revisao.
- Regras:
  - retorna linhas apenas para `platform_admin` com `profile.is_active = true`;
  - expõe apenas advisories associados a artigos da KB administrativa;
  - não altera nem substitui o dado editorial canonico de `knowledge_articles`;
  - não fica exposta para `anon` nem para surfaces publicas;
  - usa `security_barrier = true`.

### `vw_support_tickets_queue`
- Finalidade: fila operacional do Support Workspace interno B2B.
- Retorna: metadados do ticket, contexto do tenant, requester resolvido, flags de permissao herdadas do core e sinais operacionais (`is_unassigned`, `is_waiting_customer`, `is_waiting_support`, `is_waiting_engineering`).
- Regras:
  - retorna linhas apenas para `platform_admin` ou `support_agent`/`support_manager` com membership ativo no tenant;
  - nao expande acesso para membros comuns nem para engenharia nesta fase;
  - nao depende de `SELECT` direto do frontend em `tickets`, `tenants` ou `tenant_contacts`;
  - usa `security_barrier = true`.

### `vw_support_ticket_detail`
- Finalidade: detalhe contratual do ticket dentro do Support Workspace.
- Retorna: payload detalhado do ticket, requester, contexto do tenant e flags operacionais do caller.
- Regras:
  - reaproveita o `vw_ticket_detail` como base canônica;
  - preserva separacao entre comunicacao publica e conteudo interno;
  - nao vaza tickets de outros tenants nem abre acesso para perfis fora do workspace;
  - usa `security_barrier = true`.

### `vw_support_ticket_timeline`
- Finalidade: timeline unificada do Support Workspace com contexto enriquecido de tenant e ator.
- Retorna: mensagens e eventos do ticket, com `actor_full_name` e `actor_email` quando houver profile associado.
- Regras:
  - mostra mensagens publicas e notas internas somente para callers do workspace autorizados;
  - membros comuns do tenant continuam sem acesso a esta superficie;
  - timeline segue sem depender de `SELECT` direto nas tabelas base;
  - usa `security_barrier = true`.

### `vw_support_ticket_timeline_recent`
- Finalidade: janela recente da timeline do ticket para a primeira carga operacional.
- Retorna: o mesmo shape da timeline de suporte, acrescido de `recent_rank`, `total_available_count`, `recent_limit` e `has_more`.
- Regras:
  - limita a primeira carga a 25 registros mais recentes por ticket;
  - preserva a separacao entre resposta publica, nota interna e eventos de sistema;
  - nao expande acesso cross-tenant;
  - usa `security_barrier = true`.

### `vw_support_knowledge_public_link_candidates`
- Finalidade: candidatos seguros de artigo publico para uso assistivo dentro de um ticket.
- Retorna: `ticket_id`, `tenant_id`, contexto do tenant, `article_id`, `article_title`, `article_slug`, `article_summary`, `category_name`, `article_visibility`, `article_status`, `public_article_path`, `can_send_to_customer`, `is_customer_send_allowed` e `reason_if_blocked`.
- Regras:
  - filtra pelo tenant do ticket e pela permissao do Support Workspace;
  - depende de `app_private.vw_knowledge_articles_public_contract`;
  - retorna apenas artigos publicos publicados com `public_article_path` resolvido;
  - `can_send_to_customer` so e verdadeiro quando `public_article_path` esta preenchido, `article_status = published` e `article_visibility = public`;
  - nao expõe draft, internal, restricted, playbook interno ou rota montada por heuristica no frontend;
  - usa `security_barrier = true`.

### `vw_support_knowledge_article_picker` - elegibilidade de envio
- O picker geral do Support Workspace continua permitindo vinculo interno de artigos autorizados ao ticket.
- Para acao customer-facing, o frontend deve considerar apenas os campos projetados pelo backend:
  - `can_send_to_customer = true`
  - `is_customer_send_allowed = true`
  - `public_article_path` preenchido
  - `article_status = published`
  - `article_visibility = public`
- Quando qualquer requisito falhar, `reason_if_blocked` deve alimentar copy operacional e a acao de copiar/enviar link deve permanecer desabilitada.

### `vw_support_customer_360`
- Finalidade: read model minimo de visao 360 do cliente B2B para suporte interno.
- Retorna: tenant, preview resumido de contatos ativos, tickets recentes, contagem de tickets por status e eventos recentes relevantes.
- Regras:
  - expõe apenas tenants acessiveis ao workspace de suporte;
  - nao inclui SLA, metricas complexas, CRM generico nem vazamento cross-tenant;
  - agrega contagens e preview resumido no backend para evitar joins do frontend em tabelas base;
  - usa `security_barrier = true`.

### `vw_support_customer_recent_tickets`
- Finalidade: recorte operacional dos tickets recentes do tenant.
- Retorna: ticket, status, prioridade, severidade, responsavel, `updated_at` e metadados de janela (`recent_rank`, `total_available_count`, `recent_limit`, `has_more`).
- Regras:
  - limita a primeira carga a 6 tickets por tenant;
  - nao expande acesso cross-tenant;
  - usa `security_barrier = true`.

### `vw_support_customer_recent_events`
- Finalidade: recorte operacional dos eventos e mensagens recentes do tenant.
- Retorna: `ticket_id`, `ticket_title`, `event_type`, `visibility`, `occurred_at`, ator resolvido, resumo textual e metadados de janela (`recent_rank`, `total_available_count`, `recent_limit`, `has_more`).
- Regras:
  - limita a primeira carga a 8 registros recentes por tenant;
  - preserva notas internas apenas para roles autorizadas pelo workspace;
  - nao expande acesso cross-tenant;
  - usa `security_barrier = true`.

### `vw_support_assignable_agents`
- Finalidade: diretório seguro de agentes atribuiveis para o Support Workspace.
- Retorna: `user_id`, `full_name`, `email`, `tenant_id`, `tenant_name`, `role`, `membership_status`, `is_active`.
- Regras:
  - lista apenas perfis ativos com membership ativo no tenant;
  - limita os papeis a `platform_admin`, `support_manager` e `support_agent`;
  - respeita o mesmo contrato de autorizacao operacional usado por `rpc_assign_ticket`;
  - nao expõe usuarios de outros tenants nem dados sensiveis adicionais;
  - usa `security_barrier = true`.

### `vw_support_ticket_intake_tenants`
- Finalidade: lookup contratual de clientes B2B elegíveis para abertura de ticket no Support Workspace.
- Retorna: `tenant_id`, `tenant_slug`, nomes do tenant, `tenant_status`, timestamps principais e contagem de contatos ativos.
- Regras:
  - retorna apenas tenants autorizados pelo boundary do Support Workspace;
  - nao depende da fila atual para descobrir tenants elegiveis;
  - permite estado explicito de tenant sem contato ativo (`has_active_contacts = false`);
  - usa `security_barrier = true`.

### `vw_support_ticket_intake_contacts`
- Finalidade: lookup contratual de contatos ativos para o tenant selecionado no intake.
- Retorna: `id`, `tenant_id`, `linked_user_id`, `full_name`, `email`, `phone`, `job_title`, `is_primary` e `created_at`.
- Regras:
  - retorna apenas contatos ativos de tenants elegiveis;
  - nao expoe tabela-base de contatos ao frontend;
  - permite fallback honesto de intake sem solicitante quando nao houver contato retornado;
  - usa `security_barrier = true`.

### `vw_public_knowledge_space_resolver`
- Finalidade: resolver público dos `knowledge_spaces` ativos para a futura Central de Ajuda.
- Retorna: `knowledge_space` ativo, branding público sanitizado, locale, organization e chaves de roteamento por `space_slug` e domínio ativo quando existir.
- Regras:
  - expõe apenas `knowledge_spaces` com `status = active` e `organizations` ativas;
  - gera rota fallback por slug em `/help/:space_slug`;
  - expõe domínio apenas quando `knowledge_space_domains.status = active`;
  - não expõe `owner_tenant_id`, settings internos, JSON bruto não sanitizado nem tabelas base;
  - usa `security_barrier = true`.

### `vw_public_knowledge_navigation`
- Finalidade: navegação pública da Knowledge Base por `knowledge_space`.
- Retorna: categorias públicas, relação pai/filho, contadores de artigos públicos no subtree e lista resumida dos artigos públicos diretos da categoria.
- Regras:
  - expõe apenas categorias `public` em `knowledge_spaces` ativos;
  - só considera artigos `published` + `public`;
  - não retorna categorias internas nem categorias de spaces inativos;
  - não expõe corpo do artigo, trilha de origem nem metadados editoriais internos;
  - usa `security_barrier = true`.

### `vw_public_knowledge_articles_list`
- Finalidade: lista pública de artigos da futura Central de Ajuda.
- Retorna: `knowledge_space`, categoria pública quando existir, título, slug, summary e timestamps públicos.
- Regras:
  - expõe apenas artigos `published` + `public`;
  - bloqueia artigos em categorias não públicas, quando categorizados;
  - não expõe `source_path`, `source_hash`, autores internos nem `tenant_id`;
  - usa `security_barrier = true`.

### `vw_public_knowledge_article_detail`
- Finalidade: detalhe público de artigo da futura Central de Ajuda.
- Retorna: contexto do `knowledge_space`, categoria pública quando existir, título, slug, summary, `body_md` e timestamps públicos.
- Regras:
  - expõe apenas artigos `published` + `public`;
  - mantém Markdown como corpo oficial; HTML legado continua fora do contrato;
  - não expõe rastreabilidade editorial interna nem trilha de importação legado;
  - usa `security_barrier = true`.

## RPC pública vigente

### `rpc_public_search_knowledge_articles`
- Finalidade: busca textual simples da Central de Ajuda pública por `knowledge_space`.
- Entrada:
  - `p_space_slug`
  - `p_query`
  - `p_limit` com default `10`
- Retorna: `article_id`, `title`, `slug`, `summary`, `category_name`, `rank_score` e `updated_at`.
- Regras:
  - considera apenas `knowledge_spaces` ativos em `organizations` ativas;
  - considera apenas artigos `published` + `public`;
  - bloqueia artigos em categoria não pública, quando categorizados;
  - não expõe `body_md`, `source_path`, `source_hash`, `tenant_id` nem metadados editoriais internos;
  - usa busca textual simples em PostgreSQL com `websearch_to_tsquery('portuguese', ...)`;
  - query vazia ou curta retorna lista vazia controlada;
  - `p_limit` é limitado no backend para evitar abuso.

## Auditoria das views oficiais

### Configuração atual
- As três views oficiais são views PostgreSQL padrão no schema `public`.
- Elas não usam `security_invoker = true`.
- Elas usam `security_barrier = true`.

### Justificativa
- Em Postgres e Supabase, `security_invoker = true` faria o caller precisar de permissão direta nas tabelas base.
- Isso conflita com a regra do produto de não expor `SELECT` direto do app autenticado em `tickets` e tabelas-filhas.
- Por isso, a estratégia atual não depende da RLS implícita das tabelas base durante a leitura das views.
- O isolamento é imposto explicitamente dentro da própria definição das views com:
  - `app_private.is_active_tenant_member(...)`
  - `app_private.can_view_internal_ticket_content(...)`
- O hardening complementar é:
  - `security_barrier = true` nas views;
  - `SELECT` revogado das tabelas base para `authenticated`;
  - pgTAP estrutural para ACL, filtros e visibilidade.

### Conclusão da auditoria
- Não foi encontrado vazamento cross-tenant nas views oficiais.
- Não foi encontrado vazamento de nota interna para perfil externo.
- As views não dependem de grant implícito inseguro nas tabelas base.
- Qualquer alteração futura em grants ou remoção dos filtros explícitos quebra a suíte pgTAP.

## Auditoria das views administrativas

### Configuração atual
- As views administrativas atuais são views PostgreSQL padrão no schema `public`.
- Elas não usam `security_invoker = true`.
- Elas usam `security_barrier = true`.

### Justificativa
- O frontend administrativo continua proibido de depender de join em tabelas base.
- A estratégia atual replica o padrão endurecido do ticketing:
  - filtro explícito no próprio read model;
  - `auth.uid()` explícito para contexto autenticado;
  - `platform_admin` ativo como condição de leitura nas views operacionais;
  - grants concedidos na view, não como permissão semântica do frontend nas tabelas base.
- Nenhuma policy nova foi criada para esta fase porque o isolamento do app é imposto pelas próprias views contratuais.

### Conclusão da auditoria
- `platform_admin` lê globalmente a superfície administrativa aprovada.
- Qualquer usuário autenticado lê apenas o próprio `vw_admin_auth_context`.
- `tenant_admin` e membros comuns recebem zero linhas nas views administrativas globais, incluindo a fundação multi-brand.
- O feed de auditoria mantém contexto de tenant para eventos administrativos relevantes sem depender de lógica no frontend.
- `authenticated` não mantém `SELECT` direto em `public.profiles`; a busca de usuários do Admin Console foi deslocada para `vw_admin_user_lookup`.
- As suítes `supabase/tests/007_phase2_3_admin_read_models.sql`, `supabase/tests/008_phase3_1_admin_auth_context.sql`, `supabase/tests/009_phase3_2_admin_user_lookup.sql`, `supabase/tests/011_phase4_2_multi_brand_foundation.sql` e `supabase/tests/012_phase4_3_space_aware_compatibility.sql` quebram se as views forem removidas, se os grants forem alterados ou se os filtros explícitos desaparecerem.

## RPCs administrativas vigentes

### `rpc_admin_create_tenant`
- Escopo: `platform_admin`
- Retorno: `public.tenants`

### `rpc_admin_update_tenant_status`
- Escopo: `platform_admin`
- Retorno: `public.tenants`

### `rpc_admin_add_tenant_member`
- Escopo: `platform_admin`, `tenant_admin` no próprio tenant e `tenant_manager` dentro do limite permitido
- Retorno: `public.tenant_memberships`

### `rpc_admin_update_tenant_member_role`
- Escopo: `platform_admin`, `tenant_admin` no próprio tenant e `tenant_manager` dentro do limite permitido
- Retorno: `public.tenant_memberships`

### `rpc_admin_update_tenant_member_status`
- Escopo: `platform_admin`, `tenant_admin` no próprio tenant e `tenant_manager` dentro do limite permitido
- Retorno: `public.tenant_memberships`

### `rpc_admin_create_tenant_contact`
- Escopo: `platform_admin`, `tenant_admin` e `tenant_manager` no próprio tenant
- Retorno: `public.tenant_contacts`

### `rpc_admin_update_tenant_contact`
- Escopo: `platform_admin`, `tenant_admin` e `tenant_manager` no próprio tenant
- Retorno: `public.tenant_contacts`

## RPCs de Knowledge Base vigentes

### `rpc_admin_create_knowledge_category`
- Escopo: `platform_admin`
- Retorno: `public.knowledge_categories`
- Regras:
  - cria ou reconcilia categoria pelo escopo (`tenant_id`, `parent_category_id`, `slug`);
  - valida tenant/categoria pai quando aplicável;
  - gera auditoria.

### `rpc_admin_create_knowledge_article_draft`
- Escopo: `platform_admin`
- Retorno: `public.knowledge_articles`
- Regras:
  - cria artigo sempre em `draft`;
  - captura primeira revisão automaticamente;
  - registra `source_path` e `source_hash` quando houver origem legada;
  - gera auditoria e trilha de fonte.

### `rpc_admin_update_knowledge_article_draft`
- Escopo: `platform_admin`
- Retorno: `public.knowledge_articles`
- Regras:
  - só permite mutação em `draft` ou `review`;
  - bloqueia edição de artigo `published` ou `archived` fora de fluxo editorial futuro explícito;
  - incrementa revisão, preserva trilha de origem e gera auditoria.

### `rpc_admin_submit_knowledge_article_for_review`
- Escopo: `platform_admin`
- Retorno: `public.knowledge_articles`
- Regras:
  - exige artigo em `draft`;
  - move para `review`;
  - cria revisão auditável.

### `rpc_admin_publish_knowledge_article`
- Escopo: `platform_admin`
- Retorno: `public.knowledge_articles`
- Regras:
  - exige artigo em `review`;
  - move para `published`;
  - cria revisão auditável;
  - continua sem Help Center público nesta fase.

### `rpc_admin_archive_knowledge_article`
- Escopo: `platform_admin`
- Retorno: `public.knowledge_articles`
- Regras:
  - bloqueia segunda tentativa de arquivamento;
  - cria revisão auditável;
  - preserva trilha de origem.

### `rpc_admin_create_knowledge_category_v2`
- Escopo: `platform_admin`
- Retorno: `public.knowledge_categories`
- Regras:
  - exige `knowledge_space_id` explícito;
  - reconcilia categoria por (`knowledge_space_id`, `parent_category_id`, `slug`);
  - preserva `tenant_id` legado quando aplicável.

### `rpc_admin_create_knowledge_article_draft_v2`
- Escopo: `platform_admin`
- Retorno: `public.knowledge_articles`
- Regras:
  - exige `knowledge_space_id` explícito;
  - cria artigo sempre em `draft`;
  - preserva `source_path` e `source_hash`;
  - cria revisão e trilha de fonte automaticamente.

### `rpc_admin_update_knowledge_article_draft_v2`
- Escopo: `platform_admin`
- Retorno: `public.knowledge_articles`
- Regras:
  - exige `knowledge_space_id` explícito;
  - só permite mutação em `draft` ou `review`;
  - bloqueia mover artigo para outro space por esta RPC.

### `rpc_admin_submit_knowledge_article_for_review_v2`
- Escopo: `platform_admin`
- Retorno: `public.knowledge_articles`
- Regras:
  - exige `knowledge_space_id` explícito;
  - valida o space do artigo antes da transição para `review`.

### `rpc_admin_publish_knowledge_article_v2`
- Escopo: `platform_admin`
- Retorno: `public.knowledge_articles`
- Regras:
  - exige `knowledge_space_id` explícito;
  - valida o space do artigo antes da publicação;
  - continua sem abrir Help Center público nesta fase.

### `rpc_admin_archive_knowledge_article_v2`
- Escopo: `platform_admin`
- Retorno: `public.knowledge_articles`
- Regras:
  - exige `knowledge_space_id` explícito;
  - valida o space do artigo antes do arquivamento;
  - preserva a trilha editorial.

### `rpc_admin_update_knowledge_article_review_status`
- Escopo: `platform_admin`
- Retorno: linha de `public.knowledge_article_review_advisories`
- Regras:
  - atualiza apenas o advisory persistente do artigo;
  - aceita `review_status`, `human_confirmations` e `review_notes`;
  - valida `human_confirmations` como objeto JSON;
  - não altera `status`, `visibility` nem `body_md` do artigo;
  - gera trilha de auditoria obrigatoria.

### `rpc_admin_mark_knowledge_article_reviewed`
- Escopo: `platform_admin`
- Retorno: linha de `public.knowledge_article_review_advisories`
- Regras:
  - marca o advisory como `reviewed` e persiste `reviewed_by_user_id`/`reviewed_at`;
  - aceita `human_confirmations` e `review_notes`;
  - não publica artigo nem promove mudanca automatica em `knowledge_articles`;
  - gera trilha de auditoria obrigatoria.

## RPCs de ticketing vigentes

### `rpc_create_ticket`
- Escopo: `platform_admin`, suporte/engenharia internos com membership ativo e perfis externos permitidos no próprio tenant (`tenant_admin`, `tenant_manager`, `tenant_requester`)
- Entrada: `tenant_id`, `title`, `description`, `source`, `priority`, `severity`, `requester_contact_id?`
- Retorno: linha completa de `public.tickets`
- Regras:
  - valida tenant do caller;
  - valida `requester_contact_id` no mesmo tenant;
  - mantem `status = new` como estado inicial controlado pelo backend;
  - cria `ticket_created` em `ticket_events`;
  - gera `audit.audit_logs`.

### `rpc_update_ticket_status`
- Escopo: `platform_admin` e operadores internos autorizados no tenant
- Entrada: `ticket_id`, `status`, `note?`
- Retorno: linha completa de `public.tickets`
- Regras:
  - valida máquina de estados;
  - bloqueia `closed` por esta RPC;
  - bloqueia reopen por esta RPC;
  - gera evento automático e auditoria.

### `rpc_assign_ticket`
- Escopo: `platform_admin` e operadores internos autorizados no tenant
- Entrada: `ticket_id`, `assigned_to_user_id?`
- Retorno: linha completa de `public.tickets`
- Regras:
  - alvo precisa ser operador interno ativo no mesmo tenant;
  - gera histórico append-only em `ticket_assignments`;
  - gera evento interno `assigned` ou `unassigned`;
  - gera auditoria.

### `rpc_add_ticket_message`
- Escopo: membros autorizados a interagir com tickets no próprio tenant
- Entrada: `ticket_id`, `body`
- Retorno: linha completa de `public.ticket_messages`
- Regras:
  - grava mensagem com `visibility = customer`;
  - bloqueia tickets `closed` e `cancelled`;
  - gera evento `message_added`;
  - gera auditoria.

### `rpc_add_internal_ticket_note`
- Escopo: `platform_admin` e operadores internos autorizados no tenant
- Entrada: `ticket_id`, `body`
- Retorno: linha completa de `public.ticket_messages`
- Regras:
  - grava mensagem com `visibility = internal`;
  - gera evento `internal_note_added`;
  - gera auditoria.

### `rpc_close_ticket`
- Escopo: `platform_admin` e operadores internos autorizados no tenant
- Entrada: `ticket_id`, `close_reason`
- Retorno: linha completa de `public.tickets`
- Regras:
  - exige ticket previamente `resolved`;
  - exige motivo;
  - gera evento `closed`;
  - gera auditoria.

### `rpc_reopen_ticket`
- Escopo: `platform_admin` e operadores internos autorizados no tenant
- Entrada: `ticket_id`, `reopen_reason?`
- Retorno: linha completa de `public.tickets`
- Regras:
  - só reabre tickets `resolved` ou `closed`;
  - retorna ticket para `waiting_support`;
  - gera evento `reopened`;
  - gera auditoria.

### `rpc_support_get_ticket_timeline`
- Escopo: `platform_admin`, `support_manager` e `support_agent` com acesso ao tenant do ticket.
- Entrada: `ticket_id`, `limit`, `before_occurred_at?`, `before_timeline_entry_id?`.
- Retorno: pagina da timeline operacional com `total_available_count`, `page_limit` e `has_more`.
- Regras:
  - valida ator ativo;
  - valida acesso ao Support Workspace no tenant do ticket;
  - limita pagina entre 1 e 100 itens;
  - ordena por `occurred_at` + `timeline_entry_id` para cursor estavel;
  - usa `vw_support_ticket_timeline` como fonte;
  - nao abre `SELECT` direto nas tabelas base;
  - falha no backend para caller sem permissao, sem fallback de frontend.

## Regras de exposição

- Todas as RPCs expostas são `SECURITY DEFINER` com `SET search_path = ''`.
- `EXECUTE` é concedido explicitamente apenas para `authenticated`.
- Helpers privados ficam em `app_private` e não são expostos como contrato de app.
- O app autenticado lê tickets apenas por:
  - `vw_tickets_list`
  - `vw_ticket_detail`
  - `vw_ticket_timeline`
- O app autenticado lê o Support Workspace apenas por:
  - `vw_support_tickets_queue`
  - `vw_support_ticket_detail`
  - `vw_support_ticket_timeline`
  - `vw_support_ticket_timeline_recent`
  - `vw_support_ticket_intake_tenants`
  - `vw_support_ticket_intake_contacts`
  - `vw_support_ticket_attachments`
  - `vw_support_internal_action_target_areas`
  - `vw_support_ticket_internal_actions`
  - `vw_support_internal_action_detail`
  - `vw_support_internal_action_timeline`
  - `vw_internal_action_queue_by_area`
  - `vw_support_ticket_engineering_links`
  - `vw_engineering_work_items_queue`
  - `vw_engineering_work_item_detail`
  - `vw_engineering_work_item_ticket_links`
  - `vw_engineering_work_item_updates`
  - `vw_support_knowledge_public_link_candidates`
  - `vw_support_customer_360`
  - `vw_support_customer_account_context`
  - `vw_support_customer_recent_tickets`
  - `vw_support_customer_recent_events`
  - `vw_support_assignable_agents`
- O app autenticado lê o Admin Console apenas por:
  - `vw_admin_auth_context`
  - `vw_admin_tenants_list`
  - `vw_admin_tenant_detail`
  - `vw_admin_tenant_memberships`
  - `vw_admin_audit_feed`
  - `vw_admin_user_lookup`
  - `vw_admin_organizations_list`
  - `vw_admin_organization_detail`
  - `vw_admin_knowledge_spaces`
  - `vw_admin_knowledge_categories`
  - `vw_admin_knowledge_articles_list`
  - `vw_admin_knowledge_article_detail`
  - `vw_admin_knowledge_categories_v2`
  - `vw_admin_knowledge_articles_list_v2`
  - `vw_admin_knowledge_article_detail_v2`
  - `vw_admin_knowledge_article_review_advisories`
  - `vw_admin_customer_account_profiles`
- O app público/autenticado lê a Central de Ajuda futura apenas por:
  - `vw_public_knowledge_space_resolver`
  - `vw_public_knowledge_navigation`
  - `vw_public_knowledge_articles_list`
  - `vw_public_knowledge_article_detail`
- O app público/autenticado consulta busca da Central de Ajuda apenas por:
  - `rpc_public_search_knowledge_articles`
- O app autenticado escreve tickets apenas por:
  - `rpc_create_ticket`
  - `rpc_update_ticket_status`
  - `rpc_assign_ticket`
  - `rpc_add_ticket_message`
  - `rpc_add_internal_ticket_note`
  - `rpc_close_ticket`
  - `rpc_reopen_ticket`
  - `rpc_support_create_ticket_attachment_upload`
  - `rpc_support_register_ticket_attachment`
  - `rpc_support_get_ticket_attachment_download_url`
  - `rpc_support_list_internal_action_target_areas`
  - `rpc_support_create_internal_action`
  - `rpc_internal_action_assign`
  - `rpc_internal_action_add_comment`
  - `rpc_internal_action_update_status`
  - `rpc_internal_action_add_evidence_link`
  - `rpc_internal_action_return_to_support`
  - `rpc_support_accept_internal_action_return`
  - `rpc_support_request_internal_action_followup`
  - `rpc_support_close_internal_action`
  - `rpc_support_create_engineering_work_item_from_ticket`
  - `rpc_support_link_ticket_to_engineering_work_item`
  - `rpc_engineering_assign_work_item`
  - `rpc_engineering_unassign_work_item`
  - `rpc_engineering_update_work_item_status`
  - `rpc_engineering_add_work_item_update`
  - `rpc_engineering_return_work_item_to_support`
  - `rpc_engineering_link_existing_work_item_to_ticket`
- O app autenticado escreve Knowledge Base apenas por:
  - `rpc_admin_create_knowledge_category`
  - `rpc_admin_create_knowledge_article_draft`
  - `rpc_admin_update_knowledge_article_draft`
  - `rpc_admin_submit_knowledge_article_for_review`
  - `rpc_admin_publish_knowledge_article`
  - `rpc_admin_archive_knowledge_article`
  - `rpc_admin_create_knowledge_category_v2`
  - `rpc_admin_create_knowledge_article_draft_v2`
  - `rpc_admin_update_knowledge_article_draft_v2`
  - `rpc_admin_submit_knowledge_article_for_review_v2`
  - `rpc_admin_publish_knowledge_article_v2`
  - `rpc_admin_archive_knowledge_article_v2`
  - `rpc_admin_update_knowledge_article_review_status`
  - `rpc_admin_mark_knowledge_article_reviewed`
- O app autenticado escreve o Customer Account Profile apenas por:
  - `rpc_admin_upsert_customer_account_profile`
  - `rpc_admin_add_customer_integration`
  - `rpc_admin_update_customer_integration`
  - `rpc_admin_add_customer_customization`
  - `rpc_admin_update_customer_customization`
  - `rpc_admin_add_customer_account_alert`
  - `rpc_admin_archive_customer_account_alert`
  - `rpc_admin_set_customer_feature_flag`

## Fase 6.2 - Support Workspace UI Minimum

### Rotas materializadas
- `/support`
- `/support/tickets`
- `/support/tickets/:ticketId`
- `/support/customers/:tenantId`
- `/support/queue`

### Leitura consumida pelo frontend
- `vw_support_tickets_queue`
- `vw_support_ticket_detail`
- `vw_support_ticket_timeline_recent`
- `rpc_support_get_ticket_timeline`
- `vw_support_ticket_intake_tenants`
- `vw_support_ticket_intake_contacts`
- `vw_support_customer_360`
- `vw_support_customer_recent_tickets`
- `vw_support_customer_recent_events`

### Escrita consumida pelo frontend
- `rpc_create_ticket`
- `rpc_update_ticket_status`
- `rpc_assign_ticket`
- `rpc_add_ticket_message`
- `rpc_add_internal_ticket_note`
- `rpc_close_ticket`
- `rpc_reopen_ticket`
 - `rpc_support_create_engineering_work_item_from_ticket`

### Boundary mantido
- a UI do workspace nao le tabelas base de ticketing
- a UI nao cria mutacoes novas fora das RPCs ja aprovadas
- a UI continua interna e B2B, sem qualquer capacidade de atendimento a shopper final
- o intake respeita tenant explicito, solicitante opcional quando nao houver contato e status inicial controlado pelo backend
- categoria inicial continua fora da UI por falta de contrato backend

## Fase 8.7 - Support Ticket Attachments And Escalation V3

### Leitura consumida pelo frontend
- `vw_support_ticket_attachments`
- `vw_support_ticket_engineering_links`

### Escrita consumida pelo frontend
- `rpc_support_create_engineering_work_item_from_ticket`

### Regras de consumo
- `/support/tickets/:ticketId` lista anexos apenas por metadata sanitizada; `storage_bucket` e `storage_object_path` nao sao expostos ao app.
- o upload real permanece bloqueado porque ainda nao existe bucket/policy segura configurada para storage multi-tenant.
- o handoff tecnico cria entidade propria de engenharia e vinculo explicito com o ticket; o ticket nao vira backlog tecnico por texto livre.
- a leitura de work items vinculados ocorre apenas por `vw_support_ticket_engineering_links`.

### Boundary mantido
- nenhuma tabela base nova de engenharia e lida diretamente pelo frontend
- nenhum upload inseguro foi habilitado
- tickets fechados/cancelados nao aceitam novo handoff tecnico
- o status tecnico continua sendo controlado pelo dominio `engineering_work_items`, sem RPC paralela para status do link

## Fase 8.8 - Engineering Workspace Operational Core V3

### Leitura consumida pelo frontend
- `vw_engineering_work_items_queue`
- `vw_engineering_work_item_detail`
- `vw_engineering_work_item_ticket_links`
- `vw_engineering_work_item_updates`
- `vw_support_ticket_engineering_links`

### Escrita consumida pelo frontend
- `rpc_engineering_assign_work_item`
- `rpc_engineering_unassign_work_item`
- `rpc_engineering_update_work_item_status`
- `rpc_engineering_add_work_item_update`
- `rpc_engineering_return_work_item_to_support`

### Regras de consumo
- `/engineering` e `/engineering/work-items/:workItemId` leem demandas tecnicas apenas pelos read models dedicados.
- o status tecnico e controlado pelo backend; o frontend nao monta transicao livre.
- `engineering_work_item_updates` guarda updates estruturados de engenharia e nao substitui `ticket_messages`.
- retorno ao suporte cria update tecnico `support_return`, gera `ticket_event` estruturado e atualiza o ticket vinculado para `waiting_support` quando permitido.
- o ticket workspace le o ultimo retorno tecnico por `vw_support_ticket_engineering_links`, sem expor payload cru nem misturar demanda tecnica na conversa.

### Boundary mantido
- nenhuma tabela base de engenharia e lida diretamente pelo frontend
- suporte ve vinculos tecnicos permitidos, mas nao escreve em work item tecnico
- `engineering_work_item` nao e ticket e nao deve virar backlog de produto generico
- notificacao externa, SLA tecnico, upload/storage e sprint/kanban continuam fora deste contrato

## Fase 8.9 - Secure Ticket Evidence Storage V3

### Leitura consumida pelo frontend
- `vw_support_ticket_attachments`

### Escrita consumida pelo frontend
- `rpc_support_create_ticket_attachment_upload`
- `rpc_support_register_ticket_attachment`
- `rpc_support_get_ticket_attachment_download_url`

### Functions operacionais consumidas pelo frontend
- `ticket-evidence-upload`
- `ticket-evidence-download`

### Regras de consumo
- `/support/tickets/:ticketId` lista evidências apenas por metadata sanitizada.
- a view contratual expõe somente:
  - `attachment_id`
  - `ticket_id`
  - `display_name`
  - `content_type`
  - `size_bytes`
  - `uploaded_by_name`
  - `created_at`
  - `status`
  - `can_download`
  - `can_archive`
- a view não expõe:
  - `storage_bucket`
  - `storage_object_path`
  - URL assinada persistente
  - payload bruto de storage
- o upload real depende de intent prévio emitido por RPC com:
  - `tenant_id` explícito
  - `ticket_id` explícito
  - tipo MIME permitido
  - tamanho máximo validado
  - ator autenticado e autorizado no tenant do ticket
- o download depende de grant curto emitido por RPC e resolvido por edge function com signed URL temporária.
- `ticket_event` e `audit_log` são gerados sem registrar `bucket` ou `path` sensível no evento do ticket.

### Boundary mantido
- bucket permanece privado (`public = false`)
- o frontend não lê `storage.objects`
- o frontend não conhece `storage_bucket` nem `storage_object_path`
- nenhum upload cross-tenant é aceito
- `authenticated` continua sem DML direto em `ticket_attachments`
- arquivamento de evidência continua fora da superfície porque não existe RPC segura habilitada para isso neste corte

## Fase 8.16 - Customer Portal Secure Evidence Upload V3

### Leitura consumida pelo frontend
- `vw_customer_portal_ticket_attachments`
- `vw_support_ticket_attachments`

### Escrita consumida pelo frontend
- `rpc_customer_create_ticket_attachment_upload`
- `rpc_customer_register_ticket_attachment`
- `rpc_customer_get_attachment_download_url`

### Functions operacionais consumidas pelo frontend
- `ticket-evidence-upload` com `boundary=customer`
- `ticket-evidence-download`

### Regras de consumo
- `/portal/tickets/:ticketId` envia evidencias por intent customer-facing antes do upload.
- O bucket `ticket-evidence` permanece privado e e reaproveitado com policies especificas para cliente autenticado.
- O upload customer-facing aceita apenas:
  - `application/pdf`
  - `image/jpeg`
  - `image/png`
  - `image/webp`
- O limite customer-facing e `10 MB` por arquivo.
- O cliente so pode anexar evidencia em ticket permitido do proprio tenant/contato.
- Tickets `closed` e `cancelled` nao aceitam upload customer-facing.
- O registro final cria metadata em `ticket_attachments` com `visibility = customer`.
- `ticket_event` e `audit_log` sao gerados sem bucket/path sensivel.

### Boundary mantido
- O frontend nao recebe `storage_bucket`, `storage_object_path`, path interno ou URL permanente.
- O frontend nao filtra seguranca nem monta URL de storage.
- Upload anonimo e cross-tenant ficam bloqueados por RPC, storage policy e testes.
- Arquivamento/remocao de evidencia pelo cliente continua bloqueado por falta de RPC segura dedicada.

## Fase 8.20 - Customer Portal Search And Discoverability V3

### Leitura consumida pelo frontend
- `vw_customer_portal_knowledge_articles`
- `vw_customer_portal_knowledge_article_detail`
- `vw_customer_portal_ticket_knowledge_links`

### Busca consumida pelo frontend
- `rpc_customer_search_knowledge_articles`

### Regras de consumo
- `/portal/help` passou a usar busca autenticada governada pelo backend, sem array local como source of truth.
- A RPC aceita:
  - `tenant_id`
  - `search_query`
  - `category_name`
  - `source` em `all|public|customer_portal|ticket_linked`
  - `ticket_id` opcional para descoberta contextual
  - `limit`
  - `offset`
- A busca retorna apenas:
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
- O termo vazio retorna apenas a lista segura autorizada ao ator.
- Termo curto sem filtro nao vaza a base inteira; a UX exige pelo menos 2 caracteres ou filtro real.
- `/portal/tickets/:ticketId` pode buscar artigos no contexto do proprio ticket via `ticket_id` explicito.

### Boundary mantido
- `draft` nunca aparece.
- `internal` nunca aparece.
- `restricted` so aparece com entitlement legitimo ou vinculo ticket-linked autorizado.
- Entitlement arquivado deixa de expor artigo na busca.
- A busca publica continua separada em `rpc_public_search_knowledge_articles` e nao passa a listar artigos autenticados.
- O frontend nao decide entitlement, nao reordena por heuristica e nao monta recomendacao IA.

## Fase 8.22 - Customer Portal Tenant Context And Switching V3

### Leitura consumida pelo frontend
- `vw_customer_portal_available_tenants`
- `vw_customer_portal_active_tenant_context`
- `vw_customer_portal_auth_context`
- `vw_customer_portal_profile_context`

### Escrita consumida pelo frontend
- `rpc_customer_set_active_tenant`

### Regras de consumo
- o tenant ativo passou a ser backend-governed por `customer_portal_user_preferences`
- o frontend nao escolhe tenant por `contexts[0]`, `localStorage` ou cache como fonte de verdade
- a selecao valida:
  - membership ativa em `customer_user|customer_manager`
  - tenant `active`
  - portal habilitado por `customer_account_features.feature_key = 'returns_portal'`
- se houver apenas um tenant valido, o backend aplica fallback seguro
- se nao houver tenant valido, os read models retornam estado vazio/seguro
- tickets, Knowledge, busca autenticada, profile context e criacao de ticket passam a respeitar o tenant ativo efetivo
- `rpc_customer_search_knowledge_articles` nega explicitamente tenant diferente do ativo, em vez de devolver falso vazio cross-tenant

### Boundary mantido
- `active_tenant_id` customer-facing nao interfere em `vw_admin_auth_context`
- `/admin/customer-portal` continua exigindo role admin real
- tenant sem portal habilitado nao pode ser selecionado mesmo com membership ativa

## Fase 8.24 - Customer Portal Multi-Tab Session Semantics V3

### Leitura consumida pelo frontend
- `vw_customer_portal_active_tenant_context`

### Escrita consumida pelo frontend
- `rpc_customer_set_active_tenant`

### Regras de consumo
- `vw_customer_portal_active_tenant_context` passa a expor `context_version`
- `context_version` vem de `customer_portal_user_preferences.updated_at` quando existe preferencia valida
- o fallback sem preferencia persistida usa timestamp estavel (`1970-01-01T00:00:00Z`) apenas para deteccao segura de primeira troca
- a aba revalida o contexto no foco/visibilitychange e antes de mutacoes sensiveis
- se `tenant_id` ou `context_version` divergirem do ultimo contexto aceito, a UI entra em estado stale e exige refresh

### Acoes protegidas por revalidacao + backend
- `rpc_customer_create_ticket`
- `rpc_customer_add_ticket_message`
- `rpc_customer_create_ticket_attachment_upload`
- `rpc_customer_get_attachment_download_url`
- `rpc_customer_acknowledge_ticket_update`
- `rpc_customer_confirm_ticket_resolved`
- `rpc_customer_request_ticket_reopen`
- `rpc_customer_search_knowledge_articles`

### Boundary mantido
- nenhuma surface customer-facing volta para `todos os tenants do usuario`
- `localStorage` e cache local nao viram source of truth de tenant
- o enforcement real continua no backend via `customer_portal_has_active_tenant(...)` e `can_access_customer_ticket(...)`
- o contexto administrativo continua isolado de `active_tenant_id`

## Fase 8.25 - Customer Portal Session Expiry And Recovery Semantics V3

### Leitura consumida pelo frontend
- `vw_customer_portal_auth_context`
- `vw_customer_portal_available_tenants`
- `vw_customer_portal_active_tenant_context`
- `rpc_customer_get_portal_session_status`

### Escrita consumida pelo frontend
- `rpc_customer_set_active_tenant`

### Regras de consumo
- `rpc_customer_get_portal_session_status` virou o contrato leve de revalidacao operacional do portal.
- O retorno classifica apenas estados seguros:
  - `ready`
  - `access_revoked`
  - `tenant_unavailable`
- `session_expired`, `network_retryable` e `fatal_error` continuam resolvidos no boundary do app a partir do erro real de sessao/rede/contrato.
- `context_version` continua vindo de `vw_customer_portal_active_tenant_context`.
- O frontend nao trata tenant anterior, cache ou storage local como source of truth depois de sessao expirada, erro de rede ou perda de acesso.

### Acoes protegidas
- `rpc_customer_create_ticket`
- `rpc_customer_add_ticket_message`
- `rpc_customer_create_ticket_attachment_upload`
- `rpc_customer_register_ticket_attachment`
- `rpc_customer_get_attachment_download_url`
- `rpc_customer_acknowledge_ticket_update`
- `rpc_customer_confirm_ticket_resolved`
- `rpc_customer_request_ticket_reopen`
- `rpc_customer_search_knowledge_articles`

### Boundary mantido
- `active_tenant_id` continua backend-governed.
- `session_expired` nao vira fallback silencioso para `tenant_unavailable`.
- `access_revoked` nao reutiliza contexto antigo nem dispara refresh infinito.
- `/admin/customer-portal` e `/admin/access` continuam fora do contexto customer-facing.

## Fase 6.3 - Support Workspace Agent Directory + Assignment UX

### Leitura consumida pelo frontend
- `vw_support_assignable_agents`

## Fase 6.9 - Support Workspace Customer Account Context UI

### Leitura consumida pelo frontend
- `vw_support_customer_account_context`

### Regras de consumo
- `/support/tickets/:ticketId` consome o contexto apenas no rail operacional, com payload resumido e detalhes extras recolhidos.
- `/support/customers/:tenantId` consome o mesmo contrato para visão operacional mais completa de stack, integrações, features, customizações e alertas.
- nenhum dado do Customer Account Profile passa a ser lido por tabela-base no frontend.

### Escrita consumida pelo frontend
- `rpc_assign_ticket`

### Boundary mantido
- a atribuicao principal deixa de depender de digitação manual de UUID
- o seletor mostra apenas operadores ativos e atribuiveis pelo contrato do backend
- `Atribuir a mim` e `Desatribuir` continuam usando somente `rpc_assign_ticket`
- o `user_id` tecnico permanece apenas como fallback recolhido para excecao operacional

## Fase 8.27 - Internal Actions Backend Foundation V1

### Leitura materializada no backend
- `vw_support_internal_action_target_areas`
- `vw_support_ticket_internal_actions`
- `vw_support_internal_action_detail`
- `vw_support_internal_action_timeline`
- `vw_internal_action_queue_by_area`
- `vw_internal_action_area_auth_context`
- `vw_internal_action_detail_by_area`
- `vw_internal_action_timeline_by_area`
- `vw_admin_internal_action_target_areas`
- `vw_admin_internal_area_memberships`

### Escrita materializada no backend
- `rpc_support_list_internal_action_target_areas`
- `rpc_support_create_internal_action`
- `rpc_internal_action_assign`
- `rpc_internal_action_assign_to_self`
- `rpc_internal_action_add_comment`
- `rpc_internal_action_update_status`
- `rpc_internal_action_add_evidence_link`
- `rpc_internal_action_return_to_support`
- `rpc_support_accept_internal_action_return`
- `rpc_support_request_internal_action_followup`
- `rpc_support_close_internal_action`
- `rpc_admin_add_internal_area_membership`
- `rpc_admin_update_internal_area_membership`
- `rpc_admin_archive_internal_area_membership`

### Regras de consumo
- `internal_actions` nasce como domínio novo, neutro e ticket-cêntrico; não substitui `engineering_work_items` neste corte.
- O suporte continua owner do ticket principal; a área acionada atua só no subfluxo interno.
- O catálogo acionável para o Support Workspace vem de `rpc_support_list_internal_action_target_areas`, que filtra áreas ativas por ticket/tenant acessível ao suporte e não expõe tabela base.
- Criar, atribuir, comentar, devolver, pedir complemento e fechar acionamento gera ledger append-only, `ticket_event` interno e `audit.audit_logs`.
- O V1 usa apenas evidências já existentes em `ticket_attachments`; não cria bucket, storage path ou upload próprio.
- Pendência interna não altera `ticket.status`; a sinalização sai por read model dedicado.
- As views novas não expõem conversa completa do ticket para a fila da área nem metadata sensível de storage.
- `vw_internal_action_area_auth_context` expõe apenas tenant, área, role/status de membership ativo e contagem operacional, permitindo distinguir área autorizada sem demanda de usuário sem membership.
- `/internal-actions` consome `vw_internal_action_queue_by_area`, `vw_internal_action_detail_by_area`, `vw_internal_action_timeline_by_area` e apenas RPCs do domínio para assumir, comentar, atualizar andamento e devolver ao suporte.
- `/admin/internal-areas` consome views `vw_admin_*` e RPCs administrativas para adicionar, atualizar ou arquivar `internal_area_memberships`.

### Boundary mantido
- Cliente/portal não lê nem escreve `internal_actions`.
- O frontend do Support Workspace já possui integração mínima no drawer `Acionamentos` para o lado do suporte: catálogo real de áreas, criação, lista, detalhe, timeline interna, aceite de retorno, pedido de complemento, fechamento e vínculo de evidência existente.
- A área acionada possui workspace/fila própria, mas não responde cliente, não fecha ticket e não altera `ticket.status`.
- Não existe bridge com Engenharia neste lote; `engineering_work_items` segue íntegro e separado.

## Próximos contratos planejados
- Atualização posterior - entitlement arquivado no portal cliente:
  - `knowledge_article_entitlements.archived_at is not null` remove a exposição do artigo em:
    - `vw_customer_portal_knowledge_articles`
    - `vw_customer_portal_knowledge_article_detail`
    - `rpc_customer_search_knowledge_articles`
  - `ticket_knowledge_links.archived_at is not null` remove a exposição do artigo em:
    - `vw_customer_portal_ticket_knowledge_links`
    - busca contextual `ticket_linked` em `rpc_customer_search_knowledge_articles`
  - a regressão observada em tenant B não veio do contrato backend; a causa raiz ficou no seed QA, que mantinha ativo um entitlement marcado para arquivamento.
- Ticket -> Knowledge Base assistive linking:
  - backend minimo ja materializado em:
    - `vw_support_ticket_knowledge_links`
    - `vw_support_knowledge_article_picker`
    - `vw_customer_portal_ticket_knowledge_links`
    - `rpc_support_link_ticket_article`
    - `rpc_support_archive_ticket_article_link`
    - `rpc_support_mark_documentation_gap`
    - `rpc_support_mark_article_needs_update`
  - review de contrato publico seguro documentada em:
    - `TICKET_KNOWLEDGE_PUBLIC_LINK_CONTRACT_REVIEW.md`
  - view publica segura materializada em Fase 8.2:
    - `vw_support_knowledge_public_link_candidates`
  - boundary esperado:
    - frontend continua sem leitura de tabela-base
    - `sent_to_customer` exige artigo `public` + `published`
    - `reference_internal` pode apontar para `internal` e `restricted` apenas em superficie interna autorizada
    - o frontend nao monta rota publica por heuristica
- Views e RPCs de intake para engenharia.
- Roteamento frontend por domínio/`space_slug` sobre os contratos já materializados.
- Branding público projetado explicitamente por read model quando `brand_settings` precisar sair do fallback seguro atual.

## Proibições
- Frontend fazendo join direto em tabelas de domínio.
- Frontend lendo `public.tickets` ou tabelas-filhas diretamente.
- Frontend lendo `profiles` ou `user_global_roles` diretamente para resolver o gate do Admin Console.
- Frontend lendo `tenants`, `tenant_memberships`, `tenant_contacts` ou `audit.audit_logs` diretamente para o Admin Console.
- Frontend lendo `organizations`, `organization_memberships`, `knowledge_spaces`, `knowledge_space_domains` ou `brand_settings` diretamente.
- Frontend lendo tabelas base de Knowledge Base (`knowledge_*`) diretamente.
- `anon` lendo tabelas base de multi-brand ou Knowledge Base diretamente.
- Frontend decidindo visibilidade de nota interna.
- Frontend usando HTML legado de Octadesk como corpo/UI de artigo.
- Escrita direta em tabelas críticas sem RPC.
- Uso do blueprint histórico como contrato executável.
