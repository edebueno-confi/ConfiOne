# MVP Release Checklist - 2026-05-24

## Objetivo

Checklist operacional para liberar o Genius Support OS MVP em piloto controlado local/staging.

Este documento nao autoriza deploy remoto, alteracao de Supabase remoto, criacao de secrets, provider externo ou publicacao em producao.

## Pre-release

- [ ] Confirmar branch correta para release.
- [ ] Confirmar `git status --short` limpo.
- [ ] Confirmar que nao ha arquivos `env`, dumps, CSV, screenshots ou dados reais no diff.
- [ ] Revisar ultimos commits do lote.
- [ ] Revisar migrations recentes em ordem.
- [ ] Confirmar que nao existe migration local nao aplicada.
- [ ] Confirmar que nao ha secrets ou tokens novos.
- [ ] Confirmar que `customer_portal` segue unico canal real.
- [ ] Confirmar que canais externos seguem futuros/bloqueados.
- [ ] Confirmar que IA real segue inativa.
- [ ] Rodar `npm run contracts:typecheck`.
- [ ] Rodar `npm run web:typecheck`.
- [ ] Rodar `npm run web:build`.
- [ ] Rodar `npm run supabase:lint:db`.
- [ ] Rodar `npm run supabase:test:db`.
- [ ] Rodar `npm run supabase:qa:local-functional-fixture`.
- [ ] Rodar novamente `npm run supabase:qa:local-functional-fixture` para idempotencia.
- [ ] Guardar IDs impressos pela fixture para smoke.
- [ ] Validar login de `platform_admin`.
- [ ] Validar login de `support_manager`.
- [ ] Validar login de `customer_user`.
- [ ] Validar login de `internal_area_member`.
- [ ] Validar login de `engineering_member`.
- [ ] Validar `/help/genius` como anonimo.

## Release controlado

- [ ] Aplicar migrations apenas no ambiente alvo aprovado.
- [ ] Nunca rodar `db reset` em ambiente remoto.
- [ ] Nunca usar `git reset --hard` como etapa de release.
- [ ] Confirmar health do Supabase.
- [ ] Confirmar Auth funcionando.
- [ ] Confirmar Storage/Edge Functions necessarias para evidencias.
- [ ] Confirmar frontend servido com build aprovado.
- [ ] Validar `/admin/system`.
- [ ] Validar `/admin/tenants`.
- [ ] Validar `/support/queue`.
- [ ] Validar `/support/tickets/:ticketId`.
- [ ] Validar `/portal`.
- [ ] Validar `/portal/tickets/:ticketId`.
- [ ] Validar `/help/genius`.
- [ ] Validar `/internal-actions`.
- [ ] Validar `/engineering`.
- [ ] Confirmar que rollback tecnico e responsaveis estao definidos antes de abrir piloto.

## Pos-release imediato

- [ ] Executar smoke de 15 a 30 minutos.
- [ ] Checar console do browser nas rotas criticas.
- [ ] Checar logs de Supabase/Auth/REST/Edge Functions.
- [ ] Checar eventos de ticket.
- [ ] Checar audit logs de mutacoes relevantes.
- [ ] Checar delivery customer_portal para resposta publica.
- [ ] Checar upload/download de evidencia com grant curto.
- [ ] Confirmar que Portal nao ve dados internos.
- [ ] Confirmar que Public Help mostra apenas published/public.
- [ ] Registrar achados no relatorio de piloto.

## Go

O piloto pode abrir quando:

- todos os gates tecnicos passam;
- fixture idempotente passa;
- smoke autenticado passa;
- nenhum vazamento customer-facing e encontrado;
- nenhum botao fake ou acao sem contrato e encontrado;
- rollback esta documentado e entendido;
- responsavel humano aprova o corte.

## No-Go

Bloquear piloto se ocorrer qualquer item:

- falha em build/typecheck/pgTAP/lint/fixture;
- erro bruto em rota critica;
- Portal vendo nota interna, internal actions, engineering internals, audit bruto, storage path, provider/readiness ou AI readiness;
- Public Help vendo draft/internal/restricted sem contrato publico;
- provider externo, IA real, secret, token, API key ou webhook aparecer no diff;
- migration irreversivel sem plano de rollback;
- dados reais versionados;
- ambiente alvo instavel sem diagnostico.

## Aprovacao

Responsaveis sugeridos:

- Engenharia: valida gates tecnicos, migrations, rollback e logs.
- Produto/Operacao: valida fluxo MVP, copy operacional e limites do piloto.
- Suporte/CS: valida usabilidade do atendimento e customer-facing boundary.
- Segurança/Responsavel tecnico: valida secrets, RLS, storage, audit e ausencia de vazamento.
