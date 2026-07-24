-- KNOWLEDGE-01.1: hub público de Integrações e API.
--
-- O conteúdo abaixo foi escrito a partir do API Docs oficial auditado em
-- 2026-07-24. O Swagger permanece como referência complementar e não é usado
-- para promover operações que não aparecem no API Docs.

do $migration$
declare
  v_space_id uuid;
  v_category_id uuid;
begin
  select id into strict v_space_id
  from public.knowledge_spaces
  where slug = 'genius';

  select id into v_category_id
  from public.knowledge_categories
  where knowledge_space_id = v_space_id
    and slug = 'integracoes'
  limit 1;

  if v_category_id is null then
    insert into public.knowledge_categories (
      knowledge_space_id,
      name,
      slug,
      description,
      visibility
    )
    values (
      v_space_id,
      'Integrações e API',
      'integracoes',
      'Guias de decisão para conectar e-commerce, ERP, middleware e Genius Returns com segurança.',
      'public'::public.knowledge_visibility
    )
    returning id into v_category_id;
  else
    update public.knowledge_categories
    set
      name = 'Integrações e API',
      description = 'Guias de decisão para conectar e-commerce, ERP, middleware e Genius Returns com segurança.',
      visibility = 'public'::public.knowledge_visibility,
      updated_at = timezone('utc', now())
    where id = v_category_id;
  end if;

  insert into public.knowledge_articles (
    knowledge_space_id,
    category_id,
    visibility,
    status,
    title,
    slug,
    summary,
    body_md,
    source_path,
    source_hash,
    current_revision_number,
    published_at,
    tags
  )
  values
  (
    v_space_id, v_category_id, 'public', 'published',
    'Integrações e API do Genius Returns',
    'integracoes-e-api-do-genius-returns',
    'Entenda qual recurso usar para conectar seu e-commerce, ERP ou middleware ao Genius Returns.',
    $$# Integrações e API do Genius Returns

Esta categoria orienta equipes de tecnologia a escolher o caminho correto para integrar o Genius Returns. A Central explica o cenário e os pré-requisitos; a [API Docs]({{link:api_docs}}) detalha o contrato técnico; o [Swagger]({{link:swagger}}) complementa a consulta interativa.

## O que você pode fazer

- autenticar um sistema externo autorizado;
- permitir que o cliente inicie uma solicitação pelo e-commerce;
- importar uma solicitação criada em outro sistema;
- consultar e listar processos de troca ou devolução;
- adicionar, atualizar, inativar e consultar notas fiscais de devolução;
- informar avaliações relacionadas aos produtos de uma solicitação.

## Para quem é esta documentação

Este hub é voltado para equipes de tecnologia de e-commerce, desenvolvedores de ERP, integradores, fornecedores de middleware e parceiros técnicos autorizados.

## Antes de começar

:::callout warning
A integração exige credenciais fornecidas pela Genius Returns. A disponibilidade de cada recurso pode depender do contrato, plano ou habilitação da operação.
:::

- mantenha credenciais somente em um backend seguro, nunca no frontend público;
- trate produção, QA e mock como ambientes com finalidades diferentes;
- use o Swagger para testes apenas em ambiente autorizado;
- nunca publique credenciais, tokens, dados de clientes ou payloads reais.

## Escolha seu cenário

| Quero fazer isto | Recurso indicado |
| --- | --- |
| Autenticar meu sistema | [Como autenticar uma integração](/help/genius/articles/como-autenticar-uma-integracao) |
| Permitir que o cliente inicie uma solicitação pelo e-commerce | [Como iniciar uma troca ou devolução pelo e-commerce](/help/genius/articles/como-iniciar-uma-troca-ou-devolucao-pelo-e-commerce) |
| Importar uma solicitação criada em outro sistema | [Como importar uma solicitação criada em outro sistema](/help/genius/articles/como-importar-uma-solicitacao-criada-em-outro-sistema) |
| Consultar ou listar processos | [Como consultar processos e acompanhar status](/help/genius/articles/como-consultar-processos-e-acompanhar-status) |
| Enviar dados de nota fiscal | [Como integrar notas fiscais de devolução](/help/genius/articles/como-integrar-notas-fiscais-de-devolucao) |
| Informar avaliação de produtos | [Como informar avaliações de produtos](/help/genius/articles/como-informar-avaliacoes-de-produtos) |

## Próximo passo

Comece pelo [guia de escolha do recurso](/help/genius/articles/qual-recurso-de-integracao-devo-usar). Se ainda não houver credenciais ou habilitação, [solicite orientação à Genius Returns](/help/genius/articles/como-solicitar-credenciais-ou-habilitacao).$$,
    'docs/reports/KNOWLEDGE_01_1_INTEGRATIONS_API_AUDIT_2026-07-24.md',
    'knowledge-01.1-hub-integracoes-api-v1',
    1,
    timezone('utc', now()),
    array['api','integração','swagger','openapi','erp','e-commerce','middleware']
  ),
  (
    v_space_id, v_category_id, 'public', 'published',
    'Qual recurso de integração devo usar?',
    'qual-recurso-de-integracao-devo-usar',
    'Escolha o recurso de integração a partir do cenário operacional do seu e-commerce.',
    $$# Qual recurso de integração devo usar?

Escolha o caminho pelo que você precisa realizar, não apenas pela versão da API.

## Quero iniciar a jornada pelo e-commerce

Quando o e-commerce possui o pedido e deseja direcionar o cliente para a interface Genius Returns, use o fluxo de integração do pedido. Ele integra os dados e retorna um link para o próximo passo do cliente.

::api-reference initiate-flow

## A solicitação já foi criada em outro sistema

Quando ERP, middleware ou sistema próprio já criou a troca ou devolução, use a operação de importação. Ela não é a mesma coisa que iniciar o fluxo hospedado pelo Genius Returns.

::api-reference import-request

## Preciso consultar um processo

Para obter um processo específico, use a consulta por identificador. Para acompanhar uma operação por filtros, use a listagem paginada.

::api-reference get-process

::api-reference list-processes

## Preciso trabalhar com nota fiscal de devolução

Use a família de notas fiscais vinculada ao processo para adicionar, atualizar, inativar, listar ou consultar uma nota.

::api-reference add-return-note

::api-reference update-return-note

::api-reference deactivate-return-note

::api-reference list-return-notes

::api-reference get-return-note

## Preciso informar avaliação de produto

Use o recurso de rating quando a operação precisar registrar a avaliação de um ou mais produtos relacionados à solicitação.

::api-reference product-rating

## Ainda não sei qual caminho seguir

Leia o [hub de Integrações e API](/help/genius/articles/integracoes-e-api-do-genius-returns) e confirme pré-requisitos, credenciais e habilitação antes de implementar.$$,
    'docs/reports/KNOWLEDGE_01_1_INTEGRATIONS_API_AUDIT_2026-07-24.md',
    'knowledge-01.1-resource-choice-v1', 1, timezone('utc', now()),
    array['api','integração','processo','pedido','troca','devolução','ERP','middleware']
  ),
  (
    v_space_id, v_category_id, 'public', 'published',
    'Como autenticar uma integração',
    'como-autenticar-uma-integracao',
    'Veja o fluxo conceitual de autenticação sem expor credenciais ou tokens reais.',
    $$# Como autenticar uma integração

A autenticação deve acontecer no backend seguro do sistema integrador.

## Fluxo

1. Receba `GeniusKey` e `GeniusToken` pelos canais autorizados da Genius Returns.
2. Envie esses cabeçalhos para a operação de autenticação.
3. Receba o JWT retornado.
4. Use o valor retornado como `Bearer Token` nas chamadas protegidas.
5. Renove o token conforme a expiração informada pela resposta.

::api-reference authenticate

:::callout danger
Use somente placeholders em exemplos. Nunca coloque credenciais, JWTs, tokens, cookies ou secrets no frontend, no repositório ou em capturas de tela.
:::

## Ambientes

Use [produção]({{link:production}}), [QA]({{link:qa}}) ou o [mock]({{link:mock}}) conforme a finalidade do teste. A habilitação e o acesso podem variar por contrato.$$,
    'docs/reports/KNOWLEDGE_01_1_INTEGRATIONS_API_AUDIT_2026-07-24.md',
    'knowledge-01.1-authentication-v1', 1, timezone('utc', now()),
    array['api','integração','autenticação','token','bearer','GeniusKey','GeniusToken']
  ),
  (
    v_space_id, v_category_id, 'public', 'published',
    'Como iniciar uma troca ou devolução pelo e-commerce',
    'como-iniciar-uma-troca-ou-devolucao-pelo-e-commerce',
    'Entenda quando o e-commerce deve integrar um pedido ao fluxo hospedado do Genius Returns.',
    $$# Como iniciar uma troca ou devolução pelo e-commerce

Use este caminho quando o pedido está no e-commerce e o objetivo é levar o cliente para o fluxo de solicitação do Genius Returns.

## O que o fluxo resolve

O e-commerce envia os dados do pedido para a operação de integração. A resposta fornece um link para direcionar o cliente ao estágio adequado da solicitação.

::api-reference initiate-flow

## Antes de implementar

- confirme as credenciais e a habilitação da integração;
- mantenha a chamada no backend do e-commerce ou middleware;
- valide o ambiente escolhido antes de testar;
- não exponha o contrato completo nem dados reais na interface pública.

Para parâmetros, payloads e respostas, consulte a operação correspondente na [API Docs]({{link:api_docs}}).$$,
    'docs/reports/KNOWLEDGE_01_1_INTEGRATIONS_API_AUDIT_2026-07-24.md',
    'knowledge-01.1-initiate-flow-v1', 1, timezone('utc', now()),
    array['api','e-commerce','pedido','troca','devolução','fluxo']
  ),
  (
    v_space_id, v_category_id, 'public', 'published',
    'Como importar uma solicitação criada em outro sistema',
    'como-importar-uma-solicitacao-criada-em-outro-sistema',
    'Use este guia quando ERP, middleware ou sistema próprio já criou a solicitação.',
    $$# Como importar uma solicitação criada em outro sistema

Quando a troca ou devolução já foi criada em ERP, middleware ou sistema próprio, o cenário é de importação. Isso é diferente de iniciar o fluxo hospedado do Genius Returns a partir do pedido do e-commerce.

::api-reference import-request

## Cuidados

- confirme o contrato e a habilitação antes de enviar dados;
- faça a chamada em backend seguro;
- preserve o identificador retornado para acompanhamento;
- trate respostas de validação sem expor detalhes internos ao cliente final.

Consulte a especificação da operação na [API Docs]({{link:api_docs}}).$$,
    'docs/reports/KNOWLEDGE_01_1_INTEGRATIONS_API_AUDIT_2026-07-24.md',
    'knowledge-01.1-import-request-v1', 1, timezone('utc', now()),
    array['api','integração','solicitação','ERP','middleware','importação']
  ),
  (
    v_space_id, v_category_id, 'public', 'published',
    'Como consultar processos e acompanhar status',
    'como-consultar-processos-e-acompanhar-status',
    'Consulte um processo específico ou liste processos com filtros para acompanhar a operação.',
    $$# Como consultar processos e acompanhar status

## Consultar um processo específico

Use o identificador do processo quando você já souber qual troca ou devolução precisa ser consultada.

::api-reference get-process

## Listar e filtrar processos

Use a listagem quando precisar acompanhar vários processos ou aplicar filtros de período, status e outros critérios disponíveis no contrato.

::api-reference list-processes

## O que validar

- confirme o ambiente e o token usados;
- trate paginação e respostas não autorizadas;
- não use dados de produção em testes;
- compare o status recebido com o contexto operacional antes de comunicar o cliente.

Para os parâmetros e modelos completos, abra a [API Docs]({{link:api_docs}}).$$,
    'docs/reports/KNOWLEDGE_01_1_INTEGRATIONS_API_AUDIT_2026-07-24.md',
    'knowledge-01.1-processes-v1', 1, timezone('utc', now()),
    array['api','processo','status','consulta','listagem','troca','devolução']
  ),
  (
    v_space_id, v_category_id, 'public', 'published',
    'Como integrar notas fiscais de devolução',
    'como-integrar-notas-fiscais-de-devolucao',
    'Entenda os cenários de inclusão, atualização, inativação e consulta de notas fiscais vinculadas a processos.',
    $$# Como integrar notas fiscais de devolução

As notas fiscais de devolução são vinculadas ao processo correspondente. Use as operações abaixo conforme o cenário.

## Adicionar uma nota

::api-reference add-return-note

## Atualizar uma nota

::api-reference update-return-note

## Inativar uma nota

::api-reference deactivate-return-note

## Listar ou consultar uma nota

::api-reference list-return-notes

::api-reference get-return-note

Quando confirmados no contrato, os dados podem incluir número, série, chave, XML, link do DANFE, data, arquivo e identificadores do processo. Não transforme este guia em reprodução integral do schema.

Consulte os modelos completos na [API Docs]({{link:api_docs}}) e use o [Swagger]({{link:swagger}}) somente em ambiente autorizado.$$,
    'docs/reports/KNOWLEDGE_01_1_INTEGRATIONS_API_AUDIT_2026-07-24.md',
    'knowledge-01.1-return-notes-v1', 1, timezone('utc', now()),
    array['api','nota fiscal','devolução','XML','DANFE','processo']
  ),
  (
    v_space_id, v_category_id, 'public', 'published',
    'Como informar avaliações de produtos',
    'como-informar-avaliacoes-de-produtos',
    'Conheça o recurso de rating para registrar avaliações relacionadas aos produtos de uma solicitação.',
    $$# Como informar avaliações de produtos

Use o recurso de rating quando a operação precisar informar a avaliação de um ou mais produtos relacionados a uma solicitação de troca ou devolução.

::api-reference product-rating

O contrato técnico, os campos e as respostas devem ser consultados na [API Docs]({{link:api_docs}}). A operação está documentada no API Docs principal; não a publique como recomendação baseada apenas no Swagger.$$,
    'docs/reports/KNOWLEDGE_01_1_INTEGRATIONS_API_AUDIT_2026-07-24.md',
    'knowledge-01.1-rating-v1', 1, timezone('utc', now()),
    array['api','rating','produto','avaliação','processo']
  ),
  (
    v_space_id, v_category_id, 'public', 'published',
    'Ambientes de produção, QA e testes',
    'ambientes-de-producao-qa-e-testes',
    'Escolha o ambiente adequado e evite testar credenciais ou dados reais no lugar errado.',
    $$# Ambientes de produção, QA e testes

## Produção

Use [produção]({{link:production}}) somente para operações autorizadas e com credenciais válidas para o ambiente produtivo.

## QA

Use [QA]({{link:qa}}) para validação controlada quando sua integração estiver habilitada nesse ambiente.

## Mock

O [mock]({{link:mock}}) ajuda a explorar a especificação sem executar uma operação de negócio real.

## Regras de segurança

- não reutilize credenciais reais no Swagger ou no mock;
- não coloque tokens em exemplos, logs ou capturas;
- confirme o ambiente antes de enviar qualquer requisição;
- lembre que a presença de uma rota não garante habilitação para todos os clientes.$$,
    'docs/reports/KNOWLEDGE_01_1_INTEGRATIONS_API_AUDIT_2026-07-24.md',
    'knowledge-01.1-environments-v1', 1, timezone('utc', now()),
    array['api','ambientes','produção','QA','mock','testes']
  ),
  (
    v_space_id, v_category_id, 'public', 'published',
    'API Docs, Swagger e referência técnica',
    'api-docs-swagger-e-referencia-tecnica',
    'Saiba quando usar a Central, a API Docs e o Swagger durante uma integração.',
    $$# API Docs, Swagger e referência técnica

## Central de Ajuda

Use a Central para descobrir o que é possível, escolher o recurso, entender pré-requisitos e seguir o fluxo de negócio.

## API Docs

A [API Docs]({{link:api_docs}}) é a referência técnica principal. Use-a para consultar parâmetros, payloads, respostas, modelos, exemplos e a especificação OpenAPI.

## Swagger

O [Swagger]({{link:swagger}}) é uma referência complementar e interativa. Use-o para explorar o contrato técnico e consultar schemas em ambiente autorizado.

:::callout warning
A presença de uma operação no Swagger não significa que ela esteja habilitada ou recomendada para todos os clientes. Operações que aparecem somente no Swagger permanecem fora da trilha pública até validação técnica.
:::

## Especificação

Também é possível baixar a [especificação OpenAPI]({{link:api_docs_spec}}) diretamente da API Docs.$$,
    'docs/reports/KNOWLEDGE_01_1_INTEGRATIONS_API_AUDIT_2026-07-24.md',
    'knowledge-01.1-docs-versus-swagger-v1', 1, timezone('utc', now()),
    array['api','API Docs','Swagger','OpenAPI','referência técnica']
  ),
  (
    v_space_id, v_category_id, 'public', 'published',
    'Erros comuns em integrações',
    'erros-comuns-em-integracoes-api',
    'Confira os primeiros pontos de verificação antes de escalar uma falha de integração.',
    $$# Erros comuns em integrações

## Ambiente incorreto

Confirme se a chamada está indo para produção, QA ou mock conforme o objetivo do teste.

## Credencial ou token inválido

Verifique se as credenciais foram fornecidas pela Genius Returns, se pertencem ao ambiente correto e se o token ainda está válido. Nunca copie o valor do token para um ticket ou captura.

## Processo ou nota não encontrados

Confirme os identificadores enviados e se o recurso pertence ao ambiente e à operação autorizados.

## Contrato divergente

Compare a operação com a [API Docs]({{link:api_docs}}). Se ela aparecer somente no Swagger, não a trate como recomendação pública antes de uma revisão técnica.

## Quando pedir ajuda

Informe ambiente, horário, operação, código HTTP e identificadores sanitizados. Não envie credenciais, tokens, dados pessoais ou payloads reais.$$,
    'docs/reports/KNOWLEDGE_01_1_INTEGRATIONS_API_AUDIT_2026-07-24.md',
    'knowledge-01.1-common-errors-v1', 1, timezone('utc', now()),
    array['api','erros','integração','autenticação','ambiente','processo']
  ),
  (
    v_space_id, v_category_id, 'public', 'published',
    'Como solicitar credenciais ou habilitação',
    'como-solicitar-credenciais-ou-habilitacao',
    'Saiba o que preparar para solicitar acesso ou habilitação de uma integração.',
    $$# Como solicitar credenciais ou habilitação

Solicite credenciais ou habilitação pelos canais autorizados da Genius Returns quando sua operação ainda não tiver acesso à API.

## Inclua no pedido

- nome da empresa e da operação;
- ambiente desejado: produção ou QA;
- cenário de integração: iniciar fluxo, importar solicitação, consultar processo, nota fiscal ou rating;
- sistema responsável pela chamada: e-commerce, ERP ou middleware;
- contato técnico responsável.

## Não inclua

- tokens;
- senhas;
- chaves já existentes;
- dados reais de clientes;
- payloads de produção sem sanitização.

O acesso pode depender do contrato, plano e habilitação técnica. Depois de receber orientação, siga o [guia de autenticação](/help/genius/articles/como-autenticar-uma-integracao) e valide o ambiente correto.$$,
    'docs/reports/KNOWLEDGE_01_1_INTEGRATIONS_API_AUDIT_2026-07-24.md',
    'knowledge-01.1-credentials-v1', 1, timezone('utc', now()),
    array['api','credenciais','habilitação','integração','acesso','QA']
  )
  on conflict (knowledge_space_id, slug) where knowledge_space_id is not null do update
  set
    category_id = excluded.category_id,
    visibility = excluded.visibility,
    status = excluded.status,
    title = excluded.title,
    summary = excluded.summary,
    body_md = excluded.body_md,
    source_path = excluded.source_path,
    source_hash = excluded.source_hash,
    current_revision_number = excluded.current_revision_number,
    published_at = excluded.published_at,
    archived_at = null,
    tags = excluded.tags,
    updated_at = timezone('utc', now());

  update public.knowledge_articles
  set body_md = replace(body_md, '[mock]({{link:mock}})', 'mock')
  where source_hash like 'knowledge-01.1-%';
end;
$migration$;
