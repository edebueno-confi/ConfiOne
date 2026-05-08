# PRODUCT.md

## Register
product

## Produto
Genius Support OS e um cockpit operacional CX B2B tecnico para centralizar suporte, CS, operacao administrativa, Knowledge Base, tickets, clientes B2B, auditoria e futura camada Omni Work.

## O que o produto e
- Plataforma interna para operacao tecnica B2B, inicialmente usada por times internos.
- Estacao de trabalho para suporte tecnico, CS e administradores internos.
- Control plane para tenants, acessos, Knowledge, tickets, clientes B2B e observabilidade administrativa.
- Base futura para continuidade entre suporte, cliente, conhecimento, engenharia e operacao omni work.

## O que o produto nao e
- Nao e SAC B2C.
- Nao e CRM generico.
- Nao e dashboard generico.
- Nao e colecao decorativa de cards administrativos.
- Nao e ferramenta onde IA decide regra, permissao, status ou publicacao.

## Usuarios principais
- Suporte tecnico interno.
- CS e operacao de contas B2B.
- Admin interno e platform admin.
- Revisores de Knowledge e auditoria.
- Futuramente, operadores de Omni Work.

## Principios estruturais
- Backend e source of truth.
- Frontend renderiza dados contratuais e envia comandos, sem inventar regra de negocio.
- Views/read models definem leitura.
- RPCs definem mutacoes.
- RLS, permissoes e audit trail sao fundacao, nao refinamento posterior.
- `tenant_id` ou escopo equivalente deve ser explicito em dados operacionais.
- Admin nao significa bypass irrestrito sem auditoria.
- IA e assistente, nao fonte da verdade.
- Feature indisponivel deve ser declarada como indisponivel, nunca simulada.

## Dominios do produto
- Admin Tenants: clientes B2B, contatos e governanca operacional.
- Admin Access: control plane de usuarios, memberships, roles, convites e permissoes.
- Admin System: observabilidade administrativa segura, auditoria e checks reais.
- Admin Knowledge: governanca editorial, revisao, visibilidade e publicacao controlada.
- Support Queue e Ticket Workspace: fluxo diario de atendimento B2B.
- Customers: perfil operacional de cliente B2B, contexto, historico e saude operacional.
- Public Help: central publica apenas com conteudo aprovado e publicado pelo backend.

## Regras para Access e System
- `/admin/access` deve mostrar quem tem acesso a que, com papel, tenant, status e trilha de atualizacao reais.
- `/admin/access` nao e cadastro generico de usuarios.
- `/admin/system` deve mostrar checks, auditoria e eventos administrativos reais.
- `/admin/system` nao e dashboard de vanity metrics.
- Nenhuma tela pode expor secrets, tokens, credenciais, headers, endpoints internos, payloads sensiveis ou logs crus.
- Severidade, status, permissao, visibilidade e saude operacional devem vir do backend.

## Tom e linguagem
- PT-BR claro, direto e operacional.
- Falar com usuario interno B2B tecnico sem expor vocabulario cru de banco, Supabase, RPC ou RLS na UI.
- Quando uma acao estiver bloqueada, explicar o limite real sem parecer erro tecnico.
- Evitar promessa operacional sem contrato real.

## Fontes oficiais usadas
- `docs/ROADMAP_BUILDOUT_V3.md`
- `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md`
- `docs/ARCHITECTURE_RULES.md`
- `docs/AUTH_CONTEXT_STRATEGY.md`
- `docs/design/screens/ADMIN_ACCESS.md`
- `docs/design/screens/ADMIN_ACCESS_BLUEPRINT_SPEC.md`
- `docs/design/screens/ADMIN_SYSTEM.md`
- `docs/design/screens/ACCESS_DENIED_AND_STATES.md`
- `docs/PROJECT_STATE.md`
