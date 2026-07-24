# Help Center Refactor Master Plan

Data: 2026-05-21

## Atualizacao de execucao corretiva - 2026-05-21

Este plano saiu de auditoria para execucao corretiva controlada. O estado bruto de publicacao Octadesk foi retirado da Central Publica: os 43 artigos Octadesk antes publicados voltaram para `review/internal`, os 11 restritos permaneceram `draft/restricted` e `/help/genius` voltou a expor apenas os 6 artigos seed/manuais.

Tambem foi criada a fundacao governada de assets Knowledge:

- tabela `knowledge_article_assets`;
- bucket privado `knowledge-assets`;
- views `vw_admin_knowledge_article_assets` e `vw_public_knowledge_article_assets`;
- RPCs `rpc_admin_unpublish_knowledge_article_v2`, `rpc_admin_upsert_knowledge_article_asset_v1` e `rpc_admin_update_knowledge_article_asset_review_v1`;
- renderer publico com suporte apenas a `knowledge-asset:<id>`;
- painel administrativo de assets no Admin Knowledge;
- script `scripts/knowledge/reprocess-octadesk-article-assets.mjs` para usar `content.local.html` como fonte estrutural e materializar imagens locais sem depender da Octadesk em runtime.

O primeiro artigo piloto, `Configuração de Sellers Permitidos`, e os quatro artigos da Onda 0 foram reprocessados com placeholders governados e 8 assets pendentes. Nada foi republicado.

Escopo: auditoria e plano. Nenhum artigo foi publicado, ocultado, reimportado ou alterado nesta rodada.

## Resumo executivo

A Central Genius recebeu o corpus Octadesk, mas a experiencia publica ficou abaixo do necessario porque a migracao priorizou volume e seguranca minima, nao qualidade de leitura. O conteudo legado foi publicado como texto derivado de `content.txt`; com isso, a central perdeu imagens, hierarquia visual, contexto de passos e parte da estrutura semantica que existia no HTML original da Octadesk.

O problema principal nao e somente visual. O modelo atual ainda nao trata a Central de Ajuda como produto editorial completo. Faltam taxonomia publica propria, pipeline de assets, conversao HTML -> markdown estruturado, preview real no Admin Knowledge e governanca para reprocessar artigos legados sem depender da Octadesk em runtime.

Recomendacao: nao considerar os 43 artigos Octadesk publicados como estado final. O caminho mais seguro e ocultar ou devolver temporariamente esses artigos para fluxo interno/review antes de uma republicacao organizada, mantendo publicos apenas os 6 artigos seed/manuais e qualquer artigo legado que seja reprocessado com taxonomia, estrutura e assets validados. Esta rodada nao executa essa mudanca; ela apenas registra a decisao recomendada para aprovacao.

## Fontes auditadas

- Central Octadesk autorizada: `https://o205658-f7a.octadesk.com/kb/`.
- API Octadesk usada pelo exportador: `https://southamerica-east1-004.prod.octadesk.services/knowledgebase`.
- Snapshot local: `raw_knowledge/octadesk_export/latest`.
- Frontend publico atual: `/help/genius`, `/help/genius/articles` e detalhe de artigos.
- Admin Knowledge atual: `/admin/knowledge`.
- Banco local Knowledge via queries read-only.
- Scripts: `scripts/knowledge/import-octadesk-drafts.mjs`, `scripts/knowledge/sync-review-advisories.mjs`, `scripts/knowledge/publish-octadesk-public-help.mjs`.

## Estado atual observado

### Corpus Octadesk

- 58 artigos no snapshot.
- 3 categorias originais.
- 4 secoes originais.
- 129 assets baixados.
- 53 artigos com pelo menos 1 asset.
- Todos os 129 assets locais detectados sao imagens PNG, apesar de terem nomes legados sem extensao e `contentType` `application/octet-stream`.
- O HTML local preserva tags `img` com dimensoes e paths relativos.

### Organizacao original Octadesk

| Categoria original | Secao original | Artigos |
| --- | --- | ---: |
| Configuracoes | Sellers e Loja Fisica | 4 |
| Configuracoes | Configuracao de ambiente | 41 |
| Cadastros | Integracao e atualizacao | 8 |
| Erros comuns e solucoes | Erros e pendencias | 5 |

Essa estrutura ja era concentrada demais: 45 de 58 artigos estavam dentro de Configuracoes. A nova Central Genius nao deve replicar essa taxonomia; ela precisa reorganizar por tarefa e risco operacional.

### Runtime Knowledge atual

- 54 artigos Octadesk processados no Knowledge.
- 43 artigos Octadesk `published/public`.
- 11 artigos Octadesk `draft/restricted`.
- 43 advisories `reviewed/public`.
- 11 advisories `pending/restricted`.
- `/help/genius` exibe 49 artigos no total: 43 Octadesk + 6 seed/manuais.

### Categorias publicas atuais para os 43 Octadesk publicados

| Categoria publica atual | Artigos Octadesk publicados |
| --- | ---: |
| Configuracao de ambiente | 37 |
| Sellers e Loja Fisica | 3 |
| Erros e pendencias | 3 |

Esse e o principal sintoma de produto: a central parece uma migracao bruta, nao uma central de ajuda organizada.

## Diagnostico de causa raiz

### A. Conteudo

- Muitos artigos sao tutoriais operacionais com passos dependentes de telas e prints.
- O texto puro ficou pobre sem imagens e sem blocos de apoio.
- Parte da linguagem ainda fala com o consumidor final ou usa termos de SAC B2C.
- Alguns artigos misturam configuracao, regra de negocio, operacao e troubleshooting no mesmo grupo.
- Titulos legados tem typos e variacoes que prejudicam busca e credibilidade.

### B. Estrutura de dados

- O modelo Knowledge atual cobre artigos, categorias, fontes, revisoes e advisories.
- Nao ha entidade publica especifica para assets de Knowledge.
- Nao ha vinculo governado artigo -> asset.
- As views publicas expõem `body_md`, mas nao expõem manifest de imagens.
- O contrato publico nao diferencia assets aprovados, bloqueados, ausentes ou substituidos.

### C. UX publica

- A lista publica passou a mostrar todos os artigos, mas a navegacao ficou desequilibrada.
- A pagina de artigo tem boa base de layout, mas renderiza apenas markdown simplificado.
- Nao ha renderizacao de imagens inline.
- Nao ha blocos editoriais como alerta, antes de comecar, passo a passo, erro comum e proximo passo.
- O sumario lateral depende de headings markdown; artigos importados via texto puro quase nao geram sumario util.

### D. Admin/editorial

- O Admin Knowledge ja permite localizar, editar, submeter, revisar, publicar e ver origem.
- Ele e suficiente para governanca textual basica.
- Ele ainda nao e um CMS completo para artigos ricos: nao gerencia imagens, nao faz upload/anexo editorial, nao tem preview fiel ao publico, nao mostra mapa artigo -> asset, nao valida links/imagens e nao oferece modelo editorial guiado.

### E. Importacao legado Octadesk

- O exportador preserva `content.raw.html`, `content.local.html`, `content.txt` e assets.
- O importador usa `content.txt` como fonte principal, por desenho seguro inicial.
- Essa escolha evitou HTML legado no runtime, mas removeu estrutura e imagens.
- A transformacao atual nao preserva headings, listas numeradas, imagens, links visuais, legendas ou espacamento semantico.

## Decisao recomendada sobre os 43 artigos publicados

Opcao recomendada: ocultar temporariamente os 43 artigos Octadesk publicados ou devolve-los para `review/internal` em lote controlado antes de uma republicacao organizada.

Justificativa:

- A central publica atual ficou menos clara que a base legada.
- Publicar volume com taxonomia ruim prejudica confianca do cliente.
- A seguranca tecnica minima foi satisfeita, mas a experiencia de produto nao.
- O custo de manter publico e corrigir em cima e maior do que reprocessar com pipeline correto.
- Os 6 artigos seed/manuais podem continuar sustentando `/help/genius` enquanto a Onda 0 e reprocessada.

Alternativa aceitavel se negocio exigir manter conteudo acessivel: criar uma categoria temporaria "Base legada em revisao" e limitar a busca/categoria com aviso editorial. Essa opcao e inferior porque institucionaliza uma experiencia incompleta.

## Nova taxonomia publica recomendada

| Categoria | Objetivo | Entra | Nao entra | Prioridade | Risco |
| --- | --- | --- | --- | --- | --- |
| Primeiros passos | Orientar configuracao inicial e conceitos essenciais | Parametrizacao geral, visao de solicitacao, fluxo basico | Regras financeiras especificas | Alta | Baixo |
| Configuracoes da plataforma | Ajustes administrativos gerais | Textos, filtros, blocklist, cores, regras gerais | Integracoes, PIX, Correios, estorno sensivel | Alta | Medio |
| Operacao de trocas e devolucoes | Execucao diaria de solicitacoes | Alterar status, aprovar produtos, segunda solicitacao, fique com item | Parametros tecnicos internos | Alta | Medio |
| Reembolsos, estornos e vale-compras | Politicas e configuracoes financeiras | Formas de estorno, vale-compras, frete, limites | Payload, credenciais, chaves, operacao bancaria sensivel | Alta | Alto |
| Integracoes e permissoes | Conectar e manter plataformas | VTEX, Shopify, Tray, Nuvemshop | Segredos, tokens, service_role, headers | Media | Alto |
| Correios e logistica reversa | Contratos, codigo de postagem e reversa | Prazo logistico, Correios, pendencias logisticas | Contratos/credenciais expostos | Media | Alto |
| Sellers e lojas fisicas | Regras multi-seller e loja fisica | Sellers permitidos, lojas fisicas, loja virtual | Estorno interno por seller sem contexto | Media | Medio |
| Notificacoes e comunicacao | E-mails, notificacoes e contato com cliente | Reenvio de e-mail, notificacao de analise, textos do portal | Comunicacao interna de suporte | Alta | Baixo |
| Erros comuns e solucoes | Diagnostico seguro para cliente B2B | CEP, estorno, pendencia, autorizacao generica | Logs, stack trace, endpoint privado | Media | Alto |
| Boas praticas operacionais | Recomendacoes e padroes de uso | Padroes de seguranca, politica, melhores praticas | Procedimento interno confidencial | Baixa | Medio |
| Suporte no portal | Como pedir ajuda e acompanhar suporte | Contato, abertura de ticket, leitura da central | Artigos de configuracao profunda | Media | Baixo |

## Modelo de artigo ideal

Cada artigo publico deve seguir este padrao:

1. Titulo claro e orientado a tarefa.
2. Resumo curto em linguagem B2B.
3. Quando usar.
4. Antes de comecar.
5. Passo a passo com listas numeradas.
6. Imagens inline quando ajudarem a reconhecer a tela.
7. Observacoes importantes.
8. Erros comuns.
9. Proximos passos.
10. Artigos relacionados.
11. Ultima atualizacao.

Tom Genius B2B:

- Falar com operador, gestor ou time de ecommerce, nao com shopper final.
- Preferir "cliente", "loja", "operacao" e "solicitacao".
- Evitar "consumidor" quando o artigo estiver orientado ao admin.
- Nao prometer comportamento nao confirmado.
- Explicar dependencias de configuracao com aviso claro.
- Separar configuracao, operacao e troubleshooting.

## Arquitetura recomendada para imagens/assets

1. Preservar assets legados em storage governado, sem depender da Octadesk em runtime.
2. Criar entidade `knowledge_article_assets` ou equivalente com:
   - `article_id`;
   - `source_url`;
   - `source_hash`;
   - `storage_bucket`;
   - `storage_object_path`;
   - `mime_type` detectado;
   - `width`/`height` quando disponivel;
   - `review_status`;
   - `visibility`;
   - `alt_text`;
   - `caption`;
   - `is_blocked`.
3. Converter imagens do HTML para markdown seguro ou bloco editorial proprio.
4. Renderizar imagens apenas se o asset estiver aprovado para publico.
5. No Admin Knowledge, exibir preview, lista de assets, status e acao de bloquear/substituir.
6. Se imagem estiver ausente, renderizar aviso editorial no Admin e remover/substituir no publico.

## Plano por fases

### Fase A - Auditoria e remapeamento

- Objetivo: congelar remap dos 58 artigos para taxonomia Genius.
- Arquivos provaveis: scripts de relatorio em `scripts/knowledge`, docs em `docs/reports`.
- Backend necessario: nao.
- Frontend necessario: nao.
- Risco: baixo.
- Criterio de aceite: 100% dos artigos com categoria alvo, decisao de publicacao e dependencia de asset.
- Validacoes: relatorio de consistencia e contagens por categoria.

### Fase B - Suporte a assets

- Objetivo: materializar imagens no runtime governado.
- Arquivos provaveis: migrations Knowledge, scripts de asset import, contratos admin/public, storage policies.
- Backend necessario: sim.
- Frontend necessario: parcial.
- Risco: alto, por exposicao de imagens e storage.
- Criterio de aceite: assets importados com hash, mime real, politica de acesso e vinculo por artigo.
- Validacoes: tests Supabase, lint DB, QA de imagem publica e admin.

### Fase C - Melhorar importador

- Objetivo: converter `content.local.html` para markdown estruturado, preservando headings, listas, links e imagens aprovadas.
- Arquivos provaveis: `scripts/knowledge/import-octadesk-drafts.mjs`, novo conversor HTML -> markdown, relatorios de diff.
- Backend necessario: nao, se Fase B ja existir.
- Frontend necessario: nao.
- Risco: medio.
- Criterio de aceite: artigos reprocessados sem texto corrido e com referencias de assets seguras.
- Validacoes: dry-run comparativo HTML/text/markdown, snapshot de artigos.

### Fase D - Admin Knowledge CMS

- Objetivo: tornar `/admin/knowledge` editor real de artigos ricos.
- Arquivos provaveis: `apps/web/src/features/knowledge/KnowledgePage.tsx`, contratos existentes ou novos de assets.
- Backend necessario: sim para assets/checklist se ainda nao existir.
- Frontend necessario: sim.
- Risco: medio.
- Criterio de aceite: criar/editar/preview/publicar artigo com imagem e checklist.
- Validacoes: typecheck, build, QA autenticado.

### Fase E - Public Help UX

- Objetivo: melhorar leitura e navegacao publica.
- Arquivos provaveis: `apps/web/src/features/help-center/*`.
- Backend necessario: nao, se views expuserem dados suficientes.
- Frontend necessario: sim.
- Risco: medio.
- Criterio de aceite: categorias equilibradas, imagens inline, sidebar util, busca clara e sem overflow.
- Validacoes: QA publico, responsividade, busca, detalhe.

### Fase F - Reprocessamento do corpus

- Objetivo: aplicar nova taxonomia, assets e markdown aos 54/58 artigos.
- Arquivos provaveis: scripts Knowledge, allowlists, docs de release.
- Backend necessario: nao se fases anteriores concluirem.
- Frontend necessario: nao.
- Risco: medio.
- Criterio de aceite: publicar por lote apenas artigos com estrutura aceitavel.
- Validacoes: dry-run, apply controlado, QA publico por lote.

### Fase G - Rotina futura

- Objetivo: operar a central como CMS vivo.
- Arquivos provaveis: runbooks e docs de processo.
- Backend necessario: nao.
- Frontend necessario: possivelmente nao.
- Risco: baixo.
- Criterio de aceite: fluxo documentado para criar, revisar, publicar, arquivar e manter artigos.
- Validacoes: checklist editorial mensal.

## Proximos prompts recomendados

1. "Codex, execute a Fase A: gerar remap definitivo dos 58 artigos para a nova taxonomia, sem alterar banco nem publicar."
2. "Codex, planeje e implemente suporte governado a assets de Knowledge, com migration, storage seguro, testes e preview admin."
3. "Codex, reprocessar um artigo piloto Octadesk com HTML estruturado e imagens, sem publicar, para validar o pipeline."
