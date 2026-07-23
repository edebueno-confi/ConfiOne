# Pending Decisions

## Decisões de produto

1. MVP imediato publica apenas Dashboard + Central de Ajuda ou shell interno completo restrito?
2. Qual é a taxonomia canônica para cliente, tenant, grupo econômico, entidade legal e empresa HubSpot?
3. Quais módulos internos devem ficar ocultos até maturidade real?
4. Qual é a matriz inicial de papéis por área/função?
5. O dashboard viewer deve ter acesso a quais rotas no primeiro release?
6. Central pública pode publicar todos os artigos importados ou precisa revisão editorial por categoria?
7. Produto/engenharia entra no MVP ou permanece backlog interno?

## Decisões técnicas

1. Quando aplicar migrations locais recentes em ambiente remoto?
2. Quando ativar scheduler remoto HubSpot/OMIE?
3. Qual estratégia incremental final para reduzir consumo de APIs?
4. Como versionar e auditar writes externos em HubSpot?
5. Como resolver fixture lenta de suporte/conhecimento?
6. Como tratar dados legados com encoding corrompido sem heurística insegura?

## Condição de parada

Qualquer decisão acima que altere navegação, modelo de dados, RLS, deploy ou exposição de módulos deve ser aprovada antes de implementação.
