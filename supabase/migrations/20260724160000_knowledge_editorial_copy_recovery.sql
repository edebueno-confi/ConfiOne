-- Recuperação auditável de 7 artigos a partir da exportação Octadesk local.
-- Nenhum conteúdo novo foi inventado; títulos, resumos e corpos vieram de article.json.

begin;
update public.knowledge_articles
set title = 'Como atualizar os dados de integrações do e-commerce',
    summary = 'Para atualizar os dados de integração, siga os passos abaixo:
Acesse o painel administrativo da sua loja.',
    body_md = 'Para atualizar os dados de integração, siga os passos abaixo:
Acesse o painel administrativo da sua loja.

No menu lateral, vá até CADASTRO e selecione a aba E-COMMERCE .

Dentro dessa aba, você poderá cadastrar os dados necessários para integrar sua loja com a plataforma utilizada.

Plataformas Integradas e Dados Necessários
Aqui estão as plataformas que integramos atualmente, juntamente com as informações necessárias para cada integração:
1. Vtex
AppKey:

AppToken:

URL API:

Para completar a integração, insira os dados acima e cadastre os status permitidos para a criação de reversas.
Passo a Passo:
Certifique-se de que todas as permissões de acesso e consulta estão habilitadas.

Clique no botão TESTAR . Se não houver erros, clique em Salvar para concluir.

Se o teste gerar erro, verifique se as permissões foram corretamente habilitadas. Consulte a FAQ (inserir link da FAQ) para aprender a configurar as permissões.

2. Shopify
Store Name (Shopname):

API Token:

Status Permitidos:

Certifique-se de habilitar as permissões de acesso à API Admin para que nossa plataforma possa ler e gerar informações da sua loja.

3. Traycorp
API Token:

Store Name:

Para obter o API Token , você precisará gerá-lo na plataforma administrativa da Traycorp. Também será necessário habilitar as permissões apropriadas para garantir o funcionamento da integração.
Consulte a FAQ (inserir link da FAQ) para um passo a passo sobre como obter o API Token e configurar as permissões.

4. Oracle
Account Name:

API Token:

5. Linx Commerce
Account Name:

API Key:

API Token:

Para gerar um novo usuário e senha para acessar a API, entre em contato com o suporte da Linx Commerce e solicite a criação de um novo acesso.

6. Antmarket
API URL:

API Key:

API Token:

Também será necessário informar os status permitidos para a criação de reversas.

7. NuvemShop
Store ID:

API Token/Bearer:

Para completar essa integração, informe os status permitidos para criação de reversas. Além disso, acesse a Loja de Aplicativos da NuvemShop , localize o aplicativo Genius Returns e clique em Instalar aplicativo .

Se precisar de mais informações ou ajuda, consulte a FAQ ou entre em contato com o nosso suporte!',
    current_revision_number = current_revision_number + 1,
    updated_at = timezone('utc', now())
where id = '964e5bf7-7de7-4bf4-828e-f199ea40e45a'::uuid;

update public.knowledge_article_editorial_drafts
set title = 'Como atualizar os dados de integrações do e-commerce',
    summary = 'Para atualizar os dados de integração, siga os passos abaixo:
Acesse o painel administrativo da sua loja.',
    body_md = 'Para atualizar os dados de integração, siga os passos abaixo:
Acesse o painel administrativo da sua loja.

No menu lateral, vá até CADASTRO e selecione a aba E-COMMERCE .

Dentro dessa aba, você poderá cadastrar os dados necessários para integrar sua loja com a plataforma utilizada.

Plataformas Integradas e Dados Necessários
Aqui estão as plataformas que integramos atualmente, juntamente com as informações necessárias para cada integração:
1. Vtex
AppKey:

AppToken:

URL API:

Para completar a integração, insira os dados acima e cadastre os status permitidos para a criação de reversas.
Passo a Passo:
Certifique-se de que todas as permissões de acesso e consulta estão habilitadas.

Clique no botão TESTAR . Se não houver erros, clique em Salvar para concluir.

Se o teste gerar erro, verifique se as permissões foram corretamente habilitadas. Consulte a FAQ (inserir link da FAQ) para aprender a configurar as permissões.

2. Shopify
Store Name (Shopname):

API Token:

Status Permitidos:

Certifique-se de habilitar as permissões de acesso à API Admin para que nossa plataforma possa ler e gerar informações da sua loja.

3. Traycorp
API Token:

Store Name:

Para obter o API Token , você precisará gerá-lo na plataforma administrativa da Traycorp. Também será necessário habilitar as permissões apropriadas para garantir o funcionamento da integração.
Consulte a FAQ (inserir link da FAQ) para um passo a passo sobre como obter o API Token e configurar as permissões.

4. Oracle
Account Name:

API Token:

5. Linx Commerce
Account Name:

API Key:

API Token:

Para gerar um novo usuário e senha para acessar a API, entre em contato com o suporte da Linx Commerce e solicite a criação de um novo acesso.

6. Antmarket
API URL:

API Key:

API Token:

Também será necessário informar os status permitidos para a criação de reversas.

7. NuvemShop
Store ID:

API Token/Bearer:

Para completar essa integração, informe os status permitidos para criação de reversas. Além disso, acesse a Loja de Aplicativos da NuvemShop , localize o aplicativo Genius Returns e clique em Instalar aplicativo .

Se precisar de mais informações ou ajuda, consulte a FAQ ou entre em contato com o nosso suporte!',
    updated_at = timezone('utc', now())
where article_id = '964e5bf7-7de7-4bf4-828e-f199ea40e45a'::uuid;

update public.knowledge_articles
set title = 'Como automatizar o pagamento de Estorno e Vale-Compra',
    summary = 'Automatização de Estorno e Vale-Compra
1. Configuração de Estorno ou Vale-Compra Automático
Passo a passo para configurar o estorno ou vale-compra automático:
Acesse o painel Admin da plataforma.',
    body_md = 'Automatização de Estorno e Vale-Compra
1. Configuração de Estorno ou Vale-Compra Automático
Passo a passo para configurar o estorno ou vale-compra automático:
Acesse o painel Admin da plataforma.

No menu à esquerda, navegue até as CONFIGURAÇÕES.

Selecione a opção AMBIENTE e clique em ESTORNO/VALE-COMPRA .

Agora, configure as seguintes opções:

Gerar Vale-Compra Automaticamente : Ative para gerar automaticamente um vale-compra para o cliente.

Gerar Estorno Automático para "Fique com o Item" : Permite que o estorno seja realizado automaticamente quando essa funcionalidade estiver habilitada.

Desabilitar Coleta de Dados para Pix e Transferência : Impede a coleta de informações bancárias de clientes para reembolsos via Pix ou transferência.

Não Exibir Valores de Reembolso : Oculta os valores do reembolso para o cliente durante o processo de estorno.

2. Configurando a Automatização de Estorno ou Vale-Compra a partir do Status
Como configurar a automatização com base no status da reversa:
Acesse Configurações > Ambiente > Estorno/Vale-Compra.

Clique na opção OUTROS GATILHOS PARA ESTORNO E GERAÇÃO DE VALE-COMPRA AUTOMÁTICOS.

Defina a partir de qual status da reversa o estorno ou vale-compra será efetuado automaticamente.

3. Gatilhos Disponíveis para Estorno e Vale-Compra Automático
Gatilhos para Estorno Automático:
Nenhum (Funcionalidade desabilitada).

Ao concluir análise do produto (Rating).

Na confirmação de postagem do produto na transportadora ou Correios ( não recomendado ).

Na confirmação do recebimento no SAC (exemplo: Doca, Estoque) ( não recomendado ).

Gatilhos para Vale-Compra Automático:
Nenhum (Funcionalidade desabilitada).

Ao concluir análise do produto (Rating) .

Na confirmação de postagem do produto na transportadora ou Correios ( não recomendado ).

Na confirmação do recebimento no SAC (exemplo: Doca, Estoque) ( não recomendado ).

4. Considerações Importantes
As funcionalidades foram desenvolvidas para tornar o processo mais rápido e eficiente.

Não recomendamos os gatilhos "Na confirmação de postagem" e "Na confirmação de recebimento", pois sem análise manual, não é possível garantir que o produto devolvido esteja em condições adequadas.

Sempre teste as configurações após ativar as opções para garantir que os processos estejam ocorrendo conforme esperado.',
    current_revision_number = current_revision_number + 1,
    updated_at = timezone('utc', now())
where id = 'ecdad886-ede5-4182-92a4-ddaf28de30c5'::uuid;

update public.knowledge_article_editorial_drafts
set title = 'Como automatizar o pagamento de Estorno e Vale-Compra',
    summary = 'Automatização de Estorno e Vale-Compra
1. Configuração de Estorno ou Vale-Compra Automático
Passo a passo para configurar o estorno ou vale-compra automático:
Acesse o painel Admin da plataforma.',
    body_md = 'Automatização de Estorno e Vale-Compra
1. Configuração de Estorno ou Vale-Compra Automático
Passo a passo para configurar o estorno ou vale-compra automático:
Acesse o painel Admin da plataforma.

No menu à esquerda, navegue até as CONFIGURAÇÕES.

Selecione a opção AMBIENTE e clique em ESTORNO/VALE-COMPRA .

Agora, configure as seguintes opções:

Gerar Vale-Compra Automaticamente : Ative para gerar automaticamente um vale-compra para o cliente.

Gerar Estorno Automático para "Fique com o Item" : Permite que o estorno seja realizado automaticamente quando essa funcionalidade estiver habilitada.

Desabilitar Coleta de Dados para Pix e Transferência : Impede a coleta de informações bancárias de clientes para reembolsos via Pix ou transferência.

Não Exibir Valores de Reembolso : Oculta os valores do reembolso para o cliente durante o processo de estorno.

2. Configurando a Automatização de Estorno ou Vale-Compra a partir do Status
Como configurar a automatização com base no status da reversa:
Acesse Configurações > Ambiente > Estorno/Vale-Compra.

Clique na opção OUTROS GATILHOS PARA ESTORNO E GERAÇÃO DE VALE-COMPRA AUTOMÁTICOS.

Defina a partir de qual status da reversa o estorno ou vale-compra será efetuado automaticamente.

3. Gatilhos Disponíveis para Estorno e Vale-Compra Automático
Gatilhos para Estorno Automático:
Nenhum (Funcionalidade desabilitada).

Ao concluir análise do produto (Rating).

Na confirmação de postagem do produto na transportadora ou Correios ( não recomendado ).

Na confirmação do recebimento no SAC (exemplo: Doca, Estoque) ( não recomendado ).

Gatilhos para Vale-Compra Automático:
Nenhum (Funcionalidade desabilitada).

Ao concluir análise do produto (Rating) .

Na confirmação de postagem do produto na transportadora ou Correios ( não recomendado ).

Na confirmação do recebimento no SAC (exemplo: Doca, Estoque) ( não recomendado ).

4. Considerações Importantes
As funcionalidades foram desenvolvidas para tornar o processo mais rápido e eficiente.

Não recomendamos os gatilhos "Na confirmação de postagem" e "Na confirmação de recebimento", pois sem análise manual, não é possível garantir que o produto devolvido esteja em condições adequadas.

Sempre teste as configurações após ativar as opções para garantir que os processos estejam ocorrendo conforme esperado.',
    updated_at = timezone('utc', now())
where article_id = 'ecdad886-ede5-4182-92a4-ddaf28de30c5'::uuid;

update public.knowledge_articles
set title = 'Como cadastrar motivos para troca ou devolução',
    summary = 'Cadastrando motivos para troca e devolução
Passo a passo para configurar os motivos de troca ou devolução:
Acesse o painel Admin da plataforma.',
    body_md = 'Cadastrando motivos para troca e devolução
Passo a passo para configurar os motivos de troca ou devolução:
Acesse o painel Admin da plataforma.

No menu à esquerda, clique em CONFIGURAÇÕES .

Selecione a opção MOTIVOS . Você será direcionado para um ambiente onde verá todos os motivos de troca ou devolução já cadastrados na sua loja.

Caso precise adicionar novos motivos , clique no botão "+" .

Ao clicar no botão "+" , o e-commerce será redirecionado para a página de cadastro de motivos, onde você deverá:
Inserir o nome do motivo que deseja cadastrar.

Escolher o tipo do motivo (troca ou devolução).

Dica : Organize seus motivos de forma clara e objetiva para facilitar o processo de devolução e troca para seus clientes, além de garantir que cada motivo tenha a categoria correta (troca ou devolução) para otimizar o gerenciamento interno.',
    current_revision_number = current_revision_number + 1,
    updated_at = timezone('utc', now())
where id = '5b50abcf-c0b0-48d2-ae4e-3c3a996f0e51'::uuid;

update public.knowledge_article_editorial_drafts
set title = 'Como cadastrar motivos para troca ou devolução',
    summary = 'Cadastrando motivos para troca e devolução
Passo a passo para configurar os motivos de troca ou devolução:
Acesse o painel Admin da plataforma.',
    body_md = 'Cadastrando motivos para troca e devolução
Passo a passo para configurar os motivos de troca ou devolução:
Acesse o painel Admin da plataforma.

No menu à esquerda, clique em CONFIGURAÇÕES .

Selecione a opção MOTIVOS . Você será direcionado para um ambiente onde verá todos os motivos de troca ou devolução já cadastrados na sua loja.

Caso precise adicionar novos motivos , clique no botão "+" .

Ao clicar no botão "+" , o e-commerce será redirecionado para a página de cadastro de motivos, onde você deverá:
Inserir o nome do motivo que deseja cadastrar.

Escolher o tipo do motivo (troca ou devolução).

Dica : Organize seus motivos de forma clara e objetiva para facilitar o processo de devolução e troca para seus clientes, além de garantir que cada motivo tenha a categoria correta (troca ou devolução) para otimizar o gerenciamento interno.',
    updated_at = timezone('utc', now())
where article_id = '5b50abcf-c0b0-48d2-ae4e-3c3a996f0e51'::uuid;

update public.knowledge_articles
set title = 'Como configurar o BlockList?',
    summary = 'Acesse a área administrativa da plataforma.',
    body_md = 'Acesse a área administrativa da plataforma.

No menu, clique em Configurações > Administrativo .

Localize a opção Controle de BlockList .

Como um cliente entra no BlockList?
Ao realizar o Rating do item , se o campo "Estado do item" para "NÃO DEVOLVIDO" , o cliente Lista de blocos .',
    current_revision_number = current_revision_number + 1,
    updated_at = timezone('utc', now())
where id = '2c5ea31a-7faf-4af9-a3ce-cc8332022e9d'::uuid;

update public.knowledge_article_editorial_drafts
set title = 'Como configurar o BlockList?',
    summary = 'Acesse a área administrativa da plataforma.',
    body_md = 'Acesse a área administrativa da plataforma.

No menu, clique em Configurações > Administrativo .

Localize a opção Controle de BlockList .

Como um cliente entra no BlockList?
Ao realizar o Rating do item , se o campo "Estado do item" para "NÃO DEVOLVIDO" , o cliente Lista de blocos .',
    updated_at = timezone('utc', now())
where article_id = '2c5ea31a-7faf-4af9-a3ce-cc8332022e9d'::uuid;

update public.knowledge_articles
set title = 'Configurando parametrização geral',
    summary = 'Menu parametrização geral
No menu Parametrização Geral , o e-commerce pode configurar diversas funcionalidades essenciais, incluindo a personalização da cor principal do front-end e outras configurações detalhadas, como:
Funcionalidades:
Gerar Ticket Reverso Automaticamente
Ao habilitar essa funcionalidade, o código de',
    body_md = 'Menu parametrização geral
No menu Parametrização Geral , o e-commerce pode configurar diversas funcionalidades essenciais, incluindo a personalização da cor principal do front-end e outras configurações detalhadas, como:
Funcionalidades:
Gerar Ticket Reverso Automaticamente
Ao habilitar essa funcionalidade, o código de postagem será gerado automaticamente assim que o cliente finalizar uma solicitação, sem necessidade de análise prévia da reversa.

Solicitar Envio de Fotos do(s) Produto(s)
Com essa funcionalidade habilitada, o cliente poderá incluir até 3 imagens ao realizar sua solicitação no front-end.

Habilitar Transportadora de Melhor Custo
Permite que o sistema sugira automaticamente a transportadora mais econômica para o processo de logística reversa.

Habilitar Custo Estimado da Logística Reversa
Exibe o custo estimado da logística reversa para o cliente, ajudando a tomar decisões informadas.

Habilitar Modo B2B
Permite ativar o modo de negócios para negócios (B2B), ajustando as funcionalidades conforme as necessidades específicas dessa modalidade.

Cálculo Automático do Número de Autorizações Necessárias
O sistema calculará automaticamente a quantidade de autorizações necessárias para completar o processo de reversa.

Concluir Processo ao Sanar Pendência Financeira
Com esta funcionalidade ativada, a plataforma concluirá automaticamente o processo de reversa, alterando o status de "pendente" para "concluído" assim que a pendência financeira for resolvida.

Habilitar Estorno por Item
Permite realizar estornos individuais por item em uma solicitação de reversa.

1. Operações Permitidas
Aqui, o e-commerce pode configurar quais operações deseja permitir: Troca , Devolução ou Ambas as opções. Configure conforme a necessidade do seu negócio.

2. Fique com o Item
Nessa funcionalidade, o e-commerce pode configurar regras para não necessitar de logística reversa em determinados casos de troca ou devolução, como:
Tipo de solicitação

Percentual de custo da logística reversa

Quantidade mensal de "Fique com o Item" por cliente

3. Sellers Permitidos
Configure quais Sellers terão permissão para criar reservas pela plataforma Genius Returns . (Consulte a FAQ para aprender a configurar as permissões de Sellers).

4. Produtos em Exceção
Nessa funcionalidade, você pode configurar produtos ou categorias específicas que não terão permissão para criar reversas.
Para bloquear produtos , informe o ID de cada SKU e pressione ENTER ou TAB .

Para bloquear categorias , informe o ID de cada categoria e pressione ENTER ou TAB .

5. Regra para Segunda Solicitação do Mesmo Pedido ou SKU
Determine se o cliente poderá ou não continuar com uma segunda solicitação para o mesmo pedido ou item (SKU). Configure conforme necessário para o seu processo.

6. Segurança

7. Informar SKU de Troca por Texto
Permite configurar o envio do SKU da troca por texto, caso necessário. Habilitando ou não que o cliente ao invés de selecionar o item de troca, ele escreve ou cole o link do item que deseja trocar

8. Variação do Produto
Configure como as variações de tamanho dos produtos serão tratadas no processo de reversa.

Com essas configurações, você pode personalizar o processo de reversa de acordo com as necessidades do seu e-commerce, garantindo uma gestão eficiente e automatizada.',
    current_revision_number = current_revision_number + 1,
    updated_at = timezone('utc', now())
where id = '7b11f20c-20ab-4550-8e95-570a9bfda612'::uuid;

update public.knowledge_article_editorial_drafts
set title = 'Configurando parametrização geral',
    summary = 'Menu parametrização geral
No menu Parametrização Geral , o e-commerce pode configurar diversas funcionalidades essenciais, incluindo a personalização da cor principal do front-end e outras configurações detalhadas, como:
Funcionalidades:
Gerar Ticket Reverso Automaticamente
Ao habilitar essa funcionalidade, o código de',
    body_md = 'Menu parametrização geral
No menu Parametrização Geral , o e-commerce pode configurar diversas funcionalidades essenciais, incluindo a personalização da cor principal do front-end e outras configurações detalhadas, como:
Funcionalidades:
Gerar Ticket Reverso Automaticamente
Ao habilitar essa funcionalidade, o código de postagem será gerado automaticamente assim que o cliente finalizar uma solicitação, sem necessidade de análise prévia da reversa.

Solicitar Envio de Fotos do(s) Produto(s)
Com essa funcionalidade habilitada, o cliente poderá incluir até 3 imagens ao realizar sua solicitação no front-end.

Habilitar Transportadora de Melhor Custo
Permite que o sistema sugira automaticamente a transportadora mais econômica para o processo de logística reversa.

Habilitar Custo Estimado da Logística Reversa
Exibe o custo estimado da logística reversa para o cliente, ajudando a tomar decisões informadas.

Habilitar Modo B2B
Permite ativar o modo de negócios para negócios (B2B), ajustando as funcionalidades conforme as necessidades específicas dessa modalidade.

Cálculo Automático do Número de Autorizações Necessárias
O sistema calculará automaticamente a quantidade de autorizações necessárias para completar o processo de reversa.

Concluir Processo ao Sanar Pendência Financeira
Com esta funcionalidade ativada, a plataforma concluirá automaticamente o processo de reversa, alterando o status de "pendente" para "concluído" assim que a pendência financeira for resolvida.

Habilitar Estorno por Item
Permite realizar estornos individuais por item em uma solicitação de reversa.

1. Operações Permitidas
Aqui, o e-commerce pode configurar quais operações deseja permitir: Troca , Devolução ou Ambas as opções. Configure conforme a necessidade do seu negócio.

2. Fique com o Item
Nessa funcionalidade, o e-commerce pode configurar regras para não necessitar de logística reversa em determinados casos de troca ou devolução, como:
Tipo de solicitação

Percentual de custo da logística reversa

Quantidade mensal de "Fique com o Item" por cliente

3. Sellers Permitidos
Configure quais Sellers terão permissão para criar reservas pela plataforma Genius Returns . (Consulte a FAQ para aprender a configurar as permissões de Sellers).

4. Produtos em Exceção
Nessa funcionalidade, você pode configurar produtos ou categorias específicas que não terão permissão para criar reversas.
Para bloquear produtos , informe o ID de cada SKU e pressione ENTER ou TAB .

Para bloquear categorias , informe o ID de cada categoria e pressione ENTER ou TAB .

5. Regra para Segunda Solicitação do Mesmo Pedido ou SKU
Determine se o cliente poderá ou não continuar com uma segunda solicitação para o mesmo pedido ou item (SKU). Configure conforme necessário para o seu processo.

6. Segurança

7. Informar SKU de Troca por Texto
Permite configurar o envio do SKU da troca por texto, caso necessário. Habilitando ou não que o cliente ao invés de selecionar o item de troca, ele escreve ou cole o link do item que deseja trocar

8. Variação do Produto
Configure como as variações de tamanho dos produtos serão tratadas no processo de reversa.

Com essas configurações, você pode personalizar o processo de reversa de acordo com as necessidades do seu e-commerce, garantindo uma gestão eficiente e automatizada.',
    updated_at = timezone('utc', now())
where article_id = '7b11f20c-20ab-4550-8e95-570a9bfda612'::uuid;

update public.knowledge_articles
set title = 'Regra para segunda solicitação',
    summary = 'Como configurar regra para segunda solicitação',
    body_md = 'Como configurar regra para segunda solicitação

Acesse a área administrativa da plataforma.

No menu, clique em Configurações > Parametrização Geral .

Localize a funcionalidade Regra para segunda solicitação do mesmo Pedido .

Determine se o cliente poderá ou não continuar com uma segunda solicitação para o mesmo pedido ou item (SKU). Configure conforme necessário para o seu processo.',
    current_revision_number = current_revision_number + 1,
    updated_at = timezone('utc', now())
where id = 'f721db79-02d3-4cc6-8324-395e2b45a1b1'::uuid;

update public.knowledge_article_editorial_drafts
set title = 'Regra para segunda solicitação',
    summary = 'Como configurar regra para segunda solicitação',
    body_md = 'Como configurar regra para segunda solicitação

Acesse a área administrativa da plataforma.

No menu, clique em Configurações > Parametrização Geral .

Localize a funcionalidade Regra para segunda solicitação do mesmo Pedido .

Determine se o cliente poderá ou não continuar com uma segunda solicitação para o mesmo pedido ou item (SKU). Configure conforme necessário para o seu processo.',
    updated_at = timezone('utc', now())
where article_id = 'f721db79-02d3-4cc6-8324-395e2b45a1b1'::uuid;

update public.knowledge_articles
set title = 'Variação do Produto',
    summary = 'Acesse a área administrativa da plataforma.',
    body_md = 'Acesse a área administrativa da plataforma.

No menu, clique em Configurações > Parametrização Geral .

Localize a funcionalidade VARIAÇÃO DE PRODUTO

Configure como as variações de tamanho dos produtos serão apresentadas no processo de reversa.

Com essas configurações, você pode personalizar o processo de reversa de acordo com as necessidades do seu e-commerce, garantindo uma gestão eficiente e automatizada.',
    current_revision_number = current_revision_number + 1,
    updated_at = timezone('utc', now())
where id = 'e46709ae-6228-439c-9cd3-408cc2d83ad1'::uuid;

update public.knowledge_article_editorial_drafts
set title = 'Variação do Produto',
    summary = 'Acesse a área administrativa da plataforma.',
    body_md = 'Acesse a área administrativa da plataforma.

No menu, clique em Configurações > Parametrização Geral .

Localize a funcionalidade VARIAÇÃO DE PRODUTO

Configure como as variações de tamanho dos produtos serão apresentadas no processo de reversa.

Com essas configurações, você pode personalizar o processo de reversa de acordo com as necessidades do seu e-commerce, garantindo uma gestão eficiente e automatizada.',
    updated_at = timezone('utc', now())
where article_id = 'e46709ae-6228-439c-9cd3-408cc2d83ad1'::uuid;
commit;
