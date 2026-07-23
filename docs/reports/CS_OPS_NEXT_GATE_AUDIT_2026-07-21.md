# Auditoria do próximo gate CS Ops — 2026-07-21

## Resultado

O fluxo não está liberado para `apply` externo. O catálogo HubSpot local está
reidratado, mas esta instância não possui um lote de importação CS Ops nem um
ledger de migração persistido:

| Indicador | Estado local |
| --- | ---: |
| Empresas HubSpot | 10.162 |
| Owners HubSpot | 31 |
| Lotes de planilha | 0 |
| Lotes CS Ops | 0 |
| Itens de migração | 0 |

O registro histórico de 606/606 linhas não é um ledger disponível nesta
instância e não deve ser usado para autorizar aplicação.

Neste lote, `source_record_id` duplicado passou a bloquear a criação do ledger
antes de qualquer operação. Empresas candidatas à criação também passam por
reconsulta de CNPJ no HubSpot imediatamente antes do POST; resultado ou falha
na reconsulta bloqueia a criação e exige novo dry-run.

## Riscos que permanecem

- `dry_run` e `apply` ainda não carregam um fingerprint obrigatório do catálogo
  HubSpot para garantir que a decisão foi tomada sobre o mesmo snapshot;
- criação externa precisa de rechecagem por CNPJ imediatamente antes do POST;
- uma falha após o POST e antes da atualização do ledger pode exigir
  reconciliação manual;
- matriz/filial/grupo econômico ainda não tem regra explícita no mapper;
- o mapeamento CS ainda precisa validar enums e propriedades contra o catálogo
  real do HubSpot.

## Gate recomendado

1. Reimportar a planilha CS Ops oficial neste ambiente.
2. Reidratar o catálogo pela sincronização autenticada.
3. Executar dry-run com fingerprint de origem e catálogo.
4. Revisar a amostra de matches, ambiguidades e matriz/filial.
5. Só então autorizar `apply` em lote controlado.

Nenhum write HubSpot foi executado nesta auditoria.

## Validação

- `node --test tests/scripts/cs-migration.test.mjs`: 7/7.
- Consultas SQL locais read-only: concluídas.
