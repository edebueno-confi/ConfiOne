# Política de branches e release

## Objetivo

Manter o Genius Support OS auditável entre Codex, Claude e o time de tecnologia,
sem misturar trabalho experimental com publicação e sem perder alterações locais.

## Branches

- `main`: referência de release. Não receber trabalho direto nem push automático.
- `codex/<escopo>`: branch de desenvolvimento de uma frente específica.
- `codex/repository-cleanup-consolidation-20260721`: branch local de consolidação
  do handoff atual, criada a partir de `codex/ux-ui-rebuild-v2-discovery`.
- `codex/ux-ui-rebuild-v2-discovery`: checkpoint anterior preservado; não deve
  ser apagado enquanto o time não revisar a consolidação.
- `origin/*`: somente referência remota. A existência de uma branch remota não
  autoriza merge, push, deploy ou publicação.

## Fluxo obrigatório

1. Confirmar checkout, branch e estado Git antes de agir.
2. Ler `docs/PROJECT_STATE.md`, `docs/README.md`, `docs/plan.md` e os contratos
   aplicáveis.
3. Criar uma branch `codex/<escopo>` quando a frente não for continuação direta
   da branch corrente.
4. Trabalhar em lotes pequenos; não usar `git add .` para esconder alterações
   sem revisão. Quando houver autorização explícita para consolidar tudo, fazer
   primeiro varredura de segredos, artefatos e estado do índice.
5. Atualizar a documentação canônica e registrar evidências de validação.
6. Executar typecheck, build, testes, lint e QA compatíveis com o escopo.
7. Criar commit objetivo somente após os gates locais passarem.
8. Solicitar revisão humana antes de merge para `main`, push, migration remota,
   deploy ou alteração de secrets.

## Preservação e limpeza

- Nunca usar `reset --hard`, `clean -fd`, force push ou exclusão de branch para
  resolver um worktree sujo sem decisão humana explícita.
- Alterações herdadas permanecem preservadas até serem classificadas como
  código funcional, documentação, fixture, artefato gerado ou lixo comprovado.
- Arquivos gerados devem ser ignorados ou removidos somente quando sua origem,
  reprodutibilidade e ausência de uso forem verificadas.
- Migrations, testes, contratos e relatórios de handoff são tratados como
  artefatos auditáveis; não devem ser deletados por parecerem antigos.
- Branches só podem ser apagadas após merge/revisão e confirmação de que não
  contêm trabalho exclusivo.

## Estado do handoff em 2026-07-21

- Checkout: `C:\Projetos\GSO-old`.
- Branch ativa: `codex/repository-cleanup-consolidation-20260721`.
- Commit de consolidação: `31604b4`.
- Branch anterior preservada: `codex/ux-ui-rebuild-v2-discovery`.
- Worktree após a consolidação: limpo; nenhum push ou deploy foi executado.
- Próximo lote: auditoria e limpeza sanitizada por classificação, seguida de
  validação completa e revisão do time de tecnologia.
