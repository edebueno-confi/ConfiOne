# P4-F.3 Support Queue Full Operational Refactor

## Resumo

- Branch: `codex/p4-f3-support-queue-operational-refactor`
- Data: `2026-05-25`
- Objetivo: refatorar visualmente `/support/queue` como cockpit real de triagem diaria, sem backend novo, sem migration, sem contrato novo e sem regra de negocio nova.
- Escopo executado: frontend/UI apenas, consumindo read models e RPCs existentes.

## Impeccable

Comandos aplicados como criterio de decisao visual:

- `/impeccable layout`
- `/impeccable critique`
- `/impeccable harden`
- `/impeccable polish`
- `/impeccable typeset`
- `/impeccable distill`

Decisao principal: o objetivo operacional da tela passou a mandar no layout. A fila deixou de se comportar como dashboard cardizado e passou a privilegiar uma superficie central dominante para triagem.

## Decisoes de layout

- Header ficou compacto, com descricao operacional curta e acoes reais.
- Metricas superiores foram reduzidas para uma faixa de sumario operacional, sem cards inflados.
- Filtros e recortes rapidos foram consolidados na lateral esquerda, sem duplicar a tabela.
- Lista/tabela passou a ser a superficie dominante da tela.
- Painel direito ficou mais compacto e focado em contexto do ticket selecionado.
- `/support/queue` nao seleciona mais automaticamente o primeiro ticket no carregamento inicial. O operador escolhe o foco explicitamente.
- A rota de detalhe continua preservando selecao automatica quando necessario.
- Linguagem `Aguardando engenharia` foi suavizada para `Dependencia interna`, cobrindo areas internas, N1, N2, CS, Financeiro, Produto e Desenvolvimento.
- Botao fake/desabilitado de "mais acoes" foi removido do contexto da fila e da previa do ticket.

## Primitives criadas ou alteradas

- `OperationalQueueSummary`: sumario horizontal compacto para indicadores que realmente ajudam triagem.
- `OperationalFilterStack`: bloco local para filtros/recortes com header curto e scroll interno controlado.
- `OperationalContextPanel`: rail direito operacional, com corpo rolavel e sem overflow horizontal.
- `QueueTicketItem`: passou a usar classes operacionais dedicadas para densidade, selecao e hover.

Primitives do P4-F.2 reaproveitadas:

- `OperationalModal`
- `OperationalFormGrid`
- `OperationalField`
- `OperationalFooterActions`

## Arquivos alterados

- `apps/web/src/features/support/SupportWorkspacePage.tsx`
- `apps/web/src/features/support/components/SupportWorkspaceAuxiliaryPanels.tsx`
- `apps/web/src/features/support/components/SupportWorkspacePrimitives.tsx`
- `apps/web/src/features/support/lib/SupportWorkspacePresentation.ts`
- `apps/web/src/index.css`
- `docs/DOCUMENTATION_LEDGER.md`
- `docs/reports/P4_SUPPORT_QUEUE_OPERATIONAL_REFACTOR_2026-05-25.md`
- `docs/reports/visual-audit/screenshots/p4-f3-support-queue-no-selection.png`
- `docs/reports/visual-audit/screenshots/p4-f3-support-queue-selected.png`
- `docs/reports/visual-audit/screenshots/p4-f3-support-queue-intake-modal.png`
- `docs/reports/visual-audit/screenshots/p4-f3-support-queue-filters-active.png`
- `docs/reports/visual-audit/route-metrics/p4-f3-support-queue-no-selection-metrics.json`
- `docs/reports/visual-audit/route-metrics/p4-f3-support-queue-selected-metrics.json`
- `docs/reports/visual-audit/route-metrics/p4-f3-support-queue-intake-modal-metrics.json`
- `docs/reports/visual-audit/route-metrics/p4-f3-support-queue-filters-active-metrics.json`

## Screenshots e metricas

Viewport usado: `1440x900`.

| Estado | Screenshot | Scroll global | Scroll horizontal | Observacao |
| --- | --- | --- | --- | --- |
| Sem selecao | `docs/reports/visual-audit/screenshots/p4-f3-support-queue-no-selection.png` | nao | nao | contexto direito mostra empty state de foco |
| Ticket selecionado | `docs/reports/visual-audit/screenshots/p4-f3-support-queue-selected.png` | nao | nao | rail direito mostra previa operacional |
| Intake modal aberto | `docs/reports/visual-audit/screenshots/p4-f3-support-queue-intake-modal.png` | nao | nao | modal amplo preservado do P4-F.2 |
| Filtros ativos | `docs/reports/visual-audit/screenshots/p4-f3-support-queue-filters-active.png` | nao | nao | recorte `Dependencias internas` ativo |

Metricas salvas em:

- `docs/reports/visual-audit/route-metrics/p4-f3-support-queue-no-selection-metrics.json`
- `docs/reports/visual-audit/route-metrics/p4-f3-support-queue-selected-metrics.json`
- `docs/reports/visual-audit/route-metrics/p4-f3-support-queue-intake-modal-metrics.json`
- `docs/reports/visual-audit/route-metrics/p4-f3-support-queue-filters-active-metrics.json`

Principais resultados:

- `window.innerWidth`: `1440`
- `window.innerHeight`: `900`
- `scrollHeight`: `900`
- `clientHeight`: `900`
- scroll global: `false`
- scroll horizontal global: `false`
- tabela central no estado sem selecao: `610px` de largura util
- scroll interno esperado: filtros e corpo da tabela; rail apenas quando ha ticket selecionado

## QA com support_manager

Usuario usado:

- `qa.local.support-manager-a@genius.local`
- senha registrada em `docs/LOCAL_QA_AUTH.md`

Rota validada:

- `/support/queue`

Estados validados:

- fila sem selecao automatica;
- ticket selecionado por clique real;
- intake modal aberto por `Abrir ticket`;
- filtros ativos por `Dependencias internas`;
- sem erro cru visivel;
- sem scroll horizontal global;
- sem scroll global indevido;
- sem botao fake de responder fora da conversa;
- sem provider externo, IA, backend ou regra nova.

## Validacoes tecnicas

- `npm run contracts:typecheck`: passou
- `npm run web:typecheck`: passou
- `npm run web:build`: passou
- `git diff --check`: passou, apenas warnings de conversao LF/CRLF do Windows

## Boundaries

- Sem backend novo.
- Sem migration.
- Sem Supabase.
- Sem contrato novo.
- Sem fixture.
- Sem mock.
- Sem provider externo.
- Sem IA real.
- Sem mudanca de regra operacional.

## Riscos restantes

- A tabela ainda herda densidade e conteudo de colunas do contrato atual; proximos lotes podem revisar apenas apresentacao, nao campos de negocio.
- As primitives seguem locais ao dominio Support. A promocao para primitives compartilhadas deve ocorrer somente apos validacao em ticket workspace, customer 360 e Admin.
- O worktree possui PNGs de blueprint pendentes fora deste lote; eles nao foram alterados nem stageados por esta refatoracao.

## Proxima ordem recomendada

1. `/support/tickets/:ticketId`: conversa como protagonista, eventos tecnicos menos competitivos e rail por objetivo.
2. `/support/customers` e `/support/customers/:tenantId`: customer 360 operacional sem cardizacao excessiva.
3. `/admin/knowledge`: gestao editorial com tabela/lista dominante.
4. `/admin/system` e `/admin/customer-portal`: governanca compacta, sem dashboard inflado.
5. `/portal`, `/portal/tickets` e `/portal/tickets/:ticketId`: experiencia customer-facing limpa, sem termos internos.
6. `/internal-actions` e `/engineering`: filas operacionais por area, com foco em retorno ao suporte.
7. `/help/genius`: public help published/public, sem promessa de IA ativa.
