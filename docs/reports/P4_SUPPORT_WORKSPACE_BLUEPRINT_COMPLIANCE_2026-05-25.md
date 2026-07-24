# P4-F.4D - Support Workspace Blueprint Compliance Pass

Data: 2026-05-25  
Branch: `codex/p4-true-support-visual-refactor`

## Objetivo

Corrigir a implementação visual do Support Workspace para ficar alinhada aos blueprints aprovados, mantendo o escopo em frontend/UI/UX. Não houve backend, migration, Supabase, contrato novo, mock ou ação fake.

## Matriz antes vs blueprint

| Tela | Diferença encontrada | Impacto visual/UX | Ajuste aplicado | Arquivo/componente |
| --- | --- | --- | --- | --- |
| `/support/queue` sem seleção | Lista dominante já estava melhor, mas a linha não abria seleção ao clicar no conteúdo. | Operador não conseguia selecionar o ticket de forma natural. | Linha inteira virou alvo clicável com teclado e foco visível; checkbox continua exclusivo para seleção em massa. | `SupportWorkspacePage.tsx`, `index.css` |
| `/support/queue` com item selecionado | Painel direito ainda parecia card genérico. | Contexto operacional pouco escaneável. | Painel preservado como apoio, com CTA claro para abrir tratativa e hierarquia visual mais próxima do blueprint. | `SupportWorkspacePage.tsx`, `index.css` |
| `/support/queue` seleção em massa | Ações pareciam indisponíveis/quebradas quando governadas por status/permissão. | Risco de leitura como falha de UI. | Ações em massa mantidas como superfície governada, com alerta operacional e botões visualmente consistentes. | `SupportWorkspacePage.tsx`, `index.css` |
| Novo ticket | Copy ainda explicava arquitetura interna. | Operador via termos técnicos que não pertencem ao fluxo. | Copy operacional; formulário principal amplo; resumo lateral; footer fixo; evidências explicadas como parte da análise. | `SupportWorkspacePage.tsx`, `index.css` |
| `/support/tickets/:ticketId` | Workspace ainda se aproximava da tela antiga e as ações rápidas foram interpretadas como tela recortada em tentativa anterior. | Conversa perdia protagonismo e a estrutura principal podia colapsar. | Rota mantém sidebar, inbox, header, tabs, timeline, composer e rail; ações rápidas substituem apenas o painel direito. | `SupportWorkspacePage.tsx`, `SupportTicketConversationSection.tsx`, `index.css` |
| Composer | Toolbar visual não tinha ação real. | Risco de ação fake ou controle morto. | Controles passam a editar o texto do textarea por marcação textual sem backend novo. | `SupportTicketComposerSection.tsx`, `SupportWorkspacePrimitives.tsx` |
| Ações rápidas | Classificar/status/evidências/conhecimento/acionamentos/relacionados precisavam seguir o conteúdo dos blueprints sem virar nova rota. | Painéis podiam parecer genéricos ou quebrar a composição. | Painéis permanecem no rail direito; acionamentos usa formulário vertical e lista de handoff conforme blueprint. | `SupportTicketAdvancedContextPanels.tsx`, `SupportTicketContextPanels.tsx`, `index.css` |

## Causa raiz da regressão visual

Não foi identificado colapso real de Tailwind ou falha de build CSS. A quebra percebida veio de composição: a implementação anterior reinterpretou os blueprints como telas independentes e, em alguns pontos, rebaixou wrappers visuais da fila. Também havia uma regressão de interação na fila: o clique no texto da linha não acionava seleção, apenas o checkbox de massa.

## Correções por tela

### Fila operacional

- Linha inteira agora seleciona o ticket e suporta teclado.
- Checkbox continua reservado para seleção em massa.
- Estado sem seleção preserva lista dominante e sem rail direito.
- Estado com item selecionado mantém painel de apoio com CTA `Abrir tratativa`.
- Estado em massa mantém painel de governança operacional.
- Sem scroll horizontal global no viewport validado.

### Novo ticket

- Removida linguagem técnica visível como tenant, contrato, read model, backend, RPC e automação externa.
- Composição segue formulário principal amplo, resumo lateral e footer fixo.
- Copy orienta o operador: cliente, solicitante, prioridade, severidade, SLA, descrição e evidências.

### Tickets e conversas

- Rota `/support/tickets/:ticketId` preserva workspace completo.
- Sidebar, inbox, header, tabs, conversa, composer e rail continuam visíveis.
- Tabs internas adicionadas: Conversa, Detalhes, Atividades, Relacionados, SLA e Histórico.
- Ações rápidas permitidas: Classificar, Alterar status, Evidências, Conhecimento, Acionamentos e Relacionados.
- Não foi adicionada ação rápida de responder nem nota interna fora do composer.
- Composer ganhou toolbar funcional, anexar evidência e menu de envio com opção governada para alterar status.

### Acionamentos

- O blueprint de acionamentos foi interpretado como painel direito dentro do Ticket Workspace, não como tela recortada.
- O painel traz `Novo acionamento`, handoff técnico existente e acionamentos do ticket.
- A linguagem usa dependências internas e áreas de apoio, sem reduzir tudo a engenharia.

## Blueprints pendentes

| Arquivo | Decisão | Motivo |
| --- | --- | --- |
| `docs/design/blueprint/suporte/acionamentos geral.png` | `REMOVE_DUPLICATE` | Substituído por blueprint mais específico de acionamentos dentro de conversa. |
| `docs/design/blueprint/suporte/conversas - acionamentos.png` | `KEEP_CANONICAL` | Fonte visual atual para painel de acionamentos no rail direito. |
| `docs/design/blueprint/suporte/conversa - classificar.png` | `KEEP_CANONICAL` | Fonte visual para painel de classificação. |
| `docs/design/blueprint/suporte/conversas- status.png` | `KEEP_CANONICAL` | Fonte visual para painel de alteração de status. |
| `docs/design/blueprint/suporte/evidencias.png` | `KEEP_CANONICAL` | Fonte visual para painel de evidências. |
| `docs/design/blueprint/suporte/conversa - conhecimento.png` | `KEEP_CANONICAL` | Fonte visual para painel de conhecimento. |
| `docs/design/blueprint/suporte/ChatGPT Image 25 de mai. de 2026, 20_21_19.png` | `KEEP_REFERENCE` | Referência visual de conversa/relacionados adicionada pelo lote. |
| `docs/design/blueprint/suporte/Clientes B2B/*` | `KEEP_REFERENCE` | Referência visual preservada; não implementada neste lote. |

## Impeccable usado

- `/impeccable audit`: identificar colapsos de composição, ações falsas e pontos de divergência estrutural.
- `/impeccable layout`: recompor grid de fila, workspace e rail direito sem scroll horizontal.
- `/impeccable critique`: comparar o comportamento com a intenção dos blueprints.
- `/impeccable polish`: ajustar hierarquia, bordas, espaçamento e densidade.
- `/impeccable harden`: revisar overflow, foco, seleção por teclado, estados governados e responsividade desktop.
- `/impeccable clarify`: remover copy arquitetural do intake.
- `/impeccable adapt`: validar no viewport real de browser.
- `/impeccable distill`: reduzir duplicidade de ações rápidas e evitar rail genérico.

## Screenshots gerados

- `docs/reports/visual-audit/screenshots/p4-f4d-support-queue-no-selection.png`
- `docs/reports/visual-audit/screenshots/p4-f4d-support-queue-one-selected.png`
- `docs/reports/visual-audit/screenshots/p4-f4d-support-queue-bulk-selected.png`
- `docs/reports/visual-audit/screenshots/p4-f4d-support-new-ticket.png`
- `docs/reports/visual-audit/screenshots/p4-f4d-support-ticket-workspace.png`
- `docs/reports/visual-audit/screenshots/p4-f4d-support-ticket-composer-menu.png`
- `docs/reports/visual-audit/screenshots/p4-f4d-support-ticket-classify.png`
- `docs/reports/visual-audit/screenshots/p4-f4d-support-ticket-status.png`
- `docs/reports/visual-audit/screenshots/p4-f4d-support-ticket-evidence.png`
- `docs/reports/visual-audit/screenshots/p4-f4d-support-ticket-knowledge.png`
- `docs/reports/visual-audit/screenshots/p4-f4d-support-ticket-internal-actions.png`
- `docs/reports/visual-audit/screenshots/p4-f4d-support-ticket-related.png`

## Validações

- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`
- `git diff --check`
- Browser QA autenticado com `support_manager`

## Confirmações

- Sem backend, migration, Supabase ou contrato novo.
- Sem mock e sem provider externo.
- Nenhuma rota nova foi criada para ações rápidas.
- `/support/tickets/:ticketId` preserva conversa, composer e painel lateral.
- Ações rápidas substituem apenas o rail direito.
- Sem scroll horizontal global no viewport validado.
- Sem CSS colapsado após build.
- Sem truncamento crítico restante nos estados validados.
- A fila não voltou a ficar espremida.

## Riscos restantes

- A fidelidade visual ainda exige aprovação humana pixel-a-pixel contra os PNGs.
- A toolbar do composer usa marcação textual no textarea; um editor rich text completo deve ser fase própria se virar requisito de produto.
- As opções `Enviar e fechar` e `Enviar e aguardar cliente` continuam governadas/desabilitadas porque exigem motivo/status específico no fluxo atual.
