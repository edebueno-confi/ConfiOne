# Roadmap Agentico

Este roadmap orienta um agente de IA a iniciar, continuar e concluir ciclos de desenvolvimento com autonomia alta.

## Regra de execucao

O agente deve trabalhar em ciclos pequenos. Cada ciclo precisa terminar com:

- codigo ou documento entregue;
- validacao executada;
- status Git reportado;
- documentacao atualizada;
- proximo ciclo identificado.

O agente nao deve pedir permissao para tarefas locais seguras. Deve pedir decisao humana apenas nas condicoes de parada.

## Estados de ciclo

- `pendente`: ainda nao iniciado.
- `em_execucao`: ciclo atual.
- `bloqueado`: depende de decisao humana ou recurso externo.
- `concluido`: implementado, validado e documentado.

## Ciclo 0: fundacao do novo projeto

Status: `pendente`

Objetivo:

Criar a base do novo projeto com stack limpa e documentacao inicial.

Tarefas:

1. Criar repositorio/projeto novo.
2. Copiar esta pasta como `docs/initial-briefing/`.
3. Criar `README.md` do novo projeto.
4. Criar `AGENTS.md` com regras de autonomia e parada.
5. Configurar app React/Vite ou equivalente.
6. Configurar Supabase local.
7. Configurar scripts: lint, typecheck, test, build.
8. Criar primeira migration de identidade/tenancy/audit.
9. Criar testes de RLS basicos.
10. Registrar `docs/PROJECT_STATE.md`.

Aceite:

- projeto instala;
- typecheck passa;
- build passa;
- banco local reseta;
- testes de RLS basicos passam;
- docs iniciais existem.

## Ciclo 1: identidade, tenants e acesso

Status: `pendente`

Objetivo:

Implementar login, contexto de usuario, clientes B2B e permissao minima.

Tarefas:

1. Criar tabelas ou adaptar base para `profiles`, `tenants`, `tenant_memberships`, `tenant_contacts`.
2. Ativar RLS.
3. Criar audit log.
4. Criar read model de contexto pos-login.
5. Criar tela de login.
6. Criar tela de acesso negado.
7. Criar redirect por papel.
8. Criar fixture local com admin, suporte e cliente.
9. Criar testes cross-tenant.

Aceite:

- admin entra no Admin minimo;
- suporte entra na fila vazia;
- cliente entra no Portal vazio;
- usuario sem permissao cai em acesso negado;
- cliente A nao ve tenant B.

## Ciclo 2: Knowledge/Public Help

Status: `pendente`

Objetivo:

Entregar central de ajuda publica simples com corpus OctaDesk curado.

Tarefas:

1. Criar modelo de Knowledge.
2. Criar import local do corpus OctaDesk ou fixture equivalente.
3. Criar views publicas.
4. Criar RPC de busca textual.
5. Criar Admin minimo de artigo ou seed editorial controlado.
6. Criar rotas publicas.
7. Criar estados vazio/erro.
8. Criar testes para draft/internal/restricted nao aparecerem.
9. Validar UI em desktop e mobile.

Aceite:

- `/help` abre;
- `/help/:spaceSlug` lista categorias/artigos;
- busca retorna artigo publicado;
- draft nao aparece;
- artigo inexistente mostra estado seguro.

## Ciclo 3: Portal cliente minimo

Status: `pendente`

Objetivo:

Cliente logado abre e acompanha demandas.

Tarefas:

1. Criar tabelas de ticket core.
2. Criar views customer-facing.
3. Criar RPC de criar ticket.
4. Criar RPC de mensagem do cliente.
5. Criar rotas `/portal`, `/portal/tickets`, `/portal/tickets/:ticketId`.
6. Criar formulario de nova demanda.
7. Criar timeline customer-facing.
8. Criar teste anti-leak de nota interna.
9. Criar QA browser do fluxo.

Aceite:

- cliente cria ticket;
- cliente ve ticket;
- suporte consegue ver ticket no banco/read model;
- cliente responde;
- cross-tenant bloqueado.

## Ciclo 4: suporte operacional

Status: `pendente`

Objetivo:

Suporte recebe, responde, classifica e encerra demandas.

Tarefas:

1. Criar views de fila e detalhe do suporte.
2. Criar RPC de resposta publica.
3. Criar RPC de nota interna.
4. Criar RPC de status.
5. Criar RPC de atribuicao.
6. Criar tela de fila.
7. Criar detalhe do ticket.
8. Criar composer resposta/nota.
9. Criar contexto basico do cliente.
10. Criar testes de status e visibilidade.

Aceite:

- suporte responde cliente;
- cliente ve resposta;
- nota interna nao aparece;
- status invalido falha;
- ticket encerrado fica bloqueado conforme regra.

## Ciclo 5: evidencias

Status: `pendente`

Objetivo:

Adicionar upload/download seguro de evidencias.

Tarefas:

1. Criar bucket privado.
2. Criar metadata de anexo.
3. Criar intent de upload cliente.
4. Criar intent de upload suporte.
5. Criar download temporario.
6. Mostrar evidencias no Portal.
7. Mostrar evidencias no Support.
8. Criar testes de path leak e cross-tenant.

Aceite:

- cliente envia PDF/PNG/JPG/WebP permitido;
- suporte ve metadata;
- path nao aparece;
- cliente nao acessa evidencia de outro tenant.

## Ciclo 6: acionamentos internos

Status: `pendente`

Objetivo:

Suporte aciona areas internas e recebe retorno.

Tarefas:

1. Criar catalogo de areas.
2. Criar memberships por area.
3. Criar `internal_actions`.
4. Criar timeline/update de acionamento.
5. Criar RPC de criar acionamento.
6. Criar workspace de area.
7. Criar retorno ao suporte.
8. Integrar painel no ticket.
9. Criar testes de area isolation.

Aceite:

- suporte cria acionamento;
- area ve na fila;
- area devolve resposta;
- suporte ve retorno;
- cliente nao ve nada interno.

## Ciclo 7: Admin minimo

Status: `pendente`

Objetivo:

Operar clientes, usuarios, areas e artigos sem acesso manual ao banco.

Tarefas:

1. Tela de clientes.
2. Tela de usuarios/memberships.
3. Tela de areas internas.
4. Tela de artigos.
5. Tela de logs sanitizados.
6. RPCs administrativas minimas.
7. Testes de permissao.

Aceite:

- admin cria cliente;
- admin adiciona usuario;
- admin vincula area;
- admin publica artigo;
- logs nao vazam payload bruto.

## Ciclo 8: piloto local controlado

Status: `pendente`

Objetivo:

Validar o MVP ponta a ponta com usuarios QA.

Tarefas:

1. Criar fixture funcional.
2. Criar matriz de regressao.
3. Criar runbook de smoke.
4. Executar fluxo cliente -> suporte -> area -> suporte -> cliente.
5. Validar responsividade.
6. Validar anti-leak.
7. Corrigir falhas.
8. Registrar relatorio.

Aceite:

- fluxo completo aprovado;
- gates tecnicos verdes;
- nenhum leak customer-facing;
- docs atualizadas.

## Ciclos futuros

### Ciclo 9: Gmail foundation

Bloqueado ate autorizacao de OAuth/secrets e MVP validado.

### Ciclo 10: CS portfolio simples

Bloqueado ate haver historico confiavel de tickets e clientes.

### Ciclo 11: financeiro operacional

Bloqueado ate politica de dados sensiveis.

### Ciclo 12: demanda produto/desenvolvimento

Bloqueado ate definir entidade intermediaria.

### Ciclo 13: IA assistiva

Bloqueado ate governanca, fontes citaveis, provider, custo e revisao humana.

## Como continuar automaticamente

Ao concluir um ciclo:

1. Marcar ciclo como `concluido`.
2. Registrar evidencias.
3. Atualizar `PROJECT_STATE.md`.
4. Atualizar backlog.
5. Abrir o proximo ciclo `pendente`.
6. Executar o primeiro lote seguro desse ciclo.

Se o ciclo seguinte exigir condicao de parada humana, marcar como `bloqueado` e pular para proxima tarefa local segura de documentacao, teste ou refino.
