# Modelo de Dados MVP

Este documento descreve o modelo conceitual minimo. Nao e migration pronta.

## Nucleos obrigatorios

### Clientes e acesso

| Entidade | Objetivo | Observacoes |
| --- | --- | --- |
| `profiles` | identidade do usuario autenticado | nao duplicar usuario |
| `tenants` | cliente B2B | ancora operacional |
| `tenant_memberships` | acesso de usuario ao cliente | inclui cliente e papeis internos por tenant quando aplicavel |
| `tenant_contacts` | contatos do cliente | contato nao e colaborador interno |
| `internal_areas` ou catalogo equivalente | areas internas acionaveis | pode reaproveitar conceito atual de areas |
| `internal_area_memberships` | usuario interno vinculado a area | usado para filas internas |

### Central de ajuda

| Entidade | Objetivo | Observacoes |
| --- | --- | --- |
| `knowledge_spaces` | central/marca publica | MVP pode iniciar com `genius` |
| `knowledge_categories` | navegacao por categoria | vinda da OctaDesk apos curadoria |
| `knowledge_articles` | artigo canonico | Markdown seguro, nao HTML bruto |
| `knowledge_article_revisions` | historico editorial | requisito para governanca |
| `knowledge_article_sources` | origem OctaDesk ou manual | preservar `source_path` e `source_hash` |
| `knowledge_article_assets` | imagens governadas | sem URL externa arbitraria |

### Demandas/tickets

| Entidade | Objetivo | Observacoes |
| --- | --- | --- |
| `tickets` | demanda do cliente ou registrada pelo suporte | sempre com tenant |
| `ticket_messages` | mensagens customer-facing e internas tipadas | nota interna nao aparece ao cliente |
| `ticket_events` | historico append-only | status, atribuicao, classificacao, acionamento |
| `ticket_assignments` | responsavel atual/historico | pode iniciar simples |
| `ticket_attachments` | evidencias | metadata sanitizada e storage privado |
| `ticket_categories` | classificacao simples | nao misturar com categoria de artigo |
| `ticket_article_links` | vinculo com artigo | apoio, link enviado, lacuna ou revisao |

### Acionamentos internos

| Entidade | Objetivo | Observacoes |
| --- | --- | --- |
| `internal_actions` | pedido do suporte para outra area | sempre vinculado a ticket no MVP |
| `internal_action_updates` | timeline interna do acionamento | comentarios, status e retorno |
| `internal_action_assignees` ou campo simples | responsavel na area | pode iniciar com um responsavel atual |

## Read models minimos por superficie

### Public Help

- `vw_public_help_spaces`
- `vw_public_help_categories`
- `vw_public_help_articles`
- `vw_public_help_article_detail`
- `rpc_public_search_help_articles`

### Portal cliente

- `vw_customer_portal_context`
- `vw_customer_portal_tickets`
- `vw_customer_portal_ticket_detail`
- `vw_customer_portal_ticket_timeline`
- `vw_customer_portal_ticket_attachments`
- `vw_customer_portal_help_articles`

### Suporte

- `vw_support_queue`
- `vw_support_ticket_detail`
- `vw_support_ticket_timeline`
- `vw_support_ticket_attachments`
- `vw_support_ticket_categories`
- `vw_support_customer_context`
- `vw_support_ticket_internal_actions`
- `vw_support_article_picker`

### Areas internas

- `vw_internal_area_context`
- `vw_internal_area_action_queue`
- `vw_internal_area_action_detail`
- `vw_internal_area_action_timeline`

### Admin minimo

- `vw_admin_tenants`
- `vw_admin_users`
- `vw_admin_memberships`
- `vw_admin_internal_areas`
- `vw_admin_knowledge_articles`
- `vw_admin_audit_events`

## RPCs minimas

### Portal cliente

- `rpc_customer_create_ticket`
- `rpc_customer_add_ticket_message`
- `rpc_customer_create_attachment_upload`
- `rpc_customer_register_attachment`
- `rpc_customer_get_attachment_download_url`

### Suporte

- `rpc_support_create_ticket`
- `rpc_support_add_customer_message`
- `rpc_support_add_internal_note`
- `rpc_support_update_ticket_status`
- `rpc_support_assign_ticket`
- `rpc_support_update_ticket_category`
- `rpc_support_link_article`
- `rpc_support_create_internal_action`
- `rpc_support_close_ticket`
- `rpc_support_reopen_ticket`

### Area interna

- `rpc_internal_action_assign_to_self`
- `rpc_internal_action_add_comment`
- `rpc_internal_action_update_status`
- `rpc_internal_action_return_to_support`

### Admin

- `rpc_admin_create_tenant`
- `rpc_admin_update_tenant`
- `rpc_admin_add_user_membership`
- `rpc_admin_update_user_membership`
- `rpc_admin_upsert_internal_area`
- `rpc_admin_upsert_knowledge_article_draft`
- `rpc_admin_publish_knowledge_article`
- `rpc_admin_archive_knowledge_article`

## Estados sugeridos de ticket

Estados internos minimos:

- `new`
- `triage`
- `waiting_support`
- `waiting_customer`
- `waiting_internal_area`
- `resolved`
- `closed`
- `cancelled`

Estados customer-facing podem ser labels derivados:

- `Recebido`
- `Em analise`
- `Aguardando sua resposta`
- `Em tratativa interna`
- `Resolvido`
- `Encerrado`

O cliente nao precisa ver todos os estados internos.

## Estados sugeridos de acionamento interno

- `open`
- `assigned`
- `in_progress`
- `waiting_support`
- `returned`
- `closed`
- `cancelled`

## Regras de isolamento

- Cliente B2B ve apenas dados do proprio tenant autorizado.
- Suporte ve tenants autorizados por papel/membership.
- Area interna ve apenas acionamentos da sua area e tenant autorizado.
- Admin ve conforme papel administrativo.
- Audit bruto nao aparece no Portal.
- Storage path nao aparece em nenhuma UI comum.
