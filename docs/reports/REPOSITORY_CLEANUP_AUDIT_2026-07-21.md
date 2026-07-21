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

## Validação do lote

- `git diff --check` deve ser executado antes do commit desta limpeza.
- Typecheck, testes e build devem ser repetidos após a consolidação das remoções.
- Nenhum push, merge em `main`, deploy, migration remota ou alteração de secret
  foi executado.
