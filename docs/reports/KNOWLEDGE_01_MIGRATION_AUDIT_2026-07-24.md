# KNOWLEDGE-01 — Auditoria da migração Octadesk

Data: 2026-07-24
Ambiente de aplicação: somente Supabase local; nenhuma migração remota, deploy ou alteração de secret foi executada.

## Inventário da origem

- URL pública auditada: `https://o205658-f7a.octadesk.com/kb/`.
- Categorias: 3.
- Seções: 4.
- Registros de artigos: 58.
- Referências de assets: 129.
- Assets baixados e validados: 129/129.
- Erros de download, MIME ou assinatura de imagem: 0.
- Grupos de hash duplicados: 9; hashes distintos: 120.

O export local rastreado em `raw_knowledge/octadesk_export/latest` foi comparado com a captura de 2026-07-24. Índice de artigos, hashes de conteúdo e referências de assets permaneceram iguais.

## Reconciliação editorial

- Artigos canônicos no espaço `genius`: 57.
- A diferença de um registro é uma duplicidade exata: `Como configurar as formas de Estorno` e `Configurando as Formas de Estorno` possuem o mesmo hash de conteúdo. O segundo permaneceu como canonical; não foi criado conteúdo duplicado.
- Publicados como públicos após o gate editorial existente: 44.
- Mantidos fora da Central pública por bloqueio crítico: 13.
- Nenhum artigo bloqueado foi promovido por ocultação visual ou bypass do gate.

## Assets e renderização

- Assets vinculados a artigos: 129.
- Assets públicos: 99.
- Assets internos/restritos: 30.
- Referências públicas `knowledge-asset:` sem registro correspondente: 0.
- MIME permitido: PNG, JPEG, WebP e GIF; arquivos com assinatura incompatível são rejeitados pelo reprocessador.
- Alt text básico é persistido por asset; quando a origem não fornece alt, usa-se `Imagem do artigo <título>`.
- O artigo duplicado por hash é processado uma única vez por artigo canônico, evitando colisão de storage.

O renderer público existente consome `vw_public_knowledge_article_assets`; a captura do artigo com imagem confirmou requisições HTTP 200 para o detalhe e para o read model de assets, sem erro de console.

## Segurança e limites

- HTML legado é convertido para Markdown governado; scripts, eventos e trackers não são preservados.
- O upload foi executado somente contra buckets locais existentes e por RPCs administrativos existentes.
- Não houve criação de migration, alteração de RLS, alteração de contrato ou publicação remota.
- A normalização editorial avançada, reconstrução do editor e revisão manual dos 13 bloqueios permanecem no backlog de `KNOWLEDGE-01`/gate editorial correspondente.

## Evidências

Artefatos externos: `C:\GSO-artifacts\knowledge-01-live-20260724\`

- `manifest.json`, `articles-index.json`, `assets.json` — captura completa da origem.
- `publication-after-migration.md` — plano editorial após a reconciliação.
- `home-desktop-1440.png` — home pública.
- `article-image-desktop-1440.png` — artigo público com imagem.
- `article-image-mobile-390.png` — o mesmo artigo em mobile.
