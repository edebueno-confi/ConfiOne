# GENIUSOS GLOBAL SHELL VISUAL CONTRACT V1

> **SUPERSEDED NOTE (2026-08-09):** Esta especificação foi SUPERSEDIDA pelo [CONFI_ONE_BRAND_SYSTEM_V1.md](file:///C:/Projetos/GSO-old/docs/specs/CONFI_ONE_BRAND_SYSTEM_V1.md), que define o Brand System canônico do Confi One.

**Approved Specification — 2026-08-09**

## 1. Executive Summary & Core Hierarchy

The GeniusOS authenticated application enforces a strict 4-level surface hierarchy across all modules and viewports:

```
┌─────────────────┬──────────────────────────────────────────────────────────┐
│                 │ SHELL TOPBAR GLOBAL                                      │
│                 │ #0E1627 · 52px height                                    │
│  SHELL SIDEBAR  ├──────────────────────────────────────────────────────────┤
│  #0F1A2E        │                                                          │
│  240px / 56px   │ MAIN CANVAS                                              │
│                 │ #081220 (Page Headers, Canvas, Free Space)               │
│                 │                                                          │
│                 │   ┌──────────────────────────────────────────────────┐   │
│                 │   │ SURFACE 1 (#131E33)                              │   │
│                 │   │   ┌──────────────────────────────────────────┐   │   │
│                 │   │   │ SURFACE 2 (#18263F)                      │   │   │
│                 │   │   └──────────────────────────────────────────┘   │   │
│                 │   └──────────────────────────────────────────────────┘   │
└─────────────────┴──────────────────────────────────────────────────────────┘
```

---

## 2. Canonical Color Contract (Dark Mode)

- **Canvas Global (`--gso-canvas-bg`)**: `#081220` (`rgb(8, 18, 32)`) — Lowest, darkest operational canvas.
- **Sidebar (`--gso-sidebar-bg`)**: `#0F1A2E` (`rgb(15, 26, 46)`) — Shell sidebar container.
- **Topbar (`--gso-topbar-bg`)**: `#0E1627` (`rgb(14, 22, 39)`) — Shell topbar container, height strictly `52px`.
- **Surface 1 (`--gso-surface-primary`)**: `#131E33` (`rgb(19, 30, 51)`) — Primary cards, containers, tables, toolbars, summary rails.
- **Surface 2 (`--gso-surface-secondary`)**: `#18263F` (`rgb(24, 38, 63)`) — Internal card regions, selected rows, detail rails, internal headers.
- **Surface Interactive (`--gso-surface-interactive`)**: `#1C2D49` (`rgb(28, 45, 73)`) — Hover and focused interactive states.
- **Overlay / Popover (`--gso-overlay`)**: `#18263F` (`rgb(24, 38, 63)`), 100% opaque, border `#2A405F`.
- **Border Default (`--gso-border`)**: `#22324D` (`rgb(34, 50, 77)`).
- **Functional Blue (`--gso-action-blue`)**: `#2D7CFF` (`rgb(45, 124, 255)`).
- **Brand Pink Signature (`--gso-brand-pink`)**: `#FF4FA3` (`rgb(255, 79, 163)`) — 2-3px active indicator rail & logo accent only.

---

## 3. Key Operational Rules

1. **Global Topbar Boundary**: Global Topbar ends strictly at `y = 52px`. Page headers (title, description, page tabs) belong to the canvas (`#081220`) and MUST NOT inherit topbar/sidebar background colors. No secondary blue band below topbar is permitted.
2. **Single User Identity Location**: User identity has exactly one permanent global location: ShellTopbar right edge (`.gso-topbar-actions`). Sidebar expand/collapse footers MUST NOT contain user avatars, user cards, or account triggers.
3. **Sidebar Footer**: Desktop sidebar footer contains ONLY the collapse/expand toggle button (`[‹] Recolher menu` / `[›]`).
