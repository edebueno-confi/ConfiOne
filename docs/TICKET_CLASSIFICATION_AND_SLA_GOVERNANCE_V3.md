# Ticket Classification And SLA Governance V3

## Objetivo
Formalizar classificacao operacional de tickets, motivos auditaveis, prioridade/severidade, SLA interno e transicoes de status no backend, sem mover regra para o frontend e sem criar dashboard decorativo.

## Decisoes do corte
- Categorias de ticket foram criadas como dominio proprio (`ticket_categories`), separado de categorias de Knowledge.
- Motivos operacionais foram criados como dominio proprio (`ticket_operational_reasons`) para classificacao, prioridade e transicoes sensiveis.
- Categoria inicial permanece opcional para nao quebrar tickets existentes, mas quando informada e validada por contrato real.
- SLA foi implementado como governanca interna por `ticket_sla_policies`, nunca como promessa publica automatica.
- Prazos de primeira resposta e resolucao sao calculados no backend por prioridade, severidade e categoria quando houver politica ativa.
- Status de SLA e derivado por read model; o frontend nao calcula timer nem inventa estado.

## Backend
Novas estruturas:
- `ticket_categories`
- `ticket_operational_reasons`
- `ticket_sla_policies`

Campos adicionados em `tickets`:
- `category_id`
- `initial_operational_reason_id`
- `current_operational_reason_id`
- `sla_policy_id`
- `first_response_due_at`
- `resolution_due_at`

Helpers internos:
- `app_private.resolve_ticket_sla_policy`
- `app_private.apply_ticket_sla`
- `app_private.ticket_sla_status`
- `app_private.ticket_sla_status_label`
- `app_private.allowed_next_ticket_statuses`

## Views e RPCs
Read models:
- `vw_support_ticket_classification_options`
- `vw_support_ticket_sla_context`
- `vw_support_tickets_queue`
- `vw_support_ticket_detail`

RPCs:
- `rpc_create_ticket` com categoria e motivo inicial opcionais
- `rpc_support_update_ticket_classification`
- `rpc_support_update_ticket_priority_severity`
- `rpc_support_update_ticket_status_v2`

## Regras
- Mutacoes continuam somente por RPC.
- `tenant_id` e ator ativo seguem obrigatorios nos comandos relevantes.
- Categorias e motivos inativos ou arquivados nao podem ser usados.
- Transicao invalida de status falha no backend.
- Motivo operacional e exigido para transicoes sensiveis conforme matriz.
- Mudancas relevantes geram `ticket_event` e `audit.audit_logs`.
- Tabelas-base de classificacao/SLA nao sao superficie de escrita do frontend.

## Frontend
- `/support/queue` passou a filtrar por categoria real.
- Intake passou a aceitar categoria e motivo inicial opcionais quando o backend fornece opcoes.
- A fila mostra categoria, prioridade/severidade e SLA interno derivado.
- `/support/tickets/:ticketId` mostra classificacao e SLA no header/rail.
- Alteracao de categoria, prioridade/severidade e status usa RPC real.
- Transicoes sem contrato/sem permissao permanecem indisponiveis ou bloqueadas por copy honesta.

## SLA
O SLA deste lote e governanca operacional interna. Ele nao dispara notificacao externa, nao cria promessa publica e nao usa timer decorativo. Quando nao houver politica aplicavel, a UI deve mostrar `Indisponivel` ou `Sem politica definida`.

## Testes
Cobertura adicionada em `supabase/tests/026_ticket_classification_and_sla_governance.sql`:
- opcoes de categoria/motivo visiveis por contrato;
- categoria e motivo invalidos bloqueados;
- ticket criado com categoria valida;
- SLA derivado no backend;
- transicao valida permitida;
- transicao invalida bloqueada;
- motivo obrigatorio exigido quando aplicavel;
- `ticket_event` e `audit_log` gerados;
- cross-tenant bloqueado;
- DML direto bloqueado.

## Riscos restantes
- Politicas de categoria/SLA por tenant ainda nao foram implementadas.
- Calendario de negocio ainda e chave simples de politica, sem agenda/feriados.
- Notificacoes de SLA e escalonamento automatico continuam fora do escopo.
- Arquivamento seguro de evidencia continua em lote separado.
