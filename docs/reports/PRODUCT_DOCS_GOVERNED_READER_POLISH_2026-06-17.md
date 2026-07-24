# Product Docs Governed Reader Polish 2026-06-17

## Resumo

O lote corrigiu a causa raiz de `/admin/product-docs` vazio no ambiente local e elevou a experiencia de leitura da area `Documentos do Produto`.

A causa raiz nao estava no frontend: o banco local restaurado nao possuia registros em `internal_documents` e `internal_document_versions`. A whitelist oficial ja continha 12 documentos autorizados para a superficie `product-docs`, mas eles ainda nao tinham sido sincronizados apos o reset local.

## Entregas

- Criado script local seguro `documentation:sync:internal-docs:local`, que deriva `API_URL` e `SERVICE_ROLE_KEY` de `supabase status -o env`, exige URL loopback e nao grava secrets em arquivo.
- Sincronizados 12 documentos internos no Supabase local por contrato real.
- `/admin/product-docs` passou a abrir automaticamente o primeiro documento autorizado quando nao ha `doc` na URL.
- A tela passou a operar como cockpit de tres zonas: indice, reader central e rail de governanca.
- O reader ganhou indice interno `Neste documento`, derivado do markdown sanitizado retornado pelo backend.
- Headings do markdown sanitizado passaram a receber IDs estaveis para navegacao interna.
- A copy visivel deixou de usar linguagem tecnica como `Contrato real` e passou a falar em fonte oficial ou fonte governada.

## Contratos consumidos

- `vw_internal_documents_catalog`
- `vw_internal_document_detail`

## Boundaries preservados

- Sem migration.
- Sem tabela nova.
- Sem view ou RPC nova.
- Sem leitura arbitraria de arquivos pelo frontend.
- Sem mock como fonte de produto.
- Sem service role no browser.
- Sem deploy remoto.

## Validacoes

- `node --test tests/scripts/internal-docs-local-sync.test.mjs tests/scripts/product-docs-ui-contract.test.mjs`
- `npm run documentation:validate:internal-docs`
- `npm run documentation:sync:internal-docs:local`
- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `node --test tests/scripts/*.test.mjs`
- `npm run web:build`
- REST autenticado confirmou 12 slugs autorizados para `product-docs`.
- QA browser local em `http://127.0.0.1:4173/admin/product-docs` confirmou 12 documentos, indice populado, reader aberto, rail de governanca e ausencia de estado vazio.

## Evidencia visual

- `docs/reports/product-docs-local-qa-2026-06-17.png`

## Riscos restantes

- Permissao granular dedicada para `product-docs` segue futura; a rota continua dentro do gate administrativo consolidado.
- Os alertas de validacao documental continuam visiveis como status governado e devem ser revisados em lote editorial proprio, nao mascarados pela UI.
- O script local depende do Supabase local estar iniciado e de `supabase status -o env` retornar as chaves locais.
