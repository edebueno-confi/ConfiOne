# Decisão operacional sobre `docs/GPT/` e mapa documental canônico — 2026-05-20

## Objetivo
Definir o tratamento operacional de `docs/GPT/` e consolidar um mapa documental canônico que reduza drift entre documentação oficial, material auxiliar de contexto e artefatos de trabalho.

## Fontes explícitas usadas
- auditoria estrutural registrada em `docs/reports/REPOSITORY_SANITIZATION_REPORT.md`
- auditoria documental registrada no card `t_c286ae33` (`DOCS P0 · auditoria de documentação interna`)
- consolidação de riscos em `docs/reports/SUPPORT_WORKSPACE_STABILIZATION_PLAN_2026-05-20.md`
- índice/documentação corrente em `docs/README.md`, `docs/PROJECT_STATE.md`, `docs/REPOSITORY_STRUCTURE.md`, `docs/DOCUMENTATION_UPDATE_POLICY.md` e `docs/DOCUMENTATION_LEDGER.md`
- inventário atual de `docs/` e `docs/GPT/`

## Diagnóstico objetivo

### Papel atual de `docs/GPT/`
`docs/GPT/` hoje não opera como documentação oficial do produto. Na prática, ele mistura três coisas:
1. espelho parcial de documentos canônicos de `docs/`;
2. pacote auxiliar de contexto para GPT/IA (`GPT_UPLOAD_SELECTION.md`);
3. área de trabalho com artefatos/copias de auditoria, design e skill.

Isso caracteriza `docs/GPT/` como shadow tree operacional, não como tronco documental primário.

### Sobreposição real com `docs/`
Inventário atual:
- `docs/` fora de `docs/GPT/`: 141 markdowns
- `docs/GPT/`: 35 markdowns
- caminhos relativos compartilhados: 24
- compartilhados idênticos: 18
- compartilhados divergentes: 6
- exclusivos de `docs/GPT/`: 11

Documentos compartilhados mas divergentes:
- `README.md`
- `PROJECT_STATE.md`
- `VIEW_RPC_CONTRACTS.md`
- `SUPPORT_WORKFLOW.md`
- `SUPPORT_WORKSPACE_ARCHITECTURE_SPEC.md`
- `INTERNAL_DOCUMENTATION_AREAS_CHECKPOINT_V1.md`

Leitura operacional: o maior risco não é duplicação idêntica; é duplicação com drift silencioso em documentos centrais de estado, contratos e operação.

### Risco de drift
As auditorias anteriores já apontaram o problema de forma explícita:
- a auditoria estrutural preservou `docs/GPT/` por indício de trabalho ativo, não por canonização, e deixou sua destinação como pendência futura;
- a auditoria documental classificou `docs/GPT/` como área espelho/paralela com alto potencial de confusão sobre fonte de verdade;
- o plano de estabilização consolidou `docs/GPT/` como shadow tree/topologia documental ruidosa.

Impactos operacionais:
- leitura errada de documento stale como se fosse estado real;
- aumento de custo de revisão e onboarding;
- perda de confiança em `PROJECT_STATE.md`, `README.md` e docs de área como fonte de verdade;
- maior chance de IA e operadores humanos citarem material superado.

## Decisão recomendada

### Decisão
Não formalizar `docs/GPT/` como segunda área oficial.

Decisão recomendada: `consolidar e depois arquivar`.

Em termos operacionais:
- `docs/` permanece como única árvore canônica;
- `docs/GPT/` passa a ser classificado desde já como área auxiliar não canônica;
- conteúdo exclusivo útil deve ser absorvido pelo tronco oficial ou por buckets auxiliares explícitos;
- após absorção do que ainda tiver valor, `docs/GPT/` deve ser arquivado/removido em lote próprio.

### Por que esta decisão é a melhor
Arquivar imediatamente, sem consolidação, arrisca perder contexto útil hoje presente só em `docs/GPT/`.
Formalizar `docs/GPT/` como área oficial institucionalizaria uma segunda trilha documental para os mesmos assuntos e ampliaria o drift.

A opção segura é:
1. descanonizar agora;
2. consolidar o que presta;
3. arquivar depois.

## Critérios operacionais

### O que é canônico
É canônico apenas o que:
- vive em `docs/` fora da shadow tree `docs/GPT/`;
- está referenciado pelo índice oficial `docs/README.md` ou por governança documental equivalente;
- representa estado atual, contrato, runbook, política ou histórico versionado reconhecido;
- não depende de cópia paralela para continuar correto.

### O que deixa de ser canônico
Não deve ser tratado como canônico:
- espelho de documento oficial dentro de `docs/GPT/`;
- cópia de código/skill dentro de `docs/GPT/`;
- pacote de upload/contexto de IA que replica documentos já existentes na árvore oficial;
- artefato de diagnóstico que não esteja classificado em bucket próprio (`docs/reports/`, `docs/design/`, `.skills/`, etc.).

## Mapa documental canônico recomendado

### Nível 1 — Fonte oficial viva
- `docs/README.md`: índice canônico
- `docs/PROJECT_STATE.md`: checkpoint vivo do estado real
- `docs/DOCUMENTATION_LEDGER.md`: trilha documental por fase
- `docs/DOCUMENTATION_UPDATE_POLICY.md`: regra de manutenção
- `docs/DOCUMENTATION_GOVERNANCE_RUNBOOK.md`: rotina operacional
- `docs/REPOSITORY_STRUCTURE.md`: mapa estrutural do repositório

### Nível 2 — Documentos de domínio e arquitetura
- specs, estratégias, contratos, políticas e docs de área em `docs/`
- design docs em `docs/design/`
- knowledge docs em `docs/knowledge/`

### Nível 3 — Relatórios e auditorias
- relatórios versionados em `docs/reports/`
- usar esse bucket para pareceres, auditorias, planos de estabilização e decisões de saneamento

### Nível 4 — Artefatos auxiliares não canônicos
- `.skills/` para skill local versionada
- snapshots/diagnósticos visuais em buckets explícitos
- qualquer pacote de contexto para IA deve nascer como manifesto/lista de seleção, nunca como segunda cópia da árvore documental oficial

## Impactos recomendados por documento

### `README.md` da raiz
- reforçar `docs/` como fonte oficial única;
- não apontar `docs/GPT/` como trilha alternativa de leitura.

### `docs/README.md`
- explicitar que `docs/GPT/` não é fonte canônica;
- apontar para este parecer como referência da decisão;
- manter o índice oficial centrado apenas na árvore canônica.

### `docs/PROJECT_STATE.md`
- registrar a decisão operacional: `docs/GPT/` é shadow tree auxiliar, não fonte oficial;
- registrar backlog de consolidação/arquivamento sem prometer remoção imediata.

### `docs/REPOSITORY_STRUCTURE.md`
- classificar `docs/GPT/` como área auxiliar transitória, fora do mapa canônico principal;
- reforçar que buckets de documentação oficial são `docs/`, `docs/reports/`, `docs/design/` e `docs/knowledge/`.

### Governança documental
- novos lotes não podem criar cópias espelho de docs oficiais em árvore paralela;
- pacotes de contexto para IA devem usar manifesto, allowlist ou sync controlado, não duplicação manual de markdown;
- qualquer documento exclusivo encontrado em `docs/GPT/` deve receber uma destinação explícita: promover, reclassificar ou descartar em lote futuro.

## Backlog decorrente

### P0 — decisão já operacionalizada nesta rodada
- registrar `docs/GPT/` como área não canônica nos checkpoints centrais.

### P1 — consolidação dirigida
- promover ou relocar os 11 itens exclusivos de `docs/GPT/` que ainda tenham valor;
- decidir destino de `GPT_UPLOAD_SELECTION.md`: migrar para manifesto fora da shadow tree ou absorver em governança de IA/documentação;
- mover artefatos de skill copiados em `docs/GPT/.skills/` para referência do skill real ou descartar a cópia.

### P2 — saneamento estrutural final
- remover/arquivar `docs/GPT/` em lote dedicado, após checklist de absorção dos itens úteis;
- revisar links, automações e hábitos operacionais que ainda dependam da shadow tree.

## Regra prática até o arquivamento final
Se houver conflito entre `docs/` e `docs/GPT/`, vence `docs/`.
Se um arquivo existir apenas em `docs/GPT/`, ele deve ser tratado como candidato a triagem, não como documento oficial automático.

## Conclusão executiva
`docs/GPT/` não deve virar segunda árvore oficial. A decisão mais segura é classificá-lo agora como shadow tree auxiliar, consolidar o que ainda tem valor e arquivar a área em lote posterior. O mapa canônico recomendado mantém `docs/` como fonte única de verdade, `docs/reports/` como trilha de auditoria/decisão e elimina a ideia de espelho documental como prática aceitável de governança.