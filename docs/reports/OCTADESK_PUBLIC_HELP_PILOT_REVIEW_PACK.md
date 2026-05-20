# OCTADESK_PUBLIC_HELP_PILOT_REVIEW_PACK.md

## Objetivo

Pacote editorial revisavel para os 4 artigos do lote piloto Octadesk da Central de Ajuda Genius.

Este pacote nao autoriza publicacao. Todos os artigos permanecem em `draft_only_blocked_for_publish` ate revisao humana completa.

## Estado de importacao

Em 2026-05-20, os 4 artigos deste pacote foram importados localmente para o espaco `genius` como `draft` e `internal`.

- Publicacao: bloqueada.
- Visibilidade publica: bloqueada.
- Advisories: sincronizados com `review_status = pending`.
- Public Help: os drafts nao aparecem em `/help/genius`.
- Proximo passo: revisao humana, reescrita e revisao dos assets antes de qualquer decisao de publicacao.

## Checklist obrigatorio por artigo

- [ ] titulo revisado
- [ ] resumo revisado
- [ ] corpo revisado
- [ ] assets revisados
- [ ] links revisados
- [ ] sem dados sensiveis
- [ ] sem instrucao interna
- [ ] pronto para review
- [ ] pronto para publish

## 1. Como alterar ou aprovar os produtos de uma solicitacao?

- source_path: `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-como-alterar-ou-aprovar-os-produtos-de-uma-solicitacao`
- source_hash: `59b0619bf620261477c2491feaf6d274f68f95ea0ac7a1faf686704fba1a364a`
- categoria/secao original: `Configuracoes / Configuracao de ambiente`
- assets vinculados: `1`
- asset local: `assets\octa-static-tenants\o205658-f7a\knowledgebase\2025-02-21\ymsbliqg4nxdcilm_qdwi.com`
- decisao atual: `draft_only_blocked_for_publish`

Resumo do conteudo:

O artigo explica como alterar produtos ou aprovar todos os itens adicionados pelo consumidor em uma solicitacao, usando a area de solicitacoes e a aba de acoes pendentes.

Riscos observados:

- depende de imagem exportada como `application/octet-stream`;
- usa linguagem herdada de consumidor/e-commerce;
- pode expor detalhes de UI legada se o asset estiver desatualizado.

Pontos que exigem reescrita:

- trocar "consumidor" por linguagem B2B adequada quando fizer sentido;
- validar se o fluxo atual ainda usa "Acoes Pendentes", "Aprovar Todos" e "Alterar Produto(s)";
- reduzir instrucao operacional granular se a UI atual divergir.

Sugestao de titulo publico Genius:

- `Alterar ou aprovar produtos em uma solicitacao`

Sugestao de categoria publica:

- `Operacao de trocas e devolucoes`

## 2. Posso enviar uma notificacao de analise ao cliente?

- source_path: `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-posso-enviar-uma-notificacao-de-analise-ao-cliente`
- source_hash: `7161e4ec3c080f510fbf31b30d0425ac69d5544b19bf5fdb6d0eb89a89dc9619`
- categoria/secao original: `Configuracoes / Configuracao de ambiente`
- assets vinculados: `2`
- asset local: `assets\octa-static-tenants\o205658-f7a\knowledgebase\2025-02-24\a-ign2x9iklmcesech1qw.com`
- asset local: `assets\octa-static-tenants\o205658-f7a\knowledgebase\2025-02-24\ndbfosldibx8bxd2krdql.com`
- decisao atual: `draft_only_blocked_for_publish`

Resumo do conteudo:

O artigo orienta o envio de notificacoes de analise ao cliente com fotos e descricoes a partir da area de solicitacoes.

Riscos observados:

- possui 2 assets obrigatorios para validar contexto visual;
- pode conter UI legada;
- precisa confirmar se fotos/descricoes podem ser descritas publicamente sem expor fluxo interno.

Pontos que exigem reescrita:

- transformar pergunta em artigo instrucional objetivo;
- revisar termos "produtos em analise" e "cliente" para consistencia com a Central Genius;
- validar se o fluxo ainda existe no produto atual.

Sugestao de titulo publico Genius:

- `Enviar notificacao de analise ao cliente`

Sugestao de categoria publica:

- `Comunicacao com cliente`

## 3. Reenviar um e-mail ao consumidor

- source_path: `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-reenviar-um-e-mail-ao-consumidor`
- source_hash: `b2d6f54bf368cbf3e823a55e461d463ba61fb8b5482fd22d5756a5406ee13d43`
- categoria/secao original: `Configuracoes / Configuracao de ambiente`
- assets vinculados: `1`
- asset local: `assets\octa-static-tenants\o205658-f7a\knowledgebase\2025-02-21\p9gpoq87yfp7ilg8ejdem.com`
- decisao atual: `draft_only_blocked_for_publish`

Resumo do conteudo:

O artigo explica como reenviar um e-mail a partir da aba de comunicacao em uma solicitacao.

Riscos observados:

- usa linguagem "consumidor";
- depende de asset;
- pode expor nomenclatura antiga da tela de solicitacoes.

Pontos que exigem reescrita:

- ajustar titulo para "cliente" ou "solicitante", conforme padrao final;
- validar se a aba "Comunicacao" e o botao "Reenviar" continuam corretos;
- remover qualquer referencia visual que nao exista na interface atual.

Sugestao de titulo publico Genius:

- `Reenviar uma comunicacao ao cliente`

Sugestao de categoria publica:

- `Comunicacao com cliente`

## 4. Regra por motivo

- source_path: `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-regra-por-motivo`
- source_hash: `fb3075312afaaa4cbb9ed019a683681c0c0902026f08a46283cb74906cc17aeb`
- categoria/secao original: `Configuracoes / Configuracao de ambiente`
- assets vinculados: `1`
- asset local: `assets\octa-static-tenants\o205658-f7a\knowledgebase\2025-03-19\cbjxtrg9zmg9kofdi-oxz.com`
- decisao atual: `draft_only_blocked_for_publish`

Resumo do conteudo:

O artigo descreve como habilitar regras especificas para um motivo cadastrado em configuracoes de ambiente.

Riscos observados:

- trata de configuracao operacional;
- pode ficar interno se revelar regra administrativa sensivel;
- depende de asset visual.

Pontos que exigem reescrita:

- definir se o artigo e publico ou apenas Admin Knowledge interno;
- explicar em linguagem de resultado, nao de playbook interno;
- validar se a regra por motivo e um recurso visivel/adequado para cliente B2B.

Sugestao de titulo publico Genius:

- `Configurar regras por motivo`

Sugestao de categoria publica:

- `Regras de operacao`

## Bloqueio de publicacao

Nenhum dos 4 artigos deve ser publicado sem:

- aprovacao humana explicita;
- revisao dos assets;
- revisao do texto final;
- confirmacao de ausencia de dados sensiveis;
- QA publico em `/help/genius`.
