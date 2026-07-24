# CS Ops: preflight e bloqueio de catálogo vazio — 2026-07-21

## Objetivo

Evitar que um `dry-run` da migração CS Ops seja interpretado como evidência de
que todas as empresas precisam ser criadas quando o cache local do HubSpot está
vazio após um reset/reconstrução do banco.

## Alterações

- O preflight agora informa, por lote:
  - linhas de origem e linhas válidas;
  - quantidade de empresas e responsáveis carregados;
  - se a consulta veio da cache local (`dry_run`) ou do HubSpot (`apply`);
  - se o catálogo precisa ser reidratado antes da aplicação.
- A Edge Function `hubspot-cs-migration` bloqueia `apply` quando a consulta
  autorizada ao HubSpot retorna zero empresas, com erro `409` e código
  `HUBSPOT_COMPANY_CATALOG_EMPTY`.
- A Configuração exibe o preflight ao administrador e explica por que uma cache
  vazia produz criações artificiais no dry-run.
- A resposta não altera tickets e nenhum write externo foi executado neste lote.

## Regra operacional

1. Importar a aba `BD_Clientes` cria apenas staging.
2. Executar `dry-run` depois de reidratar o cache HubSpot.
3. Revisar correspondências, criações e ambiguidades.
4. Aplicar somente com catálogo HubSpot carregado, credencial válida e revisão
   humana do ledger.

## Validação

- `node --test tests/scripts/cs-migration.test.mjs`: 7 testes aprovados.
- `npm run web:typecheck`: aprovado.
- `npm run web:build`: aprovado; permanece apenas o alerta conhecido de chunks
  acima de 500 kB.
- `npm run supabase:lint:db`: aprovado com 12 warnings preexistentes de
  variáveis `v_actor` não utilizadas em RPCs administrativas antigas.
- `npm run supabase:test:db`: 67 arquivos / 1.192 testes aprovados.
- `git diff --check`: aprovado.

## Pendência

O cache local precisa ser reidratado por uma sincronização HubSpot autenticada
antes de qualquer aplicação do lote CS Ops. A publicação remota da Edge
Function continua dependente do gate de deploy do ambiente-alvo.
