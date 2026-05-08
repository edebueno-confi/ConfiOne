# Knowledge Prazo Postagem Rewrite

## Ficha editorial

- título legado de origem:
  - `Como Configurar o Prazo Logístico por Estado?`
- artigo candidato:
  - `Como o prazo de postagem afeta a operação de troca e devolução`
- categoria pública:
  - `Logística reversa e postagem`
- subcategoria futura opcional:
  - `Prazo logístico`
- público-alvo:
  - cliente B2B responsável pela operação de troca e devolução
- objetivo:
  - explicar, em alto nível, como o prazo de postagem afeta a janela operacional da troca e devolução e quais sinais indicam necessidade de revisão
- escopo coberto:
  - prazo de postagem e janela operacional
  - impacto do prazo na operação
  - sinais observáveis de expiração ou pendência
  - revisão de dados da solicitação antes de acionar suporte
- escopo fora do artigo:
  - integração com Correios
  - contrato, token e autorização técnica
  - código administrativo
  - procedimento interno de backoffice
  - execução manual de autorização de postagem
  - regra manual de não gerar logística reversa
  - configuração técnica de transportadora
- decisão atual:
  - `pendente`
- Produto:
  - `pendente`
- Suporte/CS:
  - `pendente`
- pode publicar:
  - `não`

## Versão candidata em markdown

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

## Checklist de validação humana específico

### Produto deve validar
- a nomenclatura atual de prazo de postagem está correta?
- o fluxo descrito existe hoje?
- o prazo é configurável por estado ou por outro critério no produto atual?
- há dependência de UI antiga no legado?
- algum ponto deveria permanecer interno?

### Suporte/CS deve validar
- o texto está claro para cliente B2B?
- o artigo resolve uma dúvida recorrente?
- o tom está adequado?
- a categoria pública está correta?
- o texto evita criar expectativa indevida de atendimento?

## Riscos e validações pendentes

- validar com `Produto` se o prazo continua sendo tratado por estado no produto atual ou se a regra mudou
- confirmar se o artigo não simplifica demais a relação entre prazo, pendência e revisão de dados
- revisar com `Suporte/CS` se a linguagem está clara sem virar tutorial interno
- manter fora do escopo qualquer detalhe de integração, contrato, token ou autorização técnica

## Decisão editorial pendente

- o artigo legado permanece apenas como origem histórica
- o candidato não substitui nada no produto nesta fase
- nenhuma publicação foi feita
- nenhuma aprovação foi simulada
- o candidato só poderá avançar após evidência humana real de `Produto` e `Suporte/CS`

