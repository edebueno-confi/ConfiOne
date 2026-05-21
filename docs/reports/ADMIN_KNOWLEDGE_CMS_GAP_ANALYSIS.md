# Admin Knowledge CMS Gap Analysis

Data: 2026-05-21

## Atualizacao de implementacao - 2026-05-21

O Admin Knowledge passou a sustentar curadoria inicial de artigos ricos:

- carrega assets vinculados por artigo via `vw_admin_knowledge_article_assets`;
- mostra preview de imagem por URL assinada administrativa;
- exibe badges de `review_status`, visibilidade e bloqueio;
- permite aprovar ou bloquear asset via `rpc_admin_update_knowledge_article_asset_review_v1`;
- mantém a publicação pública bloqueada enquanto o artigo e seus assets não estiverem aprovados pelo gate editorial.

Ainda não foi implementado editor rico completo de markdown/blocos. O editor textual permanece, mas agora o CMS já enxerga a fila de assets legados e consegue impedir republicação cega.

Escopo: avaliacao do Admin Knowledge como CMS interno. Nenhum codigo foi alterado nesta rodada.

## Resumo

O Admin Knowledge ja e uma fila editorial funcional para artigos textuais: lista artigos, filtra por status/visibilidade/categoria, abre detalhes, edita draft, submete para review, marca advisory, publica, arquiva e preserva origem (`source_path`/`source_hash`).

Para sustentar a Central Genius como produto editorial melhor que a antiga Octadesk, ele precisa evoluir para CMS real de artigos ricos. O gap principal e suporte a imagens/assets, preview fiel ao publico e fluxo guiado de curadoria.

## Matriz de capacidades

| Capacidade | Estado atual | Necessidade | Observacao |
| --- | --- | --- | --- |
| Criar artigo novo | Ja existe | Manter | `createKnowledgeArticleDraftV2`. |
| Editar titulo | Ja existe | Manter | Via formulario de artigo. |
| Editar slug | Ja existe | Manter com validacao | Precisa evitar quebra de links publicos. |
| Editar resumo | Ja existe | Manter | Campo editorial basico. |
| Editar corpo markdown | Ja existe | Melhorar | Precisa editor com estrutura, nao textarea simples. |
| Escolher categoria | Ja existe | Melhorar | Precisa arvore e taxonomia publica clara. |
| Escolher visibilidade | Ja existe | Manter com guardrails | `public/internal/restricted`. |
| Salvar draft | Ja existe | Manter | RPC administrativa existente. |
| Submeter para review | Ja existe | Manter | `submitKnowledgeArticleForReviewV2`. |
| Marcar advisory como revisado | Ja existe | Melhorar UX | Deve exigir motivo/checklist quando publico. |
| Publicar | Ja existe | Manter com gate | Nao deve contornar checklist/gate. |
| Arquivar | Ja existe | Manter | Necessario para legado ruim. |
| Ver historico/revisoes | Existe parcialmente | Melhorar | Ha revisoes, mas UX de diff/historico pode evoluir. |
| Ver origem legado | Ja existe | Manter | `source_path` e `source_hash`. |
| Filtrar por origem Octadesk | Existe parcialmente | Melhorar | Pode buscar source, mas precisa filtro dedicado. |
| Ver advisory | Ja existe | Manter | Aba de review/classificacao/checklist. |
| Inserir imagem | Nao existe | Precisa backend + frontend | Depende de assets governados. |
| Remover imagem | Nao existe | Precisa backend + frontend | Remover referencia e/ou bloquear asset. |
| Revisar asset legado | Nao existe | Precisa backend + frontend | Bloqueante para artigos ricos. |
| Reordenar conteudo | Parcial | Precisa UX/editor | Hoje depende de editar markdown manualmente. |
| Linkar artigos relacionados | Nao existe | Precisa backend + frontend | Hoje relacionados sao inferidos por categoria. |
| Buscar artigos | Ja existe | Melhorar | Busca/lista operacional existe. |
| Filtrar por status | Ja existe | Manter | Status filter. |
| Filtrar por categoria | Ja existe | Melhorar | Precisa arvore publica. |
| Filtrar por risco | Parcial | Melhorar | Usar advisory/risk flags com filtro dedicado. |
| Preview publico fiel | Parcial | Melhorar | Preview textual nao garante mesma renderizacao da central publica. |
| Checklist humano | Parcial | Melhorar | Existe advisory/human confirmations, mas UX deve ser mais direta. |
| Validar links | Nao existe | Precisa frontend/script | Pode ser rotina de QA. |
| Validar imagens quebradas | Nao existe | Precisa backend/frontend/script | Depende de assets. |

## Gaps bloqueantes para CMS real

1. Ausencia de asset management de Knowledge.
2. Preview nao fiel ao Public Help, especialmente para imagens.
3. Editor markdown sem componentes orientados a artigo: alerta, passos, dica, imagem, relacionados.
4. Taxonomia publica ainda misturada com secoes legadas.
5. Falta filtro dedicado "Origem: Octadesk".
6. Falta painel de qualidade por artigo: sem imagem, imagem pendente, categoria inflada, titulo com typo, risco financeiro.

## Melhorias pequenas possiveis sem backend novo

- Filtro visual por `source_path` contendo Octadesk.
- Badge "Origem Octadesk".
- Badge "Nao publico", "Restrito" e "Publicado".
- Indicador de `source_hash`.
- Aviso no detalhe: "Artigo legado sem assets migrados".
- Copy de bloqueio: "Nao publicar novamente ate reprocessar estrutura/assets".

Essas melhorias ajudam operacao, mas nao resolvem o problema principal de imagens e estrutura.

## Melhorias que exigem backend/contrato

- Tabela/contrato de assets.
- Storage bucket para `knowledge-assets`.
- Views admin/public de assets.
- RPC para aprovar/bloquear/substituir asset.
- Contrato de artigos relacionados.
- Checklist editorial persistido por artigo/versao, se o advisory atual nao for suficiente.
- Validacao de markdown com blocos governados.

## Fluxo CMS alvo

1. Artigo entra como draft/internal ou draft/restricted.
2. Admin ve origem, risco, assets e categoria sugerida.
3. Editor ajusta titulo, resumo, corpo, categoria e imagens.
4. Preview mostra exatamente como ficara no publico.
5. Checklist valida:
   - categoria correta;
   - sem conteudo interno;
   - assets aprovados;
   - links revisados;
   - estrutura minima;
   - titulo e resumo revisados.
6. Artigo vai para review.
7. Revisor marca advisory/checklist.
8. Gate publica apenas se status, visibilidade e checklist estiverem coerentes.

## Requisitos para a proxima implementacao

- Nao alterar frontend publico antes de definir contrato de assets.
- Nao republicar corpus inteiro sem remap e asset manifest.
- Nao usar HTML legado diretamente no publico.
- Implementar preview usando o mesmo renderer do Public Help.
- Manter source_path/source_hash sempre visiveis no Admin para rastreabilidade.
- Preservar auditoria em todas as transicoes editoriais.

## Criterios de aceite

- Operador consegue localizar todos os artigos Octadesk.
- Operador consegue ver quais artigos estao publicados, restritos, sem assets e com categoria incorreta.
- Editor consegue transformar um artigo legado em artigo publico rico sem sair do Admin.
- Preview do Admin corresponde ao Public Help.
- Publicacao bloqueia artigo com asset pendente quando o corpo depende dele.
