# Análise do advisory react-router / react-router-dom

Data: 2026-08-04
Checkout canônico: `C:\Projetos\GSO-old`
Branch: `main`
Escopo: investigação de segurança de dependência. Nenhuma alteração de código de
aplicação, contrato, banco, RPC, view, permissão ou integração.

## Decisão

Não aplicar correção de versão neste lote. A única versão corrigida é
`react-router@8.3.0`, e o pacote `react-router-dom` deixou de existir na linha 8.
Corrigir exige troca de pacote em 48 arquivos, bump de React e migração major.
O advisory não é explorável nesta aplicação porque depende exclusivamente das
APIs RSC instáveis, que não são usadas em nenhum ponto do repositório.

Risco aceito de forma explícita e rastreável, com plano de migração definido
para lote dedicado.

`npm audit fix --force` permanece proibido: ele instalaria `react-router-dom@7.11.0`,
um downgrade de 7 versões menores que não corrige o advisory, apenas sai da faixa
declarada como afetada.

## Advisory

| Item | Valor |
| --- | --- |
| Identificador | GHSA-qwww-vcr4-c8h2 |
| Título | React Router: RSC Mode CSRF Bypass Allows Action Execution Before 400 Response |
| Severidade | High, CVSS 7.1 |
| CWE | CWE-352, Cross-Site Request Forgery |
| CVE | não atribuído |
| Faixa afetada | `>= 7.12.0`, `< 8.3.0` |
| Versão corrigida | `react-router@8.3.0` |
| Precedente | follow-up de CVE-2026-22030, cobrindo fluxos CSRF residuais em caminhos RSC instáveis |
| Condição de exploração | aplicação precisa usar as APIs RSC instáveis |

Fonte primária: https://github.com/advisories/GHSA-qwww-vcr4-c8h2

## Estado instalado

| Item | Valor |
| --- | --- |
| Declarado em `apps/web/package.json` | `react-router-dom: ^7.15.0` |
| Instalado | `react-router-dom@7.18.0` e `react-router@7.18.0` |
| Última versão da linha 7 | `react-router-dom@7.18.2` |
| `dist-tag` latest de `react-router-dom` | `7.18.2` |
| `dist-tag` latest de `react-router` | `8.3.0` |
| Node local | `v22.22.3` |
| npm local | `10.9.8` |
| React instalado | `19.2.5` |
| Vite | `8.0.10` |

Conclusão objetiva: não existe patch na linha 7. Subir para `7.18.2` mantém o
advisory aberto, porque a faixa afetada cobre toda a linha 7 a partir de 7.12.0.

## Verificação de exploração real no projeto

Auditoria feita sobre `apps/web/src`, `apps/`, `packages/` e `scripts/`.

- 48 arquivos importam de `react-router-dom`.
- APIs efetivamente usadas: `createBrowserRouter`, `RouterProvider`, `Link`,
  `Navigate`, `Outlet`, `useLocation`, `useNavigate`, `useParams`,
  `useSearchParams`, `useOutletContext`, `useRouteError`.
- Nenhuma ocorrência de `unstable_`, `react-router/rsc`, `@vitejs/plugin-rsc`,
  `react-server`, `entry.server`, `createStaticHandler`, `ServerRouter` ou
  `useFetcher`.
- Nenhum `loader` ou `action` de rota. As ocorrências de `loader:` em
  `apps/web/src/app/router.tsx` (linhas 22 e 52) são o parâmetro do helper
  local `importWithChunkRecovery`, não rota de dados.
- `apps/web/vite.config.ts` usa apenas `@vitejs/plugin-react` e
  `@tailwindcss/vite`. Não há framework mode, SSR nem RSC.
- Escrita é feita por RPC/Supabase no cliente, não por actions do router.

Portanto o vetor descrito no advisory, execução de action antes da resposta 400
em modo RSC, não existe nesta superfície.

## Por que a correção é breaking change

Requisitos da linha 8, conforme o guia oficial de upgrade v7 para v8:

- `react-router-dom` é removido. Imports passam para `react-router`, e
  `RouterProvider` passa a vir de `react-router/dom`.
- Node mínimo `22.22`. Atendido: `v22.22.3`.
- React e ReactDOM mínimos `19.2.7`. Não atendido: instalado `19.2.5`.
- Vite mínimo 7 para framework mode. Atendido: Vite 8, e o projeto não usa
  framework mode.
- `meta` e `useMatches()` passam a usar `loaderData` em vez de `data`. Sem
  impacto aqui, pois não há loaders.

Impacto real da migração: troca de pacote em 48 arquivos, ajuste do import de
`RouterProvider`, bump de `react` e `react-dom`, remoção de `react-router-dom`,
regeneração de lockfile e revalidação completa de navegação autenticada.

Fonte: https://reactrouter.com/upgrading/v7

## Plano recomendado para o lote dedicado

1. Criar branch `codex/react-router-v8-migration-<data>` a partir de `main`.
2. Preservar base em `refs/archive/react-router-v8-migration-start-<data>`.
3. Subir `react` e `react-dom` para `^19.2.7` e validar `recharts` e `@tiptap`
   com a nova versão.
4. Instalar `react-router@^8.3.0` e desinstalar `react-router-dom`.
5. Reescrever os 48 imports para `react-router`, mantendo `RouterProvider` em
   `react-router/dom`.
6. Rodar `npm run lint`, `npm run web:typecheck`, `npm run contracts:typecheck`,
   `npm run web:build`, `npm run local:qa:secret-scan`, `npm run quality:changed`.
7. QA autenticado real em 4173 e 4174: login, gates de acesso, navegação lazy,
   parâmetros de rota, query string, `useRouteError` e recuperação de chunk.
8. Confirmar `npm audit --omit=dev` em zero vulnerabilidades altas.
9. Só então commitar, em commit isolado da migração.

## Riscos e limitações

- Enquanto a migração não ocorrer, `npm audit --omit=dev` continuará reportando
  2 vulnerabilidades altas. Isso é esperado e está documentado aqui.
- Nenhum gate de CI ou script local executa `npm audit`, logo a pendência não
  bloqueia build, lint, typecheck ou quality gate. Não há falso verde: o estado
  está registrado neste relatório e no handoff.
- A avaliação de não exploração vale para a superfície atual. Se o projeto passar
  a usar framework mode, SSR, RSC, route actions ou `useFetcher`, a migração
  deixa de ser opcional e passa a ser bloqueante.
- Nenhum segredo, token, JWT, cookie ou service role key foi lido, gravado ou
  exposto nesta análise.

## Evidências executadas

- `npm audit --omit=dev`: 2 vulnerabilidades altas, `react-router` e
  `react-router-dom`, advisory GHSA-qwww-vcr4-c8h2.
- `npm ls react-router react-router-dom --omit=dev`: `7.18.0`.
- `npm view react-router-dom versions` e `npm view react-router dist-tags`:
  linha 8 existe apenas em `react-router`, latest `8.3.0`.
- `npm view react-router-dom dist-tags`: latest `7.18.2`.
- Buscas de conteúdo em `apps/` por `unstable_`, RSC, SSR, `useFetcher`,
  `loader:` e `action:`: nenhuma ocorrência relevante de router de dados.
- `http://127.0.0.1:4173/` e `http://127.0.0.1:4174/`: HTTP 200 preservados.
