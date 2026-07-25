# P4 Support True Visual Refactor - 2026-05-25

## Branch

- Branch usada: `codex/p4-true-support-visual-refactor`
- Escopo: frontend/UI de suporte apenas.
- Backend, migrations, Supabase, RLS, views, RPCs e contratos de negocio: nao alterados.

## Decisao de auditoria

O resultado P4-F.3 foi reprovado como referencia visual. Ele ainda preservava mecanismos visuais antigos que competiam com as blueprints aprovadas:

- fila com composicao herdada de filtros laterais e painel contextual obrigatorio;
- tabela sem dominio visual suficiente quando havia painel;
- drawer/rail como muleta de layout;
- controles fake no composer da tratativa;
- duplicidade de informacao no right rail do ticket.

As telas foram reorientadas pelas blueprints anexadas:

- `docs/design/blueprint/suporte/fila operacional - sem seleção.png`
- `docs/design/blueprint/suporte/fila opercaional - 1 item selecionado.png`
- `docs/design/blueprint/suporte/fila opercaional -todos selecionados.png`
- `docs/design/blueprint/suporte/conversa - tratativa.png`
- `docs/design/blueprint/suporte/novo ticket.png`

## Impeccable

Aplicado como metodo de auditoria e decisao:

- `/impeccable layout`: a tarefa principal da tela passou a determinar a composicao.
- `/impeccable critique`: P4-F.3 foi recusado por manter padroes herdados.
- `/impeccable harden`: acoes sem contrato real ficaram desabilitadas ou removidas.
- `/impeccable polish`: densidade, hierarquia e espaco da tabela foram ajustados.
- `/impeccable typeset`: fontes e pesos foram normalizados para legibilidade operacional.
- `/impeccable distill`: filtros laterais e duplicidades foram reduzidos.

## Componentes substituidos, removidos ou rebaixados

| Item | Decisao | Motivo |
| --- | --- | --- |
| `OperationalFilterStack` em `/support/queue` | Rebaixado | Filtro lateral fixo roubava largura da fila. |
| `OperationalContextPanel` em `/support/queue` | Substituido | Contexto agora aparece apenas quando ha selecao unica. |
| `OperationalQueueSummary` | Substituido | Metricas precisam seguir a hierarquia da blueprint. |
| `QueueTicketItem` variant `workspace` | Substituido na fila | Linha precisava virar tabela operacional dominante. |
| Right rail obrigatorio | Removido do estado sem selecao | Blueprint sem selecao nao possui rail. |
| Composer fake toolbar `B/I/U/...` | Removido | Era botao desabilitado sem funcao real. |
| Card duplicado `Cliente / Conta` no rail | Removido | Repetia resumo e comprimia o rail da tratativa. |

## Refatoracao de `/support/queue`

Implementado:

- header compacto com acoes reais `Abrir ticket` e `Recarregar`;
- metricas superiores na ordem operacional da blueprint;
- tabs de recorte no topo;
- busca e filtros compactos no topo, com filtros expandidos somente sob demanda;
- tabela/lista como superficie dominante;
- estado sem selecao sem rail direito;
- estado com uma selecao com painel contextual util e tabela ainda legivel;
- estado com multiplas selecoes com painel de acoes em massa;
- acoes em massa aparecem desabilitadas e explicam dependencia de permissoes/status retornados pelo backend;
- linguagem ajustada para `Dependencias internas` quando o fluxo representa multiplas areas.

## Refatoracao de `/support/tickets/:ticketId`

Implementado:

- topbar mais proxima da blueprint de conversa;
- inbox lateral com linguagem `Caixa de entrada`;
- conversa/timeline e composer seguem como protagonistas;
- quick actions preservadas apenas para acoes reais: classificar, status, evidencias, conhecimento, acionamentos e relacionados;
- nenhum botao rapido `Responder`;
- nota interna permanece no composer;
- toolbar fake do composer removida;
- right rail reduzido para resumo, acoes, SLA e artigos relacionados, sem card duplicado de cliente.

## Screenshots gerados

- `docs/reports/visual-audit/screenshots/p4-true-support-queue-no-selection.png`
- `docs/reports/visual-audit/screenshots/p4-true-support-queue-selected.png`
- `docs/reports/visual-audit/screenshots/p4-true-support-queue-bulk-selected.png`
- `docs/reports/visual-audit/screenshots/p4-true-support-queue-intake-modal.png`
- `docs/reports/visual-audit/screenshots/p4-true-support-ticket-detail.png`

## Browser QA autenticado

- Usuario: `support_manager`
- Credencial usada: `qa.local.support-manager-a@genius.local / LOCAL_QA_SUPPORT_MANAGER_PASSWORD`
- Viewport: `1672x941`
- Rotas validadas:
  - `/support/queue`
  - `/support/tickets/1acb9db0-c8a5-4684-a026-45531241390e`

Resultados observados:

- Sem scroll horizontal global.
- Sem scroll vertical global indevido em desktop operacional.
- Fila sem selecao ocupa a largura disponivel.
- Fila com selecao unica exibe contexto sem espremer a tabela de forma ruim.
- Fila com multiplas selecoes exibe acoes em massa desabilitadas por contrato.
- Intake abre em modal amplo.
- Ticket detail nao exibe botao rapido de responder nem nota interna duplicada fora do composer.
- Composer nao exibe toolbar fake.

Observacao: no primeiro acesso ao login houve erro local de refresh token invalido de sessao anterior do navegador. O login real com `support_manager` passou e as rotas autenticadas renderizaram corretamente.

## Validacoes executadas

- `npm run contracts:typecheck` - passou.
- `npm run web:typecheck` - passou.
- `npm run web:build` - passou.
- `git diff --check` - passou.
- Browser QA autenticado com `support_manager` - passou para os estados exigidos.

## Riscos restantes

- A navegacao lateral global ainda nao foi redesenhada nesta fase; ela foi preservada para nao ampliar escopo.
- O right rail da tratativa ainda usa primitives historicas, embora tenha sido reduzido e desduplicado.
- Acoes em massa ainda nao possuem contrato operacional real; foram mantidas desabilitadas conforme regra de nao criar botao fake.
- A refatoracao visual completa de clientes, admin, portal, internal actions e engineering ainda precisa seguir lotes dedicados.

## Proxima ordem recomendada

1. `/support/tickets/:ticketId`: refatorar completamente inbox lateral, conversa e right rail para substituir as primitives antigas restantes.
2. `/support/customers` e `/support/customers/:tenantId`: remover cardizacao e transformar em leitura operacional de cliente B2B.
3. `/admin/knowledge`: densidade editorial/operacional e actions reais.
4. `/admin/system` e `/admin/customer-portal`: governanca compacta sem dashboard generico.
5. `/portal`, `/portal/tickets`, `/portal/tickets/:ticketId`, `/portal/help`: customer-facing limpo e sem termos internos.
6. `/internal-actions` e `/engineering`: filas operacionais por dominio.
7. `/help/genius`: public help published/public com copy segura.
