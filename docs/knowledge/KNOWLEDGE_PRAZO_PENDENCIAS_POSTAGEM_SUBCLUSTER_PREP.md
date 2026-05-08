# Knowledge Prazo Pendencias Postagem Subcluster Prep

## Objetivo

- preparar o subcluster seguro de `Prazo e pendências de postagem`
- separar o recorte público potencial de temas internos ou sensíveis do cluster `Logística reversa e postagem`
- mapear riscos, fronteiras editoriais e possíveis canônicos futuros sem reescrever artigo final nesta fase

## Estado atual

- nenhum artigo foi aprovado
- nenhuma aprovação foi simulada
- nenhum artigo foi publicado
- o subcluster foi preparado apenas como trilha documental
- a fronteira com integração, contrato, token e seller continua fora do escopo público

## Artigos fonte analisados

### 1. `Pendência de Logística Reversa`
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/erros-comuns-e-solucoes/erros-e-pendencias/000-pendencia-de-logistica-reversa`
- categoria original:
  - `Erros comuns e soluções / Erros e pendências`
- resumo objetivo:
  - explica a pendência aberta quando um pedido com mais de 10 itens exige informar quantidade de embalagens antes da geração do e-ticket
- tema principal:
  - pendência operacional para liberação da postagem
- público-alvo provável:
  - operação B2B e suporte operacional
- risco editorial:
  - `médio`
- risco técnico:
  - `médio`
- risco logístico/operacional:
  - `alto`
- risco de exposição interna:
  - `médio`
- dependência de revisão Produto:
  - `sim`
- dependência de revisão Suporte/CS:
  - `sim`
- dependência de revisão Engenharia:
  - `não`
- observação objetiva:
  - é um dos melhores candidatos do subcluster para futuro artigo por sintoma operacional, mas ainda depende de ação interna de backoffice

### 2. `Como Configurar o Prazo Logístico por Estado?`
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-como-configurar-o-prazo-logistico-por-estado`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - descreve a tabela de prazo logístico por estado e o impacto dela na janela operacional de troca ou devolução
- tema principal:
  - prazo logístico da operação
- público-alvo provável:
  - cliente B2B responsável pela operação
- risco editorial:
  - `médio`
- risco técnico:
  - `médio`
- risco logístico/operacional:
  - `alto`
- risco de exposição interna:
  - `baixo`
- dependência de revisão Produto:
  - `sim`
- dependência de revisão Suporte/CS:
  - `sim`
- dependência de revisão Engenharia:
  - `não`
- observação objetiva:
  - tem potencial claro de recorte público futuro se for abstraído do cálculo interno e da menção a plataforma específica

### 3. `Erro no CEP ou Endereço Incorreto`
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/erros-comuns-e-solucoes/erros-e-pendencias/000-erro-no-cep-ou-endereco-incorreto`
- categoria original:
  - `Erros comuns e soluções / Erros e pendências`
- resumo objetivo:
  - explica a pendência de logística reversa causada por CEP ou endereço inválido e orienta revisar dados antes de gerar o e-ticket
- tema principal:
  - bloqueio de postagem por inconsistência cadastral
- público-alvo provável:
  - operação B2B e suporte
- risco editorial:
  - `médio`
- risco técnico:
  - `médio`
- risco logístico/operacional:
  - `alto`
- risco de exposição interna:
  - `médio`
- dependência de revisão Produto:
  - `sim`
- dependência de revisão Suporte/CS:
  - `sim`
- dependência de revisão Engenharia:
  - `não`
- observação objetiva:
  - é um candidato forte para troubleshooting público por sintoma observável, desde que sem navegação interna literal

### 4. `Posso alterar o e-mail e o endereço da solicitação?`
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-posso-alterar-o-e-mail-e-o-endereco-da-solicitacao`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - mostra a alteração manual de e-mail e endereço em uma solicitação já aberta
- tema principal:
  - correção cadastral aplicada à solicitação
- público-alvo provável:
  - operação interna e suporte
- risco editorial:
  - `médio`
- risco técnico:
  - `baixo`
- risco logístico/operacional:
  - `médio`
- risco de exposição interna:
  - `médio`
- dependência de revisão Produto:
  - `sim`
- dependência de revisão Suporte/CS:
  - `sim`
- dependência de revisão Engenharia:
  - `não`
- observação objetiva:
  - ajuda a delimitar o que é correção manual interna versus orientação pública segura para saneamento de dados

### 5. `Regra de Exceção para Motivos - Não Gerar Logística Reversa`
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-regra-de-excecao-para-motivos-nao-gerar-logistica-reversa`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - define exceção que impede a geração automática da autorização postal para determinados motivos e desloca a autorização para decisão manual
- tema principal:
  - fronteira sensível entre recorte público e exceção operacional interna
- público-alvo provável:
  - operação interna, SAC e suporte avançado
- risco editorial:
  - `alto`
- risco técnico:
  - `médio`
- risco logístico/operacional:
  - `alto`
- risco de exposição interna:
  - `alto`
- dependência de revisão Produto:
  - `sim`
- dependência de revisão Suporte/CS:
  - `sim`
- dependência de revisão Engenharia:
  - `não`
- observação objetiva:
  - entra neste subcluster apenas para marcar a fronteira do que não deve virar orientação pública simples

## Temas internos do subcluster

### Pendência de logística reversa
- artigos relacionados:
  - `Pendência de Logística Reversa`
  - `Erro no CEP ou Endereço Incorreto`
- leitura editorial:
  - há potencial de orientação pública baseada em sintomas e pendências observáveis

### Prazo logístico por estado
- artigos relacionados:
  - `Como Configurar o Prazo Logístico por Estado?`
- leitura editorial:
  - tema com potencial de artigo público futuro, desde que em linguagem operacional e sem detalhar regra interna de cálculo

### Validade ou prazo de postagem
- artigos relacionados:
  - `Como Configurar o Prazo Logístico por Estado?`
- leitura editorial:
  - pode ser apresentado como prazo operacional de uso da postagem, sem entrar em integração ou política interna detalhada

### CEP ou endereço incorreto
- artigos relacionados:
  - `Erro no CEP ou Endereço Incorreto`
  - `Posso alterar o e-mail e o endereço da solicitação?`
- leitura editorial:
  - candidato a troubleshooting público seguro, desde que não ensine navegação de backoffice

### Alteração de e-mail ou endereço da solicitação
- artigos relacionados:
  - `Posso alterar o e-mail e o endereço da solicitação?`
- leitura editorial:
  - hoje é um procedimento interno; no futuro pode gerar apenas uma orientação conceitual de revisão cadastral

### Quantidade de volumes ou embalagens
- artigos relacionados:
  - `Pendência de Logística Reversa`
- leitura editorial:
  - tema logístico legítimo, mas ainda dependente de ação manual interna

### Diferença entre orientação pública segura e regra interna de operação
- leitura editorial:
  - a help pública pode orientar o que revisar, mas não deve ensinar execução manual em backoffice

### Fronteira com regra de não gerar logística reversa
- artigos relacionados:
  - `Regra de Exceção para Motivos - Não Gerar Logística Reversa`
- leitura editorial:
  - exceção operacional manual e sensível que precisa continuar fora do recorte seguro

## Fronteiras editoriais

### O que pode ser orientação pública futura
- prazo de postagem e janela operacional em linguagem B2B
- revisão de pendências de logística reversa por sintomas observáveis
- orientação para revisar CEP, endereço e quantidade de volumes antes de acionar suporte

### O que deve permanecer interno
- passos literais de backoffice para alterar dados ou gerar e-ticket
- filtros internos, símbolos e marcações de pendência
- qualquer execução manual de autorização de postagem

### O que exige revisão Produto
- nomenclatura atual de prazo logístico e pendência de postagem
- aderência do fluxo descrito ao produto atual
- limite entre orientação operacional e regra interna

### O que exige revisão Suporte/CS
- clareza para cliente B2B
- adequação do tom para troubleshooting e prazo
- definição de quando orientar espera, revisão ou abertura de suporte

### O que exige validação logística/operacional
- regra de pendência por quantidade de embalagens
- interpretação do prazo de postagem
- impacto de dados incorretos no fluxo de autorização e envio

### O que exige Engenharia
- nenhum item do recorte seguro exige `Engenharia` por padrão
- qualquer escalada para integração, transportadora, token ou autorização técnica sai deste subcluster e volta para trilha bloqueada

### O que nunca deve ser publicado sem recorte novo
- contrato, token, código administrativo ou autorização técnica
- exceções manuais de não gerar logística reversa como regra pública padrão
- procedimento de backoffice tratado como instrução pública

## Matriz de possíveis artigos canônicos futuros

| Título candidato | Categoria pública | Subcategoria futura opcional | Prioridade | Escopo | Fora de escopo | Bloqueadores | Validação necessária | Pode avançar para reescrita agora |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Como o prazo de postagem afeta a operação de troca e devolução | Logística reversa e postagem | Prazo logístico | P1 | prazo operacional e cuidados de revisão antes de configurar a conta | cálculo interno detalhado, integração e política jurídica | confirmar nomenclatura e comportamento atual | Produto + Suporte/CS | não |
| Como revisar uma pendência de logística reversa na operação | Logística reversa e postagem | Pendências de postagem | P1 | sinais observáveis de pendência e o que revisar antes de escalar | ações internas de backoffice, filtros e e-ticket manual | ainda depende de limpar navegação interna literal | Produto + Suporte/CS | não |
| O que revisar quando o CEP ou endereço impede a postagem | Erros conhecidos e troubleshooting | Endereço e CEP | P1 | revisão segura de dados cadastrais e próximos passos operacionais | alteração manual em backoffice e integração | saneamento editorial do troubleshooting atual | Produto + Suporte/CS | não |
| Quando revisar os dados da solicitação antes da postagem | Logística reversa e postagem | Endereço e contato | P2 | revisão conceitual de dados essenciais antes do envio | alteração manual de e-mail, endereço e execução interna | risco de virar tutorial interno se não houver abstração suficiente | Produto + Suporte/CS | não |

## Recomendação do subcluster

- classificação recomendada:
  - `candidato a público`

### Justificativa

- o subcluster concentra os recortes mais seguros já identificados dentro de `Logística reversa e postagem`
- os riscos principais são de linguagem interna e acoplamento a backoffice, não de credencial, contrato ou integração
- com reescrita controlada e validação humana, o subcluster pode gerar artigos públicos futuros sem herdar a parte mais sensível do cluster maior

## Riscos e bloqueadores principais

- o legado ainda usa navegação interna literal e ações de backoffice
- parte do fluxo de pendência depende de operação manual e precisa ser abstraída antes de qualquer publicação
- prazo logístico ainda precisa de validação de nomenclatura e comportamento atual

## Decisão desta fase

- o subcluster `Prazo e pendências de postagem` foi preparado documentalmente
- nenhum artigo foi reescrito por completo
- nenhum artigo foi aprovado
- nenhuma aprovação foi simulada
- nenhum artigo foi publicado
- a versão candidata pública de prazo de postagem ficou registrada em:
  - `docs/knowledge/KNOWLEDGE_PRAZO_POSTAGEM_REWRITE.md`
