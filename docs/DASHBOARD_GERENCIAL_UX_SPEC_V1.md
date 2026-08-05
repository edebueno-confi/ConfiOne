# SPEC — Upgrade visual do Dashboard Gerencial (V1)

> **Documento histórico/superseded para o contrato de áreas.** A especificação
> visual abaixo foi preservada como referência; a superfície vigente em
> 2026-08-02 tem cinco áreas (Resumo, Comercial, Customer Success, Suporte &
> Chat e Financeiro), com Configurações fora das abas do Dashboard. A fonte
> vigente é API-only HubSpot/OMIE; planilhas não são fallback.

Data: 2026-07-20
Autor: Claude / Anthropic
Rota: `/admin/analytics` (shell `AnalyticsShell`)
Status: parcialmente implementada (Financeiro e estados de carregamento entregues; demais abas em rollout)

## 1. Objetivo

Padronizar e elevar o Dashboard Gerencial a um cockpit executivo profissional,
coeso entre as abas (Visão executiva, Comercial, CS/Suporte, Financeiro,
Configuração, Logs), com hierarquia visual clara, uso semântico de cores e tags,
formatação pt-BR, dark mode com paridade, responsividade e período global
respeitado por todas as abas. O backend permanece a fonte da verdade.

## 2. Princípios

- Conduzir o olho ao dado acionável: cor e tag destacam risco (vencido), atenção
  (a vencer) e saúde (recebido); o restante fica neutro.
- Sem jargão técnico na interface (proibido texto como "distribuição calculada no
  backend"). Copy humana e operacional.
- Todo número tem rótulo/cabeçalho que explica o que ele representa e a unidade.
- Formatação pt-BR: moeda `R$` com `Intl.NumberFormat('pt-BR')`, milhares com
  ponto, percentual com vírgula, datas `dd/mm/aaaa`, meses por extenso.
- Densidade cockpit, sem cardização excessiva nem scroll horizontal (tabelas
  largas usam `overflow-x-auto` com largura mínima controlada).

## 3. Fonte de verdade e período compartilhado

- O período é estado do shell (`AnalyticsShell.sharedPeriod`) e é passado a todas
  as abas via `sharedPeriod` + `onSharedPeriodChange`.
- Regra: aplicar período em qualquer aba atualiza o shell e passa a valer para
  todas. Ao trocar de aba, a aba montada adota o período compartilhado.
- Correção aplicada: o Financeiro agora inicializa os filtros a partir de
  `sharedPeriod` e ressincroniza quando ele muda (antes reiniciava em "mês
  atual", ignorando o período global).
- Métricas de posição da carteira (saldo em aberto, vencido, aging, previsão,
  devedores, cruzamento CS) são "as of now" sobre a fonte ativa; o período
  filtra as visões de janela (situação, tendência mensal, faturado no recorte).

## 4. Tokens visuais (reuso das variáveis `--minimal-*`)

- Superfícies: `--minimal-surface`, `--minimal-surface-muted`.
- Bordas: `--minimal-border`, `--minimal-border-strong`, `--minimal-border-hover`.
- Texto: `--minimal-text`, `--minimal-text-secondary`, `--minimal-text-tertiary`.
- Ação/CTA: `--minimal-action` / `--minimal-action-ink`.
- Semânticas: `--minimal-danger-*` (vencido/risco), `--minimal-warning-*`
  (atenção/a vencer), ação/positivo para saúde.
- Raio: `rounded-lg`/`rounded-xl`. Sombra: `shadow-[var(--minimal-shadow)]`.
- Espaçamento base: seções `p-4`/`p-5`; grid gap `gap-3`/`gap-4`; blocos
  separados por `space-y-5`.
- Dark mode: usar somente tokens (nunca cores fixas) para paridade automática.

## 5. Componentes padrão

- `KpiCard(label, value, hint, tone)`: valor em destaque (tabular-nums), rótulo
  claro, hint explicativo; `tone` neutral/warning/critical colore borda, fundo e
  valor. KPIs em grid `grid-cols-2 lg:grid-cols-4`.
- `Tag(label, tone)`: pill colorido (neutral/positive/warning/critical/info)
  para status, faixas e destaques.
- `ChartCard(title, description, children)`: título + descrição humana + corpo.
  `CollapsibleChartCard` para seções extensas (recolhidas por padrão).
- Tabelas: cabeçalho obrigatório (uppercase, tracking, `text-tertiary`), valores
  `tabular-nums`, moeda/percentual pt-BR, coluna "% da carteira" quando fizer
  sentido, `overflow-x-auto` + `min-w`.
- Filtros: linha em grid responsivo (`md:grid-cols-6`), presets de período +
  datas + dimensões; CTA primário "Aplicar" (fundo `--minimal-text`) e
  secundário "Limpar" (borda). Controles com a classe padrão de input.
- CTAs: primário sólido `--minimal-action`; secundário contornado; posição
  canônica no topo à direita do bloco (ex.: "Sincronizar", "Exportar").

## 6. Estados

- Carregando: mascote Gênio animado, ampliado, flutuante e centralizado, com
  aura mágica e faíscas, sem moldura/retângulo (`MinimalState loading`).
- Vazio: `MinimalState` com orientação de ação (ex.: configurar/sincronizar).
- Erro: `MinimalState tone="critical"` com a mensagem do backend.
- Permissão: respeitar `platform_admin`/`dashboard_viewer` (abas visíveis).

## 7. Padrão por aba

- Visão executiva: referência de layout (KPIs + seções colapsáveis + alertas).
- Financeiro: já migrado ao padrão cockpit (KPIs coloridos, previsibilidade,
  aging por dias, devedores, categorias, cruzamento CS, tendência).
- Comercial e CS/Suporte: alinhar KPIs, tabelas com cabeçalho, tags de status,
  formatação pt-BR e responsividade ao mesmo padrão do Financeiro/Executiva.
- Configuração: manter formulários, padronizar inputs/CTAs/estados.
- Logs: consolidar históricos (sincronizações HubSpot/OMIE e importações de
  planilha) aqui, fora dos painéis operacionais.

## 8. Responsividade

- Desktop largo: grids de 4 colunas (KPIs) e 2 colunas (blocos).
- 1024-1439px: reduzir para 2 colunas; tabelas com scroll interno.
- Mobile: 1 coluna, tabelas com `overflow-x-auto`, sem scroll horizontal global.

## 9. Regras de conteúdo

- Nada de nomes de tabela, RPC, "backend", IDs internos crus na interface.
- Status e faixas humanizados (Title Case; faixas em dias por extenso).
- Origem do dado sempre visível (API OMIE ao vivo x planilha fallback) com aviso
  de que métricas exclusivas dependem da API.

## 10. Fases de rollout e aceite

- Fase 1 (entregue): tokens/componentes de referência, Financeiro cockpit,
  estados de carregamento com mascote, período compartilhado corrigido no
  Financeiro.
- Fase 2: alinhar Comercial e CS/Suporte ao padrão (KPIs, tabelas com cabeçalho,
  tags, pt-BR, responsividade).
- Fase 3: Configuração e Logs (consolidar históricos em Logs).
- Fase 4: QA visual autenticado (claro/escuro, larguras 1366/1280/1024/mobile),
  revisão de copy e acessibilidade.
- Aceite por fase: `web:typecheck` e `web:build` verdes; sem jargão técnico; todos
  os números com rótulo; período global respeitado; dark/light com paridade;
  sem scroll horizontal global; evidência visual anexada.
