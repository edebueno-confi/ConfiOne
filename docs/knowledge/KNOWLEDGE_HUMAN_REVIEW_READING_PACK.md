# Knowledge Human Review Reading Pack

## Objetivo do pacote

Reunir, em um único documento, o texto completo dos `8` artigos candidatos da Knowledge Base para revisão humana de `Produto` e `Suporte/CS`.

Os artigos ainda não estão disponíveis no frontend. Este pacote existe para permitir leitura, comentário e decisão humana antes de qualquer lote futuro de publicação.

## Instrução de revisão

- leia o texto completo de cada artigo
- responda artigo por artigo
- decisões aceitas: `aprovado`, `aprovado com ajuste`, `pendente` ou `bloqueado`
- `ok` genérico não aprova
- resposta ambígua mantém o artigo `pendente`
- nenhum artigo pode publicar sem `Produto` + `Suporte/CS` aprovados com evidência explícita

## Índice

1. [Como revisar os itens de uma solicitação](#1-como-revisar-os-itens-de-uma-solicitação)
2. [Como organizar motivos de troca e devolução na operação](#2-como-organizar-motivos-de-troca-e-devolução-na-operação)
3. [Como enviar uma atualização de análise ao cliente](#3-como-enviar-uma-atualização-de-análise-ao-cliente)
4. [Como reenviar uma comunicação ao cliente](#4-como-reenviar-uma-comunicação-ao-cliente)
5. [Formas de estorno disponíveis na operação](#5-formas-de-estorno-disponíveis-na-operação)
6. [Como o prazo de postagem afeta a operação de troca e devolução](#6-como-o-prazo-de-postagem-afeta-a-operação-de-troca-e-devolução)
7. [Como revisar uma pendência de logística reversa na operação](#7-como-revisar-uma-pendência-de-logística-reversa-na-operação)
8. [O que revisar quando o CEP ou endereço impede a postagem](#8-o-que-revisar-quando-o-cep-ou-endereço-impede-a-postagem)

## 1. Como revisar os itens de uma solicitação

- categoria pública proposta: `Primeiros passos`
- subcategoria futura opcional: `Produtos da solicitação`
- status atual: `pendente`
- Produto: `pendente`
- Suporte/CS: `pendente`
- pode publicar: `não`
- origem documental: `docs/knowledge/KNOWLEDGE_P0_PUBLICATION_PREP.md`

### Texto completo candidato

```md
# Como revisar os itens de uma solicitacao

Em algumas etapas da operacao, pode ser necessario confirmar ou ajustar os itens vinculados a uma solicitacao antes de seguir com o atendimento.

## Quando usar esta etapa

Use essa revisao quando a solicitacao exigir validacao dos itens enviados ou quando for necessario corrigir a selecao antes de continuar o fluxo.

## Como seguir

1. Abra a solicitacao que precisa ser revisada.
2. Acesse a etapa operacional equivalente a revisao dos itens pendentes.
3. Verifique os itens disponiveis para analise.
4. Escolha a acao adequada para o seu caso:
   - aprovar os itens, quando a selecao estiver correta
   - ajustar os itens, quando houver necessidade de correcao

## Boas praticas

- revise os itens antes de concluir a etapa
- mantenha o historico da solicitacao consistente com a decisao tomada
- em caso de duvida operacional, valide o procedimento com o time responsavel antes de seguir

> Validar nomenclatura atual antes de publicar.
```

### Checklist Produto

- comportamento descrito está correto?
- nomenclatura atual está correta?
- fluxo existe hoje?
- há dependência de UI antiga?
- há risco técnico, financeiro, logístico ou operacional?
- algum trecho deve permanecer interno?

### Checklist Suporte/CS

- resolve dúvida real de cliente B2B?
- linguagem está clara?
- tom está adequado?
- categoria pública faz sentido?
- evita expor operação interna?
- evita criar expectativa indevida?

### Bloco de resposta

```md
- decisão Produto:
- observação Produto:
- decisão Suporte/CS:
- observação Suporte/CS:
- ajustes obrigatórios:
- status final:
- pode publicar:
```

## 2. Como organizar motivos de troca e devolução na operação

- categoria pública proposta: `Operação de trocas e devoluções`
- subcategoria futura opcional: `Motivos de troca`
- status atual: `pendente`
- Produto: `pendente`
- Suporte/CS: `pendente`
- pode publicar: `não`
- origem documental: `docs/knowledge/KNOWLEDGE_MOTIVOS_TROCA_DEVOLUCAO_REWRITE.md`

### Texto completo candidato

```md
# Como organizar motivos de troca e devolucao na operacao

Os motivos de troca e devolucao ajudam a organizar a triagem das solicitacoes e a manter a operacao mais consistente no dia a dia.

## Quando usar este artigo

Use este conteudo quando sua operacao precisar revisar como os motivos sao cadastrados, nomeados e classificados para apoiar a rotina de trocas e devolucoes.

## O que sao motivos de troca e devolucao

Motivos sao classificacoes usadas para identificar por que uma solicitacao foi aberta. Eles ajudam a diferenciar cenarios de troca e devolucao e facilitam a leitura operacional dos casos mais recorrentes.

## Por que organizar motivos ajuda a operacao

Uma estrutura clara de motivos ajuda a:

- padronizar a triagem das solicitacoes
- reduzir duplicidade de classificacoes
- facilitar a leitura do historico operacional
- apoiar comunicacoes mais consistentes entre os times

## Boas praticas para revisar motivos

- use nomes curtos, objetivos e faceis de reconhecer
- mantenha separada a classificacao entre troca e devolucao
- evite criar motivos muito genericos ou redundantes
- revise periodicamente os motivos mais usados para identificar sobreposicoes

## Cuidados antes de alterar motivos usados na operacao

Antes de criar, renomear ou reorganizar motivos, avalie se a mudanca continua coerente com a rotina atual da operacao.

Se houver duvida sobre nomenclatura, classificacao ou impacto do motivo no fluxo atual, trate o ponto como:

> Requer validacao.

## Quando acionar suporte

Acione o time responsavel quando houver duvida sobre:

- a classificacao correta entre troca e devolucao
- nomes que possam gerar ambiguidade na operacao
- comportamento atual da conta apos alteracoes de motivos

## Proximos passos relacionados

- revisar periodicamente os motivos mais usados
- alinhar nomenclatura com o time responsavel pela operacao
- validar internamente qualquer necessidade de regra adicional fora do escopo deste artigo

## Checklist antes de publicar

- a nomenclatura atual dos motivos foi validada
- o fluxo descrito ainda existe hoje
- o artigo nao expoe regra interna, financeira ou logistica
- a categoria publica continua correta
- nao ha dependencia de UI antiga
```

### Checklist Produto

- comportamento descrito está correto?
- nomenclatura atual está correta?
- fluxo existe hoje?
- há dependência de UI antiga?
- há risco técnico, financeiro, logístico ou operacional?
- algum trecho deve permanecer interno?

### Checklist Suporte/CS

- resolve dúvida real de cliente B2B?
- linguagem está clara?
- tom está adequado?
- categoria pública faz sentido?
- evita expor operação interna?
- evita criar expectativa indevida?

### Bloco de resposta

```md
- decisão Produto:
- observação Produto:
- decisão Suporte/CS:
- observação Suporte/CS:
- ajustes obrigatórios:
- status final:
- pode publicar:
```

## 3. Como enviar uma atualização de análise ao cliente

- categoria pública proposta: `Primeiros passos`
- subcategoria futura opcional: `Comunicação com cliente`
- status atual: `pendente`
- Produto: `pendente`
- Suporte/CS: `pendente`
- pode publicar: `não`
- origem documental: `docs/knowledge/KNOWLEDGE_P0_PUBLICATION_PREP.md`

### Texto completo candidato

```md
# Como enviar uma atualizacao de analise ao cliente

Quando uma solicitacao estiver em analise, a operacao pode registrar uma atualizacao para manter o cliente informado sobre o andamento do caso.

## Quando usar

Use essa comunicacao quando a analise exigir retorno intermediario ou quando for importante contextualizar a etapa atual da solicitacao.

## Como conduzir a mensagem

1. Revise o status atual da solicitacao.
2. Registre uma mensagem clara e objetiva sobre a analise em andamento.
3. Inclua apenas informacoes uteis para o entendimento da etapa atual.
4. Anexe materiais somente quando forem realmente necessarios para contextualizar a analise.

## Boas praticas

- explique a etapa sem prometer prazo ou decisao nao confirmada
- mantenha a mensagem curta e objetiva
- use anexos apenas quando ajudarem a esclarecer o caso

> Validar nomenclatura atual antes de publicar.
```

### Checklist Produto

- comportamento descrito está correto?
- nomenclatura atual está correta?
- fluxo existe hoje?
- há dependência de UI antiga?
- há risco técnico, financeiro, logístico ou operacional?
- algum trecho deve permanecer interno?

### Checklist Suporte/CS

- resolve dúvida real de cliente B2B?
- linguagem está clara?
- tom está adequado?
- categoria pública faz sentido?
- evita expor operação interna?
- evita criar expectativa indevida?

### Bloco de resposta

```md
- decisão Produto:
- observação Produto:
- decisão Suporte/CS:
- observação Suporte/CS:
- ajustes obrigatórios:
- status final:
- pode publicar:
```

## 4. Como reenviar uma comunicação ao cliente

- categoria pública proposta: `Operação de trocas e devoluções`
- subcategoria futura opcional: `Comunicação com cliente`
- status atual: `pendente`
- Produto: `pendente`
- Suporte/CS: `pendente`
- pode publicar: `não`
- origem documental: `docs/knowledge/KNOWLEDGE_P0_PUBLICATION_PREP.md`

### Texto completo candidato

```md
# Como reenviar uma comunicacao ao cliente

Se uma mensagem anterior precisar ser enviada novamente, a operacao pode reenviar a comunicacao vinculada a uma solicitacao.

## Quando usar

- quando o cliente nao localizou a mensagem anterior
- quando a operacao precisa reforcar uma orientacao ja enviada

## Como conduzir o reenvio

1. Abra a solicitacao correta.
2. Revise o historico de comunicacao antes de reenviar.
3. Confirme se a mensagem ainda esta atualizada para o contexto do caso.
4. Reenvie a comunicacao somente quando isso fizer sentido para o andamento da solicitacao.

## Boas praticas

- evite reenviar mensagens desatualizadas
- confirme se o conteudo ainda representa a etapa atual
- mantenha o historico coerente com as acoes mais recentes

> Validar nomenclatura atual antes de publicar.
```

### Checklist Produto

- comportamento descrito está correto?
- nomenclatura atual está correta?
- fluxo existe hoje?
- há dependência de UI antiga?
- há risco técnico, financeiro, logístico ou operacional?
- algum trecho deve permanecer interno?

### Checklist Suporte/CS

- resolve dúvida real de cliente B2B?
- linguagem está clara?
- tom está adequado?
- categoria pública faz sentido?
- evita expor operação interna?
- evita criar expectativa indevida?

### Bloco de resposta

```md
- decisão Produto:
- observação Produto:
- decisão Suporte/CS:
- observação Suporte/CS:
- ajustes obrigatórios:
- status final:
- pode publicar:
```

## 5. Formas de estorno disponíveis na operação

- categoria pública proposta: `Estornos e reembolsos`
- subcategoria futura opcional: `Formas de estorno`
- status atual: `pendente`
- Produto: `pendente`
- Suporte/CS: `pendente`
- pode publicar: `não`
- origem documental: `docs/knowledge/KNOWLEDGE_ESTORNO_CANONICAL_REWRITE.md`

### Texto completo candidato

```md
# Formas de estorno disponíveis na operação

Entenda quais formas de estorno podem fazer parte da operação da sua conta e quais pontos precisam ser avaliados antes de revisar essa configuração.

## Quando usar este artigo

Use este artigo quando sua operação precisar revisar quais formas de estorno devem ficar disponíveis para o time responsável pela gestão de trocas e devoluções.

Este conteúdo serve como orientação inicial para tomada de decisão operacional. Ele não substitui validação técnica, política financeira ou revisão de configuração específica da conta.

## Visão geral das formas de estorno

Dependendo da configuração da operação, a conta pode trabalhar com mais de uma forma de estorno.

No legado auditado, aparecem como exemplos:
- estorno por conta bancária
- estorno por conta bancária e Pix
- estorno apenas por Pix

> Requer validação: o conjunto exato de opções disponíveis hoje precisa ser confirmado pelo time de Produto antes de qualquer publicação.

## Pontos de atenção antes de revisar a configuração

- confirme se a forma de estorno escolhida faz sentido para a política operacional da conta
- valide se a combinação disponível está alinhada ao fluxo financeiro acordado internamente
- evite assumir que toda forma citada no legado continua ativa no produto atual
- trate qualquer referência a Pix apenas como contexto preliminar, não como regra técnica consolidada neste artigo

## O que validar com o time responsável

Antes de transformar este conteúdo em artigo público aprovado, valide:
- o nome atual da funcionalidade
- quais formas de estorno continuam disponíveis hoje
- se o artigo deve falar apenas de formas manuais
- se temas como Pix, vale-compra ou política por motivo precisam ficar em artigos separados

## Quando acionar suporte

Acione o suporte operacional quando:
- a conta precisar confirmar qual orientação usar antes de revisar a configuração
- houver dúvida sobre qual forma de estorno faz sentido para o fluxo da operação
- a orientação disponível internamente não estiver clara ou estiver desatualizada

Este artigo não cobre troubleshooting técnico nem validações financeiras detalhadas.

## Próximos passos relacionados

- revisar a nomenclatura atual da funcionalidade com Produto
- confirmar com Suporte/CS se o texto responde a uma dúvida recorrente de cliente B2B
- decidir se Pix deve permanecer apenas como referência contextual ou migrar para artigo específico
- manter vale-compra, cálculo, limites e políticas financeiras fora deste canônico

## Checklist antes de publicar

- Produto validou a nomenclatura atual?
- Produto confirmou o escopo real da funcionalidade?
- Produto confirmou que o artigo não invade trilhas de Pix, vale-compra ou política financeira?
- Suporte/CS validou a clareza para cliente B2B?
- O texto evita navegação interna literal e screenshot interno?
- O texto não cria expectativa indevida de atendimento ou comportamento técnico?
- O artigo continua classificado como `pendente` até evidência humana real?
```

### Checklist Produto

- comportamento descrito está correto?
- nomenclatura atual está correta?
- fluxo existe hoje?
- há dependência de UI antiga?
- há risco técnico, financeiro, logístico ou operacional?
- algum trecho deve permanecer interno?

### Checklist Suporte/CS

- resolve dúvida real de cliente B2B?
- linguagem está clara?
- tom está adequado?
- categoria pública faz sentido?
- evita expor operação interna?
- evita criar expectativa indevida?

### Bloco de resposta

```md
- decisão Produto:
- observação Produto:
- decisão Suporte/CS:
- observação Suporte/CS:
- ajustes obrigatórios:
- status final:
- pode publicar:
```

## 6. Como o prazo de postagem afeta a operação de troca e devolução

- categoria pública proposta: `Logística reversa e postagem`
- subcategoria futura opcional: `Prazo logístico`
- status atual: `pendente`
- Produto: `pendente`
- Suporte/CS: `pendente`
- pode publicar: `não`
- origem documental: `docs/knowledge/KNOWLEDGE_PRAZO_POSTAGEM_REWRITE.md`

### Texto completo candidato

```md
# Como o prazo de postagem afeta a operação de troca e devolução

O prazo de postagem influencia quando uma solicitação pode seguir normalmente na operação e quando ela precisa ser revisada com mais atenção.

## Resumo público

Em operações de troca e devolução, o prazo de postagem ajuda a definir a janela em que o envio ainda está dentro do fluxo esperado. Quando esse prazo não está coerente com a operação, podem surgir pendências, revisões manuais ou dúvidas sobre o andamento da solicitação.

## Quando usar este artigo

Use este artigo quando sua operação precisar entender, em alto nível, como o prazo de postagem impacta a rotina de trocas e devoluções e quando vale revisar os dados da solicitação antes de acionar suporte.

## O que é prazo de postagem na operação

Prazo de postagem é o intervalo operacional considerado para que a devolução ou troca siga dentro do fluxo esperado da conta.

No legado auditado, esse prazo aparece ligado à gestão logística da solicitação e à análise da janela em que a postagem ainda pode acontecer sem gerar inconsistências operacionais.

> Requer validação: a nomenclatura exata e o critério atual usado no produto precisam ser confirmados por Produto antes de qualquer publicação.

## Por que o prazo impacta troca e devolução

Quando o prazo está adequado à realidade da operação, fica mais fácil:

- manter a leitura correta do andamento da solicitação
- reduzir pendências ligadas ao envio
- evitar interpretações erradas sobre atraso ou expiração
- orientar melhor a revisão de dados antes de escalar um caso

## Sinais de que o prazo precisa ser revisado

Alguns sinais observáveis podem indicar que vale revisar o prazo ou os dados envolvidos na solicitação:

- a postagem não avança como esperado
- a solicitação entra em pendência ligada ao envio
- há dúvida sobre a validade operacional do envio
- dados de endereço ou CEP precisam ser conferidos antes da continuidade

Este artigo não substitui análise técnica nem validação interna de configuração.

## Cuidados antes de acionar suporte

Antes de acionar suporte, vale revisar:

- se o prazo considerado pela operação está coerente com o fluxo atual
- se os dados principais da solicitação estão corretos
- se há algum sinal de pendência operacional ligado ao envio
- se a dúvida é de prazo operacional ou de outro tema fora do escopo deste artigo

Se houver incerteza sobre o comportamento atual da conta, trate o ponto como:

> Requer validação.

## Quando acionar suporte

Acione o suporte quando:

- a operação não conseguir concluir se a pendência está ligada ao prazo ou aos dados da solicitação
- houver repetição de pendências de postagem sem causa clara
- o comportamento observado parecer diferente do fluxo esperado pela conta

## Próximos passos relacionados

- revisar periodicamente os critérios usados na operação para prazo de postagem
- alinhar nomenclatura e comportamento atual com o time responsável
- tratar em artigos separados qualquer tema de integração, contrato ou autorização técnica

## Checklist antes de publicar

- a nomenclatura atual de prazo de postagem foi validada?
- o fluxo descrito continua existindo no produto atual?
- o texto evita expor integração, contrato ou autorização técnica?
- o artigo evita instruções de backoffice?
- a categoria pública continua correta?
- o conteúdo permanece em `pendente` até evidência humana real?
```

### Checklist Produto

- comportamento descrito está correto?
- nomenclatura atual está correta?
- fluxo existe hoje?
- há dependência de UI antiga?
- há risco técnico, financeiro, logístico ou operacional?
- algum trecho deve permanecer interno?

### Checklist Suporte/CS

- resolve dúvida real de cliente B2B?
- linguagem está clara?
- tom está adequado?
- categoria pública faz sentido?
- evita expor operação interna?
- evita criar expectativa indevida?

### Bloco de resposta

```md
- decisão Produto:
- observação Produto:
- decisão Suporte/CS:
- observação Suporte/CS:
- ajustes obrigatórios:
- status final:
- pode publicar:
```

## 7. Como revisar uma pendência de logística reversa na operação

- categoria pública proposta: `Logística reversa e postagem`
- subcategoria futura opcional: `Pendências de postagem`
- status atual: `pendente`
- Produto: `pendente`
- Suporte/CS: `pendente`
- pode publicar: `não`
- origem documental: `docs/knowledge/KNOWLEDGE_PENDENCIA_LOGISTICA_REVERSA_REWRITE.md`

### Texto completo candidato

```md
# Como revisar uma pendência de logística reversa na operação

Pendências de logística reversa costumam indicar que a solicitação precisa de uma revisão operacional antes de seguir para a próxima etapa do envio.

## Resumo público

Quando uma solicitação entra em pendência de logística reversa, isso normalmente sinaliza que ainda existe algum dado ou condição operacional a revisar. Antes de escalar o caso, vale checar se as informações básicas da solicitação estão coerentes com o fluxo esperado da operação.

## Quando usar este artigo

Use este artigo quando sua operação identificar uma pendência ligada à postagem de troca ou devolução e precisar entender, em alto nível, o que conferir antes de acionar suporte.

## O que é uma pendência de logística reversa

Pendência de logística reversa é um estado operacional que indica que a solicitação ainda não conseguiu seguir normalmente para a etapa de postagem.

No legado auditado, esse tipo de pendência aparece associado à necessidade de revisar informações da solicitação antes da continuidade do fluxo.

> Requer validação: o comportamento exato e a nomenclatura atual precisam ser confirmados no produto antes de qualquer publicação.

## Sinais observáveis de pendência

Alguns sinais podem indicar que a solicitação precisa de revisão:

- a postagem não avança como esperado
- existe uma sinalização operacional de pendência ligada ao envio
- há dúvida sobre informações da solicitação que podem impactar a continuidade
- o caso depende de conferência de dados antes de seguir

## Pontos seguros para revisar antes de acionar suporte

Antes de escalar o caso, vale conferir:

- se os dados principais da solicitação estão atualizados
- se CEP, endereço ou contato parecem coerentes com a operação
- se a dúvida está ligada ao andamento da postagem e não a integração ou contrato
- se existe algum fator operacional evidente que justifique a pendência

Este artigo não substitui análise técnica nem orientação interna de suporte avançado.

## O que não deve ser alterado sem orientação

Sem validação do time responsável, evite transformar em procedimento padrão:

- ações internas de backoffice
- geração manual de autorização de postagem
- regras internas de exceção logística
- qualquer ajuste ligado a integração, contrato ou autorização técnica

## Quando acionar suporte

Acione o suporte quando:

- a pendência continuar sem causa clara após a revisão básica
- o caso se repetir com frequência na operação
- houver dúvida sobre se o problema está no dado da solicitação ou em uma regra interna do fluxo

## Próximos passos relacionados

- revisar também o prazo de postagem quando a pendência vier acompanhada de dúvida sobre validade operacional
- conferir dados de CEP e endereço se houver indício de bloqueio cadastral
- tratar temas de integração e autorização técnica em trilha separada

## Checklist antes de publicar

- a nomenclatura atual de pendência de logística reversa foi validada?
- o fluxo descrito continua existindo no produto atual?
- o texto evita instruções internas de backoffice?
- o artigo não transforma ação manual em orientação pública padrão?
- a categoria pública continua correta?
- o conteúdo permanece em `pendente` até evidência humana real?
```

### Checklist Produto

- comportamento descrito está correto?
- nomenclatura atual está correta?
- fluxo existe hoje?
- há dependência de UI antiga?
- há risco técnico, financeiro, logístico ou operacional?
- algum trecho deve permanecer interno?

### Checklist Suporte/CS

- resolve dúvida real de cliente B2B?
- linguagem está clara?
- tom está adequado?
- categoria pública faz sentido?
- evita expor operação interna?
- evita criar expectativa indevida?

### Bloco de resposta

```md
- decisão Produto:
- observação Produto:
- decisão Suporte/CS:
- observação Suporte/CS:
- ajustes obrigatórios:
- status final:
- pode publicar:
```

## 8. O que revisar quando o CEP ou endereço impede a postagem

- categoria pública proposta: `Erros conhecidos e troubleshooting`
- subcategoria futura opcional: `Endereço e CEP`
- status atual: `pendente`
- Produto: `pendente`
- Suporte/CS: `pendente`
- pode publicar: `não`
- origem documental: `docs/knowledge/KNOWLEDGE_CEP_ENDERECO_POSTAGEM_REWRITE.md`

### Texto completo candidato

```md
# O que revisar quando o CEP ou endereço impede a postagem

Problemas de CEP ou endereço podem impedir o avanço normal da postagem em solicitações de troca e devolução.

## Resumo público

Quando os dados de endereço não estão coerentes com o fluxo esperado da solicitação, a operação pode encontrar bloqueios para seguir com a postagem. Antes de escalar o caso, vale revisar as informações básicas envolvidas no envio.

## Quando usar este artigo

Use este artigo quando sua operação identificar que a postagem não avançou por possível inconsistência de CEP ou endereço e precisar entender o que revisar de forma segura.

## Como dados de endereço podem impactar a postagem

CEP, UF, cidade, número ou outras informações de endereço podem interferir no andamento da postagem quando estão incompletos, inconsistentes ou divergentes do fluxo esperado da conta.

No legado auditado, esse tipo de problema aparece relacionado a pendências operacionais de logística reversa.

> Requer validação: o comportamento atual e a nomenclatura exibida no produto precisam ser confirmados antes de qualquer publicação.

## Sinais observáveis de problema de CEP ou endereço

Alguns sinais podem indicar esse tipo de problema:

- a postagem não avança mesmo com a solicitação aberta corretamente
- existe sinalização de pendência ligada ao envio
- há dúvida sobre consistência de CEP ou endereço
- dados do remetente ou do destinatário parecem incompletos ou incoerentes

## Pontos seguros para revisar antes de acionar suporte

Antes de acionar suporte, vale revisar:

- se o CEP informado parece válido
- se endereço, UF e demais dados principais estão coerentes
- se há divergência visível entre os dados usados na solicitação e os dados esperados pela operação
- se a dúvida é cadastral ou se já envolve tema técnico fora do escopo deste artigo

## Cuidados ao alterar dados de uma solicitação

Este artigo não transforma alteração manual de dados em procedimento público padrão.

Antes de qualquer mudança operacional, confirme:

- se a operação tem clareza sobre qual dado está incorreto
- se a correção não depende de procedimento interno específico
- se o caso não exige orientação do time responsável

Se houver incerteza sobre o comportamento atual da conta, trate o ponto como:

> Requer validação.

## Quando acionar suporte

Acione o suporte quando:

- os dados já foram revisados e a postagem continua bloqueada
- não estiver claro se o problema é realmente cadastral
- o caso se repetir em mais de uma solicitação sem causa evidente

## Próximos passos relacionados

- revisar também o prazo de postagem se existir dúvida sobre validade operacional
- consultar o artigo de pendência de logística reversa quando houver sinalização mais ampla do fluxo
- tratar integração, contrato e autorização técnica apenas em trilha separada

## Checklist antes de publicar

- a nomenclatura atual do problema foi validada?
- o fluxo descrito continua existindo no produto atual?
- o texto evita ensinar procedimento interno de alteração manual?
- o artigo não promete correção automática?
- a categoria pública continua correta?
- o conteúdo permanece em `pendente` até evidência humana real?
```

### Checklist Produto

- comportamento descrito está correto?
- nomenclatura atual está correta?
- fluxo existe hoje?
- há dependência de UI antiga?
- há risco técnico, financeiro, logístico ou operacional?
- algum trecho deve permanecer interno?

### Checklist Suporte/CS

- resolve dúvida real de cliente B2B?
- linguagem está clara?
- tom está adequado?
- categoria pública faz sentido?
- evita expor operação interna?
- evita criar expectativa indevida?

### Bloco de resposta

```md
- decisão Produto:
- observação Produto:
- decisão Suporte/CS:
- observação Suporte/CS:
- ajustes obrigatórios:
- status final:
- pode publicar:
```

## Encerramento

- este pacote consolida o texto completo dos `8` artigos candidatos
- nenhum artigo foi aprovado por este documento
- nenhuma aprovação foi simulada
- nenhum artigo foi publicado
- as respostas formais devem ser registradas em `docs/knowledge/KNOWLEDGE_HUMAN_APPROVAL_REGISTER.md`
