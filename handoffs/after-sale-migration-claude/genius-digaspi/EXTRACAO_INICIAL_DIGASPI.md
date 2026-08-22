# Extração inicial da Genius: Di Gaspi

**Data da leitura:** 21/08/2026
**Origem:** ambiente Genius Returns
**Escopo:** leitura do cadastro e das configurações disponíveis para a Di Gaspi, sem salvar alterações.

## Regra de identificação usada

Antes de cada leitura foi conferido:

1. Cliente simulado: **(Di Gaspi) COMERCIO ELETRÔNICO DI GASPI LTDA**.
2. Loja selecionada no painel.
3. Endereço da loja exibido no seletor.

As duas lojas foram tratadas separadamente:

- **Di Gaspi principal:** `https://www.digaspi.com.br/`
- **Up Sports:** `https://www.upsports.com.br/`

Não foi feita nenhuma alteração, envio ou salvamento no ambiente Genius.

## Cadastro do cliente

- Razão social: (Di Gaspi) COMERCIO ELETRÔNICO DI GASPI LTDA
- Nome de exibição: Di Gaspi
- CNPJ: 39.254.739/0001-65
- Telefone: (11) 5501-8400
- Site: https://www.digaspi.com.br/
- Categoria: Calçados
- Endereço cadastrado: Av. das Nações Unidas, 12399, 11º andar, Brooklin Novo, São Paulo, SP, CEP 04578-000
- Status: ativo
- E-mail exibido na listagem do cliente: `atendimento@digaspi.com.br`
- E-mail de contato no detalhe cadastral: não preenchido
- E-mail financeiro e responsável financeiro: não preenchidos

### Ponto de atenção

O e-mail da listagem e o e-mail do detalhe cadastral não estão iguais. O e-mail usado nas mensagens operacionais aparece como `atendimento@digaspi.com.br`, mas o cadastro formal de contato está vazio. Esse dado precisa ser confirmado antes de qualquer migração que dependa de contato administrativo.

## Lojas virtuais

### Di Gaspi principal

- URL: `https://www.digaspi.com.br/`
- Alias operacional: `digaspi`
- Plataforma: VTEX, ativa
- Conta VTEX: `digaspi`
- Status aceitos para atualização de pedido: faturado, invoiced, entregue, delivered e preparando entrega
- Dias configurados para estorno automático: 365
- Operações permitidas: apenas devoluções
- Gerar ticket reverso automaticamente: ativo
- Cálculo automático de autorizações: ativo
- Concluir processo após sanar pendência financeira: ativo
- Estorno automático via Pix: ativo
- Troca no mesmo seller: inativa
- Melhores imagens dos produtos: inativa
- Exibir somente produtos faturados: inativa
- Restringir vale-compra ao comprador: inativa
- Modo B2B: inativo
- Custo estimado da logística reversa: inativo
- Transportadora de melhor custo: inativa

### Up Sports

- URL: `https://www.upsports.com.br/`
- Identificador exibido no seletor: 41
- Plataforma: VTEX, ativa
- Conta VTEX: `UpSports`
- Status aceitos para atualização de pedido: faturado, invoiced, entregue, deliveryd, preparando entrega e verificando
- Dias configurados para estorno automático: 365
- Gerar ticket reverso automaticamente: ativo
- Melhores imagens dos produtos: ativo
- Restringir vale-compra ao comprador: ativo
- Troca no mesmo seller: inativa
- Exibir somente produtos faturados: inativa

## Integrações e logística

### Di Gaspi principal

- VTEX: ativa
- ERP: nenhum ERP ativo identificado
- Correios: ativo
- Modalidade dos Correios: postagem em agência
- Coleta domiciliar: inativa
- Serviços dos Correios configurados: 03247 e 03301
- Seguro informado: R$ 100,00
- Logística reversa premium: não ativa
- Exigência logística encontrada: Correios, postagem em agência, valor mínimo R$ 0,00
- Webhooks: nenhum cadastrado
- Sellers cadastrados: nenhum
- Lojas físicas cadastradas: nenhuma

### Up Sports

- VTEX: ativa
- ERP: nenhum ERP ativo identificado
- Correios: ativo
- Modalidade dos Correios: postagem em agência
- Coleta domiciliar: inativa
- Serviços dos Correios configurados: 03247 e 03301
- Seguro informado: R$ 100,00

Credenciais, tokens, chaves de API e senhas não foram copiadas para este documento. Elas devem ser tratadas por canal seguro, caso sejam necessárias na etapa de configuração da V2.

## Parâmetros gerais da Di Gaspi principal

- Solicitação de fotos: inativa
- Estorno por item: inativo
- Fique com o item: baseado no valor do item, sem valor preenchido
- Sellers autorizados: Di Gaspi
- Segundo pedido para o mesmo pedido: permitir prosseguir
- Segundo pedido para o mesmo SKU: permitir prosseguir
- Segurança adicional: nenhuma especificada
- Troca de SKU por texto: inativa
- Mensagem para produto de seller não autorizado: cadastrada, orientando o cliente a solicitar devolução pelo e-mail `atendimento@digaspi.com.br`.

## Estorno e vale-compra

- Estorno automático: disparado ao concluir a análise
- Vale-compra automático: disparado na confirmação da postagem
- Cálculo de estorno: padrão
- Formas de estorno manual: conta bancária e Pix
- Frete: estornar somente quando o pedido inteiro for devolvido
- Forma de compensação por motivo: somente vale-compra
- Vale-compra de 100%: ativo, validade de 90 dias
- Vale-compra de 110%: ativo, validade de 90 dias
- Gateways exibidos na configuração: Pagar.me, Paymee, Getnet, Mercado Pago, PagSeguro, Pagaleve e SpinPay

## Motivos da Di Gaspi principal

Foram encontrados 12 registros ativos. Todos permitem estorno financeiro e vale-compra.

| Motivo | Prazo | Foto obrigatória | Uso somente pelo SAC |
|---|---:|---|---|
| Não gostei | 7 dias | Não | Não |
| Cor errada | 30 dias | Não | Não |
| Defeito de fabricação | 30 dias | Sim | Não |
| Produto em desacordo com o pedido | 30 dias | Sim | Não |
| Diferente da foto | 30 dias | Sim | Não |
| Ficou grande | 30 dias | Não | Não |
| Produto errado | 30 dias | Sim | Não |
| Qualidade do produto | 30 dias | Sim | Não |
| Ficou pequeno | 30 dias | Não | Não |
| Ficou pequeno | 30 dias | Não | Não |
| Arrependimento | 7 dias | Não | Não |
| Ruptura de estoque | 1 dia | Não | Sim |

Há dois registros com o mesmo nome **Ficou pequeno**. A duplicidade deve ser conferida antes de reproduzir os motivos na V2.

### Motivos da Up Sports

Foram encontrados 7 registros ativos: Arrependimento, Cor errada, Defeito de fabricação, Produto em desacordo com o pedido, Produto ou Embalagem avariado, Tamanho errado e Ruptura de estoque. A ruptura de estoque é exclusiva do SAC. Os demais motivos não exigem foto, salvo os motivos de defeito, desacordo, cor errada e avaria, que exigem foto.

## Textos e comunicação

### Di Gaspi principal

- Título da troca: **Trocar**
- Descrição da troca: **Selecione diferentes opções do produto**
- Título da devolução: **Troca e Devolução**
- Descrição da devolução: informa que a troca gera vale-compra e a devolução pode gerar vale-compra ou estorno, conforme a escolha do cliente
- Página inicial: texto personalizado de boas-vindas da Di Gaspi
- Mensagens de confirmação, postagem, análise, vale-compra e estorno: há textos personalizados com campos automáticos
- Rodapé de comunicação identificado: atendimento@digaspi.com.br e (11) 5501-8400

### Modelos de e-mail

O painel apresenta 17 eventos de e-mail, incluindo nova solicitação, alteração de status, estorno, vale-compra, autorização de postagem, confirmação de postagem, recebimento, análise, NFD, troca e aprovação. O editor de HTML personalizado está disponível. O conteúdo deve ser comparado evento a evento antes de transportar para a V2, porque nomes de eventos e campos automáticos podem mudar.

### WhatsApp

Há configuração de mensagens para confirmação, autorização logística, postagem ou coleta, recebimento, avaliação, vale-compra, estorno manual e estorno automático. Cashback e mensagem de troca aparecem desativados. A integração externa não deve ser considerada validada apenas pela presença do cadastro.

## Usuários e operação

- Usuários cadastrados: 16
- Usuários ativos: 9
- Usuários inativos: 7
- Usuário utilizado para a leitura: Roselene Silva - SAC
- O perfil lido tem acesso às rotinas de atendimento, alteração de status, ações pendentes, registro de postagem, avaliação, pagamento, nota fiscal e consulta de histórico. Não possui acesso amplo de administração, usuários, sellers e configurações estruturais.

## Outros registros encontrados

- Lista de bloqueio: 39 registros visíveis, contendo e-mail, processo, valores e data. Os dados pessoais não foram reproduzidos aqui.
- Notificações: destinatário operacional `ocimar.galhardo@geniusreturns.com.br`; alerta após 1 dia e situação de risco após 2 dias.
- Controle administrativo: valor manual para estorno automático ativo, blocklist ativo, nova tela de processo ativa e nova API dos Correios inativa.
- Tempos de custo logístico: há prazo por estado configurado para as duas lojas. São Paulo aparece com 3 dias; os demais prazos devem ser levados para a tabela de de-para, não copiados por aproximação.
- Troca direta na VTEX: configuração existente, com seller afiliado e política de otimização de custo; termos ainda não aceitos no cadastro.

## Pendências para a etapa de de-para

1. Confirmar qual e-mail deve ser tratado como contato oficial da Di Gaspi.
2. Conferir a duplicidade do motivo “Ficou pequeno”.
3. Conferir a divergência entre a lista de lojas virtuais, que mostra apenas Up Sports, e os seletores internos, que mostram Di Gaspi principal e Up Sports.
4. Reproduzir somente na V2 o que tiver campo equivalente, mantendo uma relação clara dos itens que não possuem destino.
5. Comparar os 17 eventos de e-mail e seus campos automáticos antes de qualquer salvamento.
6. Solicitar credenciais por canal seguro somente se a V2 exigir a informação para ativar uma integração.

## Situação desta extração

A leitura cadastral e operacional inicial da Di Gaspi foi realizada em modo somente leitura. A troca de contexto para a loja principal foi validada pelo nome do cliente, pela URL da loja e pelo seletor do painel.

Este arquivo permanece como registro da origem Genius. O resultado consolidado da configuração na V2 está em `MIGRACAO_GENIUS_V2_DIGASPI.html`, com a situação de cada item, os ajustes realizados e as lacunas que continuam abertas.
