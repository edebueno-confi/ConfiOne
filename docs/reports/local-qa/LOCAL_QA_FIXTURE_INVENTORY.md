# LOCAL-QA-01 — Inventário de fixtures

- Data-base: relógio local no momento da hidratação; os intervalos relativos são determinísticos por execução.
- Identificação: textos, slugs, IDs externos e metadados usam `qa-local` ou `[QA LOCAL]`.
- Usuários: 5 contas locais — administrador, dashboard viewer, support manager, support agent e cliente externo.
- Tenants: 3 — QA Aurora Comércio, QA Horizonte Digital e QA Atlas Operações.
- Tickets: 18, cobrindo estados, prioridades, SLA, atribuição e tenant.
- Mensagens: 18 mensagens públicas sintéticas com metadata `fixture=true`.
- Produto: Genius Returns, 3 planos e 3 subscriptions.
- Comercial: 3 owners, 6 stages, 3 empresas, 3 deals.
- CS: 3 tickets HubSpot sintéticos.
- Financeiro: 6 recebíveis da fonte `local_qa_finance`.
- Conhecimento: conteúdo canônico é preservado; quando a base local está vazia, o script cria no máximo 2 artigos `[QA LOCAL]`.
- Integrações: schedules desativados; nenhuma credencial, run ou snapshot externo é criado.
- Storage: nenhum binário real é versionado; arquivo sintético só deve ser adicionado quando o fluxo exigir.

Entidades de negócio possuem IDs estáveis. Usuários são resolvidos pelo e-mail no Auth local e atualizados sem duplicação.
