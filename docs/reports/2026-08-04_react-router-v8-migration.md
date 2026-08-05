# Migração para react-router 8 e fechamento do advisory

Data: 2026-08-04
Checkout canônico: `C:\Projetos\GSO-old`
Branch do lote: `codex/react-router-v8-migration-20260804`
Base preservada: `refs/archive/react-router-v8-migration-start-20260804` (`4d4cb14`)
Análise que originou o lote: `docs/reports/2026-08-04_react-router-advisory-analysis.md`

## Resultado

Advisory GHSA-qwww-vcr4-c8h2 fechado. `npm audit --omit=dev` passou de
2 vulnerabilidades altas para 0. `npm audit` completo também reporta 0.

Nenhuma alteração de backend, banco, migration, RPC, view, contrato, permissão,
RLS, integração ou dado. A mudança é exclusivamente de dependência de frontend e
de módulo de import.

## O que mudou

### Dependências (`apps/web/package.json`)

| Pacote | Antes | Depois |
| --- | --- | --- |
| `react-router-dom` | `^7.15.0` | removido |
| `react-router` | não declarado | `^8.3.0` |
| `react` | `^19.2.5` | `^19.2.7` |
| `react-dom` | `^19.2.5` | `^19.2.7` |

Instalado após o lote: `react-router@8.3.0`, `react@19.2.8`, `react-dom@19.2.8`.
`package-lock.json` regenerado.

Requisitos da linha 8 conferidos no ambiente local: Node `>= 22.22.0` atendido
(`v22.22.3`), React `>= 19.2.7` atendido, Vite `>= 7` atendido (Vite 8).

### Código (48 arquivos em `apps/web/src`)

- 47 arquivos: `from 'react-router-dom'` passou para `from 'react-router'`.
  Nenhum símbolo importado mudou de nome.
- `apps/web/src/main.tsx`: `RouterProvider` passou a vir de `react-router/dom`,
  conforme o export real do pacote (`dist/production/dom-export.d.ts`).

APIs em uso, todas estáveis na linha 8: `createBrowserRouter`, `RouterProvider`,
`Link`, `Navigate`, `Outlet`, `useLocation`, `useNavigate`, `useParams`,
`useSearchParams`, `useOutletContext`, `useRouteError`.

Não foi necessário tratar `loaderData`, `useMatches`, `meta`, middleware ou
future flags v8, porque o projeto não usa route loaders, actions, SSR nem RSC.

## Validações executadas

| Comando | Resultado |
| --- | --- |
| `npm audit --omit=dev` | 0 vulnerabilidades |
| `npm audit` | 0 vulnerabilidades |
| `npm run lint` | 0 erros, 256 avisos legados (mesma linha de base) |
| `npm run web:typecheck` | pass |
| `npm run contracts:typecheck` | pass |
| `npm run web:build` | pass |
| `npm run local:qa:secret-scan` | 1971 arquivos, 0 correspondências |
| `npm run quality:changed` | aprovado com observações, 0 blockers |
| `git diff --check` | pass |

O único finding do quality gate é pré-existente e não pertence ao escopo:
`apps/web/src/features/navigation/GeniusGlobalSearch.tsx:97`, cast duplo
classificado como `probable`. Nesse arquivo o lote alterou apenas a linha de
import.

## QA real no navegador

Instâncias reiniciadas de forma controlada, mesmas portas e mesmos comandos
originais (`npm run web:dev -- --host 127.0.0.1 --port 4173` e
`npm run web:dev -- --port 4174`). Cache de dependências do Vite recriado.

Cenários verificados com o router em produção real do dev server:

| Cenário | Rota | Resultado |
| --- | --- | --- |
| Redirect da raiz | `4173/` | redireciona para `/login`; tela renderiza |
| Rota pública | `4173/help` | lista de centrais públicas renderiza |
| Navegação client-side por `Link` e `useParams` | `4173/help` para `/help/genius` | central renderiza com dados reais |
| Gate de rota protegida | `4173/admin/visao-geral` | redireciona para `/login` |
| Catch-all `*` | `4173/rota-inexistente-qa-router8` | cai no fallback e chega em `/login?redirectTo=%2Fadmin%2Fanalytics` |
| Rota aninhada com dados | `4174/help/genius/articles` | 55 artigos, paginação e categorias |
| `useSearchParams` | `4174/help/genius/articles?page=2` | página 2 de 6 renderiza |

Console do navegador sem erros ou exceções em todas as telas verificadas.

## Incidente operacional registrado

Durante a execução, o shell de automação estava com `NODE_ENV=production`, o que
produziu dois efeitos que não têm relação com o react-router e que foram
corrigidos:

1. `npm install` removeu 297 pacotes de `devDependencies`, porque com
   `NODE_ENV=production` o npm assume `omit=dev`. Corrigido com
   `npm install --include=dev`, restaurando 402 pacotes.
2. O dev server subiu sem o preâmbulo do React Refresh, resultando em tela em
   branco e `ReferenceError: $RefreshSig$ is not defined`. Corrigido subindo o
   Vite com `NODE_ENV=development`.

Regra prática para os próximos lotes: confirmar `NODE_ENV` antes de rodar
`npm install` ou subir o Vite em ambiente automatizado.

## Limitações

- QA autenticado não foi executado. O formulário de login apresenta credencial
  preenchida pelo gerenciador do navegador e não houve submissão nem uso de
  credencial. Nenhum segredo, token, JWT, cookie ou service role key foi lido,
  gravado ou exposto.
- Banco local preservado. Nenhum reset, migration ou seed.
- Sem push, reset, clean, rebase, merge ou cherry-pick.
- As portas 4173 e 4174 foram reiniciadas de forma controlada após inventário
  dos processos; ambas voltaram a responder HTTP 200.

## Pendências que continuam abertas

- `npm run repository:check-root` reporta 1 violação pré-existente:
  `eslint.config.js` sem classificação na allowlist da raiz.
- 256 avisos legados de lint, para limpeza incremental por módulo.
- Merge desta branch em `main` depende de decisão humana.
