# Atualizacao de permissao para pipelines - 2026-07-18

## Resultado

A chave de servico existente `GSO Old Analytics Readonly` (ID interno
`46180632`) foi atualizada no portal autenticado do HubSpot.

Foi adicionado o escopo:

- `crm.schemas.deals.write`

O escopo `tickets` ja existente foi preservado. Nenhum Ticket ou pipeline de
Suporte foi alterado.

## Validacao

- A pagina de detalhes foi reaberta apos o salvamento.
- O escopo `crm.schemas.deals.write` foi confirmado como persistido.
- O token nao foi visualizado, copiado ou rotacionado.

## Proximo passo

A permissao esta pronta para a etapa separada de criacao dos pipelines de CS.
Essa etapa deve permanecer fora do pipeline de Suporte atualmente utilizado.
