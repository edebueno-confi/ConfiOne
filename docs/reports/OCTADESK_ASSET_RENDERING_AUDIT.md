# Octadesk Asset Rendering Audit

Data: 2026-05-21

## Atualizacao de implementacao - 2026-05-21

A fundacao de assets Knowledge foi implementada para permitir reprocessamento seguro dos artigos Octadesk sem usar imagens externas em runtime.

Estado implementado:

- `knowledge_article_assets` materializa assets por artigo com `source_path`, `source_hash`, MIME detectado, dimensoes, `review_status`, `visibility` e `is_blocked`;
- `knowledge-assets` e o bucket privado dedicado;
- `vw_admin_knowledge_article_assets` permite curadoria administrativa;
- `vw_public_knowledge_article_assets` expoe somente assets aprovados, publicos e ligados a artigo `published/public`;
- `rpc_admin_upsert_knowledge_article_asset_v1` materializa metadados do asset;
- `rpc_admin_update_knowledge_article_asset_review_v1` aprova/bloqueia asset e atualiza alt/caption;
- o renderer publico aceita apenas `knowledge-asset:<id>` e nao renderiza URL externa arbitraria;
- o Admin Knowledge mostra preview e status dos assets vinculados;
- o script `reprocess-octadesk-article-assets.mjs` converte `content.local.html` para markdown estruturado e substitui imagens por placeholders governados.

Reprocessamento aplicado no ambiente local:

| Artigo | Assets materializados | Status |
| --- | ---: | --- |
| Configuração de Sellers Permitidos | 3 | `review/internal` |
| Como alterar ou aprovar os produtos de uma solicitação? | 1 | `review/internal` |
| Posso enviar uma notificação de análise ao cliente? | 2 | `review/internal` |
| Reenviar um e-mail ao consumidor | 1 | `review/internal` |
| Regra por motivo | 1 | `review/internal` |

Total: 8 assets, todos `pending`, sem exposicao publica.

Escopo: auditoria de assets e plano. Nenhum asset foi enviado ao storage e nenhum artigo foi alterado nesta rodada.

## Sumario

O snapshot Octadesk preserva assets locais, mas o runtime Knowledge atual nao os usa. A perda de imagens e a principal causa da queda de qualidade dos artigos publicados: muitos tutoriais foram escritos para acompanhar prints, e a versao atual em `/help/genius` mostra apenas texto.

## Evidencias

- `raw_knowledge/octadesk_export/latest/assets`: 129 arquivos.
- `raw_knowledge/octadesk_export/latest/assets.json`: 129 entradas.
- 53 de 58 artigos tem `assetCount > 0`.
- Detecao por magic bytes local: 129 PNG.
- O exporter registrou `contentType` como `application/octet-stream`, entao o pipeline precisa detectar MIME real.
- `content.local.html` contem tags `img` com paths relativos para `assets/...`.
- O importador atual usa `content.txt`; portanto os links de imagem do HTML nao entram em `body_md`.
- As views publicas atuais expõem `body_md`, mas nao expõem manifest de assets.
- O contrato publico atual de artigo nao tem campo de assets.
- O renderer markdown atual suporta headings, paragrafos, listas, quotes, code, links, bold/italic, mas nao renderiza imagens markdown.

## Amostras auditadas

| Artigo | Assets | Evidencia |
| --- | ---: | --- |
| Configuração de Sellers Permitidos | 3 | HTML local contem 3 `img` com paths `assets/octa-static-tenants/...`. |
| Sellers Permitidos para Criar Vale-Compras | 1 | HTML local contem 1 `img`. |
| Como cadastrar Lojas Físicas | 4 | HTML local contem prints sequenciais de cadastro. |
| Configurando parametrização geral | 9 | Artigo depende fortemente de imagens de tela. |
| Como configurar os textos do Front | 6 | Perda de prints reduz entendimento. |
| Como atualizar os dados de integrações do e-commerce | 8 | Artigo de integracao com dependencia visual alta. |

## Gaps atuais

### Corpus

- Assets existem localmente, mas com extensao legada `.com`.
- MIME informado no JSON nao e confiavel.
- Nao ha alt text editorial.
- Nao ha decisao de sensibilidade por imagem.
- Nao ha manifest por artigo pronto para runtime.

### Banco

- Nao foi encontrada tabela publica de assets Knowledge.
- Existem tabelas de Knowledge para artigos, revisoes, fontes, categorias, espacos e advisories.
- Storage governado existe para evidencias de tickets, mas nao ha contrato equivalente para assets de artigo.
- Views publicas de Knowledge nao expõem assets.

### Frontend publico

- `MarkdownDocument` nao suporta `![alt](url)`.
- O artigo publico nao recebe lista de assets.
- Nao ha componente de imagem segura com caption, fallback e limite de largura.
- Nao ha bloqueio visual para imagem indisponivel.

### Admin Knowledge

- Editor textual existe.
- Preview textual existe.
- Nao ha upload/insercao/remocao de imagens de artigo.
- Nao ha lista de assets legados vinculados ao artigo.
- Nao ha decisao por asset: aprovado, bloqueado, substituir, remover.

## Arquitetura recomendada

### Entidade de assets

Criar, em fase futura, uma entidade governada para assets de Knowledge:

```text
knowledge_article_assets
- id
- article_id
- source_url
- source_hash
- source_path
- storage_bucket
- storage_object_path
- detected_mime_type
- file_size_bytes
- width
- height
- alt_text
- caption
- review_status
- visibility
- is_blocked
- created_at
- updated_at
```

### Storage

- Bucket dedicado: `knowledge-assets`.
- Objetos organizados por `knowledge_space_slug/article_id/hash`.
- Upload/import apenas por service role ou RPC administrativa.
- Leitura publica somente para assets aprovados e associados a artigo `published/public`.
- Nao expor path interno cru ao frontend se o padrao do projeto exigir URL assinada/opaca.

### Pipeline de importacao

1. Ler `content.local.html`.
2. Detectar tags `img`.
3. Resolver path local em `raw_knowledge/octadesk_export/latest/assets`.
4. Calcular hash do arquivo.
5. Detectar MIME por magic bytes.
6. Criar registro de asset em draft/internal.
7. Gerar markdown com placeholder seguro:
   - `![Descricao pendente](knowledge-asset:<asset_id>)`
   - ou bloco proprio `{% asset id="..." %}` se o renderer suportar.
8. No publico, renderizar apenas assets aprovados.
9. Se asset nao aprovado, ocultar imagem e registrar alerta no Admin.

### Renderizacao publica

O renderer deve aceitar imagens apenas em formato governado:

- Nao renderizar URLs arbitrarias de markdown.
- Permitir apenas URLs geradas pelo backend/storage ou identificadores de asset.
- Aplicar `alt`, `caption`, `loading="lazy"` e limite de largura.
- Mostrar fallback discreto se a imagem foi removida da versao publica.

### Admin Knowledge

O Admin deve exibir:

- Aba "Assets".
- Lista de imagens legadas por artigo.
- Preview da imagem.
- Source URL original e path local.
- Status: pendente, aprovado, bloqueado, substituido.
- Campo `alt_text`.
- Campo `caption`.
- Acoes: aprovar para publico, bloquear, substituir, remover referencia do corpo.

## Riscos

| Risco | Impacto | Mitigacao |
| --- | --- | --- |
| Imagem com dado sensivel | Vazamento publico | Revisao por asset e bloqueio por default. |
| URL legada quebrada | Artigo com imagem quebrada | Nao depender da Octadesk em runtime; importar para storage. |
| MIME incorreto | Falha de render/storage | Detectar por magic bytes. |
| Markdown com URL arbitraria | XSS/phishing | Renderer permitir apenas asset governado. |
| Prints desatualizados | Experiencia ruim | Marcar asset como legado e permitir substituicao. |

## Criterios de aceite da fase de assets

- 129 assets importados para storage governado ou explicitamente bloqueados.
- 100% dos artigos com assets tem manifest artigo -> asset.
- Nenhum artigo publico renderiza imagem externa Octadesk em runtime.
- Renderer publico mostra imagens aprovadas sem overflow horizontal.
- Admin Knowledge permite revisar e bloquear assets por artigo.
- Testes Supabase cobrem permissao de leitura publica apenas para asset aprovado.
