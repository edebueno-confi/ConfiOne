# DASHBOARD-03 — Controle autenticado de CS / Suporte

## Escopo

Este lote adiciona um controle operacional dedicado dentro da configuração do Dashboard. O controle é renderizado somente para `platform_admin`, usa a sessão Supabase atual e envia ao `hubspot-sync` exclusivamente o escopo `cs`.

O primeiro disparo sem execução CS bem-sucedida envia `{"scope":"cs","full":true}`. Depois de uma execução bem-sucedida, o controle envia somente `{"scope":"cs"}`, permitindo que o runner aplique o watermark incremental existente. Não existe opção visual para forçar nova carga completa.

## Proteções

- A autorização continua sendo validada no Edge Function por JWT e `user_global_roles.role = platform_admin`.
- O frontend não recebe nem envia token do HubSpot, segredo de scheduler ou service role.
- A confirmação informa que a operação consulta somente CS / Suporte e não aciona Comercial ou OMIE.
- O botão é desabilitado durante a execução para impedir clique duplo.
- A resposta expõe somente status, contagens sanitizadas e correlation ID UUID.
- A proteção de concorrência e o watermark continuam no runner existente; não foi criada uma segunda implementação de sincronização.

## Validação

O controle foi coberto por teste focado de modo inicial/incremental, payload, isolamento de escopo, autorização estrutural, correlação e separação de runners. A carga real deve ocorrer somente após o branch ser publicado e o deploy da versão aprovada estar saudável.

## Limites

Este lote não executa OMIE, Comercial, sincronização geral, writes no HubSpot, alteração de secrets, schedules, migrations remotas ou redesign visual.
