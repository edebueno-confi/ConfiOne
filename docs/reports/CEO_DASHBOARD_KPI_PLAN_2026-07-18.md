# Plano da visão executiva e ciclos de KPI — 2026-07-18

## Objetivo

Transformar o Dashboard Gerencial em uma visão de decisão para o CEO: crescimento,
receita, retenção, risco operacional, inadimplência e qualidade dos dados, com
drill-down até a empresa responsável pela ação.

## Estado observado

- HubSpot já alimenta Comercial e Suporte/CS por snapshots no backend.
- O pipeline de tickets de Suporte permanece fora do escopo de reestruturação.
- O read model financeiro já preserva histórico de Contas a Receber importadas do
  OMIE, incluindo situação, saldo, aging e provenance.
- A API read-only do OMIE está preparada, mas ainda depende das credenciais do
  Financeiro e de reconciliação contra a exportação.
- A visão CEO atual mostra KPIs agregados, mas ainda não lista empresas em risco,
  não cruza inadimplência com CSM/MRR e não expõe cobertura/frescor das fontes.

## Prioridade do próximo ciclo

### Ciclo 1 — Cliente em risco financeiro

Criar um read model backend que relacione contas a receber OMIE com empresas
HubSpot usando, nesta ordem:

1. CNPJ normalizado;
2. identificador HubSpot preservado na importação, quando existir;
3. nome normalizado somente como fallback, com nível de confiança.

Cada correspondência deve guardar origem, identificador externo, hash/execução,
data de referência, qualidade e motivo quando não houver correspondência.

O painel deve apresentar: cliente, CSM, MRR, situação contratual, valor vencido,
títulos vencidos, maior atraso, faixa de aging, tickets abertos e link para o
registro HubSpot. Correspondências ambíguas ficam visíveis em uma fila de revisão;
não entram silenciosamente no total reconciliado.

### Ciclo 2 — Alertas executivos e risco composto

Adicionar uma lista priorizada de alertas, com regras explicáveis:

- financeiro: vencido, vencendo hoje, saldo relevante ou aging elevado;
- receita: MRR sem contrato, MRR zero, churn/bloqueio/pausa ou sem CSM;
- suporte: ticket aberto de alta prioridade e violação de SLA, preservando o
  pipeline e os estágios atuais do Suporte;
- dados: fonte desatualizada, empresa sem vínculo ou registro ambíguo.

O risco não deve ser um número opaco. Cada empresa deve exibir os sinais que
geraram a prioridade e a ação recomendada.

### Ciclo 3 — Redesign do dashboard CEO

Ordem da tela:

1. saúde do negócio: MRR/base ativa, pipeline aberto, receita ganha, clientes em
   risco e saldo vencido;
2. alertas acionáveis por cliente;
3. tendências: MRR/receita, novos ganhos, perdas, pipeline, inadimplência e
   tickets;
4. distribuição por CSM, carteira, cluster, status de contrato e aging;
5. qualidade das fontes e data da última atualização.

Filtros globais: semana, mês atual, trimestre atual, trimestre passado, ano,
ano passado, todo o período e personalizado; CSM, status do cliente, contrato,
situação financeira, cluster, prioridade e fonte. A visão executiva deve abrir
sempre no mês atual e refletir o preset selecionado na combobox.

### Ciclo 4 — Integrações e governança

- Usar o XLSX exportado do OMIE como fonte temporária durante o fim de semana.
- Na segunda-feira, configurar App Key/App Secret do OMIE somente no ambiente
  server-side e executar a primeira consulta read-only de Contas a Receber.
- Comparar a primeira resposta da API com o XLSX histórico antes de promovê-la
  como fonte primária.
- Manter o XLSX como fallback controlado até a reconciliação passar; ambos devem
  alimentar o mesmo read model e preservar o histórico, sem duplicar títulos.
- Atualizar HubSpot somente dentro do escopo de CS definido; não alterar o
  funcionamento atual dos tickets de Suporte.
- Criar pipelines e views de CS depois da validação do modelo de risco.
- Documentar treinamento de agentes, CSMs e gerente de CS, com regra de que o
  HubSpot é a fonte operacional de verdade após a migração.

## Catálogo executivo proposto

| KPI | Fonte | Regra | Estado |
|---|---|---|---|
| MRR/base ativa | HubSpot CS | Soma de MRR de empresas ativas, com cobertura explícita | disponível com caveat |
| Pipeline aberto | HubSpot Deals | Soma de valor em estágios não fechados | disponível |
| Receita ganha/conversão | HubSpot Deals | Ganhos e perdas por metadado do estágio | disponível |
| Clientes em risco | HubSpot + OMIE + Tickets | União de sinais explicáveis por empresa | próximo ciclo |
| Saldo vencido | OMIE | Saldo de títulos classificados como vencidos; cancelados separados | disponível agregado |
| Inadimplência por cliente | OMIE + HubSpot | Soma por empresa reconciliada e aging | próximo ciclo |
| Saúde de Suporte | HubSpot Tickets | Abertos, alta prioridade, SLA e backlog | parcial |
| Retenção/NRR/churn | HubSpot + histórico | Requer snapshots mensais confiáveis de MRR e eventos | condicionado |
| Margem/caixa/DRE | OMIE | Requer Contas a Pagar, fluxo e regras financeiras | futuro |
| Entrega de Produto | GitHub | throughput, lead time, releases e bugs | futuro |

## Guardrails

- Não tratar todo status diferente de `Recebido` como inadimplência: cancelado e
  recebido parcialmente permanecem categorias distintas.
- Não calcular NRR, churn ou margem sem histórico e definição financeira aprovados.
- Toda métrica deve exibir fonte, cálculo, frescor e caveat por meio do hint.
- Totais reconciliados devem excluir ou destacar linhas sem correspondência segura.
- Ausência de dados deve aparecer como indisponível, nunca como zero fabricado.

## Critério de conclusão da próxima fase

O CEO consegue abrir o dashboard, selecionar um período, identificar o valor
vencido, ver quais clientes o compõem, saber o CSM responsável, distinguir dado
confirmado de pendência de reconciliação e navegar até a origem sem alterar o
fluxo atual de Suporte.
