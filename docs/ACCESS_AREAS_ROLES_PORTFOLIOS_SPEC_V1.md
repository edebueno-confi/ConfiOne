# Spec V1 — Áreas, papéis, acessos e carteiras operacionais

**Produto:** Genius Support OS
**Status:** Proposta canônica para execução local
**Data:** 2026-07-23
**Responsável:** Codex, em colaboração com o PO

## 1. Decisão de produto

O sistema não deve ser reiniciado nem ter os módulos atuais apagados. O
problema observado é principalmente de arquitetura de informação, hierarquia
visual e contratos de acesso; o backend, as integrações, as migrations, a
central de ajuda e o dashboard já representam trabalho válido e não devem ser
descartados.

O release urgente, com objetivo de publicação até o fim de 2026-07-24, deve
ser uma superfície focada, composta por:

1. Dashboard gerencial;
2. Central de ajuda pública;
3. Administração mínima necessária para autenticação, perfis e integrações,
   visível somente a administradores.

Os demais módulos não serão descartados. Eles permanecem no repositório e no
backend porque ainda precisam de evolução funcional, contratos, regras de
negócio e acabamento visual. Podem ficar fora da superfície pública do release
urgente por allowlist/feature flag, enquanto continuam sendo desenvolvidos em
lotes próprios. Não haverá cópia paralela do projeto nem exclusão física de
telas nesta fase.

## 2. Problema a resolver

As telas atuais misturam, na mesma viewport:

- navegação entre contextos;
- filtros operacionais;
- lista principal;
- detalhes do item selecionado;
- atalhos e configurações específicas;
- permissões globais e permissões por tela.

Isso produz colunas estreitas, rolagem excessiva, perda de contexto e
duplicação de controles. A tela de Acessos é o exemplo mais evidente: ela
combina Usuários, Papéis, Convites, Permissões, um bloco especial de acesso ao
Dashboard, filtros, tabela e detalhes permanentes.

## 3. Modelo de domínio

### 3.1 Área interna

Representa uma unidade organizacional e operacional, por exemplo Customer
Success, Suporte, Financeiro ou Produto.

Campos mínimos:

- `id`, `tenant_id`, `name`, `code`, `status`;
- `default_landing_route`;
- `default_workspace`;
- `allowed_entity_types`;
- `default_role_id` opcional;
- `created_at`, `updated_at` e auditoria.

Uma área define o contexto inicial de trabalho e os defaults de acesso. Ela
não concede automaticamente todas as ações nem substitui o papel do usuário.

### 3.2 Papel/perfil

Representa o nível de atuação dentro de uma área. Perfis canônicos iniciais:

- gestor;
- operador;
- solicitante;
- leitor;
- personalizado.

Cada perfil possui grants de tela e de ação separados. Exemplos de ações:

- visualizar;
- criar;
- editar;
- atribuir;
- exportar;
- administrar configurações;
- executar sincronização.

As dependências de tela são declaradas no catálogo de navegação. Ao selecionar
uma tela dependente, o backend/frontend deve pré-selecionar suas dependências,
mas a decisão final deve ser persistida no perfil e auditada.

### 3.3 Membro/colaborador

É a identidade que acessa o sistema. Um colaborador pode pertencer a mais de
uma área e ter papéis diferentes por área, desde que isso esteja explícito no
vínculo de membership.

O cadastro deve separar:

- identidade e status do usuário;
- área de atuação;
- função na área;
- perfil de acesso;
- cliente/escopo operacional, quando aplicável;
- carteira(s) atribuída(s), quando aplicável.

### 3.4 Carteira operacional

Carteira é uma configuração real e editável do domínio, não apenas um filtro
visual ou uma cópia de planilha.

Campos mínimos:

- `id`, `tenant_id`, `area_id`, `name`, `code`, `status`;
- tipo de carteira (`cs`, `suporte`, `financeiro`, futuro `produto`);
- regra de entrada: manual, por filtro ou híbrida;
- owner/gestor responsável;
- membros autorizados;
- clientes/contas vinculados;
- prioridade, cadência e modelo de atendimento;
- datas de vigência, origem e observações;
- histórico imutável de alterações.

Uma área pode possuir várias carteiras. Um cliente pode participar de mais de
uma carteira quando os contextos forem diferentes, por exemplo CS e suporte.
O vínculo deve ser explícito; não se deve inferir carteira por nome do cliente.

### 3.5 Associação operacional

Negócios, tickets, ações e eventos devem apontar para o cliente/conta e,
quando houver contexto, para a carteira e o responsável. A empresa/conta não
precisa ter um único dono universal. O owner pertence ao vínculo operacional
adequado.

## 4. Arquitetura de informação

### 4.1 Shell global

- sidebar sem rolagem própria;
- apenas grupos de primeiro nível: Minha rotina, Inteligência e
  Administração;
- submenus colapsáveis para as opções secundárias;
- preferências de usuário e tema no header global;
- menu móvel próprio, com painel/overlay e foco acessível;
- rota inicial determinada por área e perfil.

“Engenharia” não deve ser um grupo de navegação global. É uma área de atuação
que determina a rotina, os acessos e a landing page do colaborador.

### 4.2 Padrão de tela

Cada tela deve ter uma única tarefa principal e no máximo duas zonas de
trabalho:

1. contexto e lista/canvas principal;
2. detalhe contextual, aberto por drawer, rota ou workspace dedicado.

Regras:

- título, descrição e CTA primário no cabeçalho;
- filtros em uma toolbar única, com busca e filtros secundários agrupados;
- tabs somente para contextos irmãos;
- tabela/lista dominante, com densidade legível;
- detalhe nunca deve ocupar um rail permanente estreito quando exigir leitura
  ou edição extensa;
- ações destrutivas ou raras ficam em menu contextual;
- estados vazio, carregando, erro e sucesso são padronizados;
- espaçamento, tipografia, bordas, foco, semanticidade de cores e breakpoints
  vêm dos tokens do design system.

## 5. Redesign específico da tela de Acessos

### Cabeçalho

Título “Acessos”, descrição curta e CTA “Convidar usuário”. O bloco especial
“Acesso ao Dashboard Gerencial” deixa de ser uma tabela separada e passa a ser
um perfil/grant filtrável.

### Navegação de contexto

Uma navegação segmentada única:

- Usuários;
- Papéis;
- Convites;
- Permissões.

Somente uma dessas superfícies é renderizada por vez.

### Usuários

Toolbar com busca, área, papel, status e carteira. A tabela exibe usuário,
área, função, perfil, status, último acesso e ação. O detalhe abre em drawer ou
rota dedicada, nunca como coluna fixa concorrendo com a tabela.

### Papéis

Lista de perfis nomeados e personalizados. A edição ocorre em workspace próprio
com duas seções: telas e ações. Dependências aparecem explicitamente e são
selecionadas automaticamente quando necessário.

### Permissões

Catálogo de telas e ações por área, separado da edição de um usuário. O usuário
recebe um perfil; exceções individuais são raras, nomeadas e auditadas.

### Convites

Fluxo isolado de convite, expiração, reenvio e aceite. Não misturar convite com
edição de usuários existentes.

## 6. Administração de áreas e carteiras

A tela de Áreas internas deve trabalhar como um cockpit administrativo:

- lista de áreas com status e landing page;
- detalhe em workspace dedicado;
- aba “Pessoas” para memberships e funções;
- aba “Acesso padrão” para perfil, telas e ações sugeridas;
- aba “Carteiras” para criação, edição, membros e clientes;
- aba “Auditoria” para alterações.

Ao criar uma área, o administrador pode definir:

1. ambiente/landing page padrão;
2. módulos habilitados;
3. perfil padrão sugerido;
4. telas e dependências pré-selecionadas;
5. carteiras iniciais e regra de composição.

Esses defaults não devem sobrescrever permissões existentes sem confirmação
explícita e registro de auditoria.

## 7. Contratos backend necessários

Antes de ampliar a UI, auditar equivalentes existentes e então materializar,
se ainda não existirem:

- view/read model de áreas com landing e módulos;
- view/read model de papéis, grants e dependências;
- RPC de criação/edição de área com auditoria;
- RPC de criação/edição de carteira com histórico;
- RPC de vínculo de membro a área/carteira;
- RPC de atribuição de cliente a carteira;
- validação de escopo, RLS e permissão por ação;
- catálogo canônico de rotas, telas e dependências;
- contrato de erro consistente para o frontend.

Não criar duplicações se `memberships`, `profiles`, `permissions`, carteiras ou
contratos equivalentes já cobrirem o caso. Toda escrita deve passar por RPC ou
comando backend autorizado.

## 8. Problemas técnicos registrados

O console fornecido mostra HTTP 500 repetido em:

- `vw_support_tickets_queue`;
- `rpc_support_ticket_queue_page`.

O log não contém a exceção SQL raiz. Portanto, o diagnóstico correto é:

1. capturar logs do PostgREST/Postgres no ambiente local;
2. executar a view e a RPC com o mesmo contexto de sessão;
3. localizar a coluna, view, policy ou assinatura incompatível;
4. corrigir contrato/migration e adicionar teste pgTAP;
5. validar a fila com paginação server-side e estados de erro no frontend.

O aviso do React DevTools não é erro de aplicação. Também há registros legados
com texto corrompido (`�`) no seed; a correção deve usar a fonte original e
migration auditável, sem substituição heurística.

## 9. Estratégia de release

### Release urgente — Dashboard + Central de ajuda — até 2026-07-24

- dashboard gerencial funcional e responsivo;
- filtros, KPIs, sincronizações, logs e exportação visual;
- central de ajuda pública com busca, categorias, artigos ricos e avatar do
  Gênio;
- autenticação e superfície de administração mínima;
- allowlist/feature flag ocultando módulos operacionais ainda incompletos, sem
  removê-los do produto;
- smoke test de publicação com autenticação, dados reais disponíveis, estados
  de erro, sincronização e responsividade.

### Desenvolvimento contínuo — Cockpits operacionais

- Clientes B2B;
- Carteira CS;
- Acessos;
- Áreas internas;
- suporte, tickets e produto.

Esses módulos continuarão recebendo implementação funcional e redesign em
paralelo, mas só serão promovidos à superfície de uso geral após passar pelo
mesmo contrato visual e pela matriz de QA responsivo, light/dark,
acessibilidade, loading, erro, vazio e overflow.

## 10. Critérios de aceite

- Nenhuma tela usa rail permanente estreito para detalhes extensos.
- Nenhuma sidebar exige rolagem vertical para alcançar opções essenciais.
- Filtros, tabs e detalhes têm hierarquia consistente em todas as telas.
- Área, perfil, função e carteira podem ser configurados sem editar dados
  diretamente no frontend.
- Permissões e vínculos respeitam RLS, escopo e auditoria.
- O usuário inicia na rotina correta para sua área e perfil.
- Dashboard e Central de ajuda podem ser entregues sem expor módulos não
  prontos.
- O erro da fila de suporte deixa de retornar 500 sem diagnóstico e passa a
  ter contrato de erro observável.
- Typecheck, testes, build e QA visual autenticado passam antes de release.

## 11. Ordem de execução

1. Congelar a superfície do release urgente sem apagar módulos.
2. Corrigir bloqueadores do Dashboard, integrações e carregamento.
3. Consolidar tokens e primitives mínimos usados pelo Dashboard e pela Central.
4. Finalizar Dashboard e Central de ajuda/editor.
5. Executar QA de publicação até 2026-07-24.
6. Corrigir o contrato 500 da fila de tickets como primeiro lote pós-release.
7. Materializar contratos de áreas, papéis, memberships e carteiras.
8. Redesenhar Acessos e Áreas internas.
9. Redesenhar Clientes B2B, Carteira CS e Contas B2B.
10. Continuar a evolução funcional de suporte, produto e demais módulos, com
    promoção progressiva após aceite.
