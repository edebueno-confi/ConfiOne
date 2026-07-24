# Support Workspace Handoff 2026-05-22

## Objetivo da frente

Estabilizar e desmonolitizar o Support Workspace da rota `/support/tickets/:ticketId`, mantendo:
- backend como source of truth;
- leitura por views/read models;
- escrita por RPCs;
- zero mudança funcional de produto;
- zero redesign estrutural fora do blueprint já aprovado.

O foco desta frente foi:
- recuperar `web:typecheck` e `web:build`;
- corrigir corte inferior e scroll do slot contextual;
- restaurar QA local autenticado com `support_manager`;
- reduzir o tamanho e a responsabilidade de `SupportWorkspacePage.tsx`;
- consolidar tokens, primitives e governança visual mínima do cockpit.

## Estado atual consolidado

### Runtime/QA

- `support_manager` local autenticado voltou a acessar `/support/queue` e `/support/tickets/:ticketId`.
- A validação deve sempre usar um ticket atual da fila depois de reidratar a fixture local.
- O falso `Ticket não encontrado` era causado por `ticketId` stale após reidratação da fixture, não por falha real de authz.

### Build/validação

- `npm run contracts:typecheck` verde
- `npm run web:typecheck` verde
- `npm run web:build` verde
- `npm run supabase:test:db` verde no fechamento do bloco de QA local
- `npm run supabase:lint:db` verde no fechamento do bloco de QA local

### Estado visual/estrutural do workspace

- fila, thread, composer e rail carregam corretamente;
- `Classificar`, `Acionamentos` e `Handoff` abrem no slot contextual correto;
- sem scroll global vertical;
- sem scroll horizontal;
- sem corte inferior do rail/context slot;
- `SupportWorkspacePage.tsx` caiu de mais de 10k linhas para cerca de 7.2k linhas.

## Drift visual atual

O workspace está funcional e validado, mas a auditoria visual final detectou drift em relação ao cockpit mais enxuto buscado anteriormente:

- o header geral `Tickets e conversas` está alto demais;
- a conversa perdeu parte do protagonismo;
- o rail direito está visualmente pesado;
- a toolbar compacta intermediária não está clara como elemento persistente;
- o composer está alto e consome mais espaço vertical do que o ideal;
- a linguagem de `Handoff` ainda tem resíduos semânticos que merecem revisão futura.

Isso não bloqueia operação nem build, mas deve virar lote próprio antes de novas expansões visuais no workspace.

## Arquitetura preservada

Itens que devem continuar sendo tratados como base correta:

- slot contextual substitui o rail no mesmo espaço;
- não criar terceira coluna fixa;
- não sobrepor painel flutuante improvisado;
- fila, thread e slot contextual com scroll interno previsível;
- backend, views e RPCs permanecem como fonte de verdade;
- componentes do workspace não acessam Supabase diretamente.

## Backlog recomendado

### P0 - Reconvergência visual do cockpit

- reduzir o header geral do workspace;
- devolver dominância visual para a conversa;
- aliviar o peso do rail direito;
- reestabelecer claramente a toolbar compacta intermediária, se a direção aprovada continuar válida;
- revisar altura do composer sem reintroduzir corte inferior.

### P1 - Support Workspace Orchestration Extraction V3

- extrair `SupportCustomerRail`;
- avaliar extração de `SupportQueueItem` e `SupportTicketInboxItem`;
- mover helpers puros restantes para `features/support/lib/`;
- manter `SupportWorkspacePage.tsx` cada vez mais próximo de orquestrador.

### P1 - Hardening de backlog técnico

- revisar imports mortos remanescentes do workspace;
- reduzir acoplamento entre helpers derivados e a page principal;
- manter a disciplina de validação com QA autenticado real, não só `platform_admin`.

## O que não deve ser perdido

- `docs/LOCAL_QA_AUTH.md`
- `docs/design/FRONTEND_VISUAL_GOVERNANCE.md`
- `apps/web/src/features/support/components/*`
- `apps/web/src/features/support/lib/*`
- `apps/web/src/features/login/LoginPage.tsx` com redirect correto para `/support`
- a regra operacional: depois de reidratar fixture, usar ticket atual da fila, nunca UUID antigo presumido

## Observação de retomada

Se a retomada ocorrer em outro chat, o primeiro passo recomendado é:

1. subir Supabase local;
2. reidratar `npm run supabase:qa:local-support-fixture`;
3. subir a web;
4. abrir `/support/queue`;
5. capturar ticket atual da fila;
6. só então validar `/support/tickets/:ticketId`.
