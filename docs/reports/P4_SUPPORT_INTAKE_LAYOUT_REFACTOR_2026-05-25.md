# P4-F.2 Support Intake Layout Refactor

Data: 2026-05-25
Branch: `codex/p4-f2-support-intake-layout-refactor`

## Objetivo

Iniciar a refatoração visual operacional ampla do MVP a partir do caso mais crítico: o intake de novo ticket em `/support/queue`.

O intake deixou de ser tratado como caso isolado. Ele é a primeira implementação prática de uma base visual mais flexível para substituir padrões herdados que impedem fidelidade aos blueprints:

- layout de 3 colunas aplicado automaticamente;
- drawer lateral estreito para ações principais;
- cards inflados;
- inputs, selects e botões altos demais;
- right rail comprimido;
- radius e padding excessivos;
- primitives genéricas usadas como argumento contra o objetivo operacional da tela.

## Impeccable usado

Comandos aplicados como lente de decisão:

- `/impeccable layout`: questionar topologia, grid, modal versus drawer e hierarquia da tarefa.
- `/impeccable critique`: avaliar se a ação principal estava sendo empurrada para uma superfície secundária.
- `/impeccable harden`: foco, Esc, fechamento, estados de loading/erro/vazio e overflow.
- `/impeccable polish`: consistência visual com Support Workspace e Design System V3.
- `/impeccable typeset`: reduzir escala de header, labels e controles para cockpit operacional.

## Decisão de UX

O drawer estreito não é adequado para abrir ticket.

A ação `Abrir ticket` é central para a operação da fila. Ela exige escolher cliente, contato, origem, prioridade, severidade, categoria, motivo, título e descrição. Colocar esse fluxo no rail direito comprime a tarefa e força scroll interno ruim.

Solução implementada:

- modal operacional central;
- largura máxima de `1060px`, dentro do intervalo aprovado de 920px a 1080px;
- duas colunas internas: formulário principal e bloco lateral de regras;
- header compacto;
- body com scroll próprio apenas quando necessário;
- footer fixo com ações;
- fechamento por Esc e clique no scrim;
- foco inicial no primeiro campo elegível;
- sem drawer lateral;
- sem página nova;
- sem backend, migration, Supabase ou contrato novo.

## Primitives criadas

As primitives foram criadas localmente no domínio Support, sem alterar os defaults globais de `ui.tsx`:

- `OperationalModal`
- `OperationalFormGrid`
- `OperationalField`
- `OperationalFooterActions`

Elas representam uma direção reutilizável para os próximos domínios:

| Primitive | Substitui padrão antigo | Uso futuro recomendado |
|---|---|---|
| `OperationalModal` | Drawer estreito para ação principal | Formulários centrais de criação, configuração operacional e handoff complexo |
| `OperationalFormGrid` | Form em coluna única dentro de rail | Formulários com hierarquia clara e duas colunas internas |
| `OperationalField` | `Field` genérico inflado | Labels compactos, descrição curta e controles densos |
| `OperationalFooterActions` | Ações misturadas no fim do scroll | Footer fixo, confirmação clara e nota operacional |

## Regras para evolução visual

1. O objetivo operacional da tela manda no layout.
2. Blueprint aprovado vence implementação antiga.
3. Três colunas só devem existir quando as três zonas forem parte da tarefa principal.
4. Drawer é contexto auxiliar, não superfície padrão para ação central.
5. Right rail não deve hospedar formulário principal.
6. Cards devem ser usados para itens ou blocos realmente isolados, não como layout universal.
7. Controles operacionais devem ter densidade compatível com cockpit B2B.
8. Primitives globais só devem ser alteradas depois de migração incremental por domínio.

## Ordem recomendada dos próximos lotes visuais

1. `/support/queue`: consolidar a fila como superfície central, reduzir cardização lateral e formalizar toolbar/filtros compactos.
2. `/support/tickets/:ticketId`: aumentar protagonismo da conversa, compactar composer/header e tornar rail contextual por modo.
3. `/support/customers` e `/support/customers/:tenantId`: transformar Customer 360 em leitura operacional, sem CRM genérico e sem excesso de cards.
4. `/admin/knowledge`: reduzir cards, estabilizar tabela/lista editorial e remover wrappers que fragilizam scroll.
5. `/admin/system`: preservar readiness real, mas trocar aparência de dashboard por observabilidade operacional compacta.
6. `/admin/customer-portal`: separar configuração real, readiness e boundaries sem tela administrativa gigante.
7. `/internal-actions`: aplicar densidade de fila operacional e distinguir retorno ao suporte de detalhe auxiliar.
8. `/engineering`: reduzir aparência de board genérico e priorizar work item, update e retorno.
9. `/portal`, `/portal/tickets`, `/portal/tickets/:ticketId`, `/portal/help`: manter linguagem customer-facing simples, sem expor primitives internas.
10. `/help/genius`: revisar somente após superfícies autenticadas, preservando página pública com scroll natural e conteúdo published/public.

## Boundaries preservados

- Nenhum backend novo.
- Nenhuma migration.
- Nenhuma alteração Supabase.
- Nenhum contrato novo.
- Nenhuma regra de negócio movida para frontend.
- Intake continua usando views/RPCs existentes.
- Canais externos continuam sem envio real.
- Portal e Public Help não foram alterados.

## Validação visual esperada

Rotas:

- `/support/queue` sem intake.
- `/support/queue` com modal de intake aberto.

Screenshots gerados:

- `docs/reports/visual-audit/screenshots/p4-f2-support-queue.png`
- `docs/reports/visual-audit/screenshots/p4-f2-support-queue-intake-modal.png`

Métricas registradas:

- `/support/queue`: `1600x900`, `scrollHeight=900`, `clientHeight=900`, sem scroll global e sem scroll horizontal.
- `/support/queue` com intake: `1600x900`, `scrollHeight=900`, `clientHeight=900`, sem scroll global e sem scroll horizontal.
- Modal: painel com `1060x820`, `aria-modal=true`, `aria-labelledby=support-ticket-intake-title`.
- Foco inicial: primeiro select elegível de cliente.
- Scroll interno: body do modal usa scroll vertical controlado quando a viewport exige; não há overflow horizontal.

Arquivos de métricas:

- `docs/reports/visual-audit/route-metrics/p4-f2-support-queue-metrics.json`
- `docs/reports/visual-audit/route-metrics/p4-f2-support-queue-intake-modal-metrics.json`

Observação de fixture:

- A fixture funcional local foi tentada para garantir dataset populado, mas excedeu o timeout de 3 minutos nesta execução. O QA visual autenticado usou o dataset local já existente e validou com `support_manager`.

## Riscos restantes

- As primitives ainda estão no domínio Support. Antes de virar contrato global, precisam ser usadas em mais uma ou duas telas operacionais.
- O rail de preview da fila continua usando cards e será alvo natural do próximo lote.
- O caminho recomendado é promover essas primitives para um módulo visual operacional compartilhado somente depois de validar a mesma topologia em Support Ticket Workspace e Admin Knowledge.
