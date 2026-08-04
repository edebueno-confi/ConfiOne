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

## Pendência de segurança que não foi aplicada

`npm audit --omit=dev` encontrou 2 vulnerabilidades altas em `react-router`/`react-router-dom`.

O caminho sugerido automaticamente pelo npm é `npm audit fix --force`, que instala `react-router-dom@7.11.0` e implica downgrade potencialmente incompatível. Não executar automaticamente.

Próximo procedimento recomendado:

1. Auditar a origem do advisory e a versão corrigida disponível.
2. Comparar a API usada no projeto com `react-router-dom@7.11.0`.
3. Criar branch isolada para o downgrade ou atualização segura.
4. Rodar typecheck, build, lint, smoke auth e QA de navegação.
5. Só então decidir o commit da correção.

Não usar `npm audit fix --force` sem aprovação e sem validação de breaking changes.

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

Começar pela análise isolada do advisory do `react-router`, sem downgrade automático. Em paralelo, manter as instâncias locais acessíveis nas portas 4173 e 4174 e preservar o banco local existente.
