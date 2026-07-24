# KNOWLEDGE-01 — Fechamento consolidado da migração

Data da auditoria: 2026-07-24
Espaço auditado: `genius`
Escopo: base antiga Octadesk, conteúdo público, assets, editorial, links, contratos e publicação local.

## Resultado executivo

- 58 registros encontrados no manifesto de origem; 57 artigos canônicos processados, com 1 duplicata exata preservada apenas como referência de origem.
- 44 artigos de origem foram publicados como públicos; 13 ficaram retidos como `draft`/restritos ou internos por ausência de autorização pública suficiente.
- O destino local contém 75 artigos no espaço `genius`: 62 publicados e públicos, 13 não públicos. Não há artigo sem categoria, corpo vazio ou duplicata por hash no destino.
- Os 129 assets de origem foram baixados e validados. O destino mantém 128 registros após deduplicação por artigo/hash/caminho; nenhum asset único foi descartado.
- Há 99 assets aprovados e públicos, todos apontando para o bucket público; 29 permanecem pendentes e 0 estão bloqueados ou órfãos.
- A normalização corrigiu mojibake sem recodificar UTF-8 válido, removeu URLs Octadesk e contatos legados da superfície pública e não introduziu dados fictícios.

## Reconciliação fonte → destino

O manifesto completo é `raw_knowledge/octadesk_export/latest/manifest.json`, com 3 categorias, 4 seções, 58 artigos e 129 assets. Cada registro processado recebeu resultado explícito no artefato `.tmp/knowledge-01-reprocess-apply-v3.json` durante a auditoria local, e os agregados foram conferidos no banco.

| Resultado | Quantidade | Tratamento |
|---|---:|---|
| Canônico, publicado e público | 44 | Importado, normalizado, associado a categoria e assets públicos |
| Canônico, retido | 13 | Mantido no destino sem exposição pública; requer revisão/autorização |
| Duplicata exata de origem | 1 | Não duplicada no catálogo canônico |
| Sem categoria | 0 | Nenhum caso |
| Corpo vazio | 0 | Nenhum caso |
| Asset sem associação | 0 | Nenhum caso |

Registros retidos na amostra de origem incluem conteúdo de Sellers, usuários, integrações de e-commerce, Correios, permissões de plataformas e erros de autorização. A retenção foi preferida à publicação especulativa.

## Assets

- Fonte: 129 referências; download e assinatura/MIME/dimensões validados.
- Destino: 128 registros por deduplicação de um mesmo hash e caminho no mesmo artigo; o objeto público equivalente permaneceu preservado.
- Resultado final: 99 aprovados públicos, 29 pendentes, 0 bloqueados e 0 órfãos.
- Corrigida a inconsistência de um asset aprovado público que possuía objeto no bucket `knowledge-public-assets`, mas registro duplicado no bucket privado. A reconciliação remove somente o registro privado duplicado quando existe o registro público aprovado equivalente.
- Não foram criadas imagens, associações, captions ou referências não presentes na origem.

## Normalização editorial e segurança

- Removido o único link legado para `o205658-f7a.octadesk.com` da publicação pública.
- Removidos contatos telefônicos/WhatsApp/e-mail legados da publicação pública.
- Replacement characters (`�`) no conteúdo: 0 após reprocessamento.
- Links HTTP(S) na superfície pública: 0 após a auditoria; links internos são resolvidos pela navegação da Central.
- Nenhum token, credencial, JWT, payload real, segredo ou cookie foi adicionado.
- O texto operacional foi preservado; a correção de mojibake é seletiva e coberta por teste para não corromper UTF-8 válido.

## Integrações e API

O hub público “Integrações e API” permanece limitado à matriz auditada em `docs/reports/KNOWLEDGE_01_1_INTEGRATIONS_API_AUDIT_2026-07-24.md`. API Docs é a referência técnica primária; Swagger é complementar. Operações não confirmadas não foram publicadas e as referências externas são centralizadas nos contratos existentes.

## Validações executadas

- `npm run contracts:typecheck` — PASS.
- `npm run web:typecheck` — PASS.
- `npm run web:build` — PASS.
- Testes Node focados de normalização, integrações, navegação e piloto — 15/15 PASS.
- Testes pgTAP locais `075`, `065`, `066` e `038` — 31/31 PASS.
- `npm run documentation:validate:internal-docs` — concluído com alertas preexistentes de menções a tokens em documentos internos; nenhum documento bloqueado.
- `npm run repository:check-root` — PASS.
- `git diff --check` — PASS.
- Smoke local público Dashboard/Central — PASS; console sem erros, falhas de rede 0 e overflow horizontal 0 em 1440px e 390px.
- Busca, lista, artigo, artigo inexistente e navegação pública foram exercitados; as rotas retornaram conteúdo esperado.

## Evidências visuais

Evidências geradas em `output/playwright/`:

- `knowledge-01-home-desktop.png`
- `knowledge-01-home-mobile.png`
- `knowledge-01-list-desktop.png`
- `knowledge-01-list-mobile.png`
- `knowledge-01-article-desktop.png`
- `knowledge-01-como-autenticar-uma-integracao.png`
- `knowledge-01-configurando-parametrizacao-geral.png`
- `knowledge-01-configuracao-de-sellers-permitidos.png`
- `knowledge-01-search-empty.png`
- `knowledge-01-not-found.png`
- `knowledge-01-loading.png`

Também foram preservadas as evidências de smoke anteriores em `output/playwright/knowledge-01-1-*.png` e `release-smoke-*.png`.

## Pendências e limites

- A migração local completa continua bloqueada por drift pré-existente em `20260722221746_internal_profile_screen_access_contract_v1.sql`, que tenta alterar uma view com mudança incompatível de colunas. Nenhum reset, rebase ou migração remota foi executado.
- O erro remoto `invalid input syntax for type uuid: "true"` na configuração de frequência do HubSpot não é reproduzível no contrato local atual: localmente `analytics_integration_schedule.id` é booleano e o RPC recebe booleanos nomeados. O caso indica drift de schema/RPC remoto e requer lote próprio com evidência do ambiente afetado; não foi feita escrita remota.
- A correção independente do CTA “Entrar no portal” foi aplicada e commitada separadamente após inspeção do stash preservado.
- Os 13 artigos retidos e eventuais ajustes de conteúdo legado complexo permanecem para revisão controlada no KNOWLEDGE-01/KNOWLEDGE-02, sem publicação especulativa.
