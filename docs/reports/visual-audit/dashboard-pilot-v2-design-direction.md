# Dashboard Gerencial — direção do piloto visual V2

Data: 2026-08-02
Escopo: shell compartilhado, Visão Geral e Comercial.

## Skill de design invocada

- `frontend-design` — `C:\Users\edebu\.codex\skills\frontend-design\SKILL.md`.
  Modo: leitura integral antes da implementação; saída aplicada no código como
  direção estética, hierarquia tipográfica, composição e estados de interface.
- `gso-operational-design` — `C:\Users\edebu\.codex\skills\gso-operational-design\SKILL.md`.
  Modo: leitura integral antes da implementação; saída aplicada como regra de
  cockpit operacional, fonte factual, CTA contextual e status padronizado.

A skill `web-design-guidelines` será executada como auditoria pós-código com
as diretrizes atuais do repositório oficial, antes da captura no preview.

## Tese visual adotada

**Cockpit editorial de decisão.** O dashboard deve responder, em poucos
segundos: o que mudou, qual risco exige atenção e se a leitura é confiável.
O layout abandona a grade de cartões administrativos e usa uma sequência de
faixas de leitura: identidade e frescor, resultado executivo, contexto do
recorte, sinais e próximos domínios.

## Decisões adotadas

- azul profundo e superfícies claras/escuras existentes como base do produto;
- magenta somente para ação contextual e foco, sem arco-íris de KPIs;
- tipografia de resultado maior, com rótulo curto e detalhe secundário;
- divisores finos e espaços generosos no lugar de borda ao redor de cada item;
- HubSpot e OMIE visíveis como fontes factuais, com estados canônicos e sem
  “dados recebidos” como sinônimo de sincronização concluída;
- exportação rebaixada a ação secundária; integração permanece próxima do
  estado das fontes;
- mobile em uma coluna, filtros recolhíveis e alvos de toque confortáveis;
- Gênio apenas no contexto de leitura/carregamento, sem decorar cada título.

## Decisões rejeitadas

- cards estreitos em duas colunas no mobile;
- repetição de status técnico dentro de cada KPI;
- números zero quando a fonte está indisponível ou ainda não sincronizou;
- métricas de CS sem denominador de carteira confirmado;
- redesign de Customer Success, Suporte ou Financeiro neste lote;
- gradientes, ícones em todos os títulos e ação de exportar como CTA primário.

## Critério de aceitação do piloto

Em 1440px, a primeira dobra deve priorizar resultado, variação/risco e
frescor. Em 390px, nenhum KPI deve permanecer em duas colunas, nenhum texto
deve ser cortado e a fonte deve continuar identificável sem abrir um painel
técnico. A aprovação visual depende das capturas no preview empacotado, não do
dev server.
