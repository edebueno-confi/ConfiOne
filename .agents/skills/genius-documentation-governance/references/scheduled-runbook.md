# Runbook agendado

## Prompt seguro

```text
Use $genius-documentation-governance scheduled no repositório GSO. Compare o estado atual com o último relatório documental disponível, sem editar arquivos, commitar, abrir banco, executar sync, push ou deploy. Retorne somente novas divergências, divergências resolvidas, documentos possivelmente obsoletos, documentação que precisa de atualização, risco e macro-lote recomendado. Não reproduza secrets.
```

## Cadência

- **Semanal:** recomendada durante desenvolvimento ativo ou quando há muitos lotes por semana.
- **Quinzenal:** adequada após estabilização, com revisão manual de alertas.

Salvar o último relatório fora do código apenas se o ambiente de automação permitir; a skill não cria a tarefa automaticamente. Sem baseline, declarar a limitação e executar inventário incremental.

