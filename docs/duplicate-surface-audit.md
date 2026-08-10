# Duplicate Surface Audit & Domain Overlap Report — Confi One V1

This audit documents surface overlap analysis across internal authenticated routes in the system.

---

## Executive Summary

| Surface Pair | Overlap / Potential Duplication | Status / Resolution |
| :--- | :--- | :--- |
| **Cockpit Gerencial (`/admin/cockpit`)** vs **Fontes do Dashboard (`/admin/settings/dashboard-sources`)** | Exposing identical administrative capabilities (sources, pipeline roles, stage mapping, company reconciliation). | **RESOLVED - REMOVED / REDIRECTED**. Cockpit removed from navigation; `/admin/cockpit` redirects to `/admin/settings/dashboard-sources`. All capabilities mounted in Fontes do Dashboard. |
| **Dashboard Gerencial (`/admin/analytics`)** vs **Fontes do Dashboard (`/admin/settings/dashboard-sources`)** | Dashboard Gerencial is operational analytics reading; Fontes do Dashboard is configuration & status. | **CANONICAL SEPARATION**. Dashboard = Reading & Analysis. Dashboard Sources = Catalog & Sync setup. |
| **Integrações (`/admin/settings/integrations`)** vs **Fontes do Dashboard (`/admin/settings/dashboard-sources`)** | Integrações manages OAuth/API keys & provider connections. Fontes manages pipeline business mappings. | **CANONICAL SEPARATION**. |
| **Histórico de Sincronizações (`/admin/settings/sync-history`)** vs **Fontes do Dashboard (`/admin/settings/dashboard-sources`)** | Histórico is raw run log/execution audit. Fontes is live configuration state. | **CANONICAL SEPARATION**. |
| **Conhecimento (`/admin/knowledge`)** vs **Central de Ajuda (`/admin/settings/help-center`)** | Knowledge is article CRUD; Central de Ajuda is public portal branding & section settings. | **CANONICAL SEPARATION**. |
| **Tenants (`/admin/tenants`)** vs **Clientes (`/support/clientes`)** vs **Carteira CS (`/cs/portfolio`)** | Tenants = Platform tenant entities & subscriptions. Clientes = Support tickets by customer. Carteira CS = Account manager portfolios. | **CANONICAL SEPARATION**. Each tailored to role access level. |
| **Build Journal (`/admin/build-journal`)** vs **Product Docs (`/admin/product-docs`)** | Build Journal = Chronological execution log. Product Docs = Architecture & PRD specs. | **CANONICAL SEPARATION**. |

---

## Detailed Findings & Capability Destinations

### 1. Cockpit Gerencial Capabilities Audit
- **Pipeline Catalog & Area Mapping**: Moved to **Fontes do Dashboard** (`/admin/settings/dashboard-sources`).
- **Pipeline Roles (`PipelineRoleSettings`)**: Moved to **Fontes do Dashboard** (`/admin/settings/dashboard-sources`).
- **Stage Mapping (`StageMappingSettings`)**: Moved to **Fontes do Dashboard** (`/admin/settings/dashboard-sources`).
- **HubSpot–OMIE Company Reconciliation (`CompanyReconciliationPanel`)**: Moved to **Fontes do Dashboard** (`/admin/settings/dashboard-sources`).
- **Sync Executions & Log Summary**: Accessible directly via **Histórico de sincronizações** (`/admin/settings/sync-history`).

---

## Detailed Route Inventory & Classification

| Route | Display Name | Primary Domain | Status |
| :--- | :--- | :--- | :--- |
| `/meu-perfil` | Meu perfil | Identity / Account | CANONICAL |
| `/admin/analytics` | Dashboard gerencial | Executive Analytics | CANONICAL |
| `/admin/access` | Usuários e acesso | Access Governance | CANONICAL |
| `/admin/cockpit` | Cockpit gerencial | Administrative | **RESOLVED - REDIRECT** |
| `/admin/settings/integrations` | Integrações | Connections & Providers | CANONICAL |
| `/admin/settings/dashboard-sources` | Fontes do Dashboard | Pipeline & Source Config | CANONICAL |
| `/admin/settings/sync-history` | Histórico de sincronizações | Execution Audit | CANONICAL |
| `/admin/settings/brands` | Marcas | Multi-brand Config | CANONICAL |
| `/admin/settings/help-center` | Central de ajuda | Help Center Admin | CANONICAL |
| `/admin/knowledge` | Artigos | Knowledge Base CRUD | CANONICAL |
| `/admin/knowledge/new` | Novo artigo | Knowledge Base Editor | CANONICAL |
| `/admin/customer-portal` | Portal do cliente | Customer Portal Admin | CANONICAL |
| `/admin/system` | Sistema | System Diagnostics | CANONICAL |
| `/admin/build-journal` | Build Journal | Development History | CANONICAL |
| `/admin/product-docs` | Product Docs | Architectural Specs | CANONICAL |
| `/support/queue` | Fila de suporte | Ticket Queue | CANONICAL |
| `/support/inbox` | Inbox | Conversations | CANONICAL |
| `/support/tickets` | Tickets | Support Tickets List | CANONICAL |
| `/support/clientes` | Clientes | Support Customer Directory | CANONICAL |
| `/cs/portfolio` | Portfólio CS | Customer Success Portfolio | CANONICAL |
| `/internal-actions` | Ações internas | Operational Governance | CANONICAL |
| `/engineering` | Engenharia | Engineering Tasks | CANONICAL |
