# P4 Visual System Constraint Audit

Data de execucao: 2026-05-25
Branch: `codex/p4-f1-visual-system-constraint-audit`
Objetivo: auditar por que as telas ainda nao seguem fielmente os blueprints aprovados e identificar constraints de componentes, tokens, wrappers, specs e padroes visuais.
Escopo: auditoria e documentacao. Nenhuma UI runtime, backend, migration, Supabase ou contrato de negocio foi alterado.

## Impeccable usado

Comandos aplicados como lente de auditoria:
- `/impeccable audit`: qualidade tecnica, scroll, responsividade, anti-patterns.
- `/impeccable critique`: julgamento de hierarquia, carga cognitiva e adequacao ao trabalho.
- `/impeccable layout`: estrutura, ritmo, grid e densidade.
- `/impeccable distill`: remocao de complexidade e cardizacao.
- `/impeccable harden`: textos longos, overflow, estados reais e viewports.
- `/impeccable polish`: consistencia visual e alinhamento ao Design System.
- `/impeccable typeset`: escala tipografica, pesos e controles inflados.
- `/impeccable extract`: primitives e tokens que precisam virar contrato visual.

## Ambiente e evidencia

- App local: `http://127.0.0.1:4173`
- Viewport: `1600x900`
- Fixture: `npm run supabase:qa:local-functional-fixture`
- Browser: Playwright local
- Pasta de screenshots: `docs/reports/visual-audit/screenshots/`
- Metricas por rota: `docs/reports/visual-audit/route-metrics/`

## Telas auditadas

| Tela | Screenshot | Viewport | Scroll global | Scroll horizontal | Severidade |
|---|---|---:|---:|---:|---|
| `/support/queue` | `support-queue.png` | 1600x900 | nao | nao | P1 |
| `/support/queue` com intake | `support-queue-intake-drawer.png` | 1600x900 | nao | nao | P1 |
| `/support/tickets/:ticketId` | `support-ticket-detail.png` | 1600x900 | nao | nao | P1 |
| `/support/customers` | `support-customers.png` | 1600x900 | nao | nao | P2 |
| `/support/customers/:tenantId` | `support-customer-detail.png` | 1600x900 | nao | nao | P2 |
| `/admin/knowledge` | `admin-knowledge.png` | 1600x900 | nao | nao | P2 |
| `/admin/system` | `admin-system.png` | 1600x900 | nao | nao | P2 |
| `/admin/tenants` | `admin-tenants.png` | 1600x900 | nao | nao | P2 |
| `/admin/customer-portal` | `admin-customer-portal.png` | 1600x900 | nao | nao | P2 |
| `/portal` | `portal.png` | 1600x900 | nao | nao | P3 |
| `/portal/tickets` | `portal-tickets.png` | 1600x900 | nao | nao | P3 |
| `/portal/tickets/:ticketId` | `portal-ticket-detail.png` | 1600x900 | nao | nao | P3 |
| `/portal/help` | `portal-help.png` | 1600x900 | nao | nao | P3 |
| `/internal-actions` | `internal-actions.png` | 1600x900 | nao | nao | P2 |
| `/engineering` | `engineering.png` | 1600x900 | nao | nao | P2 |
| `/help/genius` | `help-genius.png` | 1600x900 | sim, esperado em pagina publica | nao | P3 |

## Diagnostico geral

O produto ja tem boa base funcional: as telas carregam com dados reais, nao apresentaram scroll horizontal global e respeitam boundaries de runtime. O problema nao e falta de dados ou contrato. O problema e uma camada visual que ainda mistura:

1. primitives genericas infladas;
2. primitives operacionais de Support parcialmente extraidas;
3. specs antigas que normalizaram tres colunas e drawers;
4. tokens CSS que fixam largura, radius e altura em vez de expressar uma escala por tarefa.

Essa mistura faz a implementacao antiga continuar influenciando a forma das telas, mesmo quando os docs dizem que blueprint e objetivo operacional devem vencer.

## Constraints encontradas

### C1. Tres colunas viraram reflexo

`SupportWorkspaceGrid` exige `queuePanel`, `mainPane` e `rightRail/drawerPane`. Isso e correto para fila e ticket workspace, mas vira trava quando a acao principal precisa de outro formato. O intake de novo ticket e o caso mais claro.

### C2. Drawer lateral e usado como solucao generica

`GovernedActionDrawer` e `SupportActionDrawer` aparecem como padrao de acao governada. O drawer e util para detalhe auxiliar, mas nao para formulario central. A largura `22.5rem` ou `27.5rem` do Support substitui o rail, nao cria uma superficie de criacao confortavel.

### C3. Primitives globais ainda sao grandes demais

`PageHeader` usa `text-3xl`; `Panel` usa `rounded-[26px]` e `p-5/p-6`; `TextInput` e `SelectInput` usam `h-11 rounded-2xl`; `TextareaInput` usa `rounded-[24px]`. Isso funciona para telas administrativas soltas, mas distancia o cockpit dos blueprints.

### C4. Cardizacao excessiva

O mesmo vocabulario de card aparece em Admin, Support, Engineering e Portal: borda, white surface, radius 16 a 28px, shadow leve. Isso torna tudo igualmente importante e enfraquece lista, thread e composer.

### C5. Tokens bons, mas incompletos

`index.css` ja possui tokens de Support, mas muita UI ainda hardcoda `rounded-[16px]`, `px-4`, `py-3`, `text-[12px]`, shadows e alturas. O sistema nao tem alavanca central para reduzir densidade.

### C6. Scroll interno funciona, mas depende de encaixes frageis

As rotas operacionais evitaram scroll global. Ainda assim, algumas areas mostram containers scrollaveis com `overflow-x:auto` e casos fragilizados, como `admin-knowledge` com um container de `clientHeight=0`.

## Caso obrigatorio: `/support/queue`, fluxo Abrir ticket

### O que acontece hoje

O botao `Abrir ticket` troca o rail direito por um painel lateral de intake. A tela permanece em tres zonas: filtros/lista no centro e formulario no slot direito. As metricas registraram tres containers com scroll interno, incluindo o painel de intake com `scrollHeight=1061` e `clientHeight=607`.

### Avaliacao

Manter o drawer atual nao e adequado como solucao final. Ele e seguro funcionalmente, mas comprime uma acao central da operacao. O operador precisa selecionar tenant/contato, informar assunto, descricao, prioridade/origem e revisar regras em largura curta. A informacao de apoio vira texto rolavel dentro do mesmo painel.

### Solucao futura recomendada

Prioridade recomendada:

1. Modal operacional amplo, com largura aproximada de 920 a 1080px, duas colunas internas e footer fixo.
2. Se o intake crescer, modo dedicado temporario dentro da pagina, ocultando rail e maximizando formulario.
3. Split layout temporario apenas se a lista precisar continuar visivel para copiar contexto.

Nao recomendo manter drawer estreito. Tambem nao recomendo criar pagina nova pesada agora.

## Recomendacao para `/support/tickets/:ticketId`

O contrato visual esta correto: fila curta, conversa central, rail direito. O gargalo e densidade. Em 1600x900, a thread central ficou com `clientHeight=396` e rail com rolagem propria. A conversa precisa dominar mais.

Correcoes futuras:

1. Reduzir a fila esquerda em detalhe ou permitir modo colapsado.
2. Compactar header e composer sem perder clareza entre resposta publica e nota interna.
3. Manter rail, mas permitir trocar blocos por tabs internas ou progressive disclosure.
4. Evitar abrir acoes complexas como drawer estreito quando elas exigirem formulario.

## Componentes que travam fidelidade visual

Detalhe completo em `docs/reports/visual-audit/component-constraints.md`.

Principais blockers:
- `GovernedActionDrawer`
- `SupportActionDrawer`
- `PageHeader`
- `Panel`
- `TextInput` / `SelectInput` / `TextareaInput`
- `MetricCard`
- `SupportWorkspaceGrid`
- `SupportRailCard`
- `SupportQuickActionGrid`

## Padroes que devem ser abandonados

- Drawer como primeira resposta para qualquer acao governada.
- Card para todo grupo de informacao.
- Header grande em cockpit operacional.
- `rounded-2xl/3xl` como default de produto.
- Metric cards como topo padrao de qualquer tela.
- Tres colunas como regra fora das superficies que realmente precisam.
- Formularios centrais encaixados em rail.

## Riscos de mexer em components globais

Alterar `apps/web/src/components/ui.tsx` diretamente pode quebrar muitas telas de Admin e areas internas. A migracao precisa ser incremental:

1. criar primitives operacionais novas;
2. migrar telas prioritarias;
3. reduzir uso dos fallbacks;
4. so depois mexer nos defaults globais.

## Proposta de ordem dos proximos lotes

1. P4-F.2, Support Intake Layout Decision.
2. P4-F.3, Support Ticket Workspace Density Pass.
3. P4-F.4, Operational Primitives Extraction.
4. P4-F.5, Admin Surface Constraint Pass.
5. P4-F.6, Engineering/Internal Actions Density Pass.

## Validacoes executadas

- `npm run supabase:qa:local-functional-fixture`
- Browser local com Playwright em `1600x900`
- Captura de screenshots e metricas por rota
- `git diff --check`
- `git status --short`
