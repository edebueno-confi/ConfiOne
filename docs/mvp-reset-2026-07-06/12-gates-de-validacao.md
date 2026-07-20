# Gates de Validacao

Este documento define o minimo que um agente deve validar antes de declarar uma tarefa concluida.

## Regra geral

Nunca declarar sucesso sem informar exatamente o que foi validado.

## Gates por tipo de mudanca

### Documentacao

Rodar:

- busca por links quebrados quando houver ferramenta;
- revisao de consistencia com roadmap;
- `git diff --check`.

Conferir:

- nao contradiz escopo MVP;
- nao reintroduz modulo futuro como P0;
- possui criterio de aceite;
- possui condicao de parada quando aplicavel.

### Frontend

Rodar:

- typecheck;
- build;
- testes unitarios/componentes se existirem;
- QA browser nos fluxos alterados.

Conferir:

- loading;
- vazio;
- erro;
- responsividade;
- overflow;
- copy pt-BR;
- nenhuma regra critica no frontend;
- nenhum dado fake.

### Backend/banco

Rodar:

- reset local;
- lint de banco;
- testes pgTAP focados;
- suite de banco quando viavel;
- typecheck de contratos.

Conferir:

- RLS ativa;
- policies coerentes;
- `tenant_id` em dado operacional;
- audit log;
- eventos de historico;
- grants sem exposicao indevida;
- `SECURITY DEFINER` com search path seguro quando aplicavel.

### Portal cliente

Testar:

- cliente autorizado entra;
- cliente sem acesso bloqueia;
- cliente A nao ve cliente B;
- cliente cria ticket;
- cliente responde;
- cliente nao ve nota interna;
- cliente nao ve acionamento interno;
- cliente nao ve storage path.

### Suporte

Testar:

- fila carrega;
- detalhe carrega;
- resposta publica chega ao portal;
- nota interna fica interna;
- status valido altera;
- status invalido falha;
- atribuicao respeita permissao;
- encerramento gera historico.

### Areas internas

Testar:

- suporte cria acionamento;
- area autorizada ve;
- area nao autorizada nao ve;
- area comenta;
- area devolve retorno;
- suporte ve retorno;
- portal nao ve nada interno.

### Knowledge/Public Help

Testar:

- artigo `published/public` aparece;
- artigo `draft` nao aparece;
- artigo `internal` nao aparece;
- artigo `restricted` nao aparece;
- busca nao retorna conteudo bloqueado;
- slug inexistente tem estado seguro;
- HTML bruto nao renderiza como UI arbitraria.

### Evidencias

Testar:

- upload permitido;
- tipo/tamanho invalido bloqueia;
- download autorizado gera URL temporaria;
- cross-tenant bloqueado;
- path interno nao aparece na UI.

## Gates minimos por ciclo

| Ciclo | Gates minimos |
| --- | --- |
| Fundacao | install, typecheck, build, db reset, RLS basico |
| Identidade | pgTAP RLS, route access, typecheck, build |
| Public Help | pgTAP visibilidade, typecheck, build, QA browser |
| Portal | pgTAP cross-tenant, anti-leak, typecheck, build, QA browser |
| Support | pgTAP RPC/status, typecheck, build, QA browser |
| Evidencias | storage policy, cross-tenant, typecheck, build, QA upload |
| Acionamentos | area isolation, anti-leak portal, typecheck, build, QA browser |
| Admin | permissao admin, audit, typecheck, build |
| Piloto | suite tecnica completa e smoke ponta a ponta |

## Matriz anti-leak customer-facing

O Portal nunca pode exibir:

- nota interna;
- comentario de area interna;
- engenharia interna;
- audit bruto;
- metadata sensivel;
- storage bucket;
- storage path;
- signed URL permanente;
- role tecnica;
- payload de erro;
- stack trace;
- identificador interno sem necessidade.

## Matriz de dados indisponiveis

Quando nao houver contrato real:

- mostrar `Indisponivel`;
- esconder acao executavel;
- ou registrar como backlog.

Nao permitido:

- numero estatico;
- badge falso;
- placeholder que parece dado real;
- regra inferida por texto;
- promessa de integracao futura como ativa.

## Relatorio final obrigatorio

Ao concluir qualquer lote, responder:

```text
Feito:
- ...

Validado:
- comando ou QA: resultado

Atencao:
- ...

Git:
- branch
- status
- commit, se houver
```
