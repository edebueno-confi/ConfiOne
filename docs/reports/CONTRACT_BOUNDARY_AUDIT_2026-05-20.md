# Contract Boundary Audit — 2026-05-20

## Objetivo
Auditar o boundary real entre frontend, pacote `packages/contracts` e contratos documentados em `docs/VIEW_RPC_CONTRACTS.md`, identificando gaps documentais, pontos de consumo e riscos de regra crítica ainda carregada no cliente.

## Escopo auditado
- `packages/contracts/src/index.ts`
- `packages/contracts/src/ticketing.ts`
- `packages/contracts/README.md`
- `apps/web/src/contracts/support-contracts.ts`
- `apps/web/src/features/support/*`
- `apps/web/src/features/engineering/*`
- `apps/web/src/features/customer-portal/*`
- `apps/web/src/features/auth/*`
- `docs/VIEW_RPC_CONTRACTS.md`
- `docs/PROJECT_STATE.md`
- `docs/SUPPORT_WORKFLOW.md`
- `docs/SUPPORT_WORKSPACE_ARCHITECTURE_SPEC.md`
- `docs/AUTH_CONTEXT_STRATEGY.md`

## Resumo executivo
O frontend está majoritariamente alinhado ao boundary backend-first: lê por views/read models e escreve por RPCs, consumindo tipos compartilhados via `packages/contracts` reexportados em `apps/web/src/contracts/support-contracts.ts`.

O principal problema encontrado não é de arquitetura de runtime, mas de governança documental: o `packages/contracts/README.md` e trechos de `docs/PROJECT_STATE.md` subdeclaram o escopo real do pacote. Hoje o pacote já cobre suporte, engenharia, customer portal, internal actions e partes relevantes do fluxo seguro de anexos; a documentação ainda descreve um pacote restrito a ticketing/support e chega a afirmar que engenharia/storage ainda não existem no contrato.

Também existem alguns pontos de lógica de UX no frontend que não quebram a segurança porque o backend continua autoritativo, mas merecem atenção para evitar drift de produto quando os contratos evoluírem.

## Evidências principais

### 1. O pacote compartilhado cobre mais do que a documentação afirma
`packages/contracts/src/index.ts` exporta enums/tipos de:
- engenharia: `ENGINEERING_WORK_ITEM_*`, `EngineeringWorkspace*`, `RpcEngineering*`
- internal actions: `INTERNAL_ACTION_*`, `InternalAction*`, `RpcInternalAction*`, `RpcSupport*InternalAction*`
- customer portal: `CustomerPortal*`, `RpcCustomer*`
- anexos/storage seguro: `RpcSupportCreateTicketAttachmentUpload*`, `RpcSupportRegisterTicketAttachment*`, `RpcSupportGetTicketAttachmentDownloadUrl*`, `RpcCustomerCreateTicketAttachmentUpload*`, `RpcCustomerRegisterTicketAttachment*`, `RpcCustomerGetAttachmentDownloadUrl*`

`apps/web/src/contracts/support-contracts.ts` reexporta esse escopo para o app web e inclui explicitamente tipos de customer portal, engineering e internal actions.

### 2. A documentação do pacote está desatualizada
Em `packages/contracts/README.md:73-76` ainda consta:
- "Ainda não existe contrato de knowledge base, engenharia ou storage."

Isso contradiz o código atual do pacote e o reexport efetivamente usado pelo frontend.

### 3. `PROJECT_STATE.md` também subdeclara o escopo do pacote
Em `docs/PROJECT_STATE.md:257-258` consta apenas:
- pacote materializado para views/RPCs de ticketing
- pacote materializado para read models do Support Workspace

Esse texto já não representa o estado real, porque o pacote também cobre customer portal, engineering workspace, internal actions e RPCs de anexos seguros.

### 4. O frontend consome os contratos compartilhados nas superfícies críticas
Foram encontradas importações de `../../contracts/support-contracts` em:
- `features/support/support-api.ts`
- `features/support/SupportWorkspacePage.tsx`
- `features/engineering/engineering-api.ts`
- `features/engineering/EngineeringWorkspacePage.tsx`
- `features/customer-portal/customer-portal-api.ts`
- `features/customer-portal/customer-portal-context.tsx`
- `features/customer-portal/CustomerPortalPage.tsx`

Isso indica que suporte, engenharia e portal cliente já estão acoplados ao boundary tipado compartilhado, não a tipos locais ad hoc.

### 5. O portal cliente respeita boundary backend-governed para contexto ativo
`customer-portal-context.tsx` usa:
- `activeContext.tenantId`
- `activeContext.contextVersion`
- status vindos de `fetchCustomerPortalSessionStatus`, `fetchCustomerPortalAvailableTenants` e `fetchCustomerPortalActiveTenantContext`

A assinatura de contexto é montada como `${tenantId}:${contextVersion}` e o runtime bloqueia ações sensíveis em estados como `stale_context`, `session_expired`, `access_revoked`, `tenant_unavailable`, `network_retryable` e `fatal_error`.

Isso está coerente com `docs/AUTH_CONTEXT_STRATEGY.md` e reduz risco de o frontend virar fonte de verdade para tenant ativo.

## Boundary real por domínio

### Support Workspace
Estado auditado: alinhado ao modelo backend-first.

Evidências:
- `docs/PROJECT_STATE.md:254-256` documenta que `authenticated` não faz DML direto nas tabelas-base; o app lê por views e escreve por RPCs.
- `support-api.ts` faz mapping de flags já resolvidas pelo backend, como `can_view_internal`, `can_add_message`, `can_update_status`, `allowed_next_statuses`, `is_waiting_customer`, `is_waiting_support`, `is_waiting_engineering`.

Conclusão:
- autorização e transição real continuam no backend;
- o frontend está principalmente renderizando read models e submetendo mutações via RPC.

### Engineering Workspace
Estado auditado: contratos reais materializados e documentados.

Evidências:
- `docs/ENGINEERING_WORKSPACE_OPERATIONAL_CORE_V3.md` e `docs/VIEW_RPC_CONTRACTS.md` listam `vw_engineering_work_items_queue`, `vw_engineering_work_item_detail`, `vw_engineering_work_item_ticket_links`, `vw_engineering_work_item_updates` e RPCs `rpc_engineering_*`.
- `EngineeringWorkspacePage.tsx` importa tipos compartilhados via `support-contracts.ts`.

Conclusão:
- o domínio de engenharia está formalizado no backend e tipado no pacote compartilhado;
- o README do pacote é que ficou para trás.

### Internal Actions
Estado auditado: backend-first, sem UI rica nova, boundary explícito.

Evidências:
- `docs/VIEW_RPC_CONTRACTS.md:1580-1608` materializa leituras, escritas e boundary do domínio `internal_actions`.
- `docs/SUPPORT_WORKFLOW.md` e `docs/SUPPORT_WORKSPACE_ARCHITECTURE_SPEC.md` reforçam que suporte continua owner do ticket e cliente/portal não enxergam `internal_actions`.
- `packages/contracts/src/index.ts` já exporta `InternalAction*` e `RpcInternalAction*`.

Conclusão:
- o contrato existe e está documentado;
- novamente o gap está concentrado na documentação do pacote, não no boundary de runtime.

### Customer Portal
Estado auditado: bem alinhado a contratos backend-governed.

Evidências:
- `docs/AUTH_CONTEXT_STRATEGY.md` define explicitamente `active_tenant_id` governado por backend.
- `customer-portal-context.tsx` consome `contextVersion` e status de sessão tipados.
- `customer-portal-api.ts` mapeia permissões derivadas do backend (`canReply`, `canAcknowledge`, `canConfirmResolution`, `canRequestReopen`) em vez de inferi-las localmente por status.

Conclusão:
- o portal está mais próximo do desenho ideal: frontend usa flags e contratos derivados do backend, sem heurística forte para autorização.

### Internal Documents / Admin Docs
Estado auditado: contrato real existe, mas não vive em `packages/contracts`.

Evidências:
- `docs/VIEW_RPC_CONTRACTS.md` e `docs/INTERNAL_DOCUMENTS_ARCHITECTURE.md` formalizam `vw_internal_documents_catalog` e `vw_internal_document_detail`.
- a documentação deixa claro que `/admin/product-docs` e `/admin/build-journal` consomem esses contratos reais.
- esses contratos não aparecem no `packages/contracts/src/index.ts` auditado.

Conclusão:
- existe uma assimetria arquitetural: parte do boundary real do produto ainda não foi promovida ao pacote compartilhado.
- isso não é bug imediato, mas enfraquece a ideia de um catálogo único de contratos compartilhados.

## Riscos encontrados

### R1. Drift documental do pacote de contratos
Severidade: alta

Problema:
- `packages/contracts/README.md` afirma que não há contratos de engenharia/storage, mas o código exporta esses contratos.
- `docs/PROJECT_STATE.md` descreve um pacote mais estreito do que o real.

Impacto:
- reduz confiança da documentação como fonte de verdade;
- aumenta risco de decisões erradas em novas implementações, reviews e handoffs.

Recomendação:
- atualizar `packages/contracts/README.md` para refletir o escopo real atual;
- atualizar `docs/PROJECT_STATE.md` para declarar cobertura de engineering, customer portal, internal actions e anexos seguros.

### R2. Fallback permissivo de transição de status no Support Workspace
Severidade: média

Evidência:
`apps/web/src/features/support/SupportWorkspacePage.tsx:862-875`
- `buildStatusChoices` usa `allowedNextStatuses` vindos do backend;
- se a lista vier vazia, cai em fallback para `TICKET_STATUSES`.

Impacto:
- o backend ainda barra transições inválidas, então não há quebra de segurança;
- porém a UI pode exibir opções indevidas se o contrato/regra de backend falhar ou ficar incompleto, gerando UX enganosa e dependência desnecessária de validação por erro.

Recomendação:
- remover o fallback amplo para `TICKET_STATUSES`;
- tratar `allowedNextStatuses` vazio como estado honesto de indisponibilidade/erro contratual, salvo se houver regra documental explícita para fallback.

### R3. Buckets operacionais de engenharia dependem de listas hardcoded de status
Severidade: baixa a média

Evidência:
`apps/web/src/features/engineering/EngineeringWorkspacePage.tsx:686-696`
- `open` exclui manualmente `released`, `rejected`, `cancelled`;
- `inProgress` agrupa manualmente `in_progress` e `accepted`.

Impacto:
- não é risco de autorização;
- mas cria risco de drift visual/operacional se novos statuses forem adicionados no backend sem revisão dessa composição local.

Recomendação:
- preferir flags derivadas do backend para agrupamentos operacionais principais; ou
- ao menos centralizar esses agrupamentos em helper com comentário vinculando-os ao contrato oficial.

### R4. Gate administrativo ainda usa heurística local de papel global
Severidade: média

Evidência:
`apps/web/src/features/auth/auth-api.ts:77-95`
- `isPlatformAdmin` é resolvido por `typedRoles.includes('platform_admin')`.

Leitura do risco:
- isso pode estar coerente com o próprio payload de `vw_admin_auth_context`, se `roles` já for a fonte contratual final;
- mas merece revisão porque a documentação diz que o gate administrativo deve derivar exclusivamente de `vw_admin_auth_context`.

Impacto:
- se `roles` continuar sendo a shape contratual já saneada, o risco é baixo;
- se a intent documental for consumir um flag/backend decision já resolvido, há pequeno acoplamento de regra de gate no cliente.

Recomendação:
- confirmar se `roles` é o contrato oficial suficiente;
- se não for, expor decisão já derivada no read model e consumir diretamente sem `includes` local.

## Conclusão
A arquitetura principal está melhor do que a documentação lateral sugere: o app web já opera majoritariamente em cima de views/RPCs contratuais e tipos compartilhados.

O problema dominante da auditoria é de governança documental e de alguns pequenos pontos de drift de UX/regra local, não de violação grave de boundary ou acesso direto indevido a tabelas-base nas superfícies auditadas.

## Próximas ações recomendadas
1. Corrigir `packages/contracts/README.md`.
2. Corrigir `docs/PROJECT_STATE.md` para refletir a cobertura real do pacote.
3. Remover ou endurecer o fallback de `buildStatusChoices` no Support Workspace.
4. Revisar se os agrupamentos operacionais de engenharia podem virar flags/read models backend-derived.
5. Decidir se contratos de internal docs/admin docs devem ou não entrar em `packages/contracts` para consolidar o catálogo único.
