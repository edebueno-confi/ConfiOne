# Playbook de Documentacao para Reinicio Governado de Projetos

Data: `2026-06-22`

## Objetivo

Este relatorio transforma as boas praticas consolidadas no Genius Support OS em um roteiro reutilizavel para retomar projetos ja iniciados, documentar o estado real, preservar apenas a estrutura util e preparar um reinicio tecnico mais seguro.

A ideia nao e copiar a stack, os nomes de dominio ou as decisoes especificas do Genius Support OS. O que deve ser copiado e o metodo:

- entender o produto antes de reconstruir;
- separar estado real, plano, arquitetura, seguranca, contratos, validacao e design;
- registrar lacunas e decisoes pendentes;
- impedir que frontend, mocks ou IA virem fonte da verdade;
- validar a base antes de destruir implementacoes antigas;
- recomecar com documentacao viva, verificavel e orientada a execucao.

## Quando usar

Use este playbook em projetos legados ou em andamento quando houver duvida sobre:

- stack escolhida;
- qualidade de codigo;
- seguranca;
- autenticacao, permissoes e isolamento de dados;
- arquitetura de frontend/backend;
- maturidade de testes;
- existencia de mocks ou telas falsas;
- uso de IA, automacoes, providers externos ou secrets;
- documentacao ausente, espalhada ou divergente;
- necessidade de destruir a implementacao atual e reconstruir sobre uma base mais limpa.

## Resultado esperado

Ao final da fase documental, o projeto deve conter uma pasta `docs/` capaz de orientar um novo agente ou uma nova rodada de desenvolvimento sem depender da memoria informal do projeto.

A documentacao deve responder:

- o que este produto faz;
- para quem existe;
- quais fluxos sao reais;
- quais funcionalidades ja existem;
- quais funcionalidades sao falsas, parciais ou perigosas;
- qual e a stack atual e quais riscos ela traz;
- como dados, autenticacao, permissoes, auditoria e integracoes funcionam;
- quais decisoes de produto ainda estao pendentes;
- quais arquivos podem ser preservados como estrutura;
- o que deve ser deletado antes do rebuild;
- qual deve ser o primeiro lote seguro de reconstrucao.

## Principios que devem ser copiados do Genius Support OS

1. Backend e dados sao a fonte da verdade.
2. Frontend renderiza contratos e envia comandos; nao inventa regra de negocio.
3. Mocks nao podem virar produto.
4. Toda funcionalidade operacional precisa de fonte real, permissao, auditoria e teste proporcional ao risco.
5. Dados ausentes devem aparecer como indisponiveis, nunca fabricados.
6. Autenticacao, autorizacao, isolamento e auditoria entram desde o inicio.
7. IA e assistente operacional; nao decide permissao, status, publicacao, envio externo ou acao sensivel.
8. Documentacao e parte da entrega, nao pos-obra.
9. Relatorio vem antes de correcao quando o estado do projeto e incerto.
10. O agente deve parar diante de risco destrutivo, segredo, custo, deploy, dados reais ou decisao de produto pendente.

## O que nao deve ser copiado automaticamente

Nao copie do Genius Support OS:

- nomes de tabelas, views, RPCs ou dominios sem equivalencia no projeto alvo;
- stack Supabase/Postgres se o projeto alvo nao justificar essa escolha;
- design system visual se a marca/produto forem outros;
- estrutura de suporte B2B se o dominio for diferente;
- documentos historicos ou planos obsoletos;
- workarounds, fixtures locais, caminhos Windows ou scripts especificos;
- qualquer credencial, token, dado real, seed sensivel ou convencao temporaria.

## Prompt mestre para o agente do projeto alvo

Use este prompt dentro do projeto que sera reiniciado.

```text
Atue em portugues pt-BR com alta autonomia, rigor tecnico e foco em entrega real.

Objetivo:
Auditar este projeto legado/em andamento, entender o produto e gerar uma base documental completa em `docs/` para permitir um reinicio governado. Nesta fase, nao reimplemente produto, nao apague arquivos e nao faca refatoracao ampla. Primeiro documente o estado real.

Contexto:
O projeto pode ter codigo util, codigo ruim, stack inadequada, mocks, seguranca fraca, documentacao ausente e decisoes antigas. Quero preservar o aprendizado e a estrutura aproveitavel, depois destruir a implementacao insegura e recomecar com uma base melhor.

Modo de trabalho:
1. Leia README, AGENTS.md/instrucoes locais, package manifests, configs, migrations, schema, rotas, componentes, testes, scripts, CI, variaveis de ambiente documentadas e estado Git.
2. Audite a stack atual, dominios, fluxos, telas, backend, banco, auth, permissoes, integracoes, dados, testes, qualidade e seguranca.
3. Separe evidencia real de suposicao. Nao invente funcionalidade.
4. Crie `docs/` com documentos canonicos que descrevam o produto, arquitetura, estado real, roadmap, validacao, seguranca, design, dados e plano de retomada.
5. Registre explicitamente o que esta pronto, parcial, falso, inseguro, obsoleto ou pendente de decisao humana.
6. Gere um relatorio final de takeover e um plano de rebuild em lotes pequenos.
7. Nao execute deploy, push, migracao remota, reset destrutivo, exclusao permanente, uso de secrets, custo ou envio externo sem confirmacao explicita.

Principios obrigatorios:
- Backend/dados sao fonte da verdade.
- Frontend nao calcula permissao, status, preco, elegibilidade, SLA, visibilidade ou regra critica.
- Nao usar mocks como fonte do produto.
- Nao criar contrato novo sem auditar o existente.
- Todo dado operacional precisa de escopo explicito, permissao e auditoria quando aplicavel.
- Dados ausentes devem ser documentados como indisponiveis.
- IA nao e fonte da verdade e nao executa acao sensivel sem revisao humana.
- Documentacao deve ser viva, versionada e conectada ao estado real do repositorio.

Entrega esperada:
- Criar ou atualizar `docs/README.md`.
- Criar os documentos canonicos listados no playbook.
- Criar um relatorio em `docs/reports/PROJECT_TAKEOVER_AUDIT_<data>.md`.
- Criar um plano em `docs/REBUILD_EXECUTION_PLAN.md`.
- Criar um checklist em `docs/VALIDATION_CHECKLIST.md`.
- Reportar validacoes realmente executadas e validacoes nao executadas.
- Encerrar com status Git e recomendacao objetiva do proximo passo.
```

## Estrutura documental recomendada

Crie esta estrutura no projeto alvo. Ajuste nomes apenas quando o dominio exigir.

```text
docs/
  README.md
  PROJECT_STATE.md
  PRODUCT_VISION.md
  ROADMAP_REBUILD.md
  REBUILD_EXECUTION_PLAN.md
  CODEX_EXECUTION_RULES.md
  VALIDATION_CHECKLIST.md
  ARCHITECTURE_RULES.md
  DATA_MODEL_STRATEGY.md
  AUTH_CONTEXT_STRATEGY.md
  SECURITY_AND_PERMISSIONS.md
  VIEW_API_CONTRACTS.md
  INTEGRATIONS_STRATEGY.md
  AI_GOVERNANCE.md
  DESIGN_SYSTEM.md
  UX_DIRECTION.md
  DOCUMENTATION_LEDGER.md
  ENVIRONMENT_VARIABLES.md
  DEPLOYMENT_STRATEGY.md
  TESTING_STRATEGY.md
  REPOSITORY_STRUCTURE.md
  reports/
    PROJECT_TAKEOVER_AUDIT_<data>.md
    STACK_AND_SECURITY_AUDIT_<data>.md
    REBUILD_READINESS_REPORT_<data>.md
  product/
    FEATURE_INVENTORY.md
    USER_FLOWS.md
    DOMAIN_DECISIONS.md
```

## Conteudo minimo de cada documento

### `docs/README.md`

Indice oficial da documentacao. Deve dizer quais documentos sao canonicos, quais sao historicos e em que ordem o agente deve ler antes de trabalhar.

### `docs/PROJECT_STATE.md`

Estado real do projeto hoje:

- produto e objetivo;
- stack atual;
- funcionalidades existentes;
- funcionalidades parciais;
- funcionalidades falsas ou mockadas;
- riscos tecnicos;
- riscos de seguranca;
- estado de testes;
- estado de deploy;
- bloqueios;
- proxima prioridade recomendada.

### `docs/PRODUCT_VISION.md`

Visao do produto em linguagem de negocio:

- publico-alvo;
- problema resolvido;
- proposta de valor;
- workflows principais;
- limites do produto;
- o que nao sera construido agora.

### `docs/ROADMAP_REBUILD.md`

Roadmap vivo por fases:

- fase 0: takeover e documentacao;
- fase 1: fundacao tecnica;
- fase 2: auth, permissoes e dados;
- fase 3: fluxos principais;
- fase 4: hardening, QA e release;
- backlog futuro;
- decisoes pendentes.

O roadmap nao deve ser lista de desejos. Cada fase precisa ter criterio de aceite e validacao.

### `docs/REBUILD_EXECUTION_PLAN.md`

Plano operacional para o novo agente reconstruir o projeto:

- ordem de leitura;
- gates de entrada;
- lotes executaveis;
- escopo permitido/proibido;
- comandos de validacao;
- stop conditions;
- regra para atualizar docs;
- regra para commits.

### `docs/CODEX_EXECUTION_RULES.md`

Regras permanentes para agentes:

- como ler contexto;
- quando implementar;
- quando parar;
- como tratar mocks;
- como preservar alteracoes existentes;
- como reportar fechamento.

Pode virar base de um `AGENTS.md` do projeto.

### `docs/VALIDATION_CHECKLIST.md`

Checklist de aceite:

- lint;
- typecheck;
- testes unitarios;
- testes de integracao;
- testes de banco, se houver;
- build;
- auditoria de seguranca;
- QA visual/comportamental;
- validacao de permissoes;
- validacao de documentacao.

Inclua bloqueadores explicitos, como segredo exposto, auth apenas no frontend, mock como fonte real, ausencia de isolamento de dados ou falta de teste critico.

### `docs/ARCHITECTURE_RULES.md`

Regras de arquitetura:

- separacao frontend/backend;
- fonte da verdade;
- regras de dominio;
- boundaries entre modulos;
- padroes proibidos;
- padroes esperados;
- criterio para criar novas abstracoes.

### `docs/DATA_MODEL_STRATEGY.md`

Inventario e estrategia de dados:

- entidades atuais;
- tabelas/collections/schemas;
- relacoes;
- dados sensiveis;
- dados operacionais;
- dados derivados;
- migracoes existentes;
- lacunas;
- recomendacao de preservacao ou descarte.

### `docs/AUTH_CONTEXT_STRATEGY.md`

Autenticacao e autorizacao:

- tipos de usuario;
- papeis;
- permissoes;
- escopos;
- tenant/organization/account quando aplicavel;
- rotas protegidas;
- riscos de escalacao;
- regras que precisam ficar no backend.

### `docs/SECURITY_AND_PERMISSIONS.md`

Auditoria de seguranca:

- secrets;
- tokens;
- cookies;
- storage;
- logs;
- dados pessoais;
- permissoes;
- dependencia vulneravel;
- integracoes externas;
- riscos P0/P1/P2.

### `docs/VIEW_API_CONTRACTS.md`

Contratos entre app e fonte real:

- endpoints;
- controllers;
- services;
- queries;
- views/read models;
- commands/RPCs;
- payloads;
- regras de leitura;
- regras de escrita;
- proibicoes de acesso direto.

Se o projeto nao usa banco com views/RPCs, traduza para o equivalente da stack: APIs, services, repositories, commands, query handlers ou server actions.

### `docs/INTEGRATIONS_STRATEGY.md`

Integracoes:

- provedores externos;
- webhooks;
- filas/jobs;
- emails/mensagens;
- pagamentos;
- analytics;
- limites de custo;
- ambiente local/staging/producao;
- o que esta ativo, simulado ou bloqueado.

### `docs/AI_GOVERNANCE.md`

Se houver IA ou planos de IA:

- fontes permitidas;
- fontes proibidas;
- acoes permitidas apenas como sugestao;
- acoes proibidas;
- necessidade de revisao humana;
- logging;
- custo;
- privacidade;
- fallback sem IA.

Se nao houver IA, registre isso explicitamente para evitar que o rebuild invente IA prematuramente.

### `docs/DESIGN_SYSTEM.md`

Contrato visual:

- identidade;
- tokens;
- componentes;
- layout;
- estados de loading/erro/vazio;
- responsividade;
- acessibilidade;
- copy;
- proibicoes visuais;
- criterio de aceite por tela.

### `docs/UX_DIRECTION.md`

Direcao de experiencia:

- fluxos principais;
- jornadas;
- telas esperadas;
- dores atuais;
- estados operacionais;
- requisitos de acessibilidade;
- diferenca entre usuario interno, cliente e admin.

### `docs/DOCUMENTATION_LEDGER.md`

Registro de decisoes e entregas:

- data;
- fase;
- branch/commit quando houver;
- resumo;
- docs alterados;
- contratos afetados;
- telas afetadas;
- validacoes;
- riscos restantes;
- impacto no rebuild.

### `docs/ENVIRONMENT_VARIABLES.md`

Variaveis esperadas, sem valores secretos:

- nome;
- finalidade;
- ambiente;
- obrigatoria/opcional;
- exemplo seguro;
- quem usa;
- risco se ausente.

### `docs/DEPLOYMENT_STRATEGY.md`

Como publicar com seguranca:

- ambientes;
- pre-condicoes;
- comandos;
- rollback;
- migracoes;
- secrets;
- smoke tests;
- stop conditions.

### `docs/TESTING_STRATEGY.md`

Mapa de testes:

- unitarios;
- integracao;
- e2e;
- banco;
- seguranca;
- visual;
- fixtures;
- comandos existentes;
- lacunas de cobertura.

### `docs/REPOSITORY_STRUCTURE.md`

Mapa do repositorio:

- pastas principais;
- o que cada pasta representa;
- arquivos que devem ser preservados;
- arquivos que devem ser deletados;
- artefatos gerados;
- lixo historico;
- estrutura alvo apos rebuild.

### `docs/product/FEATURE_INVENTORY.md`

Inventario funcional:

- funcionalidade;
- status: pronta, parcial, falsa, quebrada, obsoleta, pendente;
- evidencia;
- fonte de dados;
- riscos;
- recomendacao.

### `docs/product/USER_FLOWS.md`

Fluxos do produto:

- ator;
- objetivo;
- entrada;
- caminho feliz;
- estados de erro;
- permissao;
- dados usados;
- criterio de aceite.

### `docs/product/DOMAIN_DECISIONS.md`

Decisoes de dominio:

- termos canonicos;
- entidades;
- relacoes;
- decisoes tomadas;
- decisoes pendentes;
- conceitos proibidos ou ambiguidade conhecida.

## Fase 1: auditoria antes de documentar

O agente deve auditar antes de escrever conclusoes.

Checklist de leitura:

- README e instrucoes de agente;
- manifests (`package.json`, `pyproject.toml`, `pom.xml`, `Cargo.toml`, etc.);
- configs de framework;
- rotas;
- componentes principais;
- backend/API;
- schema/migrations;
- auth;
- testes;
- scripts;
- CI/CD;
- Docker/infra;
- `.env.example` ou docs de ambiente;
- issues/TODOs locais;
- estado Git.

Saida obrigatoria:

- matriz de stack;
- matriz de riscos;
- inventario de funcionalidades;
- lista de mocks;
- lista de dados sensiveis;
- lista de validacoes disponiveis;
- lista de bloqueios para rebuild.

## Fase 2: gerar documentacao canonica

Depois da auditoria, criar os documentos em `docs/`.

Regras:

- tudo deve ser escrito com base em evidencia local;
- quando houver inferencia, marcar como inferencia;
- quando houver duvida, registrar como decisao pendente;
- quando a funcionalidade nao existir, dizer que nao existe;
- quando a funcionalidade existir parcialmente, explicar o limite;
- quando houver risco, classificar severidade;
- nao usar documentacao antiga como verdade se o codigo contradiz.

## Fase 3: relatorio de takeover

Criar `docs/reports/PROJECT_TAKEOVER_AUDIT_<data>.md` com:

- sumario executivo;
- estado do produto;
- stack atual;
- mapa de funcionalidades;
- mapa de arquitetura;
- seguranca e permissoes;
- qualidade e testes;
- frontend/UX;
- backend/dados;
- integracoes;
- IA/automacoes;
- riscos P0/P1/P2;
- o que preservar;
- o que descartar;
- validacoes executadas;
- proximo passo recomendado.

## Fase 4: plano de destruicao controlada e rebuild

Antes de deletar qualquer implementacao, o agente deve produzir um plano com:

- arquivos/pastas preservados;
- arquivos/pastas candidatos a remocao;
- arquivos que exigem backup;
- dados/seeds/migrations que nao podem ser apagados sem decisao humana;
- ordem de limpeza;
- estrutura minima que deve permanecer;
- primeiro commit ou checkpoint recomendado;
- primeiro lote de reconstrucao.

Nada deve ser deletado nesta fase sem confirmacao humana explicita.

## Primeiro prompt para recomecar depois da documentacao

Depois que a documentacao estiver pronta e revisada, use um novo prompt parecido com este:

```text
Leia a documentacao canonica em `docs/`, especialmente:
- docs/README.md
- docs/PROJECT_STATE.md
- docs/PRODUCT_VISION.md
- docs/ARCHITECTURE_RULES.md
- docs/AUTH_CONTEXT_STRATEGY.md
- docs/SECURITY_AND_PERMISSIONS.md
- docs/VIEW_API_CONTRACTS.md
- docs/ROADMAP_REBUILD.md
- docs/REBUILD_EXECUTION_PLAN.md
- docs/VALIDATION_CHECKLIST.md
- docs/reports/PROJECT_TAKEOVER_AUDIT_<data>.md

Objetivo:
Reiniciar este projeto preservando apenas a estrutura aprovada e reconstruindo a base tecnica em lotes pequenos, seguros e validados.

Antes de alterar:
- confira estado Git;
- confirme quais arquivos/pastas serao preservados;
- confirme quais remocoes sao destrutivas e precisam de autorizacao;
- nao use dados reais, secrets, deploy remoto ou migracao remota sem confirmacao.

Primeiro lote:
Executar somente a fundacao tecnica minima definida em `docs/REBUILD_EXECUTION_PLAN.md`, atualizar a documentacao impactada e validar com os gates disponiveis.
```

## Criterios de aceite da fase documental

A fase documental so esta pronta quando:

- `docs/README.md` aponta a ordem correta de leitura;
- `PROJECT_STATE.md` descreve o estado real, nao o desejado;
- `FEATURE_INVENTORY.md` classifica funcionalidades prontas/parciais/falsas;
- `ARCHITECTURE_RULES.md` define fonte da verdade e boundaries;
- `AUTH_CONTEXT_STRATEGY.md` explica usuarios, papeis e escopos;
- `SECURITY_AND_PERMISSIONS.md` lista riscos e bloqueadores;
- `VALIDATION_CHECKLIST.md` tem comandos reais ou lacunas explicitas;
- `REBUILD_EXECUTION_PLAN.md` permite o rebuild em lotes;
- `DOCUMENTATION_LEDGER.md` registra a propria fase documental;
- o relatorio de takeover declara o que preservar, descartar e bloquear;
- o agente informa validacoes realmente executadas.

## Stop conditions obrigatorias

O agente deve parar e pedir decisao humana antes de:

- apagar arquivos em massa;
- resetar banco;
- remover migrations;
- alterar secrets;
- usar service role, token, cookie ou credencial;
- executar deploy;
- executar migracao remota;
- enviar email/mensagem;
- acionar custo;
- usar dados reais de cliente;
- escolher stack nova sem justificar alternativas;
- reconstruir UI sem fonte real de dados;
- manter mock como produto.

## Fechamento esperado do agente

Ao finalizar, o agente deve responder:

```text
Feito:
- [documentos criados/atualizados]
- [principais conclusoes]

Validado:
- [comandos executados]
- [auditorias feitas]

Atencao:
- [riscos]
- [decisoes humanas pendentes]
- [o que nao foi validado]

Status Git:
- [branch]
- [arquivos alterados]
- commit: sim/nao
```

## Recomendacao final

Nao comece destruindo o codigo. Comece destruindo a incerteza.

O ganho real esta em transformar o projeto antigo em conhecimento verificavel: produto, dominio, riscos, arquitetura, seguranca, validacao e plano. Depois disso, a limpeza e o rebuild deixam de ser aposta e passam a ser execucao controlada.
