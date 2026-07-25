# DASHBOARD-02.3.3 — Merge controlado da Visão Executiva

## Escopo final

- Visão Executiva V1 do Dashboard Gerencial;
- hierarquia, estados, frescor e responsividade;
- restrição do perfil `dashboard_viewer`;
- read model seguro para histórico de imports;
- correção do contrato de agendamento e do trigger de auditoria;
- migration forward-only e testes de regressão;
- documentação e fixtures determinísticas de QA.

## Estado pré-merge

- Branch: `codex/dashboard-02-executive-v1`;
- HEAD: `392b0078a173a34da0182b706794f9509445ac0d`;
- PR: `#3 — Dashboard: Visão Executiva V1 produtiva`;
- Base: `main`;
- Working tree: limpo após o commit deste relatório;
- Stash editorial: preservado e não aplicado;
- Merge SHA: pendente até a execução do merge controlado.

## Higiene de artefatos

Os pacotes em `output/review-packages/` foram removidos do índice Git e preservados no disco local para consulta e upload. A pasta passou a ser ignorada explicitamente.

As imagens redundantes das opções visuais B e C em `docs/prototypes/dashboard-02/evidence/` foram removidas do índice Git e preservadas localmente. O HTML, fixtures, comparação principal e evidências finais da opção aprovada permanecem versionados.

## Validações

- `npm run contracts:typecheck`;
- `npm run web:typecheck`;
- `npm run web:build`;
- testes focados de Visão Executiva, `dashboard_viewer`, runtime contract, schedule schema cache e migration hardening;
- banco reconstruído do zero;
- 79 arquivos pgTAP e 1.288 testes aprovados no gate runtime;
- lint de banco;
- smoke administrativo e `dashboard_viewer`;
- console e rede sem erros funcionais;
- `npm run repository:check-root`;
- `git diff --check`;
- auditoria de secrets e artefatos.

## Migration

Arquivo: `supabase/migrations/20260725120000_analytics_runtime_contract_hardening_v1.sql`

Validada localmente e incluída no PR. Ainda não aplicada remotamente; dependerá do runbook de deploy posterior.

## Limites

- sem deploy;
- sem migration remota;
- sem sincronização real HubSpot ou OMIE;
- sem alteração da Central, Knowledge, Taxonomia ou Comercial;
- sem aplicação ou remoção do stash editorial.

## Próxima frente

`DASHBOARD-02.4 — Discovery e arquitetura da tela Comercial`.

## Estado após merge

Será preenchido no relatório final copiável com o merge SHA retornado pelo GitHub. Nenhum commit direto em `main` será criado apenas para atualizar este campo.
