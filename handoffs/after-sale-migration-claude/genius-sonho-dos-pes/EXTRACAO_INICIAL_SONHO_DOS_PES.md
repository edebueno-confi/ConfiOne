# Extração inicial da Genius: Sonho dos Pés

## Identificação

- Cliente na Genius: Sonho dos Pés
- Razão social exibida: SOMOS SONHO LTDA
- CNPJ: 28.445.729/0001-90
- Site: https://www.sonhodospesoficial.com.br/
- Alias da Genius: sonhodospes
- Conta de e-commerce: VTEX
- VTEX Account Name: sonhodospes
- Operações permitidas na Genius: Apenas devoluções

## Parâmetros gerais encontrados

| Parâmetro | Estado ou valor |
|---|---|
| Gerar ticket reverso automaticamente | Ativo |
| Solicitar fotos dos produtos | Inativo |
| Transportadora de melhor custo | Inativo |
| Cálculo estimado de logística reversa | Inativo |
| Modo B2B | Inativo |
| Cálculo automático do número de autorizações | Ativo |
| Concluir processo ao sanar pendência financeira | Ativo |
| Estorno por item | Ativo |
| Troca por texto | Inativo |
| Segunda solicitação do mesmo pedido | Não permitir |
| Segunda solicitação do mesmo SKU | Permitir |
| Segurança adicional para login | Nenhuma especificada |
| Fique com o item | Valor mínimo zero, portanto sem uso configurado |
| Sellers autorizados na abertura | Campo em branco, sem restrição geral |
| Estorno automático para fique com o item | Inativo |
| Ocultar valores de reembolso | Inativo |
| Desabilitar coleta de dados para Pix e transferência | Inativo |
| Estorno automático via Pix | Ativo |
| Gatilho de estorno automático | Na confirmação de recebimento |
| Gatilho de vale-compra automático | Na confirmação de postagem |
| Cálculo de estorno | Padrão |
| Pedido com vale-compra | Permitir vale-compra ou estorno |
| Formas de estorno manual | Conta bancária e Pix |
| Estorno do frete | Proporcional por quantidade dos itens |
| Conflito entre vale-compra e estorno | Liberar ambos |

## Motivos

Todos os 12 motivos exibidos na Genius estão ativos, exceto “Produto em garantia”. Os valores abaixo foram lidos no cadastro da conta.

| Motivo | Ativo | Prazo | Foto obrigatória | Não incluir frete | Exceção 2º pedido | Exceção 2º SKU | Não gerar logística | Somente SAC |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Arrependimento | Sim | 7 | Não | Não | Não | Não | Não | Não |
| Recebi Produto Errado | Sim | 30 | Sim | Não | Não | Não | Não | Não |
| Recebi Produto Avariado | Sim | 30 | Sim | Não | Não | Não | Não | Não |
| Produto Apresentou Defeito | Sim | 90 | Sim | Não | Não | Não | Não | Não |
| Produto em garantia | Não | 1 | Não | Não | Não | Não | Não | Sim |
| Produto Ficou Grande | Sim | 30 | Não | Não | Não | Não | Não | Não |
| Devolução ao Remetente | Sim | 365 | Não | Não | Não | Não | Sim | Sim |
| Ruptura Parcial | Sim | 90 | Não | Sim | Não | Não | Sim | Sim |
| Produto Ficou Pequeno | Sim | 30 | Não | Não | Não | Não | Não | Não |
| Casos Críticos | Sim | 90 | Não | Não | Sim | Não | Sim | Sim |
| Extravio | Sim | 90 | Não | Não | Não | Não | Sim | Sim |
| Frete | Sim | 365 | Não | Não | Sim | Sim | Sim | Sim |

O tipo de estorno exibido para todos os motivos foi “Estorno financeiro e vale-compra”.

## Logística

- Correios ativo.
- Postagem em agência ativa.
- Coleta domiciliar inativa.
- Prazo para postagem: 15 dias.
- Serviço logístico ativo no ambiente: Correios, PostagemEmAgencia, valor mínimo zero.
- Logística premium: valor mínimo zero, transportadora Correios.
- Credenciais do contrato dos Correios foram visualizadas, mas não são armazenadas neste documento nem transportadas automaticamente.

## Lojas físicas e sellers

- 99 cadastros de lojas físicas foram exibidos na listagem.
- 97 estavam ativos na leitura realizada.
- 98 estavam com split logístico ativo.
- O tipo restritor exibido foi Seller.
- As lojas físicas usam o ID restritor para identificar o seller de retorno. Isso deve ser representado na V2 como retorno para o seller, e não como simples endereço de loja.
- Há pelo menos um registro com endereço vazio ou incompleto, que exige conferência antes de qualquer importação.
- Foram exibidos 94 sellers operacionais, além do painel de cadastro. A lista contém identificadores no padrão `sonhodospes...`.
- O cadastro de sellers informa endereço logístico próprio ativo para parte do conjunto. Credenciais próprias de seller não foram transportadas.

### Regra de de-para confirmada

Na Genius, a loja física não é apenas um ponto de atendimento. Ela representa o
destino de retorno da mercadoria para a origem do pedido. O split logístico usa
o ID restritor do seller para identificar esse destino no pedido.

Na V2, cada registro deve ser tratado como cadastro de loja com retorno para o
seller correspondente. Para cada loja, a conferência deve abranger as telas de
dados da loja, endereço, detalhes operacionais, ponto de devolução e contrato ou
método logístico, quando o cadastro oferecer esses campos. A migração só será
considerada completa depois que o seller de retorno e os demais parâmetros da
loja forem conferidos individualmente.

## Alertas para a configuração na V2

1. Confirmar visualmente que o e-commerce selecionado na V2 é Sonho dos Pés antes de qualquer gravação.
2. Não transportar token VTEX, senha dos Correios, chave de mapas ou qualquer credencial.
3. Configurar os motivos ativos e manter “Produto em garantia” inativo.
4. Replicar o comportamento de retorno para seller nas lojas físicas, usando o ID restritor, após confirmar o formulário de destino da V2.
5. A Genius usa a opção “Apenas devoluções”, mas isso não deve ser interpretado automaticamente como impedimento de vale-compra. A V2 deve preservar o fluxo de devolução com escolha de vale-compra ou estorno.

## Estado da migração

As configurações gerais compatíveis já foram aplicadas na V2: motivos, prazos,
evidências, regras de frete, conector de postagem dos Correios e Score de
Clientes. A retenção foi mantida desativada porque o valor de “Fique com o
item” na Genius está zerado.

Foi preparada uma carga com 95 lojas ativas, com endereço válido, ID restritor
preenchido e sem duplicidade. O arquivo usa o ID restritor como identificador
externo, ativa o retorno para a origem e preenche o CNPJ empresarial
`28.445.729/0001-90`, pois a Genius não informa CNPJ individual por loja. Esse
uso do CNPJ empresarial é uma adaptação para o cadastro obrigatório da V2 e
deve ser conferido na validação final.

Dois registros inativos sem ID restritor, um registro ativo sem endereço e uma
duplicidade de endereço foram excluídos da carga. A quantidade efetivamente
criada na V2 deve ser confirmada após recarregar a lista de lojas, sem iniciar
uma segunda carga antes dessa conferência.
