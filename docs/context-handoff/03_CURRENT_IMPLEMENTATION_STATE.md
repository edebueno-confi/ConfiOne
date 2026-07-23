# Current Implementation State

## Estado por domínio

| Domínio | Estado | Evidência | Lacuna principal |
| --- | --- | --- | --- |
| Dashboard gerencial | Parcialmente maduro | `apps/web/src/features/analytics`, Edge Functions de analytics, migrations 20260718-20260723 | QA final de release, decisão de métricas CEO e deploy/scheduler remoto |
| HubSpot | Parcialmente implementado | `hubspot-sync`, `hubspot-cs-migration`, `hubspot-property-setup`, tabelas `hubspot_*` | Governança de writes, consumo de API, ativação remota e estratégia incremental final |
| OMIE | Parcialmente implementado | `omie-sync`, `hubspot-omie-property-sync`, docs recentes de sync | Scheduler remoto e observabilidade produtiva dependem de secrets/deploy aprovados |
| Central pública de ajuda | Pronta para leitura local | `/help/genius`, 57 artigos importados, screenshots QA | Polimento editorial/visual e garantia de assets dos artigos |
| Admin Knowledge | Funcional parcial | `KnowledgePage`, `KnowledgeArticleEditorPage`, RPCs admin knowledge | Fluxo editorial completo, revisão humana e governança operacional |
| Suporte | Funcional parcial | `/support/queue`, `/support/tickets`, RPCs e views de tickets | UX final, regra completa de SLA, attachments e fluxo de handoff |
| Clientes B2B | Funcional parcial | `CustomersPage`, `TenantsPage`, contratos B2B/CS recentes | Modelo final de grupo econômico, entidade legal, negócios e visualização principal |
| Carteira CS | Parcialmente implementada | `CsPortfolioPage`, migration `20260723203000` | Dados produtivos/owners reais e validação de operação real |
| Acessos/permissões | Funcional parcial | `AccessPage`, migrations de profile/screen access | Matriz flexível por área/função e dependências de telas precisa consolidar |
| Portal do cliente | Funcional parcial | `/portal`, views customer portal | Escopo de MVP externo e permissões por cliente ainda precisam decisão |
| Produto/Engenharia | Parcial | `/engineering`, `InternalActionsWorkspacePage` | Fluxo real de demanda entre suporte/CS/produto não está finalizado |
| Build Journal/Product Docs | Conteúdo interno | rotas admin correspondentes | Pode ser excluído do MVP se atrapalhar foco de release |

## Estado Git

O working tree contém arquivos modificados e não rastreados. O pacote preserva esse estado e não tenta normalizar Git.

## Estado de documentação

Há documentação extensa em `docs/`, com blocos históricos e blocos canônicos recentes. `PROJECT_STATE.md`, `ROADMAP_BUILDOUT_V3.md`, `CODEX_EXECUTION_RULES.md`, `ARCHITECTURE_RULES.md`, `VIEW_RPC_CONTRACTS.md` e este Context Pack devem prevalecer sobre documentos antigos quando houver conflito.
