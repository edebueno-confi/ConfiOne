# Configuration PO V2.1 — Gate do shell (1366×768, tema escuro)

Data: 2026-08-09
Branch: `codex/admin-configuration-visual-v1`
Escopo: shell transversal às seis telas. **Nenhuma tela de conteúdo foi alterada neste lote.**

## 1. O que foi corrigido

O fidelity delta (seção 8) apontou a topbar como região ausente nas seis telas. A
auditoria do código mostrou que a topbar **existia** em `MinimalAppShell.tsx`, mas
estava desligada em desktop por `@media (min-width: 1024px) { .gso-topbar { display: none } }`
em `apps/web/src/index.css`. Não foi preciso reconstruir o shell: foi preciso religar a
região e recompô-la conforme o blueprint.

| Item | Antes | Depois |
| --- | --- | --- |
| Topbar em desktop | oculta por CSS | primitive compartilhada `ShellTopbar`, 52px |
| Breadcrumb | rótulo único da rota, dentro da página (`UiPageHeader`) | trilha real `GeniusOS / Configurações / <tela>` na topbar; a trilha da página foi removida para não duplicar |
| Busca global | dentro da sidebar | na topbar, discreta, capability preservada |
| Controle de tema | escondido no menu de conta da sidebar | na topbar, como no blueprint |
| Identidade do usuário | apenas no rodapé da sidebar | rodapé da sidebar + topbar |
| Recolher menu | ícone no topo direito da sidebar | ação `Recolher menu` no rodapé, com Ctrl/Cmd+B e persistência preservados |
| Flyout do rail recolhido | translúcido; itens herdavam a largura de 56px do rail | overlay opaco, itens em largura plena |
| Botão de menu mobile | visível em 1366 (a utilidade `lg:hidden` perdia para a cascata de `.gso-topbar-icon-button`) | regra dedicada, oculto a partir de 1024px |

Preservado sem alteração: largura expandida de 240px, recolhida de 56px, comportamento
de overlay do flyout, atalho de teclado, foco e persistência em `localStorage`.

## 2. Taxonomia da sidebar — item da seção 8 do delta, resolvido

O delta classificou a divergência de agrupamento como *a verificar*, não como bug. A
verificação foi feita: autenticando a persona administrativa local real, a medição do
DOM retorna os grupos `["Painel", "Central de Ajuda", "Configurações"]`.

Esses grupos são produzidos por `features/navigation/minimal-navigation.ts` a partir do
screen catalog, dos grants e do estado de release — não são hardcode. A taxonomia
ilustrada no blueprint (`Inteligência / Conteúdo / Operação CX / Governança /
Administração`) é o que um conjunto de grants mais amplo produz.

**Decisão:** a arquitetura visual da sidebar segue o blueprint (agrupamento, densidade,
ícones, headings, item ativo, rodapé); o conteúdo do menu continua derivado do modelo de
permissões. Nenhum grant foi alterado para produzir screenshot.

## 3. Medição instrumentada do DOM

Fonte: `output/playwright/2026-08-09-configuration-po-v2-1/shell-gate.json`, produzido por
`scripts/local-qa/capture-configuration-po-v2-1-shell.mjs`. São medidas reais de
`getBoundingClientRect`, não estimativa visual.

| Elemento | Expandido | Recolhido | Com flyout |
| --- | --- | --- | --- |
| Sidebar (largura) | 240px | 56px | 56px |
| Topbar (altura) | 52px | 52px | 52px |
| Conteúdo principal (x / largura) | 240 / 1126 | 56 / 1310 | 56 / 1310 |
| Item de navegação (altura) | 36px | 36px | 36px |
| Ação `Recolher menu` | presente, y=724 | presente | presente |
| Flyout | ausente | ausente | x=52, y=66, 280×111 |
| `document.scrollWidth` | 1366 | 1366 | 1366 |
| Item ativo | `Integrações` | — | — |

Alvos do handoff: sidebar 240/56 ✔; itens de sidebar 36–40px ✔ (36px); topbar compacta ✔.

## 4. Prova de que o flyout é overlay

O retângulo do conteúdo principal foi medido antes e depois de abrir o submenu:

```
mainBefore: { x: 56, y: 52, width: 1310, height: 716 }
mainAfter:  { x: 56, y: 52, width: 1310, height: 716 }
shifted: false
flyoutRendered: true
```

O flyout começa em x=52, sobre a faixa de 56px da sidebar, e não desloca nem redimensiona
o conteúdo. `document.scrollWidth` permanece igual à viewport: sem overflow horizontal.

## 5. Gate do shell

| Critério | Resultado | Evidência |
| --- | --- | --- |
| SIDEBAR WIDTH MATCH | **SIM** | 240px expandida, 56px recolhida, medidos |
| TOPBAR MATCH | **SIM** | faixa de 52px com voltar, breadcrumb, busca, tema e identidade |
| ACTIVE STATE MATCH | **SIM** | `aria-current="page"` em `Integrações`, com fundo tonal |
| DENSITY MATCH | **SIM** | itens de 36px, breadcrumb de 13px, topbar de 52px |
| FLYOUT OVERLAY MATCH | **SIM** | overlay opaco sobre o rail, itens em largura plena |
| NO LAYOUT SHIFT | **SIM** | `shifted: false`, sem overflow horizontal |

**Veredito: shell aprovado no baseline 1366×768 escuro.** Liberado para iniciar a tela 01.

## 6. Evidências

- `output/playwright/2026-08-09-configuration-po-v2-1/runtime/shell-admin-expanded-1366-dark.png`
- `output/playwright/2026-08-09-configuration-po-v2-1/runtime/shell-admin-collapsed-1366-dark.png`
- `output/playwright/2026-08-09-configuration-po-v2-1/runtime/shell-admin-flyout-1366-dark.png`
- `output/playwright/2026-08-09-configuration-po-v2-1/shell-gate.json` (medidas, hashes SHA-256 e diagnósticos)

Diagnósticos da captura: 0 erros de console, 0 exceções de página, 0 falhas de requisição,
0 respostas HTTP ≥ 400.

## 7. Validações executadas

| Comando | Resultado |
| --- | --- |
| `npm run web:typecheck` | aprovado (exit 0) |
| `npm run contracts:typecheck` | aprovado |
| `npm run lint` | 0 erros, 182 avisos — mesmo total anterior ao lote; nenhum aviso nos arquivos alterados |
| `npm run web:build` | aprovado |
| `npm run local:qa:secret-scan` | `{"tracked_files_scanned":2188,"matches":0,"secrets":false}` |
| QA visual 1366×768 escuro | aprovado, ver seção 5 |

O typecheck e o build não rodam no sandbox Linux desta sessão porque os symlinks do
workspace npm foram criados no Windows e não resolvem no mount. Todas as validações acima
foram executadas no ambiente real do repositório, em Windows.

## 8. Arquivos alterados

| Arquivo | Alteração |
| --- | --- |
| `apps/web/src/features/navigation/MinimalAppShell.tsx` | primitive `ShellTopbar`; busca sai da sidebar; `Recolher menu` no rodapé |
| `apps/web/src/features/navigation/minimal-navigation.ts` | `resolveMinimalBreadcrumb` derivado do mesmo modelo de rotas da sidebar |
| `apps/web/src/features/settings/ui/UiPageHeader.tsx` | remove a trilha da página (agora pertence à topbar) |
| `apps/web/src/index.css` | topbar de 52px religada em desktop; estilos de topbar, breadcrumb e rodapé; flyout opaco; correção de largura dos itens do flyout |
| `scripts/local-qa/capture-configuration-po-v2-1-shell.mjs` | novo — captura e medição do gate do shell |

## 9. Limitações e pendências

- Validado apenas em **1366×768 escuro**, conforme a ordem obrigatória. 1440, 1024, 390 e
  tema claro só depois das seis telas passarem no baseline.
- O `measurement map` completo da V2.1 ainda cobre só o shell; será estendido tela a tela.
- Os checks remotos da PR #34 continuam não consultados.
- Nenhum merge, deploy, push, migration ou alteração de dados operacionais.

## 10. Próximo ciclo

Tela 01 — Integrações, conforme as seções 5 a 9 do meta-prompt: remover o trilho de KPIs
inventado, reconstruir os dois painéis equivalentes com a mesma primitive, restaurar
"Permissões e escopos" e "Política de segurança" e implementar a região "Eventos
recentes", mesmo vazia.
