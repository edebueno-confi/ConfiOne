# Handoff para Claude — Genius Support OS

Data: 2026-08-04  
Checkout canônico: `C:\Projetos\GSO-old`  
Branch: `main`  
HEAD: `836b9e3 feat: configurar lint e atualizar acesso GeniusOS`

## Estado operacional

A instância local já está em pé e foi verificada:

- `http://127.0.0.1:4173/` — HTTP 200
- `http://127.0.0.1:4174/` — HTTP 200

Não reiniciar nem resetar o banco sem verificar os processos e sem autorização explícita para operação destrutiva. Nenhum segredo, token ou credencial está registrado neste handoff.

## O que foi concluído neste ciclo

- Login reposicionado para o produto GeniusOS, sem menção a After Sale.
- Copy do login ajustado para uso compartilhado por clientes e colaboradores.
- Título HTML atualizado para suporte, conhecimento e operação.
- ESLint flat config criado em `eslint.config.js`.
- Scripts adicionados:
  - `npm run lint`
  - `npm run lint:fix`
  - `npm run lint --workspace @genius-support-os/web`
  - `npm run lint --workspace @genius-support-os/contracts`
- Regras cobrindo TypeScript, React Hooks, Fast Refresh, JSX accessibility, imports duplicados, loops inalcançáveis, constantes suspeitas e interpolação inválida.
- Diretórios gerados e dependências foram excluídos da análise.
- Regex de e-mail corrigida após o lint identificar escapes desnecessários.

## Validações realizadas

- `npm run lint` — passou com 0 erros e 256 avisos legados.
- `npm run web:typecheck` — passou.
- `npm run contracts:typecheck` — passou.
- `npm run web:build` — passou; 833 módulos transformados.
- `npm run local:qa:secret-scan` — passou; 0 correspondências.
- `npm run quality:staged` — aprovado, 0 findings.
- `git diff --cached --check` — passou.
- Worktree estava limpo após o commit anterior; este arquivo é a única alteração pendente deste handoff.

## Pendência de segurança: analisada, correção não aplicada

`npm audit --omit=dev` reporta 2 vulnerabilidades altas em `react-router`/`react-router-dom`.

Análise concluída em 2026-08-04. Relatório completo: `docs/reports/2026-08-04_react-router-advisory-analysis.md`.

Resumo objetivo:

- Advisory: GHSA-qwww-vcr4-c8h2, High, CVSS 7.1, CWE-352, sem CVE atribuído.
- Faixa afetada: `>= 7.12.0`, `< 8.3.0`. Instalado: `7.18.0`.
- Única versão corrigida: `react-router@8.3.0`. Não existe patch na linha 7, e `react-router-dom` não tem linha 8; latest é `7.18.2`.
- O advisory só afeta aplicações que usam as APIs RSC instáveis. O projeto não usa: nenhuma ocorrência de `unstable_`, RSC, SSR, `entry.server`, `createStaticHandler`, `ServerRouter`, `useFetcher` ou route `loader`/`action`.
- APIs realmente usadas nos 48 arquivos: `createBrowserRouter`, `RouterProvider`, `Link`, `Navigate`, `Outlet`, `useLocation`, `useNavigate`, `useParams`, `useSearchParams`, `useOutletContext`, `useRouteError`.
- Corrigir exige migração major: trocar `react-router-dom` por `react-router`, mover `RouterProvider` para `react-router/dom` e subir React de `19.2.5` para `>= 19.2.7`.

Decisão: risco aceito de forma explícita neste lote, com plano de migração registrado no relatório. Nenhum gate de CI ou script local executa `npm audit`, portanto a pendência não produz falso verde nem bloqueia build.

`npm audit fix --force` permanece proibido: instala `react-router-dom@7.11.0`, que é downgrade de 7 versões menores e continua sem corrigir o advisory.

## Dívida conhecida do lint

Os 256 avisos são anteriores à configuração do ESLint e estão concentrados em:

- imports, variáveis e handlers não utilizados;
- imports duplicados;
- dependências de hooks incompletas;
- uso legado de `useEffectEvent` fora de Effects/Effect Events;
- avisos de Fast Refresh;
- alguns `autoFocus`.

Eles estão visíveis, mas não bloqueiam o comando geral neste momento. A limpeza deve ser feita por módulo, com testes e revisão de comportamento; não executar `npm run lint:fix` em todo o monorepo sem revisar o diff.

## Estado Git e continuidade

- Branch atual: `main`.
- Antes deste handoff, o repositório estava 178 commits à frente de `origin/main`.
- Não houve push.
- Não houve reset, clean, rebase, merge, cherry-pick ou reset de banco neste ciclo.
- Não alterar branches antigas nem apagar worktrees sem inventário e autorização.

## Próxima ação segura

A análise do advisory do `react-router` está concluída e documentada. O próximo lote seguro é a migração para `react-router@8` em branch dedicada, seguindo o plano de 9 passos do relatório `docs/reports/2026-08-04_react-router-advisory-analysis.md`, ou a limpeza incremental dos 256 avisos de lint por módulo.

Em qualquer caso, manter as instâncias locais acessíveis nas portas 4173 e 4174 e preservar o banco local existente.
