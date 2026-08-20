# Task

## Task ID

INFRA-GOV-2026-08-19

## Título

Preparar protocolo persistente de colaboração entre Codex e Claude.

## Contexto

O checkout já possui documentação canônica, um protocolo de quality gates em
docs/CODE_REVIEW_PROTOCOL_V1.md e uma área .review/ iniciada. Faltava uma
interface estável de handoff com estados, tarefa, implementação e revisão,
além de regras de bootstrap explícitas para os dois agentes.

## Objetivo

Criar uma camada de governança versionada no próprio repositório, sem implementar
funcionalidade de produto e sem depender de copiar mensagens entre agentes.

## Escopo

- documentos normativos em docs/engineering/;
- protocolo operacional em handoffs/;
- templates correntes em handoffs/current/;
- integração das regras em AGENTS.md e CLAUDE.md;
- links de descoberta em README.md e docs/README.md.

## Fora de escopo

- código de produto;
- UI, UX ou redesign;
- migrations, RLS, tabelas, RPCs ou contratos de produto;
- dependências;
- CI/CD executável;
- merge, commit, push, deploy ou migration remota;
- resolver findings técnicos preexistentes do produto.

## Requisitos funcionais

- Codex deve atuar como executor e não aprovar a própria implementação.
- Claude deve atuar como reviewer e produzir decisão formal.
- Os agentes não devem editar produto simultaneamente.
- O estado deve usar a máquina documentada em docs/engineering/REVIEW_PROTOCOL.md.
- O protocolo deve exigir evidência, SHA, diff, testes e critérios de aceitação.

## Requisitos técnicos

- preservar documentos equivalentes existentes;
- integrar .review/ sem criar fonte conflitante;
- não incluir secrets;
- marcar lacunas como UNRESOLVED — requires project owner decision.

## Critérios de aceitação

- os sete documentos de docs/engineering/ existem e apontam para fontes reais;
- handoffs/README.md documenta o fluxo sem copy/paste manual;
- os quatro arquivos de handoffs/current/ possuem estrutura operacional;
- AGENTS.md orienta o Codex sobre o estado e a revisão;
- CLAUDE.md aponta para o protocolo e restringe Claude a revisão;
- referências locais novas resolvem;
- nenhum arquivo de produto foi alterado por este lote;
- git diff --check passa.

## Documentos normativos aplicáveis

- AGENTS.md;
- docs/PROJECT_STATE.md;
- docs/README.md;
- docs/CODE_REVIEW_PROTOCOL_V1.md;
- docs/DOCUMENTATION_UPDATE_POLICY.md;
- docs/ARCHITECTURE_RULES.md;
- docs/VALIDATION_CHECKLIST.md;
- docs/engineering/REVIEW_PROTOCOL.md.

## Riscos conhecidos

- o worktree possui alterações preexistentes;
- há documentos históricos com referências a checkouts antigos;
- .review/ já contém artefatos de um ciclo anterior;
- os critérios de merge e deploy não estão totalmente determinados pelo CI local.

## Base commit SHA

55353058f537761536d53513b7db4d2e412c81f3

## Branch

main

## Responsável atual

Codex implementa a preparação. Claude revisa o lote após READY_FOR_REVIEW.

## Observações do proprietário

Não iniciar feature após esta preparação. O fluxo deve funcionar apenas com
arquivos do repositório, Git e evidências persistidas.
