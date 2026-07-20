# Aprendizados do Projeto Atual

## O que preservar

### 1. Backend como fonte da verdade

O maior acerto arquitetural do projeto atual foi impedir que o frontend vire dono de regra operacional. O novo MVP deve manter:

- views/read models para leitura;
- RPCs/commands para escrita;
- RLS;
- audit logs;
- eventos append-only;
- tenant isolation.

### 2. Separacao entre superficies

O projeto atual separou corretamente:

- Public Help;
- Portal cliente;
- Support Workspace;
- Admin;
- Engenharia;
- Acionamentos internos;
- CS.

O novo MVP deve manter a separacao conceitual, mas implementar somente quatro superficies no primeiro corte: Public Help, Portal, Support e Areas Internas.

### 3. Knowledge governada

A extracao OctaDesk e um ativo real:

- 58 artigos;
- 3 categorias;
- 4 secoes;
- 129 assets;
- origem e estrutura preservadas.

O novo projeto deve usar isso como base da central publica, mas com curadoria minima, bloqueio de sensivel e Markdown seguro.

### 4. Portal cliente com boundary forte

O cliente nao deve ver:

- nota interna;
- audit bruto;
- engenharia interna;
- acionamentos internos;
- storage path;
- dados de outros tenants;
- status tecnico sem traduccao customer-facing.

Essa regra deve nascer no banco, nao na UI.

### 5. Acionamento interno como subfluxo

Financeiro, Produto, Desenvolvimento, Integracoes e CS podem apoiar o suporte, mas nao devem assumir a conversa com o cliente no MVP.

O suporte continua dono do ticket. A area interna devolve informacao para o suporte.

## O que descartar no recomeco

### 1. Escopo OCP amplo

O Operational Control Plane atual modelou produtos, planos, ownerships, subscriptions e varias entidades futuras. Isso pode ser util depois, mas nao deve entrar no MVP novo.

Motivo:

- aumenta superficie de banco;
- cria telas administrativas antes do fluxo principal;
- exige decisoes comerciais que nao bloqueiam a central de ajuda e tickets.

### 2. AI readiness cedo demais

A governanca de IA e boa, mas o MVP nao precisa nascer com tabelas, policies e telas de readiness de IA.

Manter apenas a regra:

- IA futura e assistiva, citavel, auditada e revisada por humano.

### 3. Workspaces completos antes do ciclo principal

Engenharia, CS, financeiro, produto, projetos e tarefas podem virar produto depois. No MVP, devem existir apenas como areas internas acionaveis, sem workspace profundo.

### 4. Dashboards administrativos

O usuario operacional precisa de fila, detalhe e acao. Dashboards devem vir depois de existir uso real e dados confiaveis.

### 5. Documentacao demais como fonte concorrente

O projeto atual acumulou 271 documentos. O novo projeto precisa de menos documentos, mais canônicos:

- produto;
- arquitetura;
- dados;
- fluxos;
- roadmap;
- validacao;
- decisoes.

## Riscos observados

### Risco 1: transformar toda ideia futura em schema agora

Sintoma:

- criar catalogo comercial, subscriptions, health, projetos e AI antes de validar demanda principal.

Mitigacao:

- usar backlog futuro;
- implementar somente quando houver fluxo operacional claro.

### Risco 2: frontend elegante com contrato incompleto

Sintoma:

- tela mostra metrica, status, permissao ou acao indisponivel como se fosse real.

Mitigacao:

- dado ausente vira `Indisponivel`;
- acao sem RPC nao aparece como executavel.

### Risco 3: cliente vendo operacao interna

Sintoma:

- portal expor nota, engenharia, acionamento, audit, metadata tecnica ou detalhe de storage.

Mitigacao:

- read models customer-facing dedicados;
- testes de regressao cross-tenant e anti-leak.

### Risco 4: Knowledge virar copia bruta da OctaDesk

Sintoma:

- publicar HTML legado ou artigo sensivel sem revisao.

Mitigacao:

- importar como origem;
- reescrever ou sanitizar;
- publicar apenas apos gate humano.

### Risco 5: integrar Gmail antes da plataforma estar pronta

Sintoma:

- transformar e-mail em canal primario sem modelo de ticket estavel.

Mitigacao:

- primeiro ticket/portal/suporte;
- depois Gmail como origem e entrega governada.

## Corte recomendado para o novo projeto

### MVP real

- Central de ajuda publica.
- Portal cliente.
- Fila e detalhe do suporte.
- Acionamento interno simples.
- Admin minimo.

### Crescimento controlado

1. Gmail.
2. CS.
3. Financeiro.
4. Produto/desenvolvimento.
5. IA.
6. Projetos/tarefas.

## Regra final

Se uma funcionalidade nao ajuda diretamente um cliente B2B a encontrar resposta, abrir demanda, acompanhar tratativa, ou ajuda o suporte a responder com historico e apoio interno, ela nao pertence ao MVP inicial.
