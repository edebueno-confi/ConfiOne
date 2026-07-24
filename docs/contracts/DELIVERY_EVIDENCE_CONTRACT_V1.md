# Delivery Evidence Contract V1

## Objetivo

Definir evidência mínima para declarar que um lote foi entregue, validado ou pronto para avaliação.

## MUST

- Toda entrega deve informar escopo, arquivos alterados, validações e limitações.
- Validação deve ser proporcional ao risco da mudança.
- Falhas conhecidas devem ser registradas sem mascaramento.
- Mudanças visuais devem ter evidência visual.
- Mudanças de dados/backend devem ter teste, query, migration dry-run ou validação local.
- Mudanças de integração devem registrar fonte, endpoint/função, resultado e limite.
- Estado Git deve ser reportado ao fechar lote.

## SHOULD

- Separar "feito", "validado" e "atenção".
- Usar relatório delta para macro-lotes.
- Incluir critério de aceite operacional.
- Capturar antes/depois quando a mudança for visual ou de fluxo.

## MUST NOT

- Não declarar conclusão sem evidência.
- Não confundir build passando com validação funcional.
- Não omitir falha herdada relevante.
- Não dizer que upload, deploy, sync ou migração ocorreu sem confirmação objetiva.
- Não mascarar limitação externa como sucesso local.

## Critérios de aceite

- Um revisor consegue entender o que mudou, por quê, como foi validado e o que falta.
- Evidências são reproduzíveis ou rastreáveis.
- Limitações estão explícitas.
- Nenhuma ação externa sensível foi executada sem autorização.

## Evidências obrigatórias por tipo

| Tipo | Evidência mínima |
| --- | --- |
| Documentação | lista de arquivos e `git diff --check` |
| Frontend | build/typecheck ou teste aplicável, mais screenshot quando visual |
| Backend/Supabase | migration/teste pgTAP/query local ou justificativa |
| Integração | logs/status da função, volume processado e erro conhecido |
| Upload externo | confirmação visual ou listagem no destino |

## Condições de reprovação

- Relatório sem validação.
- Resultado afirmado apenas por inferência.
- Evidência impossível de reproduzir.
- Limitação crítica omitida.
- Estado Git não informado.

## Processo de exceção

Se uma validação não puder ser executada, informe:

- o comando ou ação que seria executado;
- motivo do bloqueio;
- impacto no aceite;
- validação substituta usada;
- próxima ação recomendada.

## Automatização futura

- Checklist de fechamento obrigatório.
- Coleta automática de status Git.
- Relatórios de QA visual por rota.
- Registro de validações por macro-lote.
