# LEGACY_CORPUS_P0_REWRITE_CANDIDATES.md

## Objetivo
Registrar a primeira leva de reescrita humana dos artigos `P0` do corpus legado, sem publicar nada e sem alterar a base pública atual. Este documento gera versões candidatas para validação de produto, suporte/CS e elegibilidade pública.

## Escopo desta entrega
- leitura do conteúdo bruto legado
- reescrita editorial em PT-BR com tom B2B
- normalização de título, categoria e resumo
- sinalização de riscos, dúvidas e validações pendentes

## Regras aplicadas
- não inferir comportamento não descrito no artigo original
- não prometer fluxo inexistente
- não expor detalhe técnico ou operacional sensível
- quando o legado for insuficiente ou ambíguo, marcar `Requer validação`
- manter o cliente B2B como público principal

## Rastro de curadoria posterior
- o gate humano formal desta leva ficou registrado em:
  - `docs/knowledge/KNOWLEDGE_P0_HUMAN_REVIEW_GATE.md`
- o pacote documental de pré-publicação dos quatro elegíveis ficou registrado em:
  - `docs/knowledge/KNOWLEDGE_P0_PUBLICATION_PREP.md`

## Artigos P0 localizados

| Título original | Caminho fonte | Categoria original | Resumo do conteúdo encontrado | Riscos editoriais | Dependências de revisão |
| --- | --- | --- | --- | --- | --- |
| Como alterar ou aprovar os produtos de uma solicitação? | `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-como-alterar-ou-aprovar-os-produtos-de-uma-solicitacao` | `Configurações / Configuração de ambiente` | orienta abrir uma solicitação, entrar em `Ações Pendentes` e usar `Aprovar Todos` ou `Alterar Produto(s)` | usa linguagem B2C (`consumidor`), depende de UI interna e cita contatos legados de suporte | suporte/CS para tom; produto para aderência do fluxo atual |
| Como cadastrar motivos para troca ou devolução | `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-como-cadastrar-motivos-para-troca-ou-devolucao` | `Configurações / Configuração de ambiente` | explica como acessar `Motivos`, listar motivos existentes e cadastrar novo motivo com nome e tipo | depende de navegação interna e de nomenclatura de tela; ainda fala em `painel Admin` | suporte/CS para clareza; produto para nomenclatura atual |
| Como informar a SKU durantge a troca | `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-como-informar-a-sku-durantge-a-troca` | `Configurações / Configuração de ambiente` | informa que existe uma permissão para permitir que o cliente escreva ou cole a SKU/link do item na troca | conteúdo muito curto, com ortografia ruim e comportamento pouco detalhado; alta dependência de configuração interna | produto para confirmar comportamento; suporte/CS para clareza operacional |
| Posso enviar uma notificação de análise ao cliente? | `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-posso-enviar-uma-notificacao-de-analise-ao-cliente` | `Configurações / Configuração de ambiente` | diz que é possível enviar notificação sobre produtos em análise, com comentário, imagem e arquivo | depende de UI interna e não explica critérios de uso; pode exigir alinhamento de tom com comunicação ao cliente | suporte/CS para linguagem; produto para validar anexos e contexto |
| Reenviar um e-mail ao consumidor | `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-reenviar-um-e-mail-ao-consumidor` | `Configurações / Configuração de ambiente` | orienta abrir a solicitação e usar `Reenviar` na aba `Comunicação` | título B2C, conteúdo mínimo e dependente de nomenclatura interna | suporte/CS para uso real; produto para confirmar contexto da ação |
| Regra por motivo | `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-regra-por-motivo` | `Configurações / Configuração de ambiente` | explica como localizar um motivo e habilitar uma ação para aquele motivo específico | conteúdo abstrato e genérico; não deixa claro quais regras existem nem impacto operacional | produto para escopo funcional; suporte/CS para linguagem e exemplos |

## Relações temáticas já mapeadas
- `Como cadastrar motivos para troca ou devolução` e `Regra por motivo` pertencem ao mesmo grupo operacional e devem ser revisados em conjunto.
- `Como informar a SKU durantge a troca` se conecta ao grupo de trocas e devoluções, mas ainda depende de validação de comportamento antes de qualquer promoção para público.
- `Posso enviar uma notificação de análise ao cliente?` e `Reenviar um e-mail ao consumidor` tratam de comunicação operacional e devem seguir o mesmo padrão de voz.

## Candidatos de reescrita

### 1. Como alterar ou aprovar os produtos de uma solicitação?

**Leitura editorial**
- título original: `Como alterar ou aprovar os produtos de uma solicitação?`
- categoria original: `Configurações / Configuração de ambiente`
- jornada operacional sugerida: `Primeiros passos`
- público-alvo recomendado: `cliente B2B`
- relação temática: articula com a trilha de triagem operacional da solicitação

**Título público sugerido**
- `Como revisar os itens de uma solicitação`

**Categoria pública sugerida**
- `Primeiros passos`

**Resumo curto**
- `Entenda quando revisar os itens de uma solicitação e como seguir com a aprovação ou ajuste antes de avançar no atendimento.`

**Corpo candidato em markdown**
```md
# Como revisar os itens de uma solicitação

Em algumas etapas da operação, pode ser necessário confirmar ou ajustar os itens vinculados a uma solicitação antes de seguir com o atendimento.

## Quando usar esta etapa

Use essa revisão quando a solicitação exigir validação dos itens enviados ou quando for necessário corrigir a seleção antes de continuar o fluxo.

## Como seguir

1. Abra a solicitação que precisa ser revisada.
2. Acesse a área de ações pendentes da solicitação.
3. Verifique os itens disponíveis para análise.
4. Escolha a ação adequada para o seu caso:
   - aprovar todos os itens, quando a seleção estiver correta
   - ajustar os itens, quando houver necessidade de correção

## Boas práticas

- revise os itens antes de concluir a etapa
- mantenha o histórico da solicitação consistente com a decisão tomada
- em caso de dúvida operacional, valide o procedimento com o time responsável antes de seguir
```

**Pré-requisitos**
- existir uma solicitação em andamento
- existir etapa operacional equivalente a `ações pendentes`

**Passos operacionais presentes no original**
- abrir `Solicitações`
- abrir a solicitação desejada
- usar `Aprovar Todos` ou `Alterar Produto(s)`

**Observações de risco**
- `Requer validação`: confirmar se a ação continua disponível com os mesmos nomes
- remover referência a contatos legados de suporte no texto final

**Checklist de revisão final**
- validar nomenclatura atual da etapa
- validar se a decisão pode ser descrita sem screenshots internos
- revisar tom para cliente B2B

**Decisão recomendada**
- `candidato a público`

### 2. Como cadastrar motivos para troca ou devolução

**Leitura editorial**
- título original: `Como cadastrar motivos para troca ou devolução`
- categoria original: `Configurações / Configuração de ambiente`
- jornada operacional sugerida: `Operação de trocas e devoluções`
- público-alvo recomendado: `cliente B2B`
- relação temática: base para `Regra por motivo`

**Título público sugerido**
- `Como organizar motivos de troca e devolução na operação`

**Categoria pública sugerida**
- `Operação de trocas e devoluções`

**Resumo curto**
- `Saiba como estruturar os motivos de troca e devolução para apoiar a triagem, a comunicação e o tratamento correto de cada solicitação.`

**Corpo candidato em markdown**
```md
# Como organizar motivos de troca e devolução na operação

Os motivos de troca e devolução ajudam a padronizar a triagem das solicitações e a orientar o tratamento adequado de cada caso.

## O que definir em cada motivo

Ao revisar ou cadastrar um motivo, garanta que ele tenha:

- um nome claro e fácil de reconhecer
- o tipo correto da ocorrência
- um uso operacional bem definido

## Como aplicar na rotina

1. Revise os motivos já existentes na operação.
2. Identifique se há lacunas, duplicidades ou nomes pouco claros.
3. Quando necessário, cadastre um novo motivo com nome objetivo e classificação adequada.
4. Evite criar motivos muito genéricos ou redundantes.

## Boas práticas

- use nomes curtos e operacionais
- mantenha a diferença entre troca e devolução clara
- revise periodicamente os motivos mais usados para evitar sobreposição
```

**Pré-requisitos**
- acesso à gestão de motivos da operação

**Passos operacionais presentes no original**
- abrir `Configurações`
- acessar `Motivos`
- listar motivos existentes
- cadastrar novo motivo com nome e tipo

**Observações de risco**
- `Requer validação`: confirmar nomenclatura atual de tela e se o cadastro continua separado por tipo

**Checklist de revisão final**
- revisar terminologia de `troca` e `devolução`
- validar se a classificação ainda é binária no produto atual
- revisar com suporte/CS exemplos de nomes inadequados

**Decisão recomendada**
- `candidato a público`

### 3. Como informar a SKU durantge a troca

**Leitura editorial**
- título original: `Como informar a SKU durantge a troca`
- categoria original: `Configurações / Configuração de ambiente`
- jornada operacional sugerida: `Operação de trocas e devoluções`
- público-alvo recomendado: `operador interno`
- relação temática: depende da definição dos motivos e da política de troca

**Título público sugerido**
- `Como orientar o envio de SKU em uma troca`

**Categoria pública sugerida**
- `Operação de trocas e devoluções`

**Resumo curto**
- `Entenda em quais cenários a operação pode solicitar a identificação do item por SKU durante uma troca.`

**Corpo candidato em markdown**
```md
# Como orientar o envio de SKU em uma troca

Em alguns cenários, a operação pode optar por permitir a identificação do item por SKU durante uma troca.

## Quando isso pode ser útil

- quando a seleção do item precisa ser complementada manualmente
- quando a operação exige maior precisão na identificação do produto

## O que fazer na revisão interna

1. Confirmar se a operação realmente precisa dessa opção.
2. Verificar como a orientação ao cliente será apresentada.
3. Garantir que a equipe saiba quando pedir a SKU e quando usar a seleção padrão do item.

## Atenção

Este tema depende da forma como a operação está configurada e de como a experiência de troca foi desenhada para a conta.

Requer validação antes de qualquer promoção para a camada pública.
```

**Pré-requisitos**
- existir configuração equivalente para permitir identificação manual por SKU

**Passos operacionais presentes no original**
- acessar `Configurações > Parametrização Geral`
- localizar a funcionalidade `Informar SKU de Troca por Texto`

**Observações de risco**
- conteúdo legado muito curto e ambíguo
- `Requer validação`: confirmar se o cliente informa apenas SKU, link ou ambos
- `Requer validação`: confirmar se esse tema deve permanecer interno

**Checklist de revisão final**
- validar comportamento exato com produto
- validar se a explicação pode existir sem detalhar configuração interna
- revisar linguagem para remover dependência de UI antiga

**Decisão recomendada**
- `revisar tecnicamente antes`

### 4. Posso enviar uma notificação de análise ao cliente?

**Leitura editorial**
- título original: `Posso enviar uma notificação de análise ao cliente?`
- categoria original: `Configurações / Configuração de ambiente`
- jornada operacional sugerida: `Primeiros passos`
- público-alvo recomendado: `cliente B2B`
- relação temática: alinhado com a trilha de comunicação operacional

**Título público sugerido**
- `Como enviar uma atualização de análise ao cliente`

**Categoria pública sugerida**
- `Primeiros passos`

**Resumo curto**
- `Saiba quando comunicar que uma solicitação está em análise e quais informações podem ajudar a manter o cliente atualizado.`

**Corpo candidato em markdown**
```md
# Como enviar uma atualização de análise ao cliente

Quando uma solicitação estiver em análise, a operação pode registrar uma atualização para manter o cliente informado sobre o andamento do caso.

## Quando usar

Use essa comunicação quando a análise exigir retorno intermediário ou quando for importante contextualizar a etapa atual da solicitação.

## Como conduzir a mensagem

1. Revise o status atual da solicitação.
2. Registre uma mensagem clara e objetiva sobre a análise em andamento.
3. Inclua apenas informações úteis para o entendimento da etapa atual.
4. Anexe materiais somente quando forem realmente necessários para contextualizar a análise.

## Boas práticas

- explique a etapa sem prometer prazo ou decisão não confirmada
- mantenha a mensagem curta e objetiva
- use anexos apenas quando ajudarem a esclarecer o caso
```

**Pré-requisitos**
- existir solicitação em análise

**Passos operacionais presentes no original**
- abrir a solicitação
- localizar a ação de notificação de análise
- opcionalmente adicionar comentário, imagem e arquivo

**Observações de risco**
- `Requer validação`: confirmar se anexos continuam suportados
- revisar se a comunicação é enviada ao cliente final ou a um ponto operacional da conta

**Checklist de revisão final**
- validar vocabulário adequado de comunicação
- validar limites de anexo e contexto de uso
- revisar com suporte/CS exemplos de mensagem segura

**Decisão recomendada**
- `candidato a público`

### 5. Reenviar um e-mail ao consumidor

**Leitura editorial**
- título original: `Reenviar um e-mail ao consumidor`
- categoria original: `Configurações / Configuração de ambiente`
- jornada operacional sugerida: `Operação de trocas e devoluções`
- público-alvo recomendado: `cliente B2B`
- relação temática: comunicação operacional e histórico da solicitação

**Título público sugerido**
- `Como reenviar uma comunicação ao cliente`

**Categoria pública sugerida**
- `Operação de trocas e devoluções`

**Resumo curto**
- `Veja quando reenviar uma comunicação vinculada a uma solicitação e quais cuidados manter para preservar o histórico do atendimento.`

**Corpo candidato em markdown**
```md
# Como reenviar uma comunicação ao cliente

Se uma mensagem anterior precisar ser enviada novamente, a operação pode reenviar a comunicação vinculada à solicitação.

## Quando usar

- quando o cliente não localizou a mensagem anterior
- quando a operação precisa reforçar uma orientação já enviada

## Como conduzir o reenvio

1. Abra a solicitação correta.
2. Revise o histórico de comunicação antes de reenviar.
3. Confirme se a mensagem ainda está atualizada para o contexto do caso.
4. Reenvie a comunicação somente quando isso fizer sentido para o andamento da solicitação.

## Boas práticas

- evite reenviar mensagens desatualizadas
- confirme se o conteúdo ainda representa a etapa atual
- mantenha o histórico coerente com as ações mais recentes
```

**Pré-requisitos**
- existir histórico de comunicação associado à solicitação

**Passos operacionais presentes no original**
- abrir a solicitação desejada
- acessar `Comunicação`
- usar `Reenviar`

**Observações de risco**
- `Requer validação`: confirmar se o canal é apenas e-mail ou se cobre outras comunicações
- remover definitivamente o foco em `consumidor` como público principal

**Checklist de revisão final**
- validar nomenclatura atual da área de comunicação
- revisar com suporte/CS o momento adequado de reenvio
- conferir se o artigo continua aplicável sem screenshots

**Decisão recomendada**
- `candidato a público`

### 6. Regra por motivo

**Leitura editorial**
- título original: `Regra por motivo`
- categoria original: `Configurações / Configuração de ambiente`
- jornada operacional sugerida: `Operação de trocas e devoluções`
- público-alvo recomendado: `operador interno`
- relação temática: complementar a gestão de motivos; revisar junto com `Como cadastrar motivos para troca ou devolução`

**Título público sugerido**
- `Como aplicar regras por motivo na operação`

**Categoria pública sugerida**
- `Operação de trocas e devoluções`

**Resumo curto**
- `Entenda como tratar regras específicas por motivo e por que essa decisão precisa acompanhar a política operacional da conta.`

**Corpo candidato em markdown**
```md
# Como aplicar regras por motivo na operação

Algumas operações usam regras específicas para determinados motivos de troca ou devolução.

## Quando revisar esse tema

Revise essa configuração quando a operação precisar tratar um motivo de forma diferente dos demais.

## O que confirmar internamente

1. Qual motivo precisa de tratamento específico.
2. Qual regra será aplicada nesse cenário.
3. Como essa regra afeta a rotina da operação.

## Atenção

O conteúdo legado não detalha quais regras estão disponíveis nem quais impactos cada regra gera.

Requer validação antes de qualquer promoção para a camada pública.
```

**Pré-requisitos**
- existir motivo previamente cadastrado

**Passos operacionais presentes no original**
- acessar `Configurações > Ambiente > Motivos`
- localizar o motivo
- habilitar a ação desejada para aquele motivo

**Observações de risco**
- artigo abstrato demais para publicação imediata
- `Requer validação`: confirmar quais regras realmente existem e se podem ser descritas publicamente

**Checklist de revisão final**
- validar o conjunto real de regras disponíveis
- revisar com suporte/CS exemplos de uso recorrente
- decidir se o tema fica público ou interno

**Decisão recomendada**
- `revisar tecnicamente antes`

## Resumo das decisões recomendadas

| Artigo | Decisão recomendada |
| --- | --- |
| Como alterar ou aprovar os produtos de uma solicitação? | candidato a público |
| Como cadastrar motivos para troca ou devolução | candidato a público |
| Como informar a SKU durantge a troca | revisar tecnicamente antes |
| Posso enviar uma notificação de análise ao cliente? | candidato a público |
| Reenviar um e-mail ao consumidor | candidato a público |
| Regra por motivo | revisar tecnicamente antes |

## Riscos e validações pendentes
- validar nomenclatura atual das áreas internas usadas pelos artigos legados
- confirmar se a comunicação ao cliente continua com os mesmos comportamentos descritos
- confirmar se o tema de SKU durante troca pode existir como artigo público ou deve permanecer interno
- confirmar o conjunto real de regras cobertas por `Regra por motivo`
- revisar todo o lote com suporte/CS antes de qualquer promoção para elegibilidade pública

## Gate formal de revisão humana
O gate documental de elegibilidade desta leva ficou registrado em:
- `docs/knowledge/KNOWLEDGE_P0_HUMAN_REVIEW_GATE.md`
