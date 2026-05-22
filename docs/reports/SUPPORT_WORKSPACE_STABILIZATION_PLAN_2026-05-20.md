# Support Workspace Stabilization Plan — 2026-05-20

## Objetivo
Definir um plano operacional de estabilização do Support Workspace com base na superfície real em `apps/web`, nos contratos ativos e nas auditorias predecessoras, sem alterar produto nesta etapa.

## Fontes usadas
Este plano se apoia explicitamente nos handoffs predecessores:
- `docs/reports/CONTRACT_BOUNDARY_AUDIT_2026-05-20.md`
- `docs/reports/VALIDATION_BASELINE_MATRIX_2026-05-20.md`
- `docs/reports/SUPABASE_OPERATIONAL_MAP.md`
- handoff estrutural de `t_66a2301a` sobre topologia real e ruído do worktree

Documentos e código lidos nesta task:
- `apps/web/src/app/router.tsx`
- `apps/web/src/features/support/SupportGate.tsx`
- `apps/web/src/features/support/SupportWorkspaceShell.tsx`
- `apps/web/src/features/support/SupportWorkspacePage.tsx`
- `apps/web/src/features/support/support-api.ts`
- `docs/SUPPORT_WORKSPACE_ARCHITECTURE_SPEC.md`
- `docs/SUPPORT_WORKFLOW.md`
- `docs/PROJECT_STATE.md`
- `docs/VALIDATION_CHECKLIST.md`
- `docs/LOCAL_QA_AUTH.md`

## Resumo executivo
O Support Workspace já opera sobre contratos reais e majoritariamente backend-first, com gate próprio, shell interna, fila, ticket workspace, customers e contexto operacional do cliente. O principal problema atual não é falta de contrato; é estabilização operacional do frontend e da governança de validação/documentação em torno de uma superfície já grande e acoplada.

Os riscos dominantes observados nesta revisão são:
1. drift entre contrato e UX em transições de status quando `allowed_next_statuses` vem vazio;
2. concentração excessiva de responsabilidades em `SupportWorkspacePage.tsx` e componentes satélite muito grandes, elevando risco de regressão;
3. tratamento repetitivo de carregamento/erro/sessão expirada, sugerindo fragilidade de manutenção;
4. baseline de QA ainda dependente de fixture local e de readiness Supabase com drift documental/operacional nas portas;
5. documentação central ainda descrevendo o domínio com menor precisão do que o runtime real.

A recomendação é executar a estabilização em 5 lotes incrementais: contratos/guardrails, decomposição do frontend, resiliência de estados assíncronos, baseline de QA, e alinhamento documental/operacional.

## Superfície real auditada

### Rotas e shell
O roteador materializa o workspace sob `SupportGate` + `SupportWorkspaceShell` nas rotas:
- `/support/queue`
- `/support/tickets`
- `/support/tickets/:ticketId`
- `/support/customers`
- `/support/customers/:tenantId`

A rota `/engineering` compartilha o mesmo shell, reforçando que o ambiente interno já opera como superfície integrada de suporte/engenharia, mesmo com domínios separados.

### Boundary atual de leitura e escrita
Segundo `docs/SUPPORT_WORKFLOW.md` e `docs/PROJECT_STATE.md`, a leitura do Support Workspace já está ancorada em read models e RPCs reais, incluindo:
- `vw_support_tickets_queue`
- `vw_support_ticket_detail`
- `vw_support_ticket_timeline_recent`
- `rpc_support_get_ticket_timeline`
- `vw_support_customer_360`
- `vw_support_customer_recent_tickets`
- `vw_support_customer_recent_events`
- `vw_support_assignable_agents`
- `vw_support_knowledge_public_link_candidates`
- `vw_support_ticket_classification_options`
- `vw_support_ticket_sla_context`
- `vw_support_customer_account_context`

As mutações continuam concentradas em RPCs governadas, sem DML direto do frontend em tabela-base.

### Hotspots de implementação
A superfície está funcional, mas muito concentrada:
- `apps/web/src/features/support/SupportWorkspacePage.tsx`: 7242 linhas
- `apps/web/src/features/support/support-api.ts`: 1617 linhas
- `apps/web/src/features/support/components/SupportTicketAdvancedContextPanels.tsx`: 2504 linhas
- `apps/web/src/features/support/components/SupportTicketContextPanels.tsx`: 1236 linhas

Além disso, `SupportWorkspacePage.tsx` hoje serve múltiplas rotas (`queue`, `tickets`, `ticket`, `customers`, `customer`) e concentra fetch, estados de UI, mutações, classificação de erro, sincronização de sessão e composição visual.

## Riscos consolidados

### R1. Fallback permissivo de status quebra honestidade contratual
Severidade: alta

Evidência:
- `SupportWorkspacePage.tsx:862-875`
- `buildStatusChoices` usa `TICKET_STATUSES` quando `allowedNextStatuses` vem vazio.

Impacto:
- o backend continua autoritativo e impede transições inválidas;
- mesmo assim, a UI pode expor opções indevidas e induzir erro operacional quando o contrato vier incompleto ou indisponível.

Leitura de estabilização:
- isso deve ser tratado como bug de confiança de interface, não apenas detalhe de implementação.

### R2. Monólito de frontend aumenta regressão cruzada
Severidade: alta

Evidência:
- `SupportWorkspacePage.tsx` com 7242 linhas materializa cinco superfícies diferentes;
- `SupportTicketAdvancedContextPanels.tsx` e `SupportTicketContextPanels.tsx` também concentram muita lógica visual/operacional.

Impacto:
- mudanças pontuais em ticket podem degradar queue/customers;
- custo de review sobe;
- repetição de estado e handlers dificulta endurecimento de QA.

### R3. Estados assíncronos e sessão estão espalhados
Severidade: média-alta

Evidência:
- múltiplos blocos com `classifyAdminError(...); if (classified.kind === 'session-expired') markSessionExpired();` distribuídos pela página principal;
- a classificação de erro e a reação de sessão expirada aparecem repetidamente nas operações de queue, detail, attachments, status, assignment e outras mutações.

Impacto:
- manutenção cara;
- maior risco de alguma mutação tratar erro diferente das demais;
- difícil garantir consistência entre `error`, `contract-unavailable`, `session-expired` e sucesso parcial.

### R4. Baseline de QA ainda depende de ambiente local frágil
Severidade: média-alta

Evidência consolidada dos predecessores:
- `docs/LOCAL_QA_AUTH.md` exige reidratação via `npm run supabase:qa:local-support-fixture` antes de validar o workspace autenticado;
- `docs/reports/VALIDATION_BASELINE_MATRIX_2026-05-20.md` registrou drift no readiness (`wait-for-supabase-ready` apontando para `55321/55322` enquanto o projeto usa `54321/54322`);
- `docs/reports/SUPABASE_OPERATIONAL_MAP.md` confirma drift de portas e caráter destrutivo do `supabase:verify`.

Impacto:
- QA do suporte pode falhar por ambiente antes de falhar por produto;
- smoke regressions ficam menos confiáveis;
- aumenta o tempo de triagem quando houver bug real.

### R5. Governança documental ainda está atrás do runtime
Severidade: média

Evidência consolidada dos predecessores:
- `CONTRACT_BOUNDARY_AUDIT_2026-05-20.md` identificou subdeclaração do escopo de `packages/contracts` e do estado real em `docs/PROJECT_STATE.md`;
- a auditoria estrutural mostrou topologia documental ruidosa e shadow tree em `docs/GPT/`.

Impacto:
- decisões futuras podem partir de docs desatualizadas;
- estabilização técnica perde rastreabilidade;
- onboarding e revisão ficam mais caros.

### R6. Baseline estrutural do repositório atrapalha rastreabilidade
Severidade: média

Evidência consolidada do predecessor estrutural:
- raiz contaminada por artefatos de QA/runtime;
- forte volume de arquivos `png/json/md` fora de buckets estáveis;
- `docs/GPT/` atua como árvore paralela.

Impacto:
- diffs de estabilização ficam mais difíceis de revisar;
- risco de misturar artefato transitório com entrega real.

## Plano incremental recomendado

## Lote 1 — P0 · Hardening contratual do ticket workspace
Objetivo:
Eliminar drift entre contrato backend e UX em status/ações críticas.

Escopo recomendado:
- remover fallback amplo de `buildStatusChoices` para `TICKET_STATUSES`;
- tratar `allowedNextStatuses = []` como estado honesto de indisponibilidade contratual ou ticket sem transição disponível;
- revisar defaults derivados em `refreshDetail` para não escolher status artificial quando não houver próxima transição válida;
- revisar affordances de CTA para status/close/reopen conforme flags reais já derivadas do backend.

Arquivos-alvo prováveis:
- `apps/web/src/features/support/SupportWorkspacePage.tsx`
- eventualmente helpers em `apps/web/src/features/support/lib/*`
- docs de área afetadas (`docs/SUPPORT_WORKFLOW.md`, `docs/PROJECT_STATE.md`) se o comportamento visível mudar

Dependências:
- nenhuma estrutural; pode começar primeiro.

Critérios de aceite:
- nenhuma opção de status aparece sem `allowedNextStatuses` correspondente;
- estado vazio/indisponível é explícito e não engana o operador;
- `web:typecheck` e `web:build` passam;
- smoke de atualização de status cobre ticket com transição disponível e ticket sem transição.

## Lote 2 — P0 · Decomposição do frontend do Support Workspace
Objetivo:
Reduzir risco de regressão cruzada separando orquestração por superfície.

Escopo recomendado:
- dividir `SupportWorkspacePage.tsx` por contexto operacional: queue/tickets, ticket detail, customers, customer detail;
- extrair hooks/serviços de fetch e mutação (`useSupportQueue`, `useSupportTicketDetail`, `useSupportCustomers`, etc.) sem alterar contrato;
- isolar builders/formatters/guards em `lib/` para reduzir lógica inline na tela principal;
- reduzir o acoplamento entre drawers de contexto, engenharia, internal actions e ticket shell.

Arquivos-alvo prováveis:
- `apps/web/src/features/support/SupportWorkspacePage.tsx`
- `apps/web/src/features/support/components/*`
- `apps/web/src/features/support/lib/*`
- `apps/web/src/features/support/support-api.ts`

Dependências:
- idealmente depois do Lote 1, para não carregar o fallback indevido para a nova estrutura.

Critérios de aceite:
- a página principal deixa de concentrar todas as responsabilidades;
- queue, ticket e customer podem evoluir com diffs menores e mais previsíveis;
- smoke básico das cinco rotas continua íntegro;
- nenhuma leitura/mutação sai do boundary atual de views/RPCs.

## Lote 3 — P1 · Normalização de estados assíncronos e erros operacionais
Objetivo:
Tornar loading/error/contract-unavailable/session-expired consistentes em toda a superfície.

Escopo recomendado:
- centralizar o tratamento de erro classificado e sessão expirada;
- padronizar estados de carregamento inicial, refresh parcial e falha contratual;
- revisar componentes de estado para evitar mensagens duplicadas ou contraditórias entre shell, queue, ticket e customer;
- garantir que `contract-unavailable` não seja tratado como erro genérico quando o problema é ausência temporária do read model.

Arquivos-alvo prováveis:
- `apps/web/src/features/support/SupportWorkspacePage.tsx`
- `apps/web/src/features/support/SupportGate.tsx`
- `apps/web/src/components/states/*`
- possíveis helpers compartilhados de erro

Dependências:
- fica mais seguro após a decomposição do Lote 2.

Critérios de aceite:
- mutações e leituras críticas usam a mesma convenção de erro;
- sessão expirada derruba a superfície de forma previsível;
- estados contratuais e erros recuperáveis ficam distinguíveis para QA e operação.

## Lote 4 — P1 · Baseline de QA e validação do Support Workspace
Objetivo:
Transformar o suporte em superfície com validação repetível e menos dependente de memória operacional.

Escopo recomendado:
- consolidar sequência oficial de QA do suporte a partir de `docs/LOCAL_QA_AUTH.md` e da baseline de validação;
- criar smoke checks claros para:
  - login local com fixture oficial;
  - `/support/queue`
  - `/support/tickets/:ticketId`
  - atualização de status controlada;
  - assignment;
  - leitura de customer context;
- alinhar readiness/local setup com as portas reais do stack antes de promover qualquer verify automatizado do suporte;
- manter separado o que é validação segura do que é destrutivo (`supabase:verify`).

Arquivos-alvo prováveis:
- `docs/LOCAL_QA_AUTH.md`
- `docs/VALIDATION_CHECKLIST.md`
- `docs/reports/VALIDATION_BASELINE_MATRIX_2026-05-20.md` ou sucessor
- scripts de smoke/QA, se já houver convenção local apropriada
- `scripts/ci/wait-for-supabase-ready.mjs` e docs correlatas em lote próprio compartilhado com Supabase

Dependências:
- depende parcialmente do backlog Supabase P2 de alinhamento de portas/readiness.

Critérios de aceite:
- existe roteiro de QA repetível para o workspace;
- readiness local não falha por portas históricas erradas;
- os comandos seguros do suporte ficam separados dos destrutivos.

## Lote 5 — P1 · Alinhamento documental e governança operacional
Objetivo:
Fazer a documentação voltar a representar o runtime real do Support Workspace.

Escopo recomendado:
- atualizar `docs/PROJECT_STATE.md` e docs de área para refletir o escopo real dos contratos compartilhados e do workspace atual;
- registrar explicitamente a estratégia de estabilização e seus gates de aceite;
- decidir o destino de docs paralelas/sombra que afetam leitura do suporte (`docs/GPT/`, snapshots e artefatos fora de bucket canônico);
- separar docs correntes de histórico quando o checkpoint central estiver grande demais.

Arquivos-alvo prováveis:
- `docs/PROJECT_STATE.md`
- `docs/DOCUMENTATION_LEDGER.md`
- `docs/README.md`
- `docs/SUPPORT_WORKFLOW.md`
- `docs/SUPPORT_WORKSPACE_ARCHITECTURE_SPEC.md`
- runbooks de QA e operação relacionados

Dependências:
- deve acompanhar os lotes anteriores para registrar o estado real já endurecido.

Critérios de aceite:
- docs correntes descrevem a superfície real;
- backlog de estabilização e limites de validação ficam explícitos;
- não sobra conflito importante entre docs de contrato, estado e operação.

## Dependências cruzadas
- Lote 1 destrava o endurecimento funcional do ticket workspace.
- Lote 2 reduz risco de implementar Lotes 3 e 4 em terreno acoplado demais.
- Lote 4 depende do alinhamento de readiness/portas já apontado em `SUPABASE_OPERATIONAL_MAP.md` e `VALIDATION_BASELINE_MATRIX_2026-05-20.md`.
- Lote 5 deve acompanhar cada entrega relevante, mas fecha melhor depois de Lotes 1-4.

## Ordem executiva recomendada
1. P0 · Hardening contratual do ticket workspace
2. P0 · Decomposição do frontend do Support Workspace
3. P1 · Normalização de estados assíncronos e erros operacionais
4. P1 · Baseline de QA e validação do Support Workspace
5. P1 · Alinhamento documental e governança operacional
6. P2 compartilhado com frente Supabase · alinhar readiness/portas e separar verify destrutivo de smoke verify
7. P2 compartilhado com frente de documentação/estrutura · reduzir ruído do worktree e formalizar destino de `docs/GPT/`

## Gates de aceite da estabilização
A estabilização só deve ser considerada concluída quando:
- o Support Workspace não expuser ações críticas fora do contrato backend atual;
- queue, ticket e customer tiverem responsabilidades mais separadas e revisão previsível;
- os estados de loading/error/session/contract estiverem padronizados;
- existir smoke seguro e repetível para o workspace autenticado;
- a documentação corrente representar o runtime real e os limites operacionais do lote.

## Fora de escopo nesta etapa
- mudar produto, fluxo ou contrato de negócio sem evidência nova;
- criar novos domínios, novas RPCs ou novas views apenas para “embelezar” a UI;
- rodar validações destrutivas do Supabase como parte da baseline do suporte;
- mexer em produção, credenciais ou dados reais.

## Próxima ação recomendada
Abrir a execução pelo Lote 1 com escopo estrito em transições de status e guardrails de UX honesta, porque é o risco de confiança mais direto e com menor raio de mudança.