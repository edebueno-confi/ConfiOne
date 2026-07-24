# Support Workspace Status Flow P0 Spec — 2026-05-20

## Objetivo
Consolidar o estado real do fluxo de status do Support Workspace, com foco backend-first, para estabilizar a superfície `/support/tickets/:ticketId` sem reintroduzir regra de negócio no frontend.

## Escopo desta revisão
- inspeção de documentação vigente;
- inspeção do frontend real em `apps/web/src/features/support/`;
- inspeção dos contratos TypeScript em `packages/contracts/src/ticketing.ts` e `apps/web/src/contracts/support-contracts.ts`;
- inspeção das migrations/RPCs/read models de suporte em `supabase/migrations/`;
- leitura dos testes pgTAP já existentes em `supabase/tests/005_phase2_ticketing_core.sql` e `supabase/tests/026_ticket_classification_and_sla_governance.sql`.

Sem alteração de schema, sem migration nova, sem mudança de RLS e sem mudança de runtime neste lote.

## Fonte de verdade operacional atual
A implementação real confirma o boundary desejado:
- frontend lê por views/read models;
- frontend escreve apenas por RPCs;
- transição de status é decidida no backend;
- o frontend deve consumir flags e listas já derivadas pelo backend, sem fallback comportamental amplo.

### Leituras reais usadas pelo workspace
- `vw_support_tickets_queue`
- `vw_support_ticket_detail`
- `vw_support_ticket_timeline_recent`
- `rpc_support_get_ticket_timeline`

### Escritas reais usadas pelo workspace
- `rpc_support_update_ticket_status_v2`
- `rpc_close_ticket`
- `rpc_reopen_ticket`
- `rpc_assign_ticket`
- `rpc_add_ticket_message`
- `rpc_add_internal_ticket_note`
- `rpc_support_update_ticket_classification`
- `rpc_support_update_ticket_priority_severity`

## Evidência de implementação real

### Frontend
`apps/web/src/features/support/support-api.ts`
- mapeia `can_update_status`, `can_close`, `can_reopen` e `allowed_next_statuses` do read model para `canUpdateStatus`, `canClose`, `canReopen` e `allowedNextStatuses`;
- executa fechamento e reabertura apenas por `rpc_close_ticket` e `rpc_reopen_ticket`.

`apps/web/src/features/support/SupportWorkspacePage.tsx`
- `buildStatusChoices()` monta opções a partir de `allowedNextStatuses` e remove apenas `closed` e o status atual;
- `handleUpdateStatus()` envia a mutação para `updateTicketStatus()` usando `rpc_support_update_ticket_status_v2`;
- `handleClose()` e `handleReopen()` usam fluxos separados via RPC dedicada;
- `pendingCloseItems` já consome `canClose` e bloqueios de contexto em vez de inferir permissões por conta própria.

`apps/web/src/features/support/components/SupportTicketAdvancedContextPanels.tsx`
- o drawer de status usa `buildStatusChoices(ticketDetail.status, ticketDetail.allowedNextStatuses)`;
- o CTA de salvar andamento depende de `ticketDetail.canUpdateStatus`, da existência de transições e, quando aplicável, de motivo operacional obrigatório.

### Backend
`supabase/migrations/20260429225342_phase2_ticketing_core_backend_contracts.sql`
- `rpc_close_ticket` só aceita ticket `resolved` e força transição para `closed`;
- `rpc_reopen_ticket` só aceita `resolved`/`closed` e força transição para `waiting_support`;
- `vw_ticket_detail`/`vw_tickets_list` derivam `can_close` e `can_reopen` a partir de `can_manage` e do status corrente.

`supabase/migrations/20260509001100_ticket_classification_and_sla_governance_v3.sql`
- `app_private.allowed_next_ticket_statuses(...)` é a matriz canônica de `allowed_next_statuses`;
- `app_private.ticket_status_transition_allowed(...)` continua sendo o gate booleano de transição.

### Testes já materializados
`supabase/tests/005_phase2_ticketing_core.sql`
- cobre bloqueio de fechamento inválido;
- cobre `rpc_close_ticket` fechando ticket resolvido;
- cobre `rpc_reopen_ticket` reabrindo ticket fechado em `waiting_support`.

## Matriz canônica de transição atual
Definida por `app_private.allowed_next_ticket_statuses`:
- `new` → `triage`, `waiting_customer`, `waiting_support`, `waiting_engineering`, `in_progress`, `resolved`, `cancelled`
- `triage` → `waiting_customer`, `waiting_support`, `waiting_engineering`, `in_progress`, `resolved`, `cancelled`
- `waiting_support` → `triage`, `waiting_customer`, `waiting_engineering`, `in_progress`, `resolved`, `cancelled`
- `waiting_customer` → `waiting_support`, `in_progress`, `resolved`, `cancelled`
- `waiting_engineering` → `waiting_support`, `in_progress`, `resolved`, `cancelled`
- `in_progress` → `waiting_customer`, `waiting_support`, `waiting_engineering`, `resolved`, `cancelled`
- `resolved` → `closed`, `waiting_support`, `in_progress`
- `closed` → `waiting_support`
- outros casos → array vazio

## Risco P0 identificado

### 1. Fallback permissivo no frontend quando `allowedNextStatuses` vier vazio
Hoje `buildStatusChoices()` usa `TICKET_STATUSES` como fallback quando `allowedNextStatuses.length === 0`.

Impacto:
- se o read model/regressão contratual deixar de projetar `allowed_next_statuses`, a UI passa a parecer mais permissiva do que o backend real;
- a RPC ainda bloqueia transições inválidas, mas o operador vê opções incorretas e só descobre o erro no submit;
- isso degrada UX, mascara drift contratual e enfraquece a disciplina backend-first.

Severidade: P0 de conformidade contratual/UX, mesmo sem corrupção de dados.

### 2. Documentação ainda parcialmente atrasada em relação ao runtime
Parte da documentação histórica ainda descreve `rpc_update_ticket_status` genérica ou lacunas já superadas, enquanto o runtime atual usa `rpc_support_update_ticket_status_v2`, `allowed_next_statuses` e flags de ação no read model.

Impacto:
- aumenta risco de implementação futura reabrir lógica duplicada no frontend;
- dificulta QA e revisão arquitetural porque a documentação não aponta claramente a fonte de verdade atual.

### 3. Fechamento/reabertura seguem fora de `allowedNextStatuses` no frontend por desenho, mas exigem documentação explícita
O fluxo atual é coerente: `closed` não entra no seletor normal e fechamento/reabertura têm RPCs dedicadas. O risco não é funcional; é de reimplementação futura errada caso alguém tente unificar tudo no dropdown sem respeitar o contrato atual.

## Opções incrementais recomendadas

### Opção A — hardening mínimo imediato
Escopo:
- remover o fallback amplo para `TICKET_STATUSES` quando `allowedNextStatuses` vier vazio;
- tratar array vazio como estado contratual indisponível ou sem transição disponível;
- manter fechamento/reabertura nos fluxos dedicados.

Prós:
- menor dif e menor risco;
- reforça backend-first imediatamente;
- transforma drift contratual em falha visível e auditável.

Contras:
- depende de copy honesta para estados temporariamente indisponíveis.

Recomendação: sim, primeira entrega prática.

### Opção B — endurecimento contratual do frontend
Escopo:
- além da Opção A, centralizar num helper único a interpretação das flags `canUpdateStatus`, `canClose`, `canReopen` e `allowedNextStatuses`;
- proibir qualquer outro ponto da UI de reconstruir permissões por inferência indireta.

Prós:
- reduz duplicação de lógica de apresentação;
- facilita QA e revisão futura.

Contras:
- exige tocar mais superfícies do frontend.

Recomendação: segunda etapa logo após a Opção A.

### Opção C — alinhamento de documentação + QA contratual
Escopo:
- atualizar `SUPPORT_WORKFLOW.md`, `SUPPORT_WORKSPACE_ARCHITECTURE_SPEC.md` e `PROJECT_STATE.md`;
- explicitar que status normal usa `rpc_support_update_ticket_status_v2`, enquanto `close/reopen` usam RPCs dedicadas;
- registrar o risco do fallback permissivo e o plano de validação.

Prós:
- reduz reintrodução de bugs por documentação desatualizada;
- cria trilha auditável para o próximo card de implementação.

Contras:
- não corrige runtime sozinho.

Recomendação: executar junto com este lote documental.

## Decisão recomendada
Sequência segura:
1. fechar este lote documental de alinhamento;
2. abrir implementação incremental para Opção A;
3. se o diff tocar múltiplos componentes, estender para Opção B no mesmo card ou no seguinte;
4. validar com QA de status, fechamento e reabertura após o hardening.

## Critérios de aceite para a correção de runtime
- a UI não pode listar transições fora de `allowedNextStatuses`;
- `allowedNextStatuses = []` não pode liberar fallback amplo para todos os status;
- fechamento continua possível apenas via `rpc_close_ticket` quando `canClose = true`;
- reabertura continua possível apenas via `rpc_reopen_ticket` quando `canReopen = true`;
- o frontend continua sem DML direto e sem cálculo local da matriz de transição.

## Plano de validação recomendado

### Validação documental
- conferir coerência entre este spec, `SUPPORT_WORKFLOW.md`, `SUPPORT_WORKSPACE_ARCHITECTURE_SPEC.md`, `DOCUMENTATION_LEDGER.md` e `PROJECT_STATE.md`.

### Validação de backend/contrato
- `npm run contracts:typecheck`
- `npm run supabase:test:db` ou, no mínimo, foco nos testes que já cobrem `rpc_close_ticket`, `rpc_reopen_ticket` e transições do domínio.

### Validação de frontend
- `npm run web:typecheck`
- `npm run web:build`
- smoke local autenticado no Support Workspace com fixture oficial.

### Cenários mínimos de QA
- ticket em `resolved` exibe fechamento apenas quando `canClose = true`;
- ticket em `closed` oferece reabertura apenas quando `canReopen = true`;
- ticket sem `allowedNextStatuses` útil não deve exibir lista expandida de status falsamente permitidos;
- transições com motivo obrigatório permanecem exigindo motivo operacional.

## Pendências explícitas
- implementar o hardening do fallback de `allowedNextStatuses` no frontend;
- decidir se o endurecimento entra como card isolado ou junto com revisão mais ampla do workspace;
- rodar a bateria técnica completa quando houver diff de runtime.

## Conclusão
O runtime atual já está majoritariamente correto e backend-first. O principal risco P0 remanescente não é uma transição inválida persistida no banco, e sim a possibilidade de a UI aparentar permissões indevidas quando `allowed_next_statuses` não vier projetado corretamente. O próximo passo seguro é endurecer esse fallback e manter a documentação alinhada ao contrato real.