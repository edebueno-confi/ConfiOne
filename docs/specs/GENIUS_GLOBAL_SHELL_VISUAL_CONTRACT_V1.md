# GeniusOS Global Shell Visual Contract V1

**Data de Canonização:** 2026-08-09
**Versão:** 3.0
**Branch:** `codex/admin-configuration-visual-v1`
**Referência Visual:** `docs/design/blueprint/Shell PO/v1/geniusos-global-shell-dark-v1-approved.png`

---

## 1. Princípio Arquitetural da Casca Global

O GeniusOS possui uma **casca visual constante e reconhecível** em todo o sistema interno autenticado.
O conteúdo das páginas (Canvas) varia conforme o módulo, mas o Shell permanece rigorosamente estável.

Ela é composta por:
1. **Sidebar Lateral** (240px expandida / 56px recolhida)
2. **Topbar Global** (52px de altura)
3. **Submenu Flutuante (Flyout)** em Overlay Opaco
4. **Menu do Usuário (Header Global - Extremo Direito)**
5. **Canvas da Aplicação** (Flexível)

---

## 2. Hierarquia de Superfícies Cromáticas (Dark Baseline)

- **Nível 0 — Canvas Global:** `#081220` (Fundo neutro escuro sob as páginas)
- **Nível 1A — Sidebar:** `#0F1A2E` (Superfície azul-marinho própria da navegação)
- **Nível 1B — Topbar:** `#0E1627` (Faixa horizontal do header global)
- **Nível 2 — Superfície Primária:** `#131E33` (Cards, tabelas, painéis operacionais)
- **Nível 3 — Superfície Secundária / Overlays:** `#18263F` (Superfícies elevadas, menus flutuantes, flyouts, menus de usuário, estados selecionados)
- **Divisor / Borda:** `#22324D` (Linhas estruturais sutis de baixo contraste)

### Texto e Acentuação
- **Text Primary:** `#E6ECF5`
- **Text Secondary:** `#A6B2C7`
- **Azul Funcional:** `#2D7CFF` (CTA, foco, seleção, links ativos, navegação)
- **Rosa Genius (Microacento):** `#FF4FA3` (**Uso restrito a microacentos**: logotipo, indicador ativo de 2–3px, pequeno detalhe de seleção. NUNCA em grandes superfícies, cards ou preenchimento de ícones)
- **Cores Semânticas de Estado:** Success `#22C55E`, Warning `#F59E0B`, Danger `#EF4444`

---

## 3. Sidebar (240px / 56px)

- **Largura Expandida:** 240px (fixa)
- **Largura Recolhida:** 56px (fixa)
- **Composição Expandida:** Marca GeniusOS + Grupos de navegação por capability/permissão + Rodapé compacto (Workspace Atual + Controle de Recolher `«`).
- **Composição Recolhida:** Marca compacta + Ícones centrais + Controle de Expandir `»`.
- **Proibido no Rodapé da Sidebar:** Menu do usuário, avatar do usuário, alternador permanente de tema ou preferências pessoais.

---

## 4. Topbar Global (52px)

- **Altura:** 52px (fixa).
- **Esquerda:** Botão voltar (quando contextual) + Trilha Breadcrumb (`GeniusOS / Configurações / <tela>`).
- **Centro:** Campo de Busca Global "Pergunte ao Gênio" (Atalho `⌘K` / `Ctrl+K`).
- **Extremo Direito (ÚNICO LOCAL DE CONTA):** Trigger do Menu do Usuário (`Avatar` + `Nome` + `Contexto/Papel` + `Chevron`).
- **Tema:** O alternador permanente de tema foi REMOVIDO da topbar e da sidebar. O tema é uma preferência individual do usuário acessível em **Menu do Usuário -> Preferências -> Aparência**.

---

## 5. Submenu Flutuante (Flyout)

- **Comportamento:** Overlay puro. NÃO desloca o canvas, NÃO altera a largura do conteúdo principal (`shifted: false`).
- **Fundo:** Superfície secundária opaca (`#18263F`), borda `#22324D`. Sem glassmorphism, sem glow.
- **Interação:** Fecha por clique externo, seleção ou `Esc`. Focus trap preservado.

---

## 6. Escopo de Aplicação

- **Aplicável a:** Sistema interno autenticado (Dashboard, Conhecimento Admin, Configurações, Integrações, Acessos, Histórico, Fontes, Suporte, CS, Engenharia).
- **Fora do Escopo:** Central Pública de Ajuda (`/help/*`). A Central Pública mantém seus tokens públicos de leitura.
