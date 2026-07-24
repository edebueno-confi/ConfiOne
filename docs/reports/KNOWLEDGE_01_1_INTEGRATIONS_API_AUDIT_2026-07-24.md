# KNOWLEDGE-01.1 — Auditoria do Hub de Integrações e API

Data da auditoria: 2026-07-24
Checkout: `C:\Projetos\GSO-old`
Escopo: Central pública do espaço `genius`; nenhuma chamada de negócio, credencial, secret, deploy ou alteração remota foi executada.

## Fontes auditadas

### API Docs — fonte técnica principal

- Interface: <https://apidocs.geniusreturns.com.br/openapi>
- Especificação baixada: <https://apidocs.geniusreturns.com.br/_spec/openapi.json?download=>
- OpenAPI: `3.0.3`
- Versão: `1.0.0`
- Servidores declarados: produção e QA
- Tags: Segurança, Processos, Notas de devolução e Produtos
- Operações: `11`
- Schemas: `68`
- Autenticação: `GeniusKey` + `GeniusToken` para obtenção de JWT; operações protegidas usam Bearer.

### Swagger — fonte complementar/interativa

- Produção: <https://integration.geniusreturns.com.br/swagger/index.html>
- Especificação carregada: <https://integration.geniusreturns.com.br/swagger/v1/swagger.json>
- QA: <https://integration-qa.geniusreturns.com.br/swagger/index.html>
- Especificação QA: <https://integration-qa.geniusreturns.com.br/swagger/v1/swagger.json>
- OpenAPI: `3.0.1`
- Versão: `1.0`
- Operações: `35` em produção e `17` em QA
- Schemas: `175` em produção e `151` em QA
- Observação: as operações Swagger não declaram `security` de forma confiável; isso impediu promovê-las automaticamente como referência pública.

## Matriz comparativa das operações do API Docs

| Domínio | Operação | Método | Endpoint | API Docs | Swagger | Divergência | Cenário de negócio | Exposição |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Segurança | Autenticar | POST | `/v1/pvt/seguranca/autenticar` | sim | sim | Swagger sem segurança declarada | Obter JWT para chamadas protegidas | `restricted` + guia público |
| Processos | Integrar pedido ao fluxo | POST | `/v3/pvt/processo/integrar/fluxo` | sim | sim | Swagger sem segurança declarada | Iniciar solicitação pelo e-commerce | `public_business_guide` + `public_technical_reference` |
| Processos | Importar solicitação | POST | `/v1/pvt/processo/enviar-solicitacao` | sim | sim | Swagger sem segurança declarada | Importar solicitação criada em ERP/middleware | `public_business_guide` + `public_technical_reference` |
| Processos | Obter processo por ID | GET | `/v3/pvt/processo/{id-processo}` | sim | sim, como `{id}` | Parâmetro de rota divergente | Consultar uma troca ou devolução | `public_business_guide` + `restricted` |
| Processos | Listar processos | GET | `/v3/pvt/processo` | sim | sim | Descrição mais pobre no Swagger | Listar e filtrar processos | `public_business_guide` + `restricted` |
| Notas | Adicionar nota | POST | `/v3/pvt/Fiscal/{processoId}` | sim | sim | Capitalização e segurança divergentes | Vincular nota ao processo | `public_business_guide` + `restricted` |
| Notas | Atualizar nota | PUT | `/v3/pvt/Fiscal/{processoId}/{notaFiscalId}` | sim | sim | Capitalização e segurança divergentes | Atualizar nota | `restricted` |
| Notas | Inativar nota | PATCH | `/v3/pvt/Fiscal/{processoId}/{notaFiscalId}` | sim | sim, `/fiscal` minúsculo | Capitalização e segurança divergentes | Inativar sem apagar histórico | `restricted` |
| Notas | Listar notas | GET | `/v3/pvt/fiscal` | sim | sim | Descrição e segurança divergentes | Listar notas de um processo | `public_business_guide` + `restricted` |
| Notas | Obter nota por ID | GET | `/v3/pvt/fiscal/{id}` | sim | sim | Descrição e segurança divergentes | Consultar uma nota | `restricted` |
| Produtos | Informar rating | POST | `/v3/pvt/Produto/rating` | sim | não confirmado no Swagger atual | API Docs é a única fonte atual | Registrar avaliação de produto | `public_business_guide` + `restricted` |

Links específicos das operações foram gerados a partir das rotas do API Docs e validados com HTTP 200, incluindo autenticação, fluxo, importação, processos, notas e rating.

## Operações somente no Swagger

As operações abaixo foram observadas em produção, mas não foram promovidas para a Central. A classificação é `internal_review` ou `legacy` até confirmação técnica e editorial:

- `/v1/pvt/processo/obter-por-id`
- `/v1/pvt/processo/obter-por-valecompra`
- `/v1/pvt/produto/obter-rating-produto`
- `/v2/pvt/ecommerce/pedido/{orderNumber}/{geniusVirtualStoreId}`
- `/v2/pvt/processo/{id}`
- `/v2/pvt/processo/listar`
- `/v2/pvt/processo/queue/listar`
- `/v1/pvt/fiscal/informar-nota-fiscal-devolucao`
- `/v1/pvt/processo/carregar-processos`
- `/v1/pvt/processo/informar-nps`
- `/v1/pvt/processo/infracommerce/solicitar-devolucao`
- `/v1/pvt/processo/solicitar-devolucao`
- `/v1/pvt/produto/informar-produto-enviado`
- `/v1/pvt/produto/informar-produtos-enviados`
- `/v1/pvt/produto/informar-rating-produto`
- `/v1/pvt/produto/informar-recebimento`
- `/v2/pvt/fiscal/nfd/arquivo/informar/{processoId}`
- `/v2/pvt/fiscal/nfd/informar`
- `/v2/pvt/processo/listar`
- `/v2/pvt/processo/simplificado/novo`
- `/v2/pvt/produto/rating`
- `/v3/pvt/processo`
- `/v3/pvt/processo/fluxo/iniciar/{orderNumber}/{geniusVirtualStoreId}`
- `/v1/pvt/processo/alterar-status`
- `/v2/pvt/processo/queue/comitar/{id}`

QA possui subconjunto próprio e também apresenta `/v3/pvt/processo` e `/v3/pvt/processo/fluxo/iniciar/{orderNumber}/{geniusVirtualStoreId}` sem correspondência no API Docs. Nenhuma dessas rotas foi usada nos artigos.

## Links externos validados

| Recurso | Resultado |
| --- | --- |
| API Docs | HTTP 200 |
| Especificação OpenAPI | HTTP 200 |
| Swagger produção | HTTP 200 |
| Swagger QA | HTTP 200 |
| Especificações Swagger produção/QA | HTTP 200 |
| Operações específicas no API Docs | HTTP 200 |
| Servidor mock anunciado pelo API Docs | HTTP 404 na URL raiz; não publicado |

## Conteúdo publicado

A categoria pública existente `integracoes` foi consolidada para `Integrações e API`, sem alterar o slug de navegação. Foram criados/consolidados 12 artigos governados, além do checklist público existente:

1. Integrações e API do Genius Returns
2. Qual recurso de integração devo usar?
3. Como autenticar uma integração
4. Como iniciar uma troca ou devolução pelo e-commerce
5. Como importar uma solicitação criada em outro sistema
6. Como consultar processos e acompanhar status
7. Como integrar notas fiscais de devolução
8. Como informar avaliações de produtos
9. Ambientes de produção, QA e testes
10. API Docs, Swagger e referência técnica
11. Erros comuns em integrações
12. Como solicitar credenciais ou habilitação

Todos ficaram `published` + `public` no espaço `genius`, sem credenciais, JWTs, dados reais ou endpoints administrativos.

## Implementação técnica

- `apps/web/src/features/help-center/help-center-integrations.ts`: configuração única dos links oficiais e das 11 operações aprovadas.
- `apps/web/src/features/help-center/markdown.tsx`: links tokenizados, links internos via Router e bloco reutilizável `::api-reference`.
- `supabase/migrations/20260724090000_knowledge_integrations_api_hub_v1.sql`: categoria e conteúdo público idempotente.
- `supabase/tests/075_knowledge_integrations_api_hub.sql`: contrato pgTAP de categoria, publicação, segurança, tokenização e blocos técnicos.
- `tests/scripts/knowledge-integrations-api.test.mjs`: teste de conteúdo, segurança e matriz de operações.

## Termos de busca cobertos

API, integração, Swagger, OpenAPI, autenticação, token, Bearer, processo, troca, devolução, pedido, nota fiscal, XML, DANFE, rating, ERP, e-commerce e middleware.

## Limitações e backlog

- A fila histórica de migrations locais possui drift anterior: `20260722221746_internal_profile_screen_access_contract_v1.sql` falha ao substituir uma view removendo colunas (`SQLSTATE 42P16`). A migration deste lote foi executada isoladamente no banco local; não houve reset.
- O mock anunciado pelo API Docs precisa de URL operacional confirmada antes de qualquer publicação futura.
- As operações somente no Swagger exigem revisão técnica e de produto antes de qualquer recomendação pública.
- A criação direta por migration preserva o contrato de leitura público; uma futura revisão editorial pode registrar revisions formais via RPC administrativo, sem mudar o conteúdo agora.
