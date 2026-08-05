# AGENTS.md

Instruções permanentes para agentes Codex no repositório Genius Support OS.

## Leitura obrigatória inicial

Antes de alterar qualquer arquivo, leia o contexto local e priorize:

1. `docs/PROJECT_STATE.md`
2. `docs/README.md`
3. `docs/ROADMAP_BUILDOUT_V3.md`
4. `docs/OPERATIONAL_CONTROL_PLANE_V1.md`, quando a frente envolver Operational Control Plane
5. `docs/GOAL_EXECUTION_PLAN.md`, quando o trabalho for executado via `/goal`
6. `docs/CODEX_EXECUTION_RULES.md`
7. `docs/VALIDATION_CHECKLIST.md`
8. `docs/ARCHITECTURE_RULES.md`
9. `docs/VIEW_RPC_CONTRACTS.md`
10. `docs/AUTH_CONTEXT_STRATEGY.md`
11. `docs/AI_GOVERNANCE.md`
12. `docs/DOCUMENTATION_LEDGER.md`
13. `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md`, quando houver UI/UX

`docs/GPT/`, `.worktrees/*`, `docs/ROADMAP.md` e `docs/IMPLEMENTATION_PLAN.md` podem conter histórico útil, mas não são plano corrente quando divergirem dos documentos acima.

## Regras de execução

- Backend é source of truth.
- Frontend apenas renderiza dados vindos de views/read models e chama RPCs/commands reais.
- Não criar mock, regra local, endpoint, contrato, dado ou tela falsa quando houver fonte real.
- Não criar tabela, RPC, view, policy ou contrato novo sem auditar equivalentes existentes.
- Todo dado operacional exige tenant/escopo explícito, RLS, permissões, auditoria e logs quando aplicável.
- IA é assistente operacional; nunca é source of truth, nunca decide permissão e nunca executa ação customer-facing sem revisão humana.
- Documentação histórica não deve ser usada como plano corrente se `PROJECT_STATE.md`, `ROADMAP_BUILDOUT_V3.md`, `OPERATIONAL_CONTROL_PLANE_V1.md` ou relatórios recentes apontarem outro estado.
- Mudanças devem ser pequenas, auditáveis, alinhadas aos contratos reais e validadas com os scripts disponíveis.
- Auditorias de qualidade devem usar `$genius-code-quality`; ela é read-only por padrão e correções exigem autorização explícita.
- Auditorias documentais devem usar `$genius-documentation-governance`; ela é read-only por padrão, aplica somente com escopo aprovado e nunca deixa histórico prevalecer sobre contratos reais.

## Parar e pedir decisão humana

Pare antes de executar quando houver:

- deploy remoto, push para produção ou migração remota;
- migration destrutiva, reset de banco, perda de dados ou exclusão permanente;
- uso ou alteração de secrets, tokens, cookies, JWTs, service_role ou credenciais;
- envio externo de e-mail/mensagem, compra, cobrança ou ação com custo;
- decisão de produto pendente ou ambiguidade relevante de domínio;
- risco de vazamento cross-tenant, quebra de RLS, bypass de permissão ou exposição de dado sensível;
- conflito entre documentos canônicos que não possa ser resolvido por evidência local.

## Fechamento de lote

Ao encerrar, reporte objetivamente:

- o que foi feito;
- o que foi validado;
- o que ainda exige atenção;
- status git;
- se houve commit ou não.

## Imported Claude Cowork project instructions
