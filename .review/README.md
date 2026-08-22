# `.review/` — área de trabalho do agente revisor

Contrato completo em [`docs/CODE_REVIEW_PROTOCOL_V1.md`](../docs/CODE_REVIEW_PROTOCOL_V1.md).

| Caminho | Papel | Versionado |
| --- | --- | --- |
| `inbox/<lote>.json` | Pacote técnico opcional do quality gate | sim |
| `verdicts/<lote>.md` | Evidência técnica opcional, alinhada ao handoff | sim |
| `baseline.json` | Débito congelado dos quality gates | sim |
| `rls-deny-all-allowlist.json` | Tabelas cujo deny-all de RLS é intencional | sim |
| `state.json` | Metadados de automação, sem estado ou veredito | sim |
| `context/` | Pacotes de revisão gerados | não (ignorado) |

## Comandos

```bash
npm run review:gates             # falha só em regressão contra o baseline
npm run review:gates:json        # mesma verificação em JSON
npm run review:gates:baseline    # congela o débito atual (exige autorização)
npm run review:context           # monta o pacote de revisão do lote
```

## Integração com o handoff corrente

O handoff corrente entre os agentes fica em `handoffs/current/`. O
`IMPLEMENTATION.md` é o pedido canônico, o reviewer escreve `REVIEW.md` e
`STATUS.md`, e os artefatos desta pasta são opcionais e complementares.

Nada aqui altera o produto. Durante review, não alterar código, migrations, testes
de produto, contratos ou configuração executável.

Vereditos históricos em .review/verdicts/ devem ser lidos junto do Task ID corrente
e não substituem handoffs/current/REVIEW.md.

## Regras

- Nada aqui altera o produto. O revisor lê o repositório e escreve apenas nesta pasta,
  em `docs/` e nas correções explicitamente autorizadas.
- `baseline.json` só cresce com autorização do product owner. O caminho normal é ele
  diminuir a cada lote de higiene.
- Objeto listado em `SURFACE_PENDING_UI` é funcionalidade pronta sem consumidor, não
  código morto. Ninguém remove objeto de banco a partir deste relatório.
