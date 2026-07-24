# SUPPORT_TICKET_OPERATIONAL_FLOW_V3.md

## Objetivo
Fechar o primeiro bloco operacional real do workspace de tickets do Genius Support OS, mantendo o backend como fonte de verdade para leitura, mutacao, permissao, eventos e auditoria.

## Auditoria inicial

### Contratos existentes reaproveitados
- Tabelas base: `tickets`, `ticket_messages`, `ticket_events`, `ticket_assignments`, `ticket_attachments`.
- Audit trail: `audit.audit_logs` e triggers de `audit.capture_row_change()` sobre tabelas operacionais.
- Read models genericos: `vw_tickets_list`, `vw_ticket_detail`, `vw_ticket_timeline`.
- Read models do Support Workspace: `vw_support_tickets_queue`, `vw_support_ticket_detail`, `vw_support_ticket_timeline`, `vw_support_ticket_timeline_recent`, `vw_support_customer_360`, `vw_support_customer_recent_tickets`, `vw_support_customer_recent_events`, `vw_support_assignable_agents`.
- RPCs operacionais existentes: `rpc_create_ticket`, `rpc_update_ticket_status`, `rpc_assign_ticket`, `rpc_add_ticket_message`, `rpc_add_internal_ticket_note`, `rpc_close_ticket`, `rpc_reopen_ticket`.
- Ponte ticket -> Knowledge existente: `ticket_knowledge_links`, `vw_support_ticket_knowledge_links`, `vw_support_knowledge_article_picker`, `rpc_support_link_ticket_article`, `rpc_support_archive_ticket_article_link`, `rpc_support_mark_documentation_gap`, `rpc_support_mark_article_needs_update`.

### Lacunas encontradas
- A timeline tinha apenas janela recente contratual; faltava RPC paginada para carregar historico anterior sem expor tabelas base.
- O picker de Knowledge ja indicava permissao de envio, mas faltava view dedicada que retornasse somente artigos publicos com rota publica segura pronta.
- A contagem global de RPCs auditadas precisava acompanhar a nova RPC exposta.

## Contratos criados

### `rpc_support_get_ticket_timeline`
- Finalidade: carregar paginas da timeline operacional do ticket por cursor.
- Parametros: `p_ticket_id`, `p_limit`, `p_before_occurred_at`, `p_before_timeline_entry_id`.
- Regras:
  - exige ator autenticado e ativo;
  - exige acesso ao Support Workspace do tenant do ticket;
  - limita pagina entre `1` e `100` itens;
  - usa `vw_support_ticket_timeline` como read model fonte;
  - retorna mensagens publicas, notas internas e eventos ja filtrados pelo contrato de suporte;
  - retorna `total_available_count`, `page_limit` e `has_more`;
  - nao concede `SELECT` direto nas tabelas base.

### `vw_support_knowledge_public_link_candidates`
- Finalidade: listar, por ticket, apenas artigos que podem ser usados como link publico seguro.
- Regras:
  - filtra pelo tenant do ticket e permissao do Support Workspace;
  - depende do contrato publico `app_private.vw_knowledge_articles_public_contract`;
  - retorna `public_article_path` pronto;
  - nao expõe draft, internal, restricted ou artigo sem rota publica publicada.

## Frontend conectado
- `/support/tickets/:ticketId` passou a carregar historico anterior da conversa pela RPC `rpc_support_get_ticket_timeline`.
- O estado `has_more` deixou de ser apenas informativo e passou a exibir a acao real `Carregar histórico anterior`.
- Estados de carregamento e erro permanecem amigaveis, sem vazar erro tecnico cru.
- As mutacoes existentes continuam passando somente por RPCs reais.

## Acoes habilitadas
- Enviar resposta publica: `rpc_add_ticket_message`.
- Salvar nota interna: `rpc_add_internal_ticket_note`.
- Alterar status: `rpc_update_ticket_status`.
- Atribuir/desatribuir responsavel: `rpc_assign_ticket`.
- Fechar/reabrir ticket: `rpc_close_ticket` e `rpc_reopen_ticket`.
- Carregar historico anterior da timeline: `rpc_support_get_ticket_timeline`.
- Vincular Knowledge no ticket: RPCs de `ticket_knowledge_links` ja existentes.

## Acoes ainda bloqueadas
- Anexos na conversa: falta storage/schema/RPC e regra de exposicao.
- SLA executavel e motivos de status: falta modelo operacional e decisao de produto.
- Handoff tecnico estruturado: falta entidade intermediaria para nao misturar ticket com work item de engenharia.
- Criacao operacional assistida de ticket na UI: `rpc_create_ticket` existe, mas o fluxo de entrada, UX e permissao de superficie ainda precisam de lote proprio.
- Envio/copia automatica de link publico ao cliente: contrato de candidato seguro existe, mas a acao de envio/copia governada ainda precisa de UX e regra de auditoria especifica.

## Testes
- `npm run supabase:db:reset`
- `npm run supabase:test:db`
- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`

## Riscos restantes
- A timeline ainda nao cobre anexos.
- A criacao de ticket no workspace precisa desenho de entrada para evitar abertura incompleta ou sem requester.
- Knowledge dentro do ticket ainda nao deve enviar automaticamente nada ao cliente sem contrato de acao dedicado.
- Handoff para engenharia deve ser lote separado, com entidade propria e auditoria.
