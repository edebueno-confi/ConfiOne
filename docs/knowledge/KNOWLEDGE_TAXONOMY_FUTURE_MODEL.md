# KNOWLEDGE_TAXONOMY_FUTURE_MODEL.md

## Objetivo
Registrar a evolucao futura recomendada da taxonomia da Knowledge Base, sem implementar contrato, backend, banco ou UI nesta fase.

## Modelo futuro recomendado
- categoria
- subcategoria opcional
- artigo

## Regras conceituais
- subcategoria deve ser opcional
- artigo pode existir apenas com categoria
- subcategoria nao deve ser obrigatoria para publicacao
- subcategoria nao deve ser simulada no frontend sem contrato real
- categoria continua suficiente para MVP enquanto a base for pequena
- implementacao futura exige auditoria do modelo atual, contrato, backend e UI

## Exemplos conceituais

### Operacao de trocas e devolucoes
- Motivos de troca
- Produtos da solicitacao
- Comunicacao com cliente

### Logistica reversa e postagem
- Correios
- Autorizacao de postagem
- Codigo de postagem

### Estornos e reembolsos
- Formas de estorno
- PIX
- Vale-compra
- Integracao VTEX

### Integracoes
- VTEX
- Shopify
- Wake
- APIs

## Regras de uso futuro
- categoria continua sendo o agrupador minimo oficial
- subcategoria so deve ser materializada quando houver beneficio real de navegacao, curadoria e manutencao
- nem toda categoria precisara de subcategoria
- um artigo pode ficar diretamente abaixo da categoria quando a base ainda for enxuta

## Guardrails de implementacao futura
- nao criar subcategoria no banco sem contrato explicito
- nao simular subcategoria em frontend ou Help Center sem backend e contrato correspondentes
- nao mover artigos ja publicados para nova hierarquia sem auditoria editorial e operacional
- revisar impacto em:
  - Admin Knowledge
  - Central Publica de Ajuda
  - indexacao futura
  - filtros e navegacao

## Estado atual
- categoria + artigo continuam suficientes para o MVP atual
- subcategoria opcional fica registrada apenas como direcao futura de governanca e taxonomia
- a aplicacao conceitual desse modelo sobre o corpus legado completo ficou registrada em:
  - `docs/knowledge/LEGACY_CORPUS_FULL_CURATION_PACK.md`
