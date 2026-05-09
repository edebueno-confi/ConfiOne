# Customer Portal Contract Foundation V3

## Objetivo
Fechar a fundacao contratual e operacional do futuro portal do cliente B2B sem criar portal fake, dashboard decorativo ou regra no frontend.

O corte entrega boundary customer-facing autenticada, tenant-aware e segura para leitura de tickets, timeline, evidencias, artigos publicos enviados e contexto operacional minimo do proprio cliente.

## Auditoria estrutural

### Reaproveitado
- Auth Supabase existente e `profiles` como identidade autenticada.
- `tenants` como unidade operacional B2B.
- `tenant_memberships` como vinculo de acesso por tenant.
- `tenant_contacts` como contato operacional vinculado ao usuario customer-facing.
- `tickets`, `ticket_messages`, `ticket_events`, `ticket_attachments` e contratos existentes de suporte.
- Storage seguro de evidencias por bucket privado `ticket-evidence`, grants curtos e edge function `ticket-evidence-download`.
- Knowledge publica publicada e links de artigo enviados ao cliente por `ticket_knowledge_links`.
- `customer_account_profiles` como fonte segura de contexto resumido.

### Endurecido
- `tenant_role` passou a aceitar `customer_user` e `customer_manager`.
- O portal exige membership ativa e contato ativo vinculado ao usuario.
- Cliente comum ve tickets criados por ele ou vinculados ao seu contato.
- Customer manager ve tickets do proprio tenant, sem atravessar tenant.
- Download de evidencia pelo portal usa grant curto e a edge function valida tambem a view customer-facing sanitizada.

### Criado
- `customer_ticket_update_acknowledgements`.
- Helpers privados `app_private.customer_portal_*`.
- Read models `vw_customer_portal_*`.
- RPCs customer-facing minimas para criar ticket, adicionar mensagem, gerar grant de download e registrar leitura.
- Foundation frontend minima em `/portal`, `/portal/tickets` e `/portal/tickets/:ticketId`.

### Explicitamente bloqueado
- Portal B2C/shopper final.
- Dashboard com metricas fake.
- SLA publico ou timers.
- Chat/Omni Inbox.
- IA.
- Auth paralela.
- Dados internos de suporte, engenharia, auditoria, advisory, drafts ou Knowledge interna/restrita.
- Storage path, bucket, URL permanente ou payload bruto.

## Boundary de acesso

### Publica
- Help Center publico continua em `/help/:spaceSlug`.
- Somente artigos publicados, publicos e aprovados por contrato de Knowledge aparecem.
- Nao ha criacao publica anonima de ticket.

### Customer-facing autenticada
- Acesso por usuario autenticado com `tenant_memberships.role` em `customer_user` ou `customer_manager`.
- Exige membership `active`.
- Exige `tenant_contacts.linked_user_id = auth.uid()` e contato ativo.
- Exibe somente dados do tenant autorizado.
- Nao exibe roles internas, audit bruto, engenharia, SLA interno ou notas internas.

### Interna
- Suporte, CS, engenharia e admin continuam em `/support`, `/engineering` e `/admin`.
- Esses dominios mantem contratos proprios e nao sao usados como fonte de permissao do portal.

## Contratos criados

### Views
- `vw_customer_portal_auth_context`
- `vw_customer_portal_profile_context`
- `vw_customer_portal_ticket_list`
- `vw_customer_portal_ticket_detail`
- `vw_customer_portal_ticket_timeline`
- `vw_customer_portal_ticket_attachments`
- `vw_customer_portal_knowledge_articles`

Todas as views sao tenant-aware, usam boundary customer-facing no backend e nao delegam filtro de seguranca ao frontend.

### RPCs
- `rpc_customer_create_ticket(p_tenant_id, p_title, p_description)`
- `rpc_customer_add_ticket_message(p_ticket_id, p_body)`
- `rpc_customer_get_attachment_download_url(p_attachment_id)`
- `rpc_customer_acknowledge_ticket_update(p_ticket_id, p_last_timeline_entry_id)`

Cada RPC valida ator ativo, tenant, membership customer-facing, contato vinculado e ownership. Mutacoes geram `ticket_event` e/ou `audit.audit_logs` quando aplicavel.

## Contratos de leitura segura

### Tickets
- Lista e detalhe removem prioridade, severidade, SLA interno, assignee, categoria operacional interna e qualquer metadata de engenharia.
- Status interno e convertido para label customer-facing.
- Cliente comum fica limitado ao proprio contato/criacao; manager fica limitado ao tenant.

### Timeline
- Exibe mensagens publicas do cliente/suporte e eventos sanitizados.
- Nao exibe notas internas, handoff tecnico, audit bruto, payloads ou metadata operacional sensivel.

### Evidencias
- View customer-facing expoe somente `attachment_id`, nome sanitizado, tipo, tamanho, autor rotulado, data, status e `can_download`.
- Nao expoe `storage_bucket`, `storage_object_path`, signed URL permanente ou path interno.
- Download usa `rpc_customer_get_attachment_download_url` + `ticket-evidence-download`.

### Knowledge
- Exibe somente artigos publicos publicados vinculados ao ticket por link enviado ao cliente.
- Draft, internal, restricted, advisory e playbook interno continuam bloqueados.

### Perfil operacional
- Exibe apenas resumo seguro: cliente, contato, papel, produto/linha, status operacional e plano/tier.
- Nao expoe notas internas, flags operacionais, integracoes detalhadas, customizacoes sensiveis ou alertas internos.

## Frontend
Rotas criadas:
- `/portal`
- `/portal/tickets`
- `/portal/tickets/:ticketId`

Caracteristicas:
- leitura via read models customer-facing;
- criacao e mensagem via RPC;
- download seguro por edge function;
- estados loading, vazio e erro reais;
- sem dashboard fake, IA, SLA publico, chat ou analytics;
- sem scroll horizontal;
- cockpit customer-facing simples, nao produto final de portal.

## Fixture e testes
Fixture local passou a incluir:
- cliente com tickets;
- cliente manager do tenant;
- cliente de outro tenant;
- cliente revogado sem acesso ativo;
- ticket com evidencia;
- ticket sem evidencia;
- Knowledge publica enviada;
- Knowledge interna/restrita bloqueada.

Testes pgTAP cobrem:
- roles customer-facing;
- grants das views/RPCs;
- anon bloqueado;
- cross-tenant bloqueado;
- view sem bucket/path/URL permanente;
- timeline sem nota interna;
- artigo interno/restrito bloqueado;
- download customer-facing autorizado por grant curto;
- ack com audit log;
- DML direto bloqueado.

## Limitacoes assumidas
- Portal ainda nao tem upload de evidencia pelo cliente.
- Portal ainda nao tem SLA publico.
- Portal ainda nao tem Omni Inbox, WhatsApp, email threading externo ou IA.
- Portal ainda nao tem UI final, onboarding, gestao de usuarios do cliente ou preferencias.
- Auth segue Supabase existente; nao foi criado provider paralelo.

## Proximos lotes recomendados
1. `Customer Portal Secure Evidence Upload V3`: upload customer-facing seguro reaproveitando intents/storage sem expor path.
2. `Customer Portal Ticket Collaboration V3`: estados de leitura, comentarios, anexos do cliente e regras de fechamento pelo cliente.
3. `Omni Inbox Thread Foundation V3`: separar canal/thread de ticket sem implementar canal real.
4. `Customer Portal Access Administration V3`: manager convidar/revogar usuarios do proprio tenant via RPC auditada.
5. `AI Context Readiness V3`: preparar views de contexto citavel para IA sem habilitar IA.
