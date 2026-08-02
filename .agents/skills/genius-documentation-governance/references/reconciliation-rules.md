# Regras de reconciliação

## Antes de aplicar

Exigir relatório aprovado, lista exata de arquivos, fonte canônica, motivo, preservação histórica e validação planejada. Se a decisão depender do Product Owner, não aplicar.

## Duplicação

Preservar informação única, substituir cópia por link, atualizar referências e ledger, marcar o substituído e validar `git diff --check`. Não apagar histórico, resumo intencional ou evidência sem autorização explícita.

## Contradição

Validar código/contratos, localizar decisão mais recente, determinar fonte vigente, atualizar o canônico, marcar o antigo como `SUPERSEDED` ou `HISTORICAL` e registrar a decisão sem reescrever o passado.

## Segurança operacional

O script de auditoria nunca escreve. `apply` é um modo de autorização do workflow; o agente só edita com `apply_patch` após confirmação explícita e revisão do diff. Não usar sync interno com service role, migrations, banco, push ou deploy neste lote.

