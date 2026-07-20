# Genius Support OS — Especificação viva

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
- Fonte operacional única do CS após o corte: HubSpot. A planilha atual do CS
  será staging temporário de migração, reconciliação e auditoria; não haverá
  operação concorrente permanente entre planilha e HubSpot.
- Integração HubSpot existente: Edge Function `hubspot-sync`, tabelas locais
  `hubspot_*`, views `vw_analytics_*` e configuração de pipes em
  `analytics_source_config`.
- Fontes financeiras e operacionais adicionais: planilhas CSV/XLSX importadas
  manualmente; Omie será adapter read-only configurável quando as credenciais
  forem disponibilizadas.

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
- modo manual para planilha enquanto o conector direto não estiver habilitado.

## Dashboard gerencial

O dashboard deve cobrir, progressivamente, Comercial, CS, Suporte, Produto,
Financeiro e outras áreas aprovadas. Cada métrica precisa declarar fonte,
grão, período, timezone, fórmula, cobertura, frescor e qualidade. O frontend
renderiza contratos backend; não escolhe pipe atual, soma dados brutos nem
transforma status financeiro em inadimplência por heurística local.

## Fontes conhecidas

- HubSpot: Deals e Tickets; a auditoria de 2026-07-18 encontrou 2.015 Deals,
  incluindo 866 em `Pipe de Vendas` e 1.148 em `Piloto Aftersale`, além de 22
  pipes de Tickets.
- CS: planilha consolidada com abas `Dashboard_CS`, `BD_Clientes`, `Clusters`,
  `Contato_Inicial_CS` e `Dash_Data`.
- Comercial: planilha com abas diárias variáveis; o parser existente não assume
  nome fixo ou posição fixa de colunas.
- Omie: exportação de Contas a Receber recebida em XLSX; API oficial disponível,
  mas sem credenciais no momento.
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
