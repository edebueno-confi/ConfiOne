# Revisão de finalização do Dashboard Gerencial — 2026-07-20

## Resultado

O módulo foi revisado com dados reais do cache local, em sessão administrativa,
nos modos desktop e viewport móvel. As abas Visão Executiva, Comercial, CS /
Suporte, Financeiro e Logs carregaram sem erros de console. O filtro de período
foi aplicado na Visão Executiva e preservado ao navegar para Comercial.

## Correções aplicadas

- O papel `dashboard_viewer` agora pode resolver o destino inicial
  `/admin/analytics` e acessar somente `/admin/analytics` e
  `/admin/customer-portal` dentro do namespace administrativo.
- O destino padrão de um usuário `dashboard_viewer` passou a ser o Dashboard
  Gerencial, em vez de resultar em acesso negado.
- A navegação restrita continua exibindo somente Dashboard operacional, Área do
  cliente e Central de ajuda.
- A função privada `app_private.normalize_company_name(text)` recebeu ACL
  explícita e deixou de herdar execução para clientes.
- O teste de integração OMIE passou a validar a regra operacional correta:
  integração habilitada exige credencial; sem credencial, permanece desabilitada.

## Observações de produto e KPI

- O mês atual é o padrão inicial.
- O histórico executivo compara o período atual com período anterior de mesma
  duração; variações positivas e negativas usam cores semânticas.
- Saldo vencido e clientes com alerta usam tons de risco; dados financeiros
  informam se a origem é API ou fallback de planilha.
- Tickets por status são consolidados por nome, com detalhamento por pipeline;
  responsáveis mostram a distribuição por pipeline para evitar interpretações
  duplicadas.
- A fila de reconciliação permanece agrupada por cliente, preservando títulos
  financeiros nos detalhes.

## Validação objetiva

- `npm run supabase:test:db`: 62 arquivos, 1.164 testes — PASS.
- `npm run web:typecheck`: PASS.
- `npm run web:build`: PASS; somente alertas conhecidos de chunks acima de 500 kB.
- `npm run supabase:qa:local-dashboard-viewer`: fixture local criado e papel
  confirmado.
- QA browser local: login viewer, redirecionamento para `/admin/analytics`,
  menu restrito, bloqueio de `/admin/settings`, acesso a
  `/admin/customer-portal`, abas financeiras/logs, filtro compartilhado,
  viewport móvel sem overflow horizontal e console sem erros.

## Pendências externas

- Criar/convocar a conta real de Maurício depende do fluxo seguro de convite;
  nenhuma senha real foi gravada.
- Publicar migrations/Edge Functions e configurar cron/secret remoto exige
  autorização de ambiente externo.
- A origem específica widget/formulário/WhatsApp só pode ser afirmada quando o
  HubSpot expuser os campos de canal de entrada; o painel informa essa limitação.

## Estado local após validação

O comando oficial `supabase:verify` recria deliberadamente o banco local para
validar migrations em estado limpo. Isso removeu o cache sincronizado e os
usuários locais anteriores; não houve alteração remota. Os fixtures locais de
administrador e `dashboard_viewer` foram recriados depois da validação. Para
repopular empresas, deals e tickets, é necessária uma nova sincronização do
HubSpot com a credencial local/remota autorizada.
