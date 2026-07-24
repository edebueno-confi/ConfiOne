# Continuação da migração CS Ops → HubSpot — 2026-07-20

## Estado confirmado

- A planilha CS Ops continua sendo staging temporário; o HubSpot é o destino
  operacional e a futura fonte única de verdade.
- A aba `BD_Clientes` possui 606 linhas, com 593 clientes ativos na leitura
  auditada.
- A reconciliação registrada encontrou 307 matches únicos, 19 casos ambíguos e
  280 clientes sem correspondência segura.
- Lotes anteriores atualizaram MRR de empresas correspondidas; o histórico,
  ledger e valores antes/depois estão preservados.
- O backend já possui `hubspot-cs-migration`, com dry-run, aplicação confirmada,
  criação/atualização de empresas e ledger por linha.
- A criação dos pipelines de CS já foi registrada:
  `CS | Onboarding e Migração` e `CS | Gestão de Carteira`.
- Tickets e pipelines atuais de Suporte permanecem fora da migração.

## Lacunas técnicas encontradas

1. A migração já existe no backend, mas não há uma superfície completa no
   Dashboard para listar o lote, executar dry-run, revisar contagens e aplicar
   a carga.
2. O mapper atual cobre nome, CNPJ, MRR, tipo de MRR, contrato e CSM, mas ainda
   não há propriedades HubSpot confirmadas para cluster, carteira, health,
   prioridade, modelo/frequência de atendimento e status de migração.
3. A atualização do status do cliente precisa usar somente valores válidos do
   enum HubSpot; `Ativo` não pode ser enviado diretamente como valor de enum.
4. Os 19 casos ambíguos precisam permanecer em revisão; não devem ser criados,
   atualizados ou unificados por semelhança.
5. Os 280 casos sem correspondência são candidatos a criação controlada, nunca
   criação cega. A criação deve revalidar CNPJ ao vivo antes do POST e guardar
   o novo ID HubSpot no ledger.

## Plano de conclusão

### Ciclo 1 — fechar o contrato de dados

- Inventariar propriedades existentes e seus valores válidos.
- Criar, somente após validação do contrato, as propriedades de CS que não
  existirem, com nomes estáveis e descrição de origem.
- Definir a tabela de mapeamento da planilha para Company e a regra de
  precedência: planilha prevalece quando a identidade for segura.
- Manter Suporte/Tickets fora deste ciclo.

### Ciclo 2 — tornar a migração operável no Dashboard

- Exibir os lotes CS Ops importados.
- Adicionar dry-run com contagem de atualizar, criar, ambíguos, rejeitados e
  ignorados.
- Exibir amostra e filtros por classificação, CSM, cluster e carteira.
- Exigir confirmação explícita antes da aplicação e mostrar o ledger gerado.

### Ciclo 3 — executar a carga segura

- Rodar dry-run de todas as 606 linhas.
- Aplicar primeiro os 307 matches únicos, em lotes pequenos e idempotentes.
- Criar os 280 não encontrados somente após rechecagem ao vivo de CNPJ/nome.
- Manter os 19 ambíguos fora da escrita até decisão registrada.
- Sincronizar o cache HubSpot após cada lote e validar IDs/valores posteriores.

### Ciclo 4 — concluir a carteira de CS

- Associar CSMs aos owners HubSpot confirmados.
- Criar/atualizar deals nos pipelines de CS somente para onboarding/migração e
  gestão de carteira, sem tocar nos pipelines de suporte.
- Definir o vínculo do produto After Sale e dos responsáveis locais antes de
  popular `vw_cs_customer_portfolio`.
- Registrar falhas, conflitos e exceções no Dashboard e no ledger.

### Ciclo 5 — corte operacional

- Reexecutar sincronização e auditoria de qualidade.
- Confirmar cobertura de empresa, CSM, MRR, contrato, health e carteira.
- Congelar a planilha como evidência histórica.
- Atualizar o guia operacional para orientar CS, CSMs e gerente de CS a operar
  exclusivamente no HubSpot.

## Critério de conclusão

Nenhuma linha ativa fica sem classificação; toda empresa criada ou atualizada
possui ID HubSpot, origem, método de correspondência e resultado auditável; os
19 casos ambíguos possuem decisão explícita; e nenhum ticket/pipeline de
Suporte é alterado pelo ciclo de CS.
