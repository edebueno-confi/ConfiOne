# GeniusOS Global Shell V3 — Measurement Report

Data: 2026-08-09
Branch: `codex/admin-configuration-visual-v1`
Alvo: Viewport 1366×768, Tema Dark Baseline

## 1. Instrumentação do DOM

Medidas extraídas diretamente das propriedades `getBoundingClientRect` dos elementos reais da interface via Playwright no baseline local QA.

| Elemento / Dimensão | Alvo do Blueprint | Medição Real (Expanded) | Medição Real (Collapsed) | Medição Real (With Flyout) | Status |
| --- | --- | --- | --- | --- | --- |
| **Sidebar (Largura)** | 240px | 240px | 56px | 56px | ✔ MATCH |
| **Sidebar (Altura)** | 768px | 768px | 768px | 768px | ✔ MATCH |
| **Topbar (Altura)** | 52px | 52px | 52px | 52px | ✔ MATCH |
| **Main Canvas (x)** | 240px / 56px | 240px | 56px | 56px | ✔ MATCH |
| **Main Canvas (Largura)** | 1126px / 1310px | 1126px | 1310px | 1310px | ✔ MATCH |
| **Main Canvas (Altura)** | 716px | 716px | 716px | 716px | ✔ MATCH |
| **Item Navegação (Altura)** | 36–40px | 36px | 36px | 36px | ✔ MATCH |
| **User Menu Location** | Topbar Far Right | Topbar x=1070..1366 | Topbar x=1070..1366 | Topbar x=1070..1366 | ✔ MATCH |
| **Document ScrollWidth** | 1366px | 1366px | 1366px | 1366px | ✔ MATCH |

---

## 2. Prova de Overlay Sem Layout Shift

- **Coordenadas do Main Canvas antes do Flyout:** `{ x: 56, y: 52, width: 1310, height: 716 }`
- **Coordenadas do Main Canvas com Flyout Aberto:** `{ x: 56, y: 52, width: 1310, height: 716 }`
- **Variância de Layout Shift (`shifted`):** `false`
- **Submenu Flutuante Renderizado (`flyoutRendered`):** `true`
- **Horizontal Overflow:** `false` (`scrollWidth === viewportWidth === 1366`)

---

## 3. Matriz de Aceitação do Gate do Shell (Shell Gate)

1. **SHELL SURFACE HIERARCHY MATCH** = SIM
2. **SIDEBAR EXPANDED MATCH** = SIM (240px)
3. **SIDEBAR COLLAPSED MATCH** = SIM (56px)
4. **FLYOUT OVERLAY MATCH** = SIM (opaco, x=52 y=66, shifted=false)
5. **TOPBAR MATCH** = SIM (52px)
6. **USER MENU UNIQUE LOCATION** = SIM (topbar extremo direito)
7. **THEME REMOVED FROM GLOBAL CHROME** = SIM (migrado para Preferências -> Aparência)
8. **NO LAYOUT SHIFT** = SIM
9. **PERMISSION SOURCE PRESERVED** = SIM
10. **ICONOGRAPHY CONSISTENT** = SIM (linear monocromática)
11. **COLOR DISCIPLINE MATCH** = SIM (Canvas #081220, Sidebar #0F1A2E, Topbar #0E1627, Surface Primary #131E33, Surface Secondary #18263F, Border #22324D, Pink como microacento)

**VEREDITO FINAL DO SHELL: 11/11 SIM (APROVADO E RE-CONGELADO).**
