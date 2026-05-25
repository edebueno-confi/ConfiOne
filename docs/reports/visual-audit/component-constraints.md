# Component Constraints Audit

Data: 2026-05-25
Branch: `codex/p4-f1-visual-system-constraint-audit`
Escopo: auditoria documental e visual. Nenhuma UI runtime foi alterada.

## Diagnostico curto

O sistema visual tem duas camadas concorrentes:

1. `apps/web/src/components/ui.tsx`, que ainda carrega primitives genericas com radius alto, paineis grandes, drawers largos porem laterais e formularios inflados.
2. `apps/web/src/features/support/components/SupportWorkspacePrimitives.tsx` + `apps/web/src/index.css`, que criou primitives operacionais para Support, mas ainda fixa grid, rail, drawer e densidade por tokens globais rigidos.

Isso explica por que telas recentes chegam perto dos blueprints, mas travam quando a tarefa exige outra topologia. A refatoracao visual real precisa atacar primitives e tokens, nao apenas trocar classes dentro da page.

## Componentes auditados

| Componente | Origem principal | Padrao atual | Constraint visual | Impacto | Recomendacao futura |
|---|---|---|---|---|---|
| Button | `apps/web/src/components/ui.tsx`, `SupportWorkspacePrimitives.tsx` | `rounded-full` no generico; `rounded-[12px]` no Support; alturas `h-10`, `h-11`, `min-h-10` | Dois idiomas simultaneos: pill generico e botao operacional compacto | Botoes mudam de personalidade entre Admin, Support e Portal; alguns parecem maiores que o blueprint | Normalizar em `ActionButton` por dominio: compact, standard, primary, icon. Evitar `rounded-full` como default de produto |
| Select | `SelectInput` em `ui.tsx`; selects locais em Support | `h-11`, `rounded-2xl`, `px-4`; Support usa `h-10 rounded-[12px]` em varios pontos | Controls globais sao altos e arredondados demais para cockpit denso | Filtros e formularios ocupam altura excessiva; intake fica comprido | Criar token `--control-height-compact` e primitive `OperationalSelect` |
| ComboBox | Implementacoes locais, principalmente Knowledge/Admin | Sem primitive unica observada | Cada surface improvisa busca/filtro | Dificulta consistencia de altura, foco e densidade | Formalizar apenas quando houver 3 usos equivalentes |
| Input | `TextInput`, `SupportSearchInput`, classes locais | `h-11 rounded-2xl px-4`; Support `h-10` | Generico inflado versus Support compacto | Busca e formulario nao compartilham escala | Separar input editorial/admin de input operacional denso |
| Textarea | `TextareaInput`, `SupportComposerTextarea` | Generico `min-h-28 rounded-[24px]`; composer `min-height` por CSS | Textarea generico e grande; composer fixa altura minima de 9.5rem | Composer consome altura de thread em 900px; formularios em drawer ficam altos | Composer deve ter escala por modo e viewport; textarea de intake deve usar layout amplo, nao drawer estreito |
| Card/Panel | `Panel`, `ContextSubsidebarSection`, cards locais | Radius 18 a 28px, shadows frequentes, `bg-white/92` | Cardizacao vira idioma default | Admin e Customer surfaces ficam com caixas demais; rails perdem leitura | Criar guideline de quando nao usar card; substituir blocos por dividers e grupos sem caixa |
| Badge | `StatusPill`, `SupportBadge` | Uppercase, tracking alto, pill | Labels densos ficam visualmente barulhentos | Fila e detalhe acumulam muitas capsulas | Reduzir tracking e padrao uppercase em contexto de tabela/fila |
| Sheet/Drawer | `GovernedActionDrawer`, `SupportActionDrawer`, drawers locais | `GovernedActionDrawer` usa `w-[clamp(720px,50vw,860px)]`; Support drawer usa `22.5rem` ou `27.5rem` dentro do slot direito | Acoes principais viram lateral estreita ou painel que substitui rail | Intake e acoes complexas ficam comprimidos, embora sejam centrais | Definir `OperationalModal`, `DedicatedMode` e `ContextDrawer` como escolhas distintas |
| Modal/Dialog | Pouco formalizado | Drawer aparece como primeira escolha | Falta alternativa para acao central com formulario | Abertura de ticket usa drawer quando precisaria area maior | Criar modal operacional amplo para intake antes de refatorar formulario |
| Table | Tabelas locais em Admin/Knowledge | Mistura table real e listas em cards | Algumas tabelas ficam densas demais dentro de paineis arredondados | Leitura operacional perde largura util | Criar primitive `OperationalTable` com header sticky e densidade compacta |
| Tabs | Implementacoes locais | Pills/segments variados | Tabs competem com filtros e cards | Muitos recortes parecem chips decorativos | Unificar tabs de contexto e chips de filtro |
| Sidebar | `UnifiedEnvironmentNavigation.tsx`, shells por dominio | Sidebar fixa com muitos grupos visiveis | Ocupa largura constante e expande complexidade visual em todas as telas | Em telas de tarefa central, a sidebar compete com coluna secundaria | Manter, mas permitir modo compacto real em blueprints densos |
| RightRail | `SupportRightRail`, rails locais em Admin/Portal | Support rail `clamp(336px,20vw,372px)`; cards internos | Rail e forte, mas estreito para contexto rico | Contexto vira lista de cards rolavel; acoes competem com resumo | Rail deve ter largura por tarefa e conteudo, nao apenas token unico |
| FilterPanel | Filtros locais em Queue, Admin, Knowledge | Muitos selects empilhados | Padrao induz coluna esquerda com rolagem propria | Filtros comprimem a tela e duplicam informacao do topo | Consolidar filtros em toolbar + painel progressivo |
| PageHeader | `PageHeader` em `ui.tsx` e headers locais | `h1 text-3xl`, eyebrow com tracking alto | Grande para cockpit denso | Header consome altura e empurra conteudo operacional | Criar `OperationalPageHeader` compacto |
| MetricCard | `MetricCard`, `SystemMetricCard`, KPIs locais | Numeros grandes, cards isolados | Padrao de dashboard invade cockpit | Quebra hierarquia quando lista/conversa deveria dominar | Usar metricas como strip compacto, nao cards soltos |
| Composer | `SupportTicketComposerSection`, `SupportComposer` | Dockado, real, mas alto | Bom contrato funcional, ainda ocupa altura demais | Thread perde protagonismo em 900px | Compactar toolbar e altura minima; manter dock |
| FormField | `Field`, labels locais | Label grid com gap e descricoes | Formulario herda escala alta | Intake em drawer vira formulario longo e estreito | Criar `OperationalFormGrid` para formularios centrais |

## Padrões rigidos encontrados

### 1. Tendency to three columns

Origem:
- Docs de Support Queue e Ticket Workspace exigem 3 zonas para essas superficies.
- `SupportWorkspaceGrid` codifica `queuePanel`, `mainPane` e `rightRail/drawerPane`.
- Admin e Customer usam `WorkspaceSplit` e grids locais similares.

Problema:
- A regra correta para Support foi generalizada como reflexo visual. Nem toda acao ou tela precisa de tres colunas. Intake de novo ticket, por exemplo, e uma acao central de criacao, nao contexto lateral.

### 2. Drawer lateral como primeira escolha

Origem:
- `GovernedActionDrawer` em `ui.tsx`.
- `SupportActionDrawer` em `SupportWorkspacePrimitives.tsx`.
- Uso recorrente em Access, Tenants, Engineering, Internal Actions e Customer Portal Admin.

Problema:
- Drawer e adequado para detalhe auxiliar e edicao secundaria.
- Nao e adequado para formulario central com busca de tenant, contato, assunto, descricao, origem e contexto.

### 3. Radius e padding altos por default

Origem:
- `Panel`: `rounded-[26px]`, `p-5 sm:p-6`.
- `PageHeader`: `text-3xl`.
- `TextInput`: `h-11 rounded-2xl px-4`.
- `TextareaInput`: `rounded-[24px]`.
- Loading blocks com `rounded-[22px]` a `rounded-[28px]`.

Problema:
- A escala visual fica macia demais para cockpit operacional.
- Blueprints recentes usam radius menor e densidade mais controlada.

### 4. Cards em excesso

Origem:
- `Panel`, `SummaryStrip`, `MetricCard`, `ContextSubsidebarSection`, `SupportRailCard`.
- Classes locais repetindo `rounded-[16px] border bg-white shadow`.

Problema:
- Tudo vira objeto independente. A hierarquia da tarefa se perde.
- Rails e dashboards parecem colecoes de caixas, nao fluxo operacional.

### 5. Tokens existem, mas nao governam tudo

Origem:
- `index.css` tem bons tokens de Support, mas muitas classes locais ainda definem radius, shadow, px, py, font-size e min-height.

Problema:
- O Design System nao consegue corrigir escala por uma mudanca central.
- Refatoracoes visuais ficam caras e frágeis.

## Risco de mexer em components globais

Alterar `ui.tsx` diretamente pode quebrar Admin, Access, Tenants, Customer Portal Admin, Internal Actions e Engineering, porque esses componentes sao fallback real em muitas telas. O caminho seguro e:

1. Extrair primitives operacionais por dominio.
2. Migrar tela por tela.
3. So entao reduzir defaults genericos.
