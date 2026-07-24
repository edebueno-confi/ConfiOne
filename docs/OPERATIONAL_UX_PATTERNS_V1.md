# Operational UX Patterns V1

- produto: Genius Support OS
- finalidade: padroes operacionais para reconstruir UX/UI V2 sem criar UI falsa
- fontes: Blueprint 01, Blueprint 02, Design System V3, contratos reais de views/RPCs
- regra maxima: backend e source of truth; frontend renderiza dados contratuais e chama comandos reais

## 1. Principios

- Cockpit operacional, nao dashboard decorativo.
- A acao principal deve estar visivel antes de acoes secundarias.
- Dado ausente aparece como `Indisponivel`.
- Acao sem contrato aparece bloqueada ou indisponivel; nunca simula sucesso.
- Texto visivel nao deve expor RPC, view, Supabase, RLS, tenant_id, UUID, payload, metadata, storage, bucket ou stack trace.
- Light e Dark usam a mesma hierarquia, spacing e comportamento.
- Cockpits internos nao devem ter scroll horizontal nem scroll global indevido.
- Sidebar, topbar, rail e composer ficam estaveis quando a tarefa exige trabalho continuo.

## 2. Padroes obrigatorios

### 1. Shell operacional

- Uso: Support, Admin, CS, Engenharia e Acionamentos.
- Layout: sidebar fixa, topbar compacta, area central dominante e rail/drawer quando houver contexto.
- Contrato: permissao vem de gate/read model; shell nao infere acesso por texto ou rota.
- Estados: loading, sem permissao, contrato indisponivel, erro recuperavel e sessao expirada.
- Acessibilidade: landmarks (`nav`, `main`, `aside`), foco visivel e skip natural por teclado.

### 2. Sidebar contextual

- Uso: navegacao por dominio e perfil.
- Layout: grupos curtos, item ativo claro, sem contadores sem contrato.
- Copy: `Fila operacional`, `Tickets`, `Acionamentos`, `Clientes B2B`, `Conhecimento`, `Acessos`.
- Bloqueio: itens futuros nao devem aparecer ativos; se aparecerem, usar estado indisponivel.
- Responsivo: em mobile vira menu/abas, nao scroll horizontal.

### 3. Segmentos rapidos da fila

- Uso: priorizar o que abrir agora.
- Dados: contagens apenas de read model autorizado.
- Exemplos: `Precisam de responsavel`, `Aguardando sua resposta`, `Urgentes`, `Atualizados hoje`.
- Interacao: filtro imediato, preservando selecao se ainda existir no resultado.
- Estado vazio: `Nenhum ticket encontrado para este filtro.`

### 4. Linha de ticket

- Uso: lista da fila e lista de tickets.
- Conteudo: ID curto, titulo, cliente, status, prioridade, responsavel, timestamp e SLA quando existir.
- Densidade: duas linhas principais, metadados truncados, maximo 2-3 pills fortes.
- Contrato: status, prioridade, severidade e SLA vem do backend.
- Acessibilidade: item selecionavel por teclado, label com titulo e cliente.

### 5. Cabecalho do ticket

- Uso: contexto imediato do ticket ativo.
- Conteudo: cliente, titulo, produto/plano, status, prioridade, responsavel e proximo passo.
- Layout: compacto; nao repetir informacao ja presente no rail.
- Contrato: allowed statuses e responsavel vem de detail/read models.
- Responsivo: em largura reduzida, metadados viram linha secundária truncada.

### 6. Proximo passo sugerido

- Uso: orientar operador antes da resposta.
- Conteudo: recomendacao operacional derivada de status/SLA/retorno interno existente.
- Bloqueio: se nao houver fonte contratual, mostrar `Proximo passo indisponivel`.
- Copy: curto, sem promessa automatica.
- Visual: bloco discreto acima da timeline, nao card hero.

### 7. Previsao de resposta/SLA

- Uso: sinalizar prazo e risco.
- Dados: `vw_support_ticket_sla_context`, detail/queue SLA fields.
- Proibido: frontend calcular prazo, breach, pausa ou calendario.
- Estados: dentro do prazo, atencao, vencido, indisponivel.
- Visual: barra ou pill moderada; vermelho apenas para risco real.

### 8. Mensagem do cliente

- Uso: timeline do ticket.
- Conteudo: autor, papel, horario, corpo e anexos.
- Visual: bloco legivel, tom neutro/azul, label `Mensagem do cliente`.
- Acessibilidade: ordem cronologica e leitura clara por screen reader.
- Truncamento: anexos longos e nomes de arquivo truncam.

### 9. Resposta publica do suporte

- Uso: comunicacao visivel ao cliente.
- Contrato: `rpc_add_ticket_message`.
- Visual: distinta de nota interna e evento de sistema.
- Copy: `Resposta publica` ou `Mensagem para o cliente`.
- Bloqueio: se canal nao permite resposta, desabilitar composer e explicar motivo humano.

### 10. Nota interna

- Uso: registro interno da operacao.
- Contrato: `rpc_add_internal_ticket_note`.
- Visual: tom amarelo/neutro, label `Nota interna`.
- Proibido: aparecer no Portal Cliente.
- Acessibilidade: label textual, nao depender so de cor.

### 11. Evento de sistema

- Uso: transicoes, atribuicao, status, SLA e eventos auditaveis.
- Dados: timeline/read model.
- Visual: compacto, sem competir com mensagens humanas.
- Copy: traduzir evento para linguagem operacional.
- Proibido: payload bruto, metadata ou enum tecnico.

### 12. Retorno de area interna

- Uso: resposta de Acionamentos Internos ao suporte.
- Contrato: internal action timeline e RPCs de retorno.
- Visual: tom verde/area, label `Resposta da area interna`.
- Acao associada: aceitar retorno, pedir complemento ou encerrar quando permitido.
- Proibido: alterar status do ticket automaticamente.

### 13. Retorno tecnico de engenharia

- Uso: updates de work item vinculados ao ticket.
- Contrato: `vw_support_ticket_engineering_links`, `vw_engineering_work_item_updates`.
- Visual: diferenciar de acionamento interno comum.
- Copy: `Retorno tecnico`, `Atualizacao tecnica`, `Retornar ao suporte`.
- Proibido: engenharia falar direto com cliente.

### 14. Composer fixo

- Uso: resposta publica e nota interna.
- Layout: fixo no rodape da coluna central; textarea, modo, acoes secundarias e submit.
- Contratos: enviar resposta e nota interna por RPCs reais.
- Estados: disabled por permissao, canal indisponivel, envio, erro recuperavel.
- Acessibilidade: label claro, foco preservado e atalhos nao obrigatorios.

### 15. Acoes do composer

- Uso: anexar evidencia, alterar status, acionar area, vincular conhecimento.
- Hierarquia: submit primario; acoes secundarias discretas.
- Bloqueio: tarefa/playbook/compartilhar ficam indisponiveis ate contrato.
- Copy: verbo + objeto curto.
- Responsivo: acoes raras podem ir para menu/drawer.

### 16. Rail de cliente

- Uso: contexto sem interromper conversa.
- Conteudo: cliente, status, contato, produto/plano, SLA, demandas relacionadas e retorno tecnico recente.
- Contrato: customer 360, account/product context e ticket links.
- Layout: largura 320-440px, scroll interno se necessario.
- Proibido: duplicar cabecalho ou virar tela administrativa.

### 17. Card produto e plano

- Uso: contexto comercial/operacional autorizado.
- Dados: `vw_support_customer_product_context` e subscriptions admin/support-safe.
- Conteudo: produto, plano, status, validade e features visiveis.
- Proibido: billing/financeiro sensivel sem contrato.
- Estado: `Produto indisponivel` quando view nao entregar.

### 18. Card SLA e prioridade

- Uso: decisao de risco do ticket.
- Dados: priority, severity, SLA status e prazos do backend.
- Visual: prioridade e SLA com destaque moderado.
- Proibido: timer fake.
- Responsivo: em rail reduzido, agrupar em duas linhas.

### 19. Demandas relacionadas

- Uso: tarefas futuras, acionamentos internos e engenharia.
- Dados atuais: internal actions e engineering links.
- Bloqueio: tarefas entram como indisponiveis ate `operational_tasks`.
- CTA: `Criar` so ativo para contratos reais.
- Copy: explicar origem e status sem termos tecnicos.

### 20. Evidencia/anexo

- Uso: upload/download seguro de arquivo.
- Contrato: upload intent, edge function, metadata sanitizada e download temporario.
- Visual: chip/lista com nome, tipo, tamanho, autor e horario.
- Proibido: storage path, bucket, URL permanente.
- Estados: preparando, enviando, falha recuperavel, indisponivel.

### 21. Conhecimento vinculado

- Uso: artigos relacionados ao ticket e lacunas.
- Contrato: ticket knowledge links, picker e RPCs de link/archive/gap.
- Visual: lista compacta com status e visibilidade.
- Proibido: enviar artigo interno/restrito ao cliente sem entitlement.
- CTA: `Vincular conhecimento`, `Marcar lacuna`, `Precisa revisao`.

### 22. Pills de status/prioridade/severidade

- Uso: estados em listas, header, rail e timeline.
- Regras: azul ativo, vermelho urgente/vencido, amarelo pendente, verde resolvido, cinza neutro.
- Acessibilidade: sempre ter texto; nao depender so de cor.
- Densidade: maximo 2-3 pills fortes por bloco.
- Contrato: valores de status nao sao inventados no frontend.

### 23. Estados de loading, vazio, erro e sem permissao

- Loading: manter shell e indicar o que esta sendo carregado.
- Vazio: dizer o que falta e proximo passo real.
- Erro: dizer o que nao foi possivel concluir e permitir tentar novamente quando seguro.
- Sem permissao: nao revelar dado protegido.
- Contract unavailable: `Esta area ainda nao esta disponivel neste ambiente.`

### 24. Drawer de acao

- Uso: acao focada que precisa formulario curto.
- Layout: header claro, subtitulo curto, corpo compacto, CTA visivel.
- Proibido: drawer virar pagina administrativa completa.
- Acessibilidade: foco preso no drawer/modal quando sobreposto; Escape/fechar claro.
- Responsivo: em mobile vira tela/aba dedicada.

### 25. Intake de novo ticket

- Uso: criar ticket pelo suporte.
- Contrato: `vw_support_ticket_intake_tenants`, `vw_support_ticket_intake_contacts`, `rpc_create_ticket`.
- Campos: cliente, contato, titulo, descricao, prioridade/severidade, categoria/motivo quando disponiveis.
- Proibido: categoria fake ou leitura direta de tenant/contact base.
- Estado: cliente sem contato ou sem SLA aparece como indisponivel.

### 26. Acionamento interno

- Uso: suporte pede apoio a area.
- Contrato: `rpc_support_create_internal_action`, area target views e RPCs area.
- Visual: diferenciar pedido, update, retorno e encerramento.
- Proibido: mensagem solta sem vinculo a ticket/contexto.
- Copy: `Acionar area`, `Assumir acionamento`, `Devolver ao suporte`.

### 27. Item tecnico de engenharia

- Uso: fila tecnica e detalhe.
- Contrato: engineering views/RPCs.
- Conteudo: work item, cliente, ticket origem, status, prioridade, responsavel e ultimo update.
- Proibido: chamar de bug/backlog quando e demanda operacional.
- Responsivo: fila densa, detalhe e rail em desktop; drawer em largura media.

### 28. Linha de carteira CS

- Uso: `/cs/portfolio`.
- Contrato: `vw_cs_customer_portfolio`.
- Conteudo: cliente, owner, produtos, tickets, membros, ultima atualizacao.
- Bloqueio: health/follow-up/projeto/tarefa indisponiveis ate backend.
- Visual: cockpit de carteira, nao dashboard executivo generico.

### 29. Linha administrativa governada

- Uso: Tenants, Access, System, Knowledge e Portal Admin.
- Conteudo: entidade, status, risco, ultima atualizacao e proxima acao.
- Proibido: tabela CRUD sem contexto operacional.
- Acoes: somente RPCs auditadas.
- Rail: explicar impacto e permissoes, nao repetir a tabela.

### 30. CTA indisponivel

- Uso: acao visivel mas sem contrato ou permissao.
- Copy padrao: `Acao indisponivel nesta versao.` ou `Sem permissao para concluir esta acao.`
- Visual: disabled claro, com motivo proximo.
- Proibido: botao decorativo, toast falso ou promessa futura.
- Acessibilidade: disabled precisa de explicacao fora do atributo `disabled`.

### 31. Busca e filtros

- Uso: filas, Knowledge e Portal.
- Contrato: search local apenas quando filtra dados ja autorizados; search backend quando consulta alem do dataset carregado.
- Proibido: busca global sem contrato de escopo e permissao.
- Layout: campo compacto, filtros essenciais, limpar filtros.
- Estado vazio: preservar filtros aplicados e permitir limpar.

### 32. Topbar do cockpit

- Uso: contexto, busca e acoes globais do dominio.
- Conteudo: breadcrumb, busca autorizada, notificacoes reais quando existirem e CTA principal.
- Bloqueio: notificacao sem contrato nao aparece como ativa.
- Responsivo: em 1366px compactar busca e icones; mobile vira header simples.
- Acessibilidade: botoes com `aria-label` quando icon-only.

## 3. Regras de responsividade

| Largura | Comportamento |
| --- | --- |
| `>= 1440px` | layout completo com sidebar, lista, centro e rail |
| `1366px-1439px` | layout completo reduzido, menos texto secundario, sem esconder CTA principal |
| `1024px-1359px` | rail vira drawer/aba; lista e centro preservam acao principal |
| `< 1024px` | navegacao por abas/stack; sem scroll horizontal |

## 4. Regras de validacao

Antes de aprovar qualquer tela operacional:

- medir viewport e scroll real no Browser;
- confirmar ausencia de scroll horizontal;
- confirmar que scroll interno esta na lista, timeline, tabela ou rail correto;
- confirmar foco visivel e navegacao por teclado;
- validar Light e Dark;
- testar textos longos, nomes de cliente, tags e arquivos;
- testar loading, vazio, erro, sem permissao e contrato indisponivel;
- confirmar que nenhum CTA sem contrato ficou ativo.

## 5. Anti-padroes proibidos

- Card dentro de card.
- Dashboard de metricas sem fonte real.
- CTA que nao chama contrato real.
- Timer/SLA calculado no frontend.
- Health score calculado no frontend.
- Kanban sem entidade operacional.
- Rail que compete com a conversa.
- Drawer com formulario longo demais.
- Copy tecnica exposta ao operador.
- Scroll horizontal para "resolver" tabela.
- Dark mode apenas por inversao superficial de cores.
