# MVP-UX-02.1 — Implementação local e auditoria do Canvas Gerencial Gênio HD

Data: 2026-07-28  
Branch: `codex/mvp-ux-01-structural-simplification`  
Escopo: refatoração visual local do Dashboard Gerencial, shell interno, Access e Settings. Nenhuma alteração em HubSpot, OMIE, Central de Ajuda, Knowledge, Taxonomia, usuários remotos ou migrations remotas.

## Direção aprovada

O trabalho visual foi explorado no projeto Superdesign `DESIGN-DIRECTION-01 — Genius Support OS`.

- F1 — Signal Weave: 92/100, escolhida.
- F2 — Executive Lens: 89/100, rejeitada por aproximar-se de uma composição convencional de lentes e cards.
- F3 — Crystal Matrix: 88/100, rejeitada por aproximar-se de uma matriz de células e cards.
- Projeto: https://superdesign.dev/teams/91e14209-46ac-4643-ab20-f5d4a883aa7e/projects/fa80fe03-c087-4cdd-a3bf-0a315fa68db5
- Draft F1: https://p.superdesign.dev/draft/a236d062-359f-45fa-b447-74120db71cfc

A implementação preserva a ideia de um canvas operacional: pulso das fontes, contexto temporal, desempenho, posição atual, matriz de domínios, qualidade e sinais de atenção. Os números são sempre provenientes dos read models existentes; ausência de fonte permanece explícita.

## Implementação

- Reconstruído `AnalyticsCeoPage` com uma composição full HD e hierarquia factual.
- Adicionados tokens locais de canvas, superfícies, bordas, texto, estados e destaque Genius.
- Aplicadas superfícies coerentes às seis áreas analíticas, Access e Settings sem criar design system paralelo.
- Mantidos filtros, rotas, contratos, permissões e chamadas existentes.
- `dashboard_viewer` continua limitado ao recorte executivo e sem detalhamento administrativo.
- Adicionados estados de vazio, indisponibilidade, erro e loading sem transformar ausência em zero.
- Mantida a distinção `Desempenho no período` versus `Posição atual`.
- Mantidos `prefers-reduced-motion`, foco visível, navegação por teclado e ausência de overflow.
- Corrigidas expectativas frágeis do teste estrutural para acompanhar a formatação JSX sem relaxar as verificações semânticas.

## Geometria e responsividade

- 1920×1080: canvas horizontal completo, seis domínios em matriz contínua e quatro métricas na faixa de desempenho.
- 1440×900: mesma hierarquia com redução proporcional de gaps e preservação dos sinais acima da dobra.
- 1366×768: densidade mantida sem rolagem horizontal.
- 1024×768: matriz e métricas refluem para a grade intermediária.
- 390×844: navegação e filtros tornam-se composição compacta; filtros abrem progressivamente; métricas e domínios ficam legíveis em coluna/grade móvel.
- Tema claro e escuro foram capturados na visão executiva e no Settings.

## Dados e estados

Após a reconstrução local obrigatória do Supabase, a base não possui dados operacionais reais de HubSpot ou OMIE. As capturas exibem `Indisponível`, `Sem registros no recorte`, `Fonte ainda não conectada` e `0 clientes ativos` somente quando o contrato local reporta esses estados. Não foram fabricados tickets, negócios, receitas ou recebíveis.

## Validação visual

O capture Playwright foi executado contra o Vite deste checkout em `127.0.0.1:4190`, não contra outro checkout local. Foram capturados Dashboard executivo em 1920, 1440, 1366, 1024 e 390; light/dark; seis domínios; filtros móveis; estados empty, source-not-connected, error, loading; `dashboard_viewer`; Access; Settings.

As capturas do Dashboard, seis domínios, Settings e estados não apresentaram erros de console, page errors, request failures ou respostas funcionais malsucedidas. O banco local, contudo, apresenta um bloqueador fora do escopo visual: o processo PostgreSQL local sofre segmentation fault ao consultar `vw_admin_access_profile_capabilities`, gerando 503 transitório no Access. O log local identifica a consulta do read model como o processo que dispara a falha. Isso foi preservado como bloqueio técnico e não foi mascarado no pacote.

## Validação técnica

- `npm run contracts:typecheck`: aprovado.
- `npm run web:typecheck`: aprovado.
- `npm run web:build`: aprovado, 823 módulos transformados.
- `npm run supabase:verify`: aprovado; reset local, 87 arquivos/1.402 testes de banco, verificação do import space-aware e lint do schema. O lint reportou apenas warnings existentes de variáveis `v_actor` não lidas.
- Testes focados UX/analytics: 35/35 aprovados.
- `npm run repository:check-root`: aprovado.
- `npm run local:qa:secret-scan`: aprovado, 1.634 arquivos rastreados, 0 matches.
- `git diff --check`: aprovado.

## Operações não executadas

Não houve push, PR, merge, deploy, migration remota, sincronização HubSpot/OMIE, criação de usuário remoto, convite, alteração de segredo ou execução de ação externa.

## Decisão técnica

O canvas escolhido e a refatoração visual estão prontos para avaliação humana. O bloqueador de infraestrutura local no read model de Access impede declarar a validação funcional completa dessa superfície. A correção desse segmentation fault exige investigação de banco/read model fora do escopo MVP-UX-02.1.
