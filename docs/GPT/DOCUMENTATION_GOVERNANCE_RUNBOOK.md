# DOCUMENTATION_GOVERNANCE_RUNBOOK.md

## Objetivo
Transformar `DOCUMENTATION_UPDATE_POLICY.md` em rotina operacional contínua, curta e auditável.

A regra prática é:

```text
mudou o estado real do sistema, o contrato, o fluxo, o risco ou a superfície operacional -> o lote só fecha com documentação proporcional atualizada
```

## Fontes de verdade desta rotina
- `docs/DOCUMENTATION_UPDATE_POLICY.md`
- `docs/PROJECT_STATE.md`
- `docs/DOCUMENTATION_LEDGER.md`
- documento específico da área alterada
- `docs/README.md`
- board Kanban oficial em `docs/KANBAN_OPERATIONAL_GOVERNANCE.md`

## Papéis

### Especialista da frente que executa o lote
Responsável por atualizar o documento mais próximo da mudança real.

Exemplos:
- `web` -> docs de fluxo/tela/spec da área
- `supabase` -> docs contratuais, arquitetura backend, runbooks de banco
- `knowledgeops` -> docs editoriais, curadoria e publicação
- `qa` -> matriz/checklist de validação quando a mudança alterar o baseline

### `docsgovernor`
Responsável por:
- garantir coerência entre checkpoint, ledger, docs de área e índice;
- cobrar distinção clara entre estado atual, histórico e futuro;
- manter a rotina leve o suficiente para uso recorrente;
- registrar gaps estruturais de documentação como task explícita, não como observação solta.

### `orchestrator`
Responsável por:
- exigir escopo documental nas tasks relevantes;
- usar dependências/handoffs para evitar fechamento sem documentação;
- tratar drift documental recorrente como backlog operacional do board.

## Checkpoints obrigatórios por lote

### 1. Na abertura da task
A descrição do card deve deixar claro, quando aplicável:
- qual superfície mudou;
- qual doc de área deve ser tocado;
- se haverá impacto em `PROJECT_STATE.md`, `DOCUMENTATION_LEDGER.md` ou `README.md`.

Se isso não estiver claro, o worker deve inferir pelo escopo real e registrar no handoff.

### 2. Durante a execução
Sempre que o worker descobrir que o runtime, o contrato ou a operação real diferem da documentação vigente, o drift vira parte do lote atual ou uma task filha explícita.

Não é aceitável fechar o lote deixando a inconsistência apenas em comentário informal.

### 3. Antes do handoff final
Executar a revisão documental mínima:
- `PROJECT_STATE.md` ainda responde corretamente `o que existe hoje de verdade?`
- `DOCUMENTATION_LEDGER.md` precisa de novo registro?
- o documento de área mais próximo foi atualizado?
- nasceu documento novo que precisa entrar no `docs/README.md`?
- riscos, limites e bloqueios mudaram?
- a doc separa com clareza estado atual vs. histórico vs. futuro?

### 4. No encerramento do card
O handoff final do Kanban deve explicitar:
- arquivos de documentação alterados;
- comportamento/decisão real registrada;
- validações executadas;
- risco restante, se houver.

## Ritual por documento

### `PROJECT_STATE.md`
Usar como snapshot vivo do estado atual.

Atualizar quando mudar:
- o que existe em runtime;
- o que está parcial, bloqueado ou fora de escopo;
- o próximo bloco recomendado;
- a resposta para `o que existe hoje de verdade?`.

Critério operacional:
- topo curto e orientado ao presente;
- histórico detalhado pode existir, mas não deve esconder o estado vigente;
- se o checkpoint crescer demais, abrir task para saneamento em vez de continuar inflando sem controle.

### `DOCUMENTATION_LEDGER.md`
Usar como trilha de auditoria do lote.

Cada registro relevante deve conter, no mínimo:
- fase/nome;
- data;
- resumo funcional;
- docs alterados;
- telas afetadas;
- views/RPCs afetadas, quando houver;
- validação executada, quando aplicável;
- riscos restantes;
- impacto futuro na FAQ.

Regra prática:
- um lote relevante = um registro novo;
- não usar ledger para brainstorm, TODO solto ou promessa futura.

### Documento específico da área
É sempre a primeira documentação a ser atualizada depois da implementação real.

Pergunta-guia:
`qual é o documento mais próximo da superfície que mudou?`

Se não existir documento adequado:
- criar um novo apenas quando ele realmente sustentar continuidade operacional;
- registrar o novo documento no `README.md`;
- refletir o nascimento dele no ledger.

### `docs/README.md`
Funciona como índice navegável, não como checkpoint paralelo.

Atualizar quando:
- nascer documento novo relevante;
- um documento mudar de status canônico/histórico;
- a navegação ficar incoerente com a estrutura real.

Evitar:
- duplicar narrativa longa já mantida em docs de área;
- deixar links para documento histórico como se fossem fonte corrente sem aviso.

## Cadência operacional

### Por lote relevante
Obrigatório revisar documentação no próprio lote, antes de fechar o card.

### Revisão leve diária ou por bloco ativo
Quando houver várias entregas no mesmo dia/frente:
- revisar se o topo de `PROJECT_STATE.md` ainda representa o presente;
- revisar se o ledger recebeu todos os registros do bloco;
- revisar se surgiram docs novos sem entrada no índice.

### Revisão semanal de governança
Responsável principal: `docsgovernor`, com sinais vindos de `orchestrator` e cron read-only.

Checklist semanal:
- docs centrais ficaram longos demais ou ambíguos?
- há documento histórico sendo tratado como canônico?
- existe runtime real sem doc de área correspondente?
- existe documento prometendo capacidade ainda não entregue?
- o board acumulou tasks fechadas sem rastro documental proporcional?

Se a resposta for sim para qualquer item, abrir task explícita de saneamento documental.

## Conexão com validação técnica
A revisão documental não substitui validação técnica. Ela fecha junto com a validação proporcional do lote.

Aplicar conforme escopo:
- docs-only: revisão textual/coerência e, quando existir, validação documental automatizada;
- frontend/backend/contrato: rodar lint, typecheck, testes, build ou smoke checks relevantes e registrar a evidência junto do update documental;
- mudanças de governança/processo: revisar consistência com policy, board e runbooks relacionados.

## Conexão com o Kanban
- task relevante não deve ser considerada `done` sem revisão documental proporcional;
- quando a mudança ainda exige olhos humanos, o worker deve deixar handoff estruturado e bloquear com `review-required` em vez de marcar como concluída;
- gaps documentais recorrentes devem virar cards próprios, com lane e prioridade explícitas;
- cards de síntese/auditoria devem alimentar `PROJECT_STATE.md`, `DOCUMENTATION_LEDGER.md` e o índice, não apenas comentários soltos.

## Critérios de pronto desta rotina
A governança documental está sendo seguida corretamente quando:
- cada lote relevante deixa rastro documental proporcional;
- `PROJECT_STATE.md` continua útil como resposta rápida do estado atual;
- `DOCUMENTATION_LEDGER.md` preserva trilha de auditoria por lote;
- docs de área permanecem mais confiáveis que memória oral;
- `docs/README.md` continua navegável e canônico;
- drift documental vira trabalho explícito, não dívida invisível.
