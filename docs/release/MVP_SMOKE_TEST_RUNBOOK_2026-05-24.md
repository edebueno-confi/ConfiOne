# MVP Smoke Test Runbook - 2026-05-24

## Objetivo

Runbook manual minimo para validar o MVP antes de abrir piloto controlado.

Nao criar dados reais. Nao usar CSV. Nao testar provider externo. Nao ativar IA real.

## Preparacao

1. Confirmar branch correta.
2. Confirmar `git status --short` limpo.
3. Rodar `npm run supabase:qa:local-functional-fixture`.
4. Guardar os IDs impressos pela fixture.
5. Abrir o app local.
6. Usar viewport desktop `1440x900` como smoke minimo.

## Credenciais

- Admin: `qa.local.platform-admin@genius.local` / `LOCAL_QA_ADMIN_PASSWORD`
- Suporte gerente: `qa.local.support-manager-a@genius.local` / `LOCAL_QA_SUPPORT_MANAGER_PASSWORD`
- Suporte agente: `qa.local.support-agent-a@genius.local` / `LOCAL_QA_SUPPORT_AGENT_PASSWORD`
- Area interna com itens: `qa.local.internal-area-member@genius.local` / `LOCAL_QA_INTERNAL_AREA_MEMBER_PASSWORD`
- Area interna vazia: `qa.local.internal-area-empty@genius.local` / `LOCAL_QA_INTERNAL_AREA_EMPTY_PASSWORD`
- Usuario sem area: `qa.local.internal-area-non-member@genius.local` / `LOCAL_QA_INTERNAL_AREA_NON_MEMBER_PASSWORD`
- Engenharia: `qa.local.engineering-member-a@genius.local` / `LOCAL_QA_ENGINEERING_PASSWORD`
- Cliente: `marina.ops@support-qa-a.local` / `LOCAL_QA_CLIENT_PASSWORD`
- Gestor cliente: `gestao.portal@support-qa-a.local` / `LOCAL_QA_CUSTOMER_MANAGER_PASSWORD`

## Passo a passo

### 1. Admin

1. Login como platform admin.
2. Abrir `/admin/system`.
3. Confirmar readiness de canais: Portal ativo; externos futuros/bloqueados.
4. Confirmar AI-native readiness: preparada para governanca, nao ativa.
5. Confirmar ausencia de botao "Ativar IA", API key, token ou provider.
6. Abrir `/admin/tenants`.
7. Confirmar cliente B2B e Conta B2B.

### 2. Portal cria ticket

1. Logout.
2. Login como `customer_user`.
3. Abrir `/portal`.
4. Abrir `/portal/tickets`.
5. Criar ticket sanitizado ou usar ticket atual da fixture.
6. Abrir `/portal/tickets/:ticketId`.
7. Confirmar que nao ha nota interna, engenharia, internal actions, readiness ou termos tecnicos.

### 3. Support responde

1. Logout.
2. Login como `support_manager`.
3. Abrir `/support/queue`.
4. Localizar o ticket do Portal.
5. Abrir `/support/tickets/:ticketId`.
6. Enviar resposta publica via Portal.
7. Adicionar nota interna.
8. Confirmar que a timeline de suporte diferencia resposta publica de nota interna.
9. Confirmar que canais externos aparecem bloqueados quando presentes.

### 4. Portal valida resposta

1. Logout.
2. Login como `customer_user`.
3. Abrir o mesmo ticket.
4. Confirmar que a resposta publica aparece.
5. Confirmar que a nota interna nao aparece.
6. Confirmar que provider/readiness/AI readiness nao aparecem.

### 5. Knowledge

1. Login como `support_manager`.
2. Abrir o ticket.
3. Vincular artigo publico publicado quando houver candidato.
4. Confirmar que artigo internal/restricted nao fica disponivel para envio customer-facing.
5. Abrir `/help/genius`.
6. Abrir `/help/genius/articles/:articleSlug`.
7. Confirmar que Public Help so mostra artigo published/public.

### 6. Evidence

1. Abrir ticket com evidencia da fixture.
2. Confirmar que Support ve metadata de evidencia.
3. Abrir o ticket no Portal.
4. Confirmar que Portal ve metadata sanitizada.
5. Confirmar que Portal nao ve bucket, path ou URL permanente.

### 7. Internal Actions

1. Login como `support_manager`.
2. Abrir ticket.
3. Criar acionamento interno.
4. Login como `internal_area_member`.
5. Abrir `/internal-actions`.
6. Abrir `/internal-actions/:actionId`.
7. Devolver retorno ao suporte.
8. Confirmar que ticket status nao mudou automaticamente.
9. Confirmar no Portal que o cliente nao ve acionamento.

### 8. Internal empty/non-member

1. Login como `internal_area_empty`.
2. Abrir `/internal-actions`.
3. Confirmar empty state honesto.
4. Login como `internal_area_non_member`.
5. Tentar `/internal-actions`.
6. Confirmar `/access-denied` ou estado claro de sem permissao, sem fila ou empty state enganoso.

### 9. Engineering

1. Login como `support_manager`.
2. Abrir ticket.
3. Criar work item de engenharia se o contrato permitir.
4. Login como `engineering_member`.
5. Abrir `/engineering`.
6. Abrir `/engineering/work-items/:workItemId`.
7. Registrar update e retorno ao suporte.
8. Confirmar que Support ve retorno.
9. Confirmar que Portal nao ve engenharia interna.

### 10. Encerramento do smoke

1. Revisar console do browser.
2. Confirmar ausencia de scroll horizontal nas rotas operacionais.
3. Confirmar boundaries customer-facing.
4. Registrar IDs usados.
5. Registrar PASS/FAIL e bloqueadores.

## Resultado esperado

Smoke aprovado quando:

- todos os papeis entram na rota esperada;
- fluxo Portal -> Support -> Portal funciona;
- nota interna nao vaza;
- Knowledge publico seguro funciona;
- Internal Actions e Engineering retornam ao suporte sem conversar direto com cliente;
- AI readiness aparece apenas no Admin;
- provider externo e IA real continuam inativos;
- nenhum dado real, secret ou path sensivel aparece.
