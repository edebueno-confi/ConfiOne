# Technical Debt and Risks

## Riscos críticos

| Categoria | Severidade | Evidência | Impacto |
| --- | --- | --- | --- |
| Git/worktree | Alta | Arquivos modificados e não rastreados em lote aberto | Commit amplo pode misturar mudanças e dificultar auditoria |
| Produto/UX | Alta | Muitas telas parciais no shell interno | Usuário pode perceber sistema inconsistente/inacabado |
| Tenancy | Alta | Decisão pendente sobre tenant, grupo, entidade legal, empresa HubSpot | Modelagem incorreta de cliente e responsabilidades |
| Integrações | Média/alta | Scheduler/secrets/deploy externos pendentes | Sync pode funcionar localmente, mas falhar em ambiente real |
| Performance | Média | Histórico de timeout em fila e syncs longos | Risco de experiência ruim e workers excedendo limite |
| Dados | Média | Dados de seed/local e dados reais misturados em documentação histórica | Risco de tratar QA como produção |
| Segurança | Média | Grande superfície de admin/acesso | Necessário validar perfis reais antes de publicar |

## Dívidas visíveis

- Normalização visual global.
- Matriz de acessos por área/função.
- Contrato final de grupo econômico, entidade legal e negócios.
- Estratégia de publicação do MVP com módulos restritos.
- Observabilidade de syncs e workers.
- Tratamento de encoding em dados legados.

## Risco de execução

O novo protocolo exige autorização por macro-lote. Portanto, recomendações deste pacote não são autorização para implementar.
