# Design QA — Cockpit operacional

## Evidências

- Fonte visual: `C:\Users\edebu\AppData\Local\Temp\codex-clipboard-2d1bad55-1123-444f-a3ab-602fe5b444eb.png`
- Implementação: `http://127.0.0.1:4173/admin/analytics`
- Screenshot desktop final: `C:\Users\edebu\.codex\visualizations\2026\08\01\019fbebb-443e-7392-8fc1-d8eda55ed6c9\gso-analytics-cockpit-final.png`
- Screenshot desktop focado: `C:\Users\edebu\.codex\visualizations\2026\08\01\019fbebb-443e-7392-8fc1-d8eda55ed6c9\gso-analytics-cockpit-desktop-mid.png`
- Screenshot mobile: `C:\Users\edebu\.codex\visualizations\2026\08\01\019fbebb-443e-7392-8fc1-d8eda55ed6c9\gso-analytics-cockpit-mobile.png`
- Fonte: 1488 × 1058 px; implementação desktop: 1280 × 720 px; implementação mobile: 390 × 844 px.
- Densidade: capturas do navegador tratadas como 1x; sem downsample. A comparação priorizou estrutura e tokens, pois a fonte é um detalhe de ticket e a implementação é a visão executiva de Analytics.
- Estado: usuário autenticado como `QA Local Administrador`; dados reais carregados; tema do sistema claro; período padrão; desktop e mobile.

## Comparação

A fonte e as capturas de implementação foram abertas juntas na mesma entrada de comparação visual. A referência selecionada estabelece a linguagem operacional: navegação persistente, conteúdo central dominante, rail contextual, separação de estados e CTA de decisão. O redesign transpõe esses princípios para Analytics, sem copiar a tela de ticket nem fabricar conteúdo.

### Findings

Não foram encontrados desvios acionáveis P0, P1 ou P2.

- Tipografia: hierarquia consistente com o design system existente, Instrument Sans/Space Grotesk, títulos com peso maior e metadados compactos.
- Espaçamento e layout: hero, faixa de sinais, foco operacional, pipelines e rail de contexto mantêm ritmo uniforme; o rail permanece visível em desktop.
- Cores e tokens: superfícies claras, navy/azul/ciano/rosa e estados semânticos reutilizam os tokens do GSO; o verde indica dado recebido e o vermelho/âmbar aparece apenas em risco real.
- Imagem e assets: não há imagem decorativa nova; a marca e a mascote existentes permanecem no shell canônico. Nenhum placeholder ou ilustração falsa foi introduzido.
- Copy e conteúdo: os números exibidos vêm dos contratos reais. Conversão sem base aparece como `Indisponível`, e a posição atual é explicitamente separada do período.
- Responsividade: em 390 × 844 px, a navegação horizontal fica contida, os sinais colapsam em coluna, o rail vira sequência de conteúdo e `Filtros` abre os controles reais.
- Interações: links internos usam React Router; filtros foram abertos no mobile; estado de sincronização e autenticação foram verificados.

### Diferenças intencionais

- A fonte é uma tela de detalhe de ticket com sidebar navy; a implementação é Analytics dentro do shell global claro já canônico do produto. A diferença de conteúdo e shell é intencional para preservar a arquitetura e aplicar a referência como linguagem, não como cópia literal.
- A implementação não adiciona ações de ticket, anexos ou conhecimento relacionado, pois não pertencem ao contrato da visão executiva.

## Comparison history

- Não houve iteração bloqueante P0/P1/P2. Antes do gate final, os links de navegação foram refinados para usar texto de ação (`Abrir`) em vez de glyphs de seta, mantendo a affordance sem simular ícones.
- A captura desktop final e a captura focada foram refeitas após esse refinamento.

## Implementation checklist

- [x] Fonte visual e implementação abertas e comparadas.
- [x] Desktop capturado no viewport padrão.
- [x] Mobile capturado em 390 × 844 px.
- [x] Filtros mobile abertos e confirmados no DOM.
- [x] Console verificado: nenhum warning ou error.
- [x] P0/P1/P2 sem pendências.

## Follow-up polish

- P3 opcional: uma futura revisão do shell global pode aproximar o contraste da navegação da referência, mas isso deve ser tratado como decisão de design system, não como correção desta tela.

final result: passed
