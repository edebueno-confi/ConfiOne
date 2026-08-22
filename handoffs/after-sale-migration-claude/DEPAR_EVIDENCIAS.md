# De-para e evidências conhecidas

Este documento resume o conhecimento consolidado durante a migração da Melissa. Ele orienta a Melissa App, mas os valores da loja destino devem ser confirmados ao vivo.

## Princípios de de-para

| Origem V1 | Destino V2 | Regra de decisão |
|---|---|---|
| Parâmetro ativo | Campo equivalente na V2 | Aplicar e validar após recarregar |
| Parâmetro inativo | Campo equivalente na V2 | Manter inativo quando a equivalência for clara |
| Motivo público | Motivo de troca ou devolução | Reutilizar cadastro existente |
| Motivo administrativo | Motivo com visibilidade exclusiva no painel | Usar prazo em branco e regra administrativa |
| E-mail com modelo correspondente | Modelo ou evento equivalente | Migrar assunto, corpo e tags válidas |
| E-mail sem destino na V2 | Sem equivalente | Não bloquear; registrar como não suportado |
| Liberação no Boss | Funcionalidade potencial | Confirmar uso e configuração na V1 |
| Token ou senha | Nenhum campo documental | Usuário informa manualmente |

## Referências registradas para conferência

As referências abaixo são provenientes da documentação da Melissa e de notas de auditoria. Não devem ser copiadas sem conferência na Melissa App.

- A V1 foi tratada como fonte efetiva e a V2 como destino.
- O catálogo de motivos inclui motivos públicos e motivos exclusivos do painel administrativo.
- O marcador histórico de `-30 dias` em motivos administrativos não representa prazo negativo.
- A referência corrigida da Melissa App registra 17 status Oracle observados no DOM.
- A referência histórica de motivos da Melissa App registra 66 ativos, 4 públicos e 62 administrativos.
- A referência da Melissa registrou 47 regras V2 por e-commerce em uma auditoria anterior.
- Em integrações Oracle, o site esperado para Melissa é `B2CMN` e para Melissa App é `B2CMNApp`. O código e o cliente devem ser confirmados no ambiente atual.
- `custom_seller_field` e `locationId` são opções de integração que devem ser conferidas no corpo da configuração, sem confundir com a URL da API.
- V2 defaults derivados de catálogos de regras, prazos ou retenção não comprovam equivalência com a V1.

## Classificação humana dos resultados

| Situação | Significado |
|---|---|
| Migrado | A configuração equivalente existe, foi aplicada e foi conferida após recarregar. |
| Migrado com ajuste | A mesma finalidade foi mantida, mas o campo ou a forma de representação mudou. |
| Migrado parcialmente | Somente parte da regra pôde ser representada. |
| Não suportado pela V2 | A V2 não oferece o recurso correspondente. |
| Não localizado | Existe evidência na V1, mas o destino ainda não foi encontrado. |
| Não utiliza | O recurso está liberado ou disponível, mas não há evidência de uso pelo cliente. |
| Bloqueio de acesso | A leitura ou a gravação depende de uma permissão ou dado do responsável. |

## Como tratar divergências

Quando uma tela mostrar uma configuração diferente do documento:

1. trate a tela e o DOM atuais como evidência mais forte;
2. capture o valor atual da V1;
3. atualize a linha do checklist;
4. compare novamente com a V2;
5. registre a decisão concreta no relatório.

Não esconda divergências com uma descrição genérica como `conferir individualmente`. Explique qual campo foi encontrado, qual valor foi aplicado e qual limitação permaneceu.
