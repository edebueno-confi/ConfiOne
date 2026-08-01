# Relatório de análise da pasta do projeto — Genius Support OS

**Data da análise:** 2026-07-25  
**Diretório analisado:** `C:\Projetos\GSO-old`  
**Branch observada:** `main`  
**HEAD observado:** `68884bf`  
**Status do worktree:** limpo, sem alterações pendentes

## 1. Resumo executivo

O repositório é um monorepo de uma plataforma interna de operações CX B2B, denominada Genius Support OS. A base está em estágio avançado de fundação: possui frontend funcional, contratos TypeScript compartilhados, backend Supabase/PostgreSQL com regras de negócio, RLS, RPCs, auditoria, integrações com HubSpot e OMIE, fixtures de QA e uma suíte relevante de testes de banco e scripts.

O projeto não deve ser tratado como um protótipo simples. Ele já contém múltiplos domínios operacionais: suporte, Customer Success, contas B2B, Analytics, Knowledge Base, Central Pública de Ajuda, Portal do Cliente, acessos, áreas internas, Engenharia e integrações financeiras/comerciais.

O principal risco identificado não é ausência de capacidade técnica. É a combinação de escopo amplo, documentação histórica acumulada, múltiplas frentes concorrentes e dependências externas ainda governadas por gates separados, como deploy, secrets, scheduler, migrations remotas e escrita no HubSpot/OMIE.

## 2. Método e limites da análise

Foram inspecionados:

- arquivos da raiz e diretórios de primeiro nível;
- `README.md`, `AGENTS.md`, `LEIA-PRIMEIRO.md`, `PRODUCT.md`, `DESIGN.md` e `package.json`;
- documentação canônica em `docs/`, especialmente `PROJECT_STATE.md`, `ROADMAP_BUILDOUT_V3.md`, `ARCHITECTURE_RULES.md` e `VIEW_RPC_CONTRACTS.md`;
- estrutura de `apps/web/src` e rotas declaradas no router;
- manifests de frontend e contratos;
- migrations, testes pgTAP, Edge Functions, fixtures e scripts de QA;
- status Git e commits recentes.

Esta foi uma análise estrutural e documental. Não foram executados nesta análise typecheck, build, lint, testes de banco, servidor web, smoke browser ou reset do Supabase. Portanto, as conclusões sobre funcionamento são baseadas na estrutura e nas evidências documentadas, não em uma nova execução completa da suíte.

## 3. Inventário da raiz

| Área | Função observada |
|---|---|
| `apps/` | Aplicações do workspace; atualmente há uma aplicação web principal. |
| `packages/` | Pacotes compartilhados, incluindo contratos TypeScript. |
| `supabase/` | Migrations, testes de banco, funções Edge, fixtures e configuração operacional. |
| `docs/` | Documentação de produto, arquitetura, contratos, reports, specs e handoffs. |
| `tests/` | Testes/scripts complementares, smoke tests e fixtures de browser. |
| `scripts/` | Scripts de desenvolvimento, CI, documentação, QA e operação local. |
| `raw_knowledge/` | Exportações e material bruto da base de conhecimento. |
| `.skills/` | Skills locais versionadas do projeto. |
| `output/` | Artefatos locais de saída; não aparenta ser código-fonte. |
| `.tmp/` | Logs e dados temporários locais. |
| `.playwright-cli/` | Evidências e logs de execuções Playwright. |

Itens relevantes na raiz:

- `package.json` e `package-lock.json` definem o workspace e os comandos principais;
- `AGENTS.md` contém as regras operacionais para agentes;
- `README.md` encaminha para a documentação canônica;
- `COMO-TESTAR.md` e `INICIAR-GENIUS.bat` apoiam a operação local;
- `PRODUCT.md`, `DESIGN.md`, `DIAGNOSTICO-E-PLANO-DE-SIMPLIFICACAO.md` e `RECONSTRUCAO-DO-PRODUTO.md` registram visão, design e histórico de decisões.

## 4. Indicadores quantitativos

Contagens observadas no checkout:

| Indicador | Quantidade |
|---|---:|
| Arquivos-fonte em `apps/web/src` | 135 |
| Arquivos `.tsx` no frontend | 80 |
| Arquivos `.ts` no frontend | 45 |
| Migrations Supabase | 161 |
| Testes pgTAP em `supabase/tests` | 81 |
| Edge Functions/diretórios funcionais | 13 |
| Testes Node `*.test.mjs` | 42 |
| Arquivos na raiz de `docs` | 95 |
| Relatórios em `docs/reports` | 197 |
| Documentos em `docs/knowledge` | 35 |

Os diretórios mais pesados são `node_modules`, `.git`, `docs`, `output` e `apps`. O tamanho de `output` foi estimado em aproximadamente 28 MB e deve ser tratado como artefato local até que sua função seja confirmada.

## 5. Arquitetura técnica

### Frontend

O frontend utiliza React 19, TypeScript, Vite, Tailwind CSS, React Router, Supabase JS, TipTap e Recharts. A configuração está em `apps/web/vite.config.ts` e o manifesto em `apps/web/package.json`.

O código está organizado por áreas de negócio em `apps/web/src/features`, além de componentes, contratos, biblioteca compartilhada e configuração de aplicação. A aplicação usa carregamento lazy para várias telas, o que reduz o custo inicial e separa os módulos por domínio.

### Contratos

`packages/contracts` funciona como pacote compartilhado de tipos. A regra documental é que o frontend não deve inventar contratos, calcular permissões ou substituir o backend como fonte de verdade.

### Backend e banco

O Supabase concentra:

- PostgreSQL e migrations versionadas;
- RLS e grants;
- views/read models;
- RPCs/commands;
- triggers e auditoria;
- testes pgTAP;
- funções Edge para integrações e uploads protegidos.

Essa arquitetura está alinhada com `docs/ARCHITECTURE_RULES.md`: o frontend apresenta dados e envia comandos; o backend valida autorização, escopo, regra operacional, persistência e histórico.

## 6. Módulos funcionais encontrados

### Administração e governança

Inclui visão administrativa, tenants/contas B2B, acessos, sistema, configurações, áreas internas, catálogo de telas, perfis de acesso e documentação de produto.

### Analytics e Dashboard Gerencial

Há um módulo dedicado de Analytics com indicadores executivos, filtros de período, visões Comercial, CS e Financeiro, histórico, reconciliação e integração com HubSpot/OMIE.

### Customer Success e clientes

O projeto possui carteira CS, clientes B2B, relacionamento com empresas, deals, grupos econômicos e entidades legais. O contrato de carteira CS documentado inclui owner, cluster, modelo de serviço, cadência, saúde, prioridade, origem e histórico.

### Suporte e tickets

Existem fila operacional, inbox, tickets, detalhe de ticket, anexos/evidências, classificação, SLA, atribuição e colaboração com o Portal do Cliente. A arquitetura separa ticket, comentário, evento, engenharia e acionamento interno.

### Knowledge Base e Central de Ajuda

O projeto possui editor, artigos, assets, taxonomia, busca, categorias, subcategorias, publicação editorial, revisão e Central Pública de Ajuda. A documentação registra um piloto local da Central `genius`, com regras de publicação e preservação de artigos não públicos.

### Portal do Cliente

O Portal possui rotas próprias para tickets, artigos, colaboração, upload seguro e contexto de tenant. O backend governa acesso, entitlements e isolamento por conta.

### Engenharia e acionamentos internos

Há uma separação explícita entre suporte, engenharia e acionamentos internos. Isso evita acoplar diretamente ticket operacional a backlog técnico e preserva contextos de permissão diferentes.

### Integrações

As Edge Functions identificadas cobrem Analytics, execução agendada, importação de planilhas, sincronização HubSpot, criação/merge de empresas, migração CS, sincronização de propriedades OMIE/HubSpot, sincronização OMIE e upload/download de evidências.

## 7. Rotas principais observadas

O router em `apps/web/src/app/router.tsx` define, entre outras, as seguintes superfícies:

- `/help` e `/help/:spaceSlug`;
- `/portal`, tickets e artigos do portal;
- `/admin/analytics`;
- `/admin/tenants`;
- `/admin/knowledge`;
- `/admin/access`;
- `/admin/system`;
- `/admin/settings`;
- `/admin/customer-portal`;
- `/admin/internal-areas`;
- `/admin/product-docs`;
- `/cs/portfolio`;
- `/support/queue`, `/support/inbox` e tickets;
- `/customers` e detalhes de clientes;
- `/engineering`;
- `/internal-actions`.

A quantidade de rotas confirma que o produto já é uma plataforma composta, não uma única tela ou fluxo isolado.

## 8. Segurança, tenancy e governança

Os documentos e contratos indicam preocupação consistente com:

- `tenant_id` ou escopo equivalente em dados operacionais;
- RLS e grants no banco;
- permissões por papel, área, membership e perfil de acesso;
- auditoria de mutações;
- histórico append-only em domínios relevantes;
- uploads e downloads de evidências protegidos;
- separação entre colaboradores internos, usuários de clientes e contatos;
- IA como assistente, nunca como fonte de verdade ou autorizadora de ação.

O principal ponto de atenção é operacional: qualquer nova funcionalidade precisa preservar essa matriz. Criar uma regra apenas no frontend, um endpoint paralelo ou uma tabela sem auditoria seria incompatível com a arquitetura vigente.

## 9. Testes e validação

Há três camadas principais:

1. **Contratos e TypeScript:** scripts de typecheck para contracts e web.
2. **Banco:** 81 arquivos pgTAP e comandos para reset, lint, verify e testes Supabase.
3. **QA local/browser:** fixtures de perfis, smoke tests, validações Playwright, checks de raiz, documentação e cenários de escrita pela interface.

O repositório também contém workflows GitHub para banco e scripts de execução local. As evidências anteriores documentadas mencionam typecheck, build, testes de banco, smoke autenticado e validações de segurança em diversos lotes.

Limite desta análise: essas validações não foram repetidas durante este relatório.

## 10. Documentação

A documentação é uma das partes mais desenvolvidas do projeto. Há documentos para:

- estado corrente e roadmap;
- arquitetura e contratos;
- autenticação, RLS, auditoria e governança de IA;
- produto, design e UX operacional;
- Portal, Knowledge, Analytics, CS e Suporte;
- specs e planos do Superpowers;
- relatórios de execução e handoffs;
- QA, release e operação local.

Entretanto, `docs/PROJECT_STATE.md` e `docs/ROADMAP_BUILDOUT_V3.md` acumulam muitos checkpoints históricos. O próprio conteúdo alerta que alguns blocos não representam o próximo passo atual. Isso cria risco de interpretação incorreta por agentes e colaboradores.

Recomendação: manter um bloco curto e único de “estado operacional atual” no início, transferindo o histórico para documentos datados ou arquivados.

## 11. Riscos identificados

### Risco alto — dispersão de escopo

Suporte, CS, Analytics, Knowledge, Portal, OCP, Engenharia e integrações evoluem simultaneamente. Uma nova ideia precisa ter domínio, usuário e resultado bem delimitados.

### Risco alto — dependências externas

Deploy, push, migrations remotas, secrets, schedulers e writes HubSpot/OMIE são gates externos. A existência de código local não significa que a capacidade esteja publicada ou ativa em produção.

### Risco médio — documentação histórica concorrente

Há múltiplos checkpoints, branches históricas e planos antigos dentro dos documentos. A documentação é rica, mas pode aumentar a ambiguidade se não houver uma fonte corrente curta.

### Risco médio — artefatos locais

`output`, `.tmp` e `.playwright-cli` contêm evidências e artefatos de execução. Eles devem permanecer claramente separados do código de produto e ter política de retenção definida.

### Risco médio — cobertura visual e de ambiente

As evidências documentadas são fortes em backend e contratos, mas QA visual autenticado, responsividade completa, runtime local e dados produtivos continuam dependendo de execução específica por lote.

### Risco baixo — acoplamento por crescimento

O número de features e contratos aumenta a chance de APIs, tipos e telas duplicados. Toda nova frente deve começar por uma auditoria de equivalentes existentes.

## 12. Recomendações prioritárias

### Prioridade 1 — consolidar o estado corrente

Criar ou manter um resumo operacional único com branch, commit, release, bloqueios, próximo lote, validações recentes e gates externos.

### Prioridade 2 — delimitar a nova ideia

Antes de implementar, responder:

- qual problema operacional resolve;
- quem usa;
- em qual domínio existente entra;
- qual fonte de dados já existe;
- qual comando ou mutation real será necessário;
- quais permissões e auditorias se aplicam;
- qual é o menor fluxo validável.

### Prioridade 3 — auditar contratos antes de criar novos

Pesquisar views, RPCs, tabelas, rotas, componentes e testes equivalentes. Reutilizar o contrato existente quando ele já cobrir o caso.

### Prioridade 4 — preservar gates externos

Manter separadas as etapas locais de implementação e validação das etapas remotas que exigem autorização explícita.

### Prioridade 5 — reduzir ruído documental e operacional

Classificar relatórios em corrente, histórico, evidência de release e material de referência. Definir política para artefatos em `output`, `.tmp` e `.playwright-cli`.

## 13. Conclusão

O Genius Support OS possui uma fundação técnica robusta e uma arquitetura coerente para uma plataforma interna CX B2B. O repositório já suporta múltiplos fluxos reais, com backend como fonte de verdade, tenancy, permissões, auditoria e testes.

O projeto está pronto para evoluções incrementais, desde que cada nova iniciativa seja pequena, localizada em um domínio existente, orientada por contrato backend-first e acompanhada de validação proporcional. O caminho menos arriscado é escolher uma única frente, produzir uma especificação curta, localizar os contratos existentes e implementar um primeiro vertical slice completo.

## 14. Evidências consultadas

- `AGENTS.md`
- `README.md`
- `LEIA-PRIMEIRO.md`
- `package.json`
- `apps/web/package.json`
- `apps/web/src/app/router.tsx`
- `docs/PROJECT_STATE.md`
- `docs/ROADMAP_BUILDOUT_V3.md`
- `docs/ARCHITECTURE_RULES.md`
- `docs/VIEW_RPC_CONTRACTS.md`
- `supabase/migrations/`
- `supabase/tests/`
- `supabase/functions/`
- `tests/scripts/`
- status Git e commits recentes do checkout

