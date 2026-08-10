# Configuration PO V2.1 — Component map

Data: 2026-08-09 · Branch: `codex/admin-configuration-visual-v1`

Classificação por região: **REUSE** (componente existente sem alteração de composição),
**ADAPT** (existente, recomposto), **NEW** (criado nesta fase), **OMIT** (não renderizado —
exige justificativa de capability).

## Shell (Fase 1 — congelado)

| Região | Classe | Componente | Nota |
| --- | --- | --- | --- |
| Sidebar (240/56, grupos, item ativo, flyout) | REUSE | `GeniusSidebar` / `ShellNavigation` | arquitetura preservada; conteúdo derivado de grants reais |
| Topbar | ADAPT | `ShellTopbar` em `MinimalAppShell.tsx` | já existia oculta em desktop; religada e recomposta como primitive única |
| Breadcrumb | NEW | `resolveMinimalBreadcrumb` | derivado do mesmo modelo de rotas da sidebar |
| Busca global | REUSE | `GeniusGlobalSearch` | capability real preservada, reposicionada na topbar |
| Controle de tema | REUSE | `ThemeToggle` | movido do menu de conta para a topbar |
| Recolher menu | ADAPT | rodapé da sidebar | Ctrl/Cmd+B, foco e persistência preservados |
| Trilha dentro da página | OMIT | `UiPageHeader` | duplicava o breadcrumb da topbar; o blueprint tem uma trilha só |

## Tela 01 — Integrações (Fase 2)

| Região do blueprint | Classe | Componente | Nota |
| --- | --- | --- | --- |
| A. Cabeçalho | ADAPT | `UiPageHeader` | título 24px, descrição do blueprint, ação real de atualizar estado |
| A. Ação `Nova conexão` | **OMIT** | — | **capability inexistente**: `saveManagedIntegration` atualiza fontes já publicadas; não há fluxo de criação de conexão no backend |
| B. Painéis HubSpot e OMIE | NEW | `IntegrationProviderPanel` | primitive **única** para os dois provedores |
| B. Grade de 3 métricas | NEW | `providerMetrics` (`integration-health.mjs`) | Último sucesso / Última falha / Saúde das credenciais |
| B. Escopo / Perfis sincronizados | NEW | `integrationScopes` | lê `config.domains` e `config.resource_label`, chaves que a própria tela grava |
| B. Ação `Gerenciar credenciais` | REUSE | formulários HubSpot/OMIE existentes | agora em botão, não em `<details>` |
| B. Ação `Ver histórico` | REUSE | link para `/admin/settings/sync-history` | rota real |
| B. Ação `Testar conexão` | **OMIT** | — | **capability inexistente**: não há verificação de conexão sob demanda no backend nesta versão |
| B. Menu contextual `⋮` | **OMIT** | — | **capability inexistente**: os únicos comandos reais do painel já estão na barra de ações; um menu com um item duplicado não corresponde a comando adicional |
| C. Permissões e escopos | NEW | `IntegrationScopesPanel` | uma linha por provedor, chips neutros |
| C. Política de segurança | NEW | `IntegrationSecurityPolicy` | 4 afirmações factuais de produto; substitui `IntegrationSecuritySummary` |
| D. Eventos recentes | NEW | `IntegrationEventsTable` | região estrutural; colunas do blueprint + estado vazio |
| — Trilho de KPIs da V2 | **REMOVIDO** | `IntegrationsSummary` | não existe no blueprint; o estado por fonte pertence ao painel da fonte |
| — Rail de governança da V2 | **REMOVIDO** | `IntegrationHealthRail`, `IntegrationSyncStatus` | substituídos pelas regiões C do blueprint |
| — Faixa de benefícios da V2 | **REMOVIDO** | `SettingsBenefitsFooter` | não existe no blueprint |

### Nota sobre "Eventos recentes"

A superfície de Integrações lê `vw_admin_managed_integrations`, que publica o **estado
atual** de cada fonte, não uma série de eventos. Não há read model de eventos publicado
nesta superfície. A região é mantida com cabeçalho de colunas e estado vazio factual, e o
link `Ver histórico completo` aponta para a tela que possui a série. Nenhum evento é
fabricado. Quando existir contrato de eventos, o componente já aceita a lista via prop
`events` sem mudança de composição.

### Componentes que deixaram de ser referenciados

`IntegrationProviderCard`, `IntegrationsSummary`, `IntegrationHealthRail`,
`IntegrationSyncStatus`, `IntegrationSecuritySummary` e `SettingsBenefitsFooter`
permanecem no repositório sem uso nesta tela. Não foram apagados neste lote porque a
remoção de arquivo é irreversível no diff e pode afetar telas que ainda não foram
auditadas. A limpeza entra no lote de encerramento do macro-lote, após as seis telas.
