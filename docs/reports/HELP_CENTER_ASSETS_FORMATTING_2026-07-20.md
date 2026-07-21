# Central de Ajuda — assets e formatação Octadesk — 2026-07-20

## Resultado

O corpus local foi reprocessado usando como origem canônica a base informada pelo usuário:

- URL de origem: `https://o205658-f7a.octadesk.com/kb/`
- Exportação local auditada: `raw_knowledge/octadesk_export/latest`
- Artigos encontrados no export: 58
- Artigos selecionados pelo allowlist de importação: 54
- Assets de imagem no export: 129
- Formato detectado no corpus atual: 129 PNG
- Vídeos incorporados no HTML exportado: nenhum `iframe`, `video` ou `source` detectado

O export preserva as imagens da base Octadesk em arquivos locais. O problema era que a publicação anterior levava apenas o texto para `body_md`; as referências de imagem não eram materializadas no artigo público.

## Implementação

### Reprocessamento controlado

O script `scripts/knowledge/reprocess-octadesk-article-assets.mjs` agora:

1. lê o HTML e os arquivos de imagem da exportação local;
2. calcula hash e dimensões das imagens;
3. registra cada asset no catálogo governado `knowledge_article_assets`;
4. converte `<img>` para blocos `knowledge-asset:<id>` aceitos pelo editor e leitor;
5. corrige caracteres mojibake presentes na exportação legada quando a conversão é segura;
6. atualiza artigos publicados pela revisão editorial (`begin` → `update` → `publish`), sem contornar auditoria;
7. mantém artigos restritos/rascunhos fora da superfície pública;
8. é idempotente por `(article_id, source_path, source_hash)`.

Execução aplicada somente no Supabase local:

```powershell
node scripts/knowledge/reprocess-octadesk-article-assets.mjs `
  --local `
  --space-slug genius `
  --allowlist docs/reports/OCTADESK_IMPORT_ALL_DRAFTS_ALLOWLIST.json `
  --apply `
  --email ede.oliveira@confi.com.vc `
  --password '<senha local do fixture>'
```

### Buckets e segurança

O bucket privado `knowledge-assets` continua reservado para curadoria interna. Foi criado o bucket público dedicado `knowledge-public-assets`; somente assets já aprovados, não bloqueados e vinculados a artigos `published/public` são movidos para ele pela RPC `rpc_admin_set_knowledge_article_asset_storage_v1`.

O frontend usa URL pública apenas quando o asset está nesse bucket dedicado. A tabela de assets continua sem `SELECT` direto para `anon`; a view pública permanece filtrada pela regra de leitura. O service role usado pelo script é local e fica restrito ao upload dos binários no processo controlado; não é enviado ao navegador nem registrado em saída.

Estado local após o lote:

- Artigos públicos no espaço `genius`: 42
- Assets aprovados no bucket público: 97
- Assets mantidos no bucket privado: 21

## Editor e experiência de leitura

O editor já possuía suporte nativo para:

- imagens com tamanhos pequeno, médio, grande e largura total;
- legendas e texto alternativo;
- vídeos YouTube via bloco controlado;
- cards de artigos relacionados;
- callouts, listas, código, divisores e links.

Após o reprocessamento, o editor passa a exibir as imagens importadas no ponto original. O leitor público também exibe os prints com dimensões naturais, `alt` e layout responsivo.

Os vídeos não foram inventados: não há vídeo incorporado no HTML exportado. Quando a equipe tiver um vídeo oficial, ele pode ser inserido pelo botão `Vídeo` do editor usando o ID do YouTube. Artigos relacionados continuam disponíveis pelo botão `Leia também`.

## Evidências de QA

- Leitor público: [08-article-assets-public.png](C:/Users/edebu/AppData/Local/Temp/gso-help-audit-20260720/08-article-assets-public.png)
  - artigo: `Como configurar os textos do portal do cliente`;
  - 6 imagens encontradas;
  - 6 imagens carregadas com `naturalWidth > 0`;
  - respostas de assets e Storage em HTTP 200;
  - console sem erros da aplicação.
- Editor administrativo: [10-editor-assets-fixed.png](C:/Users/edebu/AppData/Local/Temp/gso-help-audit-20260720/10-editor-assets-fixed.png)
  - 6 nós de mídia carregados;
  - nenhum placeholder `Imagem indisponível`;
  - imagens carregadas com dimensões naturais;
  - sem erros de página.

## Pendências conscientes

- A URL Octadesk foi registrada como fonte canônica, mas a validação e a aplicação desta sessão usam o export local versionado; a abertura automática da URL externa não foi necessária para reprocessar o corpus disponível.
- A publicação dos 12 itens bloqueados pela curadoria anterior continua separada; imagens desses itens permanecem internas/restritas.
- Não há migração automática de vídeos porque a fonte não forneceu vídeos incorporados no export.
