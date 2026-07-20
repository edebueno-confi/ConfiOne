# Fluxos Operacionais

## Fluxo 1: consultar central publica

1. Usuario acessa a central publica.
2. Sistema resolve o space publico ativo.
3. Usuario busca por termo ou navega por categoria.
4. Sistema retorna apenas artigos publicados e publicos.
5. Usuario abre artigo.

Aceite:

- artigo interno/restrito/draft nao aparece;
- busca nao usa filtro de seguranca no frontend;
- pagina de artigo tem estado para slug inexistente;
- conteudo renderizado vem de Markdown seguro.

## Fluxo 2: cliente abre demanda

1. Cliente entra no portal.
2. Sistema resolve tenant/contexto autorizado.
3. Cliente abre nova demanda com titulo, descricao, categoria opcional e evidencia opcional.
4. Backend cria ticket em status inicial.
5. Backend registra evento e audit log.
6. Cliente ve a demanda na lista.
7. Suporte ve a demanda na fila.

Aceite:

- cliente sem tenant autorizado nao abre demanda;
- ticket sempre tem `tenant_id`;
- evidencia nao expoe bucket/path;
- suporte recebe a demanda sem refresh manual de dados fabricados.

## Fluxo 3: suporte responde cliente

1. Suporte abre a fila.
2. Suporte seleciona demanda.
3. Suporte consulta contexto do cliente e timeline.
4. Suporte envia resposta publica.
5. Backend registra mensagem, evento e audit log.
6. Portal mostra a resposta ao cliente.

Aceite:

- resposta publica usa RPC;
- cliente nao ve nota interna;
- status de leitura/customer-facing e derivado pelo backend quando existir;
- erro tecnico aparece como mensagem operacional.

## Fluxo 4: suporte registra nota interna

1. Suporte abre demanda.
2. Suporte escolhe modo nota interna.
3. Suporte salva nota.
4. Backend registra mensagem interna e evento interno.
5. Portal cliente nao recebe a nota.

Aceite:

- nota interna nunca aparece em read model customer-facing;
- nota fica disponivel apenas para suporte/admin autorizado;
- audit log preserva ator e ticket.

## Fluxo 5: suporte aciona area interna

1. Suporte identifica que precisa de financeiro, desenvolvimento, produto, integracoes, CS ou outra area.
2. Suporte cria acionamento com area destino, resumo e pergunta objetiva.
3. Backend cria `internal_action` vinculado ao ticket.
4. Area interna ve o acionamento na propria fila.
5. Ticket mostra pendencia interna para o suporte.
6. Cliente nao ve detalhes do acionamento.

Aceite:

- acionamento nao altera automaticamente `ticket.status`;
- area interna nao responde diretamente ao cliente;
- suporte continua dono da comunicacao;
- toda interacao gera timeline interna.

## Fluxo 6: area interna devolve resposta

1. Pessoa da area abre fila interna.
2. Assume o acionamento ou comenta.
3. Registra resposta estruturada.
4. Devolve ao suporte.
5. Suporte aceita retorno, pede complemento ou fecha o acionamento.
6. Suporte responde cliente, se necessario.

Aceite:

- resposta da area nao aparece automaticamente no Portal;
- suporte decide como transformar retorno em resposta customer-facing;
- complemento e fechamento geram historico;
- area nao fecha ticket principal.

## Fluxo 7: suporte encerra demanda

1. Suporte resolve a demanda.
2. Sistema exige motivo ou comentario minimo.
3. Backend altera status para resolvido/encerrado conforme regra.
4. Cliente ve estado de resolucao.
5. Cliente pode responder/reabrir apenas se o contrato permitir.

Aceite:

- frontend nao inventa matriz de status;
- fechamento gera evento;
- ticket encerrado nao aceita resposta indevida;
- reabertura, se existir, passa por RPC.

## Fluxo 8: suporte cria demanda manual

1. Suporte recebe contato por e-mail, WhatsApp ou reuniao.
2. Suporte registra demanda manual no sistema.
3. Sistema marca origem como manual ou canal informado.
4. Cliente passa a acompanhar pelo Portal quando autorizado.

Aceite:

- origem externa nao significa integracao ativa;
- Gmail futuro nao e simulado;
- cliente so ve demanda se pertencer ao tenant autorizado.

## Fluxo 9: administrar artigos

1. Admin cria ou importa rascunho.
2. Revisor ajusta titulo, categoria, corpo e visibilidade.
3. Artigo vai para revisao.
4. Admin publica quando aprovado.
5. Central publica passa a exibir apenas se status e visibilidade permitirem.

Aceite:

- importacao OctaDesk preserva origem;
- conteudo sensivel fica bloqueado;
- HTML bruto nao vira corpo final;
- publicacao gera audit log.
