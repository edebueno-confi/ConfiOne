# Technical Architecture

## Monorepo

Workspaces:

- `apps/web`
- `packages/contracts`

## Frontend

- React 19.
- React Router 7.
- Vite 8.
- Tailwind 4.
- Recharts.
- TipTap.

Camada web usa lazy routes, gates de autenticação e contratos TypeScript locais.

## Backend local

- Supabase CLI.
- Postgres 17.
- Edge Functions.
- Migrations SQL versionadas.
- pgTAP para testes de banco.

## Scripts principais

- `npm run web:typecheck`
- `npm run web:build`
- `npm run contracts:typecheck`
- `npm run supabase:test:db`
- `npm run supabase:lint:db`
- `npm run supabase:verify`
- `npm run documentation:validate:internal-docs`
- scripts QA locais em `tests/scripts`

## Edge Functions

Funções relevantes:

- `hubspot-sync`
- `omie-sync`
- `analytics-scheduled-run`
- `analytics-integration-run`
- `analytics-spreadsheet-import`
- `hubspot-cs-migration`
- `hubspot-omie-property-sync`
- `ticket-evidence-upload`
- `ticket-evidence-download`

## Observação

O código tem contratos reais extensos, mas há risco de excesso de superfície exposta antes de maturidade uniforme.

## Arquivos técnicos principais

- `apps/web/src/app/router.tsx`: rotas públicas, portal, admin e operação interna.
- `apps/web/src/features/navigation/minimal-navigation.ts`: construção do menu por permissões.
- `apps/web/src/app/supabase-browser.ts`: cliente Supabase do frontend.
- `apps/web/src/features/auth/*`: bootstrap, gates e contexto.
- `apps/web/src/features/analytics/*`: Dashboard Gerencial.
- `apps/web/src/features/help-center/*`: Central pública.
- `apps/web/src/features/support/*`: suporte, fila, tickets e inbox.
- `apps/web/src/features/customers/*`: clientes B2B no workspace.
- `apps/web/src/features/cs/*`: carteira CS.
- `apps/web/src/features/access/*`: acessos.
- `apps/web/src/features/settings/*`: integrações/configurações.
- `supabase/migrations/*.sql`: schema, RLS, views e RPCs.
- `supabase/functions/*`: integrações e workers.
- `packages/contracts/src/*`: contratos compartilhados.

## Componentes e contratos compartilhados

- UI: `apps/web/src/components/ui.tsx`, `states.tsx`, `minimal-ui.tsx`, `minimal-states.tsx`, `FilterTabs.tsx`.
- Mascote/estado: `GeniusMascot.tsx`, `GeniusSyncOverlay.tsx`.
- Contratos: `admin-contracts.ts`, `support-contracts.ts`, `public-contracts.ts` e `packages/contracts`.
