# Knowledge Full Corpus Approval Collection Playbook

## Objetivo

- Padronizar a coleta de evidência humana real para grupos de artigos do corpus legado completo.
- Evitar que cada lote futuro precise reinventar template, critério de validação ou regra de registro.
- Garantir que nenhum artigo avance para publicação sem registro formal no repositório.

## Como coletar aprovação por grupo

1. Selecione o grupo de trabalho por prioridade ou taxonomia pública.
2. Confirme que todos os artigos do grupo já estão mapeados no pacote consolidado e no intake geral.
3. Se o grupo envolver duplicidade confirmada, leia primeiro o plano documental específico de consolidação antes de pedir aprovação humana.
4. Envie o template de `Produto` com o conjunto de artigos e a versão documental revisada.
5. Envie o template de `Suporte/CS` com o mesmo conjunto e o contexto operacional de uso público.
6. Registre cada resposta no `KNOWLEDGE_HUMAN_APPROVAL_REGISTER.md` antes de mudar o status do artigo.
7. Se houver aprovação parcial, mantenha pendente tudo o que não tiver evidência explícita e abra nova rodada apenas para os artigos remanescentes.

Para o cluster `Formas de Estorno`, usar como referência prévia:
- `docs/knowledge/KNOWLEDGE_ESTORNO_CONSOLIDATION_PREP.md`
- `docs/knowledge/KNOWLEDGE_ESTORNO_CANONICAL_REWRITE.md`
- `docs/knowledge/KNOWLEDGE_ESTORNO_SENSITIVE_SUBCLUSTERS.md`
- `docs/knowledge/KNOWLEDGE_VALE_COMPRA_SUBCLUSTER_PREP.md`
- `docs/knowledge/KNOWLEDGE_PIX_ESTORNO_SUBCLUSTER_PREP.md`
- `docs/knowledge/KNOWLEDGE_REGRAS_MOTIVO_SUBCLUSTER_PREP.md`
- `docs/knowledge/KNOWLEDGE_MOTIVOS_TROCA_DEVOLUCAO_REWRITE.md`
- `docs/knowledge/KNOWLEDGE_ESTORNO_TROUBLESHOOTING_SUBCLUSTER_PREP.md`
- `docs/knowledge/KNOWLEDGE_ESTORNO_CALCULO_LIMITES_SUBCLUSTER_PREP.md`
- `docs/knowledge/KNOWLEDGE_INTEGRACOES_GATEWAY_SUBCLUSTER_PREP.md`
- `docs/knowledge/KNOWLEDGE_ESTORNO_SENSITIVE_CLUSTERS_CLOSURE.md`

Para o cluster `Logística reversa e postagem`, usar como referência prévia:
- `docs/knowledge/KNOWLEDGE_LOGISTICA_POSTAGEM_CLUSTER_PREP.md`
- `docs/knowledge/KNOWLEDGE_PRAZO_PENDENCIAS_POSTAGEM_SUBCLUSTER_PREP.md`
- `docs/knowledge/KNOWLEDGE_PRAZO_POSTAGEM_REWRITE.md`

## Template único para Produto

```md
Assunto: revisão Produto - pacote de artigos da Knowledge Base

Estamos validando o seguinte grupo de artigos candidatos para futura publicação pública na Central de Ajuda:
- [listar artigos e versões revisadas]

Para cada artigo, por favor confirmar:
1. o comportamento descrito está correto?
2. a nomenclatura atual está correta?
3. o fluxo descrito existe hoje?
4. há dependência de UI antiga?
5. há promessa de funcionalidade inexistente?
6. há risco técnico ou operacional que impeça exposição pública?

Decisão esperada por artigo: aprovado, aprovado com ajuste, pendente, bloqueio temporário, bloqueio com possibilidade de override ou bloqueio definitivo.
```

## Template único para Suporte/CS

```md
Assunto: revisão Suporte/CS - pacote de artigos da Knowledge Base

Estamos validando o seguinte grupo de artigos candidatos para futura publicação pública na Central de Ajuda:
- [listar artigos e versões revisadas]

Para cada artigo, por favor confirmar:
1. o texto resolve uma dúvida real de cliente B2B?
2. a linguagem está clara para cliente B2B?
3. o artigo evita tom B2C e foco em shopper final?
4. o texto evita expor operação interna ou regra restrita?
5. o artigo evita criar expectativa indevida de atendimento ou funcionalidade?
6. a categoria pública proposta faz sentido?

Decisão esperada por artigo: aprovado, aprovado com ajuste, pendente, bloqueio temporário, bloqueio com possibilidade de override ou bloqueio definitivo.
```

## Regra para evidência informal

- WhatsApp, Slack, e-mail ou reunião podem servir como fonte de evidência.
- A evidência só vale depois de transcrita ou resumida no `KNOWLEDGE_HUMAN_APPROVAL_REGISTER.md`.
- Silêncio não aprova.
- `ok` sem contexto não aprova.
- Aprovação ambígua não aprova.
- A resposta precisa mencionar claramente o artigo ou o pacote revisado.

## Regra para aprovação parcial

- Aprovação parcial não libera o pacote inteiro.
- Apenas os artigos com `Produto` e `Suporte/CS` explicitamente aprovados podem avançar para lote futuro de publicação.
- Artigos com `aprovado com ajuste` exigem ajuste, nova revisão e novo registro.

## Regra para bloqueio e override

- `bloqueio temporário`: mantém o artigo fora da publicação até nova revisão.
- `bloqueio com possibilidade de override`: só pode avançar com decisão explícita de governança, obedecendo o registro de override já definido no repositório.
- `bloqueio definitivo`: mantém o artigo fora da publicação.
- Nenhum override pode liberar segredo, token, dado sensível, informação tecnicamente falsa, conteúdo interno restrito, exposição operacional indevida ou promessa de funcionalidade inexistente.

## Regra para manter artigo fora de publicação

- Artigos internos, obsoletos, ambíguos ou sensíveis devem permanecer fora de publicação mesmo quando forem úteis para operação interna.
- Se houver dúvida sobre elegibilidade pública, o artigo permanece `pendente` ou `bloqueado` até nova decisão humana explícita.
- Os dois artigos fora da trilha atual por bloqueio técnico continuam fora de qualquer pacote de publicação até revisão específica de Produto.
