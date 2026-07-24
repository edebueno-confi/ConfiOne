# Plano de Redesign de UX/UI — Dashboard Gerencial + Sistema (V3)

Autor: Claude / Anthropic (análise de design; não implementação). Data: 2026-07-22.
Base: estudo das marcas do grupo (Confi, Aftersale, Genius Returns) + inventário read-only de todo o `apps/web/src` (78 telas/componentes, `index.css` ~3.583 linhas, shell único `MinimalAppShell`).
Objetivo: um sistema organizado e profissional, com sidebar moderna colapsável (sem "cara de IA"), sem layouts multi-coluna arriscados, paridade light/dark real, copy/CTA/KPIs validados — e um Dashboard Gerencial que impressione pelo visual e pela qualidade/confiança do dado.

## 0. Marca e direção visual (síntese)

- Confi (ecossistema/holding): confiança, dados + IA, azul institucional; clientes enterprise (Magalu, Casas Bahia, O Boticário). Tom: sério, confiável.
- Aftersale (linha que o OS atende): posicionamento "IA-First", pós-venda premium, orientado a P&L ("proteger e perder menos", "cada devolução é uma decisão de negócio"), dashboards em tempo real, "security first". Estética SaaS moderna, escura/premium, muito data-forward.
- Genius Returns (integrada à Aftersale, ciclo IA-First 2026): mascote Gênio, acento vibrante (verde/magenta), tom humano ("trocar tem que ser tão fácil quanto comprar"), atendimento 24/7.

Direção para o produto interno (cockpit CX/financeiro):
- Personalidade: executivo, data-forward, IA-First, confiável. Menos "ERP", mais "sala de comando".
- Paleta: azul-confiança como primária (alinha ao `--minimal-action` ~#2f6bff), 1 acento da marca Gênio (magenta/verde) usado com parcimônia para destaque/insight de IA, neutros slate, e semânticos verde/âmbar/vermelho para saúde/atenção/risco. Tudo por token, com dark de verdade.
- Tipografia: sans moderna, hierarquia forte (display para números-herói de KPI, texto denso legível). Números sempre `tabular-nums`, formato pt-BR.
- Mascote Gênio: presente em estados (carregando/vazio/sucesso) e como assinatura de insights de IA, nunca poluindo dado operacional.

## 1. Princípios de layout (anti multi-coluna arriscado)

- Grade responsiva de 12 colunas com largura de conteúdo máxima; nunca depender de 4+ colunas rígidas lado a lado.
- Regra de ouro: no máximo 3 zonas primárias simultâneas; a 3ª zona (rail de contexto) vira drawer abaixo de 1280px.
- Todo track `fr` deve ser `minmax(0, …)` para impedir blowout/scroll horizontal (corrigir `AnalyticsConfigPage` 6 col, `AnalyticsCeoPage`, `CustomerPortalAdminPage`, `BuildJournalPage`).
- Tabelas densas (fila de suporte 8 col) não escondem colunas para caber: usar colunas essenciais + "mais" progressivo, densidade ajustável, e ganho de espaço pela sidebar colapsada. Sem scroll horizontal global.
- Breakpoints: ≥1440 (4 zonas possíveis), 1280–1439 (rail vira drawer), 1024–1279 (2 colunas), <1024 (1 coluna, navegação em drawer).

## 2. Sidebar moderna colapsável (sem cara de IA)

- Colapsável no desktop: dois estados — expandida (240px, rótulo + ícone) e rail (64px, só ícone com tooltip). Estado persistido (por usuário) e atalho de teclado. Hoje é fixa em 232px e só colapsa no mobile (`MinimalAppShell.tsx:128`).
- Estrutura por grupos claros e enxutos, com rótulos que não competem: hoje "Administração" tem 11 itens planos e nomes ambíguos ("Visão geral" × "Dashboard gerencial"; "Início" e "Atendimento" com o mesmo ícone). Reagrupar em: Operação (Atendimento, Fila, Clientes), Inteligência (Dashboard Gerencial), Engenharia/Produto, Administração (Contas, Portal, Áreas, Acessos, Sistema), Conhecimento.
- "Cara de IA" a eliminar: ícones genéricos repetidos, títulos placeholder, densidade uniforme sem hierarquia. Adotar: seção com micro-cabeçalho, item ativo com barra/realce por `--minimal-selection`, ícones consistentes com peso único, espaçamento respirado, marca/logo no topo (Aftersale/Genius) e alternador de tema + usuário no rodapé.
- Navegação por permissão real (não por heurística de path — `minimal-navigation.ts:60-70`): montar itens a partir das permissões do gate, não de `pathname.startsWith`.
- Remover dead code (`admin-shell/AdminLayout.tsx`).

## 3. Tokens e paridade light/dark (unificação)

Problema central: transição inacabada de dois design systems + área inteira sem dark.
- Fonte única de tokens `--minimal-*` (cores, superfícies, bordas, texto, ação, semânticos, sombra, raio). Aposentar o legado `--color-*`/`--support-*`/`--genius-site-*` migrando os consumidores.
- Portar a camada `.support-*` (`index.css:252` em diante, ~1.700 linhas) para tokens + bloco dark. Hoje usa gradiente e brancos/cinzas crus (`:302, :850, :1060, :1379, :1587, :1706`, cinzas `#65738f/#536480/#43516c`) e um scrim/modal com `padding-left: 19.5rem` fixo (`:394`) — a maior e mais densa tela do produto quebra no dark.
- Eliminar hex fixos em TSX: `build-journal/BuildJournalAI.tsx` (paleta inteira `:8-29`), `analytics/charts/AnalyticsCharts.tsx:23-29` (eixos `#8b93a7` com baixo contraste no dark), e ocorrências em engineering/customer-portal/help-center/knowledge/product-docs. Regra: nenhuma cor fixa em componente; tudo via token.
- Kit único de UI e de estados: consolidar `components/ui.tsx` (legado, 43 telas) e `minimal-ui.tsx` (5 telas) em um só; idem `states.tsx` × `minimal-states.tsx`. Padronizar raio, sombra e densidade (hoje convivem cards `rounded-[24px]` com sombra fixa e o flat minimal).

## 4. Dashboard Gerencial — atenção especial (impressionar por visual e dado)

Meta: parecer uma sala de comando executiva IA-First, com dado confiável e acionável.

Layout e narrativa (ordem que conduz o olho):
- Topo: título + período global + origem/frescor + CTA "Exportar" e "Sincronizar". Abas viram navegação segmentada elegante (hoje `flex-wrap` de 5-6 abas — trocar por segmented control/rail interno que não quebra linha).
- Linha-herói de KPIs (4 por vez, `grid-cols-2 lg:grid-cols-4`, `minmax(0,1fr)`): número display grande, rótulo claro, delta vs período anterior (seta + %), tom semântico (risco/atenção/saúde) e um "info" com fórmula/fonte. Consolidar num único `KpiCard` (hoje há 3 padrões: `MetricCard`, `SummaryStripItem`, `KpiCard`).
- Blocos abaixo em no máximo 2 colunas: previsibilidade (projeção), aging por faixa, maiores devedores, cruzamento CS, categorias — cada um com cabeçalho que explica o número e % da carteira.
- Gráficos: paleta por token (não hex), eixos com contraste dark-safe, tooltips ricos, estados vazio/erro claros. Preferir poucos gráficos de alto valor a muitos cards.

Qualidade e confiança do dado (o que impressiona um executivo):
- Selo de origem por bloco: "API OMIE ao vivo" × "planilha (fallback)" × "HubSpot", com data/hora da última sincronização e status.
- Indicadores de confiança: cobertura da reconciliação (quantos títulos casados por CNPJ), "sem correspondência", ambíguos — com contagem e link para revisar.
- Frescor: badge "atualizado há X" e aviso quando a fonte está defasada.
- Consistência de números: normalizar escala de percentual num único ponto (hoje `receivedRate/overdueRate` ÷100 vs `conversion/closed` já 0-1 — risco de erro 100x) e documentar no contrato.
- Zero dado inventado: quando a fonte não fornece, "indisponível" explícito (ex.: centro de custo vazio).
- Erros em cor de perigo (hoje erros aparecem em azul de marca — `AnalyticsShell.tsx:25,108`, `AnalyticsLogsPage.tsx:27`, `AnalyticsFilters.tsx:28`); sucesso não usa amarelo de aviso.

## 5. Padrões transversais (tabela, card, KPI, CTA, copy)

- Tabela: cabeçalho uppercase discreto, `tabular-nums`, moeda/percentual pt-BR, zebra sutil, densidade confortável, `overflow-x-auto` só quando inevitável (nunca global). Um componente único de tabela/breakdown (hoje há 3 implementações divergentes).
- CTA: primário sólido `--minimal-action`, secundário contornado, destrutivo semântico; posição canônica no topo à direita do bloco; nunca dois primários competindo.
- KPI: um só componente com tom, delta, fonte e frescor.
- Copy: humana, executiva, pt-BR acentuado, sem jargão técnico e sem eyebrows de gabarito ("portal"/"auth" em caixa-alta — `CustomerPortalPage.tsx`, `SupportGate.tsx:52`). Rótulos de menu que não competem.

## 6. Reorganização por área (prioridade)

1. Suporte (fila/tickets) — maior e mais densa; portar para tokens + dark; redesenhar a tabela de 8 colunas (essenciais + progressivo, sem esconder dado); rail de contexto vira drawer <1280.
2. Dashboard Gerencial — seção 4 (é o cartão de visita).
3. Admin (Tenants/Portal/Áreas/Acessos) — blindar grids `fr` com `minmax(0,…)`; densidade e leitura; consolidar KPIs/tabelas.
4. Build Journal — remover paleta hardcoded; alinhar ao design system.
5. Portal do cliente / Help Center — revisar copy (eyebrows), dark do markdown.
6. Config/Sistema/Logs — padronizar formulários, estados e histórico.

## 7. Validação (obrigatória por tela)
- Light e Dark com paridade (nenhuma cor fixa; screenshots dos dois temas).
- Larguras 1440/1280/1024/mobile sem scroll horizontal global nem colunas escondendo dado.
- Leitura: hierarquia, contraste (WCAG AA), densidade.
- Copy sem jargão; números com rótulo e formato pt-BR; erros em vermelho, sucesso sem amarelo.
- `web:typecheck` e `web:build` verdes.

## 8. Fases de rollout e aceite
- Fase 0: fundação — unificar tokens/kit único, sidebar colapsável, blindar grids (`minmax(0,…)`), cor semântica de erro/sucesso.
- Fase 1: Dashboard Gerencial (seção 4) completo, light/dark, com selos de origem/frescor/confiança.
- Fase 2: Suporte para tokens + dark + tabela redesenhada.
- Fase 3: Admin, Build Journal (des-hardcode), Portal/Help, Config/Logs.
- Fase 4: QA visual autenticado claro/escuro + responsivo; revisão de copy; acessibilidade.
Aceite por fase: paridade dark/light, zero cor fixa nova, zero scroll horizontal global, KPIs/tabelas/CTAs no padrão único, typecheck/build verdes, evidência visual anexada.

## 9. Prompt para o Codex (implementação)
Ver bloco no chat: ordem Fase 0→4, com critérios de aceite acima, mantendo backend como fonte da verdade, RLS/tenant, sem dado inventado, e sem push sem confirmação.

## 10. Adendo de direção — design operacional e navegação por papel

Este adendo prevalece sobre rótulos genéricos do inventário anterior:

- Não usar `Trabalho` ou `Engenharia` como áreas principais da sidebar. A área
  organizacional vem do perfil do funcionário; Produto é a nomenclatura de
  produto/engenharia quando aplicável.
- Usar `Minha rotina` para o cockpit da pessoa, `Inteligência` para visão
  gerencial e `Administração` para acessos, configurações e governança.
- Exibir itens conforme papéis e flags reais retornados pelo backend. O frontend
  pode organizar, mas não concede acesso nem infere função por URL.
- A estética deve fugir do template genérico de IA: tecnologia discreta,
  composição editorial-operacional, foco em resolução, urgência semântica e
  azul/rosa da Genius usados como identidade, não como decoração.
- Padronizar a escala de espaçamento, alturas, labels, campos, cards, tabelas,
  chips e CTAs. Toda revisão visual deve incluir padding, margem, alinhamento,
  foco, overflow e estados loading/erro/vazio/sucesso.
- Não criar perfil financeiro somente no frontend. O cadastro de funcionário e
  sua área/função exigem um contrato de backend, enum/policy e contexto de
  autorização antes de uma rotina financeira real ser publicada.
