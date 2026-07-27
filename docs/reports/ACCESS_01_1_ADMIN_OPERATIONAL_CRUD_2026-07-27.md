# ACCESS-01.1 — Interface e CRUD do control plane processados

## Resultado

Status: ACCESS-01 PRONTO PARA GATE REMOTO

Decisão: a fundação existente foi preservada e `/admin/access` passou a usar uma experiência administrativa interna separada de memberships de clientes. O lote local está pronto para o gate remoto, com as limitações operacionais registradas abaixo.

## Preservação

Diretório: `C:\Projetos\GSO-integrations-04`

Branch: `codex/access-01-internal-control-plane`

Commit inicial: `2f07f70`

Checkout original: `C:\Projetos\GSO-old` preservado e não alterado.

Stash: `stash@{0}` editorial preservado, não aplicado, não apagado e não modificado.

Novo worktree: não criado.

Pastas antigas: preservadas; nenhuma limpeza executada.

Secrets: nenhum secret, token, JWT, cookie, senha ou link de convite foi versionado ou incluído nas evidências.

## Auditoria da fundação

Contextos: contexto interno explícito separado do contexto de cliente; deny by default mantido.

Capabilities: catálogo existente reutilizado, com read model administrativo e associação por perfil.

Perfis: perfis canônicos preservados; criação e ativação de perfil personalizado disponíveis.

Overrides: allow/deny individual, justificativa obrigatória, validade opcional no RPC e remoção auditável.

Allowlist: contratos de superfícies existentes preservados; a página não amplia o escopo de outras áreas.

Convites: hash persistido, expiração, revogação e unicidade de convite ativo por e-mail.

RPCs existentes: reutilizados sempre que o contrato era adequado; novos RPCs administrativos são forward-only e security definer com search path vazio.

RLS: catálogo organizacional com RLS; views e tabelas internas sem DML direto para `anon`/`authenticated`.

Lacunas encontradas: o envio oficial de e-mail não foi executado nem publicado neste lote; a tela prepara o convite localmente e aguarda a Edge Function/provedor autorizado. O smoke autenticado foi interrompido por `PGRST001` durante instabilidade/reinício do PostgreSQL local.

Duplicações evitadas: memberships de cliente, `AccessPage.tsx` legado, catálogo legado de áreas-alvo e contratos de autorização existentes não foram apagados nem duplicados como experiência de cliente.

## Git

Main: `origin/main` em `0f7216f6b8dfe72e443813766fea04060945b8f9`.

Commits: `2f07f70 feat(access): criar fundação do control plane interno`; `9a2eccb feat(access): concluir control plane administrativo interno`; commit documental posterior deste relatório.

HEAD: será o commit documental deste fechamento.

Ahead/behind: branch local à frente de `origin/main` pelos commits locais; sem push neste lote.

Working tree: limpo após o commit documental.

Push: não executado.

PR: não criado.

Trailers: nenhum trailer `Co-Authored-By` adicionado.

## Usuários internos

Fonte: `vw_admin_access_internal_users` e `rpc_admin_list_internal_access_users`.

Customer-only excluídos: sim; a view exige contexto interno e não lista contatos ou memberships exclusivamente de clientes.

Listagem: nome, e-mail, área, função, perfil, status, último acesso e ação.

Busca: nome, e-mail, papel e status.

Filtros: área, função, perfil e status.

Detalhe: dados básicos, atribuição, capacidades efetivas retornadas pelo backend, overrides e estado.

Área: edição por RPC com área organizacional canônica.

Função: edição por RPC, filtrada pela área selecionada.

Perfil: troca de perfil por RPC; `Personalizado` mantém o modo sem perfil.

Status: ativo, suspenso e inativo no read model; rótulos administrativos preservam o significado operacional.

Suspensão: ação de suspender sem exclusão destrutiva.

Reativação: ação de reativar sem recriar a identidade.

Histórico: alterações passam pelos mecanismos de auditoria existentes.

Resultado: control plane separado de usuários de cliente e com CRUD de atribuição operacional.

## Convites

Criação: painel com nome, e-mail, área, função, perfil e validade.

Listagem: nome, e-mail, área, função, perfil e status; sem `token_hash` ou token bruto.

Envio local: registro preparado localmente com hash; entrega de e-mail não foi executada.

Reenvio: reservado para a Edge Function oficial e para o gate remoto.

Revogação: RPC existente reutilizado e exposto na UI.

Expiração: validade obrigatória e conferida server-side.

Aceite: RPC base existente preservado; teste autenticado de ponta a ponta não foi concluído devido a `PGRST001` local.

Token: somente hash é persistido; nenhum token foi exposto em listagem, logs ou evidência.

E-mail: normalizado no RPC e sujeito à conferência no aceite.

Provisionamento: contrato base preserva contexto interno, área, função, perfil e overrides.

Rollback: aceite transacional/compensado pelo contrato base; não foi alterado neste lote.

Auditoria: criação e revogação passam por auditoria existente.

Resultado: gestão local administrativa pronta; entrega oficial é dependência explícita do gate remoto.

## Áreas

CRUD: listar, criar, atualizar, ativar e desativar.

Áreas canônicas: Diretoria, Operações, Customer Success, Suporte, Comercial, Financeiro, Produto, Engenharia, Tecnologia, Conteúdo e Conhecimento.

Gestores: campo de gestor preservado no read model e no update.

Ativação: controle por RPC.

Desativação: bloqueada quando existem membros ativos.

Proteção de exclusão: não há exclusão destrutiva pela interface.

Membros: contagem ativa disponível no read model.

Resultado: catálogo organizacional idempotente e separado do catálogo legado.

## Funções

CRUD: listar, criar, atualizar, ativar e desativar.

Relação com área: obrigatória e refletida na UI.

Perfil padrão: opcional, com seleção de perfil ativo.

Ativação: controle por RPC.

Desativação: controle por RPC, sem apagar histórico.

Resultado: funções não duplicam capabilities; apenas organizam atribuições.

## Perfis e capabilities

Perfis canônicos: Administrador da plataforma, Administrador de Analytics, Visualizador do Dashboard, Gestor de Conhecimento, Editor de Conhecimento e Administrador de Acessos.

Perfis personalizados: criação, ativação e desativação disponíveis.

Capabilities: catálogo legível por domínio, nome, chave e associação explícita por perfil.

Relação com screens: contagens de superfícies permanecem no read model existente; a autorização efetiva continua backend-first.

Compatibilidade legada: grants e roles antigos preservados; novas associações coexistem sem substituir memberships de cliente.

Resultado: a UI permite selecionar capacidades por perfil e persiste a associação via RPC validado.

## Overrides

Allow: concessão individual com justificativa.

Deny: bloqueio individual com justificativa.

Precedência: superfície desabilitada, contexto suspenso, deny individual, allow individual, perfil, compatibilidade legada e deny by default.

Justificativa: obrigatória no formulário e validada no backend.

Validade: campo aceito pelo contrato e pronto para uso na API.

Resultado efetivo: detalhe do usuário informa capacidades retornadas pelo backend.

Auditoria: read model exibe origem e autor da alteração; remoção usa RPC dedicado.

Resultado: overrides não são aplicados por combinação local de tabelas no browser.

## RPCs e read models

Usuários: `vw_admin_access_internal_users`, listagem, detalhe, status e atribuição.

Convites: `vw_admin_access_invites`, criação preparada, listagem e revogação.

Áreas: view e RPCs de CRUD organizacional.

Funções: view e RPCs de CRUD por área.

Perfis: view, criação/edição e ativação.

Capabilities: catálogo e `vw_admin_access_profile_capabilities`.

Overrides: view, concessão/bloqueio e remoção.

Autorização: `require_active_actor` e capabilities internas em todas as mutações.

Sanitização: retorno de convites exclui tokens; browser usa apenas client público autenticado.

Resultado: contrato completo para a UI sem DML amplo direto.

## /admin/access

Usuários: tab operacional de colaboradores internos.

Convites: tab de preparação, listagem e revogação.

Áreas e funções: tab de catálogo e atribuição.

Perfis e permissões: tab de perfis e seleção de capabilities.

Estados: loading, denied, erro, vazio e feedback de sucesso das ações.

Desktop: layout responsivo com tabelas roláveis e painéis de detalhe.

Mobile: tabs com rolagem horizontal e formulários empilhados.

Resultado: rota usa `InternalControlPlanePage`; a UI legada permanece preservada fora da experiência principal.

## Personas

Platform admin: mantido como executor autorizado dos RPCs administrativos.

Analytics admin: preservado fora do escopo do control plane.

Dashboard viewer: preservado sem acesso administrativo indevido.

Knowledge manager: preservado no contrato de Knowledge.

Knowledge editor: preservado no contrato de Knowledge.

Access admin: capability explícita para visualizar e administrar acessos internos.

Customer-only: excluído da view de usuários internos.

Suspenso: status impede acesso operacional conforme precedência existente.

Resultado: nenhuma persona de cliente foi convertida em colaborador interno.

## Rotas e release

Dashboard: preservado.

Settings: preservado com escopo próprio.

Knowledge: preservado.

Access: `/admin/access` conectado ao novo control plane.

Rotas ocultas: não alteradas fora do escopo.

Menu: rota existente preservada.

URL direta: segue os guards existentes e exige autorização.

Requests: a página nova usa views/RPCs do control plane.

Redirect: acesso anônimo redireciona para login; smoke comprovou o redirecionamento.

Access denied: estado protegido preservado.

Resultado: não houve alteração da Central, Dashboard, cron HubSpot ou OMIE.

## Segurança

RLS: validada por reset local e pgTAP direcionado.

Anon: sem leitura de catálogo interno ou usuários.

Authenticated: sem DML direto nas tabelas internas.

RPCs: security definer, search path vazio e capability check.

Edge Function: não publicada neste lote; entrega oficial permanece gate remoto.

Service role no browser: inexistente.

Tokens: nenhum token de convite retornado em read model.

Convite reutilizado: contrato base rejeita status inválido/uso repetido.

E-mail divergente: contrato base rejeita divergência.

Auditoria: trilha existente preservada nas mutações.

Resultado: sem ampliação de autorização para cliente ou browser.

## Testes

Contracts: passou.

Web typecheck: passou.

Web build: passou; bundle inclui `InternalControlPlanePage`.

Supabase verify: reset, suíte pgTAP, verify Knowledge e lint passaram anteriormente; a etapa integrada de QA requer `LOCAL_QA_ADMIN_PASSWORD`, ausente no ambiente persistido.

pgTAP: teste ACCESS-01.1 direcionado passou com 19/19; suíte completa já havia passado com 1379 testes antes do acréscimo do read model, e o reset final aplicou a migration do zero.

Node: teste de contrato de UI e rotas focadas passou com 5/5.

CRUD: contratos presentes e migration aplicável do zero; execução autenticada ficou limitada pela indisponibilidade intermitente do PostgREST local.

Convites: criação/revogação cobertas por RPC e UI; entrega real não executada.

Overrides: contrato de allow/deny e remoção coberto pela migration e API.

Personas: matriz documental criada; smoke autenticado não concluído por `PGRST001`.

Rotas: acesso não autenticado redirecionado para login sem erro de console.

RLS: pgTAP direcionado passou.

Browser smoke: smoke anônimo passou; smoke autenticado tentou fixture temporária, mas o PostgreSQL local reiniciou e o PostgREST retornou `PGRST001`.

Desktop: evidência anônima 1440 × 900 gerada.

Mobile: captura autenticada não foi fabricada por ausência de sessão válida.

Inbucket: não utilizado; entrega oficial não autorizada.

Repository check: passou.

Secret scan: passou sem matches nos arquivos rastreados.

Diff check: passou.

Resultado: validações estáticas, migration e contratos aprovados; limitação de infraestrutura local registrada.

## Evidências

Caminho: `output/review-packages/access-01-local-2f07f70/`.

Screenshots: redirecionamento anônimo para login; nenhuma imagem autenticada foi inventada.

Manifesto: `manifest.json` registra tipo, viewport, perfil, estado, descrição e commit.

RPC matrix: `ACCESS_01_RPC_MATRIX.md`.

Persona matrix: `ACCESS_01_PERSONA_MATRIX.md`.

Tokens: não incluídos.

Cookies: não incluídos.

PII: não incluída; fixture local não foi exportada.

Resultado: pacote fora do Git e sem dependências externas.

## Documentação

Project state: atualizado com o escopo e o gate remoto.

Auth strategy: atualizado com o control plane interno e a separação de contextos.

View/RPC contracts: atualizado com os read models e mutações.

Ledger: atualizado com o novo lote e limitações.

Convites: contrato local de hash, expiração e revogação documentado.

Perfis: capabilities e associação por perfil documentadas.

MVP: `/admin/access` definido como control plane interno do release.

Resultado: documentação canônica atualizada sem criar worktree ou limpeza paralela.

## Gate remoto

Solicitado: somente após revisão deste relatório.

Autorizado: nenhuma operação remota autorizada neste lote.

E-mail informado: nenhum.

Operações remotas executadas: nenhuma.

Resultado: aguardando autorização única para publicação controlada.

## Operações não executadas

Push: não executado.

PR: não criado.

Merge: não executado.

Migration remota: não executada.

Deploy: não executado.

Convite remoto: não enviado.

HubSpot: não executado.

OMIE: não executado.

Dashboard UX: não alterado.

Limpeza de pastas: não executada.

Novo worktree: não criado.

Seed remoto: não executado.

Reset remoto: não executado.

Force push: não executado.

## Riscos restantes

- A entrega oficial de convites depende de Edge Function/provedor e de autorização remota específica.
- O smoke autenticado local precisa ser repetido quando o PostgREST/PostgreSQL local estiver estável; não há evidência autenticada fabricada.
- A associação de função de um usuário existente sem convite aceito depende do modelo legado disponível; o read model preserva a origem e não inventa vínculo.

## Próxima ação

Após autorização, publicar o ACCESS-01 em operação controlada.

Depois concluir o DASHBOARD-UX-01.

Não iniciar nova arquitetura de acesso ou outro macro-lote antes do gate remoto.
