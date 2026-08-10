# Auditoria Visual de Superfícies Visíveis — Confi One V1

**Data:** 10/08/2026
**Escopo:** Normalização Estrutural do Canvas (Domínio Configurações e Superfícies Internas Visíveis)
**Status:** PASS (22 / 22 rotas auditadas e validadas)
**Evidência Visual:** `output/playwright/confi-one-v1-global-audit/confi-one-v1-visible-surfaces.png`

---

## 1. Resumo Executivo

Após as correções atômicas de layout, todas as superfícies visíveis do Confi One V1 foram auditadas. A anomalia de **"Redundant Page Surface"** (container de página inteiro encobrindo o Canvas `#081220` e gerando a impressão de "uma tela dentro de outra tela") foi completamente eliminada.

### Hierarquia Canônica Aplicada

1. **Shell Topbar & Sidebar:** `#0F1A2E` (`rgb(15, 26, 46)`)
2. **Canvas:** `#081220` (`rgb(8, 18, 32)`) — plano de fundo de trabalho exposto ao redor do Page Header e entre cartões.
3. **Page Header:** Transparente sobre Canvas `#081220`.
4. **Surface 1:** `#131E33` (`rgb(19, 30, 51)`), borda `#22324D`, radius 10px — cartões primários, tabelas e rails de métricas assentados diretamente sobre o Canvas com gap de 16px.
5. **Surface 2:** `#18263F` (`rgb(24, 38, 63)`), borda `#22324D`, radius 8px — sub-cartões e painéis de detalhe.

---

## 2. Matriz de Auditoria de Superfícies

| # | Rota | Superfície / Tela | Canvas #081220 Exposto | Page Wrapper Redundante | Status Visual |
|---|---|---|:---:|:---:|:---:|
| 1 | `/meu-perfil` | Meu perfil | SIM | REMOVIDO | **PASS** |
| 2 | `/admin/analytics` | Dashboard gerencial | SIM | N/A | **PASS** |
| 3 | `/admin/access` | Usuários e acesso | SIM | REMOVIDO | **PASS** |
| 4 | `/admin/settings/integrations` | Integrações | SIM | REMOVIDO | **PASS** |
| 5 | `/admin/settings/dashboard-sources` | Fontes do Dashboard | SIM | REMOVIDO | **PASS** |
| 6 | `/admin/settings/sync-history` | Histórico de sincronizações | SIM | REMOVIDO | **PASS** |
| 7 | `/admin/settings/brands` | Marcas | SIM | REMOVIDO | **PASS** |
| 8 | `/admin/settings/help-center` | Central de ajuda | SIM | REMOVIDO | **PASS** |
| 9 | `/admin/knowledge` | Artigos | SIM | REMOVIDO | **PASS** |
| 10 | `/admin/knowledge/new` | Novo artigo | SIM | REMOVIDO | **PASS** |
| 11 | `/admin/tenants` | Tenants | SIM | REMOVIDO | **PASS** |
| 12 | `/admin/customer-portal` | Portal do cliente | SIM | REMOVIDO | **PASS** |
| 13 | `/admin/system` | Sistema | SIM | REMOVIDO | **PASS** |
| 14 | `/admin/build-journal` | Build Journal | SIM | REMOVIDO | **PASS** |
| 15 | `/admin/product-docs` | Product Docs | SIM | REMOVIDO | **PASS** |
| 16 | `/support/queue` | Fila de suporte | SIM | REMOVIDO | **PASS** |
| 17 | `/support/inbox` | Inbox | SIM | REMOVIDO | **PASS** |
| 18 | `/support/tickets` | Tickets | SIM | REMOVIDO | **PASS** |
| 19 | `/support/clientes` | Clientes | SIM | REMOVIDO | **PASS** |
| 20 | `/cs/portfolio` | Portfólio CS | SIM | REMOVIDO | **PASS** |
| 21 | `/internal-actions` | Ações internas | SIM | REMOVIDO | **PASS** |
| 22 | `/engineering` | Engenharia | SIM | REMOVIDO | **PASS** |

---

## 3. Validação dos Quality Gates

- `npm run web:typecheck`: 0 erros
- `npm run contracts:typecheck`: 0 erros
- `npm run web:build`: OK (1.76s)
- `npm run lint`: 0 erros (192 warnings)
- `npm run local:qa:secret-scan`: 0 segredos
- `git diff --check`: 0 erros de formato/espaço
