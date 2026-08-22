# ConfiOne, visão do projeto

## Status do documento

Documento normativo de orientação geral. Não substitui docs/PROJECT_STATE.md, que
continua sendo o checkpoint do estado real do checkout. Quando este documento e o
código divergirem, o código executável e os contratos vigentes prevalecem.

## Objetivo

O ConfiOne é uma plataforma operacional interna B2B que conecta contexto,
atendimento, conhecimento, suporte, clientes, Customer Success, indicadores,
integrações, administração, acessos e governança.

O produto não deve ser tratado como CRM genérico nem somente como sistema de
tickets. O fluxo operacional e o contexto são prioritários em relação a módulos
isolados e dashboards.

Genius Support OS, GeniusOS e identificadores semelhantes permanecem como nomes
históricos ou técnicos legados quando ainda existirem no código.

## Usuários principais observados

- colaboradores internos com contexto de área, função, perfil e capacidades;
- platform_admin, com escopo administrativo ampliado;
- operadores e gestores de Support;
- usuários de Customer Success, Financeiro, Comercial e Produto, quando a área e
  as capacidades correspondentes estiverem concedidas;
- dashboard_viewer, com acesso limitado a superfícies autorizadas;
- customer_user, em superfícies do Portal do cliente.

A autorização efetiva deve ser confirmada pelo backend. O papel visual ou a rota
acessada não são suficientes para inferir permissão.

## Módulos principais observados

- recepção e navegação global;
- Analytics e indicadores por domínio;
- Support Workspace, inbox, fila, tickets, timeline e acionamentos internos;
- Central de Clientes e contexto de tenants;
- Customer Success e carteira;
- Knowledge e Central de Ajuda;
- Portal do cliente;
- administração, usuários, áreas, perfis, capacidades e configurações;
- Documentos do Produto e Diário de Construção;
- integrações e sincronizações HubSpot, OMIE e fontes de conhecimento;
- contratos compartilhados, migrations, RLS, views, RPCs e testes pgTAP.

## Stack e estrutura

- monorepo npm com workspaces em apps/* e packages/*;
- frontend React, TypeScript, Vite e Tailwind em apps/web;
- contratos compartilhados em packages/contracts;
- PostgreSQL e Supabase em supabase, incluindo migrations, RLS, views, RPCs,
  Edge Functions e testes de banco;
- testes complementares em tests;
- scripts operacionais, CI, QA local e documentação em scripts, .github e docs;
- material bruto preservado em raw_knowledge.

## Limites conhecidos

- o backend é a fonte da verdade; o frontend renderiza read models e chama
  comandos reais;
- algumas capacidades de backend podem permanecer sem UI ou fora do release
  surface, conforme o roadmap e o quality gate;
- validação local não equivale a publicação, deploy, migration remota,
  sincronização externa ou aprovação operacional;
- o estado atual do checkout pode conter alterações não commitadas de outro lote;
  elas devem ser inspecionadas e preservadas;
- o release surface e as permissões efetivas são contratos separados;
- decisões de produto ou arquitetura ausentes não devem ser inferidas pelo agente.

Quando a informação não puder ser determinada pelo repositório:

UNRESOLVED — requires project owner decision
