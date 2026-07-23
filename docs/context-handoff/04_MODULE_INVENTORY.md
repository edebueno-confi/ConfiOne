# Module Inventory

## Módulos web encontrados

| Módulo | Rotas principais | Finalidade | Status |
| --- | --- | --- | --- |
| `login` | `/login` | Autenticação | Pronto funcional, depende de contexto Supabase local/remoto |
| `auth` | gates e redirects | Bootstrap, gates admin/portal e acesso negado | Funcional parcial |
| `admin-shell`/`navigation` | shell interno | Navegação global e permissões por tela | Em evolução; nomenclatura e agrupamento ainda em revisão |
| `analytics` | `/admin/analytics` | Dashboard gerencial | Parcialmente maduro |
| `settings` | `/admin/settings` | Configurações e integrações | Parcial; precisa clareza operacional |
| `access` | `/admin/access` | Usuários, papéis, convites e permissões | Parcial; UX e regras precisam consolidação |
| `tenants` | `/admin/tenants` | Contas/clientes B2B admin | Parcial; redesign recente não resolve modelo final |
| `customers` | `/support/clientes` | Cockpit de clientes B2B no suporte | Parcial |
| `cs` | `/cs/portfolio` | Carteira de Customer Success | Parcial com contrato novo local |
| `support` | `/support/queue`, `/support/tickets` | Fila, tickets e cliente 360 | Funcional parcial |
| `inbox` | `/support/inbox` | Atendimento/conversas | Parcial |
| `internal-actions` | `/internal-actions` | Acionamentos entre áreas | Parcial |
| `engineering` | `/engineering` | Produto/engenharia | Parcial |
| `knowledge` | `/admin/knowledge` | Gestão de artigos | Funcional parcial |
| `help-center` | `/help/:spaceSlug` | Central pública | Mais maduro no MVP público |
| `customer-portal` | `/portal` | Área autenticada do cliente | Parcial |
| `home` | `/inicio` | Cockpit interno inicial | Parcial |
| `system` | `/admin/system` | Observabilidade/auditoria | Parcial |
| `product-docs` | `/admin/product-docs` | Documentos internos | Parcial/apoio |
| `build-journal` | `/admin/build-journal` | Diário de construção | Conteúdo auxiliar |

## Componentes transversais relevantes

- `GeniusMascot`, `GeniusSyncOverlay`, `Avatar`, `FilterTabs`, `ThemeToggle`.
- `components/ui.tsx`, `components/states.tsx`, `components/minimal-ui.tsx`, `components/minimal-states.tsx`.

## Contratos TypeScript

- `apps/web/src/contracts/admin-contracts.ts`
- `apps/web/src/contracts/support-contracts.ts`
- `apps/web/src/contracts/public-contracts.ts`
- `packages/contracts/src/ticketing.ts`

## Risco de módulo

Muitos módulos existem simultaneamente, mas com níveis diferentes de maturidade. A direção precisa decidir se o MVP público imediato publica somente Dashboard + Central de Ajuda ou se mantém todo o shell interno visível.
