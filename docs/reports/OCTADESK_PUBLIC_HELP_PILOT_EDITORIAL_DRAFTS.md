# OCTADESK_PUBLIC_HELP_PILOT_EDITORIAL_DRAFTS.md

## Objetivo

Preparar versoes editoriais sugeridas para os 4 drafts piloto Octadesk importados na Central de Ajuda Genius.

Este documento nao autoriza publicacao. As versoes abaixo sao propostas de curadoria para revisao humana no Admin Knowledge. Nenhum artigo deve mudar para `published` ou `public` sem checklist humano completo, advisory revisado e QA publico aprovado.

## Estado em 2026-05-20

- Escopo: apenas os 4 artigos da allowlist piloto.
- Fonte usada para diagnostico: `article.json`, `content.txt`, assets vinculados e registros locais em Knowledge.
- Fonte final sugerida: markdown editorial novo, sem HTML legado.
- Aplicacao local: os 4 drafts foram atualizados no Admin Knowledge via RPC existente `rpc_admin_update_knowledge_article_draft_v2`, mantendo `status = draft`, `visibility = internal` e advisories `pending`.
- Assets: mantidos como pendencia de revisao visual humana; nenhum asset foi aprovado para publicacao por este documento.
- Decisao comum: `aguardando_revisao_humana`.

## Checklist humano comum

- [ ] titulo revisado
- [ ] resumo revisado
- [ ] corpo revisado
- [ ] categoria revisada
- [ ] assets revisados
- [ ] links revisados
- [ ] sem credenciais/tokens/logs
- [ ] sem instrucao interna
- [ ] sem dado sensivel
- [ ] pronto para review
- [ ] pronto para publish

## 1. Como alterar ou aprovar os produtos de uma solicitacao?

### Identificacao

- Titulo original: `Como alterar ou aprovar os produtos de uma solicitacao?`
- Titulo publico sugerido: `Alterar ou aprovar produtos em uma solicitacao`
- Categoria publica sugerida: `Configuracao de ambiente`
- Article ID local: `51ed010e-ec55-4078-851c-94fbaa337adf`
- Source path: `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-como-alterar-ou-aprovar-os-produtos-de-uma-solicitacao`
- Source hash: `59b0619bf620261477c2491feaf6d274f68f95ea0ac7a1faf686704fba1a364a`
- Status atual: `draft`
- Visibility atual: `internal`
- Advisory status: `pending`
- Assets vinculados: `1`

### Diagnostico

O artigo ensina como revisar produtos dentro de uma solicitacao antes de seguir com a tratativa. O conteudo pode ser util para cliente B2B depois de reescrita, mas a versao original mistura linguagem de e-commerce, referencias a UI legada e contatos operacionais que nao devem ir para a central publica.

Remover ou reescrever:

- referencias diretas a contato pessoal, WhatsApp ou e-mails legados;
- tom de atendimento B2C centrado em `consumidor`;
- nomes de botoes que precisam ser validados contra a UI atual;
- qualquer detalhe que pareca playbook interno.

Assets que precisam revisao:

- `assets/octa-static-tenants/o205658-f7a/knowledgebase/2025-02-21/ymsbliqg4nxdcilm_qdwi.com`

Risco principal: publicar instrucao operacional com tela ou nomenclatura antiga.

Decisao recomendada: manter no piloto apenas como draft revisavel.

### Versao editorial sugerida

Resumo sugerido: `Oriente a revisao de produtos antes de seguir com a tratativa da solicitacao, mantendo consistencia entre o pedido original e a decisao operacional.`

```md
# Alterar ou aprovar produtos em uma solicitacao

Use este procedimento quando uma solicitacao exigir validacao dos produtos antes de avancar para a proxima etapa operacional. A disponibilidade das acoes pode variar conforme as permissoes e a configuracao da loja.

## Antes de comecar

- Confirme se a solicitacao esta correta.
- Verifique se os produtos exibidos correspondem ao pedido do cliente.
- Revise se ha pendencias antes de aprovar alteracoes.

## Como revisar

1. Acesse a area de solicitacoes.
2. Abra a solicitacao que precisa de analise.
3. Localize a area de acoes pendentes ou etapa equivalente configurada na sua operacao.
4. Se for necessario corrigir algum item, use a acao de alteracao de produto.
5. Se tudo estiver correto, aprove os produtos para continuar a tratativa.

## Cuidados

- Nao aprove itens sem revisar o contexto da solicitacao.
- Se a acao nao aparecer, valide permissoes, etapa da solicitacao e configuracao da loja.
- Em caso de duvida, acione o canal oficial de suporte definido para sua operacao.
```

### Checklist humano

- [ ] titulo revisado
- [ ] resumo revisado
- [ ] corpo revisado
- [ ] categoria revisada
- [ ] assets revisados
- [ ] links revisados
- [ ] sem credenciais/tokens/logs
- [ ] sem instrucao interna
- [ ] sem dado sensivel
- [ ] pronto para review
- [ ] pronto para publish

Decisao atual: `aguardando_revisao_humana`.

## 2. Posso enviar uma notificacao de analise ao cliente?

### Identificacao

- Titulo original: `Posso enviar uma notificacao de analise ao cliente?`
- Titulo publico sugerido: `Enviar uma notificacao de analise ao cliente`
- Categoria publica sugerida: `Configuracao de ambiente`
- Article ID local: `5801edde-258d-41cb-9ed1-70047e32830d`
- Source path: `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-posso-enviar-uma-notificacao-de-analise-ao-cliente`
- Source hash: `7161e4ec3c080f510fbf31b30d0425ac69d5544b19bf5fdb6d0eb89a89dc9619`
- Status atual: `draft`
- Visibility atual: `internal`
- Advisory status: `pending`
- Assets vinculados: `2`

### Diagnostico

O artigo explica o envio de notificacao ao cliente quando uma solicitacao esta em analise. A ideia e publicavel se a mensagem for tratada como orientacao de comunicacao externa, mas a versao original depende de prints e precisa deixar claro que anexos e comentarios devem ser revisados antes de envio.

Remover ou reescrever:

- referencias a telas legadas nao confirmadas;
- linguagem que incentive anexar evidencias sem governanca;
- instrucao operacional que dependa de permissao interna.

Assets que precisam revisao:

- `assets/octa-static-tenants/o205658-f7a/knowledgebase/2025-02-24/a-ign2x9iklmcesech1qw.com`
- `assets/octa-static-tenants/o205658-f7a/knowledgebase/2025-02-24/ndbfosldibx8bxd2krdql.com`

Risco principal: orientar envio de evidencias ou imagens sem revisao de privacidade.

Decisao recomendada: manter no piloto como draft revisavel, com alerta para assets e anexos.

### Versao editorial sugerida

Resumo sugerido: `Explique ao cliente que a solicitacao esta em analise e inclua contexto suficiente para reduzir duvidas durante a tratativa.`

```md
# Enviar uma notificacao de analise ao cliente

A notificacao de analise ajuda a manter o cliente informado quando a solicitacao precisa de validacao antes de avancar. Use esse recurso apenas quando a comunicacao fizer sentido para a etapa atual da tratativa.

## Quando usar

- Quando um item precisa ser analisado antes da decisao.
- Quando a loja precisa pedir contexto adicional.
- Quando e importante deixar registrado que a solicitacao esta em avaliacao.

## Como preparar a mensagem

1. Abra a solicitacao que sera analisada.
2. Revise os produtos, motivo e historico da tratativa.
3. Localize a acao de notificacao de analise, quando disponivel na configuracao da loja.
4. Escreva uma mensagem objetiva explicando o que esta em analise.
5. Anexe evidencias somente se elas forem necessarias e estiverem aprovadas para uso externo.
6. Revise o conteudo antes de enviar.

## Cuidados

- Nao inclua dados internos, logs, prints administrativos ou informacoes que o cliente nao deve receber.
- Se a opcao nao estiver disponivel, confirme permissoes e configuracao da loja.
- A mensagem deve ser clara, curta e alinhada ao tom de atendimento da operacao.
```

### Checklist humano

- [ ] titulo revisado
- [ ] resumo revisado
- [ ] corpo revisado
- [ ] categoria revisada
- [ ] assets revisados
- [ ] links revisados
- [ ] sem credenciais/tokens/logs
- [ ] sem instrucao interna
- [ ] sem dado sensivel
- [ ] pronto para review
- [ ] pronto para publish

Decisao atual: `aguardando_revisao_humana`.

## 3. Reenviar um e-mail ao consumidor

### Identificacao

- Titulo original: `Reenviar um e-mail ao consumidor`
- Titulo publico sugerido: `Reenviar uma comunicacao ao cliente`
- Categoria publica sugerida: `Configuracao de ambiente`
- Article ID local: `78c75ded-77d8-40d9-a894-e5cf3fcab0c4`
- Source path: `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-reenviar-um-e-mail-ao-consumidor`
- Source hash: `b2d6f54bf368cbf3e823a55e461d463ba61fb8b5482fd22d5756a5406ee13d43`
- Status atual: `draft`
- Visibility atual: `internal`
- Advisory status: `pending`
- Assets vinculados: `1`

### Diagnostico

O artigo ensina a reenviar uma comunicacao ao cliente a partir do historico da solicitacao. E um bom candidato a conteudo publico depois de reescrita, desde que nao prometa canais especificos nem exponha detalhes internos da ferramenta.

Remover ou reescrever:

- uso de `consumidor` como linguagem final;
- referencia a fluxo de `Comunicacao > Reenviar` sem validacao na UI atual;
- qualquer assumptao de que o reenvio garante entrega no canal do cliente.

Assets que precisam revisao:

- `assets/octa-static-tenants/o205658-f7a/knowledgebase/2025-02-21/p9gpoq87yfp7ilg8ejdem.com`

Risco principal: promessa implicita de entrega de e-mail sem cobrir filtros, canal incorreto ou falha de envio.

Decisao recomendada: manter no piloto como draft revisavel.

### Versao editorial sugerida

Resumo sugerido: `Reenvie uma comunicacao relacionada a solicitacao quando o cliente precisar receber novamente uma mensagem operacional.`

```md
# Reenviar uma comunicacao ao cliente

Use o reenvio quando uma mensagem relacionada a solicitacao precisa ser enviada novamente ao cliente. Antes de reenviar, confirme se a comunicacao ainda esta correta e se o destinatario deve recebe-la.

## Antes de reenviar

- Confirme que a solicitacao e a correta.
- Verifique qual comunicacao sera reenviada.
- Revise se a mensagem ainda esta atualizada.
- Confirme que nao ha dados internos no conteudo.

## Como reenviar

1. Acesse a area de solicitacoes.
2. Abra a solicitacao desejada.
3. Va ate a area de comunicacao ou historico de mensagens.
4. Localize a mensagem que precisa ser reenviada.
5. Use a acao de reenvio, quando disponivel.
6. Confirme se o envio foi registrado.

## Se o cliente nao receber

- Verifique se o e-mail ou canal de contato esta correto.
- Confirme se a mensagem nao foi bloqueada por regra da caixa de entrada do cliente.
- Acione o suporte se o reenvio nao ficar registrado ou se houver falha recorrente.
```

### Checklist humano

- [ ] titulo revisado
- [ ] resumo revisado
- [ ] corpo revisado
- [ ] categoria revisada
- [ ] assets revisados
- [ ] links revisados
- [ ] sem credenciais/tokens/logs
- [ ] sem instrucao interna
- [ ] sem dado sensivel
- [ ] pronto para review
- [ ] pronto para publish

Decisao atual: `aguardando_revisao_humana`.

## 4. Regra por motivo

### Identificacao

- Titulo original: `Regra por motivo`
- Titulo publico sugerido: `Entender regras por motivo na operacao`
- Categoria publica sugerida: `Configuracao de ambiente`
- Article ID local: `69b6ac6d-0fd4-451a-8374-5e6802c05f39`
- Source path: `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-regra-por-motivo`
- Source hash: `fb3075312afaaa4cbb9ed019a683681c0c0902026f08a46283cb74906cc17aeb`
- Status atual: `draft`
- Visibility atual: `internal`
- Advisory status: `pending`
- Assets vinculados: `1`

### Diagnostico

O artigo original ensina como habilitar uma regra para um motivo especifico. O tema pode ser util, mas e mais sensivel que os demais porque trata configuracao operacional. Antes de tornar publico, e preciso confirmar se a regra e realmente adequada para clientes B2B ou se deve permanecer como material interno de operacao.

Remover ou reescrever:

- instrucao direta para alterar configuracoes sem explicar impacto;
- linguagem que sugira autonomia sem permissao;
- qualquer detalhe de regra que possa afetar politica financeira, logistica, integracao ou permissao.

Assets que precisam revisao:

- `assets/octa-static-tenants/o205658-f7a/knowledgebase/2025-03-19/cbjxtrg9zmg9kofdi-oxz.com`

Risco principal: publicar conteudo de configuracao que deveria ficar restrito a administradores ou operacao interna.

Decisao recomendada: manter como draft interno ate Produto decidir se e conteudo publico ou artigo interno.

### Versao editorial sugerida

Resumo sugerido: `Entenda quando uma regra vinculada a motivo pode orientar a tratativa de uma solicitacao e quais cuidados revisar antes de alterar configuracoes.`

```md
# Entender regras por motivo na operacao

Regras por motivo ajudam a direcionar comportamentos especificos da operacao conforme o motivo selecionado em uma solicitacao. Este conteudo e conceitual e deve ser validado com o responsavel pela configuracao antes de qualquer alteracao.

## Quando esse recurso pode ser util

- Quando motivos diferentes exigem acoes ou validacoes diferentes.
- Quando a loja precisa padronizar a tratativa de determinados casos.
- Quando a operacao precisa reduzir decisoes manuais repetitivas.

## O que revisar antes de alterar

1. Confirme qual motivo sera impactado.
2. Entenda o efeito operacional da regra.
3. Verifique se a mudanca afeta apenas o motivo desejado.
4. Valide a alteracao com o responsavel pela configuracao da loja.
5. Teste o comportamento antes de considerar a regra pronta.

## Cuidados

- Nao altere regras sem entender o impacto na operacao.
- Evite documentar decisoes internas ou excecoes comerciais em conteudo publico.
- Se a regra envolver politica financeira, logistica, integracao ou permissao, mantenha o conteudo como interno ate revisao formal.
```

### Checklist humano

- [ ] titulo revisado
- [ ] resumo revisado
- [ ] corpo revisado
- [ ] categoria revisada
- [ ] assets revisados
- [ ] links revisados
- [ ] sem credenciais/tokens/logs
- [ ] sem instrucao interna
- [ ] sem dado sensivel
- [ ] pronto para review
- [ ] pronto para publish

Decisao atual: `aguardando_revisao_humana`.

## Conclusao

As quatro versoes sao adequadas para iniciar revisao humana no Admin Knowledge, mas nenhuma esta aprovada para publicacao. A revisao humana deve confirmar linguagem final, categoria, assets, links, aderencia ao produto atual e ausencia de conteudo interno antes de qualquer promocao para review ou public.
