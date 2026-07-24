# BUILD_JOURNAL_STRATEGY.md

## Objetivo
Definir a estratégia documental da área interna `Diário de Construção`, superfície de leitura para registrar como o Genius Support OS foi planejado, arquitetado e construído com colaboração entre humano, ChatGPT e Codex.

Atualização de 2026-05-13: a primeira versão runtime foi criada em `/admin/build-journal` como conteúdo estático versionado no frontend. Ela não criou backend, migration, RPC, tabela, policy, RLS nova ou contrato novo.

Atualização de 2026-05-16: a fase `Build Journal Experience Upgrade V1` reorganizou a experiência runtime do Diário em leitura guiada, com navegação interna sticky, seções ancoradas, trilha `entenda em 5 minutos`, distinção entre leitor técnico e não técnico, decisões expansíveis e melhor explicação de stack, arquitetura, segurança e IA. A fase permaneceu estritamente estática e documental: sem backend novo, migration, RPC, tabela, policy, RLS nova, storage, parser dinâmico ou permissão granular nova.

Atualização de 2026-05-16: a fase `Build Journal Immersive Blueprint Fidelity V1` recriou `/admin/build-journal` a partir da blueprint dark aprovada, trocando a aparência de dashboard administrativo genérico por uma superfície editorial imersiva, com hero dark, atmosfera visual de jornada, faixa `A jornada em uma visão`, mapa da construção, timeline por fases, documentos-fonte curados, arquitetura explicada, papel da IA, estado atual e fechamento editorial. A exceção de dark mode ficou restrita à rota do Diário e não alterou o shell real do Admin Console. A fase continuou estritamente estática e documental: sem backend novo, migration, RPC, tabela, policy, RLS nova, storage, parser dinâmico, busca backend ou permissão granular nova.

Adendo de direção para a próxima rodada: o Diário deve continuar como superfície narrativa principal, mas passar a oferecer aprofundamento controlado nos markdowns originais que sustentam a construção do produto. Esse aprofundamento não deve transformar a área em file explorer, parser dinâmico de filesystem ou reader arbitrário do repositório. A direção aprovada é:

- manter a trilha editorial guiada em `/admin/build-journal`;
- conectar cada fase, bloco e domínio a documentos-fonte explícitos e curados;
- permitir leitura dos markdowns originais apenas quando o documento estiver explicitamente aprovado na whitelist documental;
- explicar melhor como os domínios se conectam e quais documentos sustentam cada superfície do produto;
- incluir arte estática, informativa e sanitizada para arquitetura, domínios, timeline, fluxo Humano + ChatGPT + Codex e evolução do produto.

Guardrails aprovados para essa futura expansão:

- sem backend novo;
- sem parser dinâmico de filesystem;
- sem busca backend;
- sem exposição de arquivos arbitrários;
- sem secrets ou conteúdo sensível;
- apenas markdowns explicitamente aprovados e curados.

## O que é o Build Journal
O Build Journal é o registro narrativo e técnico da construção do Genius Support OS. Ele deve explicar, de forma segura e compreensível, como a plataforma evoluiu de visão de produto para arquitetura, contratos, banco, segurança, fluxos operacionais e experiência interna.

Ele não é changelog de commits, log bruto de execução, dump de prompts, auditoria de segurança completa, documentação de secrets ou vitrine decorativa. Seu papel é traduzir decisões relevantes em uma trilha interna clara para quem precisa entender o produto, a arquitetura e o método de construção.

## Por que ele existe
O Genius Support OS nasceu como uma plataforma interna CX B2B técnica, não como SAC B2C, CRM genérico ou dashboard de cards. A construção do produto depende de decisões que precisam continuar rastreáveis:

- o problema operacional que motivou a plataforma;
- a separação entre suporte, CS, Knowledge, engenharia, clientes B2B, auditoria e portal;
- a escolha de backend como fonte da verdade;
- a criação de contratos antes de UI;
- a disciplina de multi-tenancy, RLS, auditoria e permissões desde o início;
- a forma como humano, ChatGPT e Codex dividiram responsabilidades;
- os limites atuais do produto e os próximos blocos ainda dependentes de contrato.

O Build Journal existe para preservar essa memória de produto sem depender de conversas soltas, prints não contextualizados ou conhecimento informal.

## Público interno esperado
O público principal é interno e misto:

- Produto e liderança, para entender direção, trade-offs e escopo real;
- Suporte e CS, para entender por que a plataforma organiza tickets, cliente B2B e Knowledge de determinada forma;
- Engenharia, para entender contratos, limites, decisões de arquitetura e riscos;
- Revisores de Knowledge e auditoria, para acompanhar governança editorial e segurança;
- futuros operadores de IA assistiva, para entender que IA não decide regra, permissão, status ou publicação.

A linguagem deve ser objetiva, em PT-BR, compreensível para público técnico e não técnico. Termos como RLS, RPC e read model podem aparecer nesta documentação interna técnica, mas devem ser explicados e nunca usados para expor detalhe sensível.

## O que pode ser exposto internamente
O Build Journal pode expor:

- visão de produto e problema operacional;
- decisões arquiteturais de alto nível;
- stack técnica usada;
- fases de construção e marcos principais;
- papéis de humano, ChatGPT e Codex;
- padrões de segurança adotados;
- nomes de documentos oficiais versionados;
- nomes de domínios, rotas e módulos quando já forem parte do produto;
- nomes de views/RPCs quando usados como explicação arquitetural e já estiverem documentados em `VIEW_RPC_CONTRACTS.md`;
- prints sanitizados de telas internas, quando aprovados;
- aprendizados, riscos restantes e próximos passos.

## O que não pode ser exposto
O Build Journal não pode expor:

- secrets, tokens, credenciais, chaves de API ou senhas;
- payloads sensíveis de Auth, Supabase, storage, edge functions ou integrações;
- dados reais de clientes, usuários, contatos, tickets ou anexos;
- logs crus, stack traces completos ou dumps de erro com identificadores sensíveis;
- headers, cookies, JWTs, refresh tokens ou session tokens;
- URLs assinadas, paths internos de storage, bucket paths ou coordenadas de evidência;
- metadata bruta de auditoria, `before_state`, `after_state` ou payload operacional completo;
- conteúdo interno restrito da Knowledge Base que não tenha sido aprovado para esse uso;
- prompts brutos com dados sensíveis, credenciais, contexto privado excessivo ou instruções de bypass;
- detalhes que reduzam a segurança, como forma de contornar RLS, policies, grants ou rate limits;
- informação que permita inferir clientes reais, incidentes reais ou estrutura de acesso além do necessário.

Qualquer print futuro deve ser sanitizado. Dados identificáveis devem ser substituídos por exemplos neutros e aprovados.

## Como o projeto foi conduzido
O Genius Support OS foi conduzido com uma divisão explícita de responsabilidades:

- Humano: owner de produto, contexto operacional, prioridade, restrições de negócio, aceitação de direção e decisões sensíveis.
- ChatGPT: arquiteto de produto, PM técnico, analista de processos, tradutor de operação em specs e gerador de prompts para orientar execução.
- Codex: executor técnico no repositório, responsável por ler o contexto versionado, alterar arquivos, validar localmente e manter coerência com contratos existentes.
- Documentação: fonte de verdade viva, versionada e usada como checkpoint antes e depois de cada fase relevante.

O método foi guiado por alguns princípios:

- backend primeiro;
- contratos antes de UI;
- frontend consumindo views/read models e RPCs;
- nenhuma ação runtime sem contrato real;
- RLS, auditoria, permissões e isolamento multi-tenant desde o início;
- documentação atualizada junto com a evolução do produto;
- IA assistiva sem autonomia decisória.

## Linha narrativa da construção
A narrativa futura do Build Journal deve seguir a evolução real do produto:

1. Visão do produto: plataforma interna CX B2B técnica para reduzir suporte descentralizado, perda de contexto e dependência de conhecimento informal.
2. Documentação estratégica: criação dos documentos oficiais que orientam produto, arquitetura, auth, contratos, roadmap e workflows.
3. Arquitetura: separação de domínios, backend como fonte da verdade e proibição de UI simulando regra inexistente.
4. Supabase/PostgreSQL: fundação de banco, migrations oficiais, schemas, funções, views, RPCs, RLS e pgTAP.
5. Auth, tenancy e RLS: `tenant_id` explícito, roles, memberships, gate administrativo e portal customer-facing separado.
6. Tickets: núcleo operacional de chamados, timeline, mensagens, status, atribuição, SLA interno, classificação e auditoria.
7. Knowledge Base: governança editorial, drafts, publicação controlada, Help Center público e entitlements autenticados.
8. Admin Console: tenants/clientes B2B, acesso, sistema, auditoria e governança customer-facing.
9. Support Workspace: fila operacional, ticket workspace, contexto do cliente, evidências e handoff técnico.
10. Customer Account Profile: contexto operacional B2B sem virar CRM genérico.
11. Engineering Workspace: work items técnicos ligados a tickets, updates estruturados e retorno rastreável ao suporte.
12. Customer Portal: portal B2B autenticado, tickets, Knowledge autorizada, evidências, colaboração e contexto ativo.
13. Design system e blueprints: cockpit operacional B2B, densidade, sidebar, rails, scroll controlado e copy sem termos técnicos crus na UI.
14. Futura IA operacional: camada assistiva sobre base oficial, versionada, citável e governada, sem decidir regra, permissão ou publicação.

## Stack técnica utilizada
A construção atual usa:

- monorepo;
- `apps/web`;
- React;
- Vite;
- TypeScript;
- Tailwind;
- React Router;
- Supabase;
- PostgreSQL;
- RLS;
- views/read models;
- RPCs;
- pgTAP;
- GitHub Actions;
- contratos TypeScript;
- documentação versionada.

## Papel de cada camada

### Frontend
Renderiza superfícies operacionais, consome views/read models, chama RPCs e exibe estados retornados pelo backend. Não decide permissão, SLA, status, visibilidade, elegibilidade ou regra de negócio.

### Backend
Concentra regras de negócio, validações, transições, permissões, auditoria, eventos e comandos transacionais. É a fonte da verdade operacional.

### Banco
PostgreSQL/Supabase materializa RLS, constraints, triggers, functions, views, RPCs e logs append-only. Dados operacionais relevantes devem ter `tenant_id` ou escopo equivalente explícito.

### Documentação
Define visão, estratégia, arquitetura, contratos, workflows, roadmap, estado do projeto e limites. É checkpoint para continuidade e proteção contra drift.

### Testes
Validam isolamento, grants, RLS, contratos, tipos, build e regressões principais. pgTAP cobre banco; TypeScript cobre contratos e frontend.

### CI
Executa checagens repetíveis para evitar regressão em typecheck, build e contratos. GitHub Actions deve continuar como camada de validação automatizada, não como substituto de revisão técnica.

### IA assistiva
Apoia análise, documentação, planejamento, geração de specs e execução técnica supervisionada. Não tem autonomia decisória sobre publicação, acesso, segurança, cliente, status, SLA ou mudança irreversível.

## Segurança e escalabilidade
O Build Journal deve reforçar que a plataforma foi desenhada para escala operacional e segurança desde a base:

- multi-tenancy obrigatório;
- `tenant_id` explícito em dados operacionais;
- isolamento por RLS;
- audit logs para mutações relevantes;
- grants restritos;
- storage privado para evidências;
- signed URLs temporárias quando download for autorizado;
- ausência de leitura direta de tabelas-base pelo app;
- leitura por views/read models;
- escrita por RPCs;
- Admin sem bypass irrestrito e sem auditoria;
- portal cliente separado do contexto administrativo;
- IA sem autonomia decisória.

## Limites atuais

### O que já existe
Já existe uma fundação ampla de documentação, contratos, banco, Admin Console, Support Workspace, Engineering Workspace, Customer Account Profile, Customer Portal B2B, Help Center público e Design System. A maior parte das superfícies relevantes consome views/RPCs em vez de tabela-base.

### O que ainda é parcial
Alguns domínios ainda têm expansão pendente, como observabilidade externa real, convite/reset de senha dedicado, regra completa de horário útil para SLA, arquivamento/retencão avançada de evidências, busca/ranking inteligente e evolução de CS/carteiras.

### O que ainda está bloqueado
Continuam bloqueados: IA operacional ativa, Omni Inbox real, publicação automática de conteúdo, uso de raw logs/payloads em UI, leitura direta de tabelas-base pelo app, dados reais em documentação ampla e qualquer feature sem contrato backend real.

### O que depende de contrato futuro
A V1 runtime do Build Journal usa conteúdo estático versionado no frontend. Qualquer evolução para buscar conteúdo dinâmico, indexar docs, exibir prints governados, aplicar permissões por perfil ou registrar decisões em banco depende de contrato futuro explícito.

## Estrutura da tela Build Journal
A versão runtime atual foi organizada assim:

- hero editorial dark com título, subtítulo e badge de atualização segura;
- atmosfera visual de jornada com paisagem abstrata e caminho luminoso;
- faixa `A jornada em uma visão` com etapas conectadas;
- grid principal com mapa da construção, timeline e documentos que moldaram o produto;
- bloco de arquitetura explicada com fluxo visual `Frontend -> Views -> RPCs -> PostgreSQL -> RLS -> Audit Logs -> Docs`;
- bloco sobre o papel da IA na construção, com ChatGPT, Codex e IA futura no produto;
- bloco de estado atual com domínios, contratos e buildout controlado;
- frase final editorial;
- densidade compacta suficiente para priorizar leitura em uma dobra desktop, sem scroll horizontal e sem reaproveitar linguagem de dashboard administrativo.

## Critérios editoriais
- Ser claro para público interno técnico e não técnico.
- Manter linguagem objetiva, sem marketing.
- Diferenciar o que existe do que é futuro.
- Não criar promessa de feature.
- Não expor dados reais, secrets, payloads ou logs crus.
- Citar documentos oficiais quando a explicação depender deles.
- Tratar prints como evidências sanitizadas, não como dump de operação real.
- Quando houver blueprint aprovada para uma superfície documental interna, a rota pode usar dark mode próprio e imersivo, desde que preserve o shell real do Admin Console e não se transforme em landing page promocional.

## Fontes oficiais consideradas
- `docs/PRODUCT_VISION.md`
- `docs/PROJECT_STATE.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/ARCHITECTURE_RULES.md`
- `docs/AUTH_CONTEXT_STRATEGY.md`
- `docs/ROADMAP_BUILDOUT_V3.md`
- `docs/DOCUMENTATION_LEDGER.md`
- `docs/SUPPORT_WORKFLOW.md`
- `docs/ENGINEERING_WORKFLOW.md`
- `docs/VIEW_RPC_CONTRACTS.md`
- `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md`
- `PRODUCT.md`
- `DESIGN.md`
