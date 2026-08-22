# TASK

- Task ID: R1-UTF8-ENCODING-INTEGRITY-2026-08-21
- Objetivo: reproduzir, localizar e corrigir a corrupção de caracteres UTF-8 nas superfícies e dados apresentados pelo ConfiOne.
- State: READY_FOR_REVIEW
- Owner: Forge
- Role: IMPLEMENTER
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Coordinator: Codex
- Agent coordination: REVIEW_ACTIVE
- Approval: APPROVED
- Base SHA: 5df3259
- Implementation SHA: UNCOMMITTED_WORKTREE

## Critérios de aceitação

1. Reproduzir o problema com exemplos contendo acentos e caracteres especiais em labels, operações, pipelines, respostas JSON e exportações quando aplicável.
2. Isolar a camada responsável, distinguindo origem, transporte, banco, read model, serialização, headers, fonte do documento e renderização.
3. Corrigir a causa identificada sem transliteração, remoção de acentos, substituição silenciosa ou normalização destrutiva.
4. Garantir UTF-8 consistente nos caminhos afetados e preservar caracteres válidos já armazenados.
5. Adicionar regressões determinísticas para português do Brasil, incluindo exemplos como Operação, Suporte, São Paulo, Integrações, Atenção, Próxima renovação e caracteres especiais relevantes.
6. Registrar fatos reproduzidos, hipóteses descartadas, limitação de validação e qualquer dependência externa sem tratá-la como resolvida.
7. Executar testes e gates proporcionais, sem declarar integração externa validada quando não houver chamada autorizada.

## Allowlist

- arquivos executáveis, contratos e testes diretamente envolvidos na cadeia UTF-8 descoberta pelo diagnóstico;
- testes de regressão de encoding;
- documentação específica do diagnóstico/correção e relatório em docs/reports/;
- handoffs/current/ e atualizações mínimas necessárias na fila/documentação canônica;
- nenhum redesign visual ou refatoração não relacionada.

## Fora de escopo e limites

- não ler, revelar, criar ou alterar secrets e credenciais;
- não fazer chamadas externas nem escrever em HubSpot, OMIE, produção ou serviços remotos;
- não executar migration remota, deploy, push, merge ou release;
- não alterar dados para mascarar a origem da corrupção;
- não modificar arquivos preexistentes fora da allowlist nem descartar alterações do worktree;
- se a causa depender de estado remoto não verificável localmente, registrar OWNER_DECISION_REQUIRED com evidência.

## Entrega

Forge deve atualizar IMPLEMENTATION.md com reprodução, diagnóstico, correção, arquivos, testes e limitações, mudar STATUS.md para READY_FOR_REVIEW e avisar Sentinel e Codex. Sentinel fará revisão independente e escreverá apenas REVIEW.md e STATUS.md.
