# BUILD_JOURNAL_SCREEN_SPEC.md

## Objetivo
Especificar a tela interna `Diário de Construção` do Genius Support OS.

Atualização de 2026-05-13: a primeira versão runtime foi implementada em `/admin/build-journal` como conteúdo estático versionado no frontend, dentro do Admin Console e protegida pelo gate administrativo existente. Esta versão não criou backend próprio, migration, tabela, RPC, RLS, fixture, storage, parser dinâmico de markdown, IA ou contrato novo.

Atualização de 2026-05-16: a fase `Build Journal Experience Upgrade V1` refatorou a V1 runtime para uma experiência de leitura guiada. Essa direção serviu como ponte editorial, mas foi superada pela composição dark imersiva e compacta da fase seguinte. A fase não criou backend novo, migration, RPC, tabela, parser dinâmico, IA interativa ou permissão granular nova.

Atualização de 2026-05-16: a fase `Build Journal Immersive Blueprint Fidelity V1` recriou a rota a partir de uma blueprint dark aprovada. O Diário agora opera como uma superfície editorial imersiva, compacta e desktop-first dentro do Admin Console, com hero horizontal dark, paisagem abstrata, faixa `A jornada em uma visão`, grid principal em três colunas, arquitetura explicada, papel da IA, estado atual e rodapé editorial, tudo visível em uma única dobra desktop sem scroll horizontal. A fase permaneceu estática e segura: sem backend novo, migration, RPC, tabela, policy, RLS nova, parser dinâmico, busca backend, storage, file explorer ou permissão granular nova.

Atualização de 2026-05-17: o Diário passou a usar abas internas estáticas para aprofundamento por blueprint. A aba `Arquitetura` foi implementada como a tela `Arquitetura do Genius Support OS`, conectada dentro de `/admin/build-journal`, com conteúdo versionado e sanitizado sobre camadas, contratos, boundaries, segurança e tecnologias principais. A tela reforça backend como fonte da verdade, leitura por views/read models, escrita por RPCs, RLS/Auth, auditoria e IA apenas como assistente. Esta atualização não criou backend, migration, RPC, view, RLS, Supabase contract, parser dinâmico ou permissão nova.

Atualização de 2026-05-17: a aba `IA na Construção` foi implementada como superfície estática do Diário de Construção, explicando o fluxo Humano + GPT + Codex, capacidades atuais, capacidades futuras condicionadas, limites explícitos, governança, estado atual e pré-condições para uso de IA sobre a Knowledge Base. A tela não ativa IA no produto, não cria automação, não cria busca, não indexa conteúdo e não altera backend; ela documenta limites e governança de forma sanitizada.

Atualização de 2026-05-17: o lote `Build Journal Structural Cleanup V1` saneou a estrutura frontend do módulo sem recriar telas visuais. A rota permanece única em `/admin/build-journal`, com abas internas locais: `Visão geral`, `Linha do tempo`, `Arquitetura` e `IA na Construção` implementadas em blueprint light; `Documentos oficiais` e `Próximos passos` continuam como placeholders estáticos honestos. A navegação por abas passou a usar o componente local `BuildJournalSectionTabs`, o rodapé/citação continua centralizado em `BuildJournalQuoteFooter` e a fonte estática ativa foi consolidada em `apps/web/src/features/build-journal/buildJournalContent.ts`, agora enxuta e sem datasets legados órfãos. A limpeza não criou backend, migration, RPC, view, RLS, tabela, Supabase contract, parser dinâmico ou permissão nova.

Atualização de 2026-05-18: a aba `Documentos oficiais` passou a consumir os contratos reais de documentos internos oficiais, usando `vw_internal_documents_catalog` para disponibilidade e `vw_internal_document_detail` para leitura inline. O Diário continua sendo camada narrativa, mantém CTA secundário para `/admin/product-docs?doc=<slug>` e marca documentos fora da whitelist como pendentes ou indisponíveis. Os corpos markdown hardcoded foram removidos do fluxo ativo; o frontend renderiza apenas `body_md_sanitized` retornado pelo backend e não lê filesystem. Esta atualização não criou backend novo, migration, RPC, view, RLS, tabela ou Supabase contract.
Adendo de direção para a próxima rodada: a superfície deve continuar contando a história do produto, mas passar a permitir aprofundamento nos markdowns originais aprovados que sustentam cada fase, bloco e domínio. Essa evolução deve preservar:

- whitelist explícita;
- curadoria editorial;
- ausência de parser dinâmico de filesystem;
- ausência de busca backend;
- impossibilidade de ler arquivos arbitrários.

Também passa a ser desejado um conjunto de ilustrações estáticas, sanitizadas e informativas para apoiar a compreensão de arquitetura, domínios, timeline, fluxo Humano + ChatGPT + Codex e evolução do produto.

## Rotas sugeridas
Rotas possíveis:

- `/admin/build-journal`
- `/system/build-journal`

Recomendação inicial: `/admin/build-journal`, por estar mais próxima do Admin Console e do control plane documental. A alternativa `/system/build-journal` pode fazer sentido se a área for agrupada com observabilidade, auditoria e documentação operacional do sistema.

## Acesso recomendado
A tela deve ser restrita a:

- `platform_admin`;
- perfis internos explicitamente autorizados;
- eventualmente auditores internos ou liderança técnica, se houver contrato de permissão dedicado.

Não deve ser pública, customer-facing nem acessível a usuários de portal cliente. A autorização precisa vir de contrato backend real. O frontend não deve decidir acesso por rota, label visual ou configuração local.

## Header
Título principal:

```text
Diário de Construção
```

Subtítulo sugerido, se necessário:

```text
A história por trás do Genius Support OS: do problema real à construção de uma plataforma CX B2B técnica, segura, escalável e feita para operação.
```

O header deve deixar claro que a tela é documental e interna. A versão atual usa badge estática de atualização segura, hero dark e ilustração abstrata, sem parecer landing page promocional nem dashboard decorativo.

## Layout sugerido
A tela deve seguir a linguagem de cockpit interno do Design System:

- sidebar interna existente;
- conteúdo da rota em dark mode próprio, sem alterar o restante do Admin Console;
- hero horizontal compacto, editorial e com atmosfera visual de jornada;
- faixa horizontal premium para `A jornada em uma visão`;
- grid principal em três áreas: mapa da construção, timeline e documentos-fonte curados;
- segunda faixa com arquitetura explicada, papel da IA e estado atual;
- rodapé editorial;
- prioridade para leitura em tela única desktop, sem aparência de dashboard genérico;
- sem scroll horizontal;
- sem cards empilhados sem ritmo;
- sem rail fake ou navegação inventada.

## Estrutura principal

Atualização do recorte runtime atual:

- visão geral do produto;
- problema operacional de origem;
- escolha da stack;
- arquitetura backend-first;
- frontend e Design System;
- Supabase, PostgreSQL, RLS, views e RPCs;
- segurança e permissões;
- colaboração Humano + ChatGPT + Codex;
- IA no processo e no produto, com limites explícitos;
- linha do tempo de construção;
- decisões importantes de produto;
- domínios já construídos;
- bloqueios e fora de escopo;
- próximos blocos recomendados.

### 1. Visão geral
Resumo do que é o Build Journal, por que existe e quais limites de segurança se aplicam.

Deve diferenciar:

- produto real construído;
- documentação estratégica;
- specs futuras;
- partes ainda bloqueadas.

### 2. Timeline por fases
Timeline central com fases como:

- visão do produto;
- documentação estratégica;
- arquitetura;
- Supabase/PostgreSQL;
- auth, tenancy e RLS;
- tickets;
- Knowledge Base;
- Admin Console;
- Support Workspace;
- Customer Account Profile;
- Engineering Workspace;
- Customer Portal;
- design system e blueprints;
- futura IA operacional.

Cada item deve mostrar apenas resumo seguro, documentos relacionados e status real. Não deve simular métrica, porcentagem, maturidade ou prontidão sem fonte contratual.

### 2.1 Navegação interna
A composição atual não depende mais de índice lateral sticky nem de âncoras como eixo principal. A navegação passou a ser espacial:

- hero compacto para orientar a leitura em poucos segundos;
- faixa `A jornada em uma visão` como trilha de entrada;
- grid principal com os três blocos mais importantes já visíveis na primeira dobra;
- CTAs curados para `/admin/product-docs` quando o leitor precisar aprofundar a leitura.

### 3. Arquitetura
Seção explicando a divisão entre:

- frontend;
- backend;
- banco;
- documentação;
- testes;
- CI;
- IA assistiva.

A explicação deve reforçar que o app lê por views/read models e escreve por RPCs, sem leitura direta de tabelas-base pelo frontend.

### 4. Stack
Rail ou bloco lateral com:

- monorepo;
- `apps/web`;
- React;
- Vite;
- TypeScript;
- Tailwind;
- React Router;
- Supabase;
- PostgreSQL;
- RLS;
- views/read models;
- RPCs;
- pgTAP;
- GitHub Actions;
- contratos TypeScript;
- documentação versionada.

### 5. Segurança
Bloco fixo ou rail com mensagens curtas:

- multi-tenancy;
- `tenant_id` explícito;
- RLS;
- audit logs;
- grants restritos;
- storage privado para evidências;
- signed URLs temporárias;
- sem leitura direta de tabela-base pelo app;
- IA sem autonomia decisória.

Não expor detalhes que ensinem bypass, paths internos, payloads ou policies completas.

### 6. Decisões-chave
Lista editorial de decisões:

- backend primeiro;
- contratos antes de UI;
- documentação como fonte de verdade;
- UI sem feature fake;
- Knowledge pública apenas com publicação governada;
- Portal cliente separado do Admin;
- Customer Account Profile sem virar CRM genérico;
- Engineering Workspace separado do ticket;
- IA futura apenas assistiva e citável.

### 7. Humano + ChatGPT + Codex
Seção obrigatória para explicar o workflow:

- Humano como owner de produto, contexto operacional e decisão final;
- ChatGPT como arquiteto de produto, PM técnico, analista de processos e gerador de prompts;
- Codex como executor técnico no repositório, com leitura de contexto, edição de arquivos e validação;
- documentação versionada como memória operacional do projeto.

Evitar expor prompts crus, credenciais, conversas privadas ou decisões sensíveis não sanitizadas.

### 8. Da documentação ao produto
Seção mostrando como docs oficiais viram implementação:

- visão e regras;
- contracts;
- migrations quando aprovadas;
- testes;
- frontend consumindo contratos;
- atualização de `PROJECT_STATE.md` e `DOCUMENTATION_LEDGER.md`.

Deve reforçar que a fase documental original criou apenas documentação e especificação; a V1 runtime atual usa conteúdo estático versionado e não criou backend próprio.

### 9. Prints das telas
Seção futura para evidências visuais.

Regras:

- prints devem ser sanitizados;
- não usar dados reais de clientes;
- não mostrar e-mails reais, nomes reais, tickets reais, anexos reais ou logs;
- não mostrar secrets, tokens, payloads, URLs assinadas, storage path ou headers;
- prints devem representar telas já existentes ou blueprints aprovados;
- quando o print for blueprint, declarar que é blueprint, não tela runtime.

### 10. Aprendizados
Espaço para registrar aprendizados técnicos e de produto:

- o que evitou feature fake;
- onde contratos reduziram risco;
- onde RLS/auditoria impediram atalho inseguro;
- onde a documentação evitou drift;
- quais decisões ainda dependem de Produto ou Engenharia.

### 11. Próximos passos
Listar próximos blocos documentais ou técnicos apenas quando já houver base em `PROJECT_STATE.md`, `ROADMAP_BUILDOUT_V3.md` ou documento de fase aprovado.

Não prometer implementação automática.

## Conteúdo proibido na tela
A tela não pode expor:

- dados reais de clientes;
- secrets, tokens, credenciais ou chaves;
- logs crus;
- payloads técnicos sensíveis;
- stack traces completos;
- headers, cookies, JWTs ou refresh tokens;
- paths internos de storage;
- URLs assinadas;
- metadata bruta de auditoria;
- `before_state` e `after_state` brutos;
- conteúdo Knowledge interno/restrito sem aprovação;
- prompts brutos com contexto sensível;
- detalhes de segurança que facilitem bypass.

## Estados esperados
Quando implementada, a tela deve ter estados honestos:

- conteúdo disponível;
- seção ainda não documentada;
- print indisponível;
- documento não publicado internamente;
- acesso negado;
- erro de carregamento;
- dados sanitizados.

Nenhum estado deve fingir que um contrato, tela ou feature existe se ainda for apenas plano.

## Contratos futuros necessários
Se a tela for estática e alimentada por markdown versionado, pode nascer como leitura documental sem backend novo, desde que a autorização da rota já exista no shell interno.

Se a tela precisar de conteúdo dinâmico, prints governados, decisões versionadas no banco, comentários internos, busca, filtros por fase ou anexos, será necessário criar contrato futuro explícito antes da UI:

- read model de conteúdo permitido;
- regra de autorização;
- política de sanitização;
- origem de documentos/prints;
- testes de acesso;
- registro no `DOCUMENTATION_LEDGER.md`.

## Fora de escopo desta versão
- backend próprio;
- backend novo;
- migration;
- RPC;
- RLS;
- tabela;
- fixture;
- upload de prints;
- indexação de documentos;
- integração com IA;
- publicação externa.

## Implementação V1
- rota real: `/admin/build-journal`;
- shell: Admin Console existente;
- acesso: gate administrativo existente;
- conteúdo: `apps/web/src/features/build-journal/buildJournalContent.ts`;
- tela: `apps/web/src/features/build-journal/BuildJournalPage.tsx`;
- navegação: entrada `Diário de Construção` na navegação administrativa;
- limite registrado: sem permissão granular dedicada para a área nesta V1.

## Critérios de aceite para evoluções futuras
Qualquer evolução posterior da tela deve:

- ser restrita a perfis internos autorizados;
- usar fonte documental versionada;
- distinguir existente, parcial, bloqueado e futuro;
- não expor dados reais;
- não expor secrets, logs crus ou payloads;
- usar prints sanitizados;
- respeitar o Design System V3;
- passar typecheck, build e validação visual quando aplicável;
- atualizar `PROJECT_STATE.md`, `VIEW_RPC_CONTRACTS.md` se houver contrato novo e `DOCUMENTATION_LEDGER.md`.
