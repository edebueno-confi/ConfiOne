# ConfiOne — Contexto de retomada do Codex

> Leia este arquivo primeiro quando o projeto for reaberto depois de uma
> formatação ou quando outro agente assumir o checkout. Código, migrations,
> contratos, testes e políticas reais têm precedência sobre este resumo.

**Última atualização:** 2026-08-14
**Projeto:** ConfiOne
**Repositório:** https://github.com/edebueno-confi/ConfiOne
**Branch de continuidade:** `codex/final-consolidation-20260812`
**HEAD de referência:** `8c71a6a` — `chore: checkpoint development cockpit and documentation`
**Pull request existente:** https://github.com/edebueno-confi/ConfiOne/pull/40

## Como retomar

1. Ler este arquivo.
2. Ler `docs/PROJECT_STATE.md`.
3. Ler `docs/README.md`.
4. Verificar `git status -sb`, branch e HEAD.
5. Só então investigar o pedido novo no código e nos contratos reais.

Não tratar conversas antigas, relatórios históricos ou o Context Pack de julho
como plano corrente sem comparar com os documentos acima.

## Estado do produto

O produto vigente não é ainda o SaaS interno completo originalmente imaginado.
A primeira versão publicada prioriza uma Central de Ajuda externa, um Dashboard
gerencial interno e a base operacional/documental para evoluir esses dois eixos.
O SaaS interno completo continua como direção futura.

O cockpit de desenvolvimento é a memória operacional dessa evolução: registra o
que foi feito, como foi feito, por que a rota mudou e qual é o próximo movimento.

### Situação da publicação

O board não carregar em produção não foi uma decisão intencional de produto.
Fica registrado como pendência de publicação e validação: comparar o commit
implantado em produção com a branch de continuidade, confirmar as migrations e
verificar o acesso do usuário administrador antes de considerar o cockpit
disponível fora do ambiente local.

## Cockpit de desenvolvimento

- Rota principal: `/engineering/control`.
- Área restrita com confirmação visual de entrada.
- Shell do ConfiOne recolhido e visualmente bloqueado durante o uso.
- Toolbar e navegação próprias para `Quadro`, `Diário` e `Documentos`.
- Identidade visual independente do tema white/dark do ConfiOne.
- Direção visual: cockpit técnico escuro, avermelhado, com acentos ciano e
  superfície pontilhada; leitura densa, margens controladas e sem aparência de
  página editorial genérica.

### Contrato operacional

- Escopo explícito: `confi_one_development`.
- Estados: `backlog`, `in_progress`, `awaiting_agent`, `blocked`, `done` e
  `cancelled`.
- `awaiting_agent` é a entrega explícita de um card para execução.
- `backlog` significa demanda registrada; não significa execução em segundo plano.
- O backend é a fonte da verdade; a interface lê views/read models e chama
  RPCs/commands reais.
- O painel não executa agentes automaticamente e não move cards sozinho.
- Ede Bueno, como administrador da plataforma, deve ter acesso efetivo ao cockpit
  e às fontes internas autorizadas, sem ocultação artificial de itens.

### Diários e documentos

Quando abertos a partir do cockpit, usando `surface=development`:

- o Diário prioriza fase, decisão, evidência e próximo movimento;
- a Biblioteca de Documentos prioriza índice, leitura e contexto do catálogo;
- as telas não devem depender do tema do ConfiOne para manter contraste;
- o catálogo documental continua governado e whitelisted;
- editar um Markdown no repositório não sincroniza automaticamente conteúdo
  privilegiado no banco.

Arquivos de implementação principais:

- `apps/web/src/features/development-control/DevelopmentControlPage.tsx`
- `apps/web/src/features/development-control/development-control-api.ts`
- `apps/web/src/features/build-journal/DevelopmentJournalSurface.tsx`
- `apps/web/src/features/product-docs/DevelopmentDocumentsSurface.tsx`
- `apps/web/src/features/build-journal/BuildJournalPage.tsx`
- `apps/web/src/features/product-docs/ProductDocsPage.tsx`
- `apps/web/src/index.css`

## Decisões de produto e design

- O cockpit é um subsistema do ConfiOne, mas possui identidade própria.
- O Diário não deve ser apenas uma página longa com hero, timeline e cartões;
  deve responder “o que mudou e por quê?”.
- Documentos não devem ser apenas um master-detail vazio; devem responder “qual
  fonte devo consultar agora?”.
- Criar, editar e detalhar tarefas usa slide-over/coluna lateral, sem empurrar
  conteúdo para baixo do Kanban.
- A interface deve ser operacional e ilustrativa, sem excesso de compliance,
  campos burocráticos ou cerimônia de processo.
- O produto deve registrar decisões de rota, stack, handoffs, acertos, erros e
  aprendizados sem transformar cada registro em formulário pesado.
- A correção de UTF-8/mojibake é transversal à ferramenta, não apenas ao cockpit.
- O nome do usuário executor é **Ede Bueno**.

## Figma e auditoria visual

Board no time Medrar:

https://www.figma.com/board/nZtVDOYveO71gn7jUJdszq

O board contém evidências reais, diagnóstico crítico, reconstrução V2 do Diário
e da Biblioteca e critérios de estabilização. Ele é referência visual; a fonte
executável continua sendo o repositório e seus contratos reais.

## Git e publicação

O checkpoint de 2026-08-13 foi publicado:

- branch: `codex/final-consolidation-20260812`;
- commit: `8c71a6abd1775da9f87dfa7a3899fe26808d7e32`;
- PR existente: `#40`;
- checkout ficou limpo após o push.

O GitHub CLI portátil foi instalado em:

`C:\Users\edebu\AppData\Local\Programs\GitHubCLI\bin\gh.exe`

Depois de uma formatação, validar novamente:

```powershell
gh --version
gh auth login -h github.com -p https -w
gh auth status
```

Não fazer `reset --hard`, `clean`, exclusão de migrations ou alteração de secrets
para “organizar” o checkout sem decisão explícita.

## Validação do último checkpoint

Executado em 2026-08-13:

- `npm run web:typecheck` — aprovado;
- `npm run web:build` — aprovado;
- `quality:changed` e `quality:staged` — aprovados com observações;
- `local:qa:secret-scan` — aprovado, 0 correspondências;
- `security:audit:prod` — aprovado;
- `docs:validate` — aprovado sem bloqueadores;
- testes de navegação/release — 38/38 aprovados;
- suíte focada ampla — 258/259, com uma falha legada sobre ranking de pipelines
  que contradiz o contrato atual do read model;
- auditoria documental — consistente com ressalvas e sem bloqueadores.

Observações preservadas:

- duas migrations foram sinalizadas como candidatas médias por possível drift de
  retorno persistente; ainda não são findings confirmados;
- a auditoria documental aponta referências históricas/quebradas no ledger e no
  `PROJECT_STATE`; corrigir apenas após confirmar a fonte substituta;
- migrations versionadas não significam que o banco local ou remoto esteja
  automaticamente hidratado nesta nova máquina.

## Git versus arquivos somente locais

Está no GitHub: código, contratos, migrations, testes, documentação canônica e
o histórico da branch.

Copiar separadamente e nunca publicar:

- `apps/web/.env.local` — contém configuração local do Supabase;
- `recovery/codex-context-2026-08-12/` — pacote local de recuperação de contexto;
- `C:\Users\edebu\.codex`, se Ede quiser preservar preferências e estado local.

Não é necessário preservar `node_modules`, `.codex/nodejs` dentro do projeto,
`supabase/.temp`, logs locais, builds ou caches.

O `recovery` e o `.env.local` podem conter dados sensíveis. Guardar em backup
privado e não enviar para GitHub ou superfícies públicas.

## Leitura canônica após a formatação

Para retomada geral:

1. `docs/CODEX_RESTART_CONTEXT.md` — este documento;
2. `docs/PROJECT_STATE.md` — estado corrente detalhado;
3. `docs/README.md` — índice navegável;
4. `docs/ROADMAP_BUILDOUT_V3.md` — plano vigente;
5. `docs/DOCUMENTATION_UPDATE_POLICY.md` e
   `docs/DOCUMENTATION_GOVERNANCE_RUNBOOK.md` — regras documentais;
6. `docs/DOCUMENTATION_LEDGER.md` — trilha de auditoria;
7. `docs/DEVELOPMENT_CONTROL_PANEL_V1.md` — contrato do cockpit;
8. `docs/context-handoff/24_CONTEXT_USAGE_RULES.md` — precedência e limites.

Para UI/UX, acrescentar `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md`,
`docs/BUILD_JOURNAL_STRATEGY.md`, `docs/BUILD_JOURNAL_SCREEN_SPEC.md` e
`docs/PRODUCT_DOCS_INTERNAL_READER_V1.md`.

## Próximo ciclo recomendado

1. Confirmar branch e restaurar o `.env.local` com segurança.
2. Abrir o cockpit e validar Quadro → Diário → Documentos.
3. Atualizar os cards conforme o estado real após a formatação.
4. Tratar a falha legada da suíte ampla como card separado.
5. Fazer revisão documental específica quando o catálogo governado refletir o
   novo Diário e a nova Biblioteca em runtime.

## Regra de ouro para o próximo agente

Comece pelo estado real, mantenha um segundo olhar crítico sobre cada pedido de
Ede e registre o resultado no projeto. Não invente dados, não faça bypass de
permissões, não aplique migrations remotas, não publique secrets e não transforme
intenção futura em feature entregue.
