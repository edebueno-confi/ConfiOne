# DOCUMENTATION_UPDATE_POLICY.md

## Objetivo
Formalizar a atualização de documentação como parte obrigatória do processo de entrega do Genius Support OS.

O objetivo desta política é impedir drift entre código, comportamento real do produto e documentação oficial. A regra central é simples:

```text
nenhum lote relevante fecha sem revisão documental proporcional ao impacto real entregue
```

## Regra principal
Toda melhoria, correção, endurecimento, refatoração relevante ou nova superfície operacional deve responder:

- o estado real do sistema mudou?
- o comportamento do produto mudou?
- mudou rota, fluxo, permissão, contrato, limitação ou risco?
- nasceu, evoluiu ou ficou obsoleto algum documento?

Se a resposta for `sim` para qualquer item, a documentação precisa ser revisada e atualizada no mesmo lote.

## Documentos-base do processo

### `PROJECT_STATE.md`
É o checkpoint principal do estado real do sistema.

Deve ser atualizado quando mudar:

- o que existe em runtime;
- o que está parcial;
- o que está bloqueado;
- o próximo bloco recomendado;
- limitações operacionais relevantes;
- qualquer entrega que altere a resposta para a pergunta: `o que existe hoje de verdade?`

### `DOCUMENTATION_LEDGER.md`
É a trilha de auditoria documental por fase.

Deve receber registro quando o lote:

- cria ou altera superfície real do produto;
- cria ou altera fase documental relevante;
- muda critérios, limites ou governança;
- adiciona documento novo que passa a sustentar continuidade do projeto.

Cada registro deve manter:

- nome do lote;
- resumo funcional;
- docs alterados;
- telas afetadas;
- views/RPCs afetadas, quando houver;
- riscos restantes;
- impacto futuro na FAQ.

### Documento específico da área
Toda mudança relevante deve atualizar o documento mais próximo da superfície alterada.

Exemplos:

- feature operacional: doc da feature ou spec da área;
- área interna documental: doc próprio da área;
- contrato backend: doc contratual correspondente;
- mudança de regra editorial/governança: doc de governança correspondente.

### `README.md`
Deve ser atualizado quando nascer documento novo relevante para navegação, leitura recorrente ou continuidade.

## Matriz mínima por tipo de mudança

### Mudança de runtime/UI relevante
Atualizar, no mínimo:

- `PROJECT_STATE.md`
- documento específico da área
- `DOCUMENTATION_LEDGER.md`

Atualizar também `README.md` se surgir documento novo relevante.

### Mudança de backend/contrato
Atualizar, no mínimo:

- `PROJECT_STATE.md`
- `VIEW_RPC_CONTRACTS.md`, quando aplicável
- documento específico da área
- `DOCUMENTATION_LEDGER.md`

### Mudança apenas documental/estratégica
Atualizar, no mínimo:

- documento principal criado ou alterado
- `PROJECT_STATE.md`, se o checkpoint do projeto mudar
- `DOCUMENTATION_LEDGER.md`
- `README.md`, se houver documento novo relevante

### Correção pequena sem impacto de comportamento
Se não houver impacto real em produto, fluxo, contrato, risco, limitação ou operação, pode não haver update documental. Nesse caso, a ausência deve ser intencional e justificável.

## Critério de encerramento de lote
Um lote só deve ser considerado encerrado quando os quatro blocos abaixo forem resolvidos:

1. implementação;
2. validação;
3. documentação impactada atualizada;
4. revisão rápida de coerência entre código e docs.

## Checklist obrigatório de revisão documental
Antes de encerrar um lote, verificar:

- `PROJECT_STATE.md` ainda descreve a realidade?
- `DOCUMENTATION_LEDGER.md` precisa de novo registro?
- existe documento específico da área que precisa ser atualizado?
- nasceu documento novo que precisa entrar no `README.md`?
- alguma limitação, risco ou bloqueio mudou?
- a documentação diferencia claramente o que existe do que é futuro?
- há promessa indevida de feature, permissão, IA, busca, anexo, comentário ou automação que ainda não existe?

## O que não é aceitável
- deixar atualização documental para um lote futuro sem necessidade real;
- fechar feature relevante sem atualizar o checkpoint do projeto;
- criar UI ou contrato novo sem refletir isso em documentação oficial;
- manter documento afirmando algo que o sistema já não faz;
- usar documentação como marketing em vez de estado real;
- registrar capability inexistente como se estivesse entregue.

## Saída obrigatória de todo lote relevante
Toda entrega relevante deve terminar informando:

- arquivos criados/alterados;
- comportamento real entregue;
- docs atualizados;
- riscos restantes;
- validações executadas;
- próximo passo recomendado, quando houver.

## Relação com as áreas internas documentais
As áreas `/admin/build-journal` e `/admin/product-docs` não substituem esta política.

Elas são superfícies de leitura interna. A disciplina real continua no repositório:

- `PROJECT_STATE.md` como checkpoint vivo;
- `DOCUMENTATION_LEDGER.md` como trilha por fase;
- documentos específicos como fonte contextual;
- `README.md` como índice navegável;
- esta política como regra de processo.
