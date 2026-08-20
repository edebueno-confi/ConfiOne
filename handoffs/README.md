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
