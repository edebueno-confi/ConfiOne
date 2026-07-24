# Octadesk Import Runtime Status

Data: `2026-05-20`

Este relatorio registra o estado runtime local apos a execucao controlada do corpus Octadesk no Admin Knowledge do espaco `genius`.

## Resultado consolidado

- Total avaliado no corpus: `58` artigos.
- Total importado/processado no Knowledge runtime: `54` artigos.
- Total fora do import runtime: `4` artigos.
- Advisories sincronizados: `54` com `review_status = pending`.
- Artigos Octadesk publicados automaticamente: `0`.
- Artigos Octadesk com `visibility = public`: `0`.
- Exposicao em views publicas: `0`.
- `/help/genius` continua exibindo apenas os `6` artigos publicos seed/manuais.

## Distribuicao runtime

| Status | Visibility | Total |
| --- | --- | ---: |
| `review` | `internal` | `4` |
| `draft` | `internal` | `24` |
| `draft` | `restricted` | `26` |

## Exclusoes e bloqueios

Os `4` itens fora do import runtime permanecem fora da materializacao por seguranca editorial:

- artigos classificados como duplicados;
- artigos classificados como obsoletos;
- itens sem decisao segura para publicacao ou revisao publica nesta onda.

Além disso, `20` artigos permanecem bloqueados para publicacao publica por restricao, obsolescencia, duplicidade ou risco editorial registrado nas allowlists.

## Garantias preservadas

- `source_path` e `source_hash` foram preservados para os artigos importados.
- O importador nao atualiza artigos que ja estejam em `review` ou status posterior.
- A Wave 1 de publicacao ficou vazia por ausencia de checklist humano real, advisory revisado e revisao de assets.
- A publicacao automatica segue bloqueada.
- Nenhum artigo foi promovido automaticamente para `published`.
- Nenhum artigo foi promovido automaticamente para `public`.

## Comandos validados

- `npm run knowledge:curation:backlog`
- `npm run knowledge:verify:octadesk:space-aware`
- `npm run knowledge:import:octadesk:local -- --space-slug genius --allowlist docs/reports/OCTADESK_IMPORT_ALL_DRAFTS_ALLOWLIST.json`
- `npm run knowledge:review:advisories:local -- --space-slug genius --allowlist docs/reports/OCTADESK_IMPORT_ALL_DRAFTS_ALLOWLIST.json`
- `npm run web:typecheck`
- `npm run web:build`
- `npm run supabase:test:db`

## QA

Admin Knowledge:
- backlog Octadesk visivel no Admin Knowledge;
- `4` artigos em revisao interna;
- demais artigos mantidos como drafts internos ou restritos;
- advisories permanecem pendentes.

Public Help:
- `/help/genius` funcional;
- `/help/genius/articles` funcional;
- buscas por termos do corpus Octadesk nao retornam os artigos internos;
- os `6` artigos publicos seed/manuais continuam visiveis;
- sem overflow horizontal observado no QA local.

## Proximo passo

Executar revisao humana por ondas, com foco em:

1. revisar assets;
2. revisar advisories;
3. preencher checklist humano;
4. decidir quais artigos podem sair de `internal` para `public`;
5. publicar somente por RPC editorial existente e com QA publico posterior.
