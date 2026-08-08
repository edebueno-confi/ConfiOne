# Handoff para Claude — criação direta de usuários no painel admin

## Prompt pronto para enviar

Atue como engenheiro sênior no Genius Support OS, no checkout canônico do repositório. Execute esta frente de ponta a ponta, investigando a causa raiz, implementando a correção mínima alinhada à arquitetura existente e validando o resultado localmente. Não entregue apenas uma proposta.

### Objetivo de produto

O painel administrativo deve criar usuários diretamente. Não vamos usar o fluxo de convite para liberar acesso interno. A criação deve acontecer no próprio painel admin, com a conta de autenticação e o acesso interno devidamente provisionados no backend.

O fluxo antigo de convite não deve ser usado para novos usuários. Preserve registros históricos e auditoria existentes; não apague tabelas, convites ou dados sem um plano de migração aprovado.

### Contexto atual

- Rota principal: `/admin/access`.
- Estado reproduzido: `/admin/access?tab=invites`.
- Tela principal: `apps/web/src/features/access/InternalControlPlanePage.tsx`.
- API do frontend: `apps/web/src/features/admin/admin-api.ts`.
- Contratos e regras de acesso: migrações em `supabase/migrations/`, especialmente as migrações do Internal Control Plane.
- O código atual possui a aba `Convites`, `submitInvite` e a chamada da Edge Function `internal-access-invite`.
- Já existem read models e comandos administrativos para usuários, atribuições, áreas, funções, perfis e permissões. Audite-os antes de criar qualquer contrato novo.

### Problemas que precisam ser corrigidos

1. **Navegação desaparece ao abrir Convites**

   Ao clicar em `Convites`, as opções de navegação da tela deixam de ficar visíveis ou ficam ocultas dentro do container. Reproduza o problema no navegador e investigue o DOM e o CSS, sem assumir a causa. Verifique especialmente:

   - `overflow-y-auto`, `overflow-x-auto`, `h-full`, `min-h-0` e alturas fixas nos containers;
   - containers aninhados com scroll, clipping, stacking context e `z-index`;
   - comportamento do header, breadcrumb, abas e conteúdo em diferentes alturas de viewport;
   - overflow horizontal e responsividade em desktop, tablet e mobile;
   - troca de aba por clique, URL, refresh e voltar/avançar do navegador.

   A navegação deve permanecer acessível e previsível em todas as abas. Nenhum conteúdo essencial pode ficar cortado, escondido atrás de outro container ou depender de uma rolagem inesperada. Corrija a causa estrutural, não apenas com um ajuste visual pontual.

2. **Visual da gestão de usuários precisa de revisão**

   Revise a tela de `Acessos e áreas` mantendo o design system existente e reduzindo a poluição visual. Corrija, conforme necessário:

   - hierarquia entre título, métricas, navegação, conteúdo e ação principal;
   - espaçamento, densidade, largura dos painéis e alinhamento da tabela/formulário;
   - contraste e legibilidade nos temas claro e escuro;
   - estados de loading, vazio, erro, sucesso, validação e operação em andamento;
   - foco de teclado, labels, mensagens de erro e acessibilidade;
   - responsividade sem esconder campos, ações ou navegação.

   A ação principal deve ser `Criar usuário`, e não `Convidar usuário`.

3. **O fluxo de convite está desalinhado com o produto**

   Remova ou aposente o fluxo ativo de convite da experiência de criação. Não faça a nova criação chamar `internal-access-invite`, não dependa de `internal_invites` para provisionar novos acessos e não apresente “Preparar convite” como ação principal.

   Pode existir uma visualização histórica somente leitura dos convites antigos, se isso for necessário para auditoria. Se a aba deixar de existir, documente a decisão e preserve os dados no backend. Não faça limpeza destrutiva.

### Implementação esperada

Crie um fluxo administrativo claro, por exemplo `Criar usuário`, com no mínimo:

- nome completo;
- e-mail;
- área;
- função, quando aplicável;
- perfil de acesso;
- permissões ou capacidades efetivas conforme os contratos existentes;
- estado inicial coerente, normalmente ativo ou pendente de configuração segura da credencial.

O comando deve provisionar, no servidor:

1. usuário no Supabase Auth, caso ainda não exista;
2. identidade/contexto interno correspondente;
3. tenant e membership necessários;
4. associação à área, função e perfil selecionados;
5. permissões efetivas derivadas do backend;
6. auditoria do ator administrador, alvo, alterações e resultado.

A operação deve ser idempotente e tratar explicitamente e-mails duplicados, usuário Auth já existente, usuário interno já cadastrado, dados inválidos, conflito de atribuição e falha parcial. Quando necessário, use transação ou uma saga auditável com compensação segura.

### Credenciais e segurança

Escolha e documente a estratégia mais segura e compatível com o auth existente:

- criação server-side com senha temporária e troca obrigatória no primeiro acesso; ou
- criação server-side com fluxo oficial de definição/redefinição de senha.

Em ambos os casos, a conta deve ser criada diretamente pelo painel admin e o fluxo não deve ser chamado de convite nem depender do registro em `internal_invites`. Nunca envie `service_role`, senha, token, JWT ou segredo ao navegador. Nunca armazene senha em texto claro nem grave credenciais em logs. A autorização deve ser revalidada no backend com as capacidades administrativas e o escopo correto.

Não invente regras de permissão no frontend. Use views, RPCs, comandos e políticas reais já existentes; se houver uma lacuna, implemente o menor contrato forward-only necessário, com migration, grants, RLS, auditoria e testes.

### Processo obrigatório

Antes de editar:

1. Leia `docs/PROJECT_STATE.md`, `docs/README.md`, `docs/ROADMAP_BUILDOUT_V3.md`, `docs/OPERATIONAL_CONTROL_PLANE_V1.md`, `docs/CODEX_EXECUTION_RULES.md`, `docs/VALIDATION_CHECKLIST.md`, `docs/ARCHITECTURE_RULES.md`, `docs/VIEW_RPC_CONTRACTS.md`, `docs/AUTH_CONTEXT_STRATEGY.md`, `docs/DOCUMENTATION_LEDGER.md` e o design system aplicável.
2. Confirme o status do Git e preserve alterações locais não relacionadas.
3. Audite os componentes, API, Edge Functions, RPCs, views, migrations, RLS, grants e contratos atuais.
4. Reproduza o problema visual em navegador autenticado, no mínimo em viewport desktop e mobile, nos temas claro e escuro.

Depois implemente em lotes pequenos e auditáveis. Atualize contratos e documentação quando o comportamento mudar. Não use mocks se existir fonte real.

### Critérios de aceite

- A navegação continua visível e utilizável ao alternar entre usuários, estrutura, perfis e demais áreas mantidas.
- O problema de clipping/overflow ao abrir a tela anteriormente chamada `Convites` foi reproduzido, corrigido na causa raiz e validado em desktop/mobile, claro/escuro.
- A ação primária é `Criar usuário`.
- Um administrador autorizado consegue criar um usuário diretamente no painel sem passar por `internal-access-invite` ou `internal_invites`.
- Após sucesso, o usuário aparece no read model administrativo com área, função, perfil e permissões efetivas corretos.
- Duplicidades e falhas parciais exibem erro acionável e não mostram falso sucesso.
- A credencial é criada ou inicializada somente no servidor, sem segredo exposto no cliente ou nos logs.
- RLS, escopo de tenant, permissões, auditoria e isolamento entre usuários continuam preservados.
- Existem testes para o comando/API, casos de duplicidade e falha, além de teste visual/comportamental da navegação.
- Foram executados, quando disponíveis, lint, typecheck, testes, validação de banco, build e smoke test no navegador. Informe exatamente o que passou e o que não pôde ser executado.

### Restrições de entrega

- Não faça deploy, push para produção, migração remota, alteração de secrets, envio externo de e-mail ou operação destrutiva sem autorização explícita.
- Não use `git reset --hard`, `git clean`, force push ou `git add .`.
- Não remova histórico de convites sem decisão e plano de rollback.
- Não declare sucesso sem evidência de validação.

Ao concluir, entregue:

1. resumo da causa raiz do problema visual;
2. resumo das mudanças de frontend, backend, banco e contratos;
3. como a criação direta de usuário provisiona o acesso;
4. testes executados e resultados;
5. riscos, limitações e plano de rollback;
6. lista exata de arquivos alterados;
7. status do Git e indicação clara se houve commit, push ou deploy.

## Decisão registrada

O produto não utilizará convite para criação de acesso interno. O caminho oficial passa a ser a criação direta de usuário pelo painel administrativo, com provisionamento seguro e auditável no backend.

