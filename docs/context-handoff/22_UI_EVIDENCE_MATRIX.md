# UI Evidence Matrix

Capturas geradas em 2026-07-23 no checkout `C:\Projetos\GSO-old`, commit observado `9aacecf`, usando `http://127.0.0.1:4173` e Supabase local. As rotas autenticadas usaram perfis QA documentados em `docs/LOCAL_QA_AUTH.md`; senhas não são reproduzidas aqui.

## Matriz

| Screenshot | Rota | Módulo | Viewport | Perfil | Estado dos dados | Origem | Finalidade | Observações |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `01-public-help-home-desktop.png` | `/help/genius` | Central pública | 1440x900 | público | artigos publicados locais | Supabase local + Octadesk importado | Home pública Genius | Sem overflow horizontal. |
| `02-public-help-articles-desktop.png` | `/help/genius/articles` | Central pública | 1440x900 | público | artigos publicados locais | Supabase local + Octadesk importado | Listagem pública | Sem overflow horizontal. |
| `03-public-help-home-mobile.png` | `/help/genius` | Central pública | 390x844 | público | artigos publicados locais | Supabase local + Octadesk importado | Mobile da home | Capturada; ready text configurado não bateu por diferença de casing/estrutura mobile. |
| `04-public-help-articles-mobile.png` | `/help/genius/articles` | Central pública | 390x844 | público | artigos publicados locais | Supabase local + Octadesk importado | Mobile da lista | Capturada; ready text configurado não bateu por diferença de casing/estrutura mobile. |
| `05-internal-home-desktop.png` | `/inicio` | Home interna | 1440x900 | `ede.oliveira@confi.com.vc` | fixture/cache local | Supabase local | Cockpit inicial autenticado | Sem overflow horizontal. |
| `06-management-dashboard-desktop.png` | `/admin/analytics` | Dashboard gerencial | 1440x900 | `ede.oliveira@confi.com.vc` | cache HubSpot/OMIE local | Supabase local + caches | Visão executiva e abas | Sem overflow horizontal. |
| `07-management-dashboard-medium.png` | `/admin/analytics` | Dashboard gerencial | 1024x768 | `ede.oliveira@confi.com.vc` | cache HubSpot/OMIE local | Supabase local + caches | Responsividade intermediária | Sem overflow horizontal. |
| `08-support-queue-desktop.png` | `/support/queue` | Suporte | 1440x900 | `ede.oliveira@confi.com.vc` | fixture local | Supabase local | Fila operacional | Sem overflow horizontal. |
| `09-support-tickets-list-desktop.png` | `/support/tickets` | Suporte | 1440x900 | `ede.oliveira@confi.com.vc` | fixture local | Supabase local | Lista de tickets | Sem overflow horizontal. |
| `10-support-inbox-desktop.png` | `/support/inbox` | Atendimento | 1440x900 | `ede.oliveira@confi.com.vc` | fixture local | Supabase local | Inbox/conversa | Sem overflow horizontal. |
| `11-support-customers-b2b-desktop.png` | `/support/clientes` | Clientes B2B | 1440x900 | `ede.oliveira@confi.com.vc` | fixture/cache local | Supabase local + HubSpot cache quando disponível | Cockpit/lista B2B | Sem overflow horizontal. |
| `12-cs-portfolio-desktop.png` | `/cs/portfolio` | Carteira CS | 1440x900 | `ede.oliveira@confi.com.vc` | fixture/cache local | Supabase local + dados CS locais | Carteira CS | Sem overflow horizontal. |
| `13-internal-actions-desktop.png` | `/internal-actions` | Acionamentos | 1440x900 | `ede.oliveira@confi.com.vc` | fixture local | Supabase local | Acionamentos entre áreas | Redirecionou para detalhe de acionamento existente. |
| `14-admin-knowledge-desktop.png` | `/admin/knowledge` | Conhecimento admin | 1440x900 | `ede.oliveira@confi.com.vc` | artigos locais | Supabase local + Octadesk importado | Administração editorial | Sem overflow horizontal. |
| `15-admin-knowledge-editor-desktop.png` | `/admin/knowledge/new` | Editor de conhecimento | 1440x900 | `ede.oliveira@confi.com.vc` | estado inicial | Supabase local | Editor de artigo | Sem overflow horizontal. |
| `16-admin-settings-integrations-desktop.png` | `/admin/settings` | Configurações | 1440x900 | `ede.oliveira@confi.com.vc` | config local | Supabase local | Integrações/configurações | Capturada com 2 respostas 403 registradas no console; precisa investigação no próximo gate, sem corrigir agora. |
| `17-admin-access-desktop.png` | `/admin/access` | Acessos | 1440x900 | `ede.oliveira@confi.com.vc` | fixture local | Supabase local | Administração de acessos | Substitui a captura V1 incorreta que mostrava login. |
| `18-admin-tenants-b2b-desktop.png` | `/admin/tenants` | Contas B2B admin | 1440x900 | `ede.oliveira@confi.com.vc` | fixture/cache local | Supabase local | Administração de contas B2B | Sem overflow horizontal. |
| `19-customer-portal-desktop.png` | `/portal` | Portal do cliente | 1440x900 | `marina.ops@support-qa-a.local` | fixture local | Supabase local | Portal autenticado | Sem overflow horizontal. |
| `20-customer-portal-help-desktop.png` | `/portal/help` | Portal do cliente | 1440x900 | `marina.ops@support-qa-a.local` | fixture local | Supabase local | Ajuda autenticada | Capturada; ready text não encontrou “Ajuda”, mas a rota abriu. |
| `21-public-help-not-found-desktop.png` | `/help/genius/articles/artigo-inexistente-context-pack-v2` | Central pública | 1440x900 | público | erro controlado | rota pública inválida controlada | Estado de artigo inexistente | Cobre erro/not-found da Central. |
| `22-dashboard-empty-period-desktop.png` | `/admin/analytics?from=2099-01-01&to=2099-01-31` | Dashboard gerencial | 1440x900 | `ede.oliveira@confi.com.vc` | filtro futuro | Supabase local + caches | Recorte sem dados/futuro | Sem overflow horizontal. |
| `23-public-help-article-desktop.png` | rota de artigo público capturada no smoke anterior | Central pública | 1440x900 | público | artigo publicado local | Supabase local + Octadesk importado | Página de artigo real | Evidência reaproveitada do smoke autenticado recente. |

## Estados não totalmente cobertos

- Loading real de Dashboard/Central não foi isolado em screenshot estático confiável neste lote.
- Estado vazio do Dashboard foi aproximado por filtro futuro; se a tela ainda mostra dados agregados, isso deve ser tratado no próximo gate de UX/contrato.
- Detalhe específico de ticket não foi capturado separadamente neste lote; a lista e inbox foram capturados. Deve ser complementado no próximo macro-lote se a direção exigir auditoria profunda de suporte.

## Resultado técnico da captura

- 22 capturas novas executadas pelo helper local.
- 0 falhas de captura.
- 0 overflows horizontais detectados pelo script.
- 1 tela com erros HTTP 403 em console: `16-admin-settings-integrations-desktop.png`.
