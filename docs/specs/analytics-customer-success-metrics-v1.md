# Especificação — Métricas de Customer Success V1

Status: discovery; a aba própria permanece indisponível até existir um
contrato de carteira publicado.

## Decisão de produto e limite atual

`/admin/analytics?tab=customer-success` não reutiliza o snapshot executivo,
tickets, Deals ou títulos OMIE como proxy de Customer Success. Em
`full-preview-only`, a superfície exibe explicitamente que o contrato não foi
publicado. Na primeira release a aba não está no allowlist, embora o restante
do sistema permaneça no repositório.

O contrato futuro deverá responder: qual é a carteira, qual é o responsável,
qual é o estado de relacionamento, qual é o risco explicável e em que data cada
indicador foi observado. Nenhuma regra deve ser criada no React.

## Catálogo de métricas

| Métrica | Pergunta / fórmula | Granularidade e período | Fonte candidata, propriedades e associações | Fonte/read model atual | Atualização, nulo e permissão | Owner / status |
|---|---|---|---|---|---|---|
| Clientes por CSM | Quantas empresas ativas estão atribuídas a cada CSM? `count(empresas ativas com owner resolvido)` | Empresa e CSM; fotografia + tendência mensal | HubSpot Company; owner/owner_id, lifecycle/status; associação Company↔Owner | `hubspot_companies` existe, mas não há regra de carteira publicada nem read model de CS | Após sync de Companies; owner nulo fica `Sem CSM`, nunca é atribuído por inferência; tenant + RLS + permissão Analytics | CS Ops; não publicado |
| Clientes sem CSM | Quais empresas ativas estão sem responsável? `ativas com owner nulo / ativas` | Empresa e tenant; fotografia no período | HubSpot Company; owner/status; eventual tabela interna de carteira | Sem contrato publicado | A cada sync; ausência de owner é dado válido, empresa sem status fica indisponível; tenant/RLS/auditoria | CS Ops; não publicado |
| Sem contato recente | Quais clientes não tiveram atividade de relacionamento na janela? `clientes sem atividade válida após limite configurado` | Empresa; janela configurável e `observed_at` | Company↔activities, calls, meetings, notes, emails ou objeto interno de contato; data da atividade e owner | Não há read model CS de atividade confirmado | Refresh definido pelo sync de atividades; sem timestamp não entra no denominador; permissão de carteira e auditoria | CS Ops; não publicado |
| Tickets críticos | Quais clientes possuem ticket crítico aberto? `count(tickets abertos de prioridade crítica associados à empresa)` | Empresa e ticket; fotografia + período de criação | Ticket; priority, status/pipeline stage, created_at, closed_at; associação Ticket↔Company | Tickets pertencem ao contrato de Suporte (`rpc_analytics_cs_snapshot`), não ao CS | Pode ser referência explicada quando o contrato CS for publicado; associação ausente vira indisponível, não zero; RLS e escopo de ticket | Support/CS; não publicado |
| Inadimplência | Quais clientes possuem títulos OMIE vencidos? `saldo vencido associado à empresa / saldo aberto` | Empresa; fotografia financeira e janela de vencimento | OMIE receivables atuais; balance, due_date, status; vínculo Company↔título pela camada de matching | Financeiro OMIE-only existe separado; não é contrato CS | Após sync OMIE e matching vigente; título sem vínculo fica na reconciliação, fora do cliente; permissão financeira + tenant | Finance/CS; não publicado |
| Renovação próxima | Quais clientes têm renovação dentro da janela? `deals de renovação com close_date na janela e etapa válida` | Empresa e Deal; janela 30/60/90 dias | HubSpot Deal ou objeto de renovação; dealstage, amount, close_date, renewal flag/type; Deal↔Company | Deals comerciais existem, mas não há regra de renovação CS | Após sync de Deals; data/etapa ausente fica indisponível; acesso ao domínio Comercial + tenant | Commercial/CS; não publicado |
| Onboarding incompleto | Quais clientes ainda não concluíram onboarding? `clientes ativos com etapa de onboarding != concluída` | Empresa e processo; fotografia + aging | Objeto interno de onboarding ou propriedade HubSpot explicitamente governada; stage, started_at, completed_at, owner | Nenhum objeto/read model de onboarding confirmado | Atualização por evento ou job versionado; etapa nula é `indisponível`; RLS, permissão CS e auditoria | CS Ops; não publicado |
| Sem negócio ativo | Quais clientes não têm Deal ativo quando deveriam ter? `clientes em carteira sem associação a Deal aberto` | Empresa; fotografia | HubSpot Deal; pipeline/stage/is_closed; Deal↔Company | `vw_analytics_commercial_*` agrega Deals, sem semântica de carteira CS | Após sync comercial; associação não resolvida é indisponível; não gerar alerta por ausência de dados | Commercial/CS; não publicado |
| Risco operacional | Quais clientes cruzam sinais de risco governados? `risco = regra versionada sobre sinais disponíveis` | Empresa; fotografia com `calculated_at` | Somente componentes publicados: contato, tickets, renovação, onboarding e financeiro; cada componente precisa de origem | Não existe score/risk read model publicado | Cálculo server-side, versão e explicação obrigatórias; nulo propaga `indisponível`; revisão humana para ação | CS Ops; não publicado |
| Cobertura | Qual proporção da carteira tem CSM válido? `clientes com CSM / clientes ativos` | Tenant, CSM e carteira; fotografia | Company + regra de carteira + owner; status ativo definido pelo contrato | Não há denominador de carteira oficial | Atualização após Companies; denominador zero/indisponível não vira 0%; tenant/RLS | CS Ops; não publicado |
| Cadência | A carteira recebeu o contato esperado na cadência? `contatos válidos no intervalo / contatos esperados` | Empresa, CSM e cadência; janela definida por segmento | Regra interna de cadência + atividades HubSpot; activity_type, occurred_at, owner | Não há cadência/read model publicado | Frequência definida pela política; atividade sem vínculo fica fora e é auditada; permissão CS | CS Ops; não publicado |
| Health score | Qual é a saúde explicável do cliente? `score versionado = componentes ponderados publicados` | Empresa; fotografia, `calculated_at`, série histórica | Read model de health; componentes, pesos, versão, origem; associações com Company | Não existe `health_score` operacional publicado | Job/evento com frescor; componente nulo não pode ser silenciosamente zero; permissão CS, RLS, auditoria | CS Ops; não publicado |

## Contrato de health score

O primeiro contrato deverá publicar, por empresa e tenant:

- `score`, faixa/estado, `calculated_at`, `observed_at`, `effective_at`,
  `source_system`, `quality_status`, `model_version` e `stale_after`;
- componentes nomeados (por exemplo, contato, tickets, renovação, onboarding e
  financeiro), peso, valor observado, contribuição e evidência de origem;
- regra de nulo: componente ausente permanece ausente ou reduz a qualidade do
  score; nunca é convertido em zero sem política versionada;
- explicação legível, link/ID interno auditável e indicação de revisão humana;
- atualização idempotente, histórico append-only, tenant explícito, RLS,
  permissão por domínio, auditoria e teste cross-tenant.

Estados mínimos: `not_configured`, `partial`, `stale`, `empty`, `fresh` e
`error`. O frontend só renderiza o estado e os componentes retornados.

## Critérios de aceite para publicação

1. Existe uma view/read model ou RPC própria de CS com contrato versionado.
2. Cada métrica acima tem denominador, período, origem, frescor, nulo, owner e
   política de permissão documentados.
3. Há pgTAP para tenant/RLS/permissão, fixtures sem dados fabricados e testes de
   contrato do frontend.
4. O health score é explicável e revisável; nenhum alerta executa ação externa
   automaticamente.
5. O estado indisponível só é removido após validação de carga real autorizada.
