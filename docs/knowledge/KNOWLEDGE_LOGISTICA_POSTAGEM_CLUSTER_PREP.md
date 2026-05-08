# Knowledge Logistica Postagem Cluster Prep

## Objetivo

- abrir o cluster `Logística reversa e postagem` fora da trilha de estorno
- mapear artigos do corpus legado ligados a postagem, Correios, autorização, prazo, frete logístico e bloqueios operacionais
- separar o que pode virar orientação pública futura do que deve permanecer interno ou exigir revisão adicional

## Estado atual

- nenhum artigo foi aprovado
- nenhuma aprovação foi simulada
- nenhum artigo foi publicado
- o cluster foi preparado apenas como trilha documental
- qualquer avanço futuro depende de recorte editorial seguro e validação explícita compatível com o risco

## Artigos fonte analisados

### 1. `Pendência de Logística Reversa`
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/erros-comuns-e-solucoes/erros-e-pendencias/000-pendencia-de-logistica-reversa`
- categoria original:
  - `Erros comuns e soluções / Erros e pendências`
- resumo objetivo:
  - explica a pendência gerada em pedidos com mais de 10 itens e a necessidade de informar quantidade de embalagens antes de gerar o e-ticket
- tema principal:
  - pendência operacional para geração de logística reversa
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
  - pode render um recorte público futuro por sintoma operacional, mas hoje ainda depende de UI e ações internas

### 2. `Como Configurar o Prazo Logístico por Estado?`
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-como-configurar-o-prazo-logistico-por-estado`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - descreve a tabela de prazo logístico por estado e seu impacto no cálculo da janela de troca e devolução
- tema principal:
  - prazo logístico da operação
- público-alvo provável:
  - cliente B2B responsável por operação
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
  - tema com potencial público futuro, desde que sem detalhamento de cálculo ou dependência de plataforma específica

### 3. `Posso alterar o e-mail e o endereço da solicitação?`
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-posso-alterar-o-e-mail-e-o-endereco-da-solicitacao`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - mostra alteração manual de e-mail e endereço em uma solicitação
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
  - tem relação com postagem por corrigir dados da solicitação, mas hoje está escrito como procedimento interno de backoffice

### 4. `Regra de Exceção para Motivos - Não Gerar Logística Reversa`
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/configurando-parametrizacao-geral/000-regra-de-excecao-para-motivos-nao-gerar-logistica-reversa`
- categoria original:
  - `Configurações / Configuração de ambiente`
- resumo objetivo:
  - define exceção que impede a geração automática da autorização postal para certos motivos e desloca a decisão para análise manual
- tema principal:
  - bloqueio operacional de logística reversa por motivo
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
  - mistura exceção operacional, filtro interno e ação manual; não é candidato simples a help pública

### 5. `Integração e configuração com os Correios`
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/cadastros/integracao-e-atualizacao/000-integracao-e-configuracao-com-os-correios`
- categoria original:
  - `Cadastros / Integração e atualização`
- resumo objetivo:
  - orienta setup de integração com os Correios, incluindo prazo de postagem, usuário do portal, token e testes técnicos
- tema principal:
  - integração contratual e técnica com os Correios
- público-alvo provável:
  - implantação, operação interna e engenharia
- risco editorial:
  - `alto`
- risco técnico:
  - `alto`
- risco logístico/operacional:
  - `alto`
- risco de exposição interna:
  - `alto`
- dependência de revisão Produto:
  - `sim`
- dependência de revisão Suporte/CS:
  - `sim`
- dependência de revisão Engenharia:
  - `sim`
- observação objetiva:
  - conteúdo de integração sensível, com token e procedimento técnico, fora de qualquer trilha pública direta

### 6. `Habilitar a API de Logística Reversa do Correios`
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/cadastros/integracao-e-atualizacao/000-habilitar-a-api-de-logistica-reversa-do-correios`
- categoria original:
  - `Cadastros / Integração e atualização`
- resumo objetivo:
  - explica a dependência contratual da API `LR250` e orienta solicitar liberação junto aos Correios
- tema principal:
  - habilitação contratual da API de logística reversa
- público-alvo provável:
  - implantação, operação interna e gestão contratual
- risco editorial:
  - `alto`
- risco técnico:
  - `alto`
- risco logístico/operacional:
  - `alto`
- risco de exposição interna:
  - `alto`
- dependência de revisão Produto:
  - `sim`
- dependência de revisão Suporte/CS:
  - `sim`
- dependência de revisão Engenharia:
  - `sim`
- observação objetiva:
  - tema contratual e de integração, sem recorte aproveitável para publicação pública nesta fase

### 7. `Erros na integração do contrato do Correios`
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/cadastros/integracao-e-atualizacao/000-erros-na-integracao-do-contrato-do-correios`
- categoria original:
  - `Cadastros / Integração e atualização`
- resumo objetivo:
  - detalha erro de integração contratual com os Correios e passos de verificação de código administrativo, contrato e cartão de postagem
- tema principal:
  - troubleshooting contratual dos Correios
- público-alvo provável:
  - implantação, operação interna e suporte avançado
- risco editorial:
  - `alto`
- risco técnico:
  - `alto`
- risco logístico/operacional:
  - `alto`
- risco de exposição interna:
  - `alto`
- dependência de revisão Produto:
  - `sim`
- dependência de revisão Suporte/CS:
  - `sim`
- dependência de revisão Engenharia:
  - `sim`
- observação objetiva:
  - é troubleshooting interno de contrato e não deve virar help pública direta

### 8. `Erro "Não Autorizado" ao Gerar Código de postagem`
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/erros-comuns-e-solucoes/erros-e-pendencias/000-erro-nao-autorizado-ao-gerar-codigo-reverso-postagem`
- categoria original:
  - `Erros comuns e soluções / Erros e pendências`
- resumo objetivo:
  - relaciona falha de geração do código de postagem a token incorreto, expirado ou mudança contratual nos Correios
- tema principal:
  - erro de autorização na geração de código de postagem
- público-alvo provável:
  - suporte avançado e operação interna
- risco editorial:
  - `alto`
- risco técnico:
  - `alto`
- risco logístico/operacional:
  - `alto`
- risco de exposição interna:
  - `alto`
- dependência de revisão Produto:
  - `sim`
- dependência de revisão Suporte/CS:
  - `sim`
- dependência de revisão Engenharia:
  - `sim`
- observação objetiva:
  - troubleshooting dependente de token e contrato, sem recorte público seguro no formato atual

### 9. `Regras de Cadastro e configurações de Sellers( Estorno e Logística)`
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/configuracoes/sellers-e-lojafisica/000-regras-de-cadastro-e-configuracoes-de-sellers-estorno-e-logistica`
- categoria original:
  - `Configurações / Sellers e Loja Fisica`
- resumo objetivo:
  - descreve governança de sellers com impacto em estorno, retorno logístico, endereço e dados dos Correios
- tema principal:
  - governança operacional de seller no fluxo logístico
- público-alvo provável:
  - operação interna, implantação e gestão de sellers
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
  - `sim`
- observação objetiva:
  - conteúdo de governança interna, não de orientação pública de postagem

### 10. `Erro no CEP ou Endereço Incorreto`
- caminho fonte:
  - `raw_knowledge/octadesk_export/latest/articles/erros-comuns-e-solucoes/erros-e-pendencias/000-erro-no-cep-ou-endereco-incorreto`
- categoria original:
  - `Erros comuns e soluções / Erros e pendências`
- resumo objetivo:
  - explica a pendência de logística reversa causada por CEP ou endereço inválido e orienta a correção antes de gerar o e-ticket
- tema principal:
  - correção de dados para permitir a postagem
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
  - tem potencial de virar troubleshooting público seguro por sintoma observável, desde que sem navegação interna literal

## Temas internos do cluster

### Autorização de postagem
- artigos relacionados:
  - `Regra de Exceção para Motivos - Não Gerar Logística Reversa`
  - `Erro "Não Autorizado" ao Gerar Código de postagem`
- leitura editorial:
  - o tema mistura autorização automática, manual e dependência de contrato ou token

### Código de postagem
- artigos relacionados:
  - `Pendência de Logística Reversa`
  - `Erro "Não Autorizado" ao Gerar Código de postagem`
  - `Erro no CEP ou Endereço Incorreto`
- leitura editorial:
  - existe potencial de orientação pública futura por sintoma operacional, mas não por diagnóstico técnico sensível

### Correios
- artigos relacionados:
  - `Integração e configuração com os Correios`
  - `Habilitar a API de Logística Reversa do Correios`
  - `Erros na integração do contrato do Correios`
- leitura editorial:
  - trilha de integração e contrato, essencialmente interna

### Frete
- artigos relacionados:
  - `Como Configurar o Prazo Logístico por Estado?`
- leitura editorial:
  - aparece como prazo logístico e janela operacional, não como política financeira de estorno

### Prazo ou expiração
- artigos relacionados:
  - `Como Configurar o Prazo Logístico por Estado?`
  - `Integração e configuração com os Correios`
- leitura editorial:
  - pode gerar orientação pública futura sobre validade da postagem e janela logística, desde que sem setup técnico

### Bloqueio de postagem
- artigos relacionados:
  - `Regra de Exceção para Motivos - Não Gerar Logística Reversa`
  - `Pendência de Logística Reversa`
  - `Erro no CEP ou Endereço Incorreto`
- leitura editorial:
  - bloco forte de operação manual e pendências internas

### Não gerar logística reversa
- artigos relacionados:
  - `Regra de Exceção para Motivos - Não Gerar Logística Reversa`
- leitura editorial:
  - regra operacional sensível e não reutilizável como FAQ simples

### Transportadoras
- artigos relacionados:
  - `Integração e configuração com os Correios`
  - `Habilitar a API de Logística Reversa do Correios`
  - `Regras de Cadastro e configurações de Sellers( Estorno e Logística)`
- leitura editorial:
  - tema de integração, contrato e roteamento interno

### Diferença entre orientação pública segura e regra interna de operação
- leitura editorial:
  - o cluster tem uma camada pública potencial ligada a sintomas e prazos, mas a maior parte do legado continua prescritiva, contratual ou dependente de backoffice

## Fronteiras editoriais

### O que pode ser orientação pública futura
- explicação de alto nível sobre prazo de postagem e validade operacional do envio
- orientação por sintomas observáveis quando houver pendência de logística reversa
- orientação segura para revisar CEP, endereço ou quantidade de volumes antes de acionar suporte

### O que deve permanecer interno
- procedimentos de integração com Correios
- configuração de contrato, código administrativo, cartão de postagem e token
- governança de sellers com roteamento logístico
- filtros, sinais visuais internos e navegação literal de backoffice

### O que exige revisão técnica
- qualquer tema de integração, token, API, tracking ou contrato com transportadora
- qualquer explicação sobre geração técnica do código de postagem

### O que exige validação logística ou operacional
- prazo logístico por estado
- pendência de logística reversa por quantidade de embalagens
- autorização manual de postagem
- políticas de quando gerar ou não logística reversa

### O que exige validação Suporte/CS
- clareza do texto para cliente B2B
- definição de quando orientar espera, revisão cadastral ou abertura de suporte
- adequação da categoria pública e linguagem operacional

### O que nunca deve ser publicado sem recorte novo
- contratos, tokens, credenciais e detalhes de integração com Correios
- troubleshooting de contrato ou autorização baseado em token
- setup interno de seller, gateway logístico ou transportadora
- regras manuais prescritivas de backoffice como se fossem comportamento público padrão

## Matriz de possíveis artigos canônicos futuros

| Título candidato | Categoria pública | Subcategoria futura opcional | Prioridade | Escopo | Fora de escopo | Bloqueadores | Validação necessária | Pode avançar para reescrita agora |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Como revisar uma pendência de logística reversa na operação | Logística reversa e postagem | Pendências de postagem | P1 | visão operacional de alto nível sobre pendência antes da geração da postagem | UI interna, ações pendentes detalhadas e filtros de backoffice | legado ainda depende de navegação interna literal | Produto + Suporte/CS | não |
| Como o prazo de postagem afeta a operação de troca e devolução | Logística reversa e postagem | Prazo logístico | P1 | prazo de postagem e validade operacional em linguagem B2B | integração Correios, cálculo interno detalhado e política jurídica | nomenclatura e comportamento atual ainda precisam ser confirmados | Produto + Suporte/CS | não |
| O que revisar quando o CEP ou endereço impede a postagem | Erros conhecidos e troubleshooting | Endereço e CEP | P1 | sintomas observáveis e revisão segura de dados cadastrais | backoffice detalhado, geração manual e regras internas | ainda depende de saneamento editorial do troubleshooting atual | Produto + Suporte/CS | não |
| Quando uma solicitação não deve gerar logística reversa automaticamente | Logística reversa e postagem | Exceções operacionais | backlog | explicação conceitual de que existem exceções operacionais | motivos internos, filtros, sinais visuais e análise manual | tema continua sensível e interno demais | Produto + Suporte/CS | não |
| Como a integração com transportadoras afeta a postagem | Integrações | Correios | backlog | visão conceitual sobre dependência externa de postagem | tokens, contratos, API, tracking e troubleshooting técnico | integração e contrato continuam sensíveis demais | Produto + Engenharia + Suporte/CS | não |

## Recomendação do cluster

- classificação recomendada:
  - `candidato parcial a público`

### Justificativa

- existe um recorte público potencial ligado a prazo, pendência, CEP/endereço e sintomas observáveis de postagem
- ao mesmo tempo, o legado concentra uma trilha claramente interna de:
  - integração com Correios
  - contrato e token
  - autorização manual
  - configuração de seller e roteamento logístico
- isso impede tratar o cluster inteiro como candidato público simples

## Riscos e bloqueadores principais

- forte dependência de contratos, tokens e integrações com Correios
- várias instruções do legado dependem de menu, botão e fluxo interno de backoffice
- seller, postagem e logística reversa se cruzam com operação sensível e roteamento interno
- ainda não existe recorte reescrito e validado para este cluster

## Decisão desta fase

- o cluster `Logística reversa e postagem` foi preparado documentalmente
- nenhum artigo foi reescrito por completo
- nenhum artigo foi aprovado
- nenhuma aprovação foi simulada
- nenhum artigo foi publicado
- o subcluster seguro de prazo e pendências ficou registrado em:
  - `docs/knowledge/KNOWLEDGE_PRAZO_PENDENCIAS_POSTAGEM_SUBCLUSTER_PREP.md`
- a versão candidata pública de prazo de postagem ficou registrada em:
  - `docs/knowledge/KNOWLEDGE_PRAZO_POSTAGEM_REWRITE.md`
