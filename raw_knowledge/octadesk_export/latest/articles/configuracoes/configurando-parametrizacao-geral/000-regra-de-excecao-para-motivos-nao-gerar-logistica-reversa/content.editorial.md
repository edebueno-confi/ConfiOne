### Como Habilitar a Regra?

Para configurar a regra de exceção que impede a geração automática da logística reversa, siga os passos abaixo:

- Acesse Configurações > Ambiente > Motivos.
- Localize o motivo cadastrado.
- Marque a opção “Não Gerar Logística Reversa”.

![Imagem do artigo Regra de Exceção para Motivos - Não Gerar Logística Reversa](knowledge-asset-source:octa-static-tenants/o205658-f7a/knowledgebase/2025-02-19/_yexb-btc_j3jrcgwsmt0.com)

### Funcionamento da Regra

Essa funcionalidade foi desenvolvida para atender a uma necessidade do setor de SAC. Para que ela funcione corretamente, é essencial que a regra geral Gerar Ticket Reverso Automaticamente esteja ativada. Para verificar ou ativar essa regra:

- Vá até Configuração > Ambiente > Parametrização Geral.
- Ative a opção Gerar Ticket Reverso Automaticamente.

![Imagem do artigo Regra de Exceção para Motivos - Não Gerar Logística Reversa](knowledge-asset-source:octa-static-tenants/o205658-f7a/knowledgebase/2025-02-19/rkv5byavdqe1nl23zqewy.com)

Com essa configuração ativa, os motivos que forem marcados como “Não Gerar Logística Reversa” não vão disparar a autorização postal automática. Dessa forma, a autorização de postagem precisará ser realizada manualmente pelo botão “Gerar e-Ticket”, disponível na aba Ações Pendentes das solicitações.

![Imagem do artigo Regra de Exceção para Motivos - Não Gerar Logística Reversa](knowledge-asset-source:octa-static-tenants/o205658-f7a/knowledgebase/2025-02-19/6s6_xpivha5cjjmnc81ej.com)

### Impacto para o Consumidor

O consumidor continuará recebendo o e-mail transacional sobre a solicitação efetuada. Entretanto, no corpo do e-mail, haverá a mensagem: “Processo em liberação, por favor aguarde.” Isso indica que o envio da autorização será analisado e poderá ocorrer posteriormente, de forma manual.

### Exemplo de Aplicação

Em casos onde a regra de Foto Obrigatória é utilizada em conjunto com Não Gerar Logística Reversa, o SAC poderá analisar as imagens enviadas antes de tomar a decisão sobre autorizar ou não a postagem do produto.

![Imagem do artigo Regra de Exceção para Motivos - Não Gerar Logística Reversa](knowledge-asset-source:octa-static-tenants/o205658-f7a/knowledgebase/2025-02-19/816juy_gwmdoznjfyjtv-.com)

Para facilitar a identificação das solicitações que requerem ação manual, essas serão marcadas com um símbolo de exclamação.

![Imagem do artigo Regra de Exceção para Motivos - Não Gerar Logística Reversa](knowledge-asset-source:octa-static-tenants/o205658-f7a/knowledgebase/2025-02-19/kp5hx5fyqk0h4ddix7uir.com)

### Dica para Identificação Rápida

Para visualizar todas as solicitações pendentes de autorização de postagem, utilize o seguinte filtro:

- Vá até Filtros.
- Selecione Filtros por Tipo de Pendência > Autorização Logística Reversa.

Com isso, o SAC poderá gerenciar de forma eficiente as solicitações que exigem ação manual.

::related como-cadastrar-motivos-para-troca-ou-devolucao
Como cadastrar motivos para troca ou devolução
CADASTRANDO MOTIVOS PARA TROCA E DEVOLUO
::
