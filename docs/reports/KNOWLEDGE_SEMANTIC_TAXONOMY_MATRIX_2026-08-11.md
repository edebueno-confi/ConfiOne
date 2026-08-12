# Matriz semântica da Central de Ajuda

Data: 11/08/2026
Escopo: `knowledge_space = genius`, banco Supabase local
Fonte da decisão: leitura dos títulos, resumos e corpos dos 57 artigos importados do Octadesk, dos 12 artigos técnicos de API e do fixture interno.

## Resultado executivo

- 69 artigos publicados e públicos.
- 1 fixture interno em rascunho (`Space Aware CI Fixture`), preservado fora da central pública.
- 70 artigos classificados; nenhum artigo ficou sem categoria.
- A antiga mistura entre configuração, integração externa e documentação de API foi removida.
- “Pendência de Logística Reversa” foi tratada como status operacional, não como erro.
- A ordenação passou a ser persistida em `knowledge_categories.sort_order`; não há números embutidos nos nomes.

## Critérios aplicados

| Área | Critério semântico |
| --- | --- |
| Configurações da plataforma | Parâmetros e comportamentos gerais do Genius Returns. |
| Cadastros e regras | Cadastro de conta, produtos, motivos e regras de negócio. |
| Solicitações e operação | Ações de criação, consulta e atendimento de solicitações. |
| Status e pendências | Estados operacionais e tratamento de pendências. |
| Estornos, reembolsos e vale-compras | Qualquer tutorial de estorno, reembolso, frete ou vale-compra. |
| Integrações de plataformas | Configuração, permissões e erros de plataformas/transportadoras externas. |
| Logística reversa | Prazos, exceções e regras do fluxo de logística reversa. |
| Sellers e lojas | Sellers, lojas físicas e lojas virtuais. |
| Comunicação e notificações | E-mails, textos do portal e notificações ao consumidor. |
| Erros e soluções | Erros de operação que não dependem de uma integração externa específica. |
| Integrações e API | Documentação técnica para sistemas de clientes integrarem com o Genius Returns. |
| Acessos e segurança | Usuários e padrões de segurança. |

## Matriz completa

### Configurações da plataforma — 4

| Artigo | Evidência lida / decisão |
| --- | --- |
| Como automatizar a conclusão de uma solicitação | Configura automação de conclusão e SLA; é comportamento da plataforma. |
| Como configurar a cor exibida nos filtros básicos das solicitações | Ajusta apresentação/configuração dos filtros do sistema. |
| Configurando parametrização geral | Tutorial guarda-chuva de parâmetros gerais e links de configuração. |
| Operações permitidas durante a criação de sua solicitação | Define opções e comportamento do fluxo de criação. |

### Cadastros e regras — 8

| Artigo | Evidência lida / decisão |
| --- | --- |
| Como cadastrar motivos para troca ou devolução | Cadastro de motivos que alimentam as regras da operação. |
| Como configurar o BlockList? | Cadastro/configuração de bloqueios para produtos ou categorias. |
| Como informar a SKU durante a troca | Informação de produto/SKU necessária ao fluxo de troca. |
| Criando e atualizando o cadastro | Cadastro da conta, logo e endereço de retorno. |
| Produtos em Exceção | Regra de produtos/categorias que não seguem o fluxo padrão. |
| Regra para segunda solicitação | Regra de negócio para solicitações duplicadas. |
| Regra por motivo | Regra de negócio vinculada ao motivo selecionado. |
| Variação do Produto | Cadastro/configuração de variação de produto. |

### Solicitações e operação — 5

| Artigo | Evidência lida / decisão |
| --- | --- |
| Como alterar ou aprovar os produtos de uma solicitação? | Ação operacional sobre os produtos de uma solicitação. |
| Como o cliente solicita uma reversa | Fluxo de abertura da solicitação pelo cliente. |
| Modo sac | Operação assistida para criar solicitação em nome do consumidor. |
| Posso alterar o e-mail e o endereço da solicitação? | Ação operacional sobre uma solicitação existente. |
| Posso filtrar as solicitações de reversas? | Consulta e operação da fila de solicitações. |

### Status e pendências — 2

| Artigo | Evidência lida / decisão |
| --- | --- |
| Pendência de Logística Reversa | O texto descreve o status de pendência e a ação do agente; não é erro. |
| Posso alterar o status de uma solicitação? | Tutorial de transição/alteração de status operacional. |

### Estornos, reembolsos e vale-compras — 12

| Artigo | Evidência lida / decisão |
| --- | --- |
| Como automatizar o pagamento de Estorno e Vale-Compra | Configura pagamento automatizado de estorno/vale. |
| Como configurar o cálculo do estorno | Define cálculo financeiro do estorno. |
| Como configurar o estorno automático via pix | Define mecanismo de estorno via PIX. |
| Como configurar o Vale-Compras (retenção) | Configura retenção em vale-compra. |
| Como realizar alterações em um Vale-compra pendente? | Operação financeira sobre vale pendente. |
| Configurando as Formas de Estorno | Define formas de devolução financeira. |
| Formas de estorno por motivo | Relaciona motivo e forma de estorno. |
| Limitando o Valor Máximo de um Estorno | Define limite financeiro. |
| Pedidos pagos com vale-compras | Trata comportamento de pedidos pagos com vale. |
| Política para estorno do frete | Regra de reembolso do frete. |
| Posso alterar a forma de reembolso do meu cliente? | Ação sobre a forma de reembolso. |
| Valor Manual para Estorno Automático | Define valor manual usado no estorno automatizado. |

### Integrações de plataformas — 10

| Artigo | Evidência lida / decisão |
| --- | --- |
| Como atualizar os dados de integrações do e-commerce | Lista plataformas e requisitos de API/permissão; é integração de canal externo. |
| Erro "Não Autorizado" ao Gerar Código de postagem | Falha de autorização na integração de postagem/Correios. |
| Erro de autorização ao acessar pedidos na Vtex | Permissão de acesso à VTEX, não erro genérico do Genius. |
| Erros na integração do contrato do Correios | Contrato/token da integração com Correios. |
| Habilitar a API de Logística Reversa do Correios | Habilitação de API/contrato externo do Correios. |
| Intalação e integração Nuvemshop | Instalação e conexão com plataforma Nuvemshop. |
| Integração e configuração com os Correios | Credenciais e configuração da transportadora. |
| Permissões Shopify | Permissões necessárias na Shopify. |
| Permissões TrayCorp | Permissões necessárias na TrayCorp/TrayCommerce. |
| Permissões Vtex | Permissões necessárias na VTEX. |

### Logística reversa — 3

| Artigo | Evidência lida / decisão |
| --- | --- |
| Como Configurar o Prazo Logístico por Estado? | Regra de prazo do fluxo logístico, não credencial de integração. |
| Configurando a funcionalidade Fique com o Item | Exceção operacional que evita o retorno físico. |
| Regra de Exceção para Motivos - Não Gerar Logística Reversa | Regra do fluxo de logística reversa. |

### Sellers e lojas — 5

| Artigo | Evidência lida / decisão |
| --- | --- |
| Como cadastrar Lojas Físicas | Cadastro de loja física. |
| Configuração de Sellers Permitidos | Permissão/configuração operacional de sellers. |
| Criar Lojas Virtuais | Cadastro de loja virtual. |
| Regras de Cadastro e configurações de Sellers( Estorno e Logística) | Configuração operacional de sellers e seus efeitos. |
| Sellers Permitidos para Criar Vale-Compras | Permissão operacional de sellers para vale. |

### Comunicação e notificações — 4

| Artigo | Evidência lida / decisão |
| --- | --- |
| Como cadastrar os e-mails para notificações automáticas | Cadastro dos destinatários de notificações. |
| Como configurar os textos do portal do cliente | Conteúdo textual apresentado no portal. |
| Posso enviar uma notificação de análise ao cliente? | Envio de comunicação ao consumidor. |
| Reenviar um e-mail ao cliente | Operação de reenvio de comunicação. |

### Erros e soluções — 2

| Artigo | Evidência lida / decisão |
| --- | --- |
| Erro ao Tentar Realizar o Estorno | Erro no fluxo de estorno, sem ser tutorial de credencial de plataforma. |
| Erro no CEP ou Endereço Incorreto | Erro de dados/endereço no fluxo operacional. |

### Integrações e API — 12

Estes artigos permanecem públicos, mas em uma área explicitamente técnica: ensinam equipes de tecnologia a integrar sistemas ao Genius Returns (API, Swagger, credenciais, processos, notas fiscais, avaliações e ambientes). Não são guias de configuração de Shopify, VTEX, TrayCorp, Nuvemshop ou Correios.

| Artigo |
| --- |
| Ambientes de produção, QA e testes |
| API Docs, Swagger e referência técnica |
| Como autenticar uma integração |
| Como consultar processos e acompanhar status |
| Como importar uma solicitação criada em outro sistema |
| Como informar avaliações de produtos |
| Como iniciar uma troca ou devolução pelo e-commerce |
| Como integrar notas fiscais de devolução |
| Como solicitar credenciais ou habilitação |
| Erros comuns em integrações |
| Integrações e API do Genius Returns |
| Qual recurso de integração devo usar? |

### Acessos e segurança — 2

| Artigo | Evidência lida / decisão |
| --- | --- |
| Como criar um usuario | Criação de usuário da operação. |
| Configurar padrões de segurança | Configuração de segurança de acesso/login. |

### Interno, preservado fora da publicação — 1

| Artigo | Decisão |
| --- | --- |
| Space Aware CI Fixture | Fixture de CI; permanece `draft` + `internal` em categoria interna. Não é artigo de cliente. |

## Implementação

- Migração: `supabase/migrations/20260811090000_knowledge_semantic_taxonomy_v2.sql`.
- Campo persistido: `knowledge_categories.sort_order`.
- Read models atualizados: `vw_admin_knowledge_categories_v2` e `vw_public_knowledge_navigation`.
- RPC para futuras reordenações: `rpc_admin_reorder_knowledge_categories_v1`.
- O banco local foi atualizado sem reset e sem alteração remota.
