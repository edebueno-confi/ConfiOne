# KNOWLEDGE_P0_APPROVAL_COLLECTION_PLAYBOOK.md

## Objetivo
Preparar o playbook operacional de coleta de evidencias humanas reais para os quatro artigos `P0` pendentes, de modo que o proximo passo seja apenas copiar a mensagem correta, coletar a resposta e registrar a evidencia no formato oficial.

## Escopo deste playbook
- mensagens copiaveis para `Produto`
- mensagens copiaveis para `Suporte/CS`
- instrucao objetiva de como registrar a evidencia recebida
- checklist final de readiness antes de iniciar a coleta
- regra operacional para uso de mensagens informais como fonte de evidencia

## Regras desta fase
- este playbook nao aprova artigos
- este playbook nao publica artigos
- toda aprovacao futura continua dependente de registro explicito no documento oficial
- os dois artigos fora da trilha tecnica nao entram neste playbook:
  - `Como informar a SKU durantge a troca`
  - `Regra por motivo`

## Artigos cobertos
- `Como revisar os itens de uma solicitacao`
- `Como organizar motivos de troca e devolucao na operacao`
- `Como enviar uma atualizacao de analise ao cliente`
- `Como reenviar uma comunicacao ao cliente`

## Checklist de readiness antes de coletar aprovacao
- a versao candidata revisada existe
- o artigo esta no intake pack
- as pendencias atuais estao claras
- o aprovador correto foi identificado
- a fonte da evidencia sera rastreavel
- nenhum artigo sera publicado so com mensagem informal sem registro

## Como registrar a evidencia recebida
1. Receber a resposta do aprovador em fonte rastreavel.
2. Identificar:
   - artigo
   - area aprovadora
   - decisao
   - observacao obrigatoria
   - pendencias restantes
3. Registrar a evidencia em:
   - `docs/knowledge/KNOWLEDGE_HUMAN_APPROVAL_REGISTER.md`
4. Usar o formato obrigatorio ja definido no registro oficial.
5. Atualizar o status do artigo apenas quando a evidencia estiver transcrita ou resumida no registro oficial.

### Como diferenciar os estados
- `aprovado`
  - aprovador confirmou o artigo revisado sem ajustes adicionais
- `aprovado com ajuste`
  - aprovador aceitou a direcao, mas exigiu ajuste antes de liberar
- `pendente`
  - ainda nao existe evidencia suficiente ou a resposta foi inconclusiva
- `bloqueio temporario`
  - o artigo nao pode avancar agora, mas pode voltar para revisao futura
- `bloqueio com possibilidade de override`
  - o artigo nao avanca por padrao e so pode seguir com decisao explicita de governanca
- `bloqueio definitivo`
  - o artigo nao pode entrar em lote de publicacao

### Quando atualizar o status do artigo
- somente depois de registrar a evidencia no documento oficial
- somente quando a resposta mencionar claramente o artigo ou pacote revisado
- somente quando houver decisao legivel e contextualizada

### Quando manter `pendente`
- ausencia de resposta
- silencio do aprovador
- resposta ambigua
- `ok` sem contexto
- resposta sem mencionar o artigo ou a versao revisada

### Quando abrir nova revisao
- quando houver `aprovado com ajuste`
- quando houver `bloqueio temporario`
- quando a resposta apontar nomenclatura errada, fluxo divergente ou risco nao tratado

## Regra operacional para mensagens informais
- WhatsApp pode ser fonte de evidencia
- Slack pode ser fonte de evidencia
- e-mail pode ser fonte de evidencia
- reuniao pode ser fonte de evidencia
- em todos os casos, a evidencia precisa ser transcrita ou resumida no registro oficial
- aprovacao ambigua nao aprova
- silencio nao aprova
- `ok` sem contexto nao aprova
- a decisao precisa mencionar o artigo ou o pacote revisado

## Templates copiaveis para Produto

### 1. Como revisar os itens de uma solicitacao
```md
Assunto: Validacao de Produto - Como revisar os itens de uma solicitacao

Preciso da sua validacao sobre o artigo candidato `Como revisar os itens de uma solicitacao`.

Pontos para confirmar:
- o comportamento descrito esta correto?
- a nomenclatura atual esta correta?
- o fluxo descrito existe hoje?
- ha dependencia de UI antiga?
- ha promessa de funcionalidade inexistente?
- ha risco tecnico?

Decisao esperada:
- aprovado
- aprovado com ajuste
- pendente
- bloqueio temporario
- bloqueio com possibilidade de override
- bloqueio definitivo

Se houver ajuste ou bloqueio, descreva objetivamente o motivo e a pendencia restante.
```

### 2. Como organizar motivos de troca e devolucao na operacao
```md
Assunto: Validacao de Produto - Como organizar motivos de troca e devolucao na operacao

Preciso da sua validacao sobre o artigo candidato `Como organizar motivos de troca e devolucao na operacao`.

Pontos para confirmar:
- o comportamento descrito esta correto?
- a nomenclatura atual esta correta?
- o fluxo descrito existe hoje?
- ha dependencia de UI antiga?
- ha promessa de funcionalidade inexistente?
- ha risco tecnico?

Decisao esperada:
- aprovado
- aprovado com ajuste
- pendente
- bloqueio temporario
- bloqueio com possibilidade de override
- bloqueio definitivo

Se houver ajuste ou bloqueio, descreva objetivamente o motivo e a pendencia restante.
```

### 3. Como enviar uma atualizacao de analise ao cliente
```md
Assunto: Validacao de Produto - Como enviar uma atualizacao de analise ao cliente

Preciso da sua validacao sobre o artigo candidato `Como enviar uma atualizacao de analise ao cliente`.

Pontos para confirmar:
- o comportamento descrito esta correto?
- a nomenclatura atual esta correta?
- o fluxo descrito existe hoje?
- ha dependencia de UI antiga?
- ha promessa de funcionalidade inexistente?
- ha risco tecnico?

Decisao esperada:
- aprovado
- aprovado com ajuste
- pendente
- bloqueio temporario
- bloqueio com possibilidade de override
- bloqueio definitivo

Se houver ajuste ou bloqueio, descreva objetivamente o motivo e a pendencia restante.
```

### 4. Como reenviar uma comunicacao ao cliente
```md
Assunto: Validacao de Produto - Como reenviar uma comunicacao ao cliente

Preciso da sua validacao sobre o artigo candidato `Como reenviar uma comunicacao ao cliente`.

Pontos para confirmar:
- o comportamento descrito esta correto?
- a nomenclatura atual esta correta?
- o fluxo descrito existe hoje?
- ha dependencia de UI antiga?
- ha promessa de funcionalidade inexistente?
- ha risco tecnico?

Decisao esperada:
- aprovado
- aprovado com ajuste
- pendente
- bloqueio temporario
- bloqueio com possibilidade de override
- bloqueio definitivo

Se houver ajuste ou bloqueio, descreva objetivamente o motivo e a pendencia restante.
```

## Templates copiaveis para Suporte/CS

### 1. Como revisar os itens de uma solicitacao
```md
Assunto: Validacao de Suporte/CS - Como revisar os itens de uma solicitacao

Preciso da sua validacao sobre o artigo candidato `Como revisar os itens de uma solicitacao`.

Pontos para confirmar:
- o texto resolve uma duvida real de cliente B2B?
- a linguagem esta clara para cliente B2B?
- o artigo evita falar com shopper final como publico principal?
- o texto evita expor operacao interna?
- o texto evita criar expectativa indevida de atendimento?
- a categoria publica faz sentido?

Decisao esperada:
- aprovado
- aprovado com ajuste
- pendente
- bloqueio temporario
- bloqueio com possibilidade de override
- bloqueio definitivo

Se houver ajuste ou bloqueio, descreva objetivamente o motivo e a pendencia restante.
```

### 2. Como organizar motivos de troca e devolucao na operacao
```md
Assunto: Validacao de Suporte/CS - Como organizar motivos de troca e devolucao na operacao

Preciso da sua validacao sobre o artigo candidato `Como organizar motivos de troca e devolucao na operacao`.

Pontos para confirmar:
- o texto resolve uma duvida real de cliente B2B?
- a linguagem esta clara para cliente B2B?
- o artigo evita falar com shopper final como publico principal?
- o texto evita expor operacao interna?
- o texto evita criar expectativa indevida de atendimento?
- a categoria publica faz sentido?

Decisao esperada:
- aprovado
- aprovado com ajuste
- pendente
- bloqueio temporario
- bloqueio com possibilidade de override
- bloqueio definitivo

Se houver ajuste ou bloqueio, descreva objetivamente o motivo e a pendencia restante.
```

### 3. Como enviar uma atualizacao de analise ao cliente
```md
Assunto: Validacao de Suporte/CS - Como enviar uma atualizacao de analise ao cliente

Preciso da sua validacao sobre o artigo candidato `Como enviar uma atualizacao de analise ao cliente`.

Pontos para confirmar:
- o texto resolve uma duvida real de cliente B2B?
- a linguagem esta clara para cliente B2B?
- o artigo evita falar com shopper final como publico principal?
- o texto evita expor operacao interna?
- o texto evita criar expectativa indevida de atendimento?
- a categoria publica faz sentido?

Decisao esperada:
- aprovado
- aprovado com ajuste
- pendente
- bloqueio temporario
- bloqueio com possibilidade de override
- bloqueio definitivo

Se houver ajuste ou bloqueio, descreva objetivamente o motivo e a pendencia restante.
```

### 4. Como reenviar uma comunicacao ao cliente
```md
Assunto: Validacao de Suporte/CS - Como reenviar uma comunicacao ao cliente

Preciso da sua validacao sobre o artigo candidato `Como reenviar uma comunicacao ao cliente`.

Pontos para confirmar:
- o texto resolve uma duvida real de cliente B2B?
- a linguagem esta clara para cliente B2B?
- o artigo evita falar com shopper final como publico principal?
- o texto evita expor operacao interna?
- o texto evita criar expectativa indevida de atendimento?
- a categoria publica faz sentido?

Decisao esperada:
- aprovado
- aprovado com ajuste
- pendente
- bloqueio temporario
- bloqueio com possibilidade de override
- bloqueio definitivo

Se houver ajuste ou bloqueio, descreva objetivamente o motivo e a pendencia restante.
```

## Resultado atual do playbook
- nenhum artigo foi aprovado
- nenhuma aprovacao foi simulada
- nenhum artigo foi publicado
- os quatro artigos `P0` seguem pendentes
