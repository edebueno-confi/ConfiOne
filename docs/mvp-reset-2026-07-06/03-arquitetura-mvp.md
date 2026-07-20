# Arquitetura MVP

## Decisao principal

Mesmo simplificado, o MVP deve nascer com arquitetura SaaS segura. O reset reduz escopo de produto, nao remove os guardrails tecnicos.

## Stack recomendada

Manter a stack atual como referencia:

- React/Vite para frontend.
- Supabase/Postgres para banco, auth, RLS e RPCs.
- TypeScript para contratos compartilhados.
- pgTAP para testes de banco.
- Playwright ou browser QA para fluxos criticos.

O novo projeto pode reaproveitar partes do codigo atual, mas deve reimplementar em lotes menores, evitando carregar todos os dominios existentes de uma vez.

## Camadas

### Frontend

Responsabilidades:

- renderizar telas;
- consumir views/read models;
- chamar RPCs/commands;
- exibir loading, vazio, erro e indisponivel;
- validar apenas formato basico de input;
- nunca decidir permissao, visibilidade, status valido, SLA ou isolamento.

### Backend/Postgres

Responsabilidades:

- multi-tenancy;
- RLS;
- permissoes;
- status e transicoes;
- audit logs;
- eventos de historico;
- views/read models por superficie;
- RPCs transacionais para escrita.

### Storage

Responsabilidades:

- evidencias de tickets;
- assets de artigos;
- URLs temporarias;
- policies por tenant e contexto.

## Padrao de contrato

Leitura:

```text
Frontend -> view/read model -> dados sanitizados para a tela
```

Escrita:

```text
Frontend -> RPC/command -> validacao -> mutacao -> evento -> audit log
```

## Dominios minimos

### Identidade e tenancy

Entidades minimas:

- usuario;
- cliente B2B;
- membership do usuario no cliente;
- papel interno;
- area interna.

Regras:

- cliente B2B e tenant operacional;
- contato cliente nao e colaborador interno;
- area interna nao e tenant;
- admin nao e bypass sem auditoria.

### Knowledge publica

Entidades minimas:

- space da central;
- categoria;
- artigo;
- versao/revisao;
- asset;
- origem importada.

Regras:

- artigo publico exige status publicado e visibilidade publica;
- HTML OctaDesk nao vira UI;
- conteudo bruto preservado como origem;
- publicacao exige revisao humana.

### Ticket/demanda

Entidades minimas:

- ticket;
- mensagem;
- nota interna;
- evento;
- anexo;
- atribuicao;
- categoria;
- status.

Regras:

- ticket pertence a tenant;
- cliente ve apenas timeline customer-facing;
- suporte ve timeline interna autorizada;
- toda mudanca relevante gera evento.

### Acionamento interno

Entidades minimas:

- acionamento;
- area destino;
- status;
- comentarios internos;
- retorno ao suporte;
- vinculo com ticket.

Regras:

- area interna nao responde cliente;
- suporte continua dono da comunicacao;
- acionamento nao muda automaticamente o status do ticket;
- cliente nao ve acionamento.

## Segurança minima obrigatoria

- RLS ativa em dados operacionais.
- `tenant_id` explicito em ticket, mensagens, evidencias e dados de cliente.
- Views customer-facing sem nota interna, audit bruto, storage path ou engenharia interna.
- RPCs com validacao de ator e escopo.
- Audit log para toda mutacao relevante.
- Soft delete/archive quando houver historico operacional.
- Nenhum secret no frontend.

## Simplificacao versus projeto atual

Manter:

- padrao views/RPCs;
- tenant isolation;
- audit;
- knowledge governance;
- portal e support como dominios separados.

Remover do primeiro corte:

- AI governance runtime;
- communication channel readiness;
- commercial catalog;
- product subscriptions;
- CS portfolio completo;
- engineering workspace completo;
- build journal;
- product docs interno;
- OCP amplo.

Esses dominios podem voltar depois, um por vez, quando o MVP estiver validado.
