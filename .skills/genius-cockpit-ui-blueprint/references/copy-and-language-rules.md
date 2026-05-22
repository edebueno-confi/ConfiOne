# Copy And Language Rules

## Vocabulário permitido

- Ticket
- Cliente
- Responsável
- Prioridade
- Severidade
- Categoria
- Evidência
- Conhecimento
- Nota interna
- Resposta pública
- Acionamento
- Indisponível
- Sem permissão
- Ação indisponível

## Vocabulário proibido

- backend
- Supabase
- RPC
- view
- tenant
- RLS
- policy
- storage
- bucket
- payload
- metadata
- source of truth
- work item
- read model
- contrato
- UUID
- path interno

## Regras gerais

- Preferir verbos curtos e acionáveis.
- Cortar explicações técnicas do corpo da interface.
- Traduzir erros de infraestrutura para linguagem operacional.
- Não repetir o mesmo contexto em título, subtítulo e tag.
- Não usar tom institucional ou genérico.

## Exemplos ruins e bons

Ruim:
`Falha ao executar RPC por violação de policy.`

Bom:
`Não foi possível concluir esta ação. Verifique sua permissão ou tente novamente.`

Ruim:
`Storage path indisponível.`

Bom:
`Arquivo indisponível para download.`

Ruim:
`Tenant sem membership elegível.`

Bom:
`Cliente sem acesso disponível neste contexto.`

Ruim:
`Metadata ausente.`

Bom:
`Informação indisponível.`

## Regras para botões

- Usar verbo + objeto curto quando a ação for específica.
- Usar rótulos simples: `Responder`, `Salvar`, `Vincular`, `Enviar`, `Reabrir`.
- Evitar botões vagos como `Executar`, `Prosseguir` ou `Confirmar` sem contexto.
- Quando a ação não existir, usar bloqueio honesto com `Ação indisponível`.

## Regras para estados vazios

- Explicar o que falta e, se houver, o próximo passo útil.
- Não culpar o usuário.
- Não inventar dado de exemplo.

Exemplos:

- `Nenhum ticket encontrado para este filtro.`
- `Nenhuma evidência vinculada até agora.`
- `Conhecimento indisponível neste contexto.`

## Regras para erro

- Dizer o que não foi possível concluir.
- Sugerir só a próxima ação realista.
- Não mostrar detalhes internos do backend.

Exemplos:

- `Não foi possível carregar os detalhes agora. Tente novamente.`
- `Sem permissão para acessar este conteúdo.`

## Regras para ação indisponível

- Ser explícito quando o produto ainda não suporta a ação.
- Não esconder botão se a ausência da ação for relevante para a tarefa.
- Não prometer comportamento futuro.

Exemplos:

- `Ação indisponível nesta versão.`
- `Upload indisponível nesta versão.`
- `Sem permissão para concluir esta ação.`
