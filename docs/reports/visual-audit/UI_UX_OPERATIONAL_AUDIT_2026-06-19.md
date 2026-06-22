# Auditoria UI/UX Operacional - Genius Support OS

Data: 2026-06-19
Escopo: layout, design, UI, UX e copy operacional.
Foco: cockpit B2B, desktop-first, responsivo, sem scroll horizontal, sem copy interna exposta e sem regra de negocio no frontend.

## Resumo executivo

O sistema ja tem boa base de contratos e autenticacao por gates, mas a interface ainda mistura tres linguagens visuais:

1. cockpit operacional denso em Support;
2. admin generico com muitos cards, radius alto e sombras;
3. surfaces editoriais/publicas com copy melhor, mas estados e fallbacks ainda heterogeneos.

O maior risco visual atual nao e falta de componente. E excesso de containers, colunas e microcards disputando atencao. A prioridade deve ser estabilizar cada superficie por fluxo de trabalho: fila, detalhe, rail, drawer/modal e estados.

## Problemas por rota/tela

### `/support/queue`, `/support/tickets`, `/support/tickets/:ticketId`

Problemas encontrados:
- Workspace de suporte e a tela mais critica e tambem a mais densa.
- Conversa, fila, rail e drawer competem por largura em 1440px.
- Intake de novo ticket ainda tende a ocupar area lateral quando o fluxo e central.
- Alguns dados de cliente ainda eram exibidos com identificadores tecnicos ou fallbacks de slug.
- Havia JSON bruto de sinais operacionais no contexto de cliente.

Overflow, quebra e scroll:
- Risco de compressao da thread em ticket detalhado.
- Drawers e formularios longos podem criar rolagem no lugar errado.
- Sem scroll horizontal no estado nao autenticado validado em `/support/queue` e `/support/customers`.

Inconsistencias visuais:
- Mistura de primitives compactas de Support com primitives globais mais infladas.
- Muitos blocos com borda/radius/sombra dentro de rails.
- Badges demais em alguns blocos reduzem hierarquia.

Evidencia autenticada:
- Rodada `2026-06-19-authenticated-r2`: sem scroll horizontal e sem scroll global nas rotas de suporte auditadas.
- Hits de `tenant` e `contrato` vieram principalmente de dados fixture ou conteudo de ticket QA; a interface nao deve normalizar nomes reais de cliente no frontend.

Prioridade:
- P1: transformar intake em modal/fluxo dedicado.
- P1: compactar composer e preservar altura util da thread.
- P2: reduzir cardizacao do rail.

### `/support/customers`, `/support/customers/:tenantId`

Problemas encontrados:
- Slug de cliente aparecia como chip/identificador visual.
- Fallback de nome usava identificador interno quando faltava display name.
- O detalhe do cliente usava metrica `Identificador`, sem valor operacional para o usuario final.

Correcoes aplicadas neste lote:
- Fallbacks agora usam `Cliente indisponivel`.
- Slugs sairam de chips/titulos e continuam apenas em busca/rota interna.
- JSON bruto de flags virou resumo humano de sinais operacionais.

Prioridade:
- P1: revisar largura e densidade do detalhe B2B autenticado com screenshot real.
- P2: reduzir metricas redundantes no topo.

### `/engineering`

Problemas encontrados:
- Layout anterior tinha tres zonas externas e fila com colunas demais.
- Copy expunha termos como payload, backend, RPC, view e tenant em alguns caminhos.

Correcoes ja aplicadas:
- Fila reorganizada em zonas responsivas.
- Detalhe do work item foi incorporado ao fluxo principal.
- Copy visivel passou por sanitizacao operacional.
- Smoke em `/engineering` sem autenticacao validou ausencia de scroll horizontal/global.
- Linhas de work item autenticadas deixaram de usar minimos rigidos em desktop; metadados longos agora truncam dentro da linha sem criar largura interna maior que a lista.
- Smoke interativo `2026-06-19-interactive-r10-targeted-final`: drawer de devolucao ao suporte sem scroll horizontal, sem scroll global e sem protrusao real.

Prioridade:
- P3: revisar se a acao `Registrar atualizacao` deve ficar sempre disponivel na fila ou apenas em estados especificos; o smoke nao submeteu formularios.

### `/internal-actions`

Problemas encontrados:
- Layout tinha tres colunas e fila de cinco colunas, comprimindo area e responsavel.
- Copy exibia `membership`, `backend`, `ownership` e `contrato`.
- Fallback de cliente podia expor identificador interno.

Correcoes ja aplicadas:
- Layout passou para duas zonas principais.
- Detalhe do acionamento entrou no fluxo principal.
- Fila virou linha responsiva com tres zonas.
- Copy tecnica foi substituida por linguagem operacional.

Prioridade:
- P2: validar estado autenticado com timeline longa.

### `/admin/internal-areas`

Problemas encontrados:
- A tela era admin operacional, mas herdava padrao de tabela/grade rigida.
- Linhas com usuario, area, cliente e status competiam em colunas estreitas.
- Linguagem de `membership` aparecia como conceito primario.

Correcoes ja aplicadas:
- Layout simplificado para duas zonas.
- Linha de vinculo ficou responsiva.
- Copy passou para `vinculo`, `cliente`, `papel` e linguagem de governanca.

Prioridade:
- P2: revisar drawer de adicionar vinculo para evitar formulario lateral longo.

### `/admin/customer-portal`

Problemas encontrados:
- Tinha linha operacional com oito colunas e alto risco de quebra.
- Rail e lista disputavam largura.
- Alguns termos internos de tenant/entitlement foram suavizados, mas ainda ha muitos identificadores no codigo porque fazem parte do contrato.

Correcoes ja aplicadas:
- Linha principal foi simplificada em grupos responsivos.
- Cards receberam menor sombra/radius.
- Copy passou para usuario/cliente/acesso.
- Coluna de filtros ganhou largura operacional em desktop para nao comprimir selects e busca.
- Linha central de cliente deixou de usar minimos fixos que somavam mais que a coluna disponivel.
- Smoke interativo `2026-06-19-interactive-r10-targeted-final`: drawer `Gerenciar acesso` sem scroll horizontal, sem scroll global e sem protrusao real; overflows restantes sao truncamentos controlados de nome/cabecalho.

Prioridade:
- P2: reduzir rail direito e consolidar acoes por contexto.
- P2: revisar labels de cliente em foco para nao expor slug quando display name existir.

### `/admin/knowledge`, `/admin/knowledge/new`, `/admin/knowledge/:articleId/edit`

Problemas encontrados:
- Cockpit editorial e funcional, mas ainda denso em cards, toolbar e metricas.
- Editor usa formularios altos, radius grande e duas colunas que podem virar leitura pesada.
- `backend-permission` aparecia no redirecionamento de acesso negado.
- Mensagem `persistido` vazava linguagem de implementacao.

Correcoes aplicadas neste lote:
- Motivo de acesso negado passou para `missing-authorized-workspace`.
- Feedback editorial passou de `persistido` para `salvo`.

Prioridade:
- P1: reduzir densidade do editor e estabilizar coluna de metadata.
- P2: remover cards/metricas que nao apoiam decisao editorial.
- P2: validar estados de loading/vazio/erro com dados longos.

### `/portal`, `/portal/tickets`, `/portal/help`

Problemas encontrados:
- Portal pode ter scroll global, aceitavel por ser customer-facing, mas ainda precisa evitar termos internos.
- Estados indisponiveis foram parcialmente humanizados.
- Possivel risco de mensagem longa em troca de conta/contexto.
- No detalhe do ticket, cards compactos de artigos relacionados estouravam visualmente o rail direito em desktop, embora o documento nao criasse scroll horizontal global.

Correcoes aplicadas neste ciclo:
- Cards compactos da Knowledge no portal passaram a respeitar `w-full/min-w-0/overflow-hidden`.
- Titulos e motivos longos continuam truncados ou quebrados dentro do card, sem empurrar o painel.
- Nomes de cliente, contato, categorias, titulos de ticket, descricoes e motivos visiveis no portal passam por sanitizacao customer-facing sem alterar o valor enviado para busca/rotas.
- Smoke `2026-06-19-interactive-r10-targeted-final`: `/portal/tickets/:ticketId` sem scroll horizontal, sem scroll global e com `protrusionCount=0`.
- Auditoria final `2026-06-19-final-audit-r11`: rotas customer-facing `/portal`, `/portal/tickets`, `/portal/tickets/:ticketId`, `/portal/help` e `/portal/help/:slug` sem hits de `tenant`, `contrato`, `fixture`, `backend`, `RPC`, `RLS`, `payload` ou termos internos monitorados.

Prioridade:
- P3: QA visual autenticado mobile completo para estados de troca de conta e indisponibilidade.
- P2: revisar todos os estados `tenant_unavailable` para copy de cliente.

### `/help`, `/help/:spaceSlug`, `/help/:spaceSlug/articles`, `/help/:spaceSlug/articles/:articleSlug`

Problemas encontrados:
- Central publica pode rolar globalmente; isso e esperado para conteudo.
- Risco principal e consistencia editorial, nao cockpit.
- Deve preservar clareza e nao herdar termos de admin/knowledge.

Prioridade:
- P3: validar truncamento de titulo/categoria e estados vazios.

### `/admin/build-journal`

Problemas encontrados:
- A tela documental ainda expunha vocabulário técnico como `backend`, `RPC`, `RLS`, `read model` e `tenant` em blocos narrativos e arquitetura.
- A linha de fases no overview usava oito colunas em 1440px, comprimindo títulos e descrições.
- A mini-arquitetura do overview usava sete colunas em área central estreita.

Correcoes aplicadas neste ciclo:
- Copy técnica foi reescrita para linguagem operacional: fonte oficial, leituras governadas, ações controladas, controle de acesso, escopo de cliente e acordos.
- A linha de fases passou a usar quatro colunas em desktop 1440px e oito apenas em telas muito largas.
- A mini-arquitetura passou a usar quatro colunas em 1440px e sete apenas em telas muito largas.
- Smoke `2026-06-19-authenticated-r5-docs`: desktop e mobile sem scroll horizontal, sem scroll global e sem hits dos termos técnicos monitorados.

Prioridade:
- P3: o shell ainda trunca nome/cargo do usuário em desktop; é truncamento controlado compartilhado, não vazamento de conteúdo da tela.

### `/admin/product-docs`

Problemas encontrados:
- O leitor renderizava o markdown governado com termos técnicos crus (`backend`, `RPC`, `RLS`, `payload`, `membership`, `source of truth`, `tenant`, `contrato`).
- No mobile, caminhos de arquivos longos dentro do corpo do documento criavam overflow interno.
- Rótulos de metadados (`Origem versionada`, `Atualização`) espremiam a grade em desktop.

Correcoes aplicadas neste ciclo:
- Criada sanitização de apresentação no preview do documento, preservando a fonte governada e trocando apenas a leitura visível por termos operacionais.
- Rótulos do leitor foram suavizados para `Conteudo revisado`, `Origem` e `Data`.
- Listas e parágrafos do preview agora quebram palavras longas com segurança em mobile.
- Smoke `2026-06-19-authenticated-r5-docs`: desktop e mobile sem scroll horizontal, sem scroll global e sem hits dos termos técnicos monitorados.

Prioridade:
- P2: se a liderança quiser leitura técnica literal, criar um modo explícito separado. A leitura padrão do cockpit deve continuar operacional.

### `/admin/access`, `/access-denied`, estados globais

Problemas encontrados:
- Estados indisponiveis historicamente podiam refletir nomes de contrato/infra.
- Erros de rota podiam expor detalhes tecnicos.
- Rotas de Admin Tenants, System e Access ainda enviavam motivo tecnico de permissao no estado de navegacao.

Correcoes ja aplicadas:
- Estado indisponivel mascara termos internos.
- Error boundary nao exibe erro bruto.
- Copy de acesso foi humanizada.
- Motivos de acesso negado foram normalizados para `missing-authorized-workspace`.
- Label `Identificador manual` em Access virou `Referencia manual`.

Prioridade:
- P1: varrer todos os usos de `ContractUnavailableState` com mensagem vinda de erro bruto.

### `/admin/tenants`

Problemas encontrados:
- Copy administrativa ainda exibia `membership`, `subscription`, `feature`, `entitlement`, `ownership`, `slug`, `RPC`, `read model` e `contrato` como termos de superficie.
- A busca orientava o usuario a procurar por `slug`.
- Lista e detalhe exibiam slug junto do nome legal, aumentando ruido tecnico.
- Aba de assinaturas misturava catalogo comercial com linguagem de implementacao.

Correcoes aplicadas neste ciclo:
- Copy visivel trocada para `vinculos`, `assinaturas`, `recursos`, `responsaveis`, `referencia comercial` e `acao administrativa auditada`.
- Slug saiu da lista, do detalhe e do modal de status; continua apenas como campo/parametro interno necessario para criar cliente.
- Estados de loading/vazio/erro de assinaturas passaram a falar em recursos comerciais, responsaveis e disponibilidade real.
- Smoke autenticado `2026-06-19-authenticated-r3`: `/admin/tenants` sem scroll horizontal, sem scroll global e sem hits dos termos tecnicos monitorados.

Prioridade:
- P2: revisar se a massa QA deve trocar nomes contendo `Tenant`; hoje isso e dado de fixture, nao copy de UI.

### `/admin/system`

Problemas encontrados:
- Copy expunha `backend`, `payload`, `metadata`, `slug`, `LLM`, `embedding`, `Provider/modelo`, `Timestamp` e `contrato atual`.
- Auditoria usava seis colunas em uma area central estreita, comprimida pelo rail esquerdo e pelo detalhe direito.
- O detalhe operacional mostrava slug e chaves sanitizadas, termos corretos para engenharia mas ruins para cockpit B2B.

Correcoes aplicadas neste ciclo:
- Copy visivel passou para linguagem operacional: motor de resposta, governanca com revisao humana, dados protegidos, campos protegidos, area, prioridade e registro.
- Lista de auditoria foi simplificada de seis colunas para tres zonas: evento, resumo operacional e status.
- Minimos da grade foram reduzidos para evitar overflow interno quando o detalhe direito esta aberto.
- Slug e payload deixaram de aparecer no detalhe; dados sensiveis continuam protegidos.
- Smoke autenticado `2026-06-19-authenticated-r3`: `/admin/system` sem scroll horizontal, sem scroll global e sem hits dos termos tecnicos monitorados. Os overflows restantes sao truncamento controlado de perfil no shell.

Prioridade:
- P2: revisar se o rail esquerdo deve ser recolhivel em 1366px para aumentar largura util do feed.

## Inconsistencias transversais

Padding, margem e gap:
- Admin ainda usa `px-5/6`, `py-5/6` e headers altos para telas de operacao.
- Support usa escala mais compacta, mas nem todos os subfluxos seguem os mesmos tokens.

Borda, radius e sombra:
- Muitos cards usam radius 18-28px e sombras mesmo quando seriam apenas grupos de informacao.
- Isso gera sensacao de dashboard generico e compete com a acao principal.

Tipografia:
- Headers de admin/editor ainda grandes para cockpit.
- Badges uppercase com tracking alto aparecem em excesso.

Altura e densidade:
- Textareas e drawers continuam altos em fluxos centrais.
- Listas e rails precisam de scroll interno melhor isolado.

Colunas a simplificar:
- Suporte ticket detalhado: revisar 3 colunas quando a thread e principal.
- Admin Knowledge editor: revisar duas colunas com metadata alta.
- Customer Portal Admin: consolidar rail e acoes.
- Support intake: nao usar drawer estreito para criacao completa.

Copy tecnica/interna ainda sob vigilancia:
- `tenant`, `membership`, `backend`, `payload`, `metadata`, `RPC`, `view`, `contrato`, `storage`, `bucket`, `stack trace`.
- Em codigo esses termos sao esperados; na UI devem ser bloqueados ou traduzidos.

## Prioridades de correcao

P1:
- Support intake: modal operacional amplo ou modo dedicado.
- Support ticket detail: dar protagonismo para thread/composer.
- Knowledge editor: compactar metadata e remover cards secundarios.
- Estados indisponiveis: garantir copy humana para mensagens vindas de erro.

P2:
- Customer Portal Admin: reduzir rail e acoes concorrentes.
- Portal Cliente: revisar `tenant_unavailable` e troca de conta.
- Admin Knowledge lista: reduzir metricas e cards.
- Validar com dados longos e nomes de cliente extensos.

P3:
- Public Help: polish editorial e estados vazios.
- Admin System/Tenants: reduzir dashboard generico quando a operacao exigir.

## Evidencia de validacao recente

- Fixture funcional local reidratada com Supabase local e Edge Runtime ativo.
- Auditoria autenticada ampla `2026-06-19-authenticated-r2`: public help, admin, support, customer portal, engineering, internal actions e CS em 1440x900.
- Resultado r2: nenhuma rota auditada teve scroll horizontal; cockpits privados ficaram sem scroll global.
- Smoke autenticado pos-build `2026-06-19-authenticated-r3` em `/admin/system` e `/admin/tenants`: sem scroll horizontal, sem scroll global e sem hits dos termos tecnicos monitorados.
- Auditoria autenticada ampla `2026-06-19-authenticated-r4`: desktop 1440x900 e mobile 390x844 em 24 rotas; nenhuma rota auditada teve scroll horizontal; cockpits privados ficaram sem scroll global; os vazamentos técnicos restantes foram isolados em `/admin/build-journal` e `/admin/product-docs`.
- Smoke autenticado pos-build `2026-06-19-authenticated-r5-docs` em `/admin/build-journal` e `/admin/product-docs`: desktop e mobile sem scroll horizontal, sem scroll global e sem hits dos termos técnicos monitorados.
- Smoke interativo `2026-06-19-interactive-r6`: abriu drawers/modais selecionados de suporte, admin, engenharia e portal; nao encontrou scroll horizontal/global, e isolou protrusao visual real no rail de artigos do portal.
- Smoke interativo pos-build `2026-06-19-interactive-r10-targeted-final`: `/admin/customer-portal` com `Gerenciar acesso`, `/engineering` com devolucao ao suporte e `/portal/tickets/:ticketId` sem scroll horizontal/global e sem protrusao real.
- Auditoria final ampla `2026-06-19-final-audit-r11`: 28 rotas x 3 viewports desktop (`1920x1080`, `1440x900`, `1366x768`), total de 84 medicoes. Resultado: 0 erros de navegacao, 0 scroll horizontal, 0 protrusoes reais, 0 scroll global em cockpits privados, 0 falhas em rotas publicas/customer-facing e 0 hits dos termos internos monitorados.
- Reanalise final pos-ajuste: os 24 alertas residuais de `tenant` em rotas internas foram eliminados por sanitizacao de apresentacao em campos de contato, cliente, ticket, work item e auditoria, sem alterar contratos, filtros, ids, rotas ou comandos.
- `npm run web:typecheck`: passou apos os ajustes finais.
- `npm run web:build`: passou apos os ajustes finais.
- `git diff --check`: passou; apenas avisos esperados de LF/CRLF no Windows.
- O runner reprodutivel da auditoria final fica em `docs/reports/visual-audit/run-final-audit-r11.cjs`.
- Os artefatos volumosos de metricas e screenshots das rodadas intermediarias nao foram versionados nesta limpeza de worktree.
- Em 22/06/2026, a reexecucao local autenticada foi bloqueada antes da fixture porque o Docker Desktop/Supabase local nao estava disponivel na maquina; o runner foi endurecido para falhar quando login ou navegacao autenticada redirecionarem para `/login`.

## Limites honestos

- A auditoria final ampla cobriu desktop em 1920x1080, 1440x900 e 1366x768; mobile foi coberto na rodada r4 e a auditoria interativa cobriu apenas drawers/modais selecionados, nao todos os formularios condicionais.
- O detector ainda conta `truncate` e `line-clamp` como overflow interno. Eles foram tratados como aceitaveis quando nao geram protrusao, scroll horizontal ou perda de comando principal.
- A sanitizacao de copy operacional atua apenas na apresentacao. Dados originais de fixture, nomes, filtros, ids, rotas e comandos continuam preservados como fonte real.
- As rotas documentais passaram a ter leitura operacional padrao; a fonte governada original nao foi alterada.
- Nenhum backend, migration, contrato novo ou regra de negocio de frontend foi criado neste lote.
