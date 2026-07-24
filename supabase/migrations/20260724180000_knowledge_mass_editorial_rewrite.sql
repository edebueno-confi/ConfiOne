-- Normalização editorial em massa da Central pública.
-- Conteúdo derivado do estado local publicado; sem criação de dados ou assets.
begin;
update public.knowledge_articles set title='Ambientes de produção, QA e testes', summary='Escolha o ambiente adequado e evite testar credenciais ou dados reais no lugar errado.', body_md='### Produção

Use [produção]({{link:production}}) somente para operações autorizadas e com credenciais válidas para o ambiente produtivo.

### QA

Use [QA]({{link:qa}}) para validação controlada quando sua integração estiver habilitada nesse ambiente.

### Mock

O mock ajuda a explorar a especificação sem executar uma operação de negócio real.

### Regras de segurança

- não reutilize credenciais reais no Swagger ou no mock;
- não coloque tokens em exemplos, logs ou capturas;
- confirme o ambiente antes de enviar qualquer requisição;
- lembre que a presença de uma rota não garante habilitação para todos os clientes.', updated_at=timezone('utc', now()) where id='60ee7531-bf1d-485e-b88f-00ef6303eb0b'::uuid;
update public.knowledge_articles set title='API Docs, Swagger e referência técnica', summary='Saiba quando usar a Central, a API Docs e o Swagger durante uma integração.', body_md='### Central de Ajuda

Use a Central para descobrir o que é possível, escolher o recurso, entender pré-requisitos e seguir o fluxo de negócio.

### API Docs

A [API Docs]({{link:api_docs}}) é a referência técnica principal. Use-a para consultar parâmetros, payloads, respostas, modelos, exemplos e a especificação OpenAPI.

### Swagger

O [Swagger]({{link:swagger}}) é uma referência complementar e interativa. Use-o para explorar o contrato técnico e consultar schemas em ambiente autorizado.

:::callout warning
A presença de uma operação no Swagger não significa que ela esteja habilitada ou recomendada para todos os clientes. Operações que aparecem somente no Swagger permanecem fora da trilha pública até validação técnica.
:::

### Especificação

Também é possível baixar a [especificação OpenAPI]({{link:api_docs_spec}}) diretamente da API Docs.', updated_at=timezone('utc', now()) where id='14b42a23-8de4-43c6-86f4-c47be5f01fee'::uuid;
update public.knowledge_articles set title='Boas práticas antes de acionar suporte', summary='Checklist curto para abrir chamados com contexto suficiente e acelerar a análise do suporte.', body_md='Um chamado bem contextualizado reduz o tempo de triagem e evita trocas desnecessárias.

### Reúna estas informações

- cliente ou operação impactada
- identificador da solicitação, pedido ou coleta
- horário aproximado da ocorrência
- impacto operacional percebido

### Descreva o comportamento observado

Explique o que deveria acontecer, o que aconteceu de fato e desde quando o desvio foi percebido.

### Anexe apenas o necessário

Prefira prints, planilhas ou relatórios exportados que ajudem a reproduzir o contexto sem expor dados sensíveis de outras operações.', updated_at=timezone('utc', now()) where id='15b65082-2c8b-434e-81bf-378fe54c9b08'::uuid;
update public.knowledge_articles set title='Checklist de integração ERP e webhook', summary='Checklist público para validar configurações mínimas e reduzir retrabalho em incidentes de integração.', body_md='Antes de escalar um incidente de integração, percorra este checklist com o time responsável.

### Validações iniciais

- confirmar a URL configurada para recebimento
- validar se o ambiente certo está em uso
- revisar o último evento recebido com data e horário

### Confirmações recomendadas

- o time do ERP recebeu o retorno esperado
- não houve mudança recente de endpoint sem alinhamento
- o identificador usado na conciliação continua válido

### O que compartilhar no ticket

Inclua o horário do último evento, o identificador afetado e a descrição objetiva do que deixou de acontecer.', updated_at=timezone('utc', now()) where id='5893060f-5f2b-4cb4-982c-82411bed034c'::uuid;
update public.knowledge_articles set title='Como acompanhar solicitações de troca e devolução', summary='Passo a passo para acompanhar uma solicitação e alinhar expectativa com operação, CS e cliente.', body_md='Use este roteiro para acompanhar a evolução de uma solicitação sem perder contexto entre atendimento, operação e cliente.

### Confirme os dados básicos

- número da solicitação
- canal de abertura
- cliente responsável pelo acompanhamento

### Revise a última atualização válida

Antes de responder, confira a última movimentação registrada e valide se ainda representa a etapa atual do processo.

### Alinhe o próximo passo

Explique sempre qual é a próxima ação esperada: coleta, análise, transporte, confirmação do recebimento ou retorno do financeiro.

### Registre evidências objetivas

Quando houver atraso ou divergência, compartilhe número do pedido, identificador da solicitação e uma descrição curta do impacto operacional.', updated_at=timezone('utc', now()) where id='0191e47b-1a43-448a-9ee6-586eb43010bc'::uuid;
update public.knowledge_articles set title='Como atualizar os dados de integrações do e-commerce', summary='Para atualizar os dados de integração, siga os passos abaixo:', body_md='### Para atualizar os dados de integração, siga os passos abaixo

Acesse o painel administrativo da sua loja.

No menu lateral, vá até CADASTRO e selecione a aba E-COMMERCE .

Dentro dessa aba, você poderá cadastrar os dados necessários para integrar sua loja com a plataforma utilizada.

Plataformas Integradas e Dados Necessários
Aqui estão as plataformas que integramos atualmente, juntamente com as informações necessárias para cada integração:

### Vtex

AppKey:

AppToken:

URL API:

Para completar a integração, insira os dados acima e cadastre os status permitidos para a criação de reversas.

### Passo a Passo

Certifique-se de que todas as permissões de acesso e consulta estão habilitadas.

Clique no botão TESTAR . Se não houver erros, clique em Salvar para concluir.

Se o teste gerar erro, verifique se as permissões foram corretamente habilitadas. Consulte a FAQ (inserir link da FAQ) para aprender a configurar as permissões.

### Shopify

Store Name (Shopname):

API Token:

Status Permitidos:

Certifique-se de habilitar as permissões de acesso à API Admin para que nossa plataforma possa ler e gerar informações da sua loja.

### Traycorp

API Token:

Store Name:

Para obter o API Token , você precisará gerá-lo na plataforma administrativa da Traycorp. Também será necessário habilitar as permissões apropriadas para garantir o funcionamento da integração.
Consulte a FAQ (inserir link da FAQ) para um passo a passo sobre como obter o API Token e configurar as permissões.

### Oracle

Account Name:

API Token:

### Linx Commerce

Account Name:

API Key:

API Token:

Para gerar um novo usuário e senha para acessar a API, entre em contato com o suporte da Linx Commerce e solicite a criação de um novo acesso.

### Antmarket

API URL:

API Key:

API Token:

Também será necessário informar os status permitidos para a criação de reversas.

### NuvemShop

Store ID:

API Token/Bearer:

Para completar essa integração, informe os status permitidos para criação de reversas. Além disso, acesse a Loja de Aplicativos da NuvemShop , localize o aplicativo Genius Returns e clique em Instalar aplicativo .

Se precisar de mais informações ou ajuda, consulte a FAQ ou entre em contato com o nosso suporte!', updated_at=timezone('utc', now()) where id='964e5bf7-7de7-4bf4-828e-f199ea40e45a'::uuid;
update public.knowledge_articles set title='Como autenticar uma integração', summary='Veja o fluxo conceitual de autenticação sem expor credenciais ou tokens reais.', body_md='A autenticação deve acontecer no backend seguro do sistema integrador.

### Fluxo

### Receba `GeniusKey` e `GeniusToken` pelos canais autorizados da Genius Returns.

### Envie esses cabeçalhos para a operação de autenticação.

### Receba o JWT retornado.

### Use o valor retornado como `Bearer Token` nas chamadas protegidas.

### Renove o token conforme a expiração informada pela resposta.

::api-reference authenticate

:::callout danger

Use somente placeholders em exemplos. Nunca coloque credenciais, JWTs, tokens, cookies ou secrets no frontend, no repositório ou em capturas de tela.
:::

### Ambientes

Use [produção]({{link:production}}), [QA]({{link:qa}}) ou o mock conforme a finalidade do teste. A habilitação e o acesso podem variar por contrato.', updated_at=timezone('utc', now()) where id='b747aaee-671d-40bc-bc9a-9994217df2df'::uuid;
update public.knowledge_articles set title='Como automatizar a conclusão de uma solicitação', summary='Como Automatizar a Conclusão da Solicitação', body_md='### Como Automatizar a Conclusão da Solicitação

Para otimizar o fluxo de atendimento e garantir que as solicitações sejam concluídas automaticamente ao sanar a pendência financeira, siga o passo a passo abaixo:

### Configurando a Automação da Conclusão

- Acesse Configurações no menu administrativo.
- Navegue até Ambiente > Parametrização Geral.
- Ative a opção "Concluir processo ao sanar pendência financeira".
- Clique em Salvar para aplicar as configurações.

![Imagem do artigo Como automatizar a conclusão de uma solicitação](knowledge-asset:8402255f-04ee-4c87-8da0-1740f34a7d3c)

![Imagem do artigo Como automatizar a conclusão de uma solicitação](knowledge-asset:5cee6161-1a68-4834-847e-f96a738f60d6)

### Como Funciona a Automação?

Por padrão, cada solicitação deve ter seu status alterado manualmente de Pendente para Concluído na aba Resumo da Solicitação. No entanto, esse processo pode ser automatizado com a funcionalidade citada acima.

Ao ativar essa configuração, sempre que uma pendência financeira for resolvida (seja pela geração do vale-compra ou pela autorização do estorno), a solicitação será automaticamente alterada para Concluída. Dessa forma, não será necessário acessar a aba Resumo das Solicitações para realizar essa alteração manualmente.

### Impacto no SLA e na Métrica de Atendimento

A conclusão da solicitação impacta diretamente no SLA de atendimento. Se o status permanecer como Pendente, o tempo de atendimento será contabilizado além do necessário, impactando negativamente as métricas.

A contagem do SLA se inicia no momento da postagem do produto na transportadora ou nos Correios e encerra somente quando o status da solicitação for alterado para Concluído. Caso o status não seja atualizado, o dashboard pode apresentar dados distorcidos, mesmo que o processo de estorno ou vale-compra já tenha sido realizado.

### Resumo

- Ativar essa configuração permite que o sistema altere automaticamente o status de Pendente para Concluído assim que a pendência financeira for resolvida.
- Essa automação evita a necessidade de alteração manual e melhora a eficiência do atendimento.
- Garantir que o status seja atualizado corretamente evita distorções no SLA e melhora a precisão das métricas no dashboard.

![Imagem do artigo Como automatizar a conclusão de uma solicitação](knowledge-asset:2eea576c-20a0-4dfb-b4e4-0c8f06e4e27e)', updated_at=timezone('utc', now()) where id='1e4b942f-0e43-4ff9-87ff-f48ead1df40f'::uuid;
update public.knowledge_articles set title='Como automatizar o pagamento de Estorno e Vale-Compra', summary='Automatização de Estorno e Vale-Compra', body_md='Automatização de Estorno e Vale-Compra

### Configuração de Estorno ou Vale-Compra Automático

### Passo a passo para configurar o estorno ou vale-compra automático

Acesse o painel Admin da plataforma.

No menu à esquerda, navegue até as CONFIGURAÇÕES.

Selecione a opção AMBIENTE e clique em ESTORNO/VALE-COMPRA .

Agora, configure as seguintes opções:

Gerar Vale-Compra Automaticamente : Ative para gerar automaticamente um vale-compra para o cliente.

Gerar Estorno Automático para "Fique com o Item" : Permite que o estorno seja realizado automaticamente quando essa funcionalidade estiver habilitada.

Desabilitar Coleta de Dados para Pix e Transferência : Impede a coleta de informações bancárias de clientes para reembolsos via Pix ou transferência.

Não Exibir Valores de Reembolso : Oculta os valores do reembolso para o cliente durante o processo de estorno.

### Configurando a Automatização de Estorno ou Vale-Compra a partir do Status

### Como configurar a automatização com base no status da reversa

Acesse Configurações > Ambiente > Estorno/Vale-Compra.

Clique na opção OUTROS GATILHOS PARA ESTORNO E GERAÇÃO DE VALE-COMPRA AUTOMÁTICOS.

Defina a partir de qual status da reversa o estorno ou vale-compra será efetuado automaticamente.

### Gatilhos Disponíveis para Estorno e Vale-Compra Automático

### Gatilhos para Estorno Automático

Nenhum (Funcionalidade desabilitada).

Ao concluir análise do produto (Rating).

Na confirmação de postagem do produto na transportadora ou Correios ( não recomendado ).

Na confirmação do recebimento no SAC (exemplo: Doca, Estoque) ( não recomendado ).

### Gatilhos para Vale-Compra Automático

Nenhum (Funcionalidade desabilitada).

Ao concluir análise do produto (Rating) .

Na confirmação de postagem do produto na transportadora ou Correios ( não recomendado ).

Na confirmação do recebimento no SAC (exemplo: Doca, Estoque) ( não recomendado ).

### Considerações Importantes

As funcionalidades foram desenvolvidas para tornar o processo mais rápido e eficiente.

Não recomendamos os gatilhos "Na confirmação de postagem" e "Na confirmação de recebimento", pois sem análise manual, não é possível garantir que o produto devolvido esteja em condições adequadas.

Sempre teste as configurações após ativar as opções para garantir que os processos estejam ocorrendo conforme esperado.', updated_at=timezone('utc', now()) where id='ecdad886-ede5-4182-92a4-ddaf28de30c5'::uuid;
update public.knowledge_articles set title='Como cadastrar Lojas Físicas', summary='Para cadastrar novas lojas físicas no seu e-commerce, siga os passos abaixo:', body_md='Para cadastrar novas lojas físicas no seu e-commerce, siga os passos abaixo:

- Acesse a área administrativa da plataforma.
- No menu, clique em Configurações > Lojas Físicas.

Nesta página, você poderá visualizar e editar todas as lojas físicas cadastradas, seja como ponto de devolução para os consumidores ou como endereço de retorno para devoluções postadas ou coletadas.

### Como cadastrar uma nova loja:

- Clique no botão "+" (conforme mostrado na imagem abaixo).
- Você será direcionado para a página Cadastro de Loja Física, onde deverá adicionar os dados da loja.
- Após preencher os dados, marque a opção “ATIVO” para ativar a loja no sistema.

![Imagem do artigo Como cadastrar Lojas Físicas](knowledge-asset:b122491e-4f16-49d8-8ec9-2658bb913387)

![Imagem do artigo Como cadastrar Lojas Físicas](knowledge-asset:66441a69-615d-4cf2-8af3-0e25fc78d23b)

### Definindo o tipo de loja:

- Parceiro Logístico: Se a loja for um endereço de retorno para devoluções (retorno para o seller), marque essa opção.

![Imagem do artigo Como cadastrar Lojas Físicas](knowledge-asset:faa79e17-57e7-4806-ac6a-84250d2fe0f3)

- Entrega Física: Se a loja for um ponto de devolução para o consumidor (onde ele poderá devolver a reversa), selecione esta opção.

![Imagem do artigo Como cadastrar Lojas Físicas](knowledge-asset:ab757149-0e66-4128-9289-1634eef27ae8)

Após preencher todos os dados e selecionar o tipo de loja, basta salvar as alterações no final da tela.', updated_at=timezone('utc', now()) where id='08d21438-5612-41c3-9e75-c7b4b7857d62'::uuid;
update public.knowledge_articles set title='Como cadastrar motivos para troca ou devolução', summary='Cadastrando motivos para troca e devolução', body_md='Cadastrando motivos para troca e devolução

### Passo a passo para configurar os motivos de troca ou devolução

Acesse o painel Admin da plataforma.

No menu à esquerda, clique em CONFIGURAÇÕES .

Selecione a opção MOTIVOS . Você será direcionado para um ambiente onde verá todos os motivos de troca ou devolução já cadastrados na sua loja.

Caso precise adicionar novos motivos , clique no botão "+" .

Ao clicar no botão "+" , o e-commerce será redirecionado para a página de cadastro de motivos, onde você deverá:
Inserir o nome do motivo que deseja cadastrar.

Escolher o tipo do motivo (troca ou devolução).

:::callout info
Dica: Organize seus motivos de forma clara e objetiva para facilitar o processo de devolução e troca para seus clientes, além de garantir que cada motivo tenha a categoria correta (troca ou devolução) para otimizar o gerenciamento interno.
:::', updated_at=timezone('utc', now()) where id='5b50abcf-c0b0-48d2-ae4e-3c3a996f0e51'::uuid;
update public.knowledge_articles set title='Como cadastrar os e-mails para notificações automáticas', summary='Para configurar os e-mails que receberão as notificações automáticas, siga os passos abaixo:', body_md='Para configurar os e-mails que receberão as notificações automáticas, siga os passos abaixo:

- Acesse a área administrativa da plataforma.
- No menu, clique em Configurações > Notificações.
- Localize a opção Informe o(s) e-mail(s).

Nessa seção, você pode cadastrar os e-mails que irão receber as notificações sempre que uma ação for realizada na plataforma.

![Imagem do artigo Como cadastrar os e-mails para notificações automáticas](knowledge-asset:708b6e26-587e-4ab4-b122-711f0a6c83ee)

Além disso, você pode configurar a funcionalidade “Dias para solicitação em alerta”. Com essa opção, a plataforma notificará os usuários que não realizaram login ou tratativas dentro do período configurado.

Exemplo: Se o e-commerce configurar 1 dia, a plataforma notificará o usuário caso ele não tenha acessado a plataforma ou feito qualquer ação após 1 dia.

![Imagem do artigo Como cadastrar os e-mails para notificações automáticas](knowledge-asset:3cf39f54-7580-430c-9040-0f36e3168f09)

Na funcionalidade “Dias para solicitação em perigo”, o e-commerce pode configurar um alerta para pendências mais críticas, ajudando a identificar e tratar problemas mais urgentes.

![Imagem do artigo Como cadastrar os e-mails para notificações automáticas](knowledge-asset:ccee7ece-6cc4-474d-a15e-af923b992bec)', updated_at=timezone('utc', now()) where id='a367591c-93f3-46ef-8762-1d5ce0e9246a'::uuid;
update public.knowledge_articles set title='Como compartilhar evidências em um ticket', summary='Orientações objetivas para anexar evidências úteis sem prejudicar a leitura do ticket.', body_md='Evidência boa é aquela que ajuda o suporte a entender o contexto sem depender de suposições.

### Priorize evidências objetivas

- print da tela com o horário visível
- identificador da solicitação ou pedido
- arquivo exportado com os registros relacionados

### Organize a descrição

Ao anexar, diga em uma linha o que o material comprova e em que ponto da operação ele foi capturado.

### Evite anexos sem contexto

Arquivos soltos ou capturas sem explicação atrasam a triagem porque exigem nova rodada de perguntas.', updated_at=timezone('utc', now()) where id='c425dbdf-3f18-46f9-8eae-7769c9841ca6'::uuid;
update public.knowledge_articles set title='Como configurar a cor exibida nos filtros básicos das solicitações', summary='Para ajustar as cores associadas aos estágios das solicitações, siga os passos abaixo:', body_md='Para ajustar as cores associadas aos estágios das solicitações, siga os passos abaixo:

- Acesse a área administrativa da plataforma.
- No menu lateral, clique em Configurações e depois em Administrativo.
- Encontre a funcionalidade Cor por Estágio da Solicitação

![Imagem do artigo Como configurar a cor exibida nos filtros básicos das solicitações](knowledge-asset:d9d158a6-e6f1-4caa-ba1b-f79a3d62ba85)

Essa funcionalidade permite que o e-commerce defina cores personalizadas para cada estágio de uma solicitação, facilitando a visualização do status diretamente na lista de solicitações.

Exemplo:

- Nova solicitação: AMARELO
- Vale-compras gerado ou estorno efetuado: VERDE

![Imagem do artigo Como configurar a cor exibida nos filtros básicos das solicitações](knowledge-asset:3e36bef4-38c6-4157-83ba-dca53101a283)

Assim, as cores serão exibidas de acordo com o progresso da solicitação, ajudando a identificar rapidamente em qual estágio ela se encontra.', updated_at=timezone('utc', now()) where id='2d486762-ed82-49bc-ac06-86d01111157b'::uuid;
update public.knowledge_articles set title='Como configurar o BlockList?', summary='Acesse a área administrativa da plataforma.', body_md='Acesse a área administrativa da plataforma.

No menu, clique em Configurações > Administrativo .

Localize a opção Controle de BlockList .

Como um cliente entra no BlockList?
Ao realizar o Rating do item , se o campo "Estado do item" para "NÃO DEVOLVIDO" , o cliente Lista de blocos .', updated_at=timezone('utc', now()) where id='2c5ea31a-7faf-4af9-a3ce-cc8332022e9d'::uuid;
update public.knowledge_articles set title='Como configurar o cálculo do estorno', summary='Aprenda a escolher o cálculo padrão ou proporcional e a confirmar a regra de estorno da sua operação.', body_md='Veja como escolher a regra de cálculo que será usada nos estornos da sua operação.

### Passo a passo

1. Acesse o painel Admin da plataforma.

### No menu à esquerda, clique em **Configurações**.

3. Selecione **Ambiente** e, em seguida, **Estorno/Vale-Compra**.
4. Procure a funcionalidade **Regra para cálculo de estorno**.

### Escolha o tipo de cálculo

- **Cálculo padrão:** usa o valor total do pedido para calcular o estorno, independentemente do valor dos itens devolvidos.
- **Cálculo proporcional:** calcula o estorno de acordo com o valor dos itens devolvidos e a parte do pedido que foi devolvida.

Selecione a opção mais adequada à política de reembolso da sua operação e confirme.

![Tela da regra de cálculo de estorno](knowledge-asset:7744a208-5a63-414b-92bd-b7fe5c70032e)

:::callout info
Dica: antes de confirmar, revise a política de reembolso da sua operação. Assim, o cálculo escolhido ficará alinhado às regras que você oferece aos seus clientes.
:::', updated_at=timezone('utc', now()) where id='dd2d102e-f496-4f08-9bcf-6f7640d03d5b'::uuid;
update public.knowledge_articles set title='Como configurar o estorno automático via pix', summary='Configurando as Formas de Estorno Automático via PIX', body_md='### Configurando as Formas de Estorno Automático via PIX

### Passo a passo para habilitar o estorno automático via Pix

- Acesse o painel Admin da plataforma.
- No menu à esquerda, clique em CONFIGURAÇÕES.
- Selecione a opção AMBIENTE e, em seguida, clique em ESTORNO/VALE-COMPRA.
- Localize a funcionalidade "Habilitar estorno automático via Pix".

Nesta seção, você pode habilitar o estorno automático via Pix, facilitando o processo de reembolso para seus clientes. Ao ativar essa funcionalidade, os estornos serão feitos diretamente para a conta do cliente via Pix, proporcionando agilidade e comodidade no processo de devolução.

Se preferir, também é possível informar o gateway de pagamento para realizar os estornos via Pix.

![Imagem do artigo Como configurar o estorno automatico via pix](knowledge-asset:bec5c2dd-7b9a-4d2b-a26a-b061a285d957)

:::callout info
Dica: Certifique-se de que o método de pagamento utilizado pelo cliente seja compatível com a opção de estorno via Pix para evitar problemas durante o reembolso.
:::', updated_at=timezone('utc', now()) where id='65c58209-db45-4c6f-bd43-0460ec9abab9'::uuid;
update public.knowledge_articles set title='Como Configurar o Prazo Logístico por Estado?', summary='O que é a Tabela de Prazo Logístico?', body_md='### O que é a Tabela de Prazo Logístico?

A tabela de prazo logístico é uma forma eficaz de estabelecer o intervalo entre o pedido faturado e a entrega do produto. Esse prazo é essencial para garantir que o consumidor esteja dentro da regra de política de troca e/ou devolução.

O e-commerce pode configurar o prazo logístico por estado seguindo os passos abaixo:

- Acesse o menu Configurações na área logada do e-commerce.
- Clique em Prazo Logístico.
- Defina o prazo desejado para cada estado na tabela correspondente.

Os prazos definidos na tabela serão utilizados para calcular o período em que o consumidor pode solicitar trocas e devoluções sem justificativa.

![Imagem do artigo Como Configurar o Prazo Logístico por Estado?](knowledge-asset:c1ed8f38-5e76-41c0-9278-3eb1081fc108)

### Exemplo de Fluxo da Ferramenta:

- Pedido faturado no dia 01.
- Prazo para o Estado de São Paulo: 3 dias.
- O prazo inicia no dia 04.
- A partir dessa data, o consumidor pode solicitar devolução/troca até o dia 11 (7 dias) pelo motivo de arrependimento.
- O mesmo se aplica para cada estado, de acordo com o prazo configurado.

### Importante:

- Os prazos são calculados a partir do despacho em São Paulo e podem ser ajustados pela marca, sem uma regra fixa.
- O sistema automaticamente capta a data do faturamento, adiciona o prazo da tabela e verifica o prazo dos motivos configurados previamente na Genius Returns.
- Se houver o status "Pedido Entregue" na Vtex, a tabela de prazo logístico não deve ser utilizada.
- Caso não haja esse status, a tabela de prazo logístico deve ser configurada para garantir a correta aplicação das regras.

Seguindo essas diretrizes, o prazo logístico será corretamente aplicado, proporcionando uma gestão eficiente das trocas e devoluções.', updated_at=timezone('utc', now()) where id='f87d4f6b-fe9d-4c24-b313-ed529ac60602'::uuid;
update public.knowledge_articles set title='Como configurar o Vale-Compras (retenção)', summary='Como configurar o Vale-Compras para retenção', body_md='Como configurar o Vale-Compras para retenção

Para ajustar as configurações do Vale-Compras, siga os passos abaixo:

- Acesse a área administrativa da plataforma.
- No menu, clique em Configurações > Vale-Compras.
- Localize as opções 1º Vale-Compra a ser ofertado e 2º Vale-Compra a ser ofertado.

Você poderá configurar as seguintes opções para cada tipo de vale:

- Descrição: Defina o nome ou a descrição do vale.
- Valor: Determine o valor do vale, que pode ser um percentual sobre o valor da solicitação.
- Expiração: Configure o prazo de validade do vale (em dias).

![Imagem do artigo Como configurar o Vale-Compras(Retenção)](knowledge-asset:6e2d76f4-6da3-4d79-94e0-011ac9b09ba5)

### 1º Vale-Compra a ser ofertado

Este vale será sugerido ao cliente no front-end quando ele escolher a opção “Devolução” em vez de “Troca” durante a solicitação. O valor do vale será exibido como parte da sugestão, conforme o exemplo abaixo:

![Imagem do artigo Como configurar o Vale-Compras(Retenção)](knowledge-asset:7749d204-da77-425c-80ab-839effd70232)

### 2º Vale-Compra a ser ofertado

Este vale será mostrado ao cliente quando ele finalizar sua solicitação de reversa no front-end. A plataforma sugere um vale com o valor configurado pelo e-commerce, já aplicando a porcentagem extra, conforme a configuração. Veja o exemplo abaixo:

![Imagem do artigo Como configurar o Vale-Compras(Retenção)](knowledge-asset:7e7c2a70-77d5-47eb-837b-b1a0acfca124)', updated_at=timezone('utc', now()) where id='3e43e957-a5af-4367-abb2-b858fe7866f4'::uuid;
update public.knowledge_articles set title='Como configurar os textos do portal do cliente', summary='Configurando os Textos do portal do cliente', body_md='### Configurando os Textos do Front

### Passo a passo para configurar os textos visíveis para o cliente

- Acesse o painel Admin da plataforma.
- No menu à esquerda, clique em CONFIGURAÇÕES.
- Selecione a opção AMBIENTE e, em seguida, clique na aba “TEXTOS”.

Neste ambiente, você pode configurar os textos personalizados que os clientes verão durante o processo de criação de suas solicitações no front-end da plataforma. Isso inclui textos de interação em várias etapas do processo, como:

- Texto para troca: Defina o texto que será exibido quando o cliente solicitar uma troca.
- Texto para devolução: Personalize a mensagem mostrada para solicitações de devolução.
- Home: Ajuste os textos visíveis na página inicial de solicitação.
- Termos para estorno e vale-compras: Configure os termos que aparecerão no lugar de "estorno" e "vale-compras" (por exemplo, “reembolso” ou “crédito de loja”).
- Pop-Up de estorno e vale-compras: Personalize o texto que aparece nas pop-ups de estorno e vale-compras.
- Box de vale-compras do pop-up de estorno e vale-compras: Defina o texto que será mostrado no box de vale-compras dentro da pop-up de estorno e vale-compras.
- Box de estorno do pop-up de estorno e vale-compras: Configure o texto do box de estorno na pop-up.
- Pop-Up de estorno e vale-compras bônus: Personalize o texto exibido em pop-ups que ofereçam estorno ou vale-compras bônus.

Segue imagens abaixo

![Imagem do artigo Como configurar os textos do portal do cliente](knowledge-asset:e190808b-0b55-45b6-a608-61353314c0c2)

![Imagem do artigo Como configurar os textos do portal do cliente](knowledge-asset:62cecce2-3846-4d50-82f6-f822dd680fc8)

![Imagem do artigo Como configurar os textos do portal do cliente](knowledge-asset:af9a2d47-7489-42dd-b2c1-32e2c3566273)

![Imagem do artigo Como configurar os textos do portal do cliente](knowledge-asset:ff3eefc2-1f26-43fe-93f1-7d0b88eeb158)

![Imagem do artigo Como configurar os textos do portal do cliente](knowledge-asset:c82be982-03f9-41cc-ae8f-e5b40a606b10)

![Imagem do artigo Como configurar os textos do portal do cliente](knowledge-asset:c6b12b80-964e-40f1-8b86-4f17d27e6e23)

:::callout info
Dica: Personalizar esses textos é uma excelente maneira de alinhar a comunicação da plataforma com a identidade e as políticas do seu e-commerce, além de garantir uma experiência clara e amigável para o cliente.
:::', updated_at=timezone('utc', now()) where id='4d4528f0-9d85-404b-91b7-95cdd7aafd21'::uuid;
update public.knowledge_articles set title='Como consultar processos e acompanhar status', summary='Consulte um processo específico ou liste processos com filtros para acompanhar a operação.', body_md='### Consultar um processo específico

Use o identificador do processo quando você já souber qual troca ou devolução precisa ser consultada.

::api-reference get-process

### Listar e filtrar processos

Use a listagem quando precisar acompanhar vários processos ou aplicar filtros de período, status e outros critérios disponíveis no contrato.

::api-reference list-processes

### O que validar

- confirme o ambiente e o token usados;
- trate paginação e respostas não autorizadas;
- não use dados de produção em testes;
- compare o status recebido com o contexto operacional antes de comunicar o cliente.

Para os parâmetros e modelos completos, abra a [API Docs]({{link:api_docs}}).', updated_at=timezone('utc', now()) where id='6cbc7b55-d1de-4fe8-97ea-2b48d2d6fb8c'::uuid;
update public.knowledge_articles set title='Como importar uma solicitação criada em outro sistema', summary='Use este guia quando ERP, middleware ou sistema próprio já criou a solicitação.', body_md='Quando a troca ou devolução já foi criada em ERP, middleware ou sistema próprio, o cenário é de importação. Isso é diferente de iniciar o fluxo hospedado do Genius Returns a partir do pedido do e-commerce.

::api-reference import-request

### Cuidados

- confirme o contrato e a habilitação antes de enviar dados;
- faça a chamada em backend seguro;
- preserve o identificador retornado para acompanhamento;
- trate respostas de validação sem expor detalhes internos ao cliente final.

Consulte a especificação da operação na [API Docs]({{link:api_docs}}).', updated_at=timezone('utc', now()) where id='b125ff01-d0a6-4a95-80a1-9ccd047489a8'::uuid;
update public.knowledge_articles set title='Como informar a SKU durante a troca', summary='Como informar a SKU durantge a troca', body_md='### Como informar a SKU durantge a troca

Para que o consumiror envie a SKU durante sua solicitação é necessario configurar essa permissão do envio da troca por texto, caso necessário.

### Habilitando ou não que o cliente ao invés de selecionar o item de troca, escreva ou cole o link do item que deseja trocar

- Acesse a área administrativa da plataforma.
- No menu, clique em Configurações > Parametrização Geral.
- Localize a funcionalidade Informar SKU de Troca por Texto

Segue imagem abaixo

![Imagem do artigo Como informar a SKU durantge a troca](knowledge-asset:39441c29-9e98-4f21-806e-9ccdb7121999)

.', updated_at=timezone('utc', now()) where id='29507072-5a65-42eb-af60-8661bfb4838d'::uuid;
update public.knowledge_articles set title='Como informar avaliações de produtos', summary='Conheça o recurso de rating para registrar avaliações relacionadas aos produtos de uma solicitação.', body_md='Use o recurso de rating quando a operação precisar informar a avaliação de um ou mais produtos relacionados a uma solicitação de troca ou devolução.

::api-reference product-rating

O contrato técnico, os campos e as respostas devem ser consultados na [API Docs]({{link:api_docs}}). A operação está documentada no API Docs principal; não a publique como recomendação baseada apenas no Swagger.', updated_at=timezone('utc', now()) where id='a717cdc0-cbb0-4a47-93bf-807d7e770573'::uuid;
update public.knowledge_articles set title='Como iniciar uma troca ou devolução pelo e-commerce', summary='Entenda quando o e-commerce deve integrar um pedido ao fluxo hospedado do Genius Returns.', body_md='Use este caminho quando o pedido está no e-commerce e o objetivo é levar o cliente para o fluxo de solicitação do Genius Returns.

### O que o fluxo resolve

O e-commerce envia os dados do pedido para a operação de integração. A resposta fornece um link para direcionar o cliente ao estágio adequado da solicitação.

::api-reference initiate-flow

### Antes de implementar

- confirme as credenciais e a habilitação da integração;
- mantenha a chamada no backend do e-commerce ou middleware;
- valide o ambiente escolhido antes de testar;
- não exponha o contrato completo nem dados reais na interface pública.

Para parâmetros, payloads e respostas, consulte a operação correspondente na [API Docs]({{link:api_docs}}).', updated_at=timezone('utc', now()) where id='7683dd3c-818a-4f14-8028-32101bc275d7'::uuid;
update public.knowledge_articles set title='Como integrar notas fiscais de devolução', summary='Entenda os cenários de inclusão, atualização, inativação e consulta de notas fiscais vinculadas a processos.', body_md='As notas fiscais de devolução são vinculadas ao processo correspondente. Use as operações abaixo conforme o cenário.

### Adicionar uma nota

::api-reference add-return-note

### Atualizar uma nota

::api-reference update-return-note

### Inativar uma nota

::api-reference deactivate-return-note

### Listar ou consultar uma nota

::api-reference list-return-notes

::api-reference get-return-note

Quando confirmados no contrato, os dados podem incluir número, série, chave, XML, link do DANFE, data, arquivo e identificadores do processo. Não transforme este guia em reprodução integral do schema.

Consulte os modelos completos na [API Docs]({{link:api_docs}}) e use o [Swagger]({{link:swagger}}) somente em ambiente autorizado.', updated_at=timezone('utc', now()) where id='79014750-0159-4fff-92ff-f81d488ef473'::uuid;
update public.knowledge_articles set title='Como interpretar status da logística reversa', summary='Leitura prática dos principais status para evitar resposta ambígua durante o acompanhamento do retorno.', body_md='Os status da logística reversa servem para orientar a tratativa e evitar respostas prematuras ao cliente.

### Status que costumam exigir atenção

- solicitação recebida: a abertura foi registrada e aguarda a próxima etapa operacional
- coleta em andamento: existe tratativa ativa para retirada ou postagem
- material em trânsito: o retorno está no fluxo logístico e depende de atualização externa
- análise concluída: a etapa operacional principal terminou e a próxima decisão pode seguir

### Como responder melhor

Use o status como ponto de partida, mas complemente com a última ação confirmada e o próximo passo previsto.

### Quando escalar

Escalone quando o status ficar parado além da janela operacional combinada ou quando a etapa atual não refletir o ocorrido no campo.', updated_at=timezone('utc', now()) where id='c9193be2-82c5-45d1-9510-05930c98f2f4'::uuid;
update public.knowledge_articles set title='Como o cliente solicita uma reversa', summary='A seguir, mostramos como seus clientes podem solicitar trocas e devoluções de forma simples e prática:', body_md='COMO O CONSUMIDOR SOLICITA UMA REVERSA

A seguir, mostramos como seus clientes podem solicitar trocas e devoluções de forma simples e prática:

### Acesso à página de solicitação

Ao acessar o link do Front, o cliente verá a página inicial de boas-vindas. Nessa página, ele deverá escolher entre E-mail ou Número do Pedido para iniciar a solicitação. Após inserir uma dessas opções, o cliente deve clicar em “Localizar Pedido”, conforme mostrado na imagem abaixo:

![Imagem do artigo Como o cliente solicita uma reversa](knowledge-asset:7df36c64-ef6b-4bee-a866-5dba702fe6e8)

### Escolha do item para troca ou devolução

Se o cliente optar por Número do Pedido, ele será direcionado para uma tela onde verá todos os itens presentes naquele pedido. O cliente deve selecionar apenas o item que deseja trocar ou devolver e, em seguida, clicar no botão “Continuar”.

![Imagem do artigo Como o cliente solicita uma reversa](knowledge-asset:deaad63b-d3f0-451a-8833-0e808103e3a5)

### Detalhamento da solicitação

Na próxima tela, o cliente deverá detalhar sua solicitação. Ele pode escolher entre Trocar ou Devolver o item. Caso opte por Devolver, ele deverá selecionar o motivo da devolução, como mostrado na imagem abaixo:

![Imagem do artigo Como o cliente solicita uma reversa](knowledge-asset:3d99f97f-9172-445e-bea6-3752c7d91a7e)

Se o cliente escolher Trocar, ele poderá selecionar a variação do produto desejada, conforme a imagem abaixo:

![Imagem do artigo Como o cliente solicita uma reversa](knowledge-asset:b4f58dcf-ed24-46b4-ab61-651da62bde27)

### Envio de imagens

Após escolher o item a ser trocado ou devolvido, o cliente pode adicionar de 1 a 3 imagens do produto. Ao finalizar, ele deve clicar no botão “Continuar”.

![Imagem do artigo Como o cliente solicita uma reversa](knowledge-asset:be9a55b0-afb4-4b74-9b89-8535a3a64cfc)

### Confirmação do endereço

Na tela “Confirme seu endereço”, o cliente pode editar o endereço cadastrado clicando em “Clique aqui caso precise editá-lo”. Caso o endereço esteja correto, ele deve selecionar o endereço cadastrado. Após isso, as opções de métodos de devolução serão apresentadas, e o cliente deverá clicar em “Continuar”.

![Imagem do artigo Como o cliente solicita uma reversa](knowledge-asset:a7de4276-6a4f-47a4-84ab-934b0f56aa74)

![Imagem do artigo Como o cliente solicita uma reversa](knowledge-asset:2d6d739f-c1a8-4255-adba-ff55c1d45b41)

### Finalização da solicitação

Na página final “Estamos quase lá!”, o cliente verá um resumo de todas as escolhas feitas para a reversa. Se tudo estiver correto, ele pode finalizar o processo clicando em “Finalizar”. Por fim, será direcionado para uma pesquisa de satisfação.

![Imagem do artigo Como o cliente solicita uma reversa](knowledge-asset:66c2750b-4f09-4d85-9ec3-c116bc8dd0dd)

![Imagem do artigo Como o cliente solicita uma reversa](knowledge-asset:d45c0272-b97b-4d77-81b2-d959c371e3b4)', updated_at=timezone('utc', now()) where id='de52bb76-1ac3-4034-9747-27450d9e126c'::uuid;
update public.knowledge_articles set title='Como realizar alterações em um Vale-compra pendente?', summary='Para realizar alterações em um Vale-compra pendente, siga os passos abaixo:', body_md='Para realizar alterações em um Vale-compra pendente, siga os passos abaixo:

- Acesse o menu "Solicitações".
- Abra a solicitação que deseja alterar.
- Na aba "Ações Pendentes", localize a seção "Vale-compra Pendente".
- Nessa seção, você poderá visualizar os seguintes botões:
- "Alterar para Estorno"
- "Informar Vale-compra Gerado"
- "Gerar Vale-compra"

- Conforme ilustrado na imagem abaixo.

Além disso, em "Vale-compra Pendente", você também pode optar por "Informar Vale-compra Manualmente".

![Imagem do artigo Como realizar alterações em um Vale-compra pendente?](knowledge-asset:8fd0629c-e11c-4be3-8cc0-1aa114eaa8dc)', updated_at=timezone('utc', now()) where id='ebe18040-b031-47e6-af6e-30aa73a02b6c'::uuid;
update public.knowledge_articles set title='Como solicitar credenciais ou habilitação', summary='Saiba o que preparar para solicitar acesso ou habilitação de uma integração.', body_md='Solicite credenciais ou habilitação pelos canais autorizados da Genius Returns quando sua operação ainda não tiver acesso à API.

### Inclua no pedido

- nome da empresa e da operação;
- ambiente desejado: produção ou QA;
- cenário de integração: iniciar fluxo, importar solicitação, consultar processo, nota fiscal ou rating;
- sistema responsável pela chamada: e-commerce, ERP ou middleware;
- contato técnico responsável.

### Não inclua

- tokens;
- senhas;
- chaves já existentes;
- dados reais de clientes;
- payloads de produção sem sanitização.

O acesso pode depender do contrato, plano e habilitação técnica. Depois de receber orientação, siga o [guia de autenticação](/help/genius/articles/como-autenticar-uma-integracao) e valide o ambiente correto.', updated_at=timezone('utc', now()) where id='301c4abb-580a-4461-80bd-3d88f80bd60c'::uuid;
update public.knowledge_articles set title='Configuração de Sellers Permitidos', summary='O que é a funcionalidade Sellers Permitidos?', body_md='### O que é a funcionalidade Sellers Permitidos?

A funcionalidade Sellers Permitidos permite restringir e gerenciar quais Sellers estão autorizados a solicitar trocas e devoluções. Por padrão, todos os Sellers têm essa permissão, mas essa configuração pode ser alterada conforme necessidade.

### Como definir quais Sellers podem solicitar trocas e devoluções?

Para configurar a permissão de Sellers, siga os passos abaixo:

- Acesse a área administrativa da plataforma.
- No menu, clique em Configurações > Ambiente > Sellers Permitidos.
- Na tela de configuração, você pode:
- Selecionar quais Sellers terão permissão para solicitar trocas e devoluções.
- Configurar uma mensagem personalizada para os Sellers que forem impedidos de realizar solicitações.

![Imagem do artigo Configuração de Sellers Permitidos](knowledge-asset:cc4d5227-28e4-4304-ae8f-847862c5172d)

### Como funciona a restrição de Sellers?

A ferramenta opera com uma lista de permissão (white list):

- Lista vazia → Todos os Sellers estão autorizados.
- Lista preenchida → Apenas os Sellers adicionados terão permissão.

Para restringir o acesso de Sellers específicos, basta adicioná-los na lista, separados por ponto e vírgula (;).

![Imagem do artigo Configuração de Sellers Permitidos](knowledge-asset:ccfeb261-e813-4bdb-9be4-b2b10b2f712c)

Além disso, você pode personalizar a mensagem exibida para os Sellers que não tiverem permissão para solicitar trocas e devoluções, garantindo uma comunicação clara e eficiente.

![Imagem do artigo Configuração de Sellers Permitidos](knowledge-asset:3e2c32d7-7074-4d10-b7e6-a040dbb5f65b)

### Como configurar Sellers Permitidos na plataforma Genius Returns?

Se o objetivo for configurar a permissão de Sellers para criação de reservas na plataforma Genius Returns, siga estes passos:

- Acesse a área administrativa.
- No menu, clique em Configurações > Parametrização Geral.
- Localize a funcionalidade Sellers Permitidos.
- Configure quais Sellers terão permissão para criar reservas.

Caso tenha dúvidas, consulte a FAQ específica para permissões de Sellers dentro da plataforma Genius Returns.

Com essa funcionalidade, você tem total controle sobre quais Sellers podem operar dentro do fluxo de trocas e devoluções, garantindo maior segurança e organização no processo. 🚀', updated_at=timezone('utc', now()) where id='51e46bc9-8e9d-4439-a10d-a674a524024d'::uuid;
update public.knowledge_articles set title='Configurando a funcionalidade Fique com o Item', summary='Fique com o Item', body_md='### Fique com o Item

Para configurar os padrões de segurança da sua plataforma, siga os passos abaixo:

- Acesse a área administrativa da plataforma.
- No menu, clique em Configurações > Parametrização Geral.
- Localize a funcionalidade Fique com o item.

Nessa funcionalidade, o e-commerce pode configurar regras para não necessitar de logística reversa em determinados casos de troca ou devolução, como:

- Tipo de solicitação
- Percentual de custo da logística reversa
- Quantidade mensal de "Fique com o Item" por cliente

![Imagem do artigo Configurando a funcionalidade Fique com o Item](knowledge-asset:3e002ddf-21d6-4857-a750-93feadee6154)', updated_at=timezone('utc', now()) where id='d220758a-4c0f-459f-80c9-0168cdbf4a05'::uuid;
update public.knowledge_articles set title='Configurando as Formas de Estorno', summary='Passo a passo para configurar as formas de estorno:', body_md='### Passo a passo para configurar as formas de estorno

- Acesse o painel Admin da plataforma.
- No menu à esquerda, clique em CONFIGURAÇÕES.
- Selecione a opção AMBIENTE e, em seguida, clique em ESTORNO/VALE-COMPRA.
- Procure pela funcionalidade "Formas de Estorno".

Nesta seção, você pode configurar as formas de estorno manual que o e-commerce irá utilizar, como por exemplo:

- Estorno apenas via conta bancária.
- Estorno via conta bancária + Pix.
- Apenas PIX.

Ajuste essas opções de acordo com as necessidades do seu processo de reembolso, garantindo que as formas de estorno sejam adequadas tanto para sua operação quanto para a experiência do cliente.

![Imagem do artigo Configurando as Formas de Estorno](knowledge-asset:435ab928-cf63-4564-9842-04cb8a91da1a)

:::callout info
Dica: Certifique-se de revisar as formas de estorno disponíveis e escolher aquelas que são mais compatíveis com os métodos de pagamento utilizados no seu e-commerce, para garantir que os reembolsos sejam realizados de maneira eficiente.
:::', updated_at=timezone('utc', now()) where id='d0d82bb2-64c0-4be4-a020-49ea687000e3'::uuid;
update public.knowledge_articles set title='Configurando parametrização geral', summary='Menu parametrização geral', body_md='Use a parametrização geral para definir regras que afetam o funcionamento das solicitações, da logística reversa e do portal do cliente.

### Funcionalidades principais

![Visão geral das funcionalidades da parametrização geral|size=large](knowledge-asset:42251df6-7eb6-47dd-bfb2-74d3ec45ea82)

- **Gerar ticket reverso automaticamente:** gera o código de postagem assim que o cliente conclui a solicitação, sem exigir uma análise prévia.
- **Solicitar envio de fotos dos produtos:** permite que o cliente envie até três imagens ao abrir a solicitação.
- **Habilitar transportadora de melhor custo:** sugere a transportadora mais econômica para a logística reversa.
- **Habilitar custo estimado da logística reversa:** mostra ao cliente uma estimativa do custo da logística reversa.
- **Habilitar modo B2B:** adapta o fluxo para operações entre empresas.
- **Calcular automaticamente o número de autorizações necessárias:** define a quantidade de autorizações exigidas para concluir a reversa.
- **Concluir o processo após sanar a pendência financeira:** conclui a reversa quando a pendência financeira é resolvida.
- **Habilitar estorno por item:** permite realizar estornos individuais para os itens da solicitação.

### Regras operacionais

#### Operações permitidas

![Configuração das operações permitidas|size=large](knowledge-asset:a34e3bf4-e5fb-4d7a-9797-9e00b712560e)

Escolha se a operação aceitará **troca**, **devolução** ou **ambas**.

#### Fique com o item

![Configuração da regra Fique com o item|size=large](knowledge-asset:7584774d-2eef-4e40-9ed2-0f844d6da7c0)

Configure quando o cliente poderá ficar com o produto sem passar pela logística reversa. As regras disponíveis consideram:

- tipo de solicitação;
- percentual do custo da logística reversa;
- quantidade mensal por cliente.

#### Sellers permitidos

![Seleção de sellers permitidos|size=large](knowledge-asset:12886628-ea50-45a5-ab91-dc592cd00641)

Defina quais sellers podem criar solicitações pela plataforma Genius Returns.

#### Produtos em exceção

![Cadastro de produtos e categorias em exceção|size=large](knowledge-asset:a13aca45-2481-4bd4-8f64-9b3f086fa7e3)

Bloqueie produtos ou categorias que não devem permitir reversas:

- para bloquear produtos, informe o ID de cada SKU e pressione **Enter** ou **Tab**;
- para bloquear categorias, informe o ID de cada categoria e pressione **Enter** ou **Tab**.

#### Segunda solicitação para o mesmo pedido ou SKU

![Regra para segunda solicitação|size=large](knowledge-asset:fcc0c4c1-1811-481b-8f59-240e8423d5e1)

Defina se o cliente poderá abrir uma segunda solicitação para o mesmo pedido ou item (SKU).

#### Segurança

![Opções de segurança da parametrização|size=large](knowledge-asset:04427c82-6646-4a7e-9a63-24daa0d80cff)

Revise as opções disponíveis nessa seção de acordo com a política de segurança da sua operação.

#### Informar o SKU da troca por texto

![Informação do SKU de troca por texto|size=large](knowledge-asset:53bea01d-ba6d-4166-a946-c70884321f76)

Permita que o cliente informe ou cole o link do SKU desejado, em vez de selecionar o item de troca na tela.

#### Variação do produto

![Configuração de variação do produto|size=large](knowledge-asset:18be680b-00c4-4ba1-a90b-dae3dac54792)

Configure como as variações de tamanho dos produtos serão tratadas no processo de reversa.

Revise as configurações antes de publicar o fluxo e valide uma solicitação de teste para confirmar o comportamento esperado.', updated_at=timezone('utc', now()) where id='7b11f20c-20ab-4550-8e95-570a9bfda612'::uuid;
update public.knowledge_articles set title='Configurar padrões de segurança', summary='Segurança', body_md='### Segurança

Para configurar os padrões de segurança da sua plataforma, siga os passos abaixo:

- Acesse a área administrativa da plataforma.
- No menu, clique em Configurações > Parametrização Geral.
- Localize a funcionalidade Segurança.

Nesta seção, o e-commerce poderá definir os padrões de segurança que serão aplicados ao login dos clientes na plataforma.

Exemplo de Configuração: E-mail com Código de Verificação
- Se o e-commerce optar por habilitar a funcionalidade de “E-mail com código de verificação”:
- Durante a solicitação de login no FRONT, será solicitado que o cliente informe seu.

![Imagem do artigo Configurar padrões de segurança](knowledge-asset:c9cc26da-ec2a-44a5-a19d-1eb2a80ae39a)

- Um código de verificação será enviado automaticamente para o endereço de e-mail fornecido.

![Imagem do artigo Configurar padrões de segurança](knowledge-asset:e33fe215-f34b-47a2-920c-b0201bcd04bf)

- O cliente deverá inserir o código recebido para concluir sua autenticação com sucesso.

![Imagem do artigo Configurar padrões de segurança](knowledge-asset:4448a087-7ec8-4dfa-82b0-c6ae3781fdf9)

Essa configuração adiciona uma camada extra de segurança, protegendo as contas dos clientes contra acessos não autorizados.', updated_at=timezone('utc', now()) where id='554c4ebe-c837-4382-92ee-852e0dec7232'::uuid;
update public.knowledge_articles set title='Criando e atualizando o cadastro', summary='MENU CADASTRO', body_md='MENU CADASTRO

Neste guia, vamos explorar as opções e configurações disponíveis no menu “Cadastro” do painel administrativo.

- Acessando o Menu Cadastro: Ao fazer login no painel administrativo, você verá os “MENUS” localizados no canto esquerdo da tela. Clique na opção “CADASTRO” para ser direcionado à página “Meu Cadastro”, conforme mostrado na imagem abaixo:

![Imagem do artigo Criando e atualizando o cadastro](knowledge-asset:7d0c99d7-d5d1-4285-805b-ba0074399228)

- Editando os Dados Gerais: Na página “Meu Cadastro”, você será direcionado à aba “Dados Gerais”. Nessa seção, você pode editar as seguintes informações:
- Razão Social
- Nome Fantasia
- CNPJ
- E-mail Financeiro
- Responsável Financeiro
- E-mail de Contato
- Telefone
- Endereço do Site

- Alterando a Logo: É possível incluir ou alterar a logo exibida na tela do consumidor durante o processo de solicitação. Para isso, basta clicar na área indicada e fazer o upload da nova logo, conforme mostrado abaixo:

![Imagem do artigo Criando e atualizando o cadastro](knowledge-asset:01cb74c6-f066-49d3-8dfd-17b520ca4f07)

- Atualizando o Endereço de Devolução: O endereço de devolução das reversas também pode ser cadastrado ou atualizado. A qualquer momento, você pode modificar essas informações e clicar em "SALVAR" para garantir que as alterações sejam registradas corretamente.

![Imagem do artigo Criando e atualizando o cadastro](knowledge-asset:39def7c5-b194-4750-95c6-641473dd20e9)', updated_at=timezone('utc', now()) where id='4367863d-6bd6-48d8-a5ed-efd1964fb61f'::uuid;
update public.knowledge_articles set title='Criar Lojas Virtuais', summary='MENU CONFIGURAÇÕES: COMO CRIAR LOJAS VIRTUAIS', body_md='MENU CONFIGURAÇÕES: COMO CRIAR LOJAS VIRTUAIS

Ao acessar o menu Configurações em Lojas Virtuais, o e-commerce pode criar novas lojas virtuais. Siga os passos abaixo para realizar o processo:

### Acesse o Menu de Configurações

- Após fazer login no painel administrativo, localize o MENU no canto superior direito e clique em Configurações, conforme mostrado na imagem abaixo:

![Imagem do artigo Criar Lojas Virtuais](knowledge-asset:b0989fb5-ed5a-4490-87e9-d051abf8c883)

### Selecione a Opção "Lojas Virtuais"

- Em seguida, clique na opção Lojas Virtuais. Você será direcionado para um ambiente onde poderá visualizar todas as lojas virtuais vinculadas ao seu e-commerce. Para adicionar uma nova loja, clique no botão "+", conforme indicado na imagem abaixo:

![Imagem do artigo Criar Lojas Virtuais](knowledge-asset:34170e3e-d3b4-45cc-b63f-5c9d5e8fb908)

### Adicione os Dados da Nova Loja

- Na próxima tela, insira as informações necessárias, como os dados e o logo da nova loja virtual.
- Após preencher as informações, clique em SALVAR para finalizar o processo.

![Imagem do artigo Criar Lojas Virtuais](knowledge-asset:e5cd6da8-a9e5-488f-a36b-4fe4a87e8e29)

Com esses simples passos, sua nova loja virtual será criada com sucesso!', updated_at=timezone('utc', now()) where id='671dbea2-e5f0-42b5-ac35-796ce076fb9b'::uuid;
update public.knowledge_articles set title='Erro ao Tentar Realizar o Estorno', summary='Esse erro ocorre quando a loja tenta processar um estorno, mas a ferramenta identifica que o pedido não está no status "FATURADO" , que é o único permitido para realizar essa operação.', body_md='Esse erro ocorre quando a loja tenta processar um estorno, mas a ferramenta identifica que o pedido não está no status "FATURADO", que é o único permitido para realizar essa operação.

**

![Imagem do artigo Erro ao Tentar Realizar o Estorno](knowledge-asset:31eaad1f-338e-4ef6-9260-0c0f1e991855)

### Como resolver?

- Verifique o status atual do pedido na plataforma VTEX.
- Se o pedido ainda não atingiu o status "Faturado", será necessário aguardar o avanço do workflow na VTEX.
- Assim que o pedido alcançar o status correto, tente realizar o estorno novamente.

Caso o problema persista, entre em contato com o suporte para mais informações, através do nosso chat em sua área loga no painel administrativo.', updated_at=timezone('utc', now()) where id='dcf006a2-9961-48ac-aaef-452dc959ebc5'::uuid;
update public.knowledge_articles set title='Erro no CEP ou Endereço Incorreto', summary='Este erro pode ocorrer ao abrir uma solicitação, sendo registrado na ferramenta como "Pendência de Logística Reversa" . Isso acontece quando o CEP do destinatário ou do remetente é inválido ou inexistente, exigindo a correção dos dados para', body_md='Este erro pode ocorrer ao abrir uma solicitação, sendo registrado na ferramenta como "Pendência de Logística Reversa". Isso acontece quando o CEP do destinatário ou do remetente é inválido ou inexistente, exigindo a correção dos dados para que o sistema possa processar o código de postagem corretamente.

### O que significa "Pendência de Logística Reversa"?

A pendência pode estar relacionada a:

- Erro no CEP do remetente ou destinatário;
- Informação incorreta no endereço, como UF ou outros dados inconsistentes.

### Como corrigir o erro?

### Verifique através do site "BUSCA CEP" do Correios se o CEP de cadastro do cliente é

- Acesse o painel da loja e vá até o menu de solicitações.
- Se o erro for no CEP ou endereço do remetente (consumidor):
- Localize a solicitação do consumidor;
- Clique em "Ações Pendentes";
- Selecione "Alterar endereço" e faça a correção necessária (CEP, UF, etc.).

![Imagem do artigo Erro no CEP ou Endereço Incorreto](knowledge-asset:ed14ebee-8a87-49e4-9b7d-bbbb1d98b910)

- Se o erro for nos dados do destinatário (loja):
- Acesse "Cadastro" > "Dados Cadastrais" no painel da loja;
- Atualize as informações do endereço corretamente.

![Imagem do artigo Erro no CEP ou Endereço Incorreto](knowledge-asset:efa13b72-aeab-469a-87a5-b5f5ebcf9216)

- Após realizar as correções, retorne à solicitação na aba "Ações Pendentes".
- Clique em "Gerar e-ticket" para concluir o processo.

Exemplo de tela:

![Imagem do artigo Erro no CEP ou Endereço Incorreto](knowledge-asset:356de2e4-a9ae-4da7-9fde-9e1947d540b8)', updated_at=timezone('utc', now()) where id='9df38001-f771-4c51-a09f-2f2ba43936f6'::uuid;
update public.knowledge_articles set title='Erros comuns em integrações', summary='Confira os primeiros pontos de verificação antes de escalar uma falha de integração.', body_md='### Ambiente incorreto

Confirme se a chamada está indo para produção, QA ou mock conforme o objetivo do teste.

### Credencial ou token inválido

Verifique se as credenciais foram fornecidas pela Genius Returns, se pertencem ao ambiente correto e se o token ainda está válido. Nunca copie o valor do token para um ticket ou captura.

### Processo ou nota não encontrados

Confirme os identificadores enviados e se o recurso pertence ao ambiente e à operação autorizados.

### Contrato divergente

Compare a operação com a [API Docs]({{link:api_docs}}). Se ela aparecer somente no Swagger, não a trate como recomendação pública antes de uma revisão técnica.

### Quando pedir ajuda

Informe ambiente, horário, operação, código HTTP e identificadores sanitizados. Não envie credenciais, tokens, dados pessoais ou payloads reais.', updated_at=timezone('utc', now()) where id='85f9b831-dde5-4517-815a-8778e470b37d'::uuid;
update public.knowledge_articles set title='Formas de estorno por motivo', summary='Configurando as Formas de Estorno por Motivo', body_md='### Configurando as Formas de Estorno por Motivo

### Passo a passo para configurar o estorno por motivo

- Acesse o painel Admin da plataforma.
- No menu à esquerda, clique em CONFIGURAÇÕES.
- Selecione a opção AMBIENTE e, em seguida, clique em ESTORNO/VALE-COMPRA.
- Localize a funcionalidade "Formas de Estorno por Motivo".

Nesta configuração, você pode parametrizar como o sistema deve proceder quando houver concorrência entre as regras de estorno financeiro e vale-compras, em casos de devolução ou troca. Isso garante que, dependendo do motivo da solicitação, o estorno será realizado de acordo com a política do seu e-commerce, seja como estorno financeiro ou geração de vale-compra.

![Imagem do artigo Formas de estorno por motivo](knowledge-asset:6fe6340f-ea19-406f-8a06-61cf64116264)

:::callout info
Dica: Ao configurar as formas de estorno por motivo, certifique-se de revisar as regras de sua política de reembolsos para garantir que a experiência do cliente seja consistente e clara, especialmente em casos de concorrência entre as opções de reembolso.
:::', updated_at=timezone('utc', now()) where id='0a5b3cb2-0eb0-4132-a416-70029db304d7'::uuid;
update public.knowledge_articles set title='Integrações e API do Genius Returns', summary='Entenda qual recurso usar para conectar seu e-commerce, ERP ou middleware ao Genius Returns.', body_md='Esta categoria orienta equipes de tecnologia a escolher o caminho correto para integrar o Genius Returns. A Central explica o cenário e os pré-requisitos; a [API Docs]({{link:api_docs}}) detalha o contrato técnico; o [Swagger]({{link:swagger}}) complementa a consulta interativa.

### O que você pode fazer

- autenticar um sistema externo autorizado;
- permitir que o cliente inicie uma solicitação pelo e-commerce;
- importar uma solicitação criada em outro sistema;
- consultar e listar processos de troca ou devolução;
- adicionar, atualizar, inativar e consultar notas fiscais de devolução;
- informar avaliações relacionadas aos produtos de uma solicitação.

### Para quem é esta documentação

Este hub é voltado para equipes de tecnologia de e-commerce, desenvolvedores de ERP, integradores, fornecedores de middleware e parceiros técnicos autorizados.

### Antes de começar

:::callout warning
A integração exige credenciais fornecidas pela Genius Returns. A disponibilidade de cada recurso pode depender do contrato, plano ou habilitação da operação.
:::

- mantenha credenciais somente em um backend seguro, nunca no frontend público;
- trate produção, QA e mock como ambientes com finalidades diferentes;
- use o Swagger para testes apenas em ambiente autorizado;
- nunca publique credenciais, tokens, dados de clientes ou payloads reais.

### Escolha seu cenário

| Quero fazer isto | Recurso indicado |
| --- | --- |
| Autenticar meu sistema | [Como autenticar uma integração](/help/genius/articles/como-autenticar-uma-integracao) |
| Permitir que o cliente inicie uma solicitação pelo e-commerce | [Como iniciar uma troca ou devolução pelo e-commerce](/help/genius/articles/como-iniciar-uma-troca-ou-devolucao-pelo-e-commerce) |
| Importar uma solicitação criada em outro sistema | [Como importar uma solicitação criada em outro sistema](/help/genius/articles/como-importar-uma-solicitacao-criada-em-outro-sistema) |
| Consultar ou listar processos | [Como consultar processos e acompanhar status](/help/genius/articles/como-consultar-processos-e-acompanhar-status) |
| Enviar dados de nota fiscal | [Como integrar notas fiscais de devolução](/help/genius/articles/como-integrar-notas-fiscais-de-devolucao) |
| Informar avaliação de produtos | [Como informar avaliações de produtos](/help/genius/articles/como-informar-avaliacoes-de-produtos) |

### Próximo passo

Comece pelo [guia de escolha do recurso](/help/genius/articles/qual-recurso-de-integracao-devo-usar). Se ainda não houver credenciais ou habilitação, [solicite orientação à Genius Returns](/help/genius/articles/como-solicitar-credenciais-ou-habilitacao).', updated_at=timezone('utc', now()) where id='4185131f-4b58-41a9-8539-e4f8b1f88906'::uuid;
update public.knowledge_articles set title='Limitando o Valor Máximo de um Estorno', summary='Passo a passo para configurar o limite máximo de estorno:', body_md='### Passo a passo para configurar o limite máximo de estorno

- Acesse o painel Admin da plataforma.
- No menu à esquerda, clique em CONFIGURAÇÕES.
- Selecione a opção AMBIENTE e, em seguida, clique em ESTORNO/VALE-COMPRA.
- Localize a funcionalidade "Limite Máximo de Valor de Estorno".

Nesta configuração, você pode determinar o limite máximo de estorno permitido, com base em um percentual sobre o valor devido na solicitação de estorno. Isso permite que você controle quanto pode ser estornado de um pedido, garantindo que o valor de reembolso não ultrapasse os limites estabelecidos.

- Percentual: Defina o valor máximo em percentual. Por exemplo, se você definir 50%, o estorno não poderá exceder 50% do valor total devido.
- Zero ou campo em branco: Caso não deseje aplicar um limite, basta deixar o campo em branco ou configurar como 0%. Nesse caso, o uso da funcionalidade será desativado.

![Imagem do artigo Limitando o Valor Máximo de um Estorno](knowledge-asset:3ed86bab-c04b-437f-bc71-0c7a0d35f50c)

:::callout info
Dica: Utilizar esse recurso é uma boa prática para evitar estornos fora do limite estabelecido e garantir maior controle sobre os reembolsos realizados na plataforma.
:::', updated_at=timezone('utc', now()) where id='0af85509-29b3-494f-a686-41d626bcaf87'::uuid;
update public.knowledge_articles set title='Modo sac', summary='O MODO SAC permite que o e-commerce crie uma reversa ou solicitação para o cliente de forma automática, sem que ele precise fazer isso diretamente pelo portal do cliente da loja.', body_md='O MODO SAC permite que o e-commerce crie uma reversa ou solicitação para o consumidor de forma automática, sem que ele precise fazer isso diretamente pelo front da loja.

### Como utilizar o MODO SAC:

- Acesse a área administrativa da plataforma.
- No menu lateral, clique em "Solicitações" e localize a funcionalidade MODO SAC.

![Imagem do artigo MODO SAC](knowledge-asset:acf91209-398a-49bc-b1f5-57c6decc36d0)

- Ao clicar no MODO SAC, você será direcionado para a tela "Criar nova solicitação".
- Nessa tela, você poderá configurar a reversa ou solicitação conforme necessário.
- Finalize o processo clicando em "Criar solicitação".

![Imagem do artigo MODO SAC](knowledge-asset:5287be1c-7782-44be-91d1-a8ffa755af9f)

Pronto! A solicitação será criada e o consumidor será notificado conforme configurado.', updated_at=timezone('utc', now()) where id='d78ee736-2312-4935-bb3c-052d9f73e680'::uuid;
update public.knowledge_articles set title='Operações permitidas durante a criação de sua solicitação', summary='Operações', body_md='### Operações

Para configurar os padrões de segurança da sua plataform, siga os passos abaixo:

- Acesse a área administrativa da plataforma.
- No menu, clique em Configurações > Parametrização Geral.
- Localize a funcionalidade Operações.

Aqui, o e-commerce pode configurar quais operações deseja permitir: Troca, Devolução ou Ambas as opções. Configure conforme a necessidade do seu negócio.

![Imagem do artigo Operações permitidas durante a criação de sua solicitação](knowledge-asset:6f4bfb0e-e09a-4fb3-8934-eea9f5d311dd)', updated_at=timezone('utc', now()) where id='2cf6b3f5-ad9d-43c3-bb87-b60995f4a000'::uuid;
update public.knowledge_articles set title='Pedidos pagos com vale-compras', summary='CONFIGURANDO CASOS DE PEDIDOS PAGOS COM VALE-COMPRAS', body_md='### Configurando casos de pedidos pagos com vale-compras

Passo a passo para configurar o comportamento do sistema em casos de troca ou devolução com uso de Vale-Compra:

- Acesse o painel Admin da plataforma.
- No menu à esquerda, clique em CONFIGURAÇÕES.
- Selecione a opção AMBIENTE e, em seguida, clique em ESTORNO/VALE-COMPRA.
- Procure pela funcionalidade "O que fazer em uma troca ou devolução em que haja o uso de Vale-Compra".

Aqui, o e-commerce poderá configurar o comportamento padrão do sistema para situações em que o pedido tenha sido pago com vale-compra e esteja sendo solicitado para devolução ou troca de produto. Isso permite que você defina como o sistema lidará com o valor do vale-compra nessas situações.

![Imagem do artigo Pedidos pagos com vale-compras](knowledge-asset:f2e4a0fc-f766-46b8-a792-4d6dc759bad9)

:::callout info
Dica: Definir corretamente esse comportamento é fundamental para garantir que o processo de troca ou devolução ocorra de forma fluida, sem gerar confusão para o cliente ou a equipe de atendimento.
:::', updated_at=timezone('utc', now()) where id='42e08159-bf07-47f1-9a0f-8f5c4d1c410b'::uuid;
update public.knowledge_articles set title='Pendência de Logística Reversa', summary='Quando o seu cliente solicitar a devolução de um pedido com mais de 10 itens, essa solicitação será registrada como "Pendência de Logística Reversa". Isso ocorre porque, devido ao grande volume de itens, será necessário o uso de mais de', body_md='Quando o seu consumidor solicitar a devolução de um pedido com mais de 10 itens, essa solicitação será registrada como "Pendência de Logística Reversa". Isso ocorre porque, devido ao grande volume de itens, será necessário o uso de mais de uma embalagem para o envio dos produtos.

O que significa "Pendência de Logística Reversa"?

- Para pedidos com mais de 10 itens, o código de postagem só será gerado após o agente informar a quantidade de embalagens necessárias para o envio dos produtos.

Como proceder:

- Acesse o menu de solicitações no painel da loja.
- Localize a solicitação do consumidor e clique em Ações Pendentes.
- Em "Ações Pendentes", você verá a Pendência de Logística Reversa.
- Informe a quantidade de embalagens necessárias para o envio dos itens.
- Clique em Gerar e-ticket.

Exemplo de tela:

![Imagem do artigo Pendência de Logística Reversa](knowledge-asset:416895f4-bfe7-4991-93d3-d73d9e8af7de)', updated_at=timezone('utc', now()) where id='d15c5184-570e-4dfb-ad3a-bf7af9e92477'::uuid;
update public.knowledge_articles set title='Política para estorno do frete', summary='Configurando a Política para Estorno do Frete', body_md='### Configurando a Política para Estorno do Frete

### Passo a passo para configurar o estorno do frete

- Acesse o painel Admin da plataforma.
- No menu à esquerda, clique em CONFIGURAÇÕES.
- Selecione a opção AMBIENTE e, em seguida, clique em ESTORNO/VALE-COMPRA.
- Localize a funcionalidade "Política para estorno do frete".

Nesta configuração, o e-commerce pode determinar se e como o valor do frete será estornado em caso de devolução do pedido. As opções disponíveis permitem que você defina regras específicas para o estorno do valor do frete, garantindo que o processo de devolução seja adequado à sua política comercial.

![Imagem do artigo Política para estorno do frete](knowledge-asset:76dd2b62-2f42-4935-9a30-9ae7acef73be)

:::callout info
Dica: Defina a política de estorno do frete de acordo com as práticas do seu e-commerce, levando em conta, por exemplo, se o cliente será reembolsado integralmente ou se haverá descontos no estorno, dependendo do motivo da devolução.
:::', updated_at=timezone('utc', now()) where id='27a719c1-9e0d-4d6f-ab47-f67c4383f41f'::uuid;
update public.knowledge_articles set title='Posso alterar a forma de reembolso do meu cliente?', summary='Sim, o e-commerce pode alterar manualmente a forma de reembolso de uma solicitação. Para isso, siga os passos abaixo:', body_md='Posso alterar a forma de reembolso do meu consumidor?

Sim, o e-commerce pode alterar manualmente a forma de reembolso de uma solicitação. Para isso, siga os passos abaixo:

- Acesse a área administrativa da plataforma.
- No menu lateral, clique em "Solicitações".
- Abra a solicitação para a qual você deseja alterar a forma de reembolso.
- Na aba "Resumo da Solicitação", localize a seção "Dados de Reembolso".
- O botão para alteração da forma de reembolso estará disponível nesta seção, conforme ilustrado na imagem abaixo.

![Imagem do artigo Posso alterar a forma de reembolso do meu cliente?](knowledge-asset:727e3943-edcb-44ce-935a-75551b70aeeb)

- Em seguida selecione o vale-compras que será pago(100% ou 110%), e confirme clicando em “Alterar para vale-compras”

![Imagem do artigo Posso alterar a forma de reembolso do meu cliente?](knowledge-asset:764b9585-8400-4c2c-b635-8983361f1852)', updated_at=timezone('utc', now()) where id='fdb9960a-fb6b-4a86-9091-2883f9f8af0c'::uuid;
update public.knowledge_articles set title='Posso alterar o e-mail e o endereço da solicitação?', summary='Sim, o e-commerce pode alterar manualmente o e-mail e o endereço de uma solicitação. Para isso, siga os passos abaixo:', body_md='Sim, o e-commerce pode alterar manualmente o e-mail e o endereço de uma solicitação. Para isso, siga os passos abaixo:

- Acesse a área administrativa da plataforma.
- No menu lateral, clique em "Solicitações".
- Abra a solicitação que você deseja alterar.
- Na aba "Resumo da Solicitação", localize as seções "Solicitante" e "Endereço".
- Os botões para alteração de e-mail e endereço estarão disponíveis nessas seções, conforme ilustrado na imagem abaixo.

![Imagem do artigo Posso alterar o e-mail e o endereço da solicitação?](knowledge-asset:5f9d45d7-43a3-4d70-9f94-bef1ec3c529e)

- Ao clicar em “Alterar e-mail”, você será direcionado a tela para preencher o novo e-mail que deve receber as notificações da solicitação, conforme imagem abaixo:

![Imagem do artigo Posso alterar o e-mail e o endereço da solicitação?](knowledge-asset:64dc4ba5-8679-42a2-afec-a790425bc57d)

- Se precisar pode clicar em “Alterar endereço”, preencher os dados atualizados e salvar

![Imagem do artigo Posso alterar o e-mail e o endereço da solicitação?](knowledge-asset:ed38e00c-ccf5-46a7-8f4e-912ada85e409)', updated_at=timezone('utc', now()) where id='a59c0bf2-0789-41b3-930d-a26e57248577'::uuid;
update public.knowledge_articles set title='Posso alterar o status de uma solicitação?', summary='Sim, o e-commerce pode alterar manualmente o status de uma solicitação. Para isso, siga os passos abaixo:', body_md='Sim, o e-commerce pode alterar manualmente o status de uma solicitação. Para isso, siga os passos abaixo:

- Acesse a área administrativa da plataforma.
- No menu lateral, clique em "Solicitações".
- Abra a solicitação cujo status você deseja alterar.
- Na aba "Resumo da Solicitação", localize a seção "Dados Gerais".
- O botão para alteração de status estará disponível nesta seção, conforme ilustrado na imagem abaixo.

![Imagem do artigo Posso alterar o status de uma solicitação?](knowledge-asset:bf720710-8bbe-47a3-af1c-0cc46df6f483)

- Ao clicar no botão, você poderá:

- Escolher o novo status.
- Adicione um comentário.
- Decidir se deseja ou não notificar o cliente sobre a alteração.

![Imagem do artigo Posso alterar o status de uma solicitação?](knowledge-asset:ac1d411a-b0a3-41dd-8097-05b01d7b646f)', updated_at=timezone('utc', now()) where id='4c4d5e61-69c8-4edd-9268-454cc9795564'::uuid;
update public.knowledge_articles set title='Posso enviar uma notificação de análise ao cliente?', summary='Sim, o e-commerce pode enviar notificações sobre produtos em análise, incluindo fotos e descrições. Para isso, siga os passos abaixo:', body_md='Sim, o e-commerce pode enviar notificações sobre produtos em análise, incluindo fotos e descrições. Para isso, siga os passos abaixo:

- Acesse o menu "Solicitações".
- Abra a solicitação que você deseja notificar.
- Na aba "Ações Pendentes", localize a opção "Enviar Notificação de Análise ao Cliente", conforme ilustrado nas imagens abaixo.

![Imagem do artigo Posso enviar uma notificação de análise ao cliente?](knowledge-asset:7b0d4a9b-59e6-42b4-be1a-cfa62b247a30)

- Aqui você pode deixar um comentário, anexar uma imagem e arquivo se desejar

![Imagem do artigo Posso enviar uma notificação de análise ao cliente?](knowledge-asset:19f0d30e-0b2c-4a26-bda4-4559a0164cee)', updated_at=timezone('utc', now()) where id='b410dea9-39bb-403a-9573-5a959eef1416'::uuid;
update public.knowledge_articles set title='Posso filtrar as solicitações de reversas?', summary='Sim, é possível filtrar as solicitações de reversas na plataforma. Para isso, siga os passos abaixo:', body_md='Sim, é possível filtrar as solicitações de reversas na plataforma. Para isso, siga os passos abaixo:

- Acesse a área administrativa da plataforma.
- No menu, clique em Solicitações.

Na página de solicitações, o e-commerce pode aplicar os seguintes filtros para personalizar a visualização:

- Período: Filtre as solicitações por data.
- Status: Selecione o status das solicitações (por exemplo, pendente, concluída, etc.).
- Parâmetros: Defina filtros específicos conforme os critérios da sua operação.
- Pedido na Loja: Filtre com base nas solicitações realizadas diretamente na loja física.
- Filtro Avançado: Aplique filtros mais detalhados para refinar ainda mais os resultados.

![Imagem do artigo Posso filtrar as solicitações de reversas?](knowledge-asset:f7d2c6ac-343a-4e3f-a818-68eef4630742)', updated_at=timezone('utc', now()) where id='9f90efbb-40a5-4374-b6d6-f9adce1d0e95'::uuid;
update public.knowledge_articles set title='Produtos em Exceção', summary='Nessa funcionalidade, você pode configurar produtos ou categorias específicas que não terão permissão para criar reversas.', body_md='Nessa funcionalidade, você pode configurar produtos ou categorias específicas que não terão permissão para criar reversas.

- Acesse a área administrativa da plataforma.
- No menu, clique em Configurações > Parametrização Geral.
- Localize a funcionalidade Produtos em Exceção.

![Imagem do artigo Produtos em Exceção](knowledge-asset:e90070f5-a760-4580-bb00-5e0aa9a2d038)', updated_at=timezone('utc', now()) where id='4d1e1bef-f13e-4db9-9cac-19e00019307d'::uuid;
update public.knowledge_articles set title='Qual recurso de integração devo usar?', summary='Escolha o recurso de integração a partir do cenário operacional do seu e-commerce.', body_md='Escolha o caminho pelo que você precisa realizar, não apenas pela versão da API.

### Quero iniciar a jornada pelo e-commerce

Quando o e-commerce possui o pedido e deseja direcionar o cliente para a interface Genius Returns, use o fluxo de integração do pedido. Ele integra os dados e retorna um link para o próximo passo do cliente.

::api-reference initiate-flow

### A solicitação já foi criada em outro sistema

Quando ERP, middleware ou sistema próprio já criou a troca ou devolução, use a operação de importação. Ela não é a mesma coisa que iniciar o fluxo hospedado pelo Genius Returns.

::api-reference import-request

### Preciso consultar um processo

Para obter um processo específico, use a consulta por identificador. Para acompanhar uma operação por filtros, use a listagem paginada.

::api-reference get-process

::api-reference list-processes

### Preciso trabalhar com nota fiscal de devolução

Use a família de notas fiscais vinculada ao processo para adicionar, atualizar, inativar, listar ou consultar uma nota.

::api-reference add-return-note

::api-reference update-return-note

::api-reference deactivate-return-note

::api-reference list-return-notes

::api-reference get-return-note

### Preciso informar avaliação de produto

Use o recurso de rating quando a operação precisar registrar a avaliação de um ou mais produtos relacionados à solicitação.

::api-reference product-rating

### Ainda não sei qual caminho seguir

Leia o [hub de Integrações e API](/help/genius/articles/integracoes-e-api-do-genius-returns) e confirme pré-requisitos, credenciais e habilitação antes de implementar.', updated_at=timezone('utc', now()) where id='f2fb36e0-a57d-453a-8576-10e30aded1b5'::uuid;
update public.knowledge_articles set title='Reenviar um e-mail ao cliente', summary='Como reenviar os e-mails?', body_md='Como reenviar os e-mails?

Para reenviar um e-mail, siga os passos abaixo:

- Acesse o menu "Solicitações".
- Abra a solicitação desejada.
- Na aba "Comunicação", clique no botão "Reenviar".

![Imagem do artigo Reenviar um e-mail ao cliente](knowledge-asset:40fe8d85-7565-4242-ac5d-986a07e60a57)', updated_at=timezone('utc', now()) where id='326aa6a3-dd21-41ce-9884-4a6794945e17'::uuid;
update public.knowledge_articles set title='Regra de Exceção para Motivos - Não Gerar Logística Reversa', summary='Como Habilitar a Regra?', body_md='### Como Habilitar a Regra?

Para configurar a regra de exceção que impede a geração automática da logística reversa, siga os passos abaixo:

- Acesse Configurações > Ambiente > Motivos.
- Localize o motivo cadastrado.
- Marque a opção “Não Gerar Logística Reversa”.

![Imagem do artigo Regra de Exceção para Motivos - Não Gerar Logística Reversa](knowledge-asset:ee6d9f04-3f4c-4074-85f6-5bf1ee0817a8)

### Funcionamento da Regra

Essa funcionalidade foi desenvolvida para atender a uma necessidade do setor de SAC. Para que ela funcione corretamente, é essencial que a regra geral Gerar Ticket Reverso Automaticamente esteja ativada. Para verificar ou ativar essa regra:

- Vá até Configuração > Ambiente > Parametrização Geral.
- Ative a opção Gerar Ticket Reverso Automaticamente.

![Imagem do artigo Regra de Exceção para Motivos - Não Gerar Logística Reversa](knowledge-asset:50640ae1-0a55-401c-b5f1-bba11c07334c)

Com essa configuração ativa, os motivos que forem marcados como “Não Gerar Logística Reversa” não vão disparar a autorização postal automática. Dessa forma, a autorização de postagem precisará ser realizada manualmente pelo botão “Gerar e-Ticket”, disponível na aba Ações Pendentes das solicitações.

![Imagem do artigo Regra de Exceção para Motivos - Não Gerar Logística Reversa](knowledge-asset:1011c647-16a2-4023-8db0-c97f8b07d39d)

### Impacto para o Consumidor

O consumidor continuará recebendo o e-mail transacional sobre a solicitação efetuada. Entretanto, no corpo do e-mail, haverá a mensagem: “Processo em liberação, por favor aguarde.” Isso indica que o envio da autorização será analisado e poderá ocorrer posteriormente, de forma manual.

### Exemplo de Aplicação

Em casos onde a regra de Foto Obrigatória é utilizada em conjunto com Não Gerar Logística Reversa, o SAC poderá analisar as imagens enviadas antes de tomar a decisão sobre autorizar ou não a postagem do produto.

![Imagem do artigo Regra de Exceção para Motivos - Não Gerar Logística Reversa](knowledge-asset:668d3803-cdf0-41d1-a535-f3294a83fc8e)

Para facilitar a identificação das solicitações que requerem ação manual, essas serão marcadas com um símbolo de exclamação.

![Imagem do artigo Regra de Exceção para Motivos - Não Gerar Logística Reversa](knowledge-asset:db5474a1-c3dc-4dc3-b5ad-3883f0a62fdd)

### Dica para Identificação Rápida

Para visualizar todas as solicitações pendentes de autorização de postagem, utilize o seguinte filtro:

- Vá até Filtros.
- Selecione Filtros por Tipo de Pendência > Autorização Logística Reversa.

Com isso, o SAC poderá gerenciar de forma eficiente as solicitações que exigem ação manual.', updated_at=timezone('utc', now()) where id='c1dc0173-1777-452b-9e56-3ab9a88c4fbe'::uuid;
update public.knowledge_articles set title='Regra para segunda solicitação', summary='Como configurar regra para segunda solicitação', body_md='Como configurar regra para segunda solicitação

Acesse a área administrativa da plataforma.

No menu, clique em Configurações > Parametrização Geral .

Localize a funcionalidade Regra para segunda solicitação do mesmo Pedido .

Determine se o cliente poderá ou não continuar com uma segunda solicitação para o mesmo pedido ou item (SKU). Configure conforme necessário para o seu processo.', updated_at=timezone('utc', now()) where id='f721db79-02d3-4cc6-8324-395e2b45a1b1'::uuid;
update public.knowledge_articles set title='Regra por motivo', summary='Como habilitar uma regra para um motivo específico?', body_md='### Como habilitar uma regra para um motivo específico?

Para configurar regras aplicáveis apenas a um motivo específico, siga estas etapas:

- Acesse Configurações > Ambiente > Motivos.
- Encontre o motivo já cadastrado na lista.
- Selecione a opção desejada para habilitar a ação apenas para esse motivo, conforme o exemplo abaixo.

Isso garantirá que a regra se aplique exclusivamente ao motivo selecionado.

![Imagem do artigo Regra por motivo](knowledge-asset:7fadedce-ec16-4051-955b-e1a3f2338461)', updated_at=timezone('utc', now()) where id='5d3dede2-e3d9-456b-83d6-2bca1f4e8e1a'::uuid;
update public.knowledge_articles set title='Sellers Permitidos para Criar Vale-Compras', summary='Configurando Sellers Permitidos para Criar Vale-Compras', body_md='### Configurando Sellers Permitidos para Criar Vale-Compras

### Passo a passo para configurar os sellers autorizados a criar vale-compras

- Acesse o painel Admin da plataforma.
- No menu à esquerda, clique em CONFIGURAÇÕES.
- Selecione a opção AMBIENTE e, em seguida, clique em ESTORNO/VALE-COMPRA.
- Localize a funcionalidade "Sellers permitidos para geração de vale-compras".

Nesta configuração, você pode determinar quais sellers (ou vendedores) terão permissão para criar vale-compras para os clientes. Selecione os sellers desejados para restringir a geração de vale-compras apenas a eles.

- Para permitir que todos os sellers criem vale-compras, basta deixar o campo em branco.

![Imagem do artigo Sellers Permitidos para Criar Vale-Compras](knowledge-asset:8c993b58-20ae-4cc5-9f6f-534c693b8aca)

:::callout info
Dica: Se a sua plataforma permite múltiplos sellers, essa configuração ajuda a garantir que apenas os sellers autorizados possam emitir vale-compras, mantendo o controle sobre os reembolsos.
:::', updated_at=timezone('utc', now()) where id='112e4168-f964-45a5-8e0a-64540029da22'::uuid;
update public.knowledge_articles set title='Valor Manual para Estorno Automático', summary='Configuração do Valor Manual para Estorno Automático', body_md='Configuração do Valor Manual para Estorno Automático

Para ajustar os padrões de segurança da sua plataforma e configurar o valor manual para estorno automático, siga as orientações abaixo:

- Acesse a área administrativa da plataforma.
- No menu principal, clique em Configurações>Administrativo> Valor Manual para Estorno Automático .

Ao habilitar essa funcionalidade, o e-commerce poderá definir manualmente o valor do estorno, permitindo ajustes para diferentes tipos de pagamento (cartão de crédito, boleto, etc.).

![Imagem do artigo Valor Manual para Estorno Automático](knowledge-asset:05ba9976-6d4a-409f-8500-37ef28d1922e)', updated_at=timezone('utc', now()) where id='fd0e3a49-ddfe-4324-a27d-669a4fea7cd9'::uuid;
update public.knowledge_articles set title='Variação do Produto', summary='Acesse a área administrativa da plataforma.', body_md='Acesse a área administrativa da plataforma.

No menu, clique em Configurações > Parametrização Geral .

Localize a funcionalidade VARIAÇÃO DE PRODUTO

Configure como as variações de tamanho dos produtos serão apresentadas no processo de reversa.

Com essas configurações, você pode personalizar o processo de reversa de acordo com as necessidades do seu e-commerce, garantindo uma gestão eficiente e automatizada.', updated_at=timezone('utc', now()) where id='e46709ae-6228-439c-9cd3-408cc2d83ad1'::uuid;
update public.knowledge_articles set title='Visão geral da Central Genius', summary='Resumo operacional do que a Central Genius concentra e quando consultar cada orientação pública.', body_md='A Central Genius reúne orientações públicas para operações B2B que usam Genius Returns e Central Genius no atendimento diário.

### O que você encontra aqui

- artigos publicados para operação de troca e devolução
- checklists de integração que podem ser compartilhados com times do cliente
- orientações práticas para abrir tickets com contexto suficiente

### Quando consultar a Central

Consulte a Central antes de abrir um chamado novo, quando precisar alinhar um procedimento com outro time ou quando quiser compartilhar uma referência pública com o cliente.

### O que não entra na Central pública

Não entram detalhes internos de engenharia, credenciais, configurações restritas ou anotações operacionais exclusivas do suporte.', updated_at=timezone('utc', now()) where id='f0e56b7a-4d10-4905-b69e-7fe23b652137'::uuid;
commit;
