# Auditoria de limpeza e sanitização do repositório — 2026-07-21

## Objetivo

Reduzir ruído do checkout `C:\Projetos\GSO-old` antes da revisão do time de
tecnologia, sem apagar código funcional, migrations, testes, contratos ou
evidências necessárias ao handoff Codex/Claude.

## Baseline

- Branch: `codex/repository-cleanup-consolidation-20260721`.
- Commit-base da consolidação: `0f86cab`.
- Remoto configurado: `origin` aponta para o repositório GitHub; nenhum push foi
  executado.
- A varredura de segredos não encontrou tokens reais; as únicas ocorrências
  foram exemplos mascarados (`pat-xxxx`) em documentação.

## Removido

### `DIAGNOSTICO.bat`

Removido por não possuir referências no repositório e por duplicar o fluxo de
QA atual. O script também copiava `apps/web/.env.local` para um log local e
executava reset/seed do banco, tornando-o inadequado para um repositório que
será auditado.

### Screenshots históricos soltos na raiz

Removidos por não possuírem referências e por violarem a política de higiene da
raiz:

- `admin-knowledge-governance-cockpit.png`
- `admin-knowledge-governance-cockpit-final.png`
- `admin-knowledge-new-article-editor.png`

As evidências duráveis continuam nos relatórios e blueprints versionados em
`docs/`.

## Preservado com justificativa

- `INICIAR-GENIUS.bat` e `CRIAR-USUARIOS-DE-TESTE.bat`: fluxo local documentado
  e ainda utilizado para QA.
- `PRODUCT.md`, `DESIGN.md`, `RECONSTRUCAO-DO-PRODUTO.md` e
  `DIAGNOSTICO-E-PLANO-DE-SIMPLIFICACAO.md`: possuem referências documentais
  ou alimentam a biblioteca de documentos do produto.
- `raw_knowledge/`: fonte bruta da Central de Ajuda e entrada de importação.
- `docs/GPT/`, `docs/mvp-reset-2026-07-06/` e relatórios históricos: áreas
  auxiliares explicitamente registradas; remoção exigiria decisão de
  arquivamento e atualização de referências.
- Migrations, testes pgTAP, Edge Functions, contratos e relatórios de handoff:
  são parte da trilha auditável e não foram tratados como lixo.

## Artefatos locais ignorados

`.tmp/`, `.playwright-cli/`, `output/`, `node_modules/` e logs locais não fazem
parte do commit e permanecem cobertos pelo `.gitignore`. Eles podem ser
removidos em uma rotina local de manutenção quando não houver processo ativo;
não são motivo para alterar o histórico Git.

## Próxima triagem controlada

1. Consolidar referências históricas de `docs/CLEANUP_REPORT.md` antes de
   arquivá-lo ou removê-lo.
2. Avaliar se os scripts Windows devem permanecer na raiz ou ser movidos para
   `scripts/windows/`, atualizando o guia de teste e mantendo um caminho claro
   para QA.
3. Revisar duplicações em `docs/GPT/` somente com decisão documental explícita.
4. Adicionar uma verificação automatizada de higiene da raiz ao CI local.

## Execução incremental — 2026-07-21

- criado o verificador read-only `scripts/ci/check-root-artifacts.mjs`;
- criado o teste `tests/scripts/root-artifacts-hygiene.test.mjs` com 3 casos
  aprovados;
- adicionada a rotina `npm run repository:check-root`;
- movidos 10 logs/dumps transitórios para
  `.tmp/logs/2026-07-21--local-environment/`, sem perda de conteúdo;
- as duas entradas locais que permanecem na raiz foram classificadas pelo
  verificador: `output/` contém evidências geradas e ignoradas de QA; `Recreação
  do mascote Genius-handoff/` é o pacote de referência ignorado, enquanto os
  assets de runtime vivem em `apps/web`;
- nenhum arquivo foi excluído nesta etapa.

## Validação do lote

- `node --test tests/scripts/root-artifacts-hygiene.test.mjs`: 3/3 aprovados.
- `npm run contracts:typecheck` e `npm run web:typecheck`: aprovados.
- `npm run web:build`: aprovado; o bundle compilou sem falha fatal.
- `npm run supabase:lint:db` e `npm run supabase:test:db`: aprovados; o lint
  mantém 12 alertas conhecidos de `v_actor` não utilizado em RPCs legadas.
- `npm run documentation:validate:internal-docs`: aprovado, 0 bloqueios e 9
  alertas documentais já conhecidos.
- `git diff --check`: aprovado.
- smoke HTTP em `http://127.0.0.1:4173/`: HTTP 200.
- O verificador `npm run repository:check-root` agora classifica explicitamente
  as duas entradas locais ignoradas e deve fechar verde; ele não altera
  arquivos.
- Nenhum push, merge em `main`, deploy, migration remota ou alteração de secret
  foi executado.
