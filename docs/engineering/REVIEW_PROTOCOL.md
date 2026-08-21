# Protocolo de revisão multiagente

## Objetivo

Este é o contrato normativo do fluxo Codex e Claude. O repositório é a fonte
compartilhada da verdade. Conversas externas, memória de chat e copy/paste não
substituem TASK.md, IMPLEMENTATION.md, REVIEW.md, STATUS.md, commits, diff, testes
ou evidências persistidas.

O protocolo detalhado de quality gates já existente permanece em
[docs/CODE_REVIEW_PROTOCOL_V1.md](../CODE_REVIEW_PROTOCOL_V1.md). Os artefatos de
handoff em `handoffs/current/` são a interface operacional canônica entre os
agentes: `IMPLEMENTATION.md` é o pedido de revisão, `REVIEW.md` é o veredito e
`STATUS.md` é a fonte única do estado e do Owner. A área [.review/](../../.review/README.md)
continua sendo suporte automatizado, baseline e evidência técnica opcional. Nenhum
artefato em `.review/` pode manter pedido, estado ou veredito conflitante com o
handoff corrente.

## Papéis

### Codex, Software Engineer / Executor

Codex investiga, implementa, corrige, altera banco somente quando autorizado,
executa validações, atualiza documentação, responde findings e publica
IMPLEMENTATION.md. Codex não aprova formalmente a própria implementação.

### Claude, Principal Engineer / Reviewer

Claude revisa implementação contra requisitos, contratos, arquitetura, segurança,
multi-tenancy, autorização, RLS, migrations, regressões, QA, UX e documentação.
Claude escreve findings objetivos e o veredito formal em REVIEW.md.

Durante uma revisão, Claude pode ler o repositório e executar comandos
não destrutivos. Pode escrever handoffs/current/REVIEW.md,
handoffs/current/STATUS.md, artefatos em .review/ e documentação de revisão
quando necessário. Claude não modifica código de produto, migrations, testes de
produto, contratos ou configuração executável, salvo autorização explícita
posterior do proprietário.

### Owner do ciclo

O campo `Owner` identifica o agente responsável pelo próximo passo do estado atual,
não o autor da última alteração. Codex atualiza `Owner` para `Claude` ao concluir a
implementação e mover o estado para `READY_FOR_REVIEW`. Claude atualiza `Owner` para
`Codex` ao solicitar correções e para o próximo responsável definido pelo processo
quando aprovar ou bloquear. `STATUS.md` é a fonte canônica desse campo.

## Precedência das fontes

1. especificação explícita da tarefa;
2. critérios de aceitação;
3. decisões aprovadas pelo proprietário;
4. documentação normativa do projeto;
5. arquitetura;
6. regras de engenharia;
7. segurança;
8. design system;
9. testes existentes;
10. padrões consolidados no código.

Código executável, migrations, views, RPCs, policies, schemas e testes prevalecem
como evidência de comportamento. Se duas fontes conflitarem, o agente registra o
conflito e não escolhe silenciosamente.

## Máquina de estados

Os estados permitidos são:

IDLE, READY_FOR_IMPLEMENTATION, IMPLEMENTING, READY_FOR_REVIEW, REVIEWING,
CHANGES_REQUESTED, FIXING, APPROVED, BLOCKED, DONE.

Fluxo normal:

READY_FOR_IMPLEMENTATION -> Codex
IMPLEMENTING -> Codex trabalha e valida
READY_FOR_REVIEW -> Codex preenche IMPLEMENTATION.md
REVIEWING -> Claude lê TASK, IMPLEMENTATION, diff e evidências
APPROVED -> tarefa pode seguir o processo de merge/release autorizado
REQUEST_CHANGES -> CHANGES_REQUESTED -> Codex corrige findings
CHANGES_REQUESTED -> FIXING -> READY_FOR_REVIEW
BLOCKED -> intervenção do proprietário
APPROVED -> DONE somente após o processo de integração aplicável

Após `APPROVED`, uma tarefa previamente autorizada na fila possui autorização
persistente para checkpoint local. O Codex pode criar o commit local exclusivo
do lote, arquivar o handoff e promover o próximo item elegível sem nova
autorização conversacional. Essa autorização não inclui push, force push, merge,
deploy, migration remota, alteração de secrets ou alteração da release surface.
Se o escopo do commit não puder ser separado com segurança das alterações
preexistentes, o Codex deve parar e registrar `OWNER_DECISION_REQUIRED`.

Em `READY_FOR_IMPLEMENTATION`, `IMPLEMENTING`, `CHANGES_REQUESTED` e `FIXING`, o
Owner esperado é Codex. Em `READY_FOR_REVIEW` e `REVIEWING`, o Owner esperado é
Claude. A transição deve ser registrada em `STATUS.md` pelo agente que entrega o
próximo passo.

Nenhum agente deve editar código do produto enquanto o outro estiver em
IMPLEMENTING, FIXING ou REVIEWING na mesma working tree. Worktrees paralelos
só devem ser usados se já estiverem funcionando de forma confiável.

## Artefatos obrigatórios

- handoffs/current/TASK.md: escopo e critérios antes da implementação;
- handoffs/current/IMPLEMENTATION.md: evidência do lote executado pelo Codex;
- handoffs/current/REVIEW.md: findings e veredito do Claude;
- handoffs/current/STATUS.md: estado atual da máquina;
- .review/inbox/<task-id>.json: pacote técnico opcional, gerado quando o quality
  gate for aplicável; não substitui `IMPLEMENTATION.md`;
- .review/context/: pacote gerado de contexto, não fonte normativa;
- .review/verdicts/: evidência técnica opcional do revisor, alinhada ao `REVIEW.md`;
- .review/state.json: somente metadados de automação, sem estado de review ou veredito.

## TASK.md

Não iniciar implementação sem Task ID, objetivo, escopo, fora de escopo,
requisitos, critérios de aceitação, documentos aplicáveis, base SHA e branch.
Ambiguidade material deve ser marcada como:

UNRESOLVED — requires project owner decision

## IMPLEMENTATION.md

O Codex registra implementador, base SHA, implementation SHA ou estado
UNCOMMITTED_WORKTREE, resumo, decisões, arquivos, migrations, testes, comandos,
resultados, limitações, riscos e pontos para o reviewer.

Nenhum teste pode ser declarado aprovado sem ter sido executado.

## REVIEW.md e findings

O Claude registra Task ID, reviewer, commit ou worktree revisado, base commit,
data, resultado e findings. Cada finding contém:

- ID;
- severidade CRITICAL, HIGH, MEDIUM, LOW ou INFO;
- categoria;
- arquivo e linha ou região;
- evidência;
- requisito violado;
- impacto;
- correção esperada;
- status.

Resultados válidos:

APPROVED, REQUEST_CHANGES, BLOCKED

A escala canônica de severidade é `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` e `INFO`.
Para preservar artefatos históricos sem reescrevê-los, use o mapa
`BLOCKER → CRITICAL`, `MAJOR → HIGH`, `MINOR → MEDIUM`, `NIT → LOW` e `INFO → INFO`.
Os quality gates podem manter `blocker`, `major` e `info` como severidades próprias,
mas relatórios que as citarem devem usar o mesmo mapa.

Finding deve descrever comportamento verificável. Não usar preferência pessoal ou
frases vagas. Toda rejeição precisa apontar requisito, evidência e impacto.

## Regras de segurança

- não fazer commit, push, merge, rebase, reset, clean, deploy ou migration remota
  durante review;
- não fazer commit local de tarefa sem `APPROVED` formal, sem `Approval = APPROVED`
  na fila ou com escopo misturado;
- não alterar secrets ou escrever em serviços externos;
- não remover finding por edição do documento;
- não reduzir testes ou baseline para obter aprovação;
- não aprovar com base somente em compilação, HTTP 200 ou aparência visual;
- reportar explicitamente o que não foi validado.

## Conflitos

Se `TASK.md`, `IMPLEMENTATION.md`, `REVIEW.md`, `STATUS.md`, um commit ou o diff
apontarem estados ou escopos diferentes, interromper a aprovação e registrar o
conflito. `.review/state.json` não participa da determinação do estado ou do
veredito: ele é somente metadado de automação. A resolução exige evidência nova ou
decisão do proprietário.
