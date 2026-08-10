# Configuration PO V2.1 — Measurement map (instrumentado)

Data: 2026-08-09 · Viewport 1366×768 · tema escuro · persona QA administrativa local

Todas as medidas abaixo vêm de `getBoundingClientRect` e `getComputedStyle` no DOM do
runtime, capturadas por
`scripts/local-qa/capture-configuration-po-v2-1-shell.mjs` e
`scripts/local-qa/capture-configuration-po-v2-1-screen.mjs`.
**Nenhum valor é estimativa visual.** Fontes brutas:
`output/playwright/2026-08-09-configuration-po-v2-1/shell-gate.json` e
`.../screen-01-integrations.json`.

## Shell

| Elemento | Expandido | Recolhido | Com flyout | Alvo do handoff |
| --- | --- | --- | --- | --- |
| Sidebar (largura) | 240px | 56px | 56px | 240 / 56 ✔ |
| Topbar (altura) | 52px | 52px | 52px | faixa compacta ✔ |
| Breadcrumb (caixa) | 264×16 @ x=340 | — | — | — |
| Busca global (caixa) | 386×35 @ x=614 | 570×35 @ x=430 | igual | discreta ✔ |
| Conteúdo principal (x / largura) | 240 / 1126 | 56 / 1310 | 56 / 1310 | — |
| Item de sidebar (altura) | 36px | 36px | 36px | 36–40 ✔ |
| Flyout (caixa) | — | — | 280×111 @ x=52, y=66 | overlay ✔ |
| `document.scrollWidth` | 1366 | 1366 | 1366 | = viewport ✔ |

Deslocamento de layout ao abrir o flyout: `mainBefore` e `mainAfter` idênticos
(`x=56, y=52, 1310×716`), `shifted: false`.

## Tela 01 — Integrações

### Regiões (ordem vertical medida)

| Ordem | Região | x | y | largura | altura |
| --- | --- | --- | --- | --- | --- |
| A | Cabeçalho | 264 | 72 | 1078 | 69 |
| B | Painéis de provedor | 288 | 153 | 1030 | 308 |
| C | Governança (escopos + política) | 288 | 473 | 1030 | 161 |
| D | Eventos recentes (tabela) | 303 | 706 | 1000 | 79 |

Grid: B e C em duas colunas iguais (`repeat(2, minmax(0,1fr))`, gap 12px); D em largura
plena. Ordem vertical A→B→C→D confirmada pelos valores de `y`.

### Tipografia e controles

| Elemento | Medido | Faixa aprovada | Resultado |
| --- | --- | --- | --- |
| Título da tela | 24px / 28.8px | 22–26px | ✔ |
| Título de painel | 16px / 20px | 14–17px | ✔ |
| Título de seção | 15px / 18.75px | 14–17px | ✔ |
| Corpo | 12px / 16.2px | 12–13px | ✔ |
| Metadados | 11px / 14.85px | 11–12px | ✔ |
| Linha de tabela | 12px, 34px (vazia 48px) | 34–40px | ✔ |
| Altura de controle | 32px | 32–36px | ✔ |
| Padding interno de painel | 14px | 14–16px | ✔ |

### Contagens estruturais

| Verificação | Valor | Esperado |
| --- | --- | --- |
| Painéis de provedor | 2 | 2 equivalentes |
| Posições de métrica | 6 | 3 por painel |
| Trilho de KPIs presente | `false` | ausente |
| Colunas de eventos | Data e hora, Integração, Evento, Detalhes, Status, Executado por | 6 do blueprint |
| Overflow horizontal | `false` | ausente |

## Diagnósticos da captura

| Superfície | Console | Exceções | HTTP ≥400 | Falhas de requisição |
| --- | --- | --- | --- | --- |
| Shell (3 estados) | 0 | 0 | 0 | 0 |
| Tela 01 | 0 | 0 | 0 | 1 — busca de módulo do Vite dev abortada na navegação de login (`/src/features/navigation/MinimalAppShell.tsx`); artefato do dev server, não da aplicação |

## Pendências de medição

- 1440×900, 1024×768, 390×844 e tema claro: fora de escopo até as seis telas passarem no
  baseline de 1366×768 escuro.
- Telas 02 a 06: serão medidas quando cada uma entrar na sua fase.
