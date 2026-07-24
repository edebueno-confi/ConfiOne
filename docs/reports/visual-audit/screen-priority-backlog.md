# Screen Priority Backlog

Data: 2026-05-25
Branch: `codex/p4-f1-visual-system-constraint-audit`

## P0

Nenhuma tela apresentou P0 visual bloqueante nesta auditoria. As rotas carregaram, sem scroll horizontal global e sem erro cru visivel no estado auditado.

## P1

### 1. `/support/queue` intake de novo ticket

Problema: o fluxo `Abrir ticket` substitui o rail por painel lateral e comprime uma acao central de criacao. O drawer tem rolagem propria e campos longos em largura curta.
Impacto: operador precisa preencher contexto critico em area secundaria, com baixa leitura de hierarquia e muito scroll.
Recomendacao: substituir por modal operacional amplo ou modo intake dedicado. Nao manter drawer como solucao final.

### 2. `/support/tickets/:ticketId`

Problema: conversa, fila curta e rail seguem corretos conceitualmente, mas a thread central fica com apenas 608px de largura e 396px de altura util em 1600x900.
Impacto: thread perde protagonismo, principalmente em tickets longos.
Recomendacao: reduzir fila esquerda quando em detalhe, compactar composer e permitir rail por modo contextual.

### 3. Primitives globais infladas

Problema: `PageHeader`, `Panel`, `TextInput`, `SelectInput`, `TextareaInput` e `GovernedActionDrawer` usam escala grande e radius alto.
Impacto: telas operacionais que ainda dependem de fallback generico ficam distantes dos blueprints.
Recomendacao: criar primitives operacionais compactas antes de mexer nos defaults globais.

## P2

### 4. Admin Knowledge

Problema: cockpit funcional, mas denso em cards, toolbar e metrica. Um container scrollavel aparece com `clientHeight=0`, sinal de encaixe fragil.
Impacto: dificil de evoluir com fidelidade de blueprint sem mexer no layout base.
Recomendacao: revisar grid e remover cards que nao sustentam decisao.

### 5. Admin System e Admin Tenants

Problema: paginas estaveis, mas ainda com linguagem de painel administrativo genérico: cards, metricas e drawers como padrao.
Impacto: consistente, mas menos cockpit operacional.
Recomendacao: manter para MVP, refatorar apos Support.

### 6. Internal Actions e Engineering

Problema: funcionam como filas operacionais, mas herdam page header, cards e drawers.
Impacto: bom suficiente para MVP, porém visualmente menos fiel que Support.
Recomendacao: aplicar primitives compactas depois de estabilizar Support.

## P3

### 7. Portal e Public Help

Problema: Portal e Public Help aceitam scroll global quando o conteudo e publico/customer-facing. Public Help rola 1725/900, esperado.
Impacto: baixo.
Recomendacao: preservar clareza e evitar introduzir linguagem interna.

## Ordem recomendada dos proximos lotes

1. P4-F.2, Support Intake Layout Decision: trocar drawer por modal operacional amplo ou modo dedicado, sem backend novo.
2. P4-F.3, Support Ticket Workspace Density Pass: reduzir largura da fila, compactar composer e estabilizar rail.
3. P4-F.4, Operational Primitives Extraction: criar `OperationalPageHeader`, `OperationalFormGrid`, `OperationalTable`, `OperationalModal`.
4. P4-F.5, Admin Surface Constraint Pass: aplicar primitives compactas em Admin Knowledge/System/Tenants.
5. P4-F.6, Engineering/Internal Actions Density Pass: alinhar filas internas ao mesmo sistema.
