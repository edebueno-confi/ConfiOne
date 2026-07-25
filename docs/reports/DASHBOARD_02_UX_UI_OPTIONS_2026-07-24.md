# DASHBOARD-02.2 — Opções de arquitetura UX/UI

## Diagnóstico atual

A tela oficial ainda concentra visão executiva, domínios, filtros, detalhes de pipelines e logs em uma mesma superfície. O estado vazio tem baixa densidade, enquanto o preenchido tende a crescer verticalmente. Cinco segundos de leitura não distinguem com clareza desempenho no período, posição atual e exceção acionável.

## Auditoria quantitativa dos protótipos

As medidas foram capturadas por Playwright com fixture determinística de 17 pipelines, em `docs/prototypes/dashboard-02/evidence/`. Em 1440×900, o cabeçalho ocupa aproximadamente 86 px, filtros 52 px, KPIs 119 px e o resumo de pipelines 230–260 px; a primeira dobra alcança o início do resumo por domínio. Em 1024×768, a grade passa a 2 colunas e o resumo de pipelines inicia após aproximadamente 670 px. Em 390×844, a grade vira uma coluna, sem overflow horizontal do documento, mas a página exige duas a quatro dobras conforme a opção.

| Viewport | A: primeira dobra | B: primeira dobra | C: primeira dobra | Observação |
|---|---:|---:|---:|---|
| 1440×900 | domínio + início pipelines | prioridades + início pipelines | domínios + tabela | leitura executiva possível |
| 1366×768 | início pipelines | prioridades | tabela inicia | stale visível no cabeçalho |
| 1024×768 | pipelines após domínios | três prioridades | tabela compacta | 2 colunas preservam leitura |
| 768×1024 | domínio e pipelines | prioridades e pipelines | tabela completa parcial | largura intermediária controlada |
| 390×844 | KPIs + posição atual | pergunta + prioridades | resumo + primeiro domínio | uma coluna e divulgação progressiva |

## Problemas de densidade e repetição

- 17 pipelines não devem ocupar a visão executiva; cinco sinais bastam para decisão inicial.
- Status de fonte deve ser uma legenda curta, não um painel técnico repetido.
- Alertas precisam representar exceções com ação, não uma lista decorativa.
- Posição atual financeira não deve responder ao filtro de período.

## Classificação dos 17 pipelines

Todos permanecem ativos; a classificação só define exposição futura na visão executiva.

| Pipeline | Tipo | Domínio | Resumo executivo | Detalhe |
|---|---|---|---|---|
| Piloto Aftersale | deal | Comercial | sim, se houver atividade | sim |
| Pre-POC Aftersale | deal | Comercial | não | sim |
| Hunting - Parcerias MKT Aftersale | deal | Comercial | não | sim |
| Carteira CS | deal | Comercial | não, revisar ownership | sim |
| Renovação Contratual | deal | Comercial | sim | sim |
| Pipe de Vendas | deal | Comercial | sim | sim |
| Black Friday - Hora Hora | deal | Comercial | não, sazonal | sim |
| Gerenciamento Faturamento | deal | Comercial | não | sim |
| Aquisição Aftersale | deal | Comercial | sim se ativo no período | sim |
| Expansão - Retração Aftersale | deal | Comercial | sim | sim |
| Retenção de Churn Aftersale | deal | Comercial | sim, como risco | sim |
| Atendimento Confi Analytics | ticket | CS | sim | sim |
| Confi Whatsapp | ticket | CS | não, salvo alerta | sim |
| Criadouro de Tíquetes Aftersale | ticket | CS | não | sim |
| Fale conosco Confi | ticket | CS | sim por volume | sim |
| Suporte | ticket | CS | sim | sim |
| Suporte B2B Confi | ticket | CS | sim para operação B2B | sim |

Critérios: impacto financeiro, volume, atividade recente, risco operacional, responsável e estado da fonte. “Não” significa apenas “não ocupar o resumo”; nenhum pipeline foi excluído ou desativado.

## Opção A — Resumo executivo por domínio

KPIs de desempenho, posição atual, exceções, três domínios compactos e até cinco pipelines prioritários. Vantagem: leitura rápida e hierarquia clara. Desvantagem: exige critérios sólidos de seleção de pipelines. Esforço médio; risco baixo; impacto alto. É a opção recomendada.

## Opção B — Dashboard orientado a decisões

Organiza a página por perguntas: desempenho acelerou, o que exige decisão e quais próximos passos. Vantagem: menor carga cognitiva e foco operacional. Desvantagem: dificulta comparação direta de muitos indicadores e exige conteúdo editorial mais cuidadoso. Esforço médio/alto; risco médio; impacto alto para gestores.

## Opção C — Visão executiva com navegação analítica

Resumo mínimo, cards de domínio e tabela compacta de pipelines com forte navegação para detalhe. Vantagem: escala melhor para análise. Desvantagem: menos contexto no primeiro paint e maior dependência de rotas futuras. Esforço médio; risco médio; impacto alto para usuários analíticos.

## Recomendação principal

Implementar A como shell executivo, incorporar a linguagem de perguntas de B nos alertas e adotar a tabela/rota de detalhe de C. Não implementar a rota neste lote; registrar `/admin/analytics/pipelines` como próxima superfície.

## Arquitetura e filtros

Cabeçalho compacto → desempenho no período → posição atual → exceções → resumos Comercial/CS/Financeiro → até cinco pipelines → `Ver todos`. Filtros: período, domínio, pipeline e responsável quando suportado; mobile usa drawer/popover. Período afeta apenas `period_flow`; posição atual sempre exibe a legenda “não afetada pelo período selecionado”. Persistência e reset devem usar URL somente quando a implementação oficial começar.

## Estados

`fresh`: chip de atualização; `stale`: chip de atraso e última atualização; `partial`: cobertura e aviso curto; `empty`: “nenhum registro no recorte”; `not_configured`: orientar configuração; `syncing`: indicador local; `unavailable`: fonte não disponível; `error`: erro amigável + tentar novamente. Nunca converter ausência, falha ou falta de sync em zero.

## Responsividade e acessibilidade

1440/1366 usam quatro KPIs; 1024 usa duas colunas; 768 e 390 usam uma coluna conforme conteúdo. Todo foco precisa ser visível, controles têm nome acessível, tabelas usam cabeçalhos semânticos, status usam `role=status`/`role=alert` quando apropriado, e animações respeitam `prefers-reduced-motion`. Gráficos oficiais precisarão de tabela/resumo textual antes da implementação.

## Mapa futuro

- `/admin/analytics`: visão executiva A.
- `/admin/analytics/commercial`, `/cs`, `/finance`: detalhe por domínio.
- `/admin/analytics/pipelines`: catálogo, estágios, comparação, frescor e investigação.
- `/admin/logs`: histórico técnico para perfis autorizados.

## Componentes

Preservar contratos, filtros, mappers e views. Consolidar chips de estado, cabeçalho de fonte, KPI temporal e resumo de pipeline. Criar futuramente `AnalyticsExecutiveHeader`, `AnalyticsMetricGroup`, `AnalyticsAttentionList` e `AnalyticsPipelineSummary` somente quando houver reutilização comprovada. Remover apenas componentes legados após prova de ausência de consumidores.
