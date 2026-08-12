# Admin Access Design Spec

> **Contrato corrente — 2026-08-11.** A superfície vigente possui somente as abas
> `Usuários`, `Estrutura` e `Perfis`. A criação é direta em `Usuários`; a aba
> `Convites` não existe mais na UI. Registros e APIs históricas de convite são
> preservados fora da superfície operacional.

## Tela

`/admin/access`

## Objetivo

Gerenciar usuários internos, estrutura organizacional, perfis e permissões da plataforma.

Deve comunicar governança e segurança, não apenas cadastro de usuários.

## Estrutura

### Sidebar Admin

Item ativo: `Access`.

### Topbar

Pills:
- `DEVELOPMENT`
- `PLATFORM_ADMIN`

### Cabeçalho

Título: `Usuários e acessos`.

Subtítulo:
- Governança de acesso, estrutura, perfis e permissões.

### Tabs

Usar:
- Usuários, ativo.
- Estrutura.
- Perfis.

Não exibir `Convites`: a criação de usuário é direta e o histórico de convite
não é uma superfície de trabalho.

### Padrão de interação corrente

- Estrutura e Perfis usam listas compactas com uma ação primária por linha;
  não usar tabela larga para repetir contagens e estados.
- A seleção abre o detalhe ao lado no mesmo quadro de trabalho.
- `Editar área` e `Editar perfil` abrem diálogo modal identificado pelo recurso
  selecionado, com foco no primeiro campo, `Esc` e botão de cancelar.
- As permissões de telas por perfil e por colaborador ficam em painéis lado a
  lado; cada catálogo possui rolagem interna, sem empurrar a lista principal.

### KPIs

- Usuários ativos.
- Usuários sem estrutura.
- Admins.
- Perfis ativos.

## Layout principal

Grid de trabalho em 2 colunas: lista compacta à esquerda e detalhe contextual
à direita. Em Perfis, os catálogos de telas aparecem abaixo em dois painéis
paralelos.

### Coluna esquerda: lista operacional

Card da superfície selecionada (`Usuários`, `Estrutura` ou `Perfis`).

Conteúdo:
- Busca e filtros compactos.
- Uma linha por recurso, com nome, metadados úteis, status e ações.
- Filtros específicos da superfície: área, perfil, tipo ou status.
- CTA contextual: `Criar usuário`, `Criar área` ou `Criar perfil`.

### Centro: usuários

Lista densa.

Cada linha:
- Nome.
- E-mail.
- Papel global ou tenant role.
- Tenant/membership.
- Status.
- Último acesso.
- Menu kebab.

Linha selecionada destacada.

### Rail direito: usuário selecionado

Título: `Usuário selecionado`.

Conteúdo:
- Card navy com nome/e-mail.
- Status.
- Papel.
- Tenant.
- Último acesso.
- CTAs:
  - `Gerenciar acesso`.
  - `Reenviar convite`, quando aplicável.
- Cards:
  - Memberships.
  - Permissões efetivas.
  - Atividade recente.
  - Alertas de segurança.

## Regras visuais

- Segurança deve ser clara.
- Usar pills para papéis e status.
- Estados sensíveis devem ter destaque moderado, não alarmista.

## Proibições

- Ocultar usuário sem tenant.
- Usar linguagem técnica de backend.
- Criar ações não suportadas por contrato.

## Critérios de aceite

- Tela permite entender quem tem acesso a quê.
- Papéis e memberships ficam evidentes.
- Ações perigosas são visualmente controladas.

## Nota V3

- O cockpit `/admin/access` continua como control plane geral de memberships.
- Papéis `customer_user` e `customer_manager` podem aparecer na leitura consolidada e precisam ser rotulados sem cair em `Indisponível`.
- A governança dedicada do Portal Cliente B2B fica em `/admin/customer-portal`, para evitar misturar controle customer-facing com o fluxo geral de access.
