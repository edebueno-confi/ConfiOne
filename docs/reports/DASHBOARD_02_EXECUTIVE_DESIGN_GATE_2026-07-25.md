# DASHBOARD-02.3.1 — Gate de organização, design e preservação funcional

## Escopo

Este gate cobre somente `/admin/analytics`, seus componentes executivos e o comportamento condicional do shell para os perfis administrativo e `dashboard_viewer`. Central de Ajuda, Knowledge, Taxonomia, Portal, migrations, RLS, fórmulas de negócio e integrações externas permanecem fora do escopo.

## Organização executiva

- O título principal permanece `Visão Executiva`; o hero duplicado `Decida com o contexto certo` foi removido.
- A primeira sequência é contexto, filtros, `Desempenho no período`, `Posição atual`, `Exceções`, resumos de domínio e pipelines.
- O desempenho usa no máximo quatro KPIs: pipeline aberto, receita ganha, conversão e negócios ganhos.
- Posição atual é explicitamente independente do período selecionado.
- `Análises avançadas` permanece recolhida e exclusiva do administrador.

## Estados e frescor

Os estados da fundação (`fresh`, `stale`, `partial`, `empty`, `not_configured`, `syncing`, `unavailable` e `error`) são renderizados sem transformar ausência, falha ou falta de sincronização em zero. Um zero é exibido somente quando o snapshot respondeu com zero real. A interface não afirma atualização sem timestamp; quando o timestamp não existe, informa que a sincronização não foi registrada.

`partial` representa cobertura incompleta da fonte. Saldo vencido, clientes com alerta e tickets prioritários são riscos operacionais e não são marcados como parciais apenas por serem prioritários.

## Temporalidade

Comparações aparecem dentro do KPI e somente quando existe base anterior válida no mesmo recorte. Percentuais são apresentados em pontos percentuais quando aplicável. Não há frase temporal solta fora do KPI.

## Exceções, domínios e pipelines

- Até três exceções determinísticas, incluindo degradação de fonte em `Dados e integrações`.
- Resumos de domínio são complementares aos KPIs e não repetem diretamente seus valores.
- Pipelines usam somente tickets presentes em `support.byPipeline`, têm nome honesto (`Pipelines de atendimento prioritários`), ordenação determinística e limite de cinco.
- O `dashboard_viewer` não recebe links administrativos de aprofundamento.

## Shell e perfis

O `dashboard_viewer` vê somente o Dashboard Gerencial, sem Logs, Configuração, Portal, Knowledge, sincronização, exportação ou links administrativos. A identidade exibida é `Visualizador gerencial`, nunca `Administrador da plataforma`. O backend, grants e contratos de autorização não foram ampliados.

## Responsividade e acessibilidade

Foram verificadas as larguras 1440, 1366, 1024, 768 e 390 px, com filtros recolhíveis no mobile e abas preservando navegação horizontal. A implementação mantém landmarks, foco visível, nomes acessíveis e reduced motion do sistema existente. Tema escuro foi verificado programaticamente no shell interno.

## Preservação funcional

Foram preservados os RPCs, filtros, exportação administrativa, sincronização do shell fora da Visão Executiva, navegação existente e páginas de domínio. Não foram criadas rotas de pipelines nem alterações de backend.

## Validação

- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`
- testes focados de analytics, fundação e regressão do agendamento
- smoke autenticado admin e `dashboard_viewer`
- console sem erros ou warnings de aplicação
- overflow visual verificado nas larguras cobertas
- `npm run repository:check-root`
- `git diff --check`

## Riscos restantes

As requisições abortadas observadas pertencem à fila de suporte e não foram alteradas neste lote. A fixture local não hidrata fontes externas; portanto o pacote distingue zero real de fonte degradada sem fabricar dados. A rota detalhada de pipelines continua backlog.

## Critério do gate

Após revisão do pacote de evidências, o lote está pronto para o novo gate visual. Merge e deploy permanecem proibidos neste turno.
