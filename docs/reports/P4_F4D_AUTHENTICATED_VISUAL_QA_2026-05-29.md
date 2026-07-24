# P4-F.4D Authenticated Visual QA 2026-05-29

## Resumo executivo

QA visual autenticado do Support Workspace P4-F.4D executado em `2026-05-29` na branch `codex/project-forensic-recovery-audit`, com fixture local populada e browser em `1672x941`, mesma dimensao dos blueprints principais de suporte.

Resultado inicial: **aprovado com ajustes**.
Resultado apos o lote `P4-F.4D Novo Ticket Visual Alignment`: **aprovado**.
Resultado apos a revisao final pixel-a-pixel em `2026-06-01`: **aprovado para fechamento do worktree P4-F.4D**.

Nao ha divergencia P0. A implementacao preserva a estrutura operacional principal, nao apresenta scroll global nem overflow horizontal nos estados capturados, e usa dados reais da fixture local. A divergencia P1 original do fluxo `Novo ticket` foi corrigida em `2026-05-31`: o formulario passou a caber no viewport de referencia com evidencias acima do footer, e o rail lateral foi substituido por resumo operacional compacto com SLA indisponivel quando o contrato nao entrega prazo pre-criacao.

## Branch e ambiente

- Branch: `codex/project-forensic-recovery-audit`
- App local: `http://127.0.0.1:5173/`
- Supabase local: ativo em `127.0.0.1`
- Fixture: `local-support-workspace`
- Usuario autenticado: `qa.local.support-manager-a@genius.local`
- Senha local previsivel da fixture: `Local-QA-Manager-A-2026!`
- Ticket principal capturado: `05466847-50e7-4475-8390-21c658ffb1f7`
- Viewport: `1672x941`

## Screenshots gerados

- `docs/reports/visual-audit/screenshots/p4-f4d-support-queue.png`
- `docs/reports/visual-audit/screenshots/p4-f4d-support-queue-new-ticket.png`
- `docs/reports/visual-audit/screenshots/p4-f4d-support-queue-new-ticket-aligned.png`
- `docs/reports/visual-audit/screenshots/p4-f4d-ticket-conversation.png`
- `docs/reports/visual-audit/screenshots/p4-f4d-ticket-classification.png`
- `docs/reports/visual-audit/screenshots/p4-f4d-ticket-knowledge.png`
- `docs/reports/visual-audit/screenshots/p4-f4d-ticket-evidence.png`
- `docs/reports/visual-audit/screenshots/p4-f4d-ticket-status.png`
- `docs/reports/visual-audit/screenshots/p4-f4d-ticket-related.png`
- `docs/reports/visual-audit/screenshots/p4-f4d-ticket-internal-actions.png`

## Metricas por rota

| Estado | Rota | Viewport | Scroll global | Overflow horizontal | Evidencia |
| --- | --- | --- | --- | --- | --- |
| Fila populada | `/support/queue` | `1672x941` | nao | nao | `p4-f4d-support-queue.metrics.json` |
| Novo ticket | `/support/queue` | `1672x941` | nao | nao | `p4-f4d-support-queue-new-ticket.metrics.json` |
| Novo ticket alinhado | `/support/queue` | `1672x941` | nao | nao | `p4-f4d-support-queue-new-ticket-aligned.metrics.json` |
| Conversa | `/support/tickets/:ticketId` | `1672x941` | nao | nao | `p4-f4d-ticket-conversation.metrics.json` |
| Classificacao | `/support/tickets/:ticketId` | `1672x941` | nao | nao | `p4-f4d-ticket-classification.metrics.json` |
| Conhecimento | `/support/tickets/:ticketId` | `1672x941` | nao | nao | `p4-f4d-ticket-knowledge.metrics.json` |
| Evidencias | `/support/tickets/:ticketId` | `1672x941` | nao | nao | `p4-f4d-ticket-evidence.metrics.json` |
| Status | `/support/tickets/:ticketId` | `1672x941` | nao | nao | `p4-f4d-ticket-status.metrics.json` |
| Relacionados | `/support/tickets/:ticketId` | `1672x941` | nao | nao | `p4-f4d-ticket-related.metrics.json` |
| Acionamentos | `/support/tickets/:ticketId` | `1672x941` | nao | nao | `p4-f4d-ticket-internal-actions.metrics.json` |

## Comparacao por estado

### Fila operacional

Blueprint: `docs/design/blueprint/suporte/1 - fila operacional - sem seleção.png`

Status: aprovado.

- Mantem sidebar, titulo, KPIs, filtros, tabela densa e footer paginado.
- Sem scroll global e sem overflow horizontal.
- Diferencas aceitas: dados da fixture local usam nomes/titulos reais e contagens diferentes do blueprint.
- P2: textos longos de cliente/responsavel truncam mais cedo que no blueprint, especialmente em nomes da fixture local.

### Novo ticket

Blueprint: `docs/design/blueprint/suporte/10 - novo ticket.png`

Status: aprovado apos ajuste P1.

- Estrutura geral de tela cheia e footer fixo existe.
- P1 corrigido: o estado alinhado exibe informacoes do ticket, assunto/contexto, descricao e evidencias acima do footer no viewport `1672x941`.
- P1 corrigido: o rail lateral deixou de exibir cards de orientacao e agora apresenta resumo operacional do ticket em criacao, cliente/conta/solicitante, prioridade/severidade/classificacao/motivo e SLA como `Indisponivel` quando o contrato nao fornece prazo antes da criacao.
- Evidencia atual: `docs/reports/visual-audit/screenshots/p4-f4d-support-queue-new-ticket-aligned.png`.
- P2: CTA superior difere do blueprint (`Fechar` em vez de acoes de rascunho/menu), aceitavel se o contrato de rascunho ainda nao existir.

### Ticket Workspace: conversa

Blueprint: `docs/design/blueprint/suporte/4 - conversas - tratativa.png`

Status: aprovado com ajustes P2.

- Mantem sidebar, inbox, header, tabs, conversa, composer e rail direito.
- Sem scroll global e sem overflow horizontal.
- Conversa e composer permanecem no centro, com dados populados, nota interna e trilha longa.
- P2: a inbox esquerda mostra paginacao e recorte `9-14 de 14`, divergindo da sensacao do blueprint que prioriza primeiros tickets; aceitavel porque vem da ordenacao/paginacao real da fixture.
- P2: subtitulo da marca e nome do usuario truncam na sidebar em `1672x941`.

### Classificacao

Blueprint: `docs/design/blueprint/suporte/7 - conversas - classificar.png`

Status: aprovado.

- Rail direito vira painel de classificacao, mantendo conversa e composer visiveis.
- Campos obrigatorios, prioridade, severidade e footer de acao aparecem sem scroll global.
- Diferenca aceita: conteudo real da fixture exige scroll interno do painel.

### Conhecimento

Blueprint: `docs/design/blueprint/suporte/8 - conversas - conhecimento.png`

Status: aprovado.

- Painel direito preserva busca/vinculos de Knowledge sem criar rota nova.
- Sem scroll global e sem overflow horizontal.
- Diferencas aceitas: artigos e motivos aparecem conforme permissao/fixture real.

### Evidencias

Blueprint: `docs/design/blueprint/suporte/6 - conversas - evidencias.png`

Status: aprovado.

- Painel direito lista evidencias reais da fixture e mantem contexto da conversa.
- Sem scroll global e sem overflow horizontal.
- Diferenca aceita: arquivos e contagens seguem a fixture local.

### Status

Blueprint: `docs/design/blueprint/suporte/5 - conversas- status.png`

Status: aprovado.

- Painel de alteracao de status aparece no rail direito com opcoes governadas.
- Sem scroll global e sem overflow horizontal.
- Diferenca aceita: transicoes e motivos dependem do status real `waiting_engineering`.

### Relacionados

Blueprint: `docs/design/blueprint/suporte/4 - conversas - tratativa.png` e estados relacionados da serie `4-9`.

Status: aprovado.

- Vínculos de Knowledge e engenharia aparecem no rail direito.
- Sem scroll global e sem overflow horizontal.
- Diferenca aceita: quantidade e ordem derivam da fixture.

### Acionamentos

Blueprint: `docs/design/blueprint/suporte/9 - conversas - acionamentos.png`

Status: aprovado.

- Painel de acionamentos internos abre no rail direito, com formulario e handoff existente.
- Sem scroll global e sem overflow horizontal.
- Diferenca aceita: detalhes do acionamento dependem da fixture e dos contratos existentes.

## Divergencias por severidade

### P0

Nenhuma.

### P1

Nenhuma divergencia P1 remanescente apos o lote `P4-F.4D Novo Ticket Visual Alignment`.

### P2

1. Sidebar: subtitulo da marca e usuario logado truncam em `1672x941`.
2. Fila e inbox: dados reais longos da fixture truncam mais cedo que no blueprint.
3. Novo ticket: acoes superiores ainda nao refletem rascunho/menu do blueprint, aceitavel enquanto nao houver contrato de rascunho.

## Aprovado

- Fila operacional populada.
- Ticket Workspace com conversa, composer, tabs e rail.
- Painéis de classificacao, conhecimento, evidencias, status, relacionados e acionamentos.
- Arquitetura de scroll: sem scroll global e sem overflow horizontal nos 9 estados.
- Uso de dados populados da fixture local.
- Revisao final Impeccable em `2026-06-01`: sem P0/P1 novo em fidelidade, densidade, proporcao fila/conversa/rail, composer, tabs, acoes rapidas, copy tecnica, estados `Indisponivel` e ausencia de acoes falsas.

## Precisa correcao

- Sem correcao P1 pendente no escopo P4-F.4D. O item remanescente de `Novo ticket` e P2: acoes superiores de rascunho/menu continuam fora do escopo enquanto nao houver contrato de rascunho.

## Riscos restantes

- O QA usou fixture local e nao valida staging/producao.
- As acoes superiores de rascunho/menu do blueprint permanecem como P2 aceito por ausencia de contrato atual; nao foi criada acao fake.
- Ajustes P2 de truncamento em nomes longos podem ser tratados em backlog visual futuro, sem bloquear P4-F.4D.

## Recomendacao

**Aprovar P4-F.4D.**

Nao ha bloqueador P0/P1 remanescente para fechamento do worktree visual P4-F.4D. Preparar commit com o escopo visual/documental consolidado.
