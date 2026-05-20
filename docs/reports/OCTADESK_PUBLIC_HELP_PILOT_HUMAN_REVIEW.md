# OCTADESK_PUBLIC_HELP_PILOT_HUMAN_REVIEW.md

## Objetivo

Preparar a curadoria humana dos 4 drafts piloto Octadesk importados para o espaco `genius` da Knowledge Base.

Este documento nao autoriza publicacao. Ele organiza o que Produto, Suporte/CS e Operacao precisam revisar antes de qualquer mudanca para `review`, `published` ou `public`.

## Estado operacional em 2026-05-20

- Origem: corpus Octadesk em `raw_knowledge/octadesk_export/latest`.
- Escopo: apenas os 4 artigos da allowlist piloto.
- Banco local: 4 artigos criados como `draft/internal`.
- Advisories: 4 registros com `review_status = pending`.
- Public Help: os 4 drafts nao aparecem em `/help/genius`.
- Decisao: `bloqueado_para_publicacao_automatica`.

## Atualizacao editorial em 2026-05-20

O pacote de versoes editoriais sugeridas foi criado em:

- `docs/reports/OCTADESK_PUBLIC_HELP_PILOT_EDITORIAL_DRAFTS.md`

Esse pacote prepara textos revisaveis para o Admin Knowledge, mas nao preenche checklist humano, nao revisa assets e nao autoriza publicacao. A decisao dos 4 artigos permanece `aguardando_revisao_humana`.

Aplicacao local controlada: os 4 drafts foram atualizados via RPC existente `rpc_admin_update_knowledge_article_draft_v2`, mantendo `status = draft`, `visibility = internal`, `source_path`, `source_hash` e advisories `pending`. Nenhum artigo foi publicado ou liberado como `public`.

## Checklist humano comum

Cada artigo precisa ter todos os itens abaixo preenchidos por revisao humana antes de qualquer publicacao:

- [ ] titulo revisado
- [ ] resumo revisado
- [ ] corpo revisado
- [ ] categoria revisada
- [ ] assets revisados
- [ ] links revisados
- [ ] sem credenciais, tokens ou logs
- [ ] sem instrucao interna
- [ ] sem dado sensivel
- [ ] pronto para review
- [ ] pronto para publish

## 1. Como alterar ou aprovar os produtos de uma solicitacao?

### Identificacao

- Titulo original: `Como alterar ou aprovar os produtos de uma solicitacao?`
- Article ID local: `51ed010e-ec55-4078-851c-94fbaa337adf`
- Source path: `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-como-alterar-ou-aprovar-os-produtos-de-uma-solicitacao`
- Source hash: `59b0619bf620261477c2491feaf6d274f68f95ea0ac7a1faf686704fba1a364a`
- Status atual: `draft`
- Visibility atual: `internal`
- Categoria importada: `Configuracao de ambiente`
- Advisory status: `pending`
- Assets vinculados: `1`

### Diagnostico editorial

O artigo parece ensinar como alterar produtos ou aprovar todos os itens adicionados em uma solicitacao. O conteudo e potencialmente util para cliente B2B, mas ainda esta escrito com linguagem herdada do e-commerce e depende de uma imagem exportada do corpus legado.

Riscos:

- fluxo pode estar preso a nomes de UI legada como `Acoes Pendentes`, `Aprovar Todos` e `Alterar Produto(s)`;
- usa `consumidor` onde a Central Genius provavelmente deve preferir `cliente`, `solicitante` ou linguagem B2B acordada;
- asset precisa confirmar se a tela exibida ainda corresponde ao produto atual;
- instrucoes passo a passo podem expor detalhe operacional demais se a funcionalidade for apenas interna.

### Sugestao de versao publica

- Titulo publico sugerido: `Alterar ou aprovar produtos em uma solicitacao`
- Resumo publico sugerido: `Entenda quando e como revisar produtos de uma solicitacao antes de seguir com a tratativa operacional.`
- Categoria publica sugerida: `Operacao de trocas e devolucoes`

Estrutura recomendada:

- Quando usar esta acao.
- O que verificar antes de aprovar produtos.
- Como alterar um produto com seguranca.
- Como aprovar os itens da solicitacao.
- O que fazer se a opcao nao aparecer.

Remover ou revisar:

- referencias a UI legada que nao existam no produto atual;
- termos `consumidor` e `e-commerce` quando nao forem a linguagem final;
- qualquer detalhe que pareca playbook interno.

Pode permanecer:

- explicacao de objetivo da acao;
- cuidado com revisao antes de aprovar;
- orientacao operacional de alto nivel.

Assets que precisam revisao:

- `assets\octa-static-tenants\o205658-f7a\knowledgebase\2025-02-21\ymsbliqg4nxdcilm_qdwi.com`

### Checklist humano

- [ ] titulo revisado
- [ ] resumo revisado
- [ ] corpo revisado
- [ ] categoria revisada
- [ ] assets revisados
- [ ] links revisados
- [ ] sem credenciais, tokens ou logs
- [ ] sem instrucao interna
- [ ] sem dado sensivel
- [ ] pronto para review
- [ ] pronto para publish

Decisao atual: `bloqueado_para_publicacao_automatica`

## 2. Posso enviar uma notificacao de analise ao cliente?

### Identificacao

- Titulo original: `Posso enviar uma notificacao de analise ao cliente?`
- Article ID local: `5801edde-258d-41cb-9ed1-70047e32830d`
- Source path: `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-posso-enviar-uma-notificacao-de-analise-ao-cliente`
- Source hash: `7161e4ec3c080f510fbf31b30d0425ac69d5544b19bf5fdb6d0eb89a89dc9619`
- Status atual: `draft`
- Visibility atual: `internal`
- Categoria importada: `Configuracao de ambiente`
- Advisory status: `pending`
- Assets vinculados: `2`

### Diagnostico editorial

O artigo explica que e possivel enviar uma notificacao de analise ao cliente com fotos e descricao. A ideia pode ser publica, mas o texto precisa virar uma orientacao clara de comunicacao operacional, sem depender de termos ou imagens antigas.

Riscos:

- depende de dois assets para validar a interface;
- pode descrever um fluxo de comunicacao que mudou no produto atual;
- precisa separar orientacao ao cliente B2B de procedimento interno do time;
- precisa confirmar se fotos e descricoes podem ser tratadas publicamente sem expor politica operacional sensivel.

### Sugestao de versao publica

- Titulo publico sugerido: `Enviar notificacao de analise ao cliente`
- Resumo publico sugerido: `Veja como comunicar ao cliente que uma solicitacao esta em analise e quais informacoes devem acompanhar a notificacao.`
- Categoria publica sugerida: `Comunicacao com cliente`

Estrutura recomendada:

- Quando enviar a notificacao.
- Quais informacoes revisar antes do envio.
- Como incluir fotos ou descricao.
- Como confirmar que a mensagem foi enviada.
- O que fazer se o cliente nao receber.

Remover ou revisar:

- pergunta no titulo, se o padrao editorial preferir instrucao direta;
- exemplos visuais desatualizados;
- qualquer referencia a rotina interna sem valor para cliente B2B.

Pode permanecer:

- objetivo da notificacao;
- necessidade de fotos/descricao quando aplicavel;
- orientacao de cuidado antes do envio.

Assets que precisam revisao:

- `assets\octa-static-tenants\o205658-f7a\knowledgebase\2025-02-24\a-ign2x9iklmcesech1qw.com`
- `assets\octa-static-tenants\o205658-f7a\knowledgebase\2025-02-24\ndbfosldibx8bxd2krdql.com`

### Checklist humano

- [ ] titulo revisado
- [ ] resumo revisado
- [ ] corpo revisado
- [ ] categoria revisada
- [ ] assets revisados
- [ ] links revisados
- [ ] sem credenciais, tokens ou logs
- [ ] sem instrucao interna
- [ ] sem dado sensivel
- [ ] pronto para review
- [ ] pronto para publish

Decisao atual: `bloqueado_para_publicacao_automatica`

## 3. Reenviar um e-mail ao consumidor

### Identificacao

- Titulo original: `Reenviar um e-mail ao consumidor`
- Article ID local: `78c75ded-77d8-40d9-a894-e5cf3fcab0c4`
- Source path: `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-reenviar-um-e-mail-ao-consumidor`
- Source hash: `b2d6f54bf368cbf3e823a55e461d463ba61fb8b5482fd22d5756a5406ee13d43`
- Status atual: `draft`
- Visibility atual: `internal`
- Categoria importada: `Configuracao de ambiente`
- Advisory status: `pending`
- Assets vinculados: `1`

### Diagnostico editorial

O artigo ensina a reenviar um e-mail pela aba de comunicacao de uma solicitacao. E um candidato simples para conteudo publico, desde que a nomenclatura e o fluxo estejam corretos no produto atual.

Riscos:

- titulo usa `consumidor`, termo que precisa ser revisado para a linguagem Genius;
- depende de asset visual;
- pode haver divergencia entre a aba `Comunicacao` do legado e a interface atual;
- precisa evitar instrucoes internas sobre reprocessamento ou falhas tecnicas.

### Sugestao de versao publica

- Titulo publico sugerido: `Reenviar uma comunicacao ao cliente`
- Resumo publico sugerido: `Saiba como reenviar uma mensagem relacionada a uma solicitacao quando o cliente precisar receber a comunicacao novamente.`
- Categoria publica sugerida: `Comunicacao com cliente`

Estrutura recomendada:

- Quando reenviar uma comunicacao.
- Onde localizar a comunicacao na solicitacao.
- Como reenviar a mensagem.
- Como confirmar o envio.
- O que revisar se o cliente nao recebeu.

Remover ou revisar:

- termo `consumidor`;
- qualquer tela, botao ou aba que tenha mudado;
- detalhes de infraestrutura de e-mail ou troubleshooting interno.

Pode permanecer:

- conceito de reenviar comunicacao;
- caminho operacional basico;
- cuidado para revisar destinatario/contexto antes do reenvio.

Assets que precisam revisao:

- `assets\octa-static-tenants\o205658-f7a\knowledgebase\2025-02-21\p9gpoq87yfp7ilg8ejdem.com`

### Checklist humano

- [ ] titulo revisado
- [ ] resumo revisado
- [ ] corpo revisado
- [ ] categoria revisada
- [ ] assets revisados
- [ ] links revisados
- [ ] sem credenciais, tokens ou logs
- [ ] sem instrucao interna
- [ ] sem dado sensivel
- [ ] pronto para review
- [ ] pronto para publish

Decisao atual: `bloqueado_para_publicacao_automatica`

## 4. Regra por motivo

### Identificacao

- Titulo original: `Regra por motivo`
- Article ID local: `69b6ac6d-0fd4-451a-8374-5e6802c05f39`
- Source path: `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-regra-por-motivo`
- Source hash: `fb3075312afaaa4cbb9ed019a683681c0c0902026f08a46283cb74906cc17aeb`
- Status atual: `draft`
- Visibility atual: `internal`
- Categoria importada: `Configuracao de ambiente`
- Advisory status: `pending`
- Assets vinculados: `1`

### Diagnostico editorial

O artigo descreve como habilitar uma regra para um motivo especifico. Este e o item mais sensivel do lote piloto, porque pode misturar configuracao operacional, governanca de regras e comportamento que talvez nao deva ser publico.

Riscos:

- pode revelar uma configuracao administrativa sensivel;
- pode ser mais adequado para Knowledge interna do que para Central Publica;
- depende de asset visual;
- o titulo e amplo demais para leitor publico;
- precisa validar se o recurso e visivel, permitido e util para cliente B2B.

### Sugestao de versao publica

- Titulo publico sugerido: `Entender regras por motivo na operacao`
- Resumo publico sugerido: `Conheca o papel das regras por motivo e quando elas podem ser usadas para orientar tratativas operacionais.`
- Categoria publica sugerida: `Regras de operacao`

Estrutura recomendada:

- O que e uma regra por motivo.
- Quando esse tipo de regra e usado.
- Quais cuidados tomar antes de alterar uma regra.
- Quando acionar suporte ou administracao.
- Limites do que pode ser feito pelo cliente.

Remover ou revisar:

- passo a passo administrativo se a funcionalidade for interna;
- nomes de configuracao sensiveis;
- qualquer regra de negocio que exponha politica operacional restrita.

Pode permanecer:

- explicacao conceitual de regra por motivo;
- contexto de quando a regra afeta a operacao;
- orientacao para procurar suporte se nao houver permissao.

Assets que precisam revisao:

- `assets\octa-static-tenants\o205658-f7a\knowledgebase\2025-03-19\cbjxtrg9zmg9kofdi-oxz.com`

### Checklist humano

- [ ] titulo revisado
- [ ] resumo revisado
- [ ] corpo revisado
- [ ] categoria revisada
- [ ] assets revisados
- [ ] links revisados
- [ ] sem credenciais, tokens ou logs
- [ ] sem instrucao interna
- [ ] sem dado sensivel
- [ ] pronto para review
- [ ] pronto para publish

Decisao atual: `bloqueado_para_publicacao_automatica`

## Resultado esperado da revisao humana

Antes de qualquer publicacao, o time humano deve registrar para cada artigo:

- titulo final aprovado;
- resumo final aprovado;
- corpo revisado;
- categoria publica ou decisao de manter interno;
- resultado da revisao de assets;
- decisao editorial final: `publicar`, `manter interno`, `reescrever` ou `arquivar`;
- evidencia de checklist completo no Admin Knowledge.

Sem essa evidencia, os artigos permanecem como `draft/internal` e fora da Central Publica.
