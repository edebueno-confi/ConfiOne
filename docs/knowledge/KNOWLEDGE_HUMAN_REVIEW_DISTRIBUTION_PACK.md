# Knowledge Human Review Distribution Pack

## Objetivo

Pacote operacional para enviar a `Produto` e `Suporte/CS` a revisão humana dos `8` artigos candidatos da Knowledge Base.

Este documento não aprova, não publica e não substitui registro formal em `docs/knowledge/KNOWLEDGE_HUMAN_APPROVAL_REGISTER.md`.

## Regras de uso

- todos os artigos abaixo são candidatos
- todos seguem com status `pendente`
- nenhuma publicação deve ocorrer sem evidência humana real
- cada área precisa responder por artigo
- `ok` genérico não aprova
- resposta ambígua mantém o artigo `pendente`
- decisão aceita por artigo: `aprovado`, `aprovado com ajuste`, `pendente` ou `bloqueado`
- o pacote de leitura com texto completo dos `8` artigos está em:
  - `docs/knowledge/KNOWLEDGE_HUMAN_REVIEW_READING_PACK.md`
- a versão resumida para envio está em:
  - `docs/knowledge/KNOWLEDGE_HUMAN_REVIEW_SUMMARY.md`

## Pacote para Produto

### Critérios Produto

- comportamento descrito está correto?
- nomenclatura atual está correta?
- fluxo existe hoje?
- há dependência de UI antiga?
- há risco técnico, financeiro, logístico ou operacional?
- algum trecho deve permanecer interno?

### 1. Como revisar os itens de uma solicitação

- objetivo do artigo: orientar cliente B2B a revisar itens vinculados a uma solicitação antes de seguir com a tratativa.
- resumo candidato: explica, em alto nível, que a revisão de itens ajuda a evitar erro de produto, quantidade ou escopo da solicitação.
- principais pontos para Produto validar:
  - se a nomenclatura de `itens da solicitação` está atual
  - se o fluxo descrito existe hoje
  - se a revisão de itens pode ser descrita sem citar UI interna
  - se há algum impacto operacional não coberto
- riscos conhecidos:
  - usar nome antigo de tela ou ação
  - sugerir poder de alteração maior do que o produto permite
- decisão esperada: `aprovado`, `aprovado com ajuste`, `pendente` ou `bloqueado`
- observação:

### 2. Como organizar motivos de troca e devolução na operação

- objetivo do artigo: explicar como motivos ajudam a organizar a operação de troca e devolução.
- resumo candidato: trata motivos como classificação operacional de alto nível, sem abrir regras internas, frete, cálculo de estorno ou exceções logísticas.
- principais pontos para Produto validar:
  - se a nomenclatura de motivos está atual
  - se a divisão entre troca e devolução está correta
  - se o texto não sugere regra interna por motivo
  - se algum trecho deveria permanecer interno
- riscos conhecidos:
  - o leitor interpretar motivo como regra automática
  - aproximar o artigo de política financeira ou logística sensível
- decisão esperada: `aprovado`, `aprovado com ajuste`, `pendente` ou `bloqueado`
- observação:

### 3. Como enviar uma atualização de análise ao cliente

- objetivo do artigo: orientar o envio de uma atualização de análise para manter o cliente informado durante a tratativa.
- resumo candidato: descreve a comunicação como apoio operacional, sem prometer prazo, decisão automática ou retorno específico.
- principais pontos para Produto validar:
  - se o fluxo de atualização existe hoje
  - se a nomenclatura de análise está correta
  - se há dependência de UI antiga
  - se a mensagem pode ser tratada como orientação pública
- riscos conhecidos:
  - criar expectativa indevida de SLA ou resposta automática
  - expor rotina interna de atendimento
- decisão esperada: `aprovado`, `aprovado com ajuste`, `pendente` ou `bloqueado`
- observação:

### 4. Como reenviar uma comunicação ao cliente

- objetivo do artigo: orientar quando revisar o reenvio de uma comunicação ao cliente em uma solicitação.
- resumo candidato: apresenta o reenvio como recurso operacional de comunicação, sem transformar exceção manual em procedimento padrão.
- principais pontos para Produto validar:
  - se o recurso existe hoje
  - se a nomenclatura está atual
  - se o artigo não incentiva reenvio indevido
  - se há algum limite operacional que precisa ficar interno
- riscos conhecidos:
  - incentivar uso repetitivo ou fora do fluxo
  - sugerir garantia de entrega da comunicação
- decisão esperada: `aprovado`, `aprovado com ajuste`, `pendente` ou `bloqueado`
- observação:

### 5. Formas de estorno disponíveis na operação

- objetivo do artigo: explicar, em alto nível, quais formas de estorno podem existir na operação.
- resumo candidato: consolida o canônico de formas de estorno sem absorver Pix automático, vale-compra, cálculo, limites, políticas financeiras ou troubleshooting técnico.
- principais pontos para Produto validar:
  - se as formas citadas estão corretas e atuais
  - se o texto respeita a fronteira com Pix, vale-compra e cálculo
  - se há risco financeiro ou operacional na formulação
  - se algum trecho deve ficar interno
- riscos conhecidos:
  - parecer promessa de disponibilidade universal de uma forma de estorno
  - misturar forma de estorno com regra financeira sensível
- decisão esperada: `aprovado`, `aprovado com ajuste`, `pendente` ou `bloqueado`
- observação:

### 6. Como o prazo de postagem afeta a operação de troca e devolução

- objetivo do artigo: explicar como o prazo de postagem impacta a operação após a solicitação.
- resumo candidato: fala de janela operacional, sintomas observáveis e cuidados antes de acionar suporte, sem contrato, token, Correios ou autorização técnica.
- principais pontos para Produto validar:
  - se a nomenclatura de prazo de postagem está atual
  - se o prazo é configurável por estado ou por outro critério hoje
  - se o fluxo descrito existe
  - se há dependência de UI antiga
- riscos conhecidos:
  - descrever critério de prazo desatualizado
  - sugerir capacidade de alteração não disponível ao cliente
- decisão esperada: `aprovado`, `aprovado com ajuste`, `pendente` ou `bloqueado`
- observação:

### 7. Como revisar uma pendência de logística reversa na operação

- objetivo do artigo: orientar revisão segura de uma pendência observável de logística reversa.
- resumo candidato: foca em sinais de pendência, dados básicos e quando acionar suporte, sem integração, contrato, token ou execução manual de autorização.
- principais pontos para Produto validar:
  - se os sinais de pendência são atuais
  - se o fluxo descrito existe hoje
  - se há risco logístico ou operacional
  - se algum ponto deve ficar interno
- riscos conhecidos:
  - transformar diagnóstico interno em orientação pública
  - induzir cliente a alterar dados sem contexto suficiente
- decisão esperada: `aprovado`, `aprovado com ajuste`, `pendente` ou `bloqueado`
- observação:

### 8. O que revisar quando o CEP ou endereço impede a postagem

- objetivo do artigo: orientar revisão segura de dados de endereço quando a postagem não avança.
- resumo candidato: lista sinais observáveis e pontos seguros de conferência, sem prometer correção automática nem transformar alteração manual em padrão público.
- principais pontos para Produto validar:
  - se o comportamento de CEP/endereço está correto
  - se o fluxo descrito existe hoje
  - se a orientação respeita os limites operacionais
  - se há risco de expor procedimento interno
- riscos conhecidos:
  - sugerir correção automática inexistente
  - orientar alteração de dado em momento inadequado
- decisão esperada: `aprovado`, `aprovado com ajuste`, `pendente` ou `bloqueado`
- observação:

## Pacote para Suporte/CS

### Critérios Suporte/CS

- texto resolve dúvida real de cliente B2B?
- linguagem está clara?
- tom está adequado?
- categoria pública faz sentido?
- evita expor operação interna?
- evita criar expectativa indevida?

### 1. Como revisar os itens de uma solicitação

- objetivo do artigo: reduzir dúvida recorrente sobre revisão de itens em uma solicitação.
- resumo candidato: orienta conferência de itens de forma simples e B2B, sem detalhar navegação interna.
- principais pontos para Suporte/CS validar:
  - se resolve dúvida real
  - se o texto é claro para cliente B2B
  - se a categoria `Primeiros passos` faz sentido
  - se não parece atendimento ao shopper final
- riscos conhecidos:
  - cliente esperar que o artigo resolva divergência específica sem suporte
  - tom ficar operacional demais para público externo
- decisão esperada: `aprovado`, `aprovado com ajuste`, `pendente` ou `bloqueado`
- observação:

### 2. Como organizar motivos de troca e devolução na operação

- objetivo do artigo: ajudar cliente B2B a entender o papel dos motivos na organização da operação.
- resumo candidato: explica motivos como ferramenta de classificação e análise operacional.
- principais pontos para Suporte/CS validar:
  - se a explicação é útil para dúvidas recorrentes
  - se o texto evita regra interna sensível
  - se o tom está adequado
  - se a categoria pública está correta
- riscos conhecidos:
  - cliente interpretar o artigo como guia completo de configuração
  - expectativa de suporte para decisões internas de política
- decisão esperada: `aprovado`, `aprovado com ajuste`, `pendente` ou `bloqueado`
- observação:

### 3. Como enviar uma atualização de análise ao cliente

- objetivo do artigo: orientar comunicação segura durante a análise de uma solicitação.
- resumo candidato: apresenta a atualização como comunicação operacional, sem prometer resposta automática ou SLA.
- principais pontos para Suporte/CS validar:
  - se resolve dúvida recorrente
  - se evita expectativa indevida de prazo
  - se o tom B2B está claro
  - se a categoria `Primeiros passos` faz sentido
- riscos conhecidos:
  - cliente entender como promessa de notificação garantida
  - texto parecer instrução interna de atendimento
- decisão esperada: `aprovado`, `aprovado com ajuste`, `pendente` ou `bloqueado`
- observação:

### 4. Como reenviar uma comunicação ao cliente

- objetivo do artigo: explicar quando revisar o reenvio de uma comunicação já enviada.
- resumo candidato: trata reenvio como apoio operacional e orienta acionar suporte quando houver dúvida.
- principais pontos para Suporte/CS validar:
  - se o texto responde dúvida real
  - se não incentiva reenvio excessivo
  - se a linguagem está clara
  - se a categoria pública faz sentido
- riscos conhecidos:
  - criar expectativa de entrega ou rastreio de mensagem
  - transformar exceção em rotina recomendada
- decisão esperada: `aprovado`, `aprovado com ajuste`, `pendente` ou `bloqueado`
- observação:

### 5. Formas de estorno disponíveis na operação

- objetivo do artigo: reduzir dúvida sobre formas de estorno sem entrar em regra financeira sensível.
- resumo candidato: apresenta visão geral das formas disponíveis e direciona validações sensíveis para suporte.
- principais pontos para Suporte/CS validar:
  - se a explicação é clara para cliente B2B
  - se não cria promessa indevida de disponibilidade
  - se categoria `Estornos e reembolsos` faz sentido
  - se dúvidas sensíveis ficam bem encaminhadas
- riscos conhecidos:
  - cliente interpretar como garantia de escolha de qualquer forma
  - confundir forma de estorno com política de valor
- decisão esperada: `aprovado`, `aprovado com ajuste`, `pendente` ou `bloqueado`
- observação:

### 6. Como o prazo de postagem afeta a operação de troca e devolução

- objetivo do artigo: explicar impacto do prazo de postagem na rotina de troca e devolução.
- resumo candidato: orienta sinais de prazo e cuidados básicos antes de suporte.
- principais pontos para Suporte/CS validar:
  - se o artigo resolve dúvida recorrente
  - se o tom não promete exceção ou extensão de prazo
  - se a categoria pública está correta
  - se a linguagem está clara
- riscos conhecidos:
  - cliente esperar alteração de prazo sempre que solicitar
  - artigo parecer troubleshooting técnico de Correios
- decisão esperada: `aprovado`, `aprovado com ajuste`, `pendente` ou `bloqueado`
- observação:

### 7. Como revisar uma pendência de logística reversa na operação

- objetivo do artigo: orientar cliente B2B sobre pendência observável sem expor diagnóstico interno.
- resumo candidato: lista sinais e checagens seguras antes de acionar suporte.
- principais pontos para Suporte/CS validar:
  - se reduz abertura de ticket repetitivo
  - se deixa claro quando acionar suporte
  - se não expõe operação interna
  - se evita promessa de resolução automática
- riscos conhecidos:
  - cliente interpretar pendência como erro sempre resolvível por ele
  - texto virar guia técnico de backoffice
- decisão esperada: `aprovado`, `aprovado com ajuste`, `pendente` ou `bloqueado`
- observação:

### 8. O que revisar quando o CEP ou endereço impede a postagem

- objetivo do artigo: ajudar cliente B2B a revisar dados básicos quando endereço ou CEP impedem postagem.
- resumo candidato: orienta conferência de dados e limites de alteração, com acionamento de suporte quando necessário.
- principais pontos para Suporte/CS validar:
  - se a linguagem é clara
  - se o artigo resolve dúvida recorrente
  - se não cria expectativa de correção automática
  - se a categoria `Erros conhecidos e troubleshooting` faz sentido
- riscos conhecidos:
  - cliente alterar dado sem avaliar impacto operacional
  - expectativa de que qualquer erro de CEP seja corrigido manualmente
- decisão esperada: `aprovado`, `aprovado com ajuste`, `pendente` ou `bloqueado`
- observação:

## Mensagem copiável para Produto

```md
Pessoal, preciso da validação de Produto para 8 artigos candidatos da Knowledge Base.

Importante:
- são artigos candidatos, ainda não aprovados
- nada será publicado sem validação explícita de Produto e Suporte/CS
- a resposta precisa indicar uma decisão por artigo
- decisões aceitas: aprovado, aprovado com ajuste, pendente ou bloqueado
- "ok" genérico não aprova
- resposta ambígua mantém o artigo pendente

Critérios para Produto:
- o comportamento descrito está correto?
- a nomenclatura atual está correta?
- o fluxo existe hoje?
- há dependência de UI antiga?
- há risco técnico, financeiro, logístico ou operacional?
- algum trecho deve permanecer interno?

Artigos para validar:
1. Como revisar os itens de uma solicitação
2. Como organizar motivos de troca e devolução na operação
3. Como enviar uma atualização de análise ao cliente
4. Como reenviar uma comunicação ao cliente
5. Formas de estorno disponíveis na operação
6. Como o prazo de postagem afeta a operação de troca e devolução
7. Como revisar uma pendência de logística reversa na operação
8. O que revisar quando o CEP ou endereço impede a postagem

Por favor responder neste formato:
- artigo:
- decisão:
- observação:
- ajustes necessários:
- algum trecho deve ficar interno?
```

## Mensagem copiável para Suporte/CS

```md
Pessoal, preciso da validação de Suporte/CS para 8 artigos candidatos da Knowledge Base.

Importante:
- são artigos candidatos, ainda não aprovados
- nada será publicado sem validação explícita de Produto e Suporte/CS
- a resposta precisa indicar uma decisão por artigo
- decisões aceitas: aprovado, aprovado com ajuste, pendente ou bloqueado
- "ok" genérico não aprova
- resposta ambígua mantém o artigo pendente

Critérios para Suporte/CS:
- o texto resolve dúvida real de cliente B2B?
- a linguagem está clara?
- o tom está adequado?
- a categoria pública faz sentido?
- evita expor operação interna?
- evita criar expectativa indevida?

Artigos para validar:
1. Como revisar os itens de uma solicitação
2. Como organizar motivos de troca e devolução na operação
3. Como enviar uma atualização de análise ao cliente
4. Como reenviar uma comunicação ao cliente
5. Formas de estorno disponíveis na operação
6. Como o prazo de postagem afeta a operação de troca e devolução
7. Como revisar uma pendência de logística reversa na operação
8. O que revisar quando o CEP ou endereço impede a postagem

Por favor responder neste formato:
- artigo:
- decisão:
- observação:
- ajustes necessários:
- o texto cria alguma expectativa indevida?
```

## Tabela de resposta esperada

| Artigo | Decisão Produto | Observação Produto | Decisão Suporte/CS | Observação Suporte/CS | Status final | Pode publicar |
| --- | --- | --- | --- | --- | --- | --- |
| Como revisar os itens de uma solicitação | pendente |  | pendente |  | pendente | não |
| Como organizar motivos de troca e devolução na operação | pendente |  | pendente |  | pendente | não |
| Como enviar uma atualização de análise ao cliente | pendente |  | pendente |  | pendente | não |
| Como reenviar uma comunicação ao cliente | pendente |  | pendente |  | pendente | não |
| Formas de estorno disponíveis na operação | pendente |  | pendente |  | pendente | não |
| Como o prazo de postagem afeta a operação de troca e devolução | pendente |  | pendente |  | pendente | não |
| Como revisar uma pendência de logística reversa na operação | pendente |  | pendente |  | pendente | não |
| O que revisar quando o CEP ou endereço impede a postagem | pendente |  | pendente |  | pendente | não |

## Encerramento do pacote

- nenhum artigo foi aprovado por este documento
- nenhuma aprovação foi simulada
- nenhum artigo foi publicado
- o próximo passo real é enviar este pacote para Produto e Suporte/CS
- depois das respostas, registrar evidências reais em `docs/knowledge/KNOWLEDGE_HUMAN_APPROVAL_REGISTER.md`
