# AI_NATIVE_OPERATIONAL_READINESS.md

## Decisao de produto
O Genius Support OS deve ser AI-native, human-governed.

Isso significa que a arquitetura prepara contexto, fonte, permissao, citacao, auditoria e revisao humana antes de qualquer modelo real. Nao significa AI-first, nem automacao sem operador.

## Modelo P3

### Catalogo de fontes
`ai_context_source_policies` define:
- tipo de fonte;
- status (`allowed`, `restricted`, `forbidden`, `future`);
- visibilidade;
- usos permitidos;
- exigencia de tenant;
- exigencia de entitlement;
- citacao;
- redaction;
- destinos permitidos e proibidos.

### Catalogo de acoes
`ai_action_policies` define:
- acoes permitidas apenas como sugestao;
- acoes proibidas;
- revisao humana obrigatoria;
- fontes permitidas;
- destino permitido;
- motivo de bloqueio.

### Ledger
`ai_usage_audit_events` registra uso futuro e revisao humana.

Nesta fase, o ledger proibe:
- `provider_key`;
- `model_key`;
- `prompt_text`;
- `output_text`.

## Read models
- `vw_ai_context_source_policies`
- `vw_ai_action_policies`
- `vw_ai_operational_context_readiness`
- `vw_ai_support_ticket_context_readiness`
- `vw_ai_customer_account_context_readiness`
- `vw_ai_knowledge_context_readiness`
- `vw_ai_usage_audit_events`

## RPCs
- `rpc_ai_validate_context_access`
- `rpc_ai_log_usage_event`
- `rpc_ai_register_human_review_decision`

As RPCs nao chamam LLM, nao geram resposta, nao indexam vetor e nao executam acao operacional.

## Matriz resumida
| Fonte | Status | Visibilidade | Uso permitido | Boundary |
| --- | --- | --- | --- | --- |
| support_ticket | restricted | support_only | resumo, sugestao, risco | revisao humana |
| ticket_timeline | restricted | support_only | resumo, resposta, lacuna | redaction obrigatoria |
| customer_account | restricted | support_only | resumo e risco | nunca customer-facing |
| knowledge_article_public | allowed | public | citacao e sugestao | precisa published/public |
| knowledge_article_internal | restricted | support_only | apoio interno/editorial | nao enviar ao cliente |
| knowledge_article_restricted | restricted | customer_facing | rascunho com entitlement | nunca auto-send |
| customer_portal_ticket | future | customer_facing | futuro | IA no Portal nao ativa |
| engineering_work_item | restricted | engineering_only | resumo tecnico | sem conversa direta com cliente |
| internal_action | restricted | support_only | retorno ao suporte | sem Portal |
| documentation | allowed | public | explicacao/lacuna | citacao obrigatoria |
| audit_summary | restricted | admin_only | risco/sumario | audit bruto proibido |

## Criterios para IA real futura
Antes de qualquer provider real:
- aprovar source policies;
- validar logs de uso;
- testar redaction;
- definir avaliacao de prompts;
- definir fallback sem IA;
- aprovar custo/rate limit;
- aprovar provider/modelo;
- validar tenant boundaries;
- exigir human review;
- exigir citacoes;
- definir monitoramento;
- definir opt-in;
- definir kill switch;
- definir retencao.

## Fora do P3
- OpenAI/Anthropic/Gemini/Groq/Ollama ou qualquer LLM;
- LangChain/LlamaIndex;
- Pinecone/Weaviate/Qdrant/vector database;
- chatbot;
- resposta automatica;
- classificacao automatica;
- publicacao automatica;
- job de IA;
- embedding;
- automacao sem revisao humana.
