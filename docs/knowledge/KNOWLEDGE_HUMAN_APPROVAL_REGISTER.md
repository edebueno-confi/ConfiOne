# KNOWLEDGE_HUMAN_APPROVAL_REGISTER.md

## Objetivo
Manter o registro oficial de aprovacoes humanas reais da trilha editorial da Knowledge Base, artigo por artigo, sem simular aprovacao e sem confundir preparo documental com autorizacao de publicacao.

## Regras deste registro
- este documento nao aprova artigo por si so
- ausencia de evidencia equivale a `pendente`
- aprovacao parcial nao libera publicacao
- aprovacao com ajuste exige novo registro apos o ajuste
- bloqueio de Produto ou Suporte/CS exige classificacao governada do tipo de bloqueio
- so pode entrar em lote de publicacao quando Produto e Suporte/CS estiverem aprovados com evidencia explicita

## Evidencia minima obrigatoria
Cada aprovacao, aprovacao com ajuste ou bloqueio deve registrar:
- nome do aprovador
- area: `Produto` ou `Suporte/CS`
- data
- artigo aprovado
- versao ou documento revisado
- decisao:
  - `aprovado`
  - `aprovado com ajuste`
  - `bloqueado`
- observacao obrigatoria
- pendencias restantes
- fonte da evidencia, por exemplo:
  - comentario de PR
  - reuniao registrada
  - ticket interno
  - mensagem formal
  - documento assinado

Quando a decisao for `bloqueado`, registrar tambem:
- tipo de bloqueio:
  - `bloqueio temporario`
  - `bloqueio com possibilidade de override`
  - `bloqueio definitivo`
- justificativa do bloqueio
- condicao de reavaliacao, quando existir

## Template de evidencia por aprovador

```md
- aprovador:
- area:
- data:
- artigo:
- versao/documento revisado:
- decisao:
- observacao obrigatoria:
- pendencias restantes:
- fonte da evidencia:
- tipo de bloqueio:
- justificativa do bloqueio:
- condicao de reavaliacao:
```

## Regra de avancao
- `aprovado` + `aprovado`: pode seguir para lote futuro de publicacao
- `aprovado com ajuste`: exige ajuste e novo registro de revisao antes de qualquer avancao
- `pendente`: nao publica
- `bloqueio temporario`: nao publica ate nova revisao
- `bloqueio com possibilidade de override`: so avanca com decisao explicita de governanca
- `bloqueio definitivo`: nao publica
- aprovacao parcial nao libera publicacao
- ausencia de evidencia equivale a `pendente`

## Override editorial ou de governanca
Override so pode ocorrer com registro explicito de:
- responsavel nominal
- area ou responsabilidade
- data
- justificativa
- risco aceito
- evidencia registrada
- escopo do override

### Limites do override
Nenhum override pode permitir publicacao de:
- segredo
- token
- dado sensivel
- informacao tecnicamente falsa
- conteudo interno restrito
- orientacao que exponha operacao interna indevida
- promessa de funcionalidade inexistente

## Registro atual dos artigos P0 pendentes

### Matriz executiva

| Artigo | Categoria publica | Produto | Suporte/CS | Decisao final atual | Pode publicar |
| --- | --- | --- | --- | --- | --- |
| Como revisar os itens de uma solicitacao | Primeiros passos | pendente | pendente | pendente | nao |
| Como organizar motivos de troca e devolucao na operacao | Operacao de trocas e devolucoes | pendente | pendente | pendente | nao |
| Como enviar uma atualizacao de analise ao cliente | Primeiros passos | pendente | pendente | pendente | nao |
| Como reenviar uma comunicacao ao cliente | Operacao de trocas e devolucoes | pendente | pendente | pendente | nao |

## Fichas por artigo

### 1. Como revisar os itens de uma solicitacao
- titulo final candidato: `Como revisar os itens de uma solicitacao`
- categoria publica: `Primeiros passos`
- status Produto: `pendente`
- status Suporte/CS: `pendente`
- pode publicar: `nao`
- decisao final atual: `pendente`

#### Evidencia Produto
```md
- aprovador:
- area: Produto
- data:
- artigo: Como revisar os itens de uma solicitacao
- versao/documento revisado: docs/knowledge/KNOWLEDGE_P0_PUBLICATION_PREP.md
- decisao:
- observacao obrigatoria:
- pendencias restantes:
- fonte da evidencia:
```

#### Evidencia Suporte/CS
```md
- aprovador:
- area: Suporte/CS
- data:
- artigo: Como revisar os itens de uma solicitacao
- versao/documento revisado: docs/knowledge/KNOWLEDGE_P0_PUBLICATION_PREP.md
- decisao:
- observacao obrigatoria:
- pendencias restantes:
- fonte da evidencia:
```

### 2. Como organizar motivos de troca e devolucao na operacao
- titulo final candidato: `Como organizar motivos de troca e devolucao na operacao`
- categoria publica: `Operacao de trocas e devolucoes`
- status Produto: `pendente`
- status Suporte/CS: `pendente`
- pode publicar: `nao`
- decisao final atual: `pendente`

#### Evidencia Produto
```md
- aprovador:
- area: Produto
- data:
- artigo: Como organizar motivos de troca e devolucao na operacao
- versao/documento revisado: docs/knowledge/KNOWLEDGE_P0_PUBLICATION_PREP.md
- decisao:
- observacao obrigatoria:
- pendencias restantes:
- fonte da evidencia:
```

#### Evidencia Suporte/CS
```md
- aprovador:
- area: Suporte/CS
- data:
- artigo: Como organizar motivos de troca e devolucao na operacao
- versao/documento revisado: docs/knowledge/KNOWLEDGE_P0_PUBLICATION_PREP.md
- decisao:
- observacao obrigatoria:
- pendencias restantes:
- fonte da evidencia:
```

### 3. Como enviar uma atualizacao de analise ao cliente
- titulo final candidato: `Como enviar uma atualizacao de analise ao cliente`
- categoria publica: `Primeiros passos`
- status Produto: `pendente`
- status Suporte/CS: `pendente`
- pode publicar: `nao`
- decisao final atual: `pendente`

#### Evidencia Produto
```md
- aprovador:
- area: Produto
- data:
- artigo: Como enviar uma atualizacao de analise ao cliente
- versao/documento revisado: docs/knowledge/KNOWLEDGE_P0_PUBLICATION_PREP.md
- decisao:
- observacao obrigatoria:
- pendencias restantes:
- fonte da evidencia:
```

#### Evidencia Suporte/CS
```md
- aprovador:
- area: Suporte/CS
- data:
- artigo: Como enviar uma atualizacao de analise ao cliente
- versao/documento revisado: docs/knowledge/KNOWLEDGE_P0_PUBLICATION_PREP.md
- decisao:
- observacao obrigatoria:
- pendencias restantes:
- fonte da evidencia:
```

### 4. Como reenviar uma comunicacao ao cliente
- titulo final candidato: `Como reenviar uma comunicacao ao cliente`
- categoria publica: `Operacao de trocas e devolucoes`
- status Produto: `pendente`
- status Suporte/CS: `pendente`
- pode publicar: `nao`
- decisao final atual: `pendente`

#### Evidencia Produto
```md
- aprovador:
- area: Produto
- data:
- artigo: Como reenviar uma comunicacao ao cliente
- versao/documento revisado: docs/knowledge/KNOWLEDGE_P0_PUBLICATION_PREP.md
- decisao:
- observacao obrigatoria:
- pendencias restantes:
- fonte da evidencia:
```

#### Evidencia Suporte/CS
```md
- aprovador:
- area: Suporte/CS
- data:
- artigo: Como reenviar uma comunicacao ao cliente
- versao/documento revisado: docs/knowledge/KNOWLEDGE_P0_PUBLICATION_PREP.md
- decisao:
- observacao obrigatoria:
- pendencias restantes:
- fonte da evidencia:
```

## Resultado atual do registro
- nenhum artigo foi aprovado
- os quatro artigos `P0` seguem pendentes
- nenhuma aprovacao foi simulada
- nenhum artigo foi publicado
- todos os quatro artigos continuam pendentes por ausencia de evidencia explicita de Produto e Suporte/CS
