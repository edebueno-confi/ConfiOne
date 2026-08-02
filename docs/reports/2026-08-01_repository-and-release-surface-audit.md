# Auditoria do repositório e da superfície de publicação — 2026-08-01

## Resultado executivo

O checkout operacional canônico é `C:\Projetos\GSO-old`. A organização Git foi
reconduzida para esse único worktree: a branch ativa é `main`, ela acompanha
`origin/main` e está 15 commits à frente, sem divergência para trás. O conteúdo
dos 74 commits que estavam em `origin/main` não foi perdido: `origin/main` é
ancestral do `main` atual. Os lotes locais foram preservados no histórico da
branch e as frentes descartadas fisicamente foram registradas em refs de arquivo
antes do envio das cópias para a Lixeira.

O release operacional vigente não elimina módulos do código. Ele publica somente
as superfícies aprovadas no manifesto `apps/web/src/app/release-surface.mjs`:

- Dashboard Gerencial (`/admin/analytics`);
- Central de Ajuda e leitura pública (`/help/genius` e famílias públicas);
- Conhecimento interno, novo artigo e edição (`/admin/knowledge`, `/new` e
  `/:articleId/edit`);
- Configurações relacionadas a marcas, Central de Ajuda, integrações, fontes do
  dashboard e histórico do dashboard (`/admin/settings`).

As demais telas permanecem no repositório e no modo completo para evolução
posterior, mas são bloqueadas pelo gate da superfície de release. Isso evita
confundir “não publicado agora” com “código perdido”.

## Estado Git verificado

Comandos executados no checkout canônico:

```text
git status --short
git branch --show-current
git rev-parse HEAD
git rev-parse --abbrev-ref --symbolic-full-name @{upstream}
git worktree list
git branch -vv
git stash list
git rev-list --left-right --count origin/main...HEAD
```

Estado no fechamento desta auditoria:

- branch: `main`;
- HEAD: `3dabf7d` antes deste lote de correções;
- upstream: `origin/main`;
- divergência `origin/main...HEAD`: `0 15`;
- worktrees ativos: 1, somente `C:\Projetos\GSO-old`;
- branches locais: 21; refs remotas de `origin`: 30;
- stash: preservado;
- refs de arquivo: 24 em `refs/archive/gso-git-cleanup/`.

As pastas de release e o checkout intermediário autorizados foram enviados à
Lixeira do sistema. O diretório `C:\Projetos\GSO-consolidation-01` ficou vazio,
mas sua remoção final foi impedida por bloqueio do Windows; isso não afeta o Git
nem contém código. Nenhuma branch remota foi apagada e nenhum push foi feito.

## Reconciliação histórica

Foi comparado o conteúdo real da linha histórica por commits, usando o grafo Git
e as árvores dos commits, não apenas nomes de branch. A conclusão é:

1. os 74 commits de `origin/main` já estão na base do `main` atual;
2. a consolidação não exigiu reaplicar manualmente esses commits;
3. os commits locais das antigas frentes continuam acessíveis pelo histórico e
   pelas refs de arquivo;
4. as branches operacionais correspondentes às cópias enviadas à Lixeira foram
   removidas somente depois da criação dessas refs;
5. o remoto foi preservado sem exclusões ou alterações.

Essa estratégia reduz o risco de manter múltiplos diretórios concorrentes sem
apagar a proveniência necessária para recuperar uma decisão antiga.

## Inventário funcional do primeiro release

### Dashboard

O dashboard consome snapshots, históricos e estados de dados por APIs/RPCs reais.
O frontend diferencia `zero real`, `empty`, `partial`, `stale`, `unavailable`,
`not_configured` e `error`. Produto e Desenvolvimento continuam explicitamente
como fonte não conectada; não há KPI inventado.

Foi corrigida uma falha de autorização na shell: `dashboard_viewer` podia chegar
a domínios analíticos adicionais por `tab` na URL, apesar de a navegação mostrar
somente o Dashboard Gerencial. Agora esse perfil fica limitado ao domínio `ceo`
e a navegação força a visão executiva.

### Configurações

O primeiro release expõe somente as seções permitidas pelo manifesto e pelo
contexto de permissão. `ticket_categories` não foi promovido para esta primeira
superfície porque o contrato local de RLS retornava 403 e o módulo não estava
pronto para publicação segura. A área de integrações continua usando views/RPCs
reais.

Risco pendente: a view `vw_admin_managed_integrations` ainda precisa de revisão
de DML/grants no backend. Esse endurecimento exige migration forward-only, pgTAP e
auditoria própria; não foi mascarado pela UI.

### Central de Ajuda, artigos e editor

A leitura pública usa views, RPC de busca e storage de assets assinados. O editor
ativo é o `RichTextArticleEditor` baseado em Tiptap, com publicação governada por
draft, revisão, evidência editorial e RPCs. Nesta auditoria, os prompts nativos
de link e vídeo do caminho ativo foram substituídos por diálogo acessível com
validação inline e preservação dos allowlists de URL.

O arquivo ainda contém `LegacyRichTextArticleEditor`, que não possui referência
de renderização no código. Ele contém prompts próprios e é dívida técnica
identificada, mas não foi removido neste lote para que sua eliminação seja feita
em mudança isolada, com diff menor e validação visual do editor ativo.

## Falhas encontradas e tratadas

- teste de contrato do dashboard preso a texto antigo (“Resumo por domínio”);
  alinhado ao título atual “Mapa das áreas”;
- contratos de UI ainda verificavam API visual antiga de loading e foram alinhados
  ao `aria-busy` vigente;
- teste de agenda tratava `hubspot-sync` como leitor direto da agenda, embora o
  código atual delegue ao RPC orquestrador; o contrato agora verifica a delegação;
- scanner de secrets falhava em renome/deleção staged porque tentava ler arquivo
  já ausente; agora ignora somente o caminho inexistente no índice de trabalho;
- teste de estabilidade de Access chamava um SQL temporário inexistente e
  dependia de `npx supabase@latest`; a chamada quebrada foi removida e o teste
  passou a exercitar diretamente os RPCs/views reais com o CLI já desnecessário.

## Validação objetiva

Passaram neste lote:

- `npm run contracts:typecheck`;
- `npm run web:typecheck`;
- `npm run web:build` — 830 módulos transformados;
- `node --test tests/scripts/*.test.mjs` — 261/261;
- `npm run repository:check-root`;
- `npm run local:qa:secret-scan` — 1.661 arquivos rastreados, 0 matches;
- `npm run documentation:validate:internal-docs` — 0 bloqueios, somente alertas
  documentais já conhecidos;
- `git diff --check`.

O teste de Access foi executado com `ALLOW_LOCAL_QA_RESET=true`, apenas contra o
Supabase local em execução; não houve reset de banco. Não foram executados push,
deploy, migration remota, alteração de secret ou publicação externa.

## Limitações atuais

- QA autenticado visual do release atual ainda precisa de captura real das quatro
  superfícies aprovadas; typecheck/build não substituem essa evidência.
- O erro observado anteriormente no login (“não foi possível validar sua área
  inicial”) depende do contexto Auth local e do estado das views/RPCs; não deve
  ser corrigido com fallback de frontend ou dados fictícios.
- O ciclo local de hydrate e pgTAP continua com colisão de fixtures documentada
  em `docs/reports/2026-08-01_ambiente_local_pgtap_e_sync_hubspot.md`.
- Credenciais locais de integrações não são recuperáveis pelo código; devem ser
  reinseridas pela Configurações quando houver autorização e fonte segura.

## Plano de evolução recomendado

1. Atualizar o bloco corrente de `docs/PROJECT_STATE.md`, `docs/plan.md`,
   `docs/README.md` e `docs/DOCUMENTATION_LEDGER.md` para apontar este estado
   único de `main` e a superfície de primeiro release.
2. Fazer QA browser autenticado em 4173, com captura real de Dashboard,
   Configurações, Central de Ajuda e Editor; registrar loading, vazio,
   indisponível, erro, responsividade e console/rede.
3. Remover o `LegacyRichTextArticleEditor` em lote isolado após confirmar que
   nenhum bundle, teste ou rota o referencia.
4. Endurecer `vw_admin_managed_integrations` no backend com grants/RLS/pgTAP e
   validar a escrita por RPC, sem DML privilegiado no frontend.
5. Resolver a divergência de fixtures hydrate/pgTAP e revalidar o login local,
   sem reset destrutivo ou reidratação automática neste lote.
6. Somente depois dos gates acima, separar commits por escopo e preparar uma
   eventual publicação. Deploy e push continuam dependendo de autorização
   explícita.
