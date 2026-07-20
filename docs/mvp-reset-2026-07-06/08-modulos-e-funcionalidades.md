# Modulos e Funcionalidades

Este documento detalha os modulos do novo MVP para que um agente consiga implementar sem depender de interpretacao solta do projeto antigo.

## Mapa de modulos

| Modulo | Prioridade | Objetivo |
| --- | --- | --- |
| Identidade e acesso | P0 | permitir login, roles e isolamento por cliente |
| Clientes B2B | P0 | cadastrar e governar contas cliente |
| Knowledge/Public Help | P0 | publicar central de ajuda simples e segura |
| Portal cliente | P0 | cliente abre e acompanha demandas |
| Ticketing suporte | P0 | suporte recebe, responde e organiza demandas |
| Acionamentos internos | P1 | suporte pede ajuda para areas internas |
| Admin minimo | P1 | operar usuarios, clientes, areas e artigos |
| Evidencias/anexos | P1 | anexos seguros em demandas |
| Auditoria e historico | P0 | rastrear eventos relevantes |
| Gmail futuro | P2 | origem e resposta por e-mail, sem simular no MVP |
| CS futuro | P2 | carteira e acompanhamento de clientes |
| Financeiro futuro | P3 | solicitacoes e pendencias financeiras controladas |
| Produto/Desenvolvimento futuro | P3 | demandas qualificadas antes de backlog |
| IA futura | P4 | assistente com citacao e revisao humana |

## Modulo 1: Identidade e acesso

### Objetivo

Garantir que cada usuario acesse apenas o workspace, cliente e dados permitidos.

### Perfis minimos

- `platform_admin`: administra configuracoes globais no ambiente.
- `support_agent`: trata tickets dos tenants autorizados.
- `support_manager`: trata tickets e pode redistribuir atendimento.
- `internal_area_member`: opera acionamentos da propria area.
- `internal_area_manager`: gerencia acionamentos da area.
- `customer_user`: abre e acompanha as proprias demandas.
- `customer_manager`: acompanha demandas do tenant.

### Funcionalidades

- Login.
- Logout.
- Redirect pos-login por papel.
- Tela de acesso negado.
- Membership por tenant.
- Membership por area interna.
- Bloqueio cross-tenant.
- Contexto ativo do usuario.

### Contratos esperados

Views:

- `vw_auth_landing_context`
- `vw_user_tenant_memberships`
- `vw_user_internal_area_memberships`

RPCs:

- `rpc_admin_add_membership`
- `rpc_admin_update_membership`
- `rpc_admin_archive_membership`

### Aceite

- Usuario sem workspace autorizado cai em acesso negado.
- Cliente A nao ve cliente B.
- Area interna sem membership nao ve fila.
- Admin nao altera permissao sem audit log.

## Modulo 2: Clientes B2B

### Objetivo

Representar as marcas/lojas clientes da Genius como tenants operacionais.

### Funcionalidades

- Listar clientes.
- Criar cliente.
- Editar status operacional.
- Registrar contatos.
- Vincular usuarios customer-facing.
- Vincular usuarios internos autorizados.
- Mostrar contexto basico no suporte.

### Dados minimos

- nome do cliente;
- slug/codigo interno;
- status;
- contato principal;
- e-mail de contato;
- observacao operacional;
- data de criacao;
- data de ultima atualizacao.

### Nao incluir no MVP

- grupo economico;
- produto/plano comercial;
- billing;
- health score;
- owner comercial complexo.

### Aceite

- cliente criado fica disponivel para tickets;
- cliente arquivado nao aceita nova demanda;
- mudancas de cliente geram audit log;
- suporte ve contexto somente por read model.

## Modulo 3: Knowledge/Public Help

### Objetivo

Transformar o conteudo extraido da OctaDesk em central de ajuda publica simples, aprovada e segura.

### Funcionalidades publicas

- Home da central.
- Categorias.
- Lista de artigos.
- Detalhe de artigo.
- Busca textual.
- Estado vazio.
- Estado de artigo inexistente.

### Funcionalidades administrativas

- Importar artigo como rascunho.
- Criar artigo manual.
- Editar titulo, resumo, corpo e categoria.
- Enviar para revisao.
- Publicar.
- Arquivar.
- Ver origem OctaDesk.

### Dados minimos de artigo

- titulo;
- slug;
- resumo;
- corpo Markdown;
- categoria;
- status: `draft`, `review`, `published`, `archived`;
- visibilidade: `public`, `internal`, `restricted`;
- origem;
- source hash;
- autor/editor;
- datas.

### Regras

- Public Help mostra apenas `published + public`.
- HTML bruto OctaDesk nao vira corpo final.
- Conteudo sensivel fica `restricted` ou bloqueado.
- Asset de artigo precisa ser governado.

### Aceite

- artigo draft nao aparece publicamente;
- busca publica nao retorna interno;
- artigo publicado aparece por slug;
- artigo arquivado sai da central.

## Modulo 4: Portal cliente

### Objetivo

Dar visibilidade ao cliente B2B sobre demandas abertas com a Genius.

### Funcionalidades

- Home do portal.
- Lista de demandas.
- Criar demanda.
- Detalhe da demanda.
- Responder demanda.
- Anexar evidencia.
- Ver status customer-facing.
- Ver artigos relacionados autorizados.

### Campos de criacao de demanda

- titulo;
- descricao;
- categoria opcional;
- impacto opcional;
- evidencia opcional.

### Timeline customer-facing

Pode mostrar:

- mensagens do cliente;
- respostas publicas do suporte;
- eventos seguros: recebido, em analise, resolvido, encerrado;
- anexos visiveis ao cliente.

Nao pode mostrar:

- nota interna;
- acionamento interno;
- engenharia interna;
- audit bruto;
- payload tecnico;
- storage path.

### Aceite

- cliente abre demanda e ve na lista;
- suporte ve na fila;
- cliente responde;
- suporte recebe resposta;
- cliente nao ve conteudo interno.

## Modulo 5: Ticketing suporte

### Objetivo

Ser a bancada principal do suporte.

### Funcionalidades

- Fila de tickets.
- Filtros por status, cliente, prioridade e responsavel.
- Criar ticket manual.
- Abrir detalhe.
- Responder cliente.
- Salvar nota interna.
- Alterar status.
- Atribuir responsavel.
- Classificar categoria/prioridade.
- Ver contexto do cliente.
- Ver evidencias.
- Vincular artigo.
- Criar acionamento interno.
- Encerrar e reabrir.

### Estados internos sugeridos

- `new`
- `triage`
- `waiting_support`
- `waiting_customer`
- `waiting_internal_area`
- `resolved`
- `closed`
- `cancelled`

### Aceite

- toda escrita passa por RPC;
- status invalido falha no backend;
- resposta publica aparece no Portal;
- nota interna nao aparece no Portal;
- filtros nao fabricam contadores.

## Modulo 6: Acionamentos internos

### Objetivo

Permitir que suporte solicite apoio de areas internas sem perder dono, historico ou contexto.

### Areas iniciais

- Financeiro.
- Desenvolvimento.
- Produto.
- Integracoes.
- Customer Success.
- Operacoes.
- Outra area.

### Funcionalidades suporte

- Criar acionamento.
- Escolher area.
- Escrever pergunta/resumo.
- Acompanhar status.
- Ver retorno.
- Pedir complemento.
- Fechar acionamento.

### Funcionalidades area interna

- Ver fila da area.
- Assumir acionamento.
- Comentar.
- Atualizar status.
- Devolver resposta ao suporte.

### Regras

- area nao responde cliente;
- acionamento pertence ao ticket;
- suporte continua dono;
- cliente nao ve acionamento;
- status do ticket nao muda automaticamente.

### Aceite

- membro da area ve apenas sua fila;
- retorno aparece para suporte;
- cliente nao ve retorno interno;
- audit log registra criacao e retorno.

## Modulo 7: Admin minimo

### Objetivo

Permitir operacao basica sem mexer direto no banco.

### Funcionalidades

- Gerir clientes.
- Gerir usuarios/memberships.
- Gerir areas internas.
- Gerir artigos.
- Ver logs sanitizados.

### Nao incluir

- dashboard amplo;
- catalogo comercial;
- subscriptions;
- billing;
- health score;
- AI readiness.

### Aceite

- mutacoes administrativas auditadas;
- usuario comum bloqueado;
- logs nao expoem payload sensivel.

## Modulo 8: Evidencias/anexos

### Objetivo

Permitir envio de arquivos relevantes com controle de acesso.

### Funcionalidades

- Upload de evidencia pelo cliente.
- Upload de evidencia pelo suporte.
- Listagem de evidencias no ticket.
- Download temporario autorizado.

### Regras

- bucket privado;
- path nunca aparece na UI;
- URL temporaria curta;
- limite de tipo e tamanho;
- anexo sempre vinculado a ticket e tenant.

### Aceite

- cliente nao baixa evidencia de outro tenant;
- suporte autorizado baixa evidencia;
- arquivo invalido e bloqueado;
- metadata exibida e sanitizada.

## Modulos futuros

### Gmail

Funcionalidades futuras:

- conectar conta autorizada;
- importar thread como ticket ou mensagem;
- responder e-mail a partir do ticket;
- registrar delivery;
- manter revisao humana antes de envio.

Bloqueado ate:

- ticketing suporte estar estavel;
- modelo de delivery existir;
- secrets e OAuth aprovados.

### CS

Funcionalidades futuras:

- carteira de clientes;
- resumo de tickets;
- follow-ups;
- plano de acao;
- risco manual;
- reunioes.

Bloqueado ate:

- tickets e clientes terem historico confiavel.

### Financeiro

Funcionalidades futuras:

- fila de solicitacoes financeiras;
- pendencias financeiras mascaradas;
- retorno ao suporte;
- status operacional financeiro.

Bloqueado ate:

- decisao sobre dados sensiveis e permissoes.

### Produto/Desenvolvimento

Funcionalidades futuras:

- intake de bug/melhoria a partir do ticket;
- qualificacao por produto;
- decisao humana;
- encaminhamento para backlog externo ou interno.

Bloqueado ate:

- existir entidade intermediaria de demanda qualificada.

### IA

Funcionalidades futuras:

- resumir ticket;
- sugerir resposta;
- sugerir artigo;
- sugerir categoria;
- apontar lacuna documental.

Bloqueado ate:

- fontes citaveis;
- logs de uso;
- revisao humana;
- custo e provider aprovados.
