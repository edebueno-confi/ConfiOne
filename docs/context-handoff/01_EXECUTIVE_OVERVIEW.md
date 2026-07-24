# Executive Overview

## Propósito

O Genius Support OS está sendo construído como sistema operacional interno para centralizar trabalho operacional da Genius e, progressivamente, da After Sale. O produto não deve ser tratado como CRM genérico nem como ferramenta isolada de tickets. A direção atual é conectar atendimento, conhecimento, carteira de CS, clientes B2B, indicadores, integrações e governança de acesso.

## Superfícies

- Pública: Central de Ajuda em `/help/:spaceSlug`, com artigos publicados, busca e navegação por categorias.
- Interna: shell autenticado com rotinas de suporte, CS, administração, conhecimento, dashboard gerencial, portal do cliente, acionamentos e produto.
- Cliente autenticado: portal em `/portal`, com tickets e conhecimento autorizado.

## Estado geral

O dashboard gerencial e a central pública estão mais maduros que o restante da plataforma. Há integrações reais em andamento com HubSpot e OMIE, contratos backend extensos em Supabase/Postgres e uma camada web React/Vite. O produto interno completo ainda está irregular: várias telas existem, mas nem todas têm o mesmo nível de contrato, UX, responsividade, regra de negócio e maturidade operacional.

## Stack

- Frontend: React 19, React Router 7, Vite 8, Tailwind 4, Recharts, TipTap.
- Backend/local platform: Supabase CLI, Postgres 17, Edge Functions.
- Contratos compartilhados: workspace `packages/contracts`.
- Testes: pgTAP/Supabase DB tests, scripts Node, typecheck, build, Playwright local.

## Tamanho auditado

- Arquivos rastreáveis fora de `node_modules`/build/output: 1.348.
- Features web: 22 diretórios.
- Migrations SQL: 146.
- Testes de banco: 74.
- Edge Functions: 12.
- Ocorrências aproximadas em migrations: 104 `create table`, 189 `create or replace view`, 365 `create or replace function`, 156 `create policy`, 103 habilitações de RLS.

## Riscos principais

1. Working tree sujo com mudanças herdadas; qualquer commit amplo pode misturar lotes.
2. Alguns módulos internos têm UX divergente e funcionalidade parcial.
3. Tenancy e papéis existem, mas ainda há decisões de produto sobre empresa cliente, grupo econômico, entidade legal, workspace e organização.
4. Integrações HubSpot/OMIE funcionam localmente em partes, mas deploy, scheduler, secrets e consumo remoto exigem aprovação separada.
5. Há telas que parecem prontas, mas precisam de validação funcional e contratual antes de serem publicadas como produto completo.

## Próximo ponto de decisão

Validar se o próximo macro-lote deve focar exclusivamente em release do Dashboard + Central de Ajuda ou se a direção quer continuar investindo na plataforma interna ampla antes do primeiro deploy real.
