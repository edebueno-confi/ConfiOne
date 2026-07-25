# P4-F.4B Support Workspace Blueprint Correction Pass

Data: 2026-05-25
Branch: `codex/p4-true-support-visual-refactor`

## 1. Objetivo

Corrigir o lote parcialmente reprovado do True Support Visual Refactor sem avançar para outros domínios. O escopo ficou restrito ao Support Workspace:

- `/support/queue`
- intake de novo ticket
- `/support/tickets/:ticketId`
- painéis de ações rápidas da tratativa

Não houve backend, migration, Supabase, contrato novo, mock ou ação fake.

## 2. Status inicial do git

O lote começou na branch `codex/p4-true-support-visual-refactor` com PNGs de blueprint pendentes em `docs/design/blueprint/suporte/` e screenshots antigas deletadas fora do escopo.

Decisão aplicada antes da correção visual:

- screenshots deletadas fora do escopo foram restauradas;
- blueprints aprovados foram consolidados em commit documental separado;
- worktree ficou limpo antes das mudanças de UI.

Commit documental criado:

- `8ad9455 docs: consolidar blueprints do support workspace`

## 3. Decisão sobre PNGs pendentes

### KEEP_CANONICAL

- `docs/design/blueprint/suporte/acionamentos geral.png`
- `docs/design/blueprint/suporte/conversa - tratativa.png`
- `docs/design/blueprint/suporte/fila operacional - sem seleção.png`
- `docs/design/blueprint/suporte/fila opercaional - 1 item selecionado.png`
- `docs/design/blueprint/suporte/fila opercaional -todos selecionados.png`
- `docs/design/blueprint/suporte/novo ticket.png`

### REMOVE_DUPLICATE

- `docs/design/blueprint/suporte/acionamentos.png`
- `docs/design/blueprint/suporte/classificação NEW.png`
- `docs/design/blueprint/suporte/classificação.png`
- `docs/design/blueprint/suporte/conhecimento.png`
- `docs/design/blueprint/suporte/conversas NOVO.png`
- `docs/design/blueprint/suporte/evidencias.png`
- `docs/design/blueprint/suporte/fila operacional.png`
- `docs/design/blueprint/suporte/tickets e conversas omni.png`
- `docs/design/blueprint/suporte/tickets e conversas.png`

### KEEP_REFERENCE / IGNORE_TEMP

Nenhum arquivo foi mantido nessas categorias.

## 4. Arquivos alterados

- `apps/web/src/features/support/SupportWorkspacePage.tsx`
- `apps/web/src/features/support/components/SupportTicketAdvancedContextPanels.tsx`
- `apps/web/src/features/support/components/SupportTicketContextPanels.tsx`
- `apps/web/src/features/support/components/SupportTicketRightRail.tsx`
- `apps/web/src/features/support/components/SupportTicketWorkspaceHeader.tsx`
- `apps/web/src/features/support/components/SupportWorkspacePrimitives.tsx`
- `apps/web/src/index.css`
- `docs/reports/P4_SUPPORT_WORKSPACE_BLUEPRINT_CORRECTION_2026-05-25.md`
- `docs/reports/visual-audit/screenshots/p4-f4b-support-*.png`

## 5. Correções por tela

### `/support/queue`

- Mantida a tabela como superfície dominante.
- Mantido estado sem seleção sem rail direito.
- Mantido painel de contexto apenas quando há um ticket selecionado.
- Mantido painel de ações em massa quando há múltiplos tickets selecionados.
- Reduzido o peso visual da tipografia nas linhas da tabela.
- Ajustada a hierarquia entre ID, cliente, assunto, prioridade, responsável e SLA.
- Reduzido truncamento agressivo ao ampliar a proporção de cliente e assunto no estado com painel.
- Ações em massa desabilitadas passaram a parecer governadas por status/permissão, não quebradas.
- Painel de um item selecionado ficou mais escaneável, com resumo, timeline curta e CTA `Abrir tratativa`.

### Intake / Novo ticket

- Removida copy arquitetural da UI.
- Removidos termos operacionais internos como contrato de ticket, read models, backend, RPC e automação externa.
- Copy substituída por orientação de operador:
  - cliente e solicitante para contexto correto;
  - prioridade e severidade para triagem inicial;
  - SLA aplicada conforme política operacional configurada;
  - descrição clara do problema;
  - evidências quando ajudarem na análise.

### `/support/tickets/:ticketId`

- Header do ticket refinado para separar identidade, solicitante, responsável e chips.
- Conversa/timeline recebeu mais peso visual e diferenciação por tipo.
- Mensagens públicas, notas internas e eventos operacionais passaram a ter superfícies próprias.
- Composer recebeu tabs claras, área de texto mais confortável, ação de anexar evidência e botão de envio mais próximo do blueprint.
- Inbox lateral recebeu ajuste visual para caixa de entrada operacional.
- Right rail foi refinado para atuar como apoio da tratativa, não reaproveitamento genérico.
- Ações rápidas ficaram restritas a:
  - Classificar
  - Alterar status
  - Evidências
  - Conhecimento
  - Acionamentos
  - Relacionados
- Não há ação rápida `Responder`.
- Nota interna permanece no composer, sem duplicidade em ações rápidas.

### Ações rápidas

- Painéis de ação rápida foram ampliados pelo token de drawer operacional.
- Títulos e descrições foram ajustados para linguagem operacional.
- `Acionamentos` passou a abrir `Acionamentos internos`, com copy focada em áreas internas e retorno dentro da tratativa.
- Ações sem contrato real continuam bloqueadas ou indisponíveis, sem simulação de sucesso.

## 6. Screenshots gerados

Pasta: `docs/reports/visual-audit/screenshots/`

- `p4-f4b-support-queue-no-selection.png`
- `p4-f4b-support-queue-one-selected.png`
- `p4-f4b-support-queue-bulk-selected.png`
- `p4-f4b-support-new-ticket.png`
- `p4-f4b-support-ticket-workspace.png`
- `p4-f4b-support-ticket-classify.png`
- `p4-f4b-support-ticket-status.png`
- `p4-f4b-support-ticket-evidence.png`
- `p4-f4b-support-ticket-knowledge.png`
- `p4-f4b-support-ticket-internal-actions.png`
- `p4-f4b-support-ticket-related.png`

## 7. Impeccable usado

Aplicado como referência de correção:

- `/impeccable layout`: estrutura de fila, conversa, rail e painéis.
- `/impeccable critique`: reprovação da herança visual antiga, duplicidade e ruído.
- `/impeccable harden`: estados indisponíveis, ações governadas e ausência de ação fake.
- `/impeccable polish`: acabamento visual e densidade operacional.
- `/impeccable typeset`: peso da tabela, chips e hierarchy de conversa.
- `/impeccable distill`: remoção de copy arquitetural e duplicidade de ações.

## 8. Validações executadas

- `npm run contracts:typecheck` passou.
- `npm run web:typecheck` passou.
- `npm run web:build` passou.
- `git diff --check` passou.
- Browser QA autenticado com `support_manager` em `http://127.0.0.1:4184`.

Credencial usada:

- `qa.local.support-manager-a@genius.local / LOCAL_QA_SUPPORT_MANAGER_PASSWORD`

Rotas validadas:

- `/support/queue`
- `/support/tickets/:ticketId`

Verificações visuais:

- sem scroll horizontal global;
- sem scroll global indevido em desktop operacional;
- fila sem seleção sem rail direito;
- fila com seleção preservando tabela dominante;
- múltiplos selecionados exibindo ações em massa;
- intake sem copy arquitetural;
- workspace sem `Responder` em ações rápidas;
- nota interna restrita ao composer;
- painéis de ação rápida amplos e operacionais.

## 9. Commit criado

- `fix: corrigir fidelidade visual do support workspace`

## 10. Estado final esperado

Critério de aceite do lote:

- git status limpo;
- nenhum arquivo fora do escopo;
- screenshots e relatório commitados;
- sem backend, migration, Supabase ou contrato alterado.
