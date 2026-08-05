# Skill de governança documental

## Objetivo e localização

`genius-documentation-governance` audita a documentação do Genius Support OS e sua coerência com código, contratos, rotas, banco, permissões, navegação e telas. A skill vive em `.agents/skills/genius-documentation-governance/` e é versionada com o repositório.

## Como invocar

```text
$genius-documentation-governance fast
$genius-documentation-governance changed
$genius-documentation-governance domain analytics
$genius-documentation-governance full
$genius-documentation-governance apply <relatório ou escopo aprovado>
$genius-documentation-governance scheduled
```

O padrão é read-only. `apply` exige autorização explícita, arquivos exatos e revisão do diff; os scripts bundled continuam em dry-run.

## Hierarquia, taxonomia e status

A fonte de verdade segue a ordem: runtime/contratos reais, documentos canônicos atuais, Context Pack aprovado, relatórios recentes, Product Docs/Build Journal, histórico e artefatos experimentais. Tipo e status são dimensões diferentes; consulte `references/documentation-taxonomy.md`.

## Modos

`fast` verifica higiene, links, comandos, caminhos, duplicatas exatas e exposição sensível. `changed` relaciona diff a docs ausentes e impacto documental. `domain` constrói mapa de uma área. `full` amplia a leitura e pode usar navegador/subagentes apenas com autorização. `scheduled` compara um baseline JSON sem editar. `apply` organiza uma reconciliação aprovada sem apagar histórico.

## Ferramentas e interpretação

O auditor `.agents/skills/genius-documentation-governance/scripts/run-documentation-audit.mjs` usa Node, Git, `package.json` e o validador documental existente (`npm run documentation:validate:internal-docs`). Ele não exige serviço externo e nunca abre `.env` ou reproduz secrets. `.agents/skills/genius-documentation-governance/scripts/validate-governance-skill.mjs` valida a estrutura local; `$skill-creator` fornece a validação estrutural oficial.

Duplicações semânticas, contradições e status inferidos são candidatos: confirme datas, commits, contratos e consumidores antes de aplicar. A auditoria identifica risco; reconciliação escolhe fonte e atualiza referências; arquivamento preserva histórico e só ocorre com autorização.

## Evolução

Para adicionar domínio, atualize `references/domain-map.md` e as pistas do auditor somente após demonstrar um caso real. Para nova regra, registre evidência, fonte canônica, severidade, risco de falso positivo e validação. Não crie segundo ledger/índice/registry.

## Tarefa agendada

Use o prompt de `references/scheduled-runbook.md`. Recomenda-se frequência semanal durante desenvolvimento ativo e quinzenal após estabilização. A tarefa não é criada automaticamente neste lote.
