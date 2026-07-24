# CS Ops — importação e dry-run auditado — 2026-07-21

## Resultado

- Arquivo processado: `CS Ops _ Carteiras e Clusters -v2 (1).xlsx`.
- Fonte: aba `BD_Clientes`.
- Linhas lidas: 606.
- Linhas aceitas: 606.
- Linhas rejeitadas: 0.
- Versão do mapeamento: `cs-ops-v1`.
- Dry-run registrado no ledger sem alteração externa.

## Correção aplicada

O primeiro dry-run revelou que a Edge Function montava as contagens em
camelCase (`ambiguousRows`, `createRows` etc.), enquanto as colunas do ledger
Postgres usam snake_case. O contrato foi centralizado em
`countCsMigrationPlan()` e passou a usar os nomes do schema:
`total_rows`, `planned_rows`, `ambiguous_rows`, `create_rows`, `update_rows`,
`skipped_rows` e `failed_rows`.

## Resultado do ambiente local

O cache local de empresas está vazio após a reconstrução do banco. Por isso,
o dry-run local classificou 606 linhas como candidatas a criação. Isso é uma
limitação do fixture, não uma autorização para criar empresas: o próximo lote
deve ser executado depois de uma sincronização HubSpot que reidrate o cache de
empresas, permitindo resolver atualizações por ID/CNPJ/nome e bloquear
ambiguidades reais.

## Operação disponível

Em `Dashboard Gerencial → Configuração → Migração auditada da planilha CS Ops`:

1. importar XLSX/CSV para staging;
2. executar o dry-run;
3. revisar contagens, ambiguidades e candidatos;
4. aplicar somente após revisão humana explícita.

O fluxo não altera tickets de suporte. A planilha é fonte temporária de
migração; o HubSpot continua sendo a fonte operacional de CS após o corte.

## Validação

- `node --test tests/scripts/cs-migration.test.mjs`: 5/5 aprovados.
- `npm run web:typecheck`: aprovado.
- Importação local: HTTP 200, 606/606 aceitas.
- Dry-run local: HTTP 200, ledger concluído, 0 empresas alteradas.
