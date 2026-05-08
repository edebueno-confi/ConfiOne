# Knowledge Legacy Corpus Final Readiness Pack

## Objetivo

Consolidar o estado final de prontidao documental da Knowledge Base legada, apos o fechamento dos `58` artigos exportados do Octadesk.

Este pacote nao aprova, nao publica e nao substitui evidencia humana real. Ele define a fila operacional objetiva para a proxima etapa: validacao humana dos `8` candidatos publicos ja preparados.

## Estado final consolidado do corpus

| Indicador | Total | Status |
| --- | --- | --- |
| Total de artigos legados | `58` | corpus completo exportado do Octadesk |
| Artigos mapeados editorialmente | `58` | todos classificados |
| Candidatos publicos criados | `8` | prontos para validacao humana |
| Candidatos pendentes de validacao humana | `8` | todos sem aprovacao |
| Temas bloqueados por risco | `6` | fora da trilha publica sem novo recorte |
| Conteudos para manter internos | `17` | uso operacional interno ou governanca |
| Conteudos para revisao ou reescrita futura | `17` | dependem de novo lote ou revisao tecnica |
| Itens arquivados como legado | `9` | naming antigo, UI antiga ou escopo administrativo |
| Itens duplicados ou consolidados | `2` | consolidados no canônico de formas de estorno |

## Matriz final dos 8 candidatos

| Candidato | Categoria publica | Subcategoria futura opcional | Origem documental | Status atual | Produto | Suporte/CS | Pode publicar | Pendencia principal | Evidencia necessaria | Proximo passo operacional |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Como revisar os itens de uma solicitacao | Primeiros passos | Produtos da solicitacao | `docs/knowledge/KNOWLEDGE_P0_PUBLICATION_PREP.md` | pendente | pendente | pendente | nao | confirmar nomenclatura, fluxo e ausencia de exposicao interna | registro nominal de Produto e Suporte/CS com decisao explicita | coletar evidencias humanas no registro oficial |
| Como organizar motivos de troca e devolucao na operacao | Operacao de trocas e devolucoes | Motivos de troca | `docs/knowledge/KNOWLEDGE_MOTIVOS_TROCA_DEVOLUCAO_REWRITE.md` | pendente | pendente | pendente | nao | validar que o texto nao abre regras internas por motivo | registro nominal de Produto e Suporte/CS com decisao explicita | coletar evidencias humanas no registro oficial |
| Como enviar uma atualizacao de analise ao cliente | Primeiros passos | Comunicacao com cliente | `docs/knowledge/KNOWLEDGE_P0_PUBLICATION_PREP.md` | pendente | pendente | pendente | nao | validar tom B2B e expectativa operacional | registro nominal de Produto e Suporte/CS com decisao explicita | coletar evidencias humanas no registro oficial |
| Como reenviar uma comunicacao ao cliente | Operacao de trocas e devolucoes | Comunicacao com cliente | `docs/knowledge/KNOWLEDGE_P0_PUBLICATION_PREP.md` | pendente | pendente | pendente | nao | validar que o artigo nao transforma excecao operacional em regra publica | registro nominal de Produto e Suporte/CS com decisao explicita | coletar evidencias humanas no registro oficial |
| Formas de estorno disponiveis na operacao | Estornos e reembolsos | Formas de estorno | `docs/knowledge/KNOWLEDGE_ESTORNO_CANONICAL_REWRITE.md` | pendente | pendente | pendente | nao | validar fronteira com Pix, vale-compra, calculo, limites e politicas financeiras | registro nominal de Produto e Suporte/CS com decisao explicita | coletar evidencias humanas no registro oficial |
| Como o prazo de postagem afeta a operacao de troca e devolucao | Logistica reversa e postagem | Prazo logistico | `docs/knowledge/KNOWLEDGE_PRAZO_POSTAGEM_REWRITE.md` | pendente | pendente | pendente | nao | validar nomenclatura e comportamento atual do prazo | registro nominal de Produto e Suporte/CS com decisao explicita | coletar evidencias humanas no registro oficial |
| Como revisar uma pendencia de logistica reversa na operacao | Logistica reversa e postagem | Pendencias de postagem | `docs/knowledge/KNOWLEDGE_PENDENCIA_LOGISTICA_REVERSA_REWRITE.md` | pendente | pendente | pendente | nao | validar sintomas observaveis e limite do que pode ser orientado publicamente | registro nominal de Produto e Suporte/CS com decisao explicita | coletar evidencias humanas no registro oficial |
| O que revisar quando o CEP ou endereco impede a postagem | Erros conhecidos e troubleshooting | Endereco e CEP | `docs/knowledge/KNOWLEDGE_CEP_ENDERECO_POSTAGEM_REWRITE.md` | pendente | pendente | pendente | nao | validar que a orientacao nao vira procedimento manual padrao | registro nominal de Produto e Suporte/CS com decisao explicita | coletar evidencias humanas no registro oficial |

## Checklist unico de validacao humana

### Produto

- O comportamento descrito esta correto?
- A nomenclatura atual esta correta?
- O fluxo existe hoje?
- Ha dependencia de UI antiga?
- Ha risco tecnico, financeiro, logistico ou operacional?
- Algum trecho deve ficar interno?

### Suporte/CS

- O texto resolve duvida real de cliente B2B?
- A linguagem esta clara?
- O tom esta adequado?
- A categoria publica faz sentido?
- O texto nao expoe operacao interna?
- O texto nao cria expectativa indevida?

## Instrucao operacional de registro de evidencia

### Onde registrar

Toda evidencia humana deve ser registrada em:

- `docs/knowledge/KNOWLEDGE_HUMAN_APPROVAL_REGISTER.md`

### Formato obrigatorio

Cada decisao precisa registrar:

- nome do aprovador
- area: `Produto` ou `Suporte/CS`
- data
- artigo revisado
- versao ou documento revisado
- decisao
- observacao obrigatoria
- pendencias restantes
- fonte da evidencia

### Decisoes aceitas

- `aprovado`
- `aprovado com ajuste`
- `bloqueado`

### Aprovacao com ajuste

- nao libera publicacao
- exige ajuste documental
- exige nova rodada de revisao
- exige novo registro de evidencia apos o ajuste

### Bloqueio temporario

- mantem o artigo fora da publicacao
- deve registrar justificativa e condicao de reavaliacao
- nao pode ser tratado como pendencia simples sem dono

### Override governado

Override so pode ocorrer com registro explicito de:

- responsavel nominal
- area ou responsabilidade
- data
- justificativa
- risco aceito
- evidencia registrada
- escopo do override

Nenhum override pode liberar conteudo tecnicamente falso, segredo, token, credencial, dado sensivel, conteudo interno restrito ou promessa de funcionalidade inexistente.

### O que nao aprova

- silencio
- `ok` solto
- resposta ambigua
- aprovacao parcial sem artigo identificado
- comentario informal nao registrado no repositório

Nenhum artigo publica sem `Produto` + `Suporte/CS` aprovados com evidencia explicita.

## Nao mexer agora

Os temas abaixo devem permanecer fora de novas reescritas publicas ate haver novo recorte governado:

- Pix e estorno
- Calculo e limites de estorno
- Integracoes e gateway
- Integracao Correios
- Contrato, token e autorizacao tecnica
- Sellers e roteamento operacional sensivel
- Regras internas que bloqueiam logistica reversa
- Troubleshooting tecnico com credenciais, logs ou permissoes
- Guias de backoffice, parametrizacao e administracao da conta

## Proxima acao real

- o proximo passo nao e nova documentacao fragmentada
- o proximo passo e coletar evidencia humana real para os `8` candidatos
- sem evidencia, todos continuam `pendente`
- publicacao so deve virar lote depois da aprovacao explicita registrada em repositório

## Decisao final desta etapa

- o corpus legado completo esta pronto documentalmente
- os `8` candidatos publicos estao prontos para validacao humana
- nenhum artigo foi aprovado
- nenhuma aprovacao foi simulada
- nenhum artigo foi publicado
- nao houve alteracao de backend, Supabase, contracts, fixtures, RLS, permissoes, runtime ou UI
