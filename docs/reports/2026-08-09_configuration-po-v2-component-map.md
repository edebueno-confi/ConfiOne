# Configuration PO Visual Lock V2 — Component map

Data: 2026-08-09. `NEW` não autoriza capability nova; identifica somente
composição visual ainda ausente e deve consumir contratos/handlers existentes.

| Tela | Bloco visual | Componente atual | Decisão | Motivo |
| --- | --- | --- | --- | --- |
| Integrações | Shell e cabeçalho | `MinimalAppShell`, `UiPageHeader` | ADAPT | Compartilhar geometria V2 sem alterar guards. |
| Integrações | Providers HubSpot/OMIE | `SettingsIntegrationsPanel` e subcomponentes | ADAPT | Dados e mutation de credencial já existem; reorganizar na composição aprovada. |
| Integrações | Permissões, segurança e eventos | read models de integrações | ADAPT/OMIT | Renderizar somente dados expostos; vazio factual onde não houver eventos. |
| Configurações gerais | Summary e módulos | `SettingsPage`, catálogo de navegação | ADAPT | Cards devem apontar apenas para superfícies reais. |
| Configurações gerais | Atividade recente | eventos/read models existentes | OMIT quando ausente | Não criar feed frontend fictício. |
| Usuários e acessos | Lista, filtros e detalhe | `InternalControlPlanePage` | ADAPT | Preservar grants reais e detalhe contextual. |
| Central de Ajuda | Summary, editorial e publicação | `HelpCenterSettingsPage` | ADAPT | Manter campos e tema claro fixo da central pública. |
| Histórico | Summary, filtros, lista e detalhe | `SyncHistorySettingsPage` | ADAPT | Etapas e dados técnicos só quando o contrato expuser conteúdo sanitizado. |
| Fontes | Summary, origem, ritmo e catálogo | `DashboardSourcesSettingsPage` | ADAPT | Providers e scheduler reais; sem fallback de planilha. |
| Fontes | Pipelines e coleções | contratos de fontes/pipelines | REUSE/OMIT | Exibir somente domínios com pipeline publicado. |
| Shell | Sidebar e submenu colapsado | `MinimalAppShell` | REUSE | Já possui rail e flyout; corrigir apenas divergência comprovada. |
