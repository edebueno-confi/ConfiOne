# Publicação da Central de Ajuda — 2026-07-20

## Resultado local

O corpus legado da Octadesk foi tratado como uma base pública já revisada,
conforme decisão do produto. A execução controlada local foi feita pelo script
oficial de publicação, no `knowledge_space` `genius`, usando as RPCs editoriais
existentes.

| Item | Quantidade |
| --- | ---: |
| Artigos avaliados | 57 |
| Publicados nesta execução | 44 |
| Artigos já públicos no ambiente | não separado no script |
| Bloqueados automaticamente | 12 |
| Artigos verificáveis na listagem pública | 44 |

## Bloqueios preservados

Os 12 artigos restantes continuam fora da Central pública por conterem sinais
de risco técnico ou administrativo, como tokens, senhas, permissões técnicas,
integrações sensíveis, contrato de Correios ou criação de usuário
administrativo. Eles permanecem disponíveis no cockpit `/admin/knowledge` para
decisão editorial posterior.

## Evidência

```text
node scripts/knowledge/publish-octadesk-public-help.mjs --local --space-slug genius
node scripts/knowledge/publish-octadesk-public-help.mjs --local --space-slug genius --apply --actor-user-id <admin-local>
```

O relatório detalhado por artigo está em
`docs/reports/OCTADESK_PUBLICATION_EXECUTION_REPORT.md`. O `source_path` e o
`source_hash` foram preservados e a Central continua expondo somente artigos
`published/public` em um space ativo. A validação no navegador encontrou 44
links de artigos únicos em `/help/genius/articles`.

## Limite

Esta publicação foi aplicada no ambiente local. Publicação em ambiente remoto
ou de produção exige execução da mesma esteira no projeto remoto, com as
migrations/functions publicadas e confirmação operacional do ambiente-alvo.
