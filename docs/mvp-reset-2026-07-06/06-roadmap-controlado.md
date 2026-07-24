# Roadmap Controlado

## Principio

Cada fase deve produzir um sistema executavel e validavel. Nenhuma fase deve criar tela fake esperando backend futuro.

## Fase 0: novo projeto e contratos minimos

Objetivo:

- criar o novo projeto com stack limpa;
- configurar auth/local env;
- definir entidades minimas;
- criar testes de baseline.

Entregaveis:

- README do novo projeto;
- AGENTS.md do novo projeto;
- schema inicial de identidade, tenants e audit;
- scripts de typecheck/build/test;
- seed local minimo.

Validacao:

- typecheck;
- build;
- teste de banco de tenancy/RLS;
- documentacao atualizada.

## Fase 1: Central de ajuda publica

Objetivo:

- entregar a central publica simples a partir do corpus OctaDesk curado.

Entregaveis:

- importador local ou fixture de artigos;
- categorias;
- artigos;
- busca textual;
- rotas publicas;
- workflow de publicacao manual.

Validacao:

- artigo publicado aparece;
- artigo draft/internal/restricted nao aparece;
- busca retorna apenas publico;
- build e QA visual basico.

## Fase 2: Portal cliente minimo

Objetivo:

- permitir que cliente logado veja e abra demandas.

Entregaveis:

- login;
- contexto tenant;
- lista de demandas;
- detalhe de demanda;
- criacao de demanda;
- resposta do cliente;
- evidencia simples.

Validacao:

- cliente A nao ve cliente B;
- cliente sem acesso e bloqueado;
- suporte ve demanda criada;
- cliente nao ve nota interna.

## Fase 3: Suporte operacional

Objetivo:

- permitir que suporte receba e trate demandas.

Entregaveis:

- fila de suporte;
- detalhe do ticket;
- resposta publica;
- nota interna;
- status;
- atribuicao;
- categoria simples;
- criacao manual.

Validacao:

- toda escrita por RPC;
- status invalido bloqueado no backend;
- resposta aparece no Portal;
- nota interna nao aparece no Portal.

## Fase 4: Acionamentos internos

Objetivo:

- permitir que suporte solicite ajuda de areas internas sem perder historico.

Entregaveis:

- catalogo de areas;
- membership de area;
- criar acionamento a partir do ticket;
- fila da area;
- comentario/status/retorno;
- suporte aceita retorno ou pede complemento.

Validacao:

- area so ve acionamentos autorizados;
- cliente nao ve acionamento;
- acionamento nao fecha ticket;
- audit/eventos registrados.

## Fase 5: Admin minimo

Objetivo:

- operar o sistema sem depender de seed manual.

Entregaveis:

- clientes B2B;
- usuarios/memberships;
- areas internas;
- artigos;
- logs sanitizados.

Validacao:

- admin sem bypass silencioso;
- mutacoes auditadas;
- usuario comum bloqueado;
- docs atualizadas.

## Fase 6: piloto controlado

Objetivo:

- usar com massa real controlada ou staging autorizado.

Entregaveis:

- checklist de piloto;
- matriz de regressao;
- plano de rollback;
- smoke por papel;
- runbook de operacao.

Validacao:

- gates tecnicos verdes;
- QA browser dos fluxos principais;
- nenhum secret exposto;
- autorizacao explicita para qualquer ambiente externo.

## Fases futuras, apos MVP validado

### Gmail

Adicionar ingestao e resposta por Gmail apenas depois que tickets e Portal estiverem estaveis.

Primeiro corte:

- conectar conta autorizada;
- importar e-mail como origem;
- vincular thread a ticket;
- nao enviar e-mail automaticamente sem revisao.

### CS

Adicionar carteira CSM depois que cliente, tickets e historico estiverem consistentes.

Primeiro corte:

- carteira read-only;
- sinais simples derivados;
- follow-up manual;
- sem health score inventado.

### Financeiro

Adicionar contexto financeiro apenas com decisao clara de dados sensiveis.

Primeiro corte:

- pendencias operacionais mascaradas;
- solicitacao de informacao ao financeiro;
- sem billing completo.

### Produto/Desenvolvimento

Adicionar demanda de produto como entidade intermediaria.

Primeiro corte:

- suporte qualifica pedido;
- produto revisa;
- engenharia recebe apenas demanda aprovada;
- ticket nao vira backlog direto.

### IA

Adicionar IA apenas como assistente.

Primeiro corte:

- resumir ticket;
- sugerir resposta;
- sugerir artigo;
- sempre com citacao e revisao humana.

IA continua proibida de enviar mensagem, publicar artigo, alterar status, permissao ou entitlement.
