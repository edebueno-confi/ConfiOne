# Design QA — Dashboard Visual System V1

**Data:** 2026-08-03
**Checkout:** `C:\Projetos\GSO-old`
**Branch:** `codex/dashboard-visual-system-v1-20260803`
**Servidor:** `http://127.0.0.1:4173`
**Método:** sessão autenticada local, navegador Chrome via Playwright persistente.

## Escopo

Revisão visual do shell, cinco áreas analíticas, Integrações, Fontes do
Dashboard, Histórico e estados compartilhados de loading/UI-05. Não houve
clique em ação de sincronização nem chamada externa nova.

## Evidências

Capturas reais fora do Git:

- `C:\Projetos\GSO-artifacts\dashboard-visual-system-v1-20260803\final-dev-light-1440\overview-loaded.png`
- `C:\Projetos\GSO-artifacts\dashboard-visual-system-v1-20260803\final-dev-light-1440\finance-stable.png`
- `C:\Projetos\GSO-artifacts\dashboard-visual-system-v1-20260803\final-dev-light-1440\integrations-route.png`
- `C:\Projetos\GSO-artifacts\dashboard-visual-system-v1-20260803\final-dev-light-1440\history-route.png`
- pasta `final-dev-light-1440`: shell, Visão Geral, Comercial, Customer
  Success, Suporte, Financeiro, Integrações, Fontes e Histórico;
- pasta `final-dev-dark-1440`: as mesmas oito superfícies em tema escuro;
- `responsive-390-overview.png`, `responsive-390-finance.png` e
  `responsive-390-history.png` para viewport móvel.

## Resultado por critério

| Critério | Resultado | Evidência |
|---|---|---|
| título da Visão Geral proporcional | passed | `overview-loaded.png`; título compacto em desktop |
| navegação sem seletor de domínio duplicado | passed | teste de contrato + captura do shell |
| cinco áreas publicadas preservadas | passed | testes `mvp-ux-02-*` + capturas |
| estado ausente sem dado inventado | passed | `Indisponível`/estados existentes mantidos |
| UI-05 sem progresso fictício | passed | teste `analytics-sync-progress` + implementação |
| overlay condicionado a snapshot | passed | `GeniusSyncOverlay.tsx` + teste focado |
| reduced motion e foco | passed | CSS e teste de contrato |
| claro/escuro | passed | pastas `final-dev-light-1440` e `final-dev-dark-1440` |
| responsividade | passed | 1440x900 e 390x844, `scrollWidth === innerWidth` |
| console/page errors | passed | 0 erros no recorte final |
| request failures | passed | 0 falhas no recorte final |

## Observações

- O servidor local já estava em execução; não foi reiniciado nem interrompido.
- A captura inicial de algumas rotas ocorreu durante loading e foi repetida
  após estabilização; os arquivos `*-stable.png`/`*-route.png` são a evidência
  final dessas superfícies.
- A semântica de status não fabrica data: estado `fresh` sem timestamp é
  exibido como `Dados disponíveis`, e datas inválidas não geram rótulo de
  atualização.
- A revisão aplicou as regras de acessibilidade, foco, reduced motion,
  semântica de navegação e animação compositor-friendly da
  [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md).

## Veredito

passed — validação visual e comportamental concluída para o escopo local deste
macro-lote. A validação não inclui sincronização externa, credenciais ou
contratos de dados.
