# Public Copy Safety Review - 2026-05-24

## Objetivo

Revisar rotas publicas e customer-facing para remover promessas falsas de IA, chatbot, Avatar ou envio externo, preservando o MVP real: Central de Ajuda, Portal do Cliente, tickets e suporte via Portal.

## Resultado

A copy publica legada do Public Help que mencionava `Genius Avatar AI`, `Conversar com o Avatar`, `Perguntar ao Avatar`, `Falar com o Avatar` e `Avatar AI` foi removida de forma cirurgica.

## Arquivo ajustado

- `apps/web/src/features/help-center/HelpCenterHomePage.tsx`

## Substituicoes aplicadas

| Antes | Depois |
| --- | --- |
| `Genius Avatar AI` | `Orientacao por artigos` |
| `Perguntar ao Avatar` | `Buscar orientacao` |
| `Conversar com o Avatar` | `Ver guia recomendado` |
| `Usar o Genius Avatar AI` | `Orientacao assistida por conteudo` |
| `Falar com o Avatar` | `Ver guia recomendado` |
| `Busca inteligente e contextual` com `Avatar AI` | `Busca por artigos e contexto` |

## Rotas revisadas

| Rota | Resultado |
| --- | --- |
| `/login` | Sem promessa de IA ativa |
| `/portal` | Sem readiness interno, provider ou IA publica |
| `/portal/tickets/:ticketId` | Sem nota interna, engenharia interna, provider, readiness ou IA publica |
| `/portal/help` | Sem Avatar/IA ativa; Knowledge autorizada permanece governada |
| `/help/genius` | Copy corrigida; sem Avatar/IA ativa |
| `/help/genius/articles` | Sem Avatar/IA ativa |
| `/help/genius/articles/:articleSlug` | Sem Avatar/IA ativa |

## Verificacao textual

Busca em `apps/web/src/features/help-center`, `apps/web/src/features/customer-portal` e `apps/web/src/features/login` nao encontrou:

- `Genius Avatar AI`;
- `Conversar com o Avatar`;
- `Perguntar ao Avatar`;
- `Falar com o Avatar`;
- `Avatar AI`;
- `chatbot`;
- `resposta automatica`;
- `IA ativa`.

As mencoes restantes no repositorio estao em documentos de governanca, riscos historicos ou escopo negativo, nao em UI publica ativa.

## Impeccable

Foi aplicado como criterio de copy safety e clareza operacional:

- audit: identificar promessa visual/textual maior que a capacidade real;
- critique: remover ambiguidade de IA ativa;
- clarify: trocar Avatar por orientacao baseada em artigos;
- harden: impedir promessa de automacao inexistente;
- polish: preservar fluidez da landing publica;
- distill: reduzir a mensagem para busca, artigos e suporte pelo Portal.

Referencia: https://impeccable.style/docs/

## Boundaries confirmados

- Public Help nao promete IA ativa.
- Portal nao mostra AI readiness interno.
- Portal nao mostra provider, segredo, token, API key, delivery tecnico ou readiness.
- Nenhum botao de chatbot, Avatar, gerar resposta ou ativar IA foi criado.
- Nenhum provider externo foi ativado.
