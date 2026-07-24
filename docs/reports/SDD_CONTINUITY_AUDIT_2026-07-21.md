# Auditoria SDD de continuidade — 2026-07-21

## Escopo

Auditoria read-only do checkout `C:\Projetos\GSO-old` para alinhar o plano de
continuidade do Dashboard Gerencial entre agentes. Foram consultados os
documentos canônicos, o backlog, o roadmap, os relatórios recentes e o estado
Git. Três auditorias independentes foram executadas em paralelo: documental,
arquitetural e higiene/Git.

## Estado confirmado

- Branch: `codex/repository-cleanup-consolidation-20260721`.
- HEAD: `7c7d291`; consolidação anterior: `0f86cab`.
- Worktree limpo antes da atualização desta documentação.
- Branch anterior `codex/ux-ui-rebuild-v2-discovery` preservada.
- Não houve push, deploy, migration remota, alteração de secret ou write em
  HubSpot/OMIE durante a auditoria.
- `docs/reports/CODEX_HANDOFF_REPORT_2026-07-21.md` é o caminho válido do
  handoff; não existe relatório com esse nome diretamente em `docs/`.

## Conflitos encontrados

1. Relatórios antigos citavam branch/commit diferentes do checkout atual.
2. A suíte aparece com contagens históricas diferentes; é necessário um único
   baseline executado no HEAD atual.
3. O escopo documentado de `dashboard_viewer` varia entre Dashboard, Área do
   Cliente, Help Center, Conteúdo e Configurações de Integrações; a matriz
   normativa deve ser fechada antes do release.
4. Handoffs antigos alternam entre OMIE sem credencial e sync local confirmado;
   a evidência deve sempre indicar ambiente e data.
5. O cache HubSpot pode ser apagado pela verificação local; a aplicação CS Ops
   deve exigir reidratação e catálogo live não vazio.
6. A origem operacional de tickets ainda não pode ser inferida como widget,
   formulário ou WhatsApp sem propriedade real confirmada no HubSpot.
7. `docs/CLEANUP_REPORT.md`, `docs/GPT/`, scripts da raiz e artefatos ignorados
   exigem classificação antes de qualquer remoção adicional.

## Backlog priorizado

### P0

- Executar baseline único de contratos, typecheck, build, lint, pgTAP e testes
  Node no HEAD atual.
- Fazer QA autenticado do Dashboard, incluindo PDF/PNG, claro/escuro,
  desktop/mobile, filtros globais e estados de erro/loading.
- Reidratar o cache HubSpot e confirmar catálogo, pipelines, contagens e
  origem de tickets antes de aceitar a migração CS Ops.

### P1

- Consolidar o contrato Analytics em `VIEW_RPC_CONTRACTS.md` e retirar drift de
  `ANALYTICS_HUBSPOT.md`/catálogo de métricas.
- Vincular dry-run e apply CS Ops ao mesmo snapshot/versionamento do catálogo.
- Formalizar frescor, duração, completude, retry, timeout, partial e
  idempotência de HubSpot/OMIE.
- Fechar matriz normativa de `dashboard_viewer` e testar acessos.
- Separar gates externos de publicação, scheduler, secrets e writes.

### P2

- Reavaliar CORS curinga e comparação direta do segredo de scheduler após
  inventário de consumidores e procedimento de rotação.
- Criar suíte E2E autenticada permanente para Analytics.
- Avaliar GitHub/Produto e demais expansões somente depois do fechamento do
  Dashboard.

## Decisão de execução

O plano SDD guarda-chuva e o plano executável estão em:

- `docs/superpowers/specs/2026-07-21-gso-release-readiness-and-next-cycles.md`;
- `docs/superpowers/plans/2026-07-21-gso-release-readiness-and-next-cycles.md`.

O próximo lote é W1, higiene documental read-only. W2 e W3 podem ser
paralelizados depois que os contratos forem estabilizados. Nenhum agente pode
fazer operação externa; o coordenador integra diffs, atualiza os documentos
centrais e executa a suíte final.

## Validação desta auditoria

- `npm run documentation:validate:internal-docs`: concluído, 0 bloqueios e 9
  alertas normativos preexistentes.
- `git diff --check`: concluído sem erro; apenas avisos normais de conversão
  LF/CRLF do checkout Windows.
- Todos os documentos novos e caminhos principais existem no checkout.
- Não foram executados testes de código porque esta etapa alterou apenas
  documentação e não alterou runtime, schema ou contratos de execução.
