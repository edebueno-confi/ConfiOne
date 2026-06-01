# Worktree Visual/Blueprint Recovery Closure 2026-05-29

## Escopo

Fechamento do worktree visual/documental herdado de `codex/p4-true-support-visual-refactor`, executado na branch `codex/project-forensic-recovery-audit`.

Este lote nao criou feature nova, migration, schema, RLS, grant, RPC, view ou edge function. O runtime Supabase nao foi alterado.

## Inventario executado

- `git status --short`
- `git diff --stat`
- `git diff --name-status`
- `git ls-files -o --exclude-standard`
- inventario de blueprints em `docs/design/blueprint/`
- inventario de screenshots e route metrics em `docs/reports/visual-audit/`
- comparacao por hash entre PNGs antigos e novos reorganizados
- leitura de `PRODUCT.md`, `DESIGN.md` e referencia Impeccable para produto
- leitura de `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md`
- leitura de `docs/reports/P4_SUPPORT_WORKSPACE_BLUEPRINT_COMPLIANCE_2026-05-25.md`

## Classificacao das alteracoes

| Area | Decisao | Justificativa |
| --- | --- | --- |
| `apps/web/src/features/support/*` | manter | Alteracoes correspondem ao relatorio P4-F.4D e aos blueprints aprovados de fila, novo ticket, conversa, tabs, composer e rails de acoes. Nao mudam contrato de dados nem backend. |
| `apps/web/src/index.css` | manter | CSS operacional necessario para densidade, scroll interno, tabs, composer, modal de novo ticket e rail direito conforme blueprint. |
| `scripts/ci/wait-for-supabase-ready.mjs` | fora de escopo deste lote, manter | Alteracao pertence ao lote runtime Supabase anterior e ja foi validada; nao toca UI nem backend de produto. |
| `docs/OPERATIONAL_CONTROL_PLANE_V1.md` | manter | Documento canonico de planejamento futuro, sem implementacao. |
| `docs/reports/OPERATIONAL_CONTROL_PLANE_V1_AUDITORIA_E_PROPOSTA_2026-05-25.md` | manter | Evidencia de auditoria que originou o plano canonico. |
| `docs/reports/P4_SUPPORT_WORKSPACE_BLUEPRINT_COMPLIANCE_2026-05-25.md` | manter | Relatorio tecnico que justifica a frente visual P4-F.4D. |
| `docs/reports/visual-audit/route-metrics/*.json` | manter | Metricas historicas rastreaveis; devem permanecer junto das screenshots restauradas. |
| CSVs `deleted-*.csv` na raiz | remover com justificativa | Inventarios locais de limpeza fora do projeto, contendo caminhos absolutos da maquina e sem valor como documentacao canonica do produto. |
| `docs/reports/.serena/` | remover com justificativa | Configuracao local de ferramenta dentro de pasta de relatorios; nao e evidencia de produto nem documento canonico. |

## Blueprints

### Mantidos por reorganizacao com hash identico

| Origem antiga | Destino canonico |
| --- | --- |
| `docs/design/blueprint/Canais Internos.png` | `docs/design/blueprint/admin/Canais Internos.png` |
| `docs/design/blueprint/conceder artigo.png` | `docs/design/blueprint/admin/conceder artigo.png` |
| `docs/design/blueprint/vincular artigo.png` | `docs/design/blueprint/admin/vincular artigo.png` |
| `docs/design/blueprint/suporte/fila operacional - sem seleção.png` | `docs/design/blueprint/suporte/1 - fila operacional - sem seleção.png` |
| `docs/design/blueprint/suporte/fila opercaional - 1 item selecionado.png` | `docs/design/blueprint/suporte/2 - fila opercaional - 1 item selecionado.png` |
| `docs/design/blueprint/suporte/fila opercaional -todos selecionados.png` | `docs/design/blueprint/suporte/3 - fila opercaional -todos selecionados.png` |
| `docs/design/blueprint/suporte/conversa - tratativa.png` | `docs/design/blueprint/suporte/4 - conversas - tratativa.png` |
| `docs/design/blueprint/suporte/novo ticket.png` | `docs/design/blueprint/suporte/10 - novo ticket.png` |

### Mantidos como fontes canonicas novas

- `docs/design/blueprint/suporte/5 - conversas- status.png`
- `docs/design/blueprint/suporte/6 - conversas - evidencias.png`
- `docs/design/blueprint/suporte/7 - conversas - classificar.png`
- `docs/design/blueprint/suporte/8 - conversas - conhecimento.png`
- `docs/design/blueprint/suporte/9 - conversas - acionamentos.png`
- `docs/design/blueprint/suporte/Clientes B2B/*`

### Removidos com justificativa

- `docs/design/blueprint/tickets e conversas.png`: substituido por blueprints por estado em `docs/design/blueprint/suporte/4-9`.
- `docs/design/blueprint/suporte/acionamentos geral.png`: substituido por `docs/design/blueprint/suporte/9 - conversas - acionamentos.png`, que representa o painel correto dentro da conversa.

## Screenshots

As delecoes de `docs/reports/visual-audit/screenshots/*.png` foram rejeitadas como fechamento valido. As 38 screenshots versionadas foram restauradas porque sao evidencia historica e mantem rastreabilidade com os route metrics JSON.

Classificacao:
- evidencias historicas restauradas: screenshots P4-F2, P4-F3, P4-F4B, P4 true e rotas gerais;
- evidencias regeneraveis: route metrics JSON e futuros screenshots de browser QA;
- lixo confirmado: nenhum PNG historico versionado foi removido neste lote.

Observacao atualizada: os screenshots `p4-f4d-*` foram regenerados nos lotes seguintes de QA visual autenticado. O estado `Novo ticket` alinhado esta registrado em `docs/reports/visual-audit/screenshots/p4-f4d-support-queue-new-ticket-aligned.png`.

## Support Workspace

Status: manter alteracoes visuais P4-F.4D.

Achados:
- fila operacional: linha inteira clicavel com foco por teclado, mantendo checkbox para selecao em massa;
- novo ticket: copy operacional e layout em tela cheia alinhados ao blueprint;
- ticket workspace: conversa, tabs, composer e rail direito seguem os blueprints de conversa;
- composer: toolbar atua sobre o textarea localmente, sem backend novo;
- acoes rapidas: paines continuam no rail direito, sem nova rota;
- dados: leitura e escrita seguem contratos existentes; nao houve mudanca de schema, RPC ou permissao.

Fechamento final: a revisao visual pixel-a-pixel P4-F.4D foi executada em `2026-06-01` sobre os screenshots atuais e blueprints aprovados. Nao restou P0/P1; P2 aceitos foram mantidos como backlog visual sem acao falsa.

## Arquivos removidos neste lote

- `deleted-codex-non-today-sessions-2026-05-26.csv`
- `deleted-codex-old-sessions-2026-05-26.csv`
- `deleted-omd-psd-files-2026-05-26.csv`
- `deleted-regenerable-caches-2026-05-26.csv`
- `docs/reports/.serena/`

## Arquivos restaurados neste lote

- `docs/reports/visual-audit/screenshots/*.png` versionados, total de 38 arquivos restaurados.

## Validacoes executadas

- `npm run contracts:typecheck`: passou.
- `npm run web:typecheck`: passou.
- `npm run web:build`: passou.
- `npm run documentation:validate:internal-docs`: passou sem bloqueios; manteve alertas documentais conhecidos.
- `git diff --check`: passou; apenas avisos de normalizacao LF/CRLF do Git no Windows.

Confirmacao de escopo:
- nenhuma alteracao em `supabase/`;
- nenhuma migration criada;
- nenhuma correcao de RLS, grant, policy, function, `search_path` ou storage neste lote.

## Proximo lote recomendado

Preparar commit do fechamento visual/documental P4-F.4D na branch `codex/project-forensic-recovery-audit`, preservando o escopo sem backend/Supabase.
