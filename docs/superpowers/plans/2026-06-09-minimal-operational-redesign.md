# Minimal Operational Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recriar integralmente a interface do Genius Support OS com um sistema visual minimalista operacional, preservando rotas, contratos de dados, autorização e fluxos reais.

**Architecture:** A migração será incremental por superfície. Um novo vocabulário de componentes será introduzido em paralelo ao legado, validado primeiro em Login e Acesso negado, depois aplicado ao shell e às áreas operacionais. Nenhuma regra de negócio será movida para o frontend e nenhuma alteração de banco faz parte deste plano.

**Tech Stack:** React 19, TypeScript 5.9, React Router 7, Tailwind CSS 4, Vite 8, Supabase existente, testes Node.js e QA no Browser.

---

## Estrutura de arquivos

- `apps/web/src/components/minimal-ui.tsx`: componentes básicos do novo sistema visual.
- `apps/web/src/components/minimal-states.tsx`: estados de loading, erro, vazio, indisponível e acesso negado.
- `apps/web/src/features/login/LoginPage.tsx`: primeiro fluxo migrado.
- `apps/web/src/features/auth/AccessDeniedPage.tsx`: estado de autorização migrado.
- `apps/web/src/features/navigation/MinimalAppShell.tsx`: shell interno único.
- `apps/web/src/features/navigation/minimal-navigation.ts`: modelo puro de navegação orientado por permissão.
- `apps/web/src/features/admin-shell/AdminConsoleShell.tsx`: adoção do shell.
- `apps/web/src/features/support/SupportWorkspaceShell.tsx`: adoção do shell.
- `apps/web/src/features/cs/CsWorkspaceShell.tsx`: adoção do shell.
- `apps/web/src/features/cs/CsPortfolioPage.tsx`: piloto operacional de leitura.
- `apps/web/src/features/support/components/*`: fila e workspace de ticket.
- `apps/web/src/features/admin-*`: migração das superfícies administrativas.
- `tests/scripts/minimal-ui-contract.test.mjs`: contrato estático contra regressões visuais proibidas.
- `docs/superpowers/specs/2026-06-09-minimal-operational-redesign-design.md`: fonte de verdade da direção aprovada.

### Task 1: Contrato de regressão visual

**Files:**
- Create: `tests/scripts/minimal-ui-contract.test.mjs`
- Test: `tests/scripts/minimal-ui-contract.test.mjs`

- [x] **Step 1: Escrever o teste de contrato**

Criar verificações que leiam os novos componentes e impeçam:

```js
const forbiddenPatterns = [
  /linear-gradient/i,
  /radial-gradient/i,
  /backdrop-blur/i,
  /uppercase tracking-\[/i,
  /hover:translate-y/i,
];
```

O teste também deve confirmar a existência de foco visível, labels nativos, landmarks e estado desabilitado.

- [x] **Step 2: Executar o teste e confirmar falha inicial**

Run: `node --test tests/scripts/minimal-ui-contract.test.mjs`

Expected: FAIL porque os arquivos do novo sistema ainda não existem.

- [x] **Step 3: Manter o teste focado no novo sistema**

O contrato deve inspecionar apenas `minimal-ui.tsx`, `minimal-states.tsx`, `LoginPage.tsx` e `MinimalAppShell.tsx`. O legado continuará existindo durante a migração.

### Task 2: Fundação visual minimalista

**Files:**
- Create: `apps/web/src/components/minimal-ui.tsx`
- Create: `apps/web/src/components/minimal-states.tsx`
- Modify: `apps/web/src/index.css`
- Test: `tests/scripts/minimal-ui-contract.test.mjs`

- [x] **Step 1: Criar tokens semânticos**

Adicionar tokens CSS para fundo, superfície, texto, texto secundário, borda, seleção, foco, estados e elevação sutil. Usar neutros tintados e um único azul de ação.

- [x] **Step 2: Criar componentes básicos**

Implementar:

```ts
MinimalButton
MinimalField
MinimalTextInput
MinimalNotice
MinimalSurface
MinimalPage
MinimalState
```

Todos os componentes interativos devem contemplar hover, foco visível, disabled e loading quando aplicável.

- [x] **Step 3: Implementar estados operacionais**

Criar loading por skeleton/pulso discreto, erro, vazio, indisponível e acesso negado sem mascote, gradiente, hero card ou copy repetida.

- [x] **Step 4: Executar o contrato**

Run: `node --test tests/scripts/minimal-ui-contract.test.mjs`

Expected: PASS.

### Task 3: Piloto de Login e Acesso negado

**Files:**
- Modify: `apps/web/src/features/login/LoginPage.tsx`
- Modify: `apps/web/src/features/auth/AccessDeniedPage.tsx`
- Test: `tests/scripts/minimal-ui-contract.test.mjs`

- [x] **Step 1: Preservar o comportamento**

Manter sem alteração:

```ts
resolvePostLoginRedirect
signInWithPassword
sessionExpired
clearSessionExpired
configError
Navigate
```

- [x] **Step 2: Recriar o Login**

Usar uma única superfície central com:

```text
Genius Support OS
Entrar
Email
Senha
Entrar
Acesso restrito a contas autorizadas.
```

Eliminar hero, mascote duplicado, gradientes, bloco explicativo repetido e botão secundário de limpar.

- [x] **Step 3: Recriar Acesso negado**

Usar estado minimalista, descrição específica do motivo e ações claras: encerrar sessão e voltar.

- [x] **Step 4: Validar teclado e semântica**

Confirmar labels, ordem de tabulação, submit por Enter, foco visível e mensagens com `role="alert"` quando necessário.

### Task 4: Shell interno único

**Files:**
- Create: `apps/web/src/features/navigation/minimal-navigation.ts`
- Create: `apps/web/src/features/navigation/MinimalAppShell.tsx`
- Modify: `apps/web/src/features/admin-shell/AdminConsoleShell.tsx`
- Modify: `apps/web/src/features/support/SupportWorkspaceShell.tsx`
- Modify: `apps/web/src/features/cs/CsWorkspaceShell.tsx`
- Test: `tests/scripts/minimal-navigation.test.mjs`

- [x] **Step 1: Extrair modelo puro da navegação**

Separar itens por contexto e permissão sem renderizar links indisponíveis. Testar destinos, labels e grupos.

- [x] **Step 2: Criar shell**

Implementar sidebar compacta, top context bar, área principal e rail opcional com landmarks semânticos.

- [x] **Step 3: Migrar os três shells**

Substituir a composição visual mantendo `Outlet`, gates de autenticação e seleção de rota.

- [x] **Step 4: Validar responsividade**

Desktop: sidebar fixa e conteúdo com scroll interno.

Mobile: navegação recolhível, sem overflow horizontal e com foco preservado.

### Task 5: CS Portfolio

**Files:**
- Modify: `apps/web/src/features/cs/CsPortfolioPage.tsx`
- Test: `tests/scripts/cs-portfolio-model.test.mjs`
- Test: `tests/scripts/cs-route-access.test.mjs`

- [x] **Step 1: Preservar o read model**

Não alterar consultas, regras de acesso ou tratamento de dados indisponíveis.

- [x] **Step 2: Recriar a superfície**

Usar toolbar curta, lista/tabela como área dominante e detalhe sob demanda. Remover métricas decorativas e copy redundante.

- [x] **Step 3: Executar testes existentes**

Run: `node --test tests/scripts/cs-portfolio-model.test.mjs tests/scripts/cs-route-access.test.mjs`

Expected: PASS.

### Task 6: Support Queue

**Files:**
- Modify: `apps/web/src/features/support/components/SupportTicketQueue.tsx`
- Modify: estados relacionados em `apps/web/src/features/support/components/SupportWorkspaceStates.tsx`

- [x] **Step 1: Manter filtros e seleção reais**

Preservar os parâmetros, dados e handlers atuais.

- [x] **Step 2: Recriar a fila**

Transformar a fila em lista densa com prioridade visual limitada a status, SLA, prioridade e seleção.

- [x] **Step 3: Reduzir ações simultâneas**

Manter uma ação primária por contexto e mover ações secundárias para menu contextual ou detail rail.

### Task 7: Ticket Workspace

**Files:**
- Modify: `apps/web/src/features/support/components/SupportTicketWorkspaceHeader.tsx`
- Modify: `apps/web/src/features/support/components/SupportTicketConversationSection.tsx`
- Modify: `apps/web/src/features/support/components/SupportTicketComposerSection.tsx`
- Modify: `apps/web/src/features/support/components/SupportTicketContextRail.tsx`
- Modify: `apps/web/src/features/support/components/SupportTicketRightRail.tsx`
- Modify: `apps/web/src/features/support/components/SupportTicketContextPanels.tsx`
- Modify: `apps/web/src/features/support/components/SupportTicketAdvancedContextPanels.tsx`

- [x] **Step 1: Definir a conversa como foco**

Thread e composer ocupam a área central; contexto e metadados ficam em rail discreto.

- [x] **Step 2: Aplicar Focus Surface às mutações**

Responder, encaminhar e alterar contexto devem ter ação primária previsível, cancelamento claro e estados de erro honestos.

- [x] **Step 3: Validar scroll**

Sem scroll global em desktop; thread, lista e rail controlam seus próprios scrolls.

### Task 8: Admin Tenants e Access

**Files:**
- Modify: páginas em `apps/web/src/features/admin-tenants/`
- Modify: páginas em `apps/web/src/features/admin-access/`

- [x] **Step 1: Recriar Admin Tenants**

Lista/tabela dominante, seleção clara, detail rail e ações governadas. Remover mosaico de cards e pills decorativas.

- [x] **Step 2: Recriar Admin Access**

Mostrar quem acessa o quê usando dados reais de usuário, role, tenant, status e atualização. Não ocultar usuários sem tenant.

- [x] **Step 3: Preservar autorização**

Não alterar gates, RPCs, views, memberships, roles ou isolamento de tenant.

### Task 9: Admin System e Knowledge

**Files:**
- Modify: páginas em `apps/web/src/features/admin-system/`
- Modify: páginas em `apps/web/src/features/admin-knowledge/`

- [x] **Step 1: Recriar Admin System**

Priorizar eventos, checks e auditoria reais. Nenhum status verde pode ser inferido pelo frontend.

- [x] **Step 2: Recriar Admin Knowledge**

Lista editorial dominante, revisão e publicação em Focus Surface, visibilidade e estado vindos do backend.

- [x] **Step 3: Sanitizar detalhe**

Não expor payload, token, segredo, header, log cru ou metadata sensível.

### Task 10: Consolidação e remoção do legado visual

**Files:**
- Modify: `apps/web/src/components/ui.tsx`
- Modify: `apps/web/src/components/states.tsx`
- Modify: `apps/web/src/index.css`
- Delete only after zero consumers: componentes visuais legados substituídos

- [x] **Step 1: Mapear consumidores restantes**

Run:

```powershell
Get-ChildItem apps/web/src -Recurse -File |
  Select-String -Pattern 'AppButton|Panel|MetricCard|StateFrame|UnifiedEnvironmentNavigation'
```

Expected: nenhum consumidor nas rotas migradas.

- [x] **Step 2: Consolidar componentes**

Renomear o sistema minimalista para o vocabulário canônico somente após todas as superfícies estarem migradas.

- [x] **Step 3: Remover código morto**

Excluir apenas componentes sem consumidores, mantendo assets de marca usados em superfícies públicas.

### Task 11: Validação final e documentação

**Files:**
- Modify: `docs/PROJECT_STATE.md`
- Modify: `docs/ROADMAP_BUILDOUT_V3.md`
- Modify: `docs/DOCUMENTATION_LEDGER.md`
- Create: `docs/reports/MINIMAL_OPERATIONAL_REDESIGN_VALIDATION_2026-06-09.md`

- [x] **Step 1: Executar controles automatizados**

Run:

```powershell
node --test tests/scripts/*.test.mjs
npm run contracts:typecheck
npm run web:typecheck
npm run web:build
git diff --check
```

Expected: todos os comandos passam sem warnings de whitespace.

- [x] **Step 2: Executar QA visual no Browser**

Validar ao menos:

```text
/login
/access-denied
/support/queue
/support/tickets/:ticketId
/cs/portfolio
/admin/tenants
/admin/access
/admin/system
/admin/knowledge
```

Testar desktop e viewport móvel, teclado, loading, erro, vazio, indisponível, overflow e scroll.

- [x] **Step 3: Registrar evidências**

Documentar rotas verificadas, viewports, comandos executados, limitações e pendências reais.

## Autorrevisão

- Cobertura da spec: shell, redução de cards/pills/copy, Focus Surface, acessibilidade, densidade, todas as áreas nomeadas e validação estão mapeados.
- Escopo: o plano é grande, mas cada task produz uma superfície funcional e verificável.
- Backend: explicitamente fora do escopo, salvo correção de contrato quebrado descoberta durante a migração.
- Segurança: nenhuma credencial, secret ou dado sensível será inserido em código, documentação ou evidência.
- Placeholders: não há `TBD`, `TODO` ou etapa sem critério de execução.
