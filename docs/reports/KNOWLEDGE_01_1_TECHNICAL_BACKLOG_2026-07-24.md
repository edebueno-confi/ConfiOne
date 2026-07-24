# Pendências técnicas pós-publicação — KNOWLEDGE-01.1

Registro separado do gate de publicação da Central de Ajuda.

## Itens

1. **Drift de migrations local** — investigar a migration anterior que falha ao substituir uma view com alteração incompatível de colunas (`SQLSTATE 42P16`). Não executar reset ou migration remota sem gate específico.
2. **Agendamento HubSpot** — investigar e corrigir a cadeia UI → RPC → banco do erro `invalid input syntax for type uuid: "true"` ao salvar frequência diária e estado ativo. Acrescentar regressão e validar sem executar sincronização externa.
3. **CTA do portal** — concluir e validar separadamente a correção local que direciona “Entrar no portal” para `/portal`. As alterações foram preservadas fora do push do KNOWLEDGE-01.1.

## Estado

Nenhum item foi implementado neste lote.
