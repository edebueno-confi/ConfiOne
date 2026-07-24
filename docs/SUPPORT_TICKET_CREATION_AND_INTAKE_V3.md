# SUPPORT_TICKET_CREATION_AND_INTAKE_V3.md

## Objetivo
Fechar o fluxo real de criação e intake de tickets no Genius Support OS sem criar ação falsa no frontend, mantendo `tenant_id` explícito, ator autenticado, trilha de auditoria e evento inicial no backend.

## Contratos reaproveitados
- `rpc_create_ticket`
- `vw_support_tickets_queue`
- `vw_support_ticket_detail`
- `vw_support_ticket_timeline_recent`
- `rpc_support_get_ticket_timeline`
- `vw_support_customer_account_context`

## Contratos novos deste lote

### Read models de intake
- `vw_support_ticket_intake_tenants`
- `vw_support_ticket_intake_contacts`

### Regras
- apenas `platform_admin`, `support_agent` e `support_manager` com membership ativo no tenant aparecem na superfície de intake;
- o frontend não lê `tenants` nem `tenant_contacts` diretamente;
- tenant sem contato ativo continua elegível, mas a UI assume esse estado como `Indisponível` e o RPC decide se o ticket pode nascer sem solicitante;
- status inicial continua controlado pelo backend em `new`;
- no lote posterior `Ticket Classification And SLA Governance V3`, categoria e motivo inicial passaram a existir como campos opcionais governados por contrato real; esta fase original nao inventou classificacao antes do backend.

## Frontend
- `/support/queue` agora possui ação real para abrir ticket.
- O intake foi encaixado no rail de preview da fila, sem modal novo e sem scroll global.
- Campos habilitados:
  - cliente B2B
  - contato solicitante, quando existir
  - origem
  - prioridade
  - severidade
  - categoria operacional, quando o backend fornecer opcoes
  - motivo operacional inicial, quando aplicavel
  - título
  - descrição
- Após sucesso, a navegação segue para `/support/tickets/:ticketId`.

## Auditoria e trilha operacional
- a criação continua gerando `ticket_created` em `ticket_events`;
- a criação continua auditada pelos triggers append-only já vigentes em `audit.audit_logs`;
- nenhuma permissão nova foi aberta para DML direto do frontend.

## Fixture QA
- `support-qa-c` passou a existir sem contato ativo materializado;
- um ticket de fixture agora é criado via `rpc_create_ticket`, cobrindo o caminho real de intake sem solicitante vinculado.

## Riscos restantes
- categoria inicial e SLA foram fechados em lote posterior com contrato backend real;
- notificação externa continua fora deste lote;
- o read model de intake foi fechado para o Support Workspace, não para requesters comuns nem portal público.
