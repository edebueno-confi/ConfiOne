# P3 AI-Native Operational Readiness Foundation

Data: 2026-05-24
Branch: `codex/p3-ai-native-operational-readiness-foundation`

## Sumario executivo
O P3 preparou a fundacao AI-native, human-governed do Genius Support OS sem integrar IA real. Foram criados contratos para catalogar fontes permitidas/restritas, bloquear acoes automaticas, validar acesso por tenant/papel/fonte e registrar ledger de uso/revisao humana. Nenhum LLM, provider, segredo, chatbot, embedding, vector database, job ou automacao foi criado.

## Auditoria inicial resumida
- Support ja possui tickets, timeline, mensagens, notas internas, evidencias, origem/canal/delivery e Knowledge links por read models/RPCs.
- Customer Account ja possui contexto operacional governado por views/RPCs.
- Knowledge ja separa public/internal/restricted, status editorial, public path seguro, assets privados e entitlements.
- Portal ja filtra timeline customer-facing, tickets, evidencias e Knowledge autorizada.
- Engineering e Internal Actions ja possuem boundaries próprios e nao conversam diretamente com cliente.
- Admin/System ja possui audit e readiness de canais, mas nao havia matriz AI-readable nem ledger humano.

## Decisoes tecnicas
- Criar contrato backend minimo, porque a fase exige governanca auditable futura e nao apenas documento.
- Nao criar UI de Copilot/readiness ativa para evitar botao fake ou promessa de IA real.
- Registrar policies e ledger sem armazenar prompt, output, provider ou modelo.
- Reaproveitar helpers existentes: `require_active_actor`, `has_global_role`, `has_any_global_role`, `can_access_support_workspace`, `can_access_engineering_workspace`, `can_access_internal_action_area`, `contains_secret_like_text` e `audit.capture_row_change`.

## Modelo criado
Tabelas:
- `ai_context_source_policies`
- `ai_action_policies`
- `ai_usage_audit_events`

Views:
- `vw_ai_context_source_policies`
- `vw_ai_action_policies`
- `vw_ai_operational_context_readiness`
- `vw_ai_support_ticket_context_readiness`
- `vw_ai_customer_account_context_readiness`
- `vw_ai_knowledge_context_readiness`
- `vw_ai_usage_audit_events`

RPCs:
- `rpc_ai_validate_context_access`
- `rpc_ai_log_usage_event`
- `rpc_ai_register_human_review_decision`

## Fontes
- Permitidas/restritas: support ticket, ticket timeline, customer account, Knowledge publica/interna/restrita, engineering work item, internal action, documentation, audit summary sanitizado.
- Futuras: customer portal ticket assistivo.
- Proibidas: storage path bruto, segredo/token/API key, audit bruto, payload provider, internal/restricted sem entitlement, nota interna como resposta customer-facing.

## Acoes
Permitidas apenas como sugestao:
- resumir ticket;
- sugerir resposta/artigo/categoria/prioridade;
- detectar lacuna documental;
- resumir cliente;
- apontar risco;
- rascunhar nota interna/artigo.

Proibidas:
- auto send;
- auto publish;
- auto close/change status;
- auto delivery/provider;
- auto expose internal;
- alterar entitlement/RLS;
- criar internal action/engineering work item;
- ler storage path ou segredo.

## Boundaries confirmados
- IA nunca e source of truth.
- IA nao escreve direto no banco.
- IA nao altera `ticket.status`.
- IA nao envia mensagem ao cliente.
- IA nao publica Knowledge.
- IA nao cria engineering/internal action.
- IA nao cria provider delivery.
- Portal nao recebe readiness de IA, policy interna, provider/modelo, prompt/output ou ledger.
- Customer-facing exige source permitida, entitlement quando aplicavel, citacao e revisao humana.

## QA
Cobertura pgTAP:
- `supabase/tests/044_ai_native_operational_readiness.sql`
- `supabase/tests/004_phase1_2_function_audit.sql` atualizado para 107 RPCs controladas.

Cenarios cobertos:
- catalogo de 11 fontes;
- 12 automacoes proibidas;
- admin ve readiness preparada/nao ativa;
- suporte valida fonte de ticket apenas com revisao humana;
- Knowledge interna bloqueada para destino customer-facing;
- portal assistivo permanece future;
- ledger nao armazena provider/modelo/prompt/output;
- metadata/review note com segredo bloqueados;
- customer_user nao ve policies nem ledger interno.

## Usuários QA
Fixture funcional nao foi alterada nesta fase. Credenciais esperadas para QA manual permanecem:
- `qa.local.platform-admin@genius.local` / `LOCAL_QA_ADMIN_PASSWORD`
- `qa.local.support-manager-a@genius.local` / `LOCAL_QA_SUPPORT_MANAGER_PASSWORD`
- `qa.local.support-agent-a@genius.local` / `LOCAL_QA_SUPPORT_AGENT_PASSWORD`
- `qa.local.engineering-member-a@genius.local` / `LOCAL_QA_ENGINEERING_PASSWORD`
- `qa.local.internal-area-member@genius.local` / `LOCAL_QA_INTERNAL_AREA_MEMBER_PASSWORD`
- `marina.ops@support-qa-a.local` / `LOCAL_QA_CLIENT_PASSWORD`
- `gestao.portal@support-qa-a.local` / `LOCAL_QA_CUSTOMER_MANAGER_PASSWORD`

## Validacoes registradas
- `supabase db reset --local`
- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`
- `npm run supabase:lint:db`
- `npm run supabase:test:db`

Resultado:
- migrations aplicam limpo;
- contracts/web/build passaram;
- lint DB sem erros;
- pgTAP passou com `47` arquivos e `979` testes.

Fixture:
- `npm run supabase:qa:local-functional-fixture` foi tentado duas vezes apos reset local;
- ambas as execucoes travaram sem output no script filho `supabase/qa/create-local-support-fixture.mjs`;
- Edge Runtime local respondeu `200` em `/functions/v1/_internal/health`, entao o bloqueio ficou no fluxo interno da fixture, nao no contrato P3;
- a fixture nao foi alterada neste lote.

## Riscos restantes
- IA real ainda exige provider/modelo aprovado, prompt evaluation, redaction testada, rate limits, custo, monitoramento, opt-in, kill switch e politica de retencao.
- UI de readiness AI-native nao foi criada; decisão deliberada para evitar placeholder visual/falso Copilot.
- Prefixo visual `IA-` em Internal Actions pode ser confundido com inteligencia artificial em pt-BR; tratar em fase visual/nomenclatura futura sem alterar contrato.

## Proxima fase recomendada
`P3-B AI Readiness Admin Visibility`: expor em `/admin/system` uma leitura compacta e honesta de `vw_ai_operational_context_readiness` e policies, sem botao de IA real, sem provider e sem configuracao de segredo.
