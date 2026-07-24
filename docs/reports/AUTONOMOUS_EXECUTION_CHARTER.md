# Contrato de Execução Autônoma — Genius Support OS

_Governança para construção conduzida por IA, revisável e auditável pelo time de tecnologia do grupo Confi. 2026-07-16._

## 1. Objetivo

Construir um sistema interno de gestão de cliente/atendimento (multi-marca: Genius e After Sale) que seja **seguro, auditável e aprovável** por engenharia, seguindo o produto descrito em `RECONSTRUCAO-DO-PRODUTO.md` e a base enxuta de `docs/mvp-reset-2026-07-06/`.

## 2. Modelo de autonomia

A dona do produto (Ede) delegou condução com autonomia alta. O agente **decide e executa sozinho** tudo que for reversível e local. O agente **PARA e pede aprovação humana** apenas nestes casos (políticas internas — não contornar):

- deploy remoto ou para produção;
- migração remota ou reset destrutivo de banco;
- uso/alteração de segredos, tokens, chaves ou `service_role`;
- envio externo real (e-mail, WhatsApp, mensagem a cliente);
- operação com custo financeiro;
- uso de dado real sensível sem autorização;
- decisão de produto que mude o escopo definido nos documentos.

Fora desses casos, o agente segue sem interrupção, tomando as decisões pela documentação e pela necessidade já registrada.

## 3. Guardrails técnicos (não negociáveis)

- **Backend é a fonte da verdade.** Frontend só lê views/read models e chama RPCs.
- **Multi-tenant + RLS** ativos em todo dado operacional; `tenant_id`/escopo explícito.
- **Auditoria**: toda mutação relevante gera evento em log auditável.
- **Menor privilégio**: nenhum segredo no frontend; papéis mínimos por função.
- **Cliente nunca vê o interno** (nota, acionamento, engenharia, audit bruto, storage).
- **Incrementos pequenos e validados**; nada de grandes reescritas não testadas.
- **Trilha de decisão**: cada ciclo registra o que fez, por quê e como validou.

## 4. Definição de Pronto (por lote)

Um lote só é considerado pronto quando:

1. `contracts:typecheck` e `web:typecheck` sem erros novos (delta zero vs. baseline).
2. Se mexeu no banco: migração local aplica, `supabase:test:db` (pgTAP) passa, RLS coberta.
3. Sem regressão: rotas principais continuam abrindo; nenhum vazamento cross-tenant.
4. Documentação/changelog do ciclo atualizado (ver seção 6).
5. Nada tocou ambiente remoto/produção/segredos.

## 5. Roadmap (do blueprint)

- **R1 — núcleo do valor**: Configurações (cérebro) · Atendimento (inbox + conversa) · Portal do cliente · Demanda + acionamento entre áreas · Central de ajuda · Admin mínimo · shell contextual. Multi-marca ligado.
- **R2**: Carteira CS + clusterização · chat ao vivo · painel gerencial nativo.
- **R3**: automações e SLA avançados · Gmail · IA assistiva (com citação e revisão humana).

Ordem de ataque do R1: **Configurações primeiro** (tudo depende dela), depois **Atendimento**, depois o restante.

## 6. Registro de ciclos (build journal)

Cada ciclo autônomo (manual ou programado) registra uma entrada em `docs/reports/AUTONOMOUS_BUILD_JOURNAL.md` com: data, objetivo do ciclo, o que mudou, como foi validado, o que ficou pendente e o próximo passo. Isso é a trilha de auditoria para revisão de engenharia.

## 7. Ciclos programados

Uma tarefa programada (`genius-build-cycle`) roda periodicamente e executa **um** ciclo seguro do R1: escolhe o próximo item pendente, implementa backend-first + frontend, valida, registra no build journal e na memória, e para nas condições da seção 2. Rodando enquanto o app estiver aberto.

## 8. O que sai do sistema atual (arquivar, não apagar)

Catálogo comercial, planos, assinaturas e entitlements; governança de IA em runtime; prontidão de canais; diário de construção antigo; leitor de documentos internos; dashboards vazios. Vão para backlog futuro, restauráveis.
