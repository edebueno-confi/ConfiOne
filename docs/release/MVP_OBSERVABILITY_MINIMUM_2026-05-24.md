# MVP Observability Minimum - 2026-05-24

## Objetivo

Definir a observabilidade minima aceitavel para piloto controlado do MVP sem integrar ferramentas externas.

Nao ha Sentry, Logflare, Vercel, provider externo, webhook, job externo ou observabilidade automatizada nova nesta fase.

## Sinais existentes

### Banco e auditoria

- `audit.audit_logs` para mutacoes relevantes.
- `ticket_events` para historico operacional do ticket.
- `ticket_message_deliveries` para disponibilidade customer-facing no Portal.
- `ai_usage_audit_events` preparado para uso futuro de IA, sem prompt/output/provider.
- Events especificos de Internal Actions e Engineering por read models e ledgers proprios.

### Admin

- `/admin/system` mostra readiness sanitizado de sistema, canais e AI-native.
- `vw_admin_system_audit_events` evita audit bruto na UI.
- `vw_admin_communication_channel_readiness` mostra Portal ativo e externos futuros/bloqueados.
- `vw_ai_operational_context_readiness` mostra IA preparada para governanca, nao ativa.

### Frontend

- Estados de loading/vazio/erro existem nas rotas MVP principais.
- Browser console deve ser revisado manualmente no smoke.
- Erro tecnico cru em rota critica e bloqueador de release.

### Supabase local/staging

- Logs de Auth, REST, Edge Functions e Storage devem ser revisados quando houver falha.
- Fixture funcional imprime etapas, IDs e credenciais locais.
- Scripts P3-B possuem timeouts para evitar espera infinita sem diagnostico.

## O que monitorar manualmente no piloto

- Falhas de login por papel.
- Erros 4xx/5xx em rotas privadas.
- Ticket criado no Portal que nao aparece na fila.
- Resposta publica que nao aparece no Portal.
- Nota interna aparecendo no Portal.
- Download de evidencia falhando ou expondo path.
- Internal Action criada sem aparecer para area.
- Retorno de engenharia sem aparecer no suporte.
- Public Help exibindo artigo nao publicado/publico.
- Admin System mostrando provider externo ativo indevidamente.
- Qualquer UI sugerindo IA ativa, provider real ou envio externo.

## Indicadores manuais por dominio

| Dominio | Sinal minimo | Onde olhar |
| --- | --- | --- |
| Auth | login por papel e redirect correto | browser + Supabase Auth logs |
| Ticket | criacao, resposta, nota e evento | Support/Portal + `ticket_events` |
| Portal | timeline customer-facing sem interno | `/portal/tickets/:ticketId` |
| Evidence | grant curto e metadata sanitizada | Portal/Support + Edge Function logs |
| Knowledge | artigo public/published apenas | Public Help + Admin Knowledge |
| Delivery | `customer_portal` registrado | timeline Support + delivery views |
| Internal Actions | fila por membership e retorno | `/internal-actions` + Support |
| Engineering | update/retorno estruturado | `/engineering` + Support |
| Customer Account | contexto interno sem vazamento | Support/Admin vs Portal |
| AI Readiness | governanca visivel apenas no Admin | `/admin/system` |

## Backlog futuro de observabilidade real

- Painel de incidentes do piloto.
- Alertas para falha de Auth/REST/Edge Function.
- Auditoria agregada por tenant.
- Exportacao segura de audit summary.
- Monitoramento de storage grants expirados/falhos.
- Metricas de fila e atendimento com contrato backend.
- Sentry ou equivalente, somente com sanitizacao e decisao explicita.
- Health endpoint de readiness operacional por ambiente.

## Bloqueadores

- Falha sem logs ou sem etapa identificavel.
- Erro bruto recorrente na UI.
- Vazamento customer-facing.
- Provider externo ou IA aparecendo como ativo.
- Audit trail ausente em mutacao relevante.
- Storage path/bucket exposto fora de contrato interno.
