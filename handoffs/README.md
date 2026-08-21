# Handoffs entre Codex e Claude

## Finalidade

Este diretório é a interface persistente de colaboração entre:

- Codex, Software Engineer / Executor;
- Claude, Principal Engineer / Reviewer.

O handoff é baseado no repositório, não no histórico de conversas. O código, os
commits, os SHAs, os documentos, os testes e as evidências são a fonte compartilhada.

## Estrutura

    handoffs/
      README.md
      current/
        TASK.md
        IMPLEMENTATION.md
        REVIEW.md
        STATUS.md
      archive/
      pacotes históricos ou específicos de domínio/

current/ contém uma única tarefa ativa. archive/ contém pacotes encerrados,
preservados para auditoria. Pacotes históricos existentes não devem ser apagados
nem tratados como estado corrente sem leitura e classificação.

## Fluxo

1. O proprietário ou Codex preenche current/TASK.md.
2. STATUS.md passa a READY_FOR_IMPLEMENTATION.
3. Codex muda para IMPLEMENTING, executa o lote e atualiza IMPLEMENTATION.md.
4. Codex executa as validações reais e muda para READY_FOR_REVIEW.
5. Claude lê TASK, IMPLEMENTATION, diff, contratos e evidências, muda para
   REVIEWING e escreve REVIEW.md.
6. Claude registra APPROVED, REQUEST_CHANGES ou BLOCKED.
7. REQUEST_CHANGES devolve o lote a Codex, que usa findings válidos e muda para
   FIXING.
8. Depois da correção, Codex atualiza IMPLEMENTATION, preserva REVIEW histórico
   dentro do ciclo e retorna a READY_FOR_REVIEW.
9. Somente APPROVED permite seguir para merge ou release conforme autorização
   humana. DONE é usado após o processo de integração aplicável.

Para lotes previamente autorizados na fila, `APPROVED` também autoriza o Codex
a criar o checkpoint Git local exclusivo do lote, arquivar o handoff e promover
o próximo item elegível sem nova autorização conversacional. Essa autorização
não inclui push, force push, merge, deploy, migration remota, alteração de
secrets ou release surface. Se alterações preexistentes não puderem ser
separadas com segurança, registrar `OWNER_DECISION_REQUIRED` e interromper.

## Fila canônica de trabalho — 2026-08-20

O proprietário autorizou a execução sequencial desta fila. Esta tabela é a fila
canônica, mantida neste README para não criar um segundo sistema operacional.
Ela representa o trabalho futuro; `handoffs/current/` continua sendo a fonte da
tarefa ativa e de seu estado detalhado.

`Approval = APPROVED` significa autorização do proprietário para execução
autônoma. Isso não ignora dependências: Codex nunca executa item em `State =
PROPOSED`, e somente um item pode estar `ACTIVE` por vez.

| Ordem | Task ID | Project | Title | Priority | State | Approval | Dependencies | Origin | Summary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | O-01 | ConfiOne | Baseline e veredito legado em `.review/` | P1 | DONE | APPROVED | — | Owner decision 2026-08-20 | Artefatos legados materializados e divergência documental resolvida. |
| 2 | R-01 / R01-B | ConfiOne | Negação de acesso e feedback pós-login | P1 | DONE | APPROVED | O-01 | Owner queue 2026-08-20 | Denial context preservado sem autorizar nova release surface. |
| 3 | R-03 | ConfiOne | Feedback de erro no Support Workspace | P1 | DONE | APPROVED | R-01 / R01-B | Owner queue 2026-08-20 | Falhas auxiliares visíveis; integrado em `1ea22b2`. |
| 4 | DEV-CONTROL-MVP | ConfiOne / Engineering | Development Control Plane MVP read-only | P0 | DONE | APPROVED | R-03 | Owner request 2026-08-20 | Aprovado no ciclo 5; handoff arquivado para integração aplicável. |
| 5 | R-11 | ConfiOne | Scripts npm que apontam para arquivos inexistentes | P1 | DONE | APPROVED | DEV-CONTROL-MVP | Owner queue 2026-08-20 | Aprovado no ciclo 2 e integrado em checkpoint local; handoff arquivado. |
| 6 | R-14 | ConfiOne | Deny-all intencional para tabelas RLS sem policy | P1 | ACTIVE | APPROVED | R-11 | Owner queue 2026-08-20 | Lote aberto após integração do R-11; formalizar intenção sem enfraquecer isolamento. |

Regras da fila:

- somente um item pode estar `ACTIVE` por vez;
- o próximo item só pode ser aberto depois de `APPROVED` no item anterior, suas
  dependências satisfeitas e o retorno de `handoffs/current/` para `IDLE`;
- `Approval` é autorização do proprietário; `State` controla elegibilidade e
  progresso. `PROPOSED` nunca é executado por Codex;
- quando um item aprovado e integrado termina, ele passa a `DONE` e a fila pode
  promover o próximo item aprovado e sem dependências pendentes para `APPROVED`;
- cada item exige TASK, IMPLEMENTATION e REVIEW próprios, com entrega em
  `READY_FOR_REVIEW` e `Owner = Claude` antes da revisão;
- heartbeat do Codex pode abrir automaticamente o próximo item somente quando a
  fila estiver liberada pelo `APPROVED` anterior;
- `BLOCKED`, `OWNER_DECISION_REQUIRED` ou mudança material de escopo interrompem
  a fila e exigem retorno ao proprietário;
- push, merge e deploy permanecem fora da autorização desta fila.
- commit local de lote `APPROVED` e previamente autorizado na fila não exige
  nova autorização conversacional, desde que seja exclusivo e verificável.

`Owner` identifica o agente responsável pelo próximo passo do estado atual. Em
`READY_FOR_IMPLEMENTATION`, `IMPLEMENTING`, `CHANGES_REQUESTED` e `FIXING`, o
responsável esperado é Codex. Em `READY_FOR_REVIEW` e `REVIEWING`, é Claude.

## Concorrência

Não editar código do produto simultaneamente na mesma working tree. Durante
REVIEWING, Claude somente lê o produto e escreve artefatos de revisão. Durante
IMPLEMENTING ou FIXING, Codex é o único agente autorizado a alterar produto.

## Relação com .review

`.review/` contém quality gates, inbox, contexto, baseline e vereditos técnicos.
Quando usado, seu resultado deve ser referenciado em `IMPLEMENTATION.md` ou
`REVIEW.md`. O inbox e os vereditos são opcionais, não substituem os quatro
arquivos de `current/` e não podem manter um pedido, estado ou veredito
contraditório. `.review/state.json` guarda apenas metadados de automação.

## Segurança

Nenhum handoff deve conter senha, token, cookie, JWT, service_role, segredo ou
conteúdo sensível desnecessário. Dúvida material de produto, arquitetura,
permissão, tenant, segurança ou operação externa deve ser registrada como:

UNRESOLVED — requires project owner decision
