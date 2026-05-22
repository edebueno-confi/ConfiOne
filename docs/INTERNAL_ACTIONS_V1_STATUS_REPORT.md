# Internal Actions V1 - Status Report

Data: 2026-05-22

## 1. Veredito atual

O domínio V1 de Acionamentos Internos existe como fluxo operacional mínimo ponta a ponta: suporte aciona, a área interna opera em workspace próprio e o suporte recebe a devolução estruturada.

Status operacional:
- Backend foundation: implementado.
- Contrato seguro de áreas acionáveis: implementado.
- Contracts TS: implementados.
- Drawer `Acionamentos` em `/support/tickets/:ticketId`: integrado ao domínio real para criação, lista, detalhe, timeline interna e ações de suporte.
- Workspace da área acionada: implementado em `/internal-actions`.
- Detalhe operacional da área acionada: implementado em `/internal-actions/:actionId`.
- Admin de memberships por área: implementado em `/admin/internal-areas`.
- Bridge com `engineering_work_items`: ainda não implementada por decisão de escopo.
- Alteração automática de `ticket.status`: não existe no V1 e não deve ser adicionada sem decisão de produto.

Conclusão: a V1 está pronta como fluxo operacional mínimo entre suporte e área interna. Ela ainda não substitui Engenharia nem cria bridge automática com `engineering_work_items`.

## 2. O que foi feito

### Backend
- Criado domínio neutro `internal_actions`, ticket-cêntrico e separado de `engineering_work_items`.
- Criado catálogo governado `internal_action_target_areas` com áreas iniciais:
  - `engineering`
  - `finance`
  - `customer_success`
  - `product`
  - `operations`
  - `other_internal`
- Criada membership dedicada por área em `internal_area_memberships`, sem novos roles globais por área.
- Criadas tabelas operacionais:
  - `internal_actions`
  - `internal_action_updates`
  - `internal_action_evidence_links`
- Criado ledger append-only para comentários, mudança de status, atribuição, evidência, retorno, aceite, complemento, fechamento e cancelamento.
- Evidências V1 referenciam apenas `ticket_attachments`; não há storage próprio nem duplicação de arquivo.
- Mutação relevante gera `ticket_event` interno e `audit.audit_logs`.
- Cliente/portal não acessa acionamentos internos.
- DML direto nas tabelas novas permanece bloqueado para o app; escrita deve passar por RPC.

### Contratos de leitura e escrita
- Views/read models:
  - `vw_support_ticket_internal_actions`
  - `vw_support_internal_action_detail`
  - `vw_support_internal_action_timeline`
  - `vw_internal_action_queue_by_area`
  - `vw_internal_action_detail_by_area`
  - `vw_internal_action_timeline_by_area`
  - `vw_support_internal_action_target_areas`
  - `vw_admin_internal_action_target_areas`
  - `vw_admin_internal_area_memberships`
- RPCs:
  - `rpc_support_list_internal_action_target_areas`
  - `rpc_support_create_internal_action`
  - `rpc_internal_action_assign`
  - `rpc_internal_action_assign_to_self`
  - `rpc_internal_action_add_comment`
  - `rpc_internal_action_update_status`
  - `rpc_internal_action_add_evidence_link`
  - `rpc_internal_action_return_to_support`
  - `rpc_support_accept_internal_action_return`
  - `rpc_support_request_internal_action_followup`
  - `rpc_support_close_internal_action`
  - `rpc_admin_add_internal_area_membership`
  - `rpc_admin_update_internal_area_membership`
  - `rpc_admin_archive_internal_area_membership`

### Frontend
- O drawer `Acionamentos` no Ticket Workspace consome contratos reais.
- O suporte consegue:
  - carregar catálogo de áreas acionáveis por RPC segura;
  - criar acionamento interno real;
  - listar acionamentos do ticket;
  - abrir detalhe;
  - visualizar timeline interna;
  - aceitar retorno quando houver retorno pendente;
  - pedir complemento;
  - fechar acionamento;
  - vincular evidência existente quando aplicável pelo contrato.
- Não há mock, catálogo hardcoded de áreas, leitura direta de tabela base ou alteração de `ticket.status`.
- O fluxo especializado de `Handoff técnico` continua separado e baseado em `engineering_work_items`.
- A rota `/internal-actions` mostra a fila da área do usuário por membership ativo, com filtros por status, área e prioridade.
- A rota `/internal-actions/:actionId` mostra contexto, ticket de origem, tenant resumido, responsável, timeline sanitizada, evidências vinculadas por contagem e ações reais da área.
- A área acionada pode assumir o acionamento para si, registrar update, atualizar andamento permitido e devolver ao suporte por RPC.
- A rota `/admin/internal-areas` permite ao `platform_admin` listar áreas, revisar memberships, adicionar, atualizar role/status e arquivar vínculos por RPC.

## 3. O que precisa de atenção

- `engineering` aparece no catálogo de áreas internas, mas isso não cria work item técnico automaticamente. A bridge com `engineering_work_items` é decisão futura.
- O identificador interno do drawer no frontend ainda pode aparecer como `automation` em código legado, apesar da UI/copy ser `Acionamentos`. Isso é dívida de nomenclatura, não bug funcional conhecido.
- `npm run supabase:verify` já foi afetado por instabilidade local de Auth/Kong no Windows. O domínio foi validado por testes de DB, lint de DB, contracts e build, mas essa limitação de infra local deve continuar documentada quando reaparecer.

## 4. O que precisa de correção

Correções documentais feitas nesta consolidação:
- Removida a leitura obsoleta de que Internal Actions era apenas backend sem UI.
- Registrado que o contrato de catálogo de áreas acionáveis já existe.
- Registrado que o drawer `Acionamentos` já usa contratos reais no Support Workspace.
- Registrados limites explícitos para evitar conflito com Engenharia e evitar expectativa de fluxo completo.

Correções técnicas recomendadas para lote futuro:
- Renomear, em refactor pequeno e isolado, chaves internas legadas do drawer que ainda usem `automation` para `internalActions`, se isso não gerar churn alto.
- Criar QA browser autenticado dedicado para `/internal-actions` e `/admin/internal-areas`, cobrindo estado vazio, detalhe, atualização, devolução e arquivamento de membership.

## 5. O que ainda precisa ser feito

Próxima fase recomendada:
Próxima fase recomendada:
- Ampliar QA autenticado e observabilidade operacional do fluxo.
- Definir se evidências vinculadas devem ter picker seguro na superfície da área acionada; hoje a área vê contagem e o suporte mantém o vínculo operacional existente.
- Definir estratégia formal para Engenharia:
  - manter separado;
  - criar bridge opcional;
  - ou adaptar fluxo técnico como consumidor de Internal Actions em fase posterior.
- Validar visualmente os estados completos do drawer com massa estável:
  - vazio;
  - lista;
  - criação;
  - detalhe;
  - timeline;
  - retorno pendente;
  - complemento solicitado;
  - fechado.

## 6. Boundaries para evitar conflito

- Não alterar `ticket.status` ao criar ou operar acionamento interno no V1.
- Não permitir cliente ver acionamento interno.
- Não fazer área interna responder cliente diretamente.
- Não substituir `engineering_work_items` nesta fase.
- Não transformar Internal Actions em Jira/Trello genérico.
- Não hardcodar áreas no frontend.
- Não ler tabela base no frontend.
- Não criar storage próprio para evidências de Internal Actions no V1.

## 7. Arquivos principais do domínio

- `supabase/migrations/20260516120420_internal_actions_foundation_v1.sql`
- `supabase/migrations/20260516155122_support_internal_action_target_areas_contract_v1.sql`
- `supabase/tests/037_internal_actions_foundation.sql`
- `packages/contracts/src/ticketing.ts`
- `apps/web/src/features/support/support-api.ts`
- `apps/web/src/features/support/SupportWorkspacePage.tsx`
- `apps/web/src/features/internal-actions/InternalActionsWorkspacePage.tsx`
- `apps/web/src/features/internal-actions/internal-actions-api.ts`
- `apps/web/src/features/admin/InternalAreasAdminPage.tsx`
- `supabase/migrations/20260522190000_internal_actions_operational_closure_v1.sql`
- `supabase/tests/040_internal_actions_operational_closure.sql`

## 8. Validações conhecidas

Validações executadas em rodadas anteriores do lote:
- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`
- `npm run supabase:test:db`
- `npm run supabase:lint:db`

Observação:
- `npm run supabase:verify` pode falhar localmente por `502` em Auth/Kong no Windows. Quando isso acontecer, a falha deve ser isolada antes de ser tratada como regressão do domínio.
