# Status da migração: Sonho dos Pés

## Resultado atual

A conta Sonho dos Pés foi identificada corretamente na Genius e na After Sale
V2. As configurações gerais compatíveis já foram transportadas para a V2.

A revisão loja a loja encontrou 99 registros na Genius. Desses, 96 estão
ativos e possuem endereço e ID restritor; um deles é duplicado, dois estão
inativos e sem ID restritor, e um registro ativo está sem endereço. A base
segura para cadastro sem duplicidade contém 95 lojas.

## Configurado na V2

| Área | Resultado |
|---|---|
| Motivos | Motivos ativos da Genius cadastrados ou ajustados, com prazos, evidências e visibilidade administrativa |
| Motivos inativos | Produto em garantia mantido inativo |
| Frete | Regra de estorno por pedido ativada, com exceções por motivo conforme a origem |
| Postagem | Correios configurado como conector da postagem |
| Score de clientes | Ativado com a configuração padrão |
| Retenção | Mantida desativada, pois não havia valor configurado na Genius |
| Integração VTEX | Não alterada |

## Cadastro das lojas físicas

Foi preparada a carga de 95 lojas ativas, com endereço válido, ID restritor
preenchido e sem duplicidade de endereço e código. A tela da V2, conferida após
a primeira gravação, mostra exatamente **1 registro ativo**: `Loja
sonhodospes70`, vinculada a Sonho dos Pés, com CNPJ `28.445.729/0001-90`.

O cadastro usa o ID restritor como identificador externo da loja e ativa o
retorno para a loja de origem. As outras 94 lojas ainda não foram confirmadas
na V2.

Como a Genius não fornece um CNPJ individual por loja, foi usado o CNPJ da
empresa Sonho dos Pés, `28.445.729/0001-90`, em cada registro. Essa é uma
adaptação necessária ao cadastro da V2 e deve ser mantida na conferência final.

O arquivo de carga contém 95 registros. A validação final da quantidade exibida
na tela da V2 deve ser feita após a página de lojas ser recarregada.

## Limitações registradas

- Tokens, senhas e demais credenciais não fazem parte do transporte automático.
- Dois registros inativos da Genius, sem ID restritor, não foram levados para a
  V2. Um registro ativo, mas sem endereço, também ficou fora da carga. Um
  endereço duplicado foi mantido uma única vez.
- Textos e modelos de e-mail não impedem a conclusão da migração; devem ser
  personalizados diretamente no editor da V2.
- A opção “Apenas devoluções” da Genius não foi interpretada como bloqueio de
  vale-compra. O fluxo de devolução da V2 permanece compatível com escolha de
  vale-compra ou estorno.

## Próxima ação

Recarregar a lista de lojas na V2 e confirmar a quantidade efetivamente criada.
Depois, conferir amostras do primeiro, de um endereço duplicado tratado e do
último registro, verificando nome, ID externo, endereço, CNPJ e retorno para a
origem.

Os arquivos de apoio da conferência são:

- `LOJAS_FISICAS_SONHO_DOS_PES_ORIGEM.csv`, com os 99 registros e o status de revisão.
- `LOJAS_V2_CADASTRO_SONHO_DOS_PES.csv`, com as 95 lojas únicas aptas para cadastro.
- `MIGRACAO_GENIUS_V2_SONHO_DOS_PES.html`, relatório completo com de-para e impedimentos.
- `RELATORIO_GERENCIAL_MARI_SONHO_DOS_PES.html`, resumo gerencial para compartilhamento.

Se uma tela não oferecer algum campo existente na Genius, o cadastro deve seguir
com os campos suportados e a diferença deve ser listada no relatório final, sem
impedir as demais lojas.

## Observação operacional

A aba da V2 precisa ser recarregada antes da conferência final para liberar a
leitura da lista após o cadastro em lote. Nenhum novo registro deve ser criado
antes dessa conferência, para evitar duplicidades.
