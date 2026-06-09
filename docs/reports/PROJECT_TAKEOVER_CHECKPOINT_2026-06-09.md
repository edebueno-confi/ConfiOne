# Project Takeover Checkpoint - 2026-06-09

> Status posterior: estabilizacao concluida. Consulte
> `docs/reports/POST_RECOVERY_BASELINE_2026-06-09.md`.

## Resumo executivo

O Genius Support OS foi recuperado do backup pre-formatacao e consolidado em
`C:\Projetos\Genius-Support-OS`. O repositorio esta na branch
`codex/mvp-operational-completion-goal`, commit `0e9ff70`, com integridade Git
confirmada e frontend compilando.

O projeto nao deve iniciar nova feature antes de fechar a estabilizacao
pos-recuperacao. O historico local possui 239 commits alem de `origin/main`, e o
HEAD recuperado nao esta publicado em nenhuma branch remota.

## Estado confirmado

- Produto: plataforma interna CX B2B tecnica para Support, Customer Success,
  Engenharia, Knowledge, Admin e Portal.
- Stack: React 19, TypeScript, Vite, Supabase/Postgres, RLS, views e RPCs.
- Arquitetura: backend-first, multi-tenant e auditavel.
- Branch ativa: `codex/mvp-operational-completion-goal`.
- HEAD: `0e9ff70926b21e604cd87fbbb45590ae61201327`.
- Remote: `https://github.com/edebueno-confi/Central-Confi.git`.
- Divergencia: 239 commits a frente de `origin/main`, zero atras.
- Publicacao: branch e HEAD recuperados ausentes no remoto.
- Dependencias: restauradas por `npm ci`.
- Validacoes verdes em 2026-06-09:
  - `npm run contracts:typecheck`
  - `npm run web:typecheck`
  - `npm run web:build`
  - `npm run documentation:validate:internal-docs` sem bloqueios
  - `git fsck --connectivity-only`
- Supabase local: nao revalidado apos a formatacao porque Docker nao esta
  instalado.

## Riscos prioritarios

### P0 - Preservacao do historico

O trabalho recuperado existe apenas localmente. Uma falha de disco ou uma
limpeza indevida pode eliminar 239 commits ainda ausentes no GitHub.

Acao: autenticar GitHub, publicar a branch recuperada sem force push e confirmar
o hash remoto antes de qualquer reorganizacao de branches.

### P0 - Credencial local versionada

Foi detectado material de autenticacao local literal em
`scripts/knowledge/reprocess-octadesk-article-assets.mjs`. O valor nao deve ser
reproduzido em relatorios. Mesmo sendo destinado ao ambiente local, deve ser
substituido por configuracao derivada do Supabase local ou variavel de ambiente,
com bloqueio explicito para URLs nao locais.

### P1 - Backend sem baseline atual

Migrations e testes pgTAP estavam verdes antes da formatacao, mas ainda nao
foram reexecutados no notebook restaurado. Nenhuma feature de banco deve avancar
antes de `supabase:verify` passar no ambiente atual.

### P1 - Drift documental

`PROJECT_STATE.md`, `ROADMAP_BUILDOUT_V3.md` e relatorios antigos mantem
recomendacoes de momentos diferentes. O proximo lote de produto confirmado pelo
estado mais recente e uma especificacao visual seguida de UI read-only para
`/cs/portfolio`, mas somente depois dos gates de estabilizacao.

### P2 - Dependencias

`npm audit` reportou duas vulnerabilidades altas relacionadas ao React Router e
uma moderada em dependencia transitiva. Atualizacoes automaticas nao foram
aplicadas; o lote deve ser auditado e validado separadamente.

## Ordem oficial de retomada

1. Preservar o historico recuperado no GitHub.
2. Remover material de autenticacao local literal dos scripts legados.
3. Restaurar Docker/Supabase local e executar o baseline completo.
4. Reconciliar documentos canonicos com o estado comprovado.
5. Auditar e atualizar dependencias vulneraveis em lote isolado.
6. Especificar e implementar `/cs/portfolio` read-only.

## Limites de autonomia

- Nao executar push, deploy, migration remota ou alteracao de secrets sem
  autorizacao humana.
- Nao fazer force push.
- Nao alterar `main` diretamente.
- Nao iniciar UI CS antes de blueprint aprovado e gate de rota definido.
- Nao criar health score, billing, financeiro ou mutations CS neste ciclo.

## Plano executavel

O plano detalhado esta em
`docs/superpowers/plans/2026-06-09-project-stabilization-and-resumption.md`.
