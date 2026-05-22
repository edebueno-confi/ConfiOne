---
name: genius-cockpit-ui-blueprint
description: Transformar blueprints, prints, screenshots, wireframes, críticas visuais e decisões de produto em implementações React/Tailwind fiéis, operacionais, limpas e aderentes ao Design System V3 do Genius Support OS. Usar quando a tarefa envolver blueprint de tela, redesign visual, polish de interface, crítica de UI, layout operacional, responsividade, densidade visual, drawer, rail, tabela, fila, thread, cockpit, tradução de imagem para React/Tailwind, revisão de copy visível, remoção de poluição visual ou validação visual antes de implementar.
---

# genius-cockpit-ui-blueprint

## Função

Transformar blueprints, prints, screenshots, wireframes e descrições de produto em telas de cockpit operacional B2B, com alta fidelidade visual, baixa poluição, hierarquia clara, copy objetiva e aderência aos contratos reais do Genius Support OS.

## Quando usar

Usar esta skill sempre que a tarefa envolver:

- desenhar ou implementar telas do Genius Support OS;
- reproduzir blueprint PNG;
- adaptar screenshot aprovado;
- melhorar UX operacional;
- reduzir esforço cognitivo;
- revisar copy visível;
- validar scroll, overflow, truncamento e responsividade;
- criar prompt ou execução de UI para Codex;
- implementar cockpit, workspace, fila, detalhe, rail, drawer ou painel operacional.

Carregar as referências conforme a tarefa:

- Ler `references/blueprint-analysis-checklist.md` antes de interpretar blueprint, print ou screenshot.
- Ler `references/cockpit-layout-rules.md` ao estruturar cockpit, fila, rail, drawer, tabela, timeline ou composer.
- Ler `references/copy-and-language-rules.md` ao revisar rótulos, botões, estados vazios, erros e mensagens operacionais.
- Ler `references/visual-density-and-scroll-rules.md` ao validar densidade, scroll, truncamento e viewport.
- Ler `references/blueprint-to-react-tailwind-rules.md` antes de implementar React/Tailwind.
- Ler `references/qa-visual-validation-checklist.md` antes de encerrar a tarefa.

## Princípio absoluto

O Genius Support OS é cockpit operacional B2B.

Não é:

- dashboard genérico;
- CRM genérico;
- CRUD empilhado;
- landing page;
- SAC B2C;
- coleção de cards administrativos;
- tela bonita sem função.

É:

- estação de trabalho para suporte, CS, engenharia, clientes B2B e operação;
- ambiente de ação diária;
- superfície de decisão rápida;
- sistema com histórico, contexto, segurança e governança.

## Hierarquia de decisão visual

Seguir sempre esta ordem:

1. Blueprint PNG aprovado.
2. Screen spec da tela, se existir.
3. `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md`.
4. Contratos reais de dados, views, RPCs e permissões.
5. Implementação atual.

A implementação atual nunca justifica:

- baixa fidelidade ao blueprint;
- excesso de cards;
- scroll global indevido;
- copy técnica;
- ação fake;
- componente inflado;
- layout genérico.

## Regras arquiteturais invioláveis

- Backend é source of truth.
- Frontend apenas renderiza dados e chama RPCs.
- Não criar regra de negócio no frontend.
- Não calcular SLA, status, prioridade, severidade, permissão ou visibilidade no frontend.
- Não ler tabela base diretamente.
- Não criar mocks se houver contrato real.
- Não criar ação fake.
- Não expor nomes de views, RPCs, Supabase, RLS, storage path, bucket, payload, metadata bruta, UUID técnico ou `tenant_id` na UI.
- Onde dado vier ausente, mostrar `Indisponível`.
- Onde ação não tiver contrato real, mostrar `Ação indisponível nesta versão` ou bloquear honestamente.
- Preservar multi-tenancy, auditoria, RLS, permissões e boundaries de domínio.

## Método de trabalho obrigatório

Seguir esta sequência:

1. Auditar a tarefa e identificar a tela e o domínio.
2. Ler os documentos obrigatórios relacionados.
3. Identificar os contratos reais usados pela tela.
4. Analisar o blueprint visual recebido.
5. Separar a tela em zonas: navegação, fila ou lista, conteúdo principal, rail ou contexto, drawer ou modal, composer ou CTA e estados.
6. Definir o fluxo operacional real do usuário.
7. Remover ruído antes de adicionar componente.
8. Priorizar a ação principal.
9. Reescrever a copy para linguagem operacional.
10. Implementar com fidelidade ao blueprint.
11. Validar scroll, overflow, truncamento, loading, vazio, erro e permissão.
12. Rodar `typecheck` e `build` proporcionais ao escopo.
13. Reportar arquivos, decisões, validações e limitações.

## Política de copy

Usar:

- Ticket
- Cliente
- Responsável
- Prioridade
- Severidade
- Categoria
- Evidência
- Conhecimento
- Nota interna
- Resposta pública
- Acionamento
- Indisponível
- Sem permissão
- Ação indisponível

Evitar:

- backend
- Supabase
- RPC
- view
- tenant
- RLS
- policy
- storage
- bucket
- payload
- metadata
- source of truth
- work item
- read model
- contrato
- UUID
- path interno

A copy deve ser:

- curta;
- operacional;
- direta;
- sem explicações longas;
- sem linguagem institucional;
- sem termos técnicos;
- sem repetir informações;
- sem distrações.

## Tags e cores

Usar tags e cores para guiar atenção, não para decorar.

Usar tags para:

- status;
- urgência;
- prioridade;
- severidade;
- vencimento;
- visibilidade;
- ação indisponível;
- evidência;
- conhecimento;
- acionamento.

Aplicar estas regras:

- usar no máximo 2 ou 3 tags fortes por bloco;
- usar azul para seleção e ativo;
- usar vermelho para crítico, urgente e vencido;
- usar amarelo para atenção, pendência e nota interna;
- usar verde para resolvido e disponível;
- usar cinza ou azul suave para neutro;
- se tudo chama atenção, nada chama atenção.

## Layout e densidade

Obrigar:

- menos cards;
- menos bordas;
- menos textos;
- menos CTAs concorrentes;
- mais hierarquia;
- mais agrupamento lógico;
- mais foco na ação principal;
- scroll interno apenas no container correto;
- sem scroll global em cockpits operacionais;
- sem scroll horizontal;
- composer sempre acessível quando houver conversa;
- drawer com CTA visível;
- rail apoiando o conteúdo principal, sem competir com ele.

## Drawers e painéis laterais

Drawers devem:

- abrir sob demanda;
- manter a tela principal visível;
- ter header claro;
- ter subtítulo curto;
- ter conteúdo compacto;
- ter CTA fixo;
- evitar rolagem vertical;
- não virar página administrativa dentro da tela.

Drawers não devem:

- esconder a conversa principal sem necessidade;
- conter texto longo;
- ter cards gigantes;
- duplicar dados do rail;
- criar ação fake.

## Validação visual obrigatória

Sempre reportar:

- `window.innerWidth`;
- `window.innerHeight`;
- `document.scrollingElement.scrollHeight`;
- `document.scrollingElement.clientHeight`;
- se há scroll global;
- quais containers têm scroll interno;
- se existe scroll horizontal;
- se drawer cabe sem rolagem;
- se textos longos truncam corretamente;
- se CTAs continuam visíveis;
- se loading, vazio, erro e sem permissão estão cobertos.

## Relatório final padrão

Finalizar respostas com:

- arquivos alterados;
- telas ou componentes afetados;
- contratos reutilizados;
- confirmação de que não houve backend novo, se aplicável;
- validações executadas;
- limitações honestas;
- pendências de produto ou contrato;
- evidência de aderência ao blueprint.
