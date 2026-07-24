# Auditoria de dados reais e UX de Clientes B2B / Carteira CS

Data: 2026-07-23  
Checkout: `C:\Projetos\GSO-old`  
Escopo: de/para da operação CS Ops, contratos de clientes e colaboradores, e arquitetura visual das telas `/support/clientes`, `/cs/portfolio` e `/admin/tenants`.

## Resultado executivo

O seed local funciona como fixture de QA, mas ainda não representa um cadastro operacional de CS pronto para uso diário. Os dados de cliente estão materializados em entidades reais, porém vários campos importantes da planilha foram comprimidos em `internal_notes`, `operational_flags` ou `metadata`. A atribuição de CSM existe no nível da assinatura, mas os responsáveis ainda não estão vinculados às áreas internas no banco.

A experiência visual também está dividida em três linguagens:

- `Clientes B2B` é uma lista com detalhe inline e busca local, adequada como base técnica, mas insuficiente como cockpit de contas.
- `Carteira CS` é uma lista lateral com detalhe espremido na mesma tela e leitura predominantemente read-only.
- `Contas B2B` (`/admin/tenants`) mantém uma coluna de ferramentas, uma base central e um rail permanente de detalhe. Com a sidebar global, isso cria quatro zonas e reduz a área útil.

Decisão registrada neste lote: o próximo redesign deve usar no máximo duas zonas de trabalho por tela. O detalhe deve abrir como workspace dedicado ou drawer contextual, nunca como uma coluna fixa que comprime a operação.

## Evidência da planilha CS Ops

Arquivo analisado somente para leitura: `C:\Users\edebu\Downloads\CS Ops _ Carteiras e Clusters -v2.xlsx`.

- Aba operacional: `BD_Clientes`.
- 42 colunas.
- 606 linhas de dados.
- Identidade e vínculo externo: `Cliente_ID`, `Nome_Plataforma`, `Razao_Social`, `CNPJ`, `Hubspot_ID`.
- Contrato e produto: `Ativo`, `Teste`, `Status_Contrato`, `Servico`, `Tipo_MRR`, `Valor_MRR`, `MRR_Mensal`.
- Operação e complexidade: `Integracao`, `Fullcommerce`, `Grupo_Ecommerce`, `Sem_Reversa_30d`, `Status_Migracao`, `Expectativa_Migracao`, `Customizado`, `Qtd_Customizacoes`, `Transportadoras`, `Fallback_Correios`.
- Risco e saúde: `Farol`, `Churn_Registrado`, `Motivo_Churn`, `Health`, `Prioridade_CS`, `Observacoes_CS`.
- Roteamento de CS: `Cluster_Final`, `Carteira_Final`, `Responsavel_Final`, `Modelo_Atendimento`, `Frequencia_Contato`.
- Campos calculados da própria planilha: `Score_MRR`, `Score_Complexidade`, `Score_Risco`, `Score_Total`, além dos campos sugeridos e overrides de cluster/carteira.

Abas auxiliares relevantes:

- `TEAM`: 4 linhas de equipe, incluindo Rodolfo Turra, Sirlei Cândido e Mary Laurentino.
- `Carteira_Config`: 9 carteiras/configurações.
- `Clusters`: 8 agrupamentos operacionais.
- `Contato_Inicial_CS`: estrutura de primeira abordagem, com linhas preparadas para acompanhamento.
- `Regras_Clusters`: 18 parâmetros de roteamento e pontuação.
- `Projeto_Clientes` e `Tarefas_Projeto`: estrutura preparada, sem vínculos preenchidos.

Regra de interpretação: valores calculados da planilha podem ser usados como proveniência e seed local, mas não devem continuar como regra escondida em texto ou serem recalculados no frontend.

## Auditoria do backend local

Consulta realizada no banco local, sem escrita remota:

| Contrato | Estado atual | Leitura |
|---|---|---|
| `tenants` | 607 registros | Entidade base de conta/cliente já existe. |
| `customer_account_profiles` | 606 registros | Perfil operacional existe, mas não possui colunas estruturadas para CNPJ, HubSpot ID, MRR, migração, health e carteira. |
| `customer_product_subscriptions` | 606 registros | Assinaturas reais existem; parte dos dados CS Ops está em `notes_internal`/`metadata`. |
| `customer_product_internal_owners` | 575 atribuições | Owner CS existe por assinatura e referencia `profiles`. |
| `customer_segments` / assignments | 8 segmentos / 607 vínculos | Clusterização está materializada, mas ainda não há entidade de carteira com contrato próprio. |
| `profiles` | 5 perfis locais | Identidade interna reaproveitável existe. |
| `internal_area_memberships` | 1 vínculo ativo | O modelo de área/função/telas existe, mas os CSMs do seed ainda não estão cadastrados nas áreas internas. |
| `internal_action_target_areas` | 6 áreas ativas | Customer Success, Produto, Engenharia, Financeiro, Operações e outra área. Não há área `support` explícita. |

Os três owners do seed são perfis QA locais. Os e-mails `qa.local.*@genius.local` não são identidades reais da empresa e não devem ser promovidos automaticamente para produção. O seed deve continuar explicitamente marcado como QA até haver correspondência segura com o diretório real.

## De/para do modelo de domínio

| Operação desejada | Contrato atual | Lacuna | Próxima decisão técnica |
|---|---|---|---|
| Cliente B2B editável | `tenants` + `customer_account_profiles` | Campos CS importantes estão em JSON/notas | Criar read/write model estruturado de perfil CS, preservando proveniência e auditoria. |
| Grupo econômico | `analytics_company_group_resolution` | Contrato existe para reconciliação, não para cockpit CS | Reusar resolução humana e expor grupo no detalhe quando houver vínculo confirmado. |
| Entidade legal | `hubspot_companies` / tenant | Não há associação operacional canônica tenant-grupo-entidade | Fechar associação explícita antes da carga produtiva, sem inferir pela raiz do CNPJ. |
| Negócio | `hubspot_deals` | Contrato analítico existe, associação pode estar vazia | Consumir somente associações HubSpot explícitas no relacionamento do cliente. |
| Carteira CS | owner na assinatura + segmento | Falta carteira como entidade editável com modelo, cadência, prioridade e status | Criar contrato de atribuição de carteira por cliente, com histórico e owner por área. |
| Responsável | `profiles` + `customer_product_internal_owners` | Owner não implica membership de área | Validar que owner ativo tenha profile ativo e membership Customer Success ativa. |
| Funcionário/área/função | `internal_area_memberships` + grants | Área support não está no catálogo e o seed só tem 1 membership | Definir catálogo organizacional e materializar memberships locais de QA com tenant interno explícito. |
| Contato do cliente | `tenant_contacts` | Existe no admin, mas não é o mesmo que colaborador interno | Manter separado: `Usuário da conta` para cliente B2B; `Colaborador interno` para operação. |

## Arquitetura UX/UI aprovada para o próximo ciclo

### Nomenclatura

- `Minha rotina`: cockpit de entrada da pessoa.
- `Clientes`: cockpit operacional de clientes B2B para suporte/CS.
- `Carteira CS`: cockpit de relacionamento, ownership, saúde, cadência e ações.
- `Contas B2B`: administração da entidade cliente, contratos, integrações e usuários da conta.
- `Detalhes da conta`: nome do workspace de um registro selecionado, não um menu principal.
- `Colaboradores`: pessoas internas, áreas, funções e permissões.
- `Usuários da conta`: pessoas vinculadas ao cliente B2B.
- `Produto`: área organizacional; `Acionamentos` é o fluxo de trabalho entre áreas.

### Clientes B2B

- Remover a coluna fixa de ferramentas e o rail permanente de detalhe da operação principal.
- Usar uma única área de trabalho com cabeçalho, busca global de cliente/CNPJ/domínio/ID HubSpot, filtros e tabela densa.
- Exibir logo/avatar determinístico do cliente, nome, grupo econômico quando confirmado, status, produtos, tickets abertos, responsável e última atividade.
- Destacar atenção por semântica: risco, tickets urgentes, ausência de owner e dados incompletos. Não depender só de cor.
- Abrir `Detalhes da conta` como rota/workspace dedicado ou drawer sobreposto, com abas `Resumo`, `Usuários da conta`, `Tickets`, `Produtos`, `Migração`, `Saúde` e `Atividade`.
- Ferramentas administrativas ficam em menu de ações contextual e não ocupam uma coluna contínua.

### Carteira CS

- Remover o detalhe espremido como segunda coluna permanente.
- Cabeçalho com visão da carteira, CSM atual, contagem de contas e alertas acionáveis.
- Tabela/lista central com filtros por responsável, carteira, cluster, health, prioridade, cadência, status contratual, grupo econômico e presença de tickets abertos.
- Seleção abre detalhe de relacionamento dedicado, com ações de atribuir, trocar cadência, registrar follow-up e abrir tickets/acionamentos.
- Gestor vê todas as carteiras; operador vê apenas o escopo autorizado pelo backend.

### Administração de contas B2B

- `Ferramentas` deixa de ser coluna visual permanente; ações como criar, importar, exportar e configurar ficam na toolbar ou em menu de ações.
- A lista central domina a viewport e usa paginação server-side.
- O detalhe deixa de ser rail estreito; vira rota de detalhe com breadcrumb e retorno preservando filtros.
- `Membros` deve ser renomeado para `Usuários da conta` para não confundir com colaboradores internos.

### Shell e responsividade

- Sidebar desktop fixa, sem rolagem própria; grupos colapsáveis e itens governados por permissões reais.
- Mobile recebe menu dedicado, com drawer acessível, foco preservado e alvos de toque de pelo menos 44px.
- Cockpits internos não têm scroll global: rolam tabela, lista e detalhe no componente correto.
- Validar 1440, 1280, 1024, 768 e 390px em light/dark, sem overflow horizontal.

## Status consolidado do projeto

### Concluído e validado localmente

- Dashboard Gerencial integrado a HubSpot e OMIE, com filtros globais, histórico, qualidade de dados, reconciliação, logs, exportação visual e fontes configuráveis.
- OMIE API validada localmente com 3.433 títulos.
- HubSpot faseado por empresas, comercial e CS; catálogo de pipelines e seleção por recorte.
- Fila de suporte com paginação server-side de 50 itens por página e filtros no backend.
- Contrato de relacionamento econômico/legal/deals com associações HubSpot explícitas.
- Central de ajuda e editor de artigos versionados, com governança de publicação.
- Perfis de acesso, memberships internas e grants de telas versionados localmente.
- Mascote Genius e estados operacionais integrados em componentes compartilhados.

### Parcial

- Seed CS Ops local: 606 clientes, perfis, clusters, assinaturas, owners, tickets e ações; ainda é fixture QA, não carga produtiva.
- Carteira CS: leitura real por tenant e owner de assinatura; falta entidade de carteira editável, cadência, prioridade, health e histórico de atribuição.
- Clientes B2B: cadastro administrativo editável existe; falta um cockpit operacional completo e uma modelagem explícita de campos CS.
- Colaboradores: identidade e controle de telas existem; falta seed/membership por área e catálogo organizacional completo.
- Grupo econômico/entidade legal/deals: leitura analítica existe; falta consumo consistente no cadastro e na carteira.
- Redesign global: tokens e direção estão documentados, mas várias telas ainda usam primitives e layouts divergentes.

### Pendente após o lote de implementação

- Materializar o mapeamento seguro dos responsáveis da planilha para perfis/memberships internas, sem usar e-mails QA em produção.
- Migrar os demais campos CS da planilha para o modelo estruturado somente quando houver decisão de quais campos são operacionais editáveis e quais são métricas calculadas.
- Registrar responsáveis como colaboradores internos com correspondência segura e membership na área correta.
- Definir e cadastrar a área organizacional de Suporte, se ela for necessária para o roteamento interno.
- Consumir completamente o contrato de grupo econômico, entidade legal e negócios nas telas B2B/Carteira CS.
- Unificar tokens, componentes de estados, tabelas, KPIs, filtros, labels e CTAs.
- Executar QA visual autenticado e remover blocos históricos ocultos da administração de Contas B2B.
- Corrigir copy PT-BR e remover ocorrências reais de texto corrompido.
- Fechar QA autenticado visual e comportamental, incluindo mobile e dark mode.
- Reconciliar o worktree herdado e separar commits por escopo antes de qualquer publicação.

### Bloqueado por decisão/credencial/ambiente

- Migração remota, deploy, scheduler e publicação de migrations/functions.
- Correspondência de owners QA com identidades reais da empresa.
- Integração GitHub e métricas de Produto, até existir organização/repositório autorizado.
- Carga produtiva da planilha CS Ops, até fechar o ledger de origem, associação e aprovação.

## Critérios de aceite do próximo ciclo

1. Todo responsável visível na carteira deve existir em `profiles`, estar ativo e possuir membership ativa na área correspondente.
2. Todo campo editável da carteira deve ter RPC, validação, RLS, auditoria e teste pgTAP.
3. A tela principal de Clientes B2B não pode manter coluna fixa de ferramentas nem rail fixo de detalhe.
4. O detalhe da conta deve preservar contexto, filtros e retorno sem comprimir a lista principal.
5. Nenhuma métrica, health, grupo ou negócio pode ser inventado quando a fonte estiver ausente.
6. `web:typecheck`, `web:build`, pgTAP e QA visual nos viewports definidos devem passar.
