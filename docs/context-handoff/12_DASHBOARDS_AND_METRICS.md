# Dashboards and Metrics

## Dashboard gerencial

Rota principal: `/admin/analytics`.

Objetivo: consolidar visão executiva, comercial, CS/suporte, financeiro, logs e configuração.

## Fontes

- HubSpot: empresas, negócios, tickets, owners, pipelines, atividades quando disponível.
- OMIE: títulos financeiros, vencidos, a vencer, recebidos e reconciliação com HubSpot.
- Planilhas: fallback/migração, não fonte futura preferencial.
- Octadesk: origem de conteúdo da central, não fonte operacional de métricas gerenciais.

## Estado atual

O dashboard é um dos módulos mais próximos de release. Foi validado localmente com smoke autenticado, mas precisa revisão final de:

- duplicidade de métricas;
- clareza de origem/cálculo;
- semântica de cores;
- filtros globais;
- relatórios PDF/PNG;
- responsividade;
- performance de RPCs executivas.

## Métricas observadas

- Receita/pipeline comercial.
- Conversão comercial.
- Deals por estágio/pipeline/responsável.
- Tickets por status/responsável/pipeline.
- Títulos financeiros vencidos e reconciliação.
- Qualidade de dados: correspondência, ambiguidade e filas.

## Ponto de decisão

Para o CEO, a tela deve priorizar evolução, risco, urgência e próximas ações. Evitar repetir cards superiores em gráficos sem insight adicional.

## Origem objetiva das métricas

- Dados reais/cache local: empresas, deals, tickets, owners e pipelines vindos de HubSpot quando sincronizados para tabelas/cache locais.
- Dados reais/cache local: títulos financeiros vindos da API OMIE quando sincronizados.
- Seed/fixture local: dados de QA usados para rotas internas e validação visual.
- Planilhas: fallback histórico/migração; não devem ser tratadas como fonte operacional futura quando HubSpot/OMIE estiverem ativos.
- Mock: não foi identificado como fonte autorizada para métricas gerenciais no pacote; qualquer valor visual sem contrato backend deve ser tratado como risco até auditoria específica.

## Teste visual V2

- `06-management-dashboard-desktop.png`: visão desktop 1440x900.
- `07-management-dashboard-medium.png`: largura intermediária 1024x768.
- `22-dashboard-empty-period-desktop.png`: tentativa de recorte futuro para observar estado vazio/sem dados.
