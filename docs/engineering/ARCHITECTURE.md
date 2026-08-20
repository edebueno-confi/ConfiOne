# ConfiOne, arquitetura observada

## Princípio

O backend, o banco, as views, os read models, as RPCs, as policies e os registros
de auditoria formam a fonte da verdade. O frontend não deve duplicar regras
críticas.

## Frontend

apps/web é uma aplicação React com TypeScript, Vite e Tailwind. A composição usa
rotas, gates de autenticação, guards de superfície, componentes por feature,
clientes de API e modelos de apresentação.

Responsabilidades observadas:

- renderizar estados retornados pelos contratos;
- chamar views, read models e RPCs reais;
- apresentar loading, vazio, erro, acesso negado e dados parciais;
- manter regras de apresentação próximas da feature;
- não determinar autorização, tenant, SLA, status ou elegibilidade no cliente.

## Backend e banco

Supabase/PostgreSQL concentra:

- tabelas e constraints;
- RLS e policies;
- triggers;
- funções e RPCs;
- views contratuais e read models;
- auditoria e eventos;
- Storage privado quando aplicável;
- Edge Functions para integrações e operações server-side.

Migrations são versionadas em supabase/migrations. Testes pgTAP ficam em
supabase/tests e devem cobrir autorização, isolamento e regras introduzidas pelo
lote.

## Autenticação e autorização

O produto usa Supabase Auth e contexto de autenticação carregado por contratos
backend. Rotas e componentes aplicam gates, mas a autorização efetiva deve ser
confirmada por grants, capabilities, policies, RLS e RPCs.

O release surface, a capacidade de tela e a autorização de dados são camadas
relacionadas, mas distintas. Ativar uma camada em QA local não autoriza alterar
outra em produção.

## Multi-tenancy

Dados operacionais devem possuir tenant_id ou escopo explícito equivalente.
Isolamento não pode depender apenas de filtros do frontend, nomes visíveis ou
seleção de uma conta na interface.

## Data access e APIs

As features usam o cliente Supabase do navegador para chamadas PostgREST e RPCs.
Views e read models são preferidos para leituras contratuais. Ações administrativas
e transições operacionais devem usar RPCs ou comandos definidos no backend.

Edge Functions e integrações devem permanecer em fronteira server-side quando
envolverem secrets, service roles ou acesso privilegiado.

## State management

O estado local observado usa hooks e contextos React, além de módulos de modelo e
apresentação por feature. Não foi encontrada dependência de Redux, Zustand, Jotai
ou MobX nos manifests inspecionados.

Não introduzir um gerenciador global sem necessidade comprovada e decisão
arquitetural.

## Integrações

HubSpot, OMIE e fontes de conhecimento possuem contratos, configuração, sincronização
e evidências próprias. A escrita externa, o uso de credenciais e a publicação de
sincronização são gates separados e exigem autorização apropriada.

## Boundaries

- UI não substitui backend;
- contexto de grupo não substitui tenant;
- carteira CS não substitui grupo econômico;
- preview local não substitui release;
- teste textual não substitui execução funcional;
- documentação histórica não substitui código ou contrato vigente;
- reviewer não substitui implementador.

## CI/CD observado

O repositório possui .github/workflows/supabase-db.yml, que executa instalação,
typechecks, build, Supabase local, reset local, pgTAP e lint de banco em push,
pull request ou dispatch manual. Não foi identificado workflow de deploy neste
levantamento.

UNRESOLVED — requires project owner decision: destino de deploy, estratégia de
promoção e critérios de merge não explicitados pelo workflow observado.
