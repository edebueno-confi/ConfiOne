# Pilot Dry Run Evidence - 2026-05-24

Branch: `codex/p4-c-controlled-pilot-dry-run`
Base commit: `e5185bd9`
Ambiente: local Windows/PowerShell, Supabase local, Vite local em `http://127.0.0.1:5173`.

Este dry run nao abriu piloto para cliente real, nao executou deploy remoto, nao aplicou `db push` remoto, nao alterou production/staging, nao criou migration, nao criou feature, nao criou segredo e nao ativou provider externo ou IA real.

## Gates executados

| Comando | Resultado |
| --- | --- |
| `npm run contracts:typecheck` | PASS |
| `npm run web:typecheck` | PASS |
| `npm run web:build` | PASS |
| `npm run supabase:lint:db` | PASS |
| `npm run supabase:test:db` | PASS - 47 arquivos, 979 testes |
| `npm run supabase:qa:local-functional-fixture` | PASS - primeira rodada |
| `npm run supabase:qa:local-functional-fixture` | PASS - segunda rodada idempotente |

Observacao: o Supabase CLI informou apenas aviso de versao mais nova disponivel. A fixture ainda emite o warning Node `DEP0190` herdado do child process com `shell: true`; nao bloqueou o gate e nao indicou falha funcional.

## Usuarios QA usados

| Papel | Email | Senha | Resultado |
| --- | --- | --- | --- |
| `platform_admin` | `qa.local.platform-admin@genius.local` | `Local-QA-Admin-2026!` | Admin console acessivel; `/admin/system` validado |
| `support_manager` | `qa.local.support-manager-a@genius.local` | `Local-QA-Manager-A-2026!` | `/support/queue` e ticket workspace validado |
| `support_agent` | `qa.local.support-agent-a@genius.local` | `Local-QA-Agent-A-2026!` | landing em `/support/queue` validada |
| `internal_area_member` | `qa.local.internal-area-member@genius.local` | `Local-QA-Internal-Area-2026!` | fila/detalhe de acionamento interno validado |
| `internal_area_empty` | `qa.local.internal-area-empty@genius.local` | `Local-QA-Internal-Empty-2026!` | empty state honesto validado |
| `internal_area_non_member` | `qa.local.internal-area-non-member@genius.local` | `Local-QA-Internal-NoArea-2026!` | bloqueio em `/access-denied` validado |
| `engineering_member` | `qa.local.engineering-member-a@genius.local` | `Local-QA-Engineering-A-2026!` | `/engineering` e work item validado |
| `customer_user` | `marina.ops@support-qa-a.local` | `Local-QA-Customer-A-2026!` | Portal e ticket customer-facing validados |
| `customer_manager` | `gestao.portal@support-qa-a.local` | `Local-QA-Customer-Manager-A-2026!` | Portal manager validado |
| `public_anon` | N/A | N/A | Public Help validado sem login |

## IDs uteis

| Tipo | ID / slug |
| --- | --- |
| Tenant QA A | `c12185f7-cc66-4731-b1e5-aa81023ef1a8` |
| Ticket principal | `b86df683-9756-4047-b954-350e02063aa2` |
| Internal action retornada | `cdf38392-0505-49d5-a7ca-973643c65163` |
| Internal action aberta | `a8ff272d-5fd2-47fc-85d6-ad632c9fcbec` |
| Engineering work item | `46a2a89f-0788-46a0-a5de-8b2a6158e4fb` |
| Public article | `como-compartilhar-evidencias-em-um-ticket` |

## Rotas testadas

| Rota | Papel | Evidencia textual |
| --- | --- | --- |
| `/admin/system` | `platform_admin` | Release/channel readiness e AI-native readiness visiveis; sem campo de segredo ou botao de ativacao de IA |
| `/support/queue` | `support_manager`, `support_agent` | Fila operacional carregou com dados reais da fixture |
| `/support/tickets/b86df683-9756-4047-b954-350e02063aa2` | `support_manager` | Ticket carregou, composer real funcionou, Knowledge e Acionamentos abriram |
| `/portal` | `customer_user`, `customer_manager` | Portal carregou contexto customer-facing sem readiness interna |
| `/portal/tickets/b86df683-9756-4047-b954-350e02063aa2` | `customer_user` | Resposta publica apareceu; nota interna nao apareceu |
| `/portal/help` | `customer_user` | Knowledge autorizada por tenant apareceu sem conteudo interno bruto |
| `/internal-actions` | `internal_area_member`, `internal_area_empty`, `internal_area_non_member` | Area com itens, area vazia e non-member bloqueado validados |
| `/engineering` | `engineering_member` | Fila tecnica carregou |
| `/engineering/work-items/46a2a89f-0788-46a0-a5de-8b2a6158e4fb` | `engineering_member` | Work item tecnico carregou sem virar conversa com cliente |
| `/help/genius` | `public_anon` | Public Help carregou somente conteudo published/public |
| `/help/genius/articles` | `public_anon` | Lista publica carregou sem restritos/internos |
| `/help/genius/articles/como-compartilhar-evidencias-em-um-ticket` | `public_anon` | Artigo publico carregou sem storage path/bucket |

## Fluxos validados

1. Admin abriu `/admin/system` e validou readiness de release, canais e AI-native readiness.
2. Support abriu `/support/queue` e acessou o ticket principal.
3. Support enviou resposta publica real via Portal no ticket `b86df683-9756-4047-b954-350e02063aa2`.
4. Support criou nota interna real no mesmo ticket.
5. Portal exibiu a resposta publica criada no dry run.
6. Portal nao exibiu a nota interna criada no dry run.
7. Support abriu Knowledge no ticket e visualizou artigos publicos/sugeridos e vinculos governados.
8. Knowledge internal/restricted permaneceu separado como referencia interna e nao virou envio indiscriminado ao cliente.
9. Portal Help exibiu apenas artigos autorizados ao cliente autenticado.
10. Public Help exibiu apenas artigos published/public.
11. Evidence apareceu sanitizada; Portal/Public Help nao expuseram bucket, storage path ou audit bruto.
12. Internal Actions exibiu fila, detalhe, retorno da area e empty state honesto.
13. `internal_area_non_member` caiu em `/access-denied` e nao viu fila nem empty state enganoso.
14. Engineering exibiu fila e work item sem conversa direta com cliente.
15. Auth por papel direcionou para areas operacionais corretas ou bloqueio real.
16. AI-native readiness apareceu apenas no Admin; Support e Portal nao exibiram Copilot, geracao de resposta ou readiness interna.

## Boundaries confirmados

- Portal nao viu nota interna.
- Portal nao viu Internal Actions.
- Portal nao viu Engineering internals.
- Portal nao viu audit bruto.
- Portal nao viu storage path/bucket.
- Portal nao viu provider/readiness interno.
- Portal nao viu AI readiness.
- Public Help mostrou apenas conteudo published/public.
- Support nao simulou provider externo.
- IA nao executou acao.
- Nenhum segredo/token/API key foi criado.
- Nenhum dado real ou CSV real foi usado.
- Nenhum deploy remoto ou `db push` remoto foi executado.

## Console e visual

- Viewport usado no smoke browser: `1440x900`.
- Nao foi observado scroll horizontal global nas rotas inspecionadas por browser.
- Console: houve um 403 em `auth/v1/logout?scope=global` durante troca manual de sessoes limpando storage; classificado como nao bloqueante para o dry run porque nao ocorreu como erro de fluxo funcional final.
- Ponto de atencao visual/copy: Public Help possui CTA legado `Genius Avatar AI` / `Conversar com o Avatar`, direcionando para artigo publico. Nao ha IA real, provider, segredo ou chatbot ativo. Recomenda-se revisar copy antes de abrir para cliente real.

## Decisao

GO para piloto controlado local/staging, condicionado a repetir estes gates no ambiente alvo antes de qualquer exposicao externa.

Nao ha GO para cliente real/producao nesta fase, porque nao houve deploy remoto, nao houve revisao humana final de operacao real e a copy publica de Avatar AI deve ser revisada antes de comunicacao externa ampla.
