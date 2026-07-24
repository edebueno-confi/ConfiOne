# P2-C Communication Channel Governance & Provider Readiness

Data: 2026-05-24
Branch: `codex/p2-c-communication-channel-governance-readiness`

## Sumario executivo

O lote P2-C criou a camada governada de readiness de canais de comunicacao por tenant, mantendo `customer_portal` como unico canal real do MVP e deixando `email_future`, `whatsapp_future`, `chat_future` e `api_future` explicitamente bloqueados ou preparados para futuro. Nao foi criado provider externo, segredo, API key, token, webhook, job externo, retry ou Omni Inbox.

## Auditoria inicial

- P2 ja normalizava origem/canal por read models e P2-B ja registrava delivery customer-facing no Portal.
- Canais externos apareciam como capabilities bloqueadas, mas sem governanca por tenant.
- Admin nao tinha superficie consolidada para ver readiness de canais por cliente.
- Support recebia motivos de indisponibilidade por backend, mas ainda nao havia setting governado por tenant.
- Portal nao recebia provider, delivery tecnico ou readiness, e esse boundary foi preservado.

## Decisoes de modelo

- `communication_channel_definitions` define canais globais e seus limites.
- `tenant_communication_channel_settings` registra readiness por tenant.
- `customer_portal` pode ficar `active`, `is_enabled=true`, `can_send=true`, `can_receive=true`.
- Canais externos nao podem ficar `active`, `enabled`, `can_send` ou `can_receive` enquanto nao houver provider real contratado.
- Campos de texto de governanca bloqueiam termos com aparencia de segredo (`token`, `api key`, `secret`, `password`, `webhook`, `bearer`, etc.).
- Admin pode atualizar readiness e observacao operacional, mas nao pode configurar segredo nem habilitar provider externo real.

## Contratos criados ou alterados

Tabelas:
- `communication_channel_definitions`
- `tenant_communication_channel_settings`

Views:
- `vw_admin_communication_channel_readiness`
- `vw_support_tenant_communication_capabilities`
- `vw_support_ticket_channel_readiness`
- `vw_support_ticket_channel_context`
- `vw_support_ticket_communication_capabilities`
- `vw_support_ticket_delivery_capabilities`
- `vw_admin_communication_delivery_summary`
- `vw_admin_system_audit_events`

RPCs:
- `rpc_admin_update_tenant_channel_readiness`
- `rpc_admin_disable_tenant_channel`
- `rpc_admin_mark_channel_future_ready`

## Frontend alterado

- `/admin/system` passou a exibir card compacto de governanca de canais.
- O card mostra Portal ativo, canais externos futuros/bloqueados, tenant count, capacidade de envio e motivo operacional.
- Nao ha formulario de provider, campo de token, API key, webhook ou acao de envio externo.
- Support continua consumindo capabilities backend-safe para bloquear canais externos.
- Portal nao recebeu UI de readiness.

## Fixture QA

A fixture funcional local passou a registrar readiness sanitizado para o tenant QA:
- `customer_portal`: `active`
- `email_future`: `not_configured`
- `whatsapp_future`: `not_configured`
- `chat_future`: `future`
- `api_future`: `blocked`

Credenciais usadas:
- `qa.local.platform-admin@genius.local` / `Local-QA-Admin-2026!`
- `qa.local.support-manager-a@genius.local` / `Local-QA-Manager-A-2026!`
- `qa.local.support-agent-a@genius.local` / `Local-QA-Agent-A-2026!`
- `marina.ops@support-qa-a.local` / `Local-QA-Customer-A-2026!`
- `gestao.portal@support-qa-a.local` / `Local-QA-Customer-Manager-A-2026!`

## QA e boundaries

Confirmado por pgTAP:
- `authenticated` nao tem DML direto nas novas tabelas.
- `platform_admin` ve readiness por tenant.
- suporte ve capabilities por tenant/ticket.
- cliente nao acessa view de Support.
- Portal nao expoe readiness/provider em suas views.
- tentativa de habilitar canal externo como `active` e bloqueada.
- textos com aparencia de segredo sao bloqueados.
- audit log registra mutacoes de readiness.

Confirmado por smoke/browser:
- `/admin/system` exibe governanca sem campo de segredo.
- `/admin/customer-portal` permanece operacional.
- `/support/queue` e `/support/tickets/:ticketId` preservam Portal como canal real e externos bloqueados.
- `/portal/tickets/:ticketId` nao mostra readiness, provider ou enum tecnico.
- `/help/genius`, `/internal-actions` e `/engineering` nao foram afetadas.

## O que ficou fora

- Integracao real de e-mail, WhatsApp, chat, API, Gmail, Outlook, HubSpot, Octadesk, Twilio, Zenvia, Meta, SendGrid ou Resend.
- Provider config, segredo, token, API key, webhook, job externo, retry externo e outbox para provider.
- Omni Inbox, chatbot e IA.

## Riscos restantes

- Futuro provider real exigira contrato proprio de segredo, storage seguro, consentimento, templates, webhooks, retry, idempotencia e reconciliacao.
- A UI administrativa ainda e read-only/operacional para readiness; configuracao real de provider deve ser outro lote.
- O readiness por tenant ainda depende de dados locais/contratuais, sem health check externo.

## Proxima fase recomendada

Planejar `P2-D Communication Provider Contract Design`, ainda sem integrar provider, para especificar criterios de seguranca, secrets, webhooks, consentimento, templates, retries, observabilidade e rollback antes de qualquer envio externo real.
