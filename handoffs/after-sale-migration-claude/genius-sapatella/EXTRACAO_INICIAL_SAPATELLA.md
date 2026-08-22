# Sapatella | extração da Genius para migração na After Sale V2

## Identificação da conta

- Cliente: Sapatella, SOMOS SONHO LTDA
- CNPJ: 28.445.729/0001-90
- Site: https://www.sapatellaoficial.com.br/
- Categoria: Calçados
- Conta ativa
- Integração na Genius: VTEX, conta `sapatella`
- Operação permitida na Genius: apenas devoluções
- Endereço de devolução: Estrada do Campo D'areia, 132, Pechincha, Rio de Janeiro, RJ, CEP 22743-310

## Parâmetros confirmados na Genius

### Parametrização geral

- Gerar ticket reverso automaticamente: ativo
- Calcular automaticamente o número de autorizações: ativo
- Concluir processo ao sanar pendência financeira: ativo
- Estorno por item: ativo
- Solicitação de fotos: inativa
- Transportadora de melhor custo: inativa
- Custo estimado da logística reversa: inativo
- Modo B2B: inativo
- SKU de troca por texto: inativo
- Fique com o item: sem valor e sem quantidade mensal, portanto não utilizado
- Segunda solicitação para o mesmo pedido: não permitir
- Segunda solicitação para o mesmo SKU: permitir prosseguir
- Segurança adicional: nenhuma especificada

### Estorno e vale-compra

- Estorno automático: na confirmação de recebimento
- Vale-compra automático: na confirmação de postagem
- Cálculo de estorno: padrão
- Pedido pago com vale-compra: permitir vale-compra ou estorno
- Formas de estorno: conta bancária e Pix
- Frete: estorno proporcional à quantidade de itens
- Conflito entre alternativas: liberar vale-compra e estorno
- Estorno automático por Pix: ativo
- Vale-compra restrito ao comprador: ativo
- Vale-compra 100%: validade de 90 dias
- Vale-compra 105%: validade de 90 dias
- Não há valor máximo de estorno informado

### Motivos ativos

São 11 motivos ativos. A Genius não apresenta submotivos adicionais nesses cadastros.

| Motivo | Tipo | Prazo | Foto | Exclusivo do SAC | Sem logística reversa | Não incluir frete | Segunda solicitação |
|---|---|---:|---|---|---|---|---|
| Arrependimento | Devolução e troca | 7 dias | Não | Não | Não | Não | Pedido bloqueado |
| Casos Críticos | Devolução | 365 dias | Não | Sim | Sim | Não | Sem exceção específica |
| Devolução ao Remetente | Devolução e troca | 365 dias | Não | Sim | Sim | Não | Sem exceção específica |
| Extravio | Devolução e troca | 90 dias | Não | Sim | Sim | Não | Sem exceção específica |
| Frete | Devolução e troca | 365 dias | Não | Sim | Não | Não | Pedido e SKU liberados |
| Produto Apresentou Defeito | Devolução e troca | 30 dias | Sim | Não | Não | Não | Sem exceção específica |
| Produto Ficou Grande | Devolução e troca | 30 dias | Não | Não | Não | Não | Sem exceção específica |
| Produto Ficou Pequeno | Devolução e troca | 1 dia | Não | Não | Não | Não | Sem exceção específica |
| Recebi Produto avariado | Devolução e troca | 30 dias | Sim | Não | Não | Não | Sem exceção específica |
| Recebi Produto Errado | Devolução e troca | 30 dias | Sim | Não | Não | Não | Sem exceção específica |
| Ruptura Parcial | Devolução e troca | 365 dias | Não | Sim | Sim | Sim | Sem exceção específica |

### Logística e transportadora

- Correios ativo
- Modalidade ativa: postagem em agência
- Coleta domiciliar: inativa
- Prazo de postagem: 15 dias
- Endereço de triagem: nenhum
- Há contrato próprio dos Correios cadastrado na origem. Senha não foi copiada.
- A origem possui 26 sellers cadastrados. A associação operacional relevante para a migração está nas lojas físicas abaixo.

### Lojas físicas

Foram encontrados 27 cadastros, dos quais 25 ativos e 2 inativos. Os endereços repetidos não foram consolidados automaticamente porque estão associados a sellers diferentes.

| Nº | Endereço resumido | Seller | Situação na Genius |
|---:|---|---|---|
| 1 | Av. Governador Amaral Peixoto, 246, Centro, Nova Iguaçu/RJ | sapatella01 | Ativa |
| 2 | Av. Ministro Edgard Romero, 55, Madureira, Rio/RJ | sapatella02 | Ativa |
| 3 | Rua Conde de Bonfim, 346, Tijuca, Rio/RJ | sapatella04 | Ativa |
| 4 | Rua Fonseca, 240, Bangu, Rio/RJ | sapatella10 | Ativa |
| 5 | Rua Coronel Agostinho, 14, Campo Grande, Rio/RJ | sapatella13 | Ativa |
| 6 | Av. Pastor Martin Luther King Jr., 126, Del Castilho, Rio/RJ | sapatella15 | Ativa |
| 7 | Estrada do Campo da Areia, 132, Pechincha, Rio/RJ | sapatella16 | Ativa |
| 8 | Av. Ministro Edgard Romero, 55, Madureira, Rio/RJ | sapatella22 | Ativa |
| 9 | Av. Cônego de Vasconcelos, 161, Bangu, Rio/RJ | sapatella23 | Ativa |
| 10 | Estrada de Jacarepaguá, 7880, Freguesia, Rio/RJ | sapatella26 | Ativa |
| 11 | Estrada de Jacarepaguá, 7880, Freguesia, Rio/RJ | sapatella27 | Ativa |
| 12 | Av. Ministro Edgard Romero, 55, Madureira, Rio/RJ | 1 | Ativa |
| 13 | Rua Doutor Curvelo Cavalcanti, 388, Itaguaí/RJ | sapatella30 | Ativa |
| 14 | Av. Vicente de Carvalho, 909, Vila da Penha, Rio/RJ | sapatella33 | Ativa |
| 15 | Rua Quinze de Novembro, 8, Centro, Niterói/RJ | sapatella34 | Ativa |
| 16 | Av. das Américas, 500, Barra, Rio/RJ | sapatella35 | Ativa |
| 17 | Av. Dom Hélder Câmara, 5332, Cachambi, Rio/RJ | sapatella38 | Ativa |
| 18 | Av. Abílio Augusto Távora, 1111, Nova Iguaçu/RJ | sapatella39 | Ativa |
| 19 | Rua Dias da Cruz, 2228, Méier, Rio/RJ | sapatella41 | Inativa |
| 20 | Av. das Américas, 4666, Barra, Rio/RJ | sapatella42 | Ativa |
| 21 | Av. Ministro Edgard Romero, 55, Madureira, Rio/RJ | sapatella43 | Ativa |
| 22 | Rua Halfeld, 619, Centro, Juiz de Fora/MG | sapatella3119 | Ativa |
| 23 | Travessa Castro Alves, 619, Centro, Juiz de Fora/MG | 3119 | Inativa |
| 24 | Av. das Américas, 15500, Recreio, Rio/RJ | sapatella44 | Ativa |
| 25 | Estrada de Jacarepaguá, 7880, Freguesia, Rio/RJ | sapatella47 | Ativa |
| 26 | Rua Fonseca, 240, Bangu, Rio/RJ | sapatella10 | Ativa |
| 27 | Av. Nossa Senhora de Copacabana, 722, Copacabana, Rio/RJ | sapatella45 | Ativa |

## Dados que não devem ser transportados automaticamente

- Token VTEX
- Chave do Google Maps
- Senha dos Correios

Esses dados foram apenas conferidos na origem e não foram registrados neste arquivo.
