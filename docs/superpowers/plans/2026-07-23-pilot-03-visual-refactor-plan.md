# PILOT-03 — Plano de Implementação

> **Para agentes de execução:** executar este plano somente após aprovação explícita deste documento. Nenhum passo de implementação deve começar antes do gate.

**Objetivo:** concluir a refatoração visual do Dashboard Gerencial e da Central Pública como superfícies simples, responsivas e guiadas pelo Genius, sem alterar backend, migrations, RLS ou contratos de autorização.

**Arquitetura:** preservar os contratos e APIs existentes. O Dashboard continuará usando `MinimalAppShell`, `buildMinimalNavigation`, `AnalyticsShell` e os read models atuais. A Central continuará usando o contexto público, `PublicHelpHeader`, `PublicSearchStateCard` e os componentes de artigo existentes; mudanças de composição ficarão nas páginas públicas e em estilos/tokens já existentes.

**Tecnologias:** React + TypeScript, React Router, Tailwind/classes existentes, CSS semântico em `apps/web/src/index.css`, Node test runner, Playwright para smoke e screenshots.

---

## Etapas

### Etapa 0 — Pré-condições e baseline visual

**Arquivos:** nenhum arquivo de produto alterado.

- [ ] Confirmar branch `codex/release-pilot-dashboard-help-center-v1`.
- [ ] Confirmar `git status --short` limpo antes do macro-lote.
- [ ] Confirmar que o mascote corrigido está presente nos commits `41cfcb0`, `b71149c` e `a2c25a3`.
- [ ] Executar baseline: `npm run contracts:typecheck`, `npm run web:typecheck`, `npm run web:build`, `node --test tests/scripts/genius-mascot.test.mjs tests/scripts/pilot-02-contract.test.mjs`.
- [ ] Capturar e preservar screenshots baseline em `C:\Projetos\GSO-artifacts\pilot-03-20260723\baseline\`: Dashboard viewer 1440×900 e 1024×768; Central home desktop/mobile; lista desktop/mobile; artigo desktop/mobile; estados públicos.
- [ ] Verificar baseline com console sem erros, rede sem falhas inesperadas e ausência de overflow horizontal.

**Gate:** se a árvore estiver suja, se o baseline quebrar ou se a pose `celebrate` não estiver visualmente correta, parar antes de qualquer alteração de Dashboard/Central.

### Etapa 1 — Validação final do mascote antes do uso em telas

**Arquivos previstos:** somente se houver regressão visual:

- Modify: `apps/web/src/components/GeniusMascot.tsx`
- Modify: `apps/web/src/index.css`
- Test: `tests/scripts/genius-mascot.test.mjs`

- [ ] Renderizar `welcome`, `present`, `think`, `celebrate`, `magic` e `shrug` com as três expressões.
- [ ] Confirmar `celebrate` com exatamente dois braços erguidos, sem duplicação, corte ou sobreposição.
- [ ] Confirmar `magic` sem gesto ambíguo e com fumaça da lâmpada visualmente discreta.
- [ ] Confirmar avatares `default`, `attention` e `success` nos três tamanhos.
- [ ] Confirmar `prefers-reduced-motion` com animação reduzida e composição preservada.
- [ ] Se houver ajuste, escrever primeiro o teste vermelho, corrigir o componente, rerodar os testes e gerar a prancha antes de seguir.

**Gate:** nenhuma tela do piloto pode receber o mascote enquanto a prancha das seis poses não estiver aprovada visualmente.

### Etapa 2 — Simplificação da navegação do `dashboard_viewer`

**Arquivos:**

- Modify: `apps/web/src/features/navigation/minimal-navigation.ts`
- Modify: `apps/web/src/features/navigation/MinimalAppShell.tsx` somente se a renderização de seções vazias exigir ajuste.
- Test: `tests/scripts/pilot-02-contract.test.mjs` ou novo `tests/scripts/pilot-03-navigation.test.mjs`.

- [ ] Ajustar `buildMinimalNavigation` para retornar somente a seção/item do Dashboard quando o contexto for `dashboard_viewer`.
- [ ] Remover visualmente `Início`, grupo vazio de Administração e qualquer seção sem item disponível.
- [ ] Não criar regra de autorização na camada visual; usar permissões já calculadas pelo backend/contexto.
- [ ] Confirmar que o `AdminGate` e `canOpenInternalRoute` continuam bloqueando acesso direto fora do Dashboard.
- [ ] Testar desktop 1440×900, desktop 1024×768 e menu mobile aberto.

**Aceite:** a sidebar do viewer mostra apenas Dashboard Gerencial; nenhum cabeçalho vazio aparece; acesso direto a `/admin/settings`, `/admin/logs`, `/admin/knowledge` e `/admin/customer-portal` continua em `/access-denied`.

### Etapa 3 — Hierarquia visual e status do Dashboard

**Arquivos:**

- Modify: `apps/web/src/features/analytics/AnalyticsShell.tsx`
- Modify: `apps/web/src/features/analytics/AnalyticsCeoPage.tsx`
- Modify: `apps/web/src/features/analytics/analytics-ui.tsx`
- Modify: `apps/web/src/index.css` somente para tokens/seletores necessários.
- Test: `tests/scripts/pilot-03-dashboard.test.mjs`.

- [ ] Substituir termos técnicos de status por copy operacional: data da última atualização e limitação de atualidade, sem `snapshot`, `incremental`, `RPC`, `cache` ou `delta`.
- [ ] Manter cinco KPIs em linha em desktop amplo.
- [ ] Em 1024px, usar grade 3 + 2; aplicar `col-span` ou largura equivalente para os dois cards da segunda linha ocuparem o espaço de forma equilibrada.
- [ ] Reduzir skeletons cinza sem perder a estrutura visual; manter loading com cabeçalho, filtros e blocos proporcionais.
- [ ] Diferenciar informação, risco, alerta, vazio e erro por tokens semânticos, não somente por cor.
- [ ] Manter retry seguro em erro e impedir ação duplicada durante loading/sync.

**Estados obrigatórios:**

- Loading: estrutura da tela preservada, sem mensagens técnicas.
- Vazio: explicar ausência de dados no recorte e indicar ajuste de período/filtro.
- Erro: mensagem operacional genérica, botão “Tentar novamente”, nenhum detalhe interno.
- Sucesso: dados visíveis e status de atualização legível.

**Aceite:** em 1440px a leitura é executiva e compacta; em 1024px não existe terceiro espaço vazio na segunda linha; não há overflow horizontal; o viewer não vê sincronização manual/exportação administrativa.

### Etapa 4 — Refatoração da home da Central

**Arquivos:**

- Modify: `apps/web/src/features/help-center/HelpCenterHomePage.tsx`
- Modify: `apps/web/src/features/help-center/public-ui.tsx` somente se houver estado reutilizado real.
- Modify: `apps/web/src/index.css` para composição responsiva usando tokens existentes.
- Test: `tests/scripts/help-center-navigation.test.mjs` e novo `tests/scripts/pilot-03-help-home.test.mjs`.

- [ ] Integrar `GeniusMascot` no hero com `welcome + happy`, sem overlay, card flutuante ou rótulo de auditoria.
- [ ] Manter uma busca principal e sugestões de consulta como apoio direto à busca.
- [ ] Consolidar/remover os três cards intermediários redundantes.
- [ ] Exibir até seis categorias no desktop; no mobile exibir três e um link “Ver todas”.
- [ ] Exibir até cinco artigos úteis no desktop; no mobile, três.
- [ ] Manter um único bloco discreto de portal ao final da jornada.
- [ ] Remover ou consolidar “Acesso rápido”, “Como esta central ajuda você” e CTAs duplicados quando repetirem ações já visíveis.

**Aceite:** a primeira área útil comunica “consultar documentação”; a jornada é consultar → explorar → ler → portal; o Genius participa da busca sem competir com o conteúdo; a home mobile mostra conteúdo prioritário antes da primeira rolagem.

### Etapa 5 — Lista de artigos com paginação previsível

**Arquivos:**

- Modify: `apps/web/src/features/help-center/HelpCenterArticlesPage.tsx`
- Modify: `apps/web/src/features/help-center/public-ui.tsx` apenas para componentes realmente reutilizados.
- Modify: `apps/web/src/index.css` para lista desktop e cards mobile.
- Test: `tests/scripts/pilot-03-help-list.test.mjs`.

- [ ] Preservar `q` e `category` em `URLSearchParams`.
- [ ] Adicionar paginação simples com parâmetros `page` e `pageSize`, ou padrão equivalente já aceito pelo roteamento.
- [ ] Resetar `page` quando busca/categoria mudar.
- [ ] Usar lista/tabela escaneável no desktop.
- [ ] Usar cards/linhas adaptadas no mobile, sem tabela comprimida.
- [ ] Limitar o estado sem resultado ao conteúdo necessário, incluindo `shrug + wink`, busca visível, limpar filtro e categorias sugeridas.

**Aceite:** nunca aparecem dezenas de linhas simultâneas; recarregar a URL preserva busca, categoria e página; mobile não apresenta overflow horizontal.

### Etapa 6 — Artigo com índice lateral único

**Arquivos:**

- Modify: `apps/web/src/features/help-center/HelpCenterArticlePage.tsx`
- Modify: `apps/web/src/index.css`
- Test: `tests/scripts/pilot-03-help-article.test.mjs`.

- [ ] Reutilizar `extractArticleSections` para decidir se há três ou mais seções.
- [ ] Renderizar índice lateral estreito e sticky somente quando houver 3+ seções.
- [ ] Manter conteúdo principal dominante, sem segunda sidebar.
- [ ] Abaixo de 1024px, mudar para coluna única.
- [ ] No mobile, transformar o índice em bloco recolhível no topo.
- [ ] Renderizar relacionados, próximo passo e Genius após o conteúdo.
- [ ] Usar `present + happy` no bloco de próximo passo, sem acompanhar scroll e sem sobreposição.
- [ ] Preservar breadcrumb, âncoras, foco e navegação por teclado.

**Aceite:** desktop mantém apenas uma coluna auxiliar; artigo curto não recebe índice vazio; 1024px e mobile priorizam leitura; links de índice levam à seção correta.

### Etapa 7 — Estados públicos finais

**Arquivos:**

- Modify: `apps/web/src/features/help-center/HelpCenterArticlePage.tsx`
- Modify: `apps/web/src/features/help-center/HelpCenterHomePage.tsx`
- Modify: `apps/web/src/features/help-center/public-ui.tsx`
- Modify: `apps/web/src/index.css`
- Test: `tests/scripts/pilot-03-help-states.test.mjs`.

- [ ] Loading: `magic + happy` integrado ao skeleton/superfície, sem overlay.
- [ ] Busca sem resultado: `shrug + wink`, busca presente, limpar filtro e categorias sugeridas.
- [ ] Artigo inexistente: `shrug + happy`, busca, retorno à visão geral e lista de artigos.
- [ ] Erro de contrato público: mensagem operacional, retry e nenhuma mensagem técnica interna.
- [ ] Confirmar sucesso de navegação e retorno sem perda de contexto.

### Etapa 8 — QA visual e fechamento por commit

**Arquivos:**

- Modify: testes focados previstos nas etapas anteriores.
- Create: eventual relatório visual externo em `C:\Projetos\GSO-artifacts\pilot-03-20260723\`.

- [ ] Rodar typechecks, build e testes focados.
- [ ] Rodar smoke autenticado com fixture local `dashboard_viewer`.
- [ ] Rodar smoke público da Central em home, lista, artigo, busca sem resultado e artigo inexistente.
- [ ] Capturar console errors, request failures, overflow horizontal e foco básico.
- [ ] Capturar screenshots completas sem rótulos “PROPOSTA”, overlays de auditoria ou elementos temporários.
- [ ] Comparar antes/depois por viewport.
- [ ] Executar `git diff --check` e validação documental aplicável.

---

## Arquivos afetados

### Dashboard e navegação

- `apps/web/src/features/navigation/minimal-navigation.ts`
- `apps/web/src/features/navigation/MinimalAppShell.tsx`
- `apps/web/src/features/auth/AdminGate.tsx` somente se o teste revelar regressão de rota já autorizada; não alterar o contrato de autorização.
- `apps/web/src/features/analytics/AnalyticsShell.tsx`
- `apps/web/src/features/analytics/AnalyticsCeoPage.tsx`
- `apps/web/src/features/analytics/analytics-ui.tsx`
- `apps/web/src/index.css`

### Central pública

- `apps/web/src/features/help-center/HelpCenterHomePage.tsx`
- `apps/web/src/features/help-center/HelpCenterArticlesPage.tsx`
- `apps/web/src/features/help-center/HelpCenterArticlePage.tsx`
- `apps/web/src/features/help-center/public-ui.tsx`
- `apps/web/src/features/help-center/help-center-navigation.ts`
- `apps/web/src/index.css`

### Testes

- `tests/scripts/pilot-03-navigation.test.mjs`
- `tests/scripts/pilot-03-dashboard.test.mjs`
- `tests/scripts/pilot-03-help-home.test.mjs`
- `tests/scripts/pilot-03-help-list.test.mjs`
- `tests/scripts/pilot-03-help-article.test.mjs`
- `tests/scripts/pilot-03-help-states.test.mjs`
- `tests/scripts/help-center-navigation.test.mjs`

Não previstos: migrations, funções Supabase, views, RPCs, policies, contratos de autorização, secrets ou dependências novas.

## Componentes

### Alterados

- `MinimalAppShell`/`ShellNavigation`: renderização de seções já devolvidas pelo contrato.
- `HelpCenterHomePage`: composição da jornada e integração do Genius no hero.
- `HelpCenterArticlesPage`: paginação, lista responsiva e estado sem resultado.
- `HelpCenterArticlePage`: índice único, coluna única em telas menores e bloco final de próximo passo.
- `PublicSearchStateCard`: somente se a reutilização de estados justificar a alteração.
- `GeniusMascot`: somente se a validação visual encontrar regressão; a versão atual já está aprovada.

### Novos somente se comprovadamente reutilizados

- Um componente de estado público do Genius poderá ser extraído apenas se for usado em loading, vazio e not-found sem prop drilling excessivo.
- Um componente de paginação poderá ser extraído apenas se a Central tiver mais de um consumidor real.

Não criar wrappers genéricos para um único uso.

## Critérios de aceite

| Superfície | 1440px | 1024px | 390px |
| --- | --- | --- | --- |
| Dashboard viewer | somente Dashboard na sidebar; KPIs em linha; status curto | KPIs 3+2 equilibrados; sem espaço de terceiro card; sem overflow | navegação mínima mobile; leitura e controles sem corte |
| Home da Central | hero com Genius integrado; até 6 categorias; até 5 artigos; portal único | hero e categorias sem compressão; busca prioritária | até 3 categorias e 3 artigos; sem repetição; jornada útil antes da primeira rolagem |
| Lista | lista/paginação escaneável | lista sem overflow | cards/linhas adaptadas; URL preservada |
| Artigo | conteúdo dominante + índice sticky único somente com 3+ seções | coluna única | índice recolhível no topo; próximo passo após conteúdo |
| Estados | mensagens operacionais e ações claras | mesma hierarquia sem cortes | áreas de toque adequadas e sem sobreposição |

## Testes

- TDD por etapa: teste vermelho, implementação mínima, teste verde.
- Testes Node focados para contratos de markup, rotas, poses, estados e URL.
- `npm run contracts:typecheck`.
- `npm run web:typecheck`.
- `npm run web:build`.
- `node --test tests/scripts/genius-mascot.test.mjs tests/scripts/pilot-02-contract.test.mjs tests/scripts/pilot-03-*.test.mjs`.
- Smoke Playwright do viewer local com fixture `dashboard_viewer`.
- Smoke Playwright público da Central com captura de `console.error` e `requestfailed`.
- Verificação de overflow: `document.documentElement.scrollWidth <= document.documentElement.clientWidth` em 1440, 1024, 768 e 390px.
- `git diff --check`.
- `npm run documentation:validate:internal-docs` e `npm run repository:check-root` quando o lote estiver pronto.

## Evidências visuais

### Antes

- `C:\Projetos\GSO-artifacts\pilot-03-20260723\baseline\dashboard-viewer-1440x900.png`
- `C:\Projetos\GSO-artifacts\pilot-03-20260723\baseline\dashboard-viewer-1024x768.png`
- `C:\Projetos\GSO-artifacts\pilot-03-20260723\baseline\help-home-desktop.png`
- `C:\Projetos\GSO-artifacts\pilot-03-20260723\baseline\help-home-mobile.png`

### Depois

- Dashboard viewer 1440×900, 1024×768, loading, vazio e erro.
- Central home desktop/mobile, lista desktop/mobile, artigo desktop/mobile, busca sem resultado, artigo inexistente e loading.
- Prancha do mascote antes de qualquer aplicação nas telas.
- Captura `prefers-reduced-motion` do mascote.

Todas as capturas devem ser páginas completas, sem overlays temporários, rótulos “PROPOSTA”, dados fictícios ou componentes de auditoria.

## Commits planejados

1. `fix(navigation): simplificar shell do dashboard viewer`
   - somente navegação do viewer e teste de permissão/renderização.
2. `refactor(analytics): aprimorar hierarquia visual do piloto`
   - somente Dashboard, estados, status operacional, responsive KPI e testes do Dashboard.
3. `refactor(help-center): criar experiência guiada de documentação`
   - somente home, lista, artigo, estados públicos e estilos da Central.
4. `test(pilot): validar navegação e estados finais`
   - somente testes/smokes/helpers reutilizáveis, sem resultados temporários.

Cada commit exige `git diff --cached --check`, revisão do diff exato e validações correspondentes. Não usar `git add .`.

## Riscos

- O contrato de navegação pode devolver áreas válidas para outros perfis; a simplificação deve ser restrita ao `dashboard_viewer`.
- Paginação pode alterar URLs existentes; preservar `q`, `category` e compatibilidade semântica.
- Artigos com HTML/Markdown irregular podem não produzir três seções; nesse caso, não exibir índice vazio.
- O estado público pode depender de read models indisponíveis localmente; reportar limitação sem fabricar dados.
- Animações do Genius podem causar distração ou problemas de acessibilidade; validar reduced motion e não aplicar animação contínua adicional nas telas.
- Alterações de CSS podem afetar superfícies compartilhadas; limitar seletores ao namespace da Central/Dashboard e executar smoke público/interno.

## Condições de parada

Parar e reportar antes do commit correspondente quando:

- a correção visual de `celebrate` ou outra pose divergir do kit oficial;
- for necessário alterar backend, migration, RLS, RPC ou contrato de autorização;
- a fonte de dados do Dashboard não puder explicar um valor apresentado;
- paginação quebrar busca, categoria ou URL existente;
- houver overflow persistente, cortes de conteúdo ou sobreposição do Genius;
- surgir qualquer erro de console/rede não explicável;
- for necessário adicionar componente genérico sem reutilização comprovada;
- houver conteúdo sensível, secret ou credencial no diff;
- o working tree ficar sujo por alteração não classificada.
