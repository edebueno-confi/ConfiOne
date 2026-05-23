# Support Workspace Visual Blueprint Alignment - 2026-05-23

## Objetivo

Alinhar a experiência visual do Support Workspace aos contratos documentais atualizados e aos blueprints operacionais aprovados, reduzindo a prioridade de primitives genéricas e da implementação legada nas telas de suporte.

## Arquivos alterados no lote visual

- `apps/web/src/features/support/SupportWorkspacePage.tsx`
- `apps/web/src/features/support/components/SupportWorkspacePrimitives.tsx`
- `apps/web/src/features/support/components/SupportTicketQueue.tsx`
- `apps/web/src/features/support/components/SupportTicketComposerSection.tsx`
- `apps/web/src/features/support/components/SupportTicketRightRail.tsx`
- `apps/web/src/features/support/components/SupportWorkspaceAuxiliaryPanels.tsx`
- `apps/web/src/index.css`
- `docs/design/FRONTEND_VISUAL_GOVERNANCE.md`
- `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md`
- `docs/design/screens/SUPPORT_QUEUE.md`
- `docs/design/screens/SUPPORT_TICKET_WORKSPACE.md`
- `docs/design/blueprint/suporte/fila operacional.png`
- `docs/design/blueprint/suporte/tickets e conversas omni.png`

## Primitives operacionais criadas ou ajustadas

- `SupportPrimaryActionButton`
- `SupportSecondaryActionButton`
- `SupportIconActionButton`
- `SupportSearchInput`
- `SupportComposerTextarea`
- `SupportConversationMessage`
- `SupportInternalNote`
- `SupportSystemEvent`
- `QueueTicketItem`, ajustado para seleção operacional azul na lista dominante.

## Usos de ui.tsx rebaixados

- `SupportTicketQueue.tsx` deixou de usar `GhostButton` e `TextInput` como aparência final da fila lateral.
- `SupportTicketComposerSection.tsx` deixou de usar `AppButton`, `GhostButton` e `TextareaInput` como aparência final do composer.
- `SupportWorkspacePage.tsx` passou a usar primitives de suporte para ações principais, busca operacional e menu do workspace.
- `ui.tsx` permanece apenas como base/fallback em áreas não reconstruídas e helper de composição (`cx`), sem governar a aparência final das superfícies operacionais com blueprint próprio.

## Validações executadas

- `npm run web:typecheck`: passou.
- `npm run web:build`: passou.
- Validação visual autenticada com fixture local `qa.local.support-manager-a@genius.local`.
- `/support/queue`: fila operacional com lista central dominante, filtros compactos e rail direito como contexto do ticket.
- `/support/tickets`: fila lateral, thread conversacional, composer dockado e rail direito renderizados.
- Desktop `1728x992`: sem overflow horizontal.
- Mobile `390x844`: sem overflow horizontal; scroll vertical esperado.
- Estado vazio da fila validado por busca sem resultados.

## Prints gerados

- `C:\Users\edebu\AppData\Local\Temp\genius-support-visual-qa\support-queue-1728-final.png`
- `C:\Users\edebu\AppData\Local\Temp\genius-support-visual-qa\support-tickets-1728-final.png`
- `C:\Users\edebu\AppData\Local\Temp\genius-support-visual-qa\support-queue-mobile-final.png`

## Restrições confirmadas

- Nenhum backend foi alterado neste lote visual.
- Nenhuma migration foi criada ou alterada neste lote visual.
- Nenhuma policy/RLS foi criada ou alterada neste lote visual.
- Nenhum contrato de dados foi alterado neste lote visual.
- Nenhum mock novo foi criado.
- Nenhuma ação fake foi criada.
- Nenhuma regra de negócio foi movida para o frontend.
- Nenhum cálculo de SLA, status ou permissão foi introduzido no frontend; os valores continuam vindo dos contratos existentes.

## Pendência real

O estado de erro de API não foi forçado na validação visual, para evitar interferência artificial em ambiente, contrato de dados ou backend. Os componentes de erro existentes foram preservados.
