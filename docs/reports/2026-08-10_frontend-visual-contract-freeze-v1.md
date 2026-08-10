# Relatório Delta — Macro-lote 01: Frontend Visual Contract Freeze

> **Data:** 2026-08-10
> **Branch:** `codex/admin-configuration-visual-v1`
> **HEAD ao iniciar:** `35d8df6` · **HEAD ao encerrar:** `7be4130`
> **Status do macro-lote:** PARCIAL. Não declarado concluído. Ver seção 9.

---

## 1. Diagnóstico encontrado

O handoff do Antigravity descreve corretamente o *sintoma*, mas não a causa. Inspeção
do repositório real apontou quatro causas estruturais distintas.

### 1.1 Não existiam vários shells — existia um shell sem contrato de página

`AdminConsoleShell`, `SupportWorkspaceShell`, `CsWorkspaceShell` e `AccountSelfShell`
são wrappers de permissão de ~17 linhas que delegam para um único `MinimalAppShell`.
O problema real está em `MinimalAppShell.tsx:774`:

```tsx
<main className="gso-main-canvas min-h-0 min-w-0 flex-1 overflow-hidden">{children}</main>
```

Sem padding, sem background próprio, sem slot de page header, sem slot de tabs e com
`overflow-hidden`. Cada rota era **obrigada** a construir o próprio contêiner de altura,
rolagem, superfície e cabeçalho. Resultado medido: **10 implementações distintas de page
header**, **8 wrappers de canvas** e **3 implementações de tabs**.

A prova do sintoma estava no próprio CSS corretivo. `settings-ui.css:99-102` admite:

> "remove o fundo concorrente que fazia cada tela de Configurações parecer pertencer a
> um produto diferente"

Patch local repetido no lugar de primitive — exatamente o antipadrão da regra 25 do
Context Pack.

### 1.2 Sete vocabulários de token paralelos

Conviviam `--one-*` (84 defs), `--minimal-*` (78), `--gso-*` (46), `--ui-*` (51),
`--color-*` (~105), `--help-*` (~110), `--support-*` (39) e uma família sem prefixo.
Havia **9 nomes diferentes** para "superfície de card" e **6** para "canvas da página",
com valores divergentes.

O caso mais grave: `.gso-ui` (Configurações) declarava uma **paleta neutra própria no
tema claro**, não derivada do Brand System:

| Papel | Confi One | `.gso-ui` (antes) |
|---|---|---|
| canvas | `#F4F7FB` | `#F8F9FB` |
| borda | `#D7E1EE` | `#E8EAF0` |
| texto primário | `#13233A` | `#111827` |
| ação | `#2D7CFF` | `#2563EB` |
| accent | `#FF4FA3` (pink) | `#7C3AED` (roxo) |

No escuro derivava de `--one-*`; no claro, não. Por isso Configurações parecia outro
produto especificamente no modo claro.

### 1.3 Quatro tokens referenciados que nunca existiram

`--gso-surface-1`, `--gso-surface-2`, `--gso-gutter` e `--one-overlay-scrim` eram
consumidos mas jamais declarados. O impacto mais sério foi na Central Pública:

```css
--help-surface-strong: var(--gso-surface-1, #131E33);
--help-panel:          var(--gso-surface-2, #18263F);
```

Como os tokens não existiam, o **fallback escuro vencia sempre** — inclusive no tema
claro. A Central Pública renderizava cards `#131E33` com texto `#13233A`.

Somado a isso, `--help-consultation-ink` resolvia para `#FFFFFF` sobre
`--help-consultation-canvas` `#F7FAFF`: **contraste 1.03:1**. O `<h1>` do hero e o texto
digitado na busca estavam literalmente invisíveis.

### 1.4 Bloco de tema escuro com auto-sobrescrita

`:root[data-theme='dark']` declarava o mesmo conjunto duas vezes. A segunda cópia vencia
a cascata e reintroduzia valores fora do Brand System: `--danger: #f87171` (contra
`#EF4444`), `--text-3: #64748b`, `--text: #e7ecf5`.

---

## 2. Design System consolidado

### 2.1 Contrato semântico único (`apps/web/src/index.css`)

`--one-*` passa a ser a **única** fonte de decisão visual estrutural. As demais famílias
permanecem como aliases de compatibilidade, mas derivam de `--one-*`.

| Grupo | Tokens |
|---|---|
| Surfaces | `--one-sidebar-bg`, `--one-topbar-bg`, `--one-page-header-bg`, `--one-panel-bg`, `--one-panel-elevated-bg`, `--one-control-bg`, `--one-surface-hover`, `--one-surface-selected`, `--one-overlay-scrim` |
| Texto | `--one-text-subtle`, `--one-text-inverted`, `--one-text-link` (somados aos primary/secondary/muted/disabled já existentes) |
| Bordas | `--one-border-focus` (somado a subtle/default/strong) |
| Spacing | `--one-space-page-x`, `-page-y`, `-section-gap`, `-component-gap`, `-control-gap` |
| Layout | `--one-layout-sidebar-expanded`, `-sidebar-collapsed`, `-topbar-height`, `-page-header-pad-y`, `-control-height`, `-control-height-sm`, `-tabs-height`, `-detail-panel` |
| Radius | `--one-radius-control`, `-panel`, `-modal`, `-pill` |
| Elevação | `--one-shadow-panel`, `--one-shadow-modal` |
| Escala de z | `--one-z-base`, `-sticky`, `-topbar`, `-dropdown`, `-flyout`, `-overlay` |
| Tipografia | page-title, page-subtitle, eyebrow, section-title, card-title, body, label, helper, table-header, metric, meta |

### 2.2 Duas decisões registradas como exceção consciente

**Page Title = 18px / 600, não 24px / 700.** O Context Pack pede 24/700, mas o Dashboard
Gerencial — definido como golden reference — usa 18/600, e as sete telas de Configurações
também. Optou-se por **seguir a golden reference** e tokenizar 18/600. A escala de 24px
permanece disponível como `--one-font-metric`, usada em valores de métrica.

**Régua horizontal = `clamp(1rem, 1.8vw, 1.75rem)`.** Até 2026-08-10 o *cabeçalho* do
Dashboard usava `--app-gutter` (`clamp(1rem, 2.5vw, 2.5rem)`) e o *conteúdo* usava
`clamp(1rem, 1.8vw, 1.75rem)`: título e tabela não começavam na mesma coordenada dentro
da própria referência. Adotou-se a régua do conteúdo, e `--app-gutter` passou a derivar
dela. É a única mudança perceptível no Dashboard neste macro-lote, e é uma correção de
alinhamento, não um redesenho.

### 2.3 Primitives (`apps/web/src/components/page/page-primitives.tsx`)

`PageShell` · `PageShellChrome` · `PageShellBody` · `PageCanvas` · `PageHeader` · `PageTabs`

`PageTabs` é o primeiro componente React de abas do produto, com navegação por teclado
WAI-ARIA (setas, Home/End, roving tabindex). `UiPage` e `UiPageHeader` viraram aliases
finos dos primitives — Configurações deixou de ter contrato próprio.

---

## 3. Alterações realizadas

| Commit | Escopo |
|---|---|
| `97cc6e2` | Tokens: contrato semântico, correção dos 4 tokens fantasma, tema claro da Central Pública, remoção da auto-sobrescrita do dark, `--ui-*` derivando de `--one-*`, unificação das tabs, régua horizontal |
| `ecf6cf5` | Primitives compartilhados, `SidebarAccount`, remoção do menu do usuário do header, rodapé mobile completo, correção dos 2 scripts de QA |
| `2cccb97` | Harness de QA visual `capture-visual-contract-freeze-v1.mjs` |
| `7be4130` | Régua horizontal e escala de título em Conhecimento, editor e chrome do shell |

---

## 4. Hardcodes removidos

**Eliminados:**

- 4 tokens fantasma (`--gso-surface-1`, `--gso-surface-2`, `--gso-gutter`, `--one-overlay-scrim`).
- Paleta neutra paralela de `.gso-ui` no tema claro (10 valores literais).
- Bloco duplicado de `[data-theme='dark']` (12 declarações redundantes, 4 divergentes).
- Duplicação de `.gso-ui-tabs`/`.gso-ui-tab` entre dois arquivos, com `!important`.
- `border-radius: 10px` literal em `.gso-ui-card` → `--one-radius-panel`.
- `padding: 1.15rem 1.5rem 1.5rem` em `.gso-ui-page` → tokens de spacing.
- `clamp(1rem, 1.8vw, 1.75rem)` literal em `high-density.css` → `--one-space-page-x`.
- `var(--accent-500, #e63aa8)` no sublinhado da aba do Dashboard → `--selection-accent`.
- `px-5` local em Conhecimento e no editor de artigo → `--one-space-page-x`.
- `text-lg font-semibold` local no `<h1>` de Conhecimento → tipografia canônica.
- `background: var(--gso-canvas-bg, #081220) !important` → `--one-canvas-bg`.

**Preservados com justificativa:**

- SVG inline do `GeniusMascot` (95 hex): geometria e paleta da ilustração.
- Paleta `.tone-*` / `.mark-*` do editor TipTap: são **conteúdo persistido** no artigo,
  não decisão de chrome. Tokenizar quebraria artigos salvos.
- `.knowledge-rich-editor`: o corpo do artigo renderiza no tema claro fixo da Central
  Pública, por contrato; não deve seguir o dark do shell.
- `style={{}}` do Recharts (`ResponsiveContainer` exige dimensão inline) e barras de
  progresso com largura derivada de dado.
- `features/build-journal/*` (~613 ocorrências): superfície editorial fora do shell
  operacional. Recomenda-se isolar a paleta em módulo próprio — **não feito neste lote**.

---

## 5. Sidebar / Header

**Global Header** agora concentra apenas: botão de navegação mobile, voltar, trilha de
navegação e a busca global "Pergunte ao Gênio". Zero elementos de identidade.

**Sidebar** concentra marca, navegação e identidade no rodapé.

O `SidebarAccount` renderiza o popover em **portal no `document.body`**, porque
`.gso-sidebar` declara `isolation: isolate` — um filho posicionado não sobe acima do
conteúdo apenas por `z-index`. Foi o mesmo problema já resolvido para o flyout de
navegação com `z-index: 80 !important`.

Estados validados: expandido (avatar + nome + função + chevron), recolhido (avatar +
tooltip), popover idêntico nos dois. Itens: Meu perfil (`/meu-perfil`), Preferências
(modal com `ThemeToggle`), Sair da plataforma. Nenhuma funcionalidade inventada.

O divisor decorativo do rodapé foi removido: ele separava uma faixa **vazia**.

**Regressão de acessibilidade evitada:** abaixo de 1024px a sidebar não existe
(`hidden lg:grid`). O rodapé do drawer mobile ganhou os mesmos três itens; sem isso,
`/meu-perfil` e as Preferências ficariam inalcançáveis em tablet e celular.

**Contrato revogado:** `docs/GENIUS_GLOBAL_SHELL_VISUAL_CONTRACT_V1.md:48-50` proibia
explicitamente identidade no rodapé da sidebar. O documento já estava marcado
SUPERSEDED no `PROJECT_STATE`; a decisão de produto de 2026-08-10 o revoga formalmente.

---

## 6. Central Pública

A política light-only **já existia e funcionava** em três camadas redundantes (script
anti-flash em `index.html:41-77`, `isPublicSurfacePath` em `lib/theme.ts:96`,
`ThemeProvider enabled=false` em `AuthBootstrap.tsx:19-21`). Não havia `ThemeToggle`
público nem `@media (prefers-color-scheme)` afetando `/help`.

O problema não era o tema — era que os **tokens do tema claro estavam quebrados**.
Corrigido: a Central Pública passou a ter contrato próprio de tema claro, sem derivar de
token do shell interno.

| Token | Antes (resolvia para) | Agora |
|---|---|---|
| `--help-surface-strong` | `#131E33` (escuro) | `#FFFFFF` |
| `--help-panel` | `#18263F` (escuro) | `#F7FAFE` |
| `--help-ink-strong` | `#FFFFFF` | `#0B182C` |
| `--help-link` | `#2D7CFF` (3.4:1) | `#1A63D8` (5.6:1) |
| `--help-surface` | `#F4F7FB` | `#F1F5FB` |

Verificado em navegador: com o SO em **dark**, `/help/genius` renderiza
`data-theme="light"`, `--help-surface-strong = #FFFFFF` e `--help-ink-strong = #0B182C`.
O título do hero, antes invisível, está legível.

---

## 7. Matriz visual

Evidências em `output/playwright/visual-contract-freeze-v1/` (41 capturas +
`matrix.json`). Harness: `scripts/local-qa/capture-visual-contract-freeze-v1.mjs`.

**Agregado:** 41 capturas · 0 erros · **0 overflow horizontal** · **0 ocorrências de
identidade duplicada na topbar** · **1 `<h1>` por tela em todas as rotas internas**
(antes, as sete telas de Configurações não tinham nenhum).

### Alinhamento do título (1440×900, após correção)

| Rota | x do `<h1>` | font-size | `<h1>` |
|---|---|---|---|
| `/admin/analytics` | 266 | 18px | 1 |
| `/admin/knowledge` | **260** | 18px | 1 |
| `/admin/knowledge/new` | 266 | 18px | 1 |
| `/admin/access` | 266 | 18px | 1 |
| `/admin/settings/integrations` | 266 | 18px | 1 |
| `/admin/settings/dashboard-sources` | 266 | 18px | 1 |
| `/admin/settings/sync-history` | 266 | 18px | 1 |
| `/admin/settings/brands` | 266 | 18px | 1 |
| `/admin/settings/help-center` | 266 | 18px | 1 |
| `/meu-perfil` | 266 | 18px | 1 |

Antes da correção: 268/266/265 (Configurações e Dashboard), 260 (Conhecimento), **240**
(Usuários e acessos, encostado na sidebar).

### Shell e Central Pública

| Evidência | Resultado |
|---|---|
| Sidebar 240px, topbar 52px iniciando em x=240 | L-shell íntegro |
| Sublinhado da aba ativa | `rgb(255, 79, 163)` = Genius Pink |
| Popover de identidade, sidebar aberta | 1 nó `role="menu"` |
| Popover de identidade, sidebar recolhida | 1 nó `role="menu"` |
| `/help/*` com SO em light | `data-theme=light` |
| `/help/*` com SO em **dark** | `data-theme=light` |
| `/help/genius` em 390×844 | sem overflow |

Viewports cobertos: 1920×1080, 1440×900, 1366×768 (interno) e 390×844 (público).

---

## 8. Validações

| Comando | Resultado |
|---|---|
| `npm run web:typecheck` | **0 erros** |
| `npm run contracts:typecheck` | pass |
| `npm run web:build` | pass (1.5–2.1s) |
| `npm run lint` | **0 erros**, 196 warnings (baseline pré-existente de `rules-of-hooks` / `exhaustive-deps`) |
| `npm run local:qa:secret-scan` | pass |
| `git diff --check` | limpo |
| QA visual autenticado | 41 capturas, 0 erros |

**`npm run security:audit:prod` falha** — ver pendência 9.1.

---

## 9. Pendências

### 9.1 BLOQUEADOR DE FERRAMENTA — `package.json` com chaves duplicadas

`package.json` declara **duas vezes** `security:audit:prod` (linhas 46 e 99) e
`repository:check-root` (linhas 45 e 100). Em JSON a última chave vence, e as vencedoras
apontam para `scripts/local-qa/security-audit-prod.mjs` e
`scripts/local-qa/check-root-hygiene.mjs`, **que não existem**. As definições corretas
(`scripts/ci/*.mjs`) existem e são as perdedoras.

Efeito: o hook `pre-commit` roda `quality:staged`, que falha, e **nenhum commit passa**.
Os quatro commits deste lote usaram o escape hatch oficial `GENIUS_QUALITY_SKIP` com
motivo registrado, e o gate foi executado manualmente.

Classificação: fora do escopo deste macro-lote (tooling, não frontend). **Não corrigido.**
Correção sugerida: remover as duas declarações duplicadas das linhas 99-100.

### 9.2 Ambiente local de QA — deriva de relógio

A primeira tentativa de QA autenticado falhou com `JWT issued at future`, apesar de host
e containers reportarem o mesmo horário UTC. Resolvido com
`docker restart supabase_rest_… supabase_auth_…`. Não é causado por nenhuma alteração
deste lote, mas vai reincidir.

Além disso, `qa.local.platform-admin@genius.local` (documentado em `LOCAL_QA_AUTH.md`)
**não existe** no banco local; o harness usa `LOCAL_QA_ADMIN_EMAIL` do `.env.local.qa`.

### 9.3 Divergências visuais remanescentes

- `/admin/knowledge`: título em x=260 contra 266 do restante (6px). O `px-5` foi
  removido do JSX, mas algo ainda vence a cascata — não localizado.
- Central Pública: o botão "Buscar" usa `AppButton` → `--brand-600` **#3B5BDB**, índigo
  que não pertence ao Confi One Brand System. Também aparece em "Entrar no portal".
- Central Pública: `markdown.tsx:739-741` usa `text-violet-700` / `text-violet-600`
  (roxo Tailwind cru) no bloco "Leia também".
- Central Pública: tipografia do hero em 65.6px, fora da escala tokenizada. Defensável
  para superfície editorial, mas não tokenizada.
- `HelpCenterArticlesPage.tsx:114` envolve a página inteira em um único card com outros
  cards dentro — o padrão CANVAS → CARD DA PÁGINA → CARDS proibido pela seção 10 do DS.

### 9.4 Escopo não executado deste macro-lote

- Normalização de filtros, tabelas, cards e formulários das telas internas para os
  primitives (`FilterBar`, `DataPanel`, `DataTable`, `MetricStrip`).
- Migração das páginas para consumir `PageShell`/`PageTabs` de fato — hoje os primitives
  existem e Configurações os consome via alias, mas Conhecimento, Acessos e Dashboard
  ainda montam a própria estrutura.
- QA visual em **tema escuro**. A execução ocorreu com o usuário de QA em tema claro;
  o modo escuro não foi capturado.
- Reforço de identidade da Central Pública (logotipo/wordmark, `buildHelpCenterTheme` e
  `resolvePublicLogoUrl` continuam sendo código morto).
- Atualização de `CONFI_ONE_BRAND_SYSTEM_V1.md`, `PROJECT_STATE.md` e
  `DOCUMENTATION_LEDGER.md`.

### 9.5 PRODUCT_OWNER_DECISION_REQUIRED

- **"Genius Returns" continua visível ao usuário final** na Central Pública:
  `HelpCenterPage.tsx:46` e `:183` (fallback de `brandName`) e no copy do hero
  (`HelpCenterHomePage.tsx:435`). É o nome do espaço de conhecimento vindo do backend ou
  resíduo de marca? Se for cliente legítimo, não é bug.
- Grafia pública canônica: `index.html` usa "Confi One"; `HelpCenterPage.tsx:101/330/334`
  usa "ConfiOne". Além disso `index.html:93` ainda expõe **"Genius Support OS"** no
  `og:description`, visível em qualquer preview de link compartilhado.
- Escala de raio: `--radius*` valem `0px` enquanto o código aplica 602 `rounded-[Npx]`
  com 20 raios diferentes, e uma guarda global com `!important` zera botões e inputs.
  O sistema de raio está efetivamente morto e precisa de decisão.

---

## 10. Git

- Branch: `codex/admin-configuration-visual-v1` (sem upstream, sem push).
- HEAD inicial: `35d8df6` · HEAD final: `7be4130`.
- Commits locais: `97cc6e2`, `ecf6cf5`, `2cccb97`, `7be4130`.
- `git status`: working tree limpo.
- Nenhum push, merge, rebase, reset, deploy, migration remota ou alteração de secret.
- Nenhuma alteração em banco, RPC, view, RLS, contrato ou Edge Function.

---

## 11. Próximo macro-lote recomendado (proposta, não executado)

**MACRO-LOTE 02 — ADOÇÃO DOS PRIMITIVES E NORMALIZAÇÃO DE COMPONENTES INTERNOS**

Justificativa: o contrato existe e está tokenizado, mas as páginas ainda não o consomem.
Sem a adoção, a dívida volta no próximo lote de produto.

Escopo sugerido, em ordem:

1. **Desbloquear o gate** — corrigir as chaves duplicadas de `package.json` (9.1). É
   pré-requisito: sem isso todo commit depende de escape hatch.
2. **Migrar Conhecimento, Acessos e Dashboard para `PageShell`/`PageCanvas`/`PageTabs`**,
   eliminando os wrappers próprios. Fecha o resíduo de 6px de 9.3.
3. **Normalizar filtros, tabelas e cards** para `UiToolbar` / `UiTable` / `UiCard`,
   removendo `OperationalFilterStack` e o deck de filtros manual do Conhecimento.
4. **Decidir e implementar a escala de raio** (9.5) — hoje é o maior foco de hardcode
   restante, com 602 ocorrências e 20 valores.
5. **QA visual em tema escuro** nos mesmos viewports, fechando a matriz.
6. **Central Pública: identidade** — ligar `buildHelpCenterTheme` e
   `resolvePublicLogoUrl`, substituir os azuis concorrentes pelo Brand System, corrigir o
   card-da-página, e resolver as decisões de marca de 9.5.
7. **Atualizar a documentação canônica** com o contrato implementado.

Fora de escopo, a registrar separadamente: isolar a paleta do Build Journal (~613
hardcodes em 5 arquivos) e revisar os 196 warnings de hooks.

---

## Regra final

Este macro-lote **não é declarado concluído**. Conforme a regra do prompt, ainda existem
superfícies do shell com padrões estruturais divergentes sem exceção de produto
documentada — especificamente as listadas em 9.3 e 9.4.
