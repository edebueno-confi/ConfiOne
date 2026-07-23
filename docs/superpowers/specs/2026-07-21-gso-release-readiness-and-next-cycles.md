# GSO Release Readiness e Próximos Ciclos — Especificação SDD

Status: proposta operacional para aprovação do próximo lote
Data: 2026-07-21
Checkout canônico: C:\Projetos\GSO-old
Branch atual: codex/repository-cleanup-consolidation-20260721

## Objetivo

Encerrar com qualidade auditável o módulo do Dashboard Gerencial e organizar a continuidade do Genius Support OS em ciclos independentes, pequenos e validáveis. O backend continua como fonte da verdade; o frontend renderiza contratos reais; integrações e writes externos permanecem governados e auditáveis.

Esta é a especificação guarda-chuva. Cada mudança de schema, RPC, Edge Function ou fluxo externo deve atualizar o documento específico do domínio antes do código.

## Estado confirmado

- Dashboard Gerencial com Visão Executiva, Comercial, CS/Suporte, Financeiro, Qualidade, Histórico, Configuração, Logs e exportação visual.
- HubSpot é a fonte operacional de CS após reconciliação; a planilha CS Ops é staging de migração, auditoria e exceções.
- OMIE possui adapter read-only API-first e fallback de planilha; segredos ficam exclusivamente no servidor.
- HubSpot possui cargas incrementais para empresas/tickets, carga completa segura para Deals, bloqueio de concorrência e logs sanitizados.
- CS Support preserva os pipelines de tickets existentes; a origem de widget, formulário ou WhatsApp só pode ser mostrada com propriedade real confirmada.
- A fila financeira agrupa títulos por cliente e diferencia matriz/filial de ambiguidade.
- Mascote Genius possui poses de loading, vazio, sucesso e avatar com um único asset de runtime.
- Branch atual: codex/repository-cleanup-consolidation-20260721; HEAD 7c7d291;
  worktree contém o lote W1-W6 documentado e não commitado; nenhum push,
  deploy, migration remota ou secret foi alterado nesta frente.

## Não objetivos e gates

Não executar sem aprovação explícita: push, merge, PR, deploy, migration remota, criação/rotação/leitura de secrets, writes em HubSpot/OMIE sem preflight e ledger, mudança de tickets ou pipelines de Suporte, exclusão permanente de histórico referenciado, ativação de IA ou publicação automática de artigos.

## Princípios

- Backend, views, RPCs, RLS e auditoria definem regra, permissão, status, cálculo e visibilidade.
- Todo dado operacional tem tenant/escopo, origem, frescor, qualidade e auditoria.
- Dados ausentes aparecem como indisponíveis; não usar mock ou heurística silenciosa.
- Cargas longas usam paginação, incrementalidade, limites de concorrência, timeout individual, retry idempotente e estado parcial.
- Cada lote termina com testes, documentação, diff review e estado Git.

## Workstreams

### W0 — Governança SDD e handoff

Atualizar spec, plan, PROJECT_STATE e ledger a cada lote. Retornos devem conter Feito, Validado, Atenção, Git e Próximo passo. Agentes paralelos recebem checkout, escopo de leitura/escrita e arquivos proibidos; arquivos centrais ficam com o coordenador.

Aceite: nenhuma mudança relevante sem relatório; nenhuma branch sem merge é apagada; nenhum subagente faz operação externa.

### W1 — Higiene e prontidão do repositório

Concluir a triagem de docs/CLEANUP_REPORT.md, decidir destino dos scripts Windows e criar verificação read-only da raiz para screenshots, dumps, logs e diagnósticos.

Aceite: raiz sem artefato indevido, temporários em .tmp, links válidos e cada remoção/preservação documentada.

### W2 — Qualificação do Dashboard

Validar Visão Executiva, Comercial, CS/Suporte, Financeiro, Histórico, Qualidade, Logs, filtros globais, aliases, hints, cores semânticas, loading/error/empty, responsividade e PDF/PNG.

Aceite: período preservado entre abas; totais não duplicados por pipeline; fonte, fórmula, frescor e caveat explicados; exportação sem shell e apenas com abas selecionadas.

### W3 — Integrações e observabilidade

Revisar incrementalidade HubSpot, particionamento de tickets, timeout/retry, concorrência, status partial OMIE, run_id, retenção e sanitização de logs.

Aceite: reexecução idempotente; falha parcial honesta; erros 400/546/timeout contextualizados; nenhum segredo em UI, payload ou log.

### W4 — CS Ops, HubSpot e carteira

Fechar importação BD_Clientes, preflight, ledger por linha, matching por ID/CNPJ/nome/grupo, criação somente quando não houver correspondência segura e seed da carteira real.

Aceite: ambiguidades em fila; matriz/filial não vira duplicidade automática; nenhum ticket alterado; cada write tem ID, origem, payload, resultado e auditoria; catálogo HubSpot vazio bloqueia apply.

### W5 — Help Center, Portal e acesso

Validar corpus, assets, formatação, contatos configuráveis, editor, publicação governada, Portal e dashboard_viewer.

Aceite: publicação só por view pública autorizada; assets protegidos; dashboard_viewer limitado pelo backend; tenant isolation e recuperação de sessão testados.

### W6 — Segurança, contratos e performance

Revisar RPCs/views/migrations, security definer, search_path, grants, RLS, CORS, scheduler, filtros server-side, paginação e planos de consulta.

Aceite: nenhum warning novo sem justificativa; testes anônimo/comum/admin; nenhum vazamento cross-tenant; warnings históricos identificados.

### W7 — Release e handoff

Gerar matriz de testes, relatório final, lista de commits, limitações, gates externos e prompt de continuidade.

Aceite: outro agente reproduz o estado local; gates remotos separados; decisão de release humana.

## Ordem

1. W0: congelar documentação e identidade Git.
2. W1: concluir higiene sem remover histórico ainda referenciado.
3. W2 e W3 em paralelo sobre contratos estabilizados.
4. W4 após preflight e testes de idempotência.
5. W5 sem misturar com Suporte.
6. W6 sobre o conjunto integrado.
7. W7 e parada antes dos gates externos.

## Evidências mínimas

Spec/plano do ciclo, relatório em docs/reports, testes com saída real, git diff --check, branch/HEAD, screenshots apenas em .tmp ou evidência final curada e lista de writes externos executados/não executados/bloqueados.

## Estado de execução — 2026-07-21

- W1: concluído; higiene da raiz passou e os diretórios locais legítimos foram
  classificados sem exclusão.
- W2: concluído no escopo validado; Dashboard faseado e filtros globais foram
  confirmados por QA autenticado.
- W3: concluído no escopo local; runtime, fases HubSpot, ACL legado e gateway
  scheduler foram tratados, com leases/cursor ainda pendentes.
- W5: reidratado localmente; Central Genius ativa, 44 artigos públicos e 13
  bloqueios editoriais preservados.
- W4: hardening de duplicidade e rechecagem CNPJ concluído; aplicação externa
  permanece bloqueada sem novo lote, fingerprint e revisão.
- W6: auditoria priorizada concluída; lease, cursor por escopo, consultas
  pesadas e CORS aguardam o próximo lote técnico.

## Próximo passo

Executar o lote técnico W4/W6: persistir fingerprint de catálogo no preflight,
implementar lease atômico por integração/escopo e medir as consultas do
Dashboard antes de qualquer write externo. Gates de HubSpot/OMIE remoto,
deploy, migration remota, secrets e `apply` continuam exigindo decisão humana.
