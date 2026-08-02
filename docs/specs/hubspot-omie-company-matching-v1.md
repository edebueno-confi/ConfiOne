# Especificação — Matching HubSpot ↔ OMIE V1

Status: descoberta técnica; aplicação automática não autorizada.

## Evidência local agregada

No banco local em 2026-08-02 havia 10.317 empresas HubSpot, 108 chaves de CNPJ
normalizadas duplicadas e zero títulos OMIE marcados como atuais. Assim, não é
possível medir precisão/recall nem escolher um limiar com dados locais atuais.

## Regras de identidade

1. Normalizar CNPJ removendo caracteres não numéricos; CNPJ vazio não é chave.
2. Comparar nome normalizado apenas como candidato, nunca como identidade única.
3. CNPJ raiz pode indicar grupo econômico, mas não autoriza merge nem substitui
   a empresa jurídica.
4. Preservar fonte, ID externo, método, candidatos, motivo, versão e data.
5. Ambíguo e sem candidato ficam em fila de revisão; não são aplicados.

## Estado observado no código

As RPCs `rpc_analytics_ceo_reconciliation_quality` e
`rpc_analytics_ceo_reconciliation_quality_grouped` já calculam candidatos por
CNPJ/nome e permitem resolução de grupo econômico. A RPC
`rpc_analytics_finance_unmatched_clients` ainda contém fallback histórico de
fonte financeira e precisa ser alinhada ao contrato OMIE-only antes de ser
publicada na área financeira.

## Próxima análise somente leitura

Com uma carga OMIE atual autorizada, medir por agregado: títulos com CNPJ,
com nome, candidato único, múltiplos candidatos, sem candidato, duplicidade de
CNPJ no HubSpot, valor por classe e distribuição por fonte. Nunca imprimir
nomes, CNPJ, tokens ou payload bruto no relatório.

## Critério de promoção

Somente promover uma regra para escrita quando houver amostra revisada por
humano, taxa de falsos positivos definida, fila de exceções, ledger append-only,
rollback lógico e teste cross-tenant. Até lá, matching é read-only e qualquer
dado ausente aparece como indisponível.
