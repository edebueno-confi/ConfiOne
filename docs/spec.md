# Genius Support OS — Especificação viva

## Protocolo SDD vigente — 2026-07-21

- A especificação guarda-chuva dos próximos ciclos está em
  `docs/superpowers/specs/2026-07-21-gso-release-readiness-and-next-cycles.md`.
- O plano executável correspondente está em
  `docs/superpowers/plans/2026-07-21-gso-release-readiness-and-next-cycles.md`.
- Cada lote relevante deve atualizar esta especificação viva, `docs/plan.md`,
  `docs/PROJECT_STATE.md`, `docs/DOCUMENTATION_LEDGER.md` e o documento
  específico da área afetada.
- Subagentes podem auditar ou implementar escopos disjuntos, mas o coordenador
  mantém os arquivos centrais, revisa todos os diffs e executa a validação
  integrada.
- Cada retorno operacional deve informar Feito, Validado, Atenção, Git e
  Próximo passo. Push, deploy, migration remota, secrets e writes externos
  continuam gates humanos explícitos.

## Visão do produto

O Genius Support OS é um SaaS interno B2B para operar atendimento, Customer
Success, tickets, engenharia, conhecimento, clientes e controles
administrativos. O painel gerencial é uma superfície operacional dentro do
produto, não um dashboard paralelo no Looker.

## Arquitetura observada

- Frontend: React + Vite em `apps/web`.
- Backend: Supabase/Postgres, Edge Functions e PostgREST.
- Auth: Supabase Auth; áreas administrativas exigem `platform_admin`.
- Fonte da verdade do produto: tabelas, views/read models, RPCs, RLS e auditoria.
- Fonte operacional única do CS: HubSpot. A planilha histórica do CS pode ser
  usada somente para migração, reconciliação, auditoria e QA versionados; não
  existe operação concorrente permanente nem fallback de planilha.
- Integração HubSpot existente: Edge Function `hubspot-sync`, tabelas locais
  `hubspot_*`, views `vw_analytics_*` e configuração de pipes em
  `analytics_source_config`.
- Fonte financeira publicada: OMIE por API-only, com read model de contas a
  receber, títulos, recebimentos, aging e reconciliação. CSV/XLSX e exportações
  antigas são apenas histórico, migração, auditoria e QA; não são fallback ou
  contingência. Publicação remota, scheduler remoto e sync real continuam gates
  separados.

## Multi-tenancy e autorização

O produto é multi-tenant. Dados customer-facing devem continuar isolados por
tenant e RLS. Dados agregados globais do HubSpot e financeiro só ficam
disponíveis no console gerencial a usuários autorizados por `platform_admin`.
Credenciais de integrações nunca podem aparecer no frontend, em respostas
PostgREST, em logs ou no Git.

## Contratos de integrações

Cada integração deve possuir configuração persistida e governada com:

- `integration_key`, nome, sistema e status ativo/inativo;
- configuração não sensível, como pipes, janela, origem e mapeamento;
- segredo armazenado somente no backend/secret store, com indicação segura de
  “configurado” sem retornar o valor;
- atualização por RPC administrativa, auditoria e validação explícita;
- última execução, status, frescor, contadores e erro sanitizado;
- ações manuais API-only (`Sincronizar HubSpot`, `Sincronizar OMIE` e ciclo
  completo) em Configurações; não existe ação de sincronização por planilha.

## Dashboard gerencial

O dashboard ativo deste lote cobre Resumo Gerencial, Comercial, Customer
Success, Suporte & Chat e Financeiro. Produto e Desenvolvimento permanecem no
código, fora da navegação ativa. Cada métrica precisa declarar fonte,
grão, período, timezone, fórmula, cobertura, frescor e qualidade. O frontend
renderiza contratos backend; não escolhe pipe atual, soma dados brutos nem
transforma status financeiro em inadimplência por heurística local.

## Fontes conhecidas

- HubSpot: Deals e Tickets; a auditoria de 2026-07-18 encontrou 2.015 Deals,
  incluindo 866 em `Pipe de Vendas` e 1.148 em `Piloto Aftersale`, além de 22
  pipes de Tickets.
- CS, Comercial e OMIE: planilhas/exportações históricas foram inventariadas
  como evidência de migração e QA; não são consumidores ativos do Dashboard.
- Produto: GitHub é a fonte declarada pela área; acesso e repositório ainda
  precisam ser ligados a um contrato próprio.

## Restrições

- Sem deploy remoto, migration remota, reset destrutivo adicional, push ou
  commit sem autorização específica.
- Sem uso de credenciais reais antes de elas serem entregues e configuradas
  pelo operador autorizado.
- Sem mocks como fonte do produto; fixtures sintéticas podem existir somente em
  QA local.
- Importações devem ser idempotentes, auditáveis e preservar o arquivo bruto,
  hash, origem, mapeamento e rejeições.
- Migração de CS deve preservar proveniência por campo, registrar correspondência
  e conflito, impedir duplicação de empresas/tickets e permitir relatório de
  antes/depois. Valores de planilha só podem substituir valores do HubSpot em
  campos explicitamente aprovados e com trilha de auditoria.
## Decisao vigente do Dashboard - 2026-08-02

O Dashboard Gerencial publicado possui cinco areas: Resumo Gerencial,
Comercial, Customer Success, Suporte & Chat e Financeiro. Produto e
Desenvolvimento permanecem no repositorio para trabalho futuro, mas nao fazem
parte da navegacao nem dos cards ativos desta superficie.

HubSpot e a fonte oficial de empresas, deals, pipelines, stages, owners e
tickets. Chat so e publicado quando houver contrato real de
Conversations/Inbox/Chat. OMIE API e a unica fonte publicada para contas a
receber, titulos, recebidos, abertos, aging, atraso e reconciliacao financeira.
Planilhas permanecem apenas como historico de migracao, auditoria e QA; nao sao
fonte, fallback ou contingencia do Dashboard.

Quando nao houver dado real, o backend deve informar estado e motivo para a UI
exibir `Indisponivel`, sem trocar ausencia por zero ou procurar uma planilha.
O registro factual desta decisao e dos gaps de implementacao esta em
`docs/reports/2026-08-02_dashboard-api-only-audit.md`.

## Especificacao do macro-lote de Configuracoes - 2026-08-02

Este lote refatora somente as superfícies administrativas de Configurações,
Fontes do Dashboard e Histórico de sincronizações. As páginas analíticas do
Dashboard permanecem fora do escopo visual e funcional.

### Contrato de navegação

- `AdminConsoleShell` é o único shell global.
- Configurações possui um único menu lateral com Marcas, Central de Ajuda,
  Integrações, Fontes do Dashboard e Histórico de sincronizações.
- As rotas canônicas de operação são `/admin/settings/integrations`,
  `/admin/settings/dashboard-sources` e `/admin/settings/sync-history`.
- `/admin/settings` e URLs antigas com `section` redirecionam de forma segura,
  sem renderizar uma segunda página para o mesmo conteúdo.

### Contrato de integrações

- A superfície publica somente HubSpot e OMIE.
- HubSpot usa API e descreve a origem de dados comerciais, clientes e
  atendimentos.
- OMIE usa API e descreve dados financeiros e contas a receber.
- OMIE recebe `APP_KEY` e `APP_SECRET` separadamente na interface; o backend
  grava o par serializado no secret store e nunca devolve qualquer valor.
- O campo de modo não é exibido. O modo persistido internamente permanece
  `api` por compatibilidade até a retirada segura de consumidores.

### Contrato de catálogo HubSpot

- O worker consulta todos os pipelines não arquivados de deals e tickets.
- Novos pipelines entram ativos por padrão e recebem nome oficial, tipo e
  data de descoberta.
- Pipelines ausentes/arquivados permanecem no histórico, são marcados como
  arquivados e não entram nos cálculos.
- Alias e classificação administrativa existentes são preservados.
- As áreas administrativas são Comercial, Customer Success, Suporte, Chat e
  A classificar.
- Tickets sem classificação segura ficam em A classificar; essa categoria não
  compõe silenciosamente KPIs de Customer Success, Suporte ou Chat.
- Chat só compõe métricas após contrato confirmado.

### Segurança e proveniência

Todas as leituras passam por read models/RPCs existentes ou novos contratos
forward-only com `platform_admin`, RLS, auditoria e erro sanitizado. A tela
mostra origem, escopo funcional, status e última descoberta sem expor RPCs,
tabelas, secrets ou detalhes de infraestrutura. Sincronização real, push,
deploy, migration remota e fixtures pgTAP ficam fora deste lote.
