# KNOWLEDGE_P0_HUMAN_REVIEW_GATE.md

## Objetivo
Formalizar o gate humano dos seis candidatos `P0` da Knowledge Base, fechando a elegibilidade pública artigo por artigo antes de qualquer lote de publicação.

## Escopo deste gate
- consolidar decisão editorial por artigo
- separar pendências de Produto e de Suporte/CS
- registrar bloqueadores técnicos e editoriais
- indicar quais artigos podem seguir apenas para preparação de publicação futura

## Regras deste gate
- nenhum artigo é publicado nesta fase
- nenhum artigo segue para publicação futura sem revisão humana explícita
- comportamento ambíguo permanece fora do lote elegível
- dependência forte de UI antiga exige validação de Produto
- risco de exposição interna bloqueia o avanço para público

## Matriz executiva de elegibilidade

| Artigo | Categoria pública proposta | Status de elegibilidade | Dono da próxima validação | Bloqueador principal | Prioridade | Pode seguir para lote de publicação futura |
| --- | --- | --- | --- | --- | --- | --- |
| Como alterar ou aprovar os produtos de uma solicitação? | Primeiros passos | elegível com ajustes | Produto + Suporte/CS | validar nomenclatura atual das ações internas | P0 | sim |
| Como cadastrar motivos para troca ou devolução | Operação de trocas e devoluções | elegível com ajustes | Produto + Suporte/CS | validar nomes de tela e classificação atual dos motivos | P0 | sim |
| Como informar a SKU durantge a troca | Operação de trocas e devoluções | revisar tecnicamente antes | Produto | comportamento ambíguo e dependência de configuração interna | P0 | não |
| Posso enviar uma notificação de análise ao cliente? | Primeiros passos | elegível com ajustes | Produto + Suporte/CS | validar contexto de uso e anexos | P0 | sim |
| Reenviar um e-mail ao consumidor | Operação de trocas e devoluções | elegível com ajustes | Produto + Suporte/CS | validar canal real e nomenclatura da área de comunicação | P0 | sim |
| Regra por motivo | Operação de trocas e devoluções | revisar tecnicamente antes | Produto | o artigo não explica quais regras existem nem seus impactos | P0 | não |

## Fichas de decisão

### 1. Como alterar ou aprovar os produtos de uma solicitação?
- título legado: `Como alterar ou aprovar os produtos de uma solicitação?`
- título público candidato: `Como revisar os itens de uma solicitação`
- categoria pública proposta: `Primeiros passos`
- decisão preliminar: `candidato a público`
- decisão final recomendada: `elegível com ajustes`
- revisão Produto: `pendente`
- revisão Suporte/CS: `pendente`
- risco editorial: `médio`
- risco técnico: `baixo`
- risco de exposição interna: `baixo`
- ajustes obrigatórios antes de publicação:
  - confirmar os nomes atuais da etapa equivalente a `Ações Pendentes`
  - remover qualquer referência residual a contatos legados de suporte
  - revisar se a ação pode ser explicada sem screenshot ou copy interna
- perguntas em aberto:
  - os nomes `Aprovar Todos` e `Alterar Produto(s)` continuam corretos?
  - a etapa existe da mesma forma em todas as contas?
- próximos passos:
  - validar nomenclatura com Produto
  - validar clareza do texto com Suporte/CS
  - se aprovado, mover para preparação de publicação futura

### 2. Como cadastrar motivos para troca ou devolução
- título legado: `Como cadastrar motivos para troca ou devolução`
- título público candidato: `Como organizar motivos de troca e devolução na operação`
- categoria pública proposta: `Operação de trocas e devoluções`
- decisão preliminar: `candidato a público`
- decisão final recomendada: `elegível com ajustes`
- revisão Produto: `pendente`
- revisão Suporte/CS: `pendente`
- risco editorial: `médio`
- risco técnico: `baixo`
- risco de exposição interna: `baixo`
- ajustes obrigatórios antes de publicação:
  - validar se a gestão de motivos ainda usa a mesma nomenclatura
  - confirmar se o tipo do motivo continua sendo claramente separado
  - revisar a redação para não depender de `painel Admin`
- perguntas em aberto:
  - o produto ainda separa motivos por tipo da mesma forma?
  - há limite ou regra adicional relevante que precise constar?
- próximos passos:
  - validar aderência funcional com Produto
  - revisar exemplos e nomes com Suporte/CS
  - se aprovado, mover para preparação de publicação futura

### 3. Como informar a SKU durantge a troca
- título legado: `Como informar a SKU durantge a troca`
- título público candidato: `Como orientar o envio de SKU em uma troca`
- categoria pública proposta: `Operação de trocas e devoluções`
- decisão preliminar: `revisar tecnicamente antes`
- decisão final recomendada: `revisar tecnicamente antes`
- revisão Produto: `pendente`
- revisão Suporte/CS: `pendente`
- risco editorial: `médio`
- risco técnico: `alto`
- risco de exposição interna: `médio`
- ajustes obrigatórios antes de publicação:
  - confirmar o comportamento real da opção
  - confirmar se o cliente informa SKU, link do item ou ambos
  - decidir se o tema pode ser público ou deve permanecer interno
- perguntas em aberto:
  - em quais cenários essa opção é realmente usada?
  - existe dependência de configuração por conta ou fluxo específico?
- próximos passos:
  - revisão técnica obrigatória com Produto
  - só depois reavaliar com Suporte/CS
  - não entra em lote de publicação futura nesta fase

### 4. Posso enviar uma notificação de análise ao cliente?
- título legado: `Posso enviar uma notificação de análise ao cliente?`
- título público candidato: `Como enviar uma atualização de análise ao cliente`
- categoria pública proposta: `Primeiros passos`
- decisão preliminar: `candidato a público`
- decisão final recomendada: `elegível com ajustes`
- revisão Produto: `pendente`
- revisão Suporte/CS: `pendente`
- risco editorial: `médio`
- risco técnico: `baixo`
- risco de exposição interna: `baixo`
- ajustes obrigatórios antes de publicação:
  - validar se anexos continuam permitidos nesse fluxo
  - revisar o texto para não prometer decisões ou prazos
  - confirmar se a comunicação é enviada ao contato correto da conta
- perguntas em aberto:
  - comentário, imagem e arquivo continuam disponíveis no mesmo contexto?
  - existe limite operacional relevante para anexos?
- próximos passos:
  - validar uso real com Produto
  - revisar padrão de comunicação com Suporte/CS
  - se aprovado, mover para preparação de publicação futura

### 5. Reenviar um e-mail ao consumidor
- título legado: `Reenviar um e-mail ao consumidor`
- título público candidato: `Como reenviar uma comunicação ao cliente`
- categoria pública proposta: `Operação de trocas e devoluções`
- decisão preliminar: `candidato a público`
- decisão final recomendada: `elegível com ajustes`
- revisão Produto: `pendente`
- revisão Suporte/CS: `pendente`
- risco editorial: `médio`
- risco técnico: `baixo`
- risco de exposição interna: `baixo`
- ajustes obrigatórios antes de publicação:
  - confirmar se o reenvio é apenas por e-mail ou por outros canais
  - revisar a nomenclatura atual da área de comunicação
  - garantir que o texto trate o histórico da solicitação como referência principal
- perguntas em aberto:
  - o canal ainda é exclusivamente e-mail?
  - a ação continua vinculada à mesma área de comunicação?
- próximos passos:
  - validar fluxo com Produto
  - revisar tom e momento de uso com Suporte/CS
  - se aprovado, mover para preparação de publicação futura

### 6. Regra por motivo
- título legado: `Regra por motivo`
- título público candidato: `Como aplicar regras por motivo na operação`
- categoria pública proposta: `Operação de trocas e devoluções`
- decisão preliminar: `revisar tecnicamente antes`
- decisão final recomendada: `revisar tecnicamente antes`
- revisão Produto: `pendente`
- revisão Suporte/CS: `pendente`
- risco editorial: `médio`
- risco técnico: `alto`
- risco de exposição interna: `médio`
- ajustes obrigatórios antes de publicação:
  - mapear quais regras realmente existem
  - definir o impacto operacional de cada regra
  - decidir se o tema pode ser explicado publicamente sem expor governança interna
- perguntas em aberto:
  - quais regras estão ativas no produto atual?
  - esse conteúdo deveria permanecer como documentação interna?
- próximos passos:
  - revisão técnica obrigatória com Produto
  - reavaliar com Suporte/CS só depois de fechar escopo funcional
  - não entra em lote de publicação futura nesta fase

## Lote candidato de publicação futura

### Pode seguir para preparação de publicação futura
- `Como alterar ou aprovar os produtos de uma solicitação?`
- `Como cadastrar motivos para troca ou devolução`
- `Posso enviar uma notificação de análise ao cliente?`
- `Reenviar um e-mail ao consumidor`

Condição:
- somente após revisão de Produto e Suporte/CS
- sem bloqueadores adicionais abertos

### Precisa voltar para revisão técnica
- `Como informar a SKU durantge a troca`
- `Regra por motivo`

Motivo:
- comportamento ambíguo
- dependência forte de configuração interna
- risco de explicar publicamente algo ainda não estabilizado como regra clara

### Deve permanecer interno nesta fase
- nenhum dos seis P0 foi classificado como `manter interno` definitivo neste gate
- os dois itens técnicos acima seguem fora do lote elegível até revisão específica

## Regras finais do gate
- `elegível com ajustes` não significa pronto para publicar
- `revisar tecnicamente antes` bloqueia entrada em lote de publicação futura
- aprovação humana explícita continua obrigatória antes de qualquer próxima fase de publicação
