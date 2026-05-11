# Customer Portal Session Expiry And Recovery Semantics V3

## Objetivo
Formalizar a expiração, recuperação e retomada segura de sessão no Portal Cliente B2B, mantendo `active_tenant_id` backend-governed e impedindo que dados antigos continuem parecendo válidos depois de logout, revogação de acesso, perda de tenant ou falha temporária de rede.

## Estados oficiais do provider
- `initializing`
- `ready`
- `stale_context`
- `session_expired`
- `access_revoked`
- `tenant_unavailable`
- `network_retryable`
- `fatal_error`

## Semântica final
- `stale_context`: outra aba mudou o tenant ativo no backend; a aba atual limpa o contexto aceito e exige refresh explícito.
- `session_expired`: a sessão customer-facing deixou de ser válida; o portal limpa o contexto renderizado e exige novo login.
- `access_revoked`: o ator continua autenticado, mas perdeu o vínculo customer-facing válido ou deixou de atender o gate operacional.
- `tenant_unavailable`: não existe tenant ativo elegível para o portal, incluindo tenant sem `returns_portal` ou membership customer-facing sem escopo utilizável.
- `network_retryable`: falha temporária de rede ou fetch; o portal não mascara o erro e oferece retry explícito.
- `fatal_error`: falha contratual ou operacional não recuperável na validação do contexto.

## Contrato backend reaproveitado
- `vw_customer_portal_auth_context`
- `vw_customer_portal_available_tenants`
- `vw_customer_portal_active_tenant_context`
- `rpc_customer_set_active_tenant`

## Contrato novo
- `rpc_customer_get_portal_session_status()`

### Payload final
- `session_state`
- `reason_code`
- `reason_message`
- `active_tenant_id`
- `active_tenant_name`
- `available_tenant_count`
- `context_version`

## Regras de recuperação
- sessão expirada não mantém tickets, artigos ou contexto antigo como válidos;
- `access_revoked` e `tenant_unavailable` não entram em refetch infinito;
- `network_retryable` permite nova tentativa explícita;
- `fatal_error` mantém estado honesto e não inventa fallback;
- mutações customer-facing não executam fora de `ready`.

## Ações bloqueadas fora de `ready`
- criar ticket
- responder ticket
- marcar leitura
- confirmar resolução
- solicitar reabertura
- upload de evidência
- download de evidência
- busca autenticada de Knowledge

## Frontend
- `customer-portal-context.tsx` passou a distinguir erro de rede, sessão expirada e revogação real de acesso.
- `CustomerPortalPage.tsx` agora renderiza estados dedicados para:
  - sessão expirada
  - acesso revogado
  - tenant indisponível
  - erro temporário de rede
  - erro fatal
- o shell continua visível, mas o conteúdo operacional deixa de renderizar dados antigos quando o contexto não está pronto.

## Validação do lote
- browser real com customer válido
- reload após sessão válida
- logout e reutilização de aba antiga
- retorno ao portal após novo login
- customer sem tenant válido
- regressão em `/admin/customer-portal`
- regressão em `/admin/access`

## Riscos restantes
- a distinção visual entre logout explícito e expiração passiva do refresh token depende do evento real retornado por Supabase Auth no browser;
- não há modo offline nem sync em tempo real entre abas;
- a semântica de sessão expirada/offline prolongado em múltiplas abas continua dependente do mesmo boundary backend-governed, sem canal separado de sincronização.
