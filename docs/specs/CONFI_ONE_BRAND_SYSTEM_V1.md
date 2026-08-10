# CONFI ONE — BRAND SYSTEM V1 & GLOBAL UI CONTRACT

**Status:** ESPECIFICAÇÃO CANÔNICA VIGENTE  
**Data:** 2026-08-09  
**Produto:** Confi One  
**Herança Cultural:** Genius (Gênio, azul + rosa Genius, memória visual)  
**Escopo:** Sistema interno autenticado para operações do ecossistema Confi  

---

## 1. Arquitetura de Marca & Princípios

- **Confi One:** Nome da plataforma operacional interna.
- **Gênio:** Avatar e assistente operacional inteligente.
- **Genius:** Herança visual e cultural (memória, azul + rosa microacento `#FF4FA3`).
- **Marcas Atendidas (Aftersale, Neotrust, Genius legado, Confi):** Contexto operacional de dados, nunca tema cromático do shell.

---

## 2. Sistema Cromático Canônico — Dark Baseline

### Shell (Moldura Contínua em "L")
- **Token:** `--one-shell-bg` | **Valor:** `#0F1A2E` (`rgb(15, 26, 46)`)
- **Token:** `--one-shell-border` | **Valor:** `#22324D` (`rgb(34, 50, 77)`)
- **Regra:** Sidebar (240px/56px) e Topbar (52px) usam exatamente `#0F1A2E`.

### Workspace & Superfícies Operacionais
- **Canvas:** `--one-canvas-bg` | `#081220` (`rgb(8, 18, 32)`) — tom mais escuro, fundo do trabalho.
- **Superfície 1:** `--one-surface-1` | `#131E33` (`rgb(19, 30, 51)`) — cards, tabelas, filtros, toolbars.
- **Superfície 2:** `--one-surface-2` | `#18263F` (`rgb(24, 38, 63)`) — detail rails, áreas internas, seleção.
- **Superfície Interativa:** `--one-surface-interactive` | `#1C2D49` (`rgb(28, 45, 73)`) — hover, foco, seleção ativa.

### Bordas
- `--one-border-subtle`: `#1D2D45`
- `--one-border-default`: `#22324D`
- `--one-border-strong`: `#2F4869`

### Texto
- `--one-text-primary`: `#E6ECF5`
- `--one-text-secondary`: `#A6B2C7`
- `--one-text-muted`: `#7789A6`
- `--one-text-disabled`: `#586A85`

### Ações & Herança Genius
- **Ação Primária:** `--one-action-primary` | `#2D7CFF` (Hover `#428AFF`)
- **Rosa Genius (Microacento):** `--one-genius-pink` | `#FF4FA3` (Trilho ativo 2-3px, Gênio, microdetalhe)

---

## 3. Estrutura do Shell Global

1. **Sidebar Expandida (240px)**: Fundo `#0F1A2E`. Brand Area superior (52px) contendo wordmark `Confi One` à esquerda e botão de recolher menu (`32x32px`, radius 7px) à direita.
2. **Sidebar Colapsada (56px)**: Fundo `#0F1A2E`. Topo exibe botão de expandir centralizado (`32x32px`). Flyouts abrem como overlay sobre o canvas a partir de 56px, sem layout shift.
3. **Sidebar Footer**: Limpo e enxuto. Não possui botão de recolher, avatar, e-mail ou botões redundantes.
4. **Topbar Global (52px)**: Fundo `#0F1A2E`. Limite estrito em `y = 52px`. Centro: Busca global "Pergunte ao Gênio" (altura 32px, Surface 1 `#131E33`). Extremo direito: ÚNICO trigger global de menu do usuário (`36px` altura, popover `300px` em Surface 2 `#18263F`).
5. **Page Header**: Transparente sobre Canvas `#081220`. Pertence ao conteúdo da página, não à topbar.

---

## 4. Regras de Layering & Hierarquia de Superfícies

- **Page wrappers are structural, not visual surfaces.** Wrappers de página devem ser estruturais e transparentes (`background: transparent`, `border: none`, `box-shadow: none`), sem atribuir cor de superfície ou sombra ao container inteiro da página.
- **The Canvas must remain visually exposed between primary content regions.** O fundo Canvas (`#081220`) deve permanecer visível ao redor do Page Header, nas margens da página (24px laterais, 20px topo) e no espaço entre cartões e tabelas primárias.
- **Anti-Pattern Proibido — Redundant Page Surface:** Envolver toda a página ou todas as seções em um grande cartão/container escuro único criando o efeito indesejado de "uma tela dentro de outra tela". Os cartões primários (`Surface 1 #131E33`) e secundários (`Surface 2 #18263F`) devem assentar-se diretamente sobre o Canvas `#081220`.
