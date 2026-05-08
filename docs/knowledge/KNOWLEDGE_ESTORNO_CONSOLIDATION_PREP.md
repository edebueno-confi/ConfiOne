# Knowledge Estorno Consolidation Prep

## Objetivo

- Tratar documentalmente a duplicidade confirmada do cluster `Formas de Estorno`.
- Definir um plano editorial de consolidação para um artigo canônico futuro, sem publicar, sem aprovar e sem alterar o corpus legado bruto.
- Registrar o que deve ser herdado, revisado ou descartado antes de qualquer lote de reescrita.

## Escopo desta fase

- comparação dos dois artigos legados duplicados
- proposta de artigo canônico
- matriz de decisão de consolidação
- registro de riscos e dependências de validação

## Estado editorial atual

- status do artigo canônico: `pendente`
- Produto: `pendente`
- Suporte/CS: `pendente`
- pode publicar: `não`
- publicação pública: `bloqueada até revisão humana explícita`

## Artigos comparados

### 1. Como configurar as formas de Estorno
- caminho fonte: `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-como-configurar-as-formas-de-estorno`
- categoria original: `Configurações / Configuração de ambiente`
- resumo do conteúdo:
  - orienta a acessar a área de ambiente da plataforma
  - aponta a funcionalidade `Formas de Estorno`
  - lista exemplos de formas manuais de estorno:
    - conta bancária
    - conta bancária + Pix
    - apenas Pix
  - termina com recomendação genérica para alinhar o reembolso à operação
- sinais do legado:
  - texto usa navegação de menu interna em caixa alta
  - depende de screenshot interno
  - ainda fala em `painel Admin`

### 2. Configurando as Formas de Estorno
- caminho fonte: `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-configurando-as-formas-de-estorno`
- categoria original: `Configurações / Configuração de ambiente`
- resumo do conteúdo:
  - repete o mesmo passo a passo de acesso à funcionalidade
  - repete as mesmas três formas manuais de estorno
  - repete a orientação genérica de adequar o processo de reembolso à operação
- sinais do legado:
  - texto usa a mesma navegação de menu interna
  - depende de screenshot interno
  - preserva a mesma estrutura de redação

## Comparação objetiva

### Pontos iguais
- o corpo em `content.txt` é idêntico byte a byte nos dois artigos
- o título interno exibido no texto é o mesmo: `Configurando as Formas de Estorno`
- os passos operacionais são os mesmos
- os exemplos de formas de estorno são os mesmos
- a orientação final de adequação do processo é a mesma
- ambos pertencem ao mesmo domínio editorial: `Estornos e reembolsos`

### Pontos divergentes
- o slug e o título cadastrado divergem:
  - `Como configurar as formas de Estorno`
  - `Configurando as Formas de Estorno`
- o `content.raw.html` não é idêntico:
  - muda o `docs-internal-guid`
  - muda a imagem embedada
  - muda o detalhe visual da `Dica`
- os metadados de publicação divergem:
  - datas de publicação diferentes
  - `lastPublishedBy.name` com variação de nome

### Pontos obsoletos ou ambíguos
- referência direta ao `painel Admin`
- navegação literal `CONFIGURAÇÕES > AMBIENTE > ESTORNO/VALE-COMPRA`
- dependência de screenshot interno como parte da explicação
- uso de `Pix` dentro do mesmo texto sem separar se o artigo cobre apenas formas manuais ou também regras específicas de estorno automático
- frase final ampla demais sobre `experiência do cliente`, sem delimitar o que é orientação pública e o que é decisão interna da operação

## Riscos identificados

### Riscos técnicos
- o artigo mistura configuração operacional com possíveis meios de estorno que têm dependências técnicas e financeiras próprias
- a menção a `Pix` pode conflitar com artigos mais específicos do cluster de estorno
- a navegação por menu pode estar desatualizada em relação à UI atual

### Riscos de exposição interna
- expõe caminho interno de configuração como se fosse instrução pública pronta
- o screenshot legado pode revelar detalhes internos de interface
- o texto não separa claramente o que é orientação pública do que é setup interno da conta

### Dependências de validação Produto
- confirmar se o fluxo e a nomenclatura atual da funcionalidade continuam válidos
- confirmar se `Pix` deve aparecer neste artigo canônico ou ficar restrito a artigo técnico específico
- confirmar se o artigo deve falar apenas de formas manuais ou de toda a política de estorno

### Dependências de validação Suporte/CS
- confirmar se o texto responde a uma dúvida real recorrente de cliente B2B
- revisar o tom para ficar operacional e não depender de nomes internos de tela
- confirmar se a categoria pública proposta é a mais clara para descoberta na Central de Ajuda

## Proposta de artigo canônico

- título público candidato: `Formas de estorno disponíveis na operação`
- categoria pública: `Estornos e reembolsos`
- subcategoria futura opcional: `Formas de estorno`
- objetivo do artigo:
  - explicar quais formas de estorno podem ser usadas na operação e quando revisar essa configuração antes de definir a política da conta
- público-alvo:
  - cliente B2B responsável pela operação ou configuração funcional da conta
- escopo coberto:
  - visão geral das formas de estorno disponíveis
  - contexto operacional de escolha
  - cuidados básicos antes de ativar uma forma de estorno
- escopo fora do artigo:
  - estorno automático via Pix
  - vale-compra e retenção
  - cálculo de estorno
  - políticas por motivo
  - limites financeiros ou automação
  - troubleshooting técnico

## Estrutura sugerida para o artigo canônico

1. Quando revisar as formas de estorno da operação
2. Quais formas de estorno podem estar disponíveis
3. Como decidir a combinação mais adequada para a conta
4. Cuidados antes de aplicar a configuração
5. Quando acionar revisão interna ou suporte operacional

## Herança editorial sugerida

### Pontos que devem ser herdados dos dois artigos legados
- existência da funcionalidade de `Formas de Estorno`
- exemplos centrais de combinação de estorno:
  - conta bancária
  - conta bancária + Pix
  - apenas Pix
- recomendação de alinhar a escolha com a operação da conta

### Pontos que devem ser descartados ou revisados
- título duplicado em duas versões quase iguais
- navegação rígida por menu interno
- screenshot interno
- qualquer linguagem que sugira publicação direta sem curadoria
- menção genérica a `experiência do cliente` sem contexto B2B objetivo
- qualquer leitura que misture formas manuais com automação, política financeira ou integração específica

## Matriz de decisão de consolidação

| Item/conteúdo | Origem | Manter | Revisar | Descartar | Motivo | Validação necessária |
| --- | --- | --- | --- | --- | --- | --- |
| Conceito de `Formas de Estorno` como funcionalidade | ambos os artigos | sim | não | não | é o núcleo comum do tema canônico | Produto |
| Exemplo `conta bancária` | ambos os artigos | sim | sim | não | útil para contexto, mas precisa confirmação funcional atual | Produto |
| Exemplo `conta bancária + Pix` | ambos os artigos | sim | sim | não | útil, porém sensível por tocar Pix | Produto |
| Exemplo `apenas Pix` | ambos os artigos | sim | sim | não | pode ficar no canônico se não conflitar com artigo técnico específico | Produto |
| Caminho interno `CONFIGURAÇÕES > AMBIENTE > ESTORNO/VALE-COMPRA` | ambos os artigos | não | sim | não | depende de nomenclatura e UI atuais | Produto |
| Referência ao `painel Admin` | ambos os artigos | não | sim | não | linguagem interna e potencialmente desatualizada | Produto |
| Screenshot interno embutido | ambos os artigos | não | não | sim | não deve ir para artigo público sem curadoria visual explícita | Produto |
| Frase ampla sobre `experiência do cliente` | ambos os artigos | não | sim | não | precisa virar orientação B2B mais objetiva | Suporte/CS |
| Estrutura em passo a passo rígido de menu | ambos os artigos | não | sim | não | deve virar orientação mais estável e menos dependente de UI | Produto + Suporte/CS |
| Dica final sobre revisar formas compatíveis com meios de pagamento | ambos os artigos | sim | sim | não | ideia útil, mas precisa delimitação editorial | Produto + Suporte/CS |
| Título `Como configurar as formas de Estorno` | artigo 1 | não | sim | não | pode informar naming legado, mas não deve ser o título público final | Editorial |
| Título `Configurando as Formas de Estorno` | artigo 2 | não | sim | não | mesmo problema de naming e duplicidade | Editorial |

## Decisão editorial desta fase

- a duplicidade foi tratada documentalmente
- o artigo canônico futuro recomendado é `Formas de estorno disponíveis na operação`
- os dois artigos legados permanecem no corpus histórico
- nenhuma consolidação foi aplicada automaticamente no banco ou no conteúdo publicado
- nenhum artigo foi aprovado
- nenhum artigo foi publicado
- a versão candidata reescrita do canônico ficou registrada em:
  - `docs/knowledge/KNOWLEDGE_ESTORNO_CANONICAL_REWRITE.md`

## Próximo passo recomendado para este cluster

- abrir um lote de reescrita editorial específico para `Estornos e reembolsos`, começando pelo artigo canônico proposto
- submeter o canônico a validação de `Produto` e `Suporte/CS` antes de qualquer preparação de publicação
- manter `Pix`, automação, vale-compra e políticas financeiras em trilhas separadas enquanto a revisão técnica não estiver concluída
- o mapa desses subclusters sensíveis ficou registrado em:
  - `docs/knowledge/KNOWLEDGE_ESTORNO_SENSITIVE_SUBCLUSTERS.md`
