# MVP-UX-02.1 — Direção Canvas Gerencial Gênio HD

## Decisão visual

A direção escolhida foi **Conceito F — F1 Signal Weave**. A composição organiza o painel por pulso de fontes, síntese factual, faixas métricas, matriz transversal de domínios e trilhos de integridade. O objetivo é aumentar a densidade de informação sem transformar a tela em uma grade de cartões ou em um CRM genérico.

O Superdesign foi utilizado somente para exploração e crítica visual. Nenhum HTML, template ou dado do canvas foi incorporado ao runtime.

## Explorações avaliadas

| Exploração          | Princípio                                                             | Pontuação | Decisão                                                              |
| ------------------- | --------------------------------------------------------------------- | --------: | -------------------------------------------------------------------- |
| F1 — Signal Weave   | Fontes, domínios e indicadores formam uma trama horizontal conectada. |    92/100 | Escolhida                                                            |
| F2 — Executive Lens | Síntese central com foco progressivo ao redor do contexto.            |    89/100 | Rejeitada: ainda próxima de um dashboard SaaS convencional.          |
| F3 — Crystal Matrix | Matriz assimétrica de camadas finas e alta precisão.                  |    88/100 | Rejeitada: mantém dependência visual excessiva de células e cartões. |

Critérios avaliados: identidade Genius, leitura gerencial, densidade, originalidade, uso de Full HD, hierarquia, viabilidade, responsividade, acessibilidade e potencial de aderência.

## Referências Superdesign

- Projeto: `DESIGN-DIRECTION-01 — Genius Support OS`.
- Canvas: `https://superdesign.dev/teams/91e14209-46ac-4643-ab20-f5d4a883aa7e/projects/fa80fe03-c087-4cdd-a3bf-0a315fa68db5`.
- F1 final: `https://p.superdesign.dev/draft/a236d062-359f-45fa-b447-74120db71cfc`.
- F2: `https://p.superdesign.dev/draft/ce036e61-7e5f-48fa-8d9f-b0ade9759090`.
- F3: `https://p.superdesign.dev/draft/7d4cb1b3-747d-434b-85b1-f04eb0ce41d6`.

## Tokens e geometria

- Canvas claro tonalizado e canvas navy no escuro.
- Superfícies limitadas a canvas, superfície funcional e detalhe em foco.
- Bordas de 1 px, sombras discretas e rosa Genius usado como assinatura de conexão, seleção e transição.
- Tipografia compacta, números tabulares e labels curtos.
- Grid fluido com margem de 24–32 px, gaps de 12–20 px e leitura de 16 colunas no Full HD.
- Sidebar compacta por padrão no painel executivo; drawer contextual no mobile.
- `prefers-reduced-motion` remove transições e animações não essenciais.

## Princípios de implementação

1. O backend e os read models continuam sendo a fonte da verdade.
2. Ausência, atraso, cobertura parcial e fonte não configurada permanecem estados explícitos; nunca são convertidos em zero.
3. Produto e Desenvolvimento ocupam módulos compactos de fonte não conectada, sem áreas vazias artificiais.
4. O Gênio aparece como contexto funcional de leitura, não como chat nem ornamento repetido.
5. Os seis domínios permanecem separados e navegáveis; o dashboard viewer continua sem ações administrativas.
6. A qualidade e a conciliação formam um trilho transversal, não uma caixa administrativa isolada.

## Limites do lote

Este documento não altera contratos, migrations, integrações, artigos, usuários ou permissões. Screenshots e HTML de exploração permanecem fora do Git, no pacote local de revisão.
