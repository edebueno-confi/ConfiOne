# Customer Portal Secure Evidence Upload V3

## Objetivo

Fechar upload customer-facing seguro de evidencias no portal B2B autenticado, reaproveitando o bucket privado `ticket-evidence` sem expor `storage_bucket`, `storage_object_path`, path interno ou URL permanente ao frontend.

Este lote nao cria portal visual final, scan/antivirus, notificacao externa, IA ou Omni Inbox.

## Decisao de boundary

O upload do cliente usa boundary propria, separada do fluxo interno de suporte:

- cliente solicita intent por `rpc_customer_create_ticket_attachment_upload`;
- edge function recebe `boundary=customer`;
- edge function registra metadata por `rpc_customer_register_ticket_attachment`;
- download continua por grant curto emitido por `rpc_customer_get_attachment_download_url`;
- views customer-facing retornam apenas metadata sanitizada.

O bucket `ticket-evidence` continua privado e compartilhado, mas a permissao customer-facing e validada por tenant, ticket, ator customer ativo e intent customer. A seguranca nao depende apenas do formato do path.

## Contratos criados

### RPCs

- `rpc_customer_create_ticket_attachment_upload(p_tenant_id, p_ticket_id, p_original_filename, p_content_type, p_size_bytes)`
- `rpc_customer_register_ticket_attachment(p_upload_intent_id)`

### Edge function

- `ticket-evidence-upload?intent=<upload_intent_id>&boundary=customer`

O mesmo endpoint continua atendendo o fluxo interno quando `boundary` nao e `customer`; a decisao de registro final fica explicita no backend.

### Policies de storage

- `ticket_evidence_customer_insert`
- `ticket_evidence_customer_select`

As policies permitem operacoes somente no bucket privado `ticket-evidence`, com intent/grant valido e acesso customer-facing ao ticket.

## Tipos e tamanho permitidos

Whitelist MVP para upload customer-facing:

- `application/pdf`
- `image/jpeg`
- `image/png`
- `image/webp`

Limite:

- `10 MB` por arquivo

Bloqueios:

- executaveis;
- scripts;
- arquivo sem `content_type` aceito;
- arquivo acima do limite;
- ticket de outro tenant;
- ticket sem permissao customer-facing;
- ticket `closed` ou `cancelled`;
- upload anonimo.

## Metadata e visibilidade

Anexo enviado pelo cliente:

- pertence ao `tenant_id` e `ticket_id`;
- e registrado com `visibility = customer`;
- aparece no portal por `vw_customer_portal_ticket_attachments`;
- aparece no Support Workspace por `vw_support_ticket_attachments`;
- gera `ticket_event` de evidencia enviada pelo cliente;
- gera `audit_log` sem bucket/path sensivel.

O read model customer-facing expoe apenas:

- `attachment_id`;
- `ticket_id`;
- `display_name`;
- `content_type`;
- `size_bytes`;
- `uploaded_by_label`;
- `created_at`;
- `status`;
- `can_download`.

Nao expoe:

- `storage_bucket`;
- `storage_object_path`;
- signed URL permanente;
- path interno;
- payload bruto de storage.

## Frontend

### `/portal/tickets/:ticketId`

A tela passou a permitir:

- selecionar evidencia;
- validar tipo e tamanho antes do envio;
- criar intent customer-facing;
- enviar arquivo pela edge function;
- atualizar lista apos sucesso;
- baixar evidencia por URL temporaria segura;
- exibir erros amigaveis.

O frontend nao monta path, nao recebe bucket, nao recebe `storage_object_path` e nao deriva permissao localmente.

## Acoes habilitadas

- upload customer-facing seguro de evidencia;
- listagem de anexos customer-facing sanitizados;
- download customer-facing por grant curto;
- visibilidade da evidencia enviada pelo cliente no Support Workspace.

## Acoes bloqueadas

- arquivar/remover evidencia pelo cliente;
- URL persistente;
- bucket publico;
- upload anonimo;
- upload cross-tenant;
- scan/antivirus fake;
- notificacao externa;
- IA ou Omni Inbox.

## Testes

Cobertura adicionada em `supabase/tests/029_customer_portal_secure_evidence_upload.sql`:

- bucket privado e policies customer-facing;
- intent customer valido;
- path tenant-aware sem filename bruto;
- storage insert governado por policy;
- registro de metadata por RPC;
- view customer-facing sem bucket/path/URL;
- view interna de suporte enxerga a evidencia;
- download customer autorizado;
- cross-tenant bloqueado;
- tipo e tamanho invalidos bloqueados;
- ticket fechado bloqueia upload;
- `ticket_event` e `audit_log`;
- DML direto em `ticket_attachments` bloqueado.

## Riscos restantes

- arquivamento seguro de evidencia customer-facing ainda precisa RPC propria;
- politica de retencao/expurgo segue pendente;
- scan real de arquivo segue fora de escopo;
- producao depende de deploy correto das edge functions e secrets operacionais existentes.

## Proximo lote recomendado

`Customer Portal Access And Knowledge Entitlements V3`

Foco:

- direitos finos de acesso customer-facing;
- Knowledge autenticada autorizada por tenant/contato;
- bloqueio explicito de draft/internal/restricted/advisory;
- estados de acesso negado e conteudo indisponivel no portal.

## Atualizacao - Customer Portal Ticket Collaboration V3
- A colaboracao customer-facing foi fechada apos este lote de evidencias.
- O portal agora usa `vw_customer_portal_ticket_collaboration_state` para leitura/ack, resposta, resolucao e reabertura.
- Evidencias enviadas pelo cliente continuam visiveis como metadata sanitizada na timeline e no Support Workspace, sem bucket/path/URL permanente.
- Arquivamento/remocao pelo cliente continua bloqueado.
