# MVP-UX-01 — Implementação local

## Escopo

Implementação local da simplificação do shell autenticado, do control plane de acesso, das configurações e do shell do Dashboard. A Central pública, Knowledge, integrações, cron, secrets, RLS e persistência operacional não foram alterados.

## Decisões aplicadas

- Sidebar com seções independentes, seção ativa aberta automaticamente, persistência local da preferência e rolagem interna.
- Catálogo principal reduzido para Dashboard, Conhecimento, Configurações e Acessos e áreas conforme o contexto de autorização.
- `/admin/internal-areas` redireciona para `/admin/access?tab=structure`; o código legado permanece preservado.
- Access usa as tabs Usuários, Convites, Estrutura e Perfis, com estado navegável por `tab`.
- Settings mostra no MVP Dashboard e Analytics, Central de Ajuda e Marcas; Analytics concentra conexões, agendamentos, pipelines, histórico e diagnóstico.
- Dashboard mantém somente Visão executiva, Comercial, CS / Suporte e Financeiro; ações de sincronização foram retiradas do shell e delegadas a Settings.
- Filtros compartilhados têm modo compacto no mobile e a URL do Dashboard aceita `priority` e `stage` com validação.

## Superdesign

Foram geradas uma reprodução de auditoria e duas direções de comparação no canvas do Superdesign. A direção escolhida foi a compacta e operacional, com divulgação progressiva, tokens existentes e sem código importado:

- Canvas: https://superdesign.dev/teams/91e14209-46ac-4643-ab20-f5d4a883aa7e/projects/adba6a87-0e30-4213-acb9-fa31d5430a09
- Direção escolhida: shell compacto e operacional.
- Direção comparada: dashboard com divulgação progressiva.
- Código gerado pelo Superdesign: não importado.

## Segurança e preservação

Não houve migration, alteração de contrato backend, alteração de secrets, execução de HubSpot/OMIE, criação de usuário, convite real ou escrita operacional.

## Validação local

- `npm run contracts:typecheck`: aprovado.
- `npm run web:typecheck`: aprovado.
- `npm run web:build`: aprovado.
- `npm run repository:check-root`: aprovado.
- `npm run local:qa:secret-scan`: aprovado, 0 correspondências.
- `npm run supabase:verify`: aprovado; reset e 1.402 testes de banco concluídos, com warnings preexistentes do linter.
- Testes focados de navegação, acesso, analytics, estados e contrato MVP: aprovados.
- `git diff --check`: aprovado.
- Smoke autenticado: não executado porque as variáveis `LOCAL_QA_*_EMAIL/PASSWORD` não estão configuradas neste checkout; nenhum usuário ou dado foi criado para contornar a ausência.
