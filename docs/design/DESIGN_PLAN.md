# DESIGN PLAN — Genius Support OS (design definido por Claude, executável pelo Codex)

Autor: Claude (define a linguagem visual). Data: 2026-07-22. Executor: Codex.
Escopo: sistema inteiro (`apps/web/src`), atenção especial ao Dashboard Gerencial. Responsividade TOTAL + menu mobile dedicado. Mascote Gênio e Avatar padrão em todo o sistema.
Complementa: `docs/reports/FORENSIC_AUDIT_2026-07-22.md` (achados com arquivo:linha).

Regras para o Codex: executar por fases (§K); em cada tela seguir a Definition of Done (§L). Backend é fonte da verdade; preservar RLS/tenant; sem dado inventado; sem push sem confirmar. Toda cor por TOKEN (zero hex em componente). Validar light E dark e larguras 375/768/1024/1440. NÃO usar o design system "aibrasil", NÃO usar o claude_design MCP — a linguagem visual é a definida aqui. Do mascote, usar apenas a ARTE fornecida (`genius.svg` / animações do zip).

---

## A. Identidade (definida)
Personalidade: cockpit executivo, premium, IA-First e confiável (Confi = confiança/dados; Aftersale = P&L/tempo real; Genius = humano/mascote). Menos "ERP", mais "sala de comando". Estética: superfícies calmas, tipografia forte, números como protagonistas, cor usada com intenção (destacar risco/atenção/saúde), dark premium de verdade.

## B. Design System (tokens canônicos — definir em index.css; formato light | dark)
Fonte ÚNICA de tokens. Aposentar `--color-*`, `--support-*`, `--genius-site-*` migrando consumidores. Mapear os `--minimal-*` existentes para estes nomes (não duplicar).

Marca / Ação (primária):
- `--brand-50` #eef2ff | #12203f · `--brand-100` #dfe6ff | #16264a
- `--brand-500` #4f6ef7 (primária) · `--brand-600` #3b5bdb (hover) · `--brand-700` #2f49b0
- `--action` = brand-600 (light) | brand-500 (dark); `--action-ink` #ffffff | #0b1120; `--action-weak` #eef2ff | #16264a; foco `--focus` = brand com 40% alpha.

Acento IA (assinatura Gênio, uso parcimonioso — chips de insight/IA, mascote):
- `--accent-500` #e63aa8 | #f062bd · `--accent-weak` #fdeaf5 | #351028. NUNCA como cor de dado neutro nem como 2º primário.

Neutros (slate):
- Light: `--surface` #ffffff · `--surface-2` #f6f8fb · `--surface-3` #eef1f6 · `--border` #e5e9f0 · `--border-strong` #d3d9e3 · `--text` #0f172a · `--text-2` #475569 · `--text-3` #94a3b8.
- Dark: `--surface` #0b1120 · `--surface-2` #111a2e · `--surface-3` #182338 · `--border` #1f2b45 · `--border-strong` #2c3a5a · `--text` #e7ecf5 · `--text-2` #9fb0c9 · `--text-3` #64748b.

Semânticos (distintos da marca — saúde/atenção/risco):
- Sucesso: `--success` #16a34a | #22c55e · `--success-weak` #dcfce7 | #0f2a1c
- Atenção: `--warning` #b45309 | #f59e0b · `--warning-weak` #fef3c7 | #2a1f08
- Risco: `--danger` #dc2626 | #f87171 · `--danger-weak` #fee2e2 | #2a1416
- Info/neutro: usa slate/brand-weak.

Elevação, raio, espaço, movimento:
- Sombra: `--shadow-sm` 0 1px 2px rgba(15,23,42,.06) | rgba(0,0,0,.5); `--shadow-md` 0 8px 24px -8px rgba(15,23,42,.14) | rgba(0,0,0,.55).
- Raio: `--radius-sm` 8px · `--radius` 12px · `--radius-lg` 16px · pill 999px.
- Espaço (base 4px): 1=4, 2=8, 3=12, 4=16, 5=20, 6=24, 8=32, 10=40, 12=48.
- Movimento: 150ms ease padrão; 200ms para painéis; SEMPRE respeitar `prefers-reduced-motion` (desligar animações não essenciais).

## C. Tipografia
- UI/corpo: Inter (fallback system-ui). Números/dados: `--font-mono` = ui-monospace/"JetBrains Mono" para tabelas e séries. (Confirmar se há fonte de marca; default Inter.)
- Escala: display 32/40 (número-herói de KPI), h1 24/32, h2 18/26, corpo 14/20, apoio 12/16, micro 11/14.
- Pesos: 700 (display/número-herói), 600 (títulos), 500 (label), 400 (corpo). Números SEMPRE `tabular-nums`.
- Formato pt-BR: moeda `Intl.NumberFormat('pt-BR', BRL)`, percentual com vírgula, datas dd/mm/aaaa, mês por extenso.

## D. Grade e responsividade (regras rígidas)
- Grid 12 col, gap 16px, largura de conteúdo confortável (não esticar cards).
- Máx. 3 zonas primárias; 3ª zona (rail) vira drawer <1280px.
- TODO track `fr` = `minmax(0, …)` (impede blowout). Corrigir: `AnalyticsConfigPage.tsx:107`, `AnalyticsCeoPage.tsx:91,101`, `CustomerPortalAdminPage.tsx:430,2063`, `BuildJournalPage.tsx:299,668`.
- Breakpoints: ≥1440 (4 zonas ok); 1280–1439 (rail→drawer); 1024–1279 (2 col); <1024 (1 col + nav mobile). Sem scroll horizontal global.
- Tabelas densas: coluna essencial + scroll horizontal com 1ª coluna fixa OU cards empilhados no mobile; NUNCA esconder dado para caber.

## E. Sidebar (colapsável, moderna, sem "cara de IA")
Base: `features/navigation/MinimalAppShell.tsx` (hoje 232px fixa, só mobile `:128,:179`).
- Dois estados desktop: EXPANDIDA 248px (ícone + rótulo + grupos) e RAIL 68px (ícone + tooltip). Toggle + atalho `Ctrl/Cmd+B`; persistir em `localStorage` (`gso.sidebar.collapsed`); transição 150ms.
- Topo: logo (expandida = wordmark Genius; rail = mascote pequeno). Rodapé: avatar do usuário + tema + Sair.
- Grupos (micro-cabeçalho 11px `--text-3`, ocultos no rail): Operação (Atendimento, Fila, Clientes) · Inteligência (Dashboard Gerencial) · Engenharia & Produto · Conhecimento · Administração (Contas, Portal, Áreas, Acessos, Sistema, Integrações).
- Corrigir ambiguidades: unificar "Visão geral" × "Dashboard gerencial"; "Início" e "Atendimento" com ícones/rótulos distintos.
- Item ativo: fundo `--brand-weak` + barra 2px `--brand-500` + `aria-current`. Item 40px alto, ícone 20px, alvo ≥44px no mobile.
- Navegação por PERMISSÃO real (do gate), não por `pathname.startsWith` (`minimal-navigation.ts:60-70`). Remover dead code `admin-shell/AdminLayout.tsx`.

## F. Componentes (kit único)
Consolidar `components/ui.tsx` (legado, 43 telas) + `minimal-ui.tsx` (5) num só; idem `states.tsx` + `minimal-states.tsx`. Padronizar raio/sombra/densidade (hoje convivem `rounded-[24px]`+sombra fixa e flat).
- Button/CTA: `primary` (fundo `--action`, texto `--action-ink`), `secondary` (borda `--border-strong`), `danger`, `ghost`. Altura 36-40px, raio `--radius`, foco `--focus`. Um primário por bloco; topo à direita.
- KpiCard (ÚNICO; hoje 3): número-herói display, label 14, hint 12 `--text-3`, delta (▲/▼ % com cor semântica), `tone`, slot `info` (fórmula/fonte). Raio `--radius-lg`, padding 16.
- Tag/Badge pill 11px; Table com cabeçalho 11px uppercase `--text-3`, `tabular-nums`, zebra `--surface-2`, linha 40px; ChartCard/CollapsibleChartCard; Field/Input/Select 36-40px; States (loading/empty/error/permissão) com mascote (§O).
- Remover eyebrows placeholder do `PageHeader` (`ui.tsx:87`): nada de `eyebrow="portal"/"auth"`.

## G. DASHBOARD GERENCIAL (prioridade — impressionar por visual e dado)
Arquivos: `features/analytics/*`.
- G1 Topbar: título + período global + selo de origem/frescor + CTAs "Exportar" (secondary) e "Sincronizar" (primary). Abas viram segmented control que NÃO quebra linha (hoje `flex-wrap`, `AnalyticsShell.tsx:116`).
- G2 KPIs-herói (4/linha, `minmax(0,1fr)`): número display, label, hint, delta vs período anterior, tom semântico, `info` com fórmula/fonte. Por aba: Executiva/Financeiro/Comercial/CS conforme dados reais.
- G3 Blocos (≤2 col, cada um com cabeçalho que explica o número): previsibilidade, aging por faixa, maiores devedores, financeiro×CS, categorias, tendência. Situação (status) ≠ aging (dias) — não repetir.
- G4 Confiança do dado (o que impressiona): selo origem (API/planilha/HubSpot) + data/hora + status por bloco; cobertura de reconciliação (casados/sem correspondência/ambíguos); "indisponível" explícito; normalizar escala de percentual num ponto único (hoje ÷100 em `analytics-model.ts:504,507` vs 0-1 em `:527,569`); erros em `--danger` (hoje azul: `AnalyticsShell.tsx:25,108`, `AnalyticsLogsPage.tsx:27`, `AnalyticsFilters.tsx:28`); sucesso não em amarelo (`AnalyticsConfigPage.tsx:105,117`, `AnalyticsCeoPage.tsx:137`).
- G5 Gráficos (`charts/AnalyticsCharts.tsx`): paleta por token (remover hex `:23-29`); eixos com contraste dark-safe.
- G6 Pontual: portal id hardcoded → runtime-config (`AnalyticsCeoPage.tsx:162-163`); remover componente morto `ReconciliationQualityTable` (`:122-124`); grids `fr` com `minmax(0,…)`.

## H. Correções por tela (checklist com evidência)
- SUPORTE (fila/tickets) — PRIORIDADE: portar `.support-*` (`index.css:252`–~1900) para tokens + bloco dark (brancos/gradiente/cinzas fixos `:302,:850,:1060,:1379,:1587,:1706`; cinzas `#65738f/#536480/#43516c`; modal `padding-left:19.5rem` `:394`). Redesenhar tabela de 8 colunas (`:1541`) sem esconder policy/source (`:1575-1580`). Rail → drawer <1280.
- BUILD JOURNAL: remover paleta hex (`BuildJournalAI.tsx:8-29,:223-340`; grids `:299,668`) → tokens + dark.
- ADMIN (Tenants/Portal/Áreas/Acessos): blindar grids (`minmax(0,…)`), consolidar KPIs/tabelas, densidade/leitura; `AccessPage.tsx:824`.
- PORTAL/HELP: remover eyebrows placeholder; dark do markdown (hex em help-center/knowledge/product-docs).
- Charts/states/ui: unificação (§F).

## I. Copy / CTA / KPI
pt-BR acentuado, humano, sem jargão técnico (nada de nome de coluna/RPC/"backend"/"Postgres" na tela). CTA com verbo claro, um primário por contexto, destrutivo confirma. KPI = rótulo + unidade + hint + fonte; nunca número solto.

## J. Paridade light/dark (checklist)
Nenhuma cor fixa; tudo por token; testar cada tela nos 2 temas. Focos: `.support-*` (quebrado), build-journal, eixos de gráfico, mascote. Scrims/modais sem medidas fixas dependentes da sidebar (`index.css:394`).

## K. Fases e ordem (Codex)
- Fase 0 — Fundação: tokens (§B) + kit único (§F); sidebar colapsável (§E); grids `minmax(0,…)`; cor semântica de erro/sucesso. typecheck/build verdes.
- Fase 1 — Dashboard Gerencial (§G) completo, light/dark, com selos de origem/frescor/confiança e KPI único.
- Fase 2 — Suporte para tokens + dark + tabela + responsivo (§H, §N).
- Fase 3 — Admin, Build Journal (des-hardcode), Portal/Help, Config/Logs.
- Fase 4 — Mascote/Avatar no sistema todo (§O); QA visual autenticado claro/escuro + responsivo; copy; acessibilidade WCAG AA.

## L. Definition of Done (por tela)
1) Zero cor fixa; só tokens. 2) Light e Dark com paridade (screenshots dos 2). 3) Sem scroll horizontal global; nenhuma coluna com dado escondida; grids `minmax(0,…)`. 4) KPIs/tabelas/CTAs no kit único; KPI com rótulo/unidade/fonte. 5) Copy pt-BR sem jargão/eyebrow; erro vermelho, sucesso sem amarelo. 6) a11y: foco visível, `aria-current`, contraste AA, interativos focáveis. 7) `web:typecheck`/`web:build` verdes. 8) Responsivo 375/768/1024/1440. 9) Mascote/Avatar conforme §O onde aplicável.

## N. Responsividade total + menu mobile exclusivo (obrigatório)
Meta: toda tela usável e bonita em 375px; menu mobile dedicado em TODAS as áreas (interno, portal, público).
- P1 Portal sem navegação mobile: `CustomerPortalPage.tsx:247` (`aside hidden lg:flex`) — abaixo de 1024px o cliente perde nav, troca de conta, avisos e Sair. Criar top bar + drawer mobile do portal, replicando nav (`:263-285`), troca de tenant (`:299-320`), avisos (`:321-378`), conta/Sair (`:381-392`).
- P1 Portal `h-screen` (`:245`) → `h-[var(--app-viewport-height)]` (bug 100vh iOS).
- P2 Suporte "buraco" 768–1279px: grid 3-col só ≥1280 (`index.css:3366`), fila `SupportTicketQueue.tsx:55` e rail `SupportTicketContextRail.tsx:26` `hidden xl:flex`. No tablet some fila + metadados. Prover abas/acordeão de fallback + acesso à fila por drawer.
- P2 Alvos de toque ≥44px: logout `MinimalAppShell.tsx:175` (32px), avatar `:166` (28px), abas/CTA analytics `AnalyticsShell.tsx:120,103`, abas/paginação suporte `SupportTicketQueue.tsx:89,107,129`.
- P3 Tabela de acessos esconde colunas ≥3 no mobile (`index.css:3383-3388`) → "ver detalhe".
- Menu mobile (spec): drawer/bottom-sheet com os grupos da §E, alvos ≥44px, cabeçalho com mascote + tema + usuário + Sair, disponível em qualquer rota; foco preso, `aria-expanded/controls`, fecha por gesto/backdrop.

## O. Mascote Gênio + Avatar padrão (sistema todo)
Fonte do mascote = APENAS a ARTE fornecida no zip "Recreação do mascote Genius" (`genius.svg` + o SVG/animações dos `.dc.html`). NÃO adotar o design system "aibrasil" que veio junto; NÃO usar o claude_design MCP. O sistema visual é o desta especificação (§B/§C). Codex: extrair a arte para `apps/web/public/brand-assets/genius/` e portar para o componente React.
- Componente único `<GeniusMascot expression size surface interactive animated>`: `expression` (happy | wink | wow | think | shrug), `surface` (loading | empty | success | avatar | inline), `size` (sm/md/lg/xl). Animações do fonte (float, wave, twinkle, fumaça, confete=success, barras=loading, thought=think). `prefers-reduced-motion` desliga animação. a11y: `role="img"`+`aria-label`; `interactive` → `<button>` focável.
- Cor do mascote: usar a arte oficial; garantir contraste nos 2 temas (o navy/magenta do SVG inline atual some no dark — usar a arte + contorno/halo por token).
- Inserção (hoje sem mascote): `components/states.tsx` (`LoadingState/EmptyState/ErrorState` `:24,66,91,109` — texto puro) → mascote (paridade com `minimal-states`, leva o Gênio ao portal/público); header interno e header público (`public-ui.tsx:389` troca o "G"); portal mobile (novo, §N); assinatura de IA (mascote pequeno junto a insights); erro/acesso negado/sessão expirada (shrug/wow). Login/Home/Sync já usam — manter.
- Avatar padrão (não existe hoje; 4+ implementações ad hoc): criar `<Avatar name email src size>` — foto quando houver (`avatar_url`), senão iniciais em círculo (cor determinística por hash, legível nos 2 temas), com fallback opcional ao mascote (`surface="avatar"`). Substituir `MinimalAppShell.tsx:14/166/175`, `SupportWorkspacePage.tsx:387/1240/1427/7569`; adicionar onde falta (Inbox, portal `:382-383`, responsáveis, autores de comentário). Alvo ≥44px no mobile.

## M. Referências
- Achados detalhados (arquivo:linha): `docs/reports/FORENSIC_AUDIT_2026-07-22.md`.
- Contratos backend: `docs/VIEW_RPC_CONTRACTS.md` (não alterar sem atualizar).
