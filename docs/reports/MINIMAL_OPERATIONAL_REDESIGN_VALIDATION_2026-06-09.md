# Validação do Redesign Minimalista Operacional

Fechamento: 2026-06-10

## Resumo

O redesign visual do Genius Support OS foi concluído como reset de interface nas superfícies internas prioritárias. Rotas, contratos, permissões, read models e handlers foram preservados. O frontend passou a usar um shell único, superfícies planas, listas e tabelas dominantes, Focus Surfaces para mutações e estados honestos sem ilustração decorativa.

## Superfícies migradas

- Login e acesso negado.
- Shell de Admin, Support e CS.
- Carteira CS.
- Fila operacional.
- Workspace do ticket, conversa, composer, contexto e ações laterais.
- Clientes B2B.
- Acessos.
- Sistema.
- Knowledge e editor de artigo.
- Estados globais e primitives canônicos.

## Consolidação

- `AppButton`, `GhostButton`, `Panel`, `MetricCard`, inputs e estados globais foram alinhados ao sistema minimalista.
- Removidos sem consumidores:
  - `AdminSidebar.tsx`
  - `AdminTopbar.tsx`
  - `UnifiedEnvironmentNavigation.tsx`
- Assets de marca ainda usados por superfícies públicas e documentais foram preservados.

## QA visual e comportamental

Viewports usados:

- desktop: 1440 x 900;
- mobile: 390 x 844.

Rotas verificadas:

- `/login`
- `/access-denied`
- `/support/queue`
- `/support/tickets`
- `/cs/portfolio`
- `/admin/tenants`
- `/admin/access`
- `/admin/system`
- `/admin/knowledge`
- `/admin/knowledge/new`

Evidências:

- sem overflow global horizontal ou vertical nas rotas verificadas;
- fila mobile com 390 px de largura e 25 linhas reais;
- seleção de ticket abre contexto real;
- ticket desktop sem scroll global, com scroll independente de thread e rail;
- Focus Surface mobile abre como painel sobreposto;
- Knowledge mobile renderiza tabela responsiva com 390 px e sete linhas;
- Access mobile reduz a tabela às colunas `Usuário` e `Papel`;
- editor de Knowledge mantém campos reais e não cria dados simulados.

## Validações automatizadas

Executadas com sucesso:

```text
node --test tests/scripts/*.test.mjs
17 testes aprovados

npm run contracts:typecheck
aprovado

npm run web:typecheck
aprovado

npm run web:build
aprovado

git diff --check
sem erro de whitespace; apenas avisos de política LF/CRLF do Git no Windows

npm run documentation:validate:internal-docs
dry-run concluído, 0 documentos bloqueados e 9 alertas de menções textuais já existentes
```

## Não executado

- testes de banco, porque não houve alteração em schema, migration, RPC, view ou RLS;
- deploy, push, commit ou operação remota;
- testes em dispositivo físico e outros navegadores;
- fluxos destrutivos ou mutações com dados reais.

## Limitações residuais

- telas públicas e áreas internas fora do escopo nomeado ainda podem conter composição visual anterior;
- o editor de Knowledge continua com bundle elevado por dependências de edição já existentes;
- avisos LF/CRLF permanecem como configuração do worktree, sem erro de conteúdo.
- o validador documental mantém alertas históricos de palavras relacionadas a tokens e service roles; nenhum valor sensível foi incluído neste lote.

## Resultado

O objetivo visual aprovado foi atendido nas superfícies internas nomeadas. O sistema não depende mais do shell legado e a arquitetura visual canônica está pronta para evolução incremental.
