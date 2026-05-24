# AI_GOVERNANCE.md

## Principio
O Genius Support OS e AI-native, human-governed.

IA e assistente operacional. Nunca e source of truth, nunca decide permissao, nunca escreve direto no banco e nunca executa acao customer-facing sem revisao humana.

## Estado P3
- Nao ha LLM real ativo.
- Nao ha provider de IA, segredo, token, API key, job, chatbot, embedding ou vector database.
- Nao ha resposta automatica, publicacao automatica, classificacao automatica ou automacao sem revisao humana.
- O backend materializou apenas governanca preparatoria:
  - `ai_context_source_policies`
  - `ai_action_policies`
  - `ai_usage_audit_events`
  - views `vw_ai_*`
  - RPCs de validacao/log/revisao humana.

## Base permitida para IA futura
IA so pode usar conteudo que seja:
- versionado;
- classificado;
- autorizado por tenant, role e entitlement quando aplicavel;
- auditavel;
- citavel;
- projetado por view/read model ou RPC governada.

## Fontes permitidas e restritas
- `support_ticket` e `ticket_timeline`: restritas a suporte/admin, com redaction, citacao e revisao humana.
- `customer_account`: restrita a suporte/admin; nunca customer-facing.
- `knowledge_article_public`: permitida como fonte citavel apenas quando publicada/publica.
- `knowledge_article_internal`: restrita ao uso interno; nunca vira resposta ao cliente sem reclassificacao humana.
- `knowledge_article_restricted`: exige entitlement antes de rascunho customer-facing.
- `customer_portal_ticket`: preparado para futuro; nao ativo no Portal.
- `engineering_work_item`: restrito a engenharia/suporte autorizado; nunca conversa direta com cliente.
- `internal_action`: restrito a suporte/area autorizada; nunca aparece no Portal.
- `documentation`: fonte oficial citavel quando governada.
- `audit_summary`: apenas sumario administrativo sanitizado; audit bruto nao e fonte direta.

## Fontes proibidas
- storage path bruto;
- bucket/path interno;
- segredo, token, API key, senha ou credential;
- audit bruto;
- payload bruto de provider externo;
- artigo draft/review sem governanca;
- Knowledge internal/restricted fora do escopo autorizado;
- nota interna como resposta customer-facing;
- engenharia interna ou internal actions no Portal.

## Acoes permitidas apenas como sugestao
- resumir ticket;
- sugerir resposta;
- sugerir artigo;
- sugerir categoria;
- sugerir prioridade;
- detectar lacuna documental;
- resumir cliente;
- apontar risco;
- preparar rascunho de nota interna;
- preparar rascunho de artigo.

Toda sugestao exige actor, tenant quando aplicavel, source_ids, policy, output_type, destino permitido, citacao e revisao humana.

## Acoes proibidas
- enviar mensagem ao cliente automaticamente;
- publicar artigo automaticamente;
- fechar ticket;
- alterar status;
- criar delivery externo/provider;
- expor conteudo interno;
- alterar entitlement;
- alterar RLS/permissao;
- criar internal action automaticamente;
- criar engineering work item automaticamente;
- ler storage path;
- ler segredo/token/API key.

## Politica de auditoria
- `rpc_ai_validate_context_access` valida se uma fonte pode ser usada para um uso/destino.
- `rpc_ai_log_usage_event` registra evento governado sem provider, modelo, prompt ou output.
- `rpc_ai_register_human_review_decision` registra aceite/rejeicao/descarte humano.
- `ai_usage_audit_events` nao pode armazenar prompt_text, output_text, provider_key ou model_key nesta fase.

## Knowledge Base
- Public Help existe, mas segue separado de IA.
- Public Help so expoe artigo `published/public`.
- A IA futura so pode citar Knowledge publica quando o backend confirmar status/visibilidade.
- Knowledge interna/restrita pode apoiar operador/editor, mas nao pode ser enviada ao cliente sem entitlement e revisao humana.

## Pre-condicoes antes de IA real
1. Source policies aprovadas.
2. Logs de uso e revisao humana em funcionamento.
3. Redaction testada.
4. Politica de citacao aprovada.
5. Avaliacao de prompts e outputs.
6. Fallback sem IA.
7. Custo estimado e rate limits.
8. Provider/modelo aprovado.
9. Tenant boundaries testados.
10. Human review obrigatoria.
11. Monitoramento e kill switch.
12. Politica de retencao.
13. Opt-in por ambiente/tenant quando aplicavel.

## O que continua bloqueado
- chatbot real;
- resposta automatica;
- indexacao vetorial;
- embedding;
- qualquer provider externo;
- IA no Portal Cliente;
- geracao ativa de resposta no Support Workspace;
- publicacao ou alteracao operacional sem humano.
