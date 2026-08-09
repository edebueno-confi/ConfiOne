# Mapa de componentes — Admin Configuration Blueprint V1

Data: 2026-08-09. Escopo: shell, Usuários e acessos, Histórico, Fontes e Integrações. A classificação foi fechada antes de alterar runtime; `NEW` não autoriza inventar capability.

## Evidência das referências

Todas as cinco referências foram abertas individualmente em tamanho original, 1672×941. A composição comum é shell navy integrado, navegação de alta densidade, título/ação no topo, resumo baixo, toolbar de filtros e superfície operacional dominante. O detalhe contextual é rail/drawer, não uma segunda página; azul seleciona/aciona, rosa somente assina e provider real pode manter logo próprio.

| Blueprint | Bloco | Componente atual | Classificação | Decisão |
| --- | --- | --- | --- | --- |
| Shell | layout autenticado | `MinimalAppShell` | ADAPT | Preservar auth, tema e preferência; alinhar medidas e comportamento ao contrato. |
| Shell | catálogo autorizado | `buildMinimalNavigation` | REUSE | Manter a interseção release + screen keys; não duplicar permissionamento. |
| Shell | item e grupo de navegação | `ShellNavigation` | ADAPT | Reusar links reais; trocar submenu colapsado inline por flyout overlay acessível. |
| Shell | ícones | `NavigationGlyph` e `SettingsNavIcon` | REUSE | Manter SVG linear existente, sem cores por domínio. |
| Shell | busca global | `GeniusGlobalSearch` | REUSE | Exibir somente sua capability existente. |
| Shell | conta e tema | `Avatar`, `ThemeToggle` | REUSE | Preservar handlers e menu real. |
| Shell | scrim/flyout | inexistente | NEW | Componente local de composição, sem regra de produto; fecha por seleção, fora e Esc. |
| Usuários | dados, mutations e guards | `InternalControlPlanePage` + APIs de acesso | REUSE | Preservar contratos e comandos do servidor. |
| Usuários | tabela, toolbar e métricas | `UiTable`, `UiToolbar`, `UiMetricRow` | ADAPT | Ajustar composição/densidade, sem calcular total inexistente. |
| Usuários | detalhe de usuário | `UsersPanel` + `gso-ui-aside` | ADAPT | Converter rail em drawer responsivo quando necessário; manter atributos e ações reais. |
| Usuários | convite/importação | não há handler genérico aprovado | OMIT | Não criar botão para reproduzir o screenshot. |
| Histórico | leitura e agrupamento | `SyncHistorySettingsPage` + `sync-history-view` | REUSE | Preservar filtros, paginação e agregações testadas. |
| Histórico | ciclos expansíveis | `HistoryGroup` | ADAPT | Tornar tabela/lista mais densa sem expor erro bruto ou correlação sensível. |
| Histórico | exportação | não há contrato | OMIT | Não criar. |
| Fontes | catálogo e schedule | `DashboardSourcesSettingsPage` + analytics API | REUSE | Preservar handlers e distinção entre fonte, pipeline e agenda. |
| Fontes | tabela dominante e resumo | `UiTable`, `UiMetricRow` | ADAPT | Reordenar para o blueprint e usar somente colunas reais. |
| Fontes | nova fonte/provider futuro | não há onboarding | OMIT | Não criar. |
| Integrações | read model e escrita credencial | `settings-api`, `SettingsIntegrationsPanel` | REUSE | Manter HubSpot/OMIE e segredo somente na mutation existente. |
| Integrações | cartões de provider | `IntegrationProviderCard` | ADAPT | Reagrupar em unidades operacionais, mantendo estado sanitizado. |
| Integrações | resumo e rail | `IntegrationsSummary`, `IntegrationHealthRail` | ADAPT | Compactar e evitar repetição de falha. |
| Integrações | testar conexão/sincronizar agora/nova conexão | não há handlers publicados | OMIT | Não simular ação. |
| Estados | loading, vazio, erro e permissão | `MinimalState`, `UiEmptyState`, `ErrorState` | REUSE | Tornar o estado proporcional e factual. |

## Skills inventariadas e lidas

- `superdesign`: análise de repositório já inicializada; nenhum draft, imagem ou gerador foi chamado por decisão expressa do Product Owner.
- `genius-cockpit-ui-blueprint`: análise de blueprint, densidade, React/Tailwind e QA visual.
- `test-driven-development`: testes de comportamento antes de código novo.
- `playwright`: evidência real de browser em `output/playwright/`.
- `genius-code-quality` e `genius-documentation-governance`: gates e reconciliação documental.

## Contradições reconciliadas

O contrato novo substitui, apenas nas cinco superfícies, a centralidade de 1920×1080, qualquer submenu que empurre conteúdo, estética sobrenatural do Gênio, cor por domínio, iconografia decorativa e a noção de Configurações como analytics. `GENIUS_HIGH_DENSITY_INTERFACE_V1`, Design System, Navigation Contract, Settings V4 e Admin Access receberam nota datada de precedência; seu conteúdo histórico permanece preservado.
