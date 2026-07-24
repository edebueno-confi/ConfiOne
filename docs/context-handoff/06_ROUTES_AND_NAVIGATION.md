# Routes and Navigation

## Rotas públicas

- `/help`
- `/help/:spaceSlug`
- `/help/:spaceSlug/articles`
- `/help/:spaceSlug/articles/:articleSlug`

## Portal do cliente

- `/portal`
- `/portal/tickets`
- `/portal/tickets/:ticketId`
- `/portal/help`
- `/portal/help/:articleSlug`

## Administração

- `/admin`
- `/admin/visao-geral`
- `/admin/analytics`
- `/admin/tenants`
- `/admin/knowledge`
- `/admin/knowledge/new`
- `/admin/knowledge/:articleId/edit`
- `/admin/customer-portal`
- `/admin/internal-areas`
- `/admin/build-journal`
- `/admin/product-docs`
- `/admin/access`
- `/admin/system`
- `/admin/settings`

## Operação interna

- `/inicio`
- `/support`
- `/support/inbox`
- `/support/queue`
- `/support/tickets`
- `/support/tickets/:ticketId`
- `/support/clientes`
- `/support/customers`
- `/support/customers/:tenantId`
- `/cs/portfolio`
- `/engineering`
- `/engineering/work-items/:workItemId`
- `/internal-actions`
- `/internal-actions/:actionId`

## Navegação atual

`buildMinimalNavigation` monta seções por permissões:

- `Minha rotina`
- `Inteligência`
- `Administração`
- caso especial `dashboard_viewer` com dashboard, área do cliente, central, conteúdo e configurações.

## Achados

- Há redirects que ainda caem em `/admin` por padrão em alguns cenários.
- A navegação foi melhorada, mas ainda pode apresentar excesso de opções para plataforma em MVP.
- Rotas existem mesmo para módulos parcialmente implementados; isso aumenta risco de percepção de produto inacabado.

## Acessibilidade por perfil no QA V2

- Públicas sem autenticação: `/help/genius`, `/help/genius/articles`, artigo público e artigo inexistente.
- Admin local `ede.oliveira@confi.com.vc`: `/inicio`, `/admin/analytics`, `/support/queue`, `/support/tickets`, `/support/inbox`, `/support/clientes`, `/cs/portfolio`, `/internal-actions`, `/admin/knowledge`, `/admin/knowledge/new`, `/admin/settings`, `/admin/access`, `/admin/tenants`.
- Customer local `marina.ops@support-qa-a.local`: `/portal`, `/portal/help`.

## Rotas não comprovadas visualmente no V2

- Detalhe individual de ticket.
- Detalhe individual de cliente B2B.
- Rotas profundas de `engineering/work-items/:workItemId` e `internal-actions/:actionId` foram apenas parcialmente inferidas; `/internal-actions` redirecionou para um detalhe existente.
