# R1 UTF-8 Encoding Integrity

## Escopo

Diagnóstico local da cadeia de texto do ConfiOne para labels, respostas JSON,
exportações e renderização. Nenhuma chamada externa, leitura de secret ou
escrita em HubSpot, OMIE ou produção foi realizada.

## Reprodução

O fixture determinístico usa `Operação`, `Suporte`, `São Paulo`, `Integrações`,
`Atenção`, `Próxima renovação` e `Café & ação`. A ida e volta por
`TextEncoder`/`TextDecoder('utf-8', { fatal: true })` preserva todos os caracteres
e não produz `Ã`, `Â` ou `�`. Isso valida a integridade do fixture, mas não
reproduz corrupção no runtime Edge nem no consumidor afetado.

A exportação CSV de clientes sem resposta foi exercitada com `Responsável`,
`Média` e texto com ponto e vírgula. O BOM UTF-8 é mantido pelo componente para
compatibilidade com Excel em português.

## Diagnóstico por camada

| Camada | Evidência local | Classificação |
| --- | --- | --- |
| Origem/read model | Strings e payloads locais chegam como Unicode válido nos fixtures | sem falha reproduzida |
| Serialização JSON | `JSON.stringify` não altera os caracteres | sem falha reproduzida |
| Transporte Edge | `jsonResponse` declarava `application/json` sem charset | hipótese de risco; mitigação defensiva aplicada |
| Headers OPTIONS | resposta textual não declarava charset | hipótese de risco; mitigação defensiva aplicada |
| HTML/renderização | `index.html` já declara UTF-8; React renderiza texto válido | sem falha reproduzida |
| Exportação | HTML/SVG declaram charset; CSV usa BOM explícito | protegido por regressão |

## Correção

`supabase/functions/_shared/ticket-evidence.ts` passou a declarar
`application/json; charset=utf-8` e `text/plain; charset=utf-8`. Nenhum texto foi
transliterado, removido ou substituído silenciosamente. A mudança é uma
mitigação defensiva e não uma confirmação de que a ausência de charset causou
um incidente observado.

## Validação

- regressões UTF-8 e exportação: 14/14 PASS;
- `web:typecheck`: PASS;
- `web:build`: PASS, 945 módulos;
- `lint`: PASS, 0 erros e 160 warnings legados;
- `review:gates`: PASS, 0 regressões bloqueantes;
- `docs:validate`: PASS, 0 documentos bloqueados;
- `git diff --check`: PASS após a remoção mecânica da linha em branco final de
  `handoffs/current/REVIEW.md`; o conteúdo do review foi preservado.

## Limitações

Não houve validação autenticada de produção, chamada ao HubSpot/OMIE, inspeção
de valores remotos, execução local do runtime Edge/consumidor afetado ou teste
de um navegador externo. Portanto, a causalidade permanece hipótese e a
mitigação não deve ser apresentada como resolução comprovada do incidente.
