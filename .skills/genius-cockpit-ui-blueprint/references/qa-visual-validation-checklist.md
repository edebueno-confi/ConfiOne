# QA Visual Validation Checklist

## Checklist final

- Visual fiel ao PNG aprovado.
- Sem scroll global.
- Sem scroll horizontal.
- Containers corretos com scroll interno.
- Drawer cabe sem rolagem.
- CTA visível.
- Tags coerentes com prioridade e estado.
- Copy sem jargão.
- Textos truncados corretamente.
- Estados de loading, vazio, erro e sem permissão cobertos.
- Nenhuma ação fake.
- Nenhum dado técnico sensível exposto.
- `typecheck` e `build` concluídos quando aplicável.

## Métricas obrigatórias a registrar

- `window.innerWidth`
- `window.innerHeight`
- `document.scrollingElement.scrollHeight`
- `document.scrollingElement.clientHeight`
- presença ou ausência de scroll global
- lista dos containers com scroll interno
- presença ou ausência de scroll horizontal

## Fechamento

Encerrar a tarefa apenas depois de reportar:

- aderência ao blueprint;
- limitações de contrato ou produto;
- arquivos alterados;
- validações executadas.
