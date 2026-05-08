# Secure Ticket Evidence Storage V3

## Objetivo

Fechar o upload real e seguro de evidências/anexos em tickets com:

- bucket privado
- policies de storage alinhadas ao ticket e ao tenant
- metadata sanitizada
- URL temporária curta para download
- `ticket_event`
- `audit_log`
- leitura segura no Ticket Workspace

O lote não cria bucket público, não expõe `storage_object_path` no frontend e não cria signed URL permanente.

## Auditoria inicial

### O que já existia

- `ticket_attachments` como tabela base do domínio
- `ticket_events` e `audit.audit_logs`
- `vw_support_ticket_attachments` como read model sanitizado inicial
- Ticket Workspace com painel de evidências já preparado para metadata sanitizada
- fluxo de permissão por tenant/ticket no Support Workspace

### O que faltava

- bucket privado real para evidências
- storage policies de upload/download por ator/ticket/tenant
- contrato seguro para preparar upload
- contrato seguro para registrar metadata após upload
- contrato seguro para resolver download temporário
- fixture QA com upload real no fluxo governado

### Riscos encontrados

- storage sem governança permitir upload direto por path
- exposição acidental de `bucket`/`path`/URL assinada persistente
- upload cross-tenant
- metadata divergente do objeto armazenado
- dependência de runtime local de functions sem bootstrap na fixture

## Decisão sobre bucket e storage

Bucket oficial criado/validado:

- `ticket-evidence`

Regras finais:

- `public = false`
- objeto sempre fica em path tenant-aware e ticket-aware
- o nome original do arquivo não é usado como identificador único
- segurança não depende apenas do path; depende também de policy e validação backend

Formato lógico do path:

- `tenant/<tenant_id>/ticket/<ticket_id>/<attachment_id>-<filename_sanitizado>`

## Contratos reaproveitados

- `ticket_attachments`
- `ticket_events`
- `audit.audit_logs`
- helpers privados de acesso ao ticket já existentes
- `vw_support_ticket_detail`
- `vw_support_tickets_queue`
- fluxo de refresh do Ticket Workspace

## Contratos criados ou alterados

### Tabelas auxiliares

- `ticket_attachment_upload_intents`
- `ticket_attachment_download_grants`

### Enum

- `ticket_attachment_status`

### Helpers privados

- `app_private.ticket_attachment_max_bytes`
- `app_private.ticket_attachment_allowed_content_types`
- `app_private.clean_ticket_attachment_display_name`
- `app_private.normalize_ticket_attachment_storage_name`
- `app_private.build_ticket_attachment_object_path`
- `app_private.ticket_attachment_size_label`
- `app_private.can_upload_ticket_evidence_object`
- `app_private.can_download_ticket_evidence_object`

### RPCs

- `rpc_support_create_ticket_attachment_upload`
- `rpc_support_register_ticket_attachment`
- `rpc_support_get_ticket_attachment_download_url`

### Edge functions

- `ticket-evidence-upload`
- `ticket-evidence-download`

### Read model sanitizado

- `vw_support_ticket_attachments`

## Storage policies

Policies aplicadas ao bucket privado:

- upload permitido apenas para ator autenticado que pode acessar o ticket e cujo intent pertence ao mesmo usuário
- download permitido apenas para ator autenticado que pode acessar o ticket e cujo grant curto foi emitido para ele
- bucket nunca público
- `UPDATE`/`DELETE` direto em `storage.objects` não foi aberto ao app
- cross-tenant bloqueado por validação de path e validação backend

## Metadata final exposta ao frontend

`vw_support_ticket_attachments` agora expõe apenas:

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

Não expõe:

- `storage_bucket`
- `storage_object_path`
- signed URL persistente
- payload bruto do storage

## Eventos e auditoria

Garantias materializadas:

- registrar anexo gera `ticket_event`
- mutações relevantes geram `audit_log`
- evento do ticket não registra `bucket`, `path` nem URL assinada
- `ticket_attachments`, `ticket_attachment_upload_intents` e `ticket_attachment_download_grants` ficaram auditadas no domínio

## Frontend

### `/support/tickets/:ticketId`

O workspace agora permite:

- selecionar arquivo local
- validar tipo e tamanho antes de enviar
- enviar arquivo por fluxo real governado
- atualizar lista de evidências após sucesso
- abrir download temporário seguro
- mostrar metadata sanitizada com status operacional

Guardrails preservados:

- sem path interno
- sem bucket visível
- sem erro técnico cru
- sem scroll global
- sem scroll horizontal

## Ações habilitadas

- upload real e seguro de evidência
- listagem sanitizada de anexos do ticket
- download temporário por signed URL curta

## Ações bloqueadas

- bucket público
- signed URL permanente
- upload sem `tenant_id` e `ticket_id`
- upload cross-tenant
- DML direto em `ticket_attachments`
- arquivamento/remocao de evidência sem RPC segura dedicada
- scan/antivírus fake

## Fixture QA

A fixture local agora cobre:

- ticket com anexo válido
- ticket sem anexo
- usuário autorizado para upload/download
- usuário sem permissão
- bootstrap do edge runtime local quando necessário

## Validações executadas

- `npm run supabase:db:reset`
- `npm run supabase:test:db`
- `npm run supabase:lint:db`
- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`
- `npm run supabase:qa:local-support-fixture`

## Validação visual

Viewport validado em browser real:

- `1920 x 945`

Telas verificadas:

- `/support/queue`
- `/support/tickets/:ticketId` com anexo existente
- `/support/tickets/:ticketId` sem anexo, com upload real testado

Resultado:

- sem scroll global
- sem scroll horizontal
- scroll interno apenas nos containers operacionais
- upload validado pela UI com arquivo real
- download temporário disponível para evidência autorizada

## Riscos restantes

- arquivamento seguro de evidência ainda não foi habilitado
- antivírus/scan de arquivo continua fora do escopo
- governança de retenção e expurgo de storage ainda precisa decisão própria
- runtime local de edge functions foi endurecido na fixture, mas produção ainda depende de configuração operacional consistente do ambiente

## Próximo lote recomendado

- `Ticket Classification And SLA Governance V3`

Objetivo do próximo lote:

- fechar categoria inicial formal
- motivos operacionais auditáveis
- governança de prioridade/SLA
- estados e transições com contrato explícito no backend
