# Meta executiva — fechamento MVP Genius Support OS

## Prompt de execução

Concluir o MVP operacional do Genius Support OS no checkout canônico
`C:\Projetos\GSO-old`, preservando o trabalho existente, os artigos editados,
as imagens, o banco e o histórico Git. A execução deve ser incremental,
auditável e orientada pelos contratos reais de backend, views/read models, RPCs,
tenant, RLS, permissões e auditoria.

## Ordem obrigatória das pendências

1. **Conhecimento administrativo**
   - Reconstruir a tela de artigos sem sobreposição da coluna lateral.
   - Garantir que busca, filtros, ordenação, paginação, edição e novo artigo
     funcionem e mantenham ações próximas ao conteúdo.
   - Transformar o painel de categorias em um fluxo organizado, com criação,
     edição, cancelamento, fechamento e retorno aos artigos sem deslocamentos
     desnecessários do cursor.
   - Remover bordas pesadas, corrigir espaçamentos, tokens, foco, overflow,
     light/dark e responsividade.

2. **Editor de artigos**
   - Manter o editor centralizado e as propriedades recolhidas por padrão.
   - Abrir propriedades de forma acessível e previsível, com deslocamento
     proporcional do editor, fechamento claro e sem overlay indevido.
   - Corrigir a criação de novo artigo para iniciar sempre limpo.
   - Corrigir todos os estados e superfícies do modo escuro, inclusive
     informações do artigo, preview, imagens, popovers e mensagens.
   - Preservar imagens, identação, recursos do editor e conteúdo editado.

3. **Central Pública e conteúdo Octadesk**
   - Inventariar todos os artigos importados e conferir se há lacunas.
   - Ler o conteúdo integral, preservar imagens e formatação e recategorizar
     por intenção do usuário.
   - Remover nomes, categorias e explicações internas ou técnicas da superfície
     pública.
   - Publicar somente artigos revisados e adequados ao cliente, com categorias
     públicas coerentes.
   - Fazer o botão de entrada no portal exibir uma mensagem clara de que o
     ambiente ainda está em construção, sem prometer acesso inexistente.

4. **Configurações escaláveis**
   - Retirar o conceito visual de “Cockpit operacional”, “Conexões e dados” e
     “Pessoas e contexto” quando forem apenas agrupamentos artificiais.
   - Reorganizar a área como uma navegação de configurações simples e expansível,
     sem duplicidade e sem rolagem desnecessária.
   - Manter Integrações, Fontes do Dashboard, Marcas, Central de ajuda,
     Usuários e acesso e futuros módulos em entradas claras.
   - Relacionar o Histórico de sincronizações às Fontes do Dashboard, sem
     tratá-lo como parâmetro de configuração independente.
   - Corrigir visual light/dark, campos, foco, estados vazios, mensagens e
     bordas em todas as subtelas.

5. **Marcas**
   - Liberar criação e edição das marcas existentes usando os contratos reais.
   - Não expor segredos nem inventar campos ou valores.

6. **Usuários e acesso**
   - Manter esta função dentro de Configurações, sem item duplicado no sidebar.
   - Permitir convite/cadastro governado com área, função e perfil de acesso.
   - Usar catálogos e RPCs reais para áreas, funções, perfis e telas.
   - Melhorar retorno, navegação, cancelamento, confirmação e estados de convite.
   - Preservar escopo de tenant, RLS, permissão e auditoria.

7. **Dashboard e integrações**
   - Manter Visão Geral, Comercial, Suporte & Chat e Financeiro funcionais.
   - Manter Produto/Desenvolvimento e Customer Success indisponíveis de forma
     honesta até existir contrato e fonte real.
   - Não inventar métricas, fontes, frescor, carteiras ou denominadores.
   - Garantir HubSpot incremental e OMIE paginado, com cache, watermark,
     telemetria, limite de chamadas e bloqueio de concorrência.
   - Abrir o motion do Gênio ao solicitar sincronização; mantê-lo até o fim.
     Após 60 segundos, oferecer fechamento seguro para segundo plano, avisar
     que não se deve solicitar outra atualização e bloquear duplicidade.

8. **Copy e experiência**
   - Revisar o copy de todas as telas e estados.
   - Falar com o usuário em linguagem operacional simples.
   - Não vazar arquitetura, desenvolvimento, Octadesk, RPCs, tabelas, tokens,
     credenciais ou detalhes internos para o cliente.
   - Usar “Indisponível” quando o dado real não existir.

9. **Validação e encerramento**
   - Validar light/dark, desktop/mobile, teclado, foco, contraste, overflow e
     rolagem apenas quando necessária.
   - Executar typecheck de contratos e web, testes aplicáveis, build, secret
     scan, quality gate, `git diff --check` e QA visual real.
   - Registrar evidências, comandos, arquivos, limitações, credenciais externas
     pendentes e estado Git.
   - Não declarar concluído o que não foi objetivamente validado.

## Limites de segurança

Preservar branches, commits, worktrees, stash, banco e alterações de outros
agentes. Não executar `reset`, `clean`, `stash drop`, checkout amplo, remoção de
worktree/branch, rebase, merge, cherry-pick, push, deploy, migração destrutiva
ou exclusão permanente sem autorização explícita do Product Owner.

## Critério de aceite executivo

O lote só estará concluído quando as superfícies administrativas e públicas
estiverem navegáveis em claro/escuro, sem sobreposição, com dados e permissões
reais, artigos editados e imagens preservados, categorias públicas coerentes,
convites governados, sincronização protegida contra duplicidade e relatório de
evidências persistido no repositório.

## Adendo de consistencia visual do Dashboard

Aplicar o mesmo sistema visual em todas as abas do Dashboard:

- Aumentar o avatar do Genio e ajustar espacamento para garantir presenca visual sem comprometer a densidade da tela.
- Sinalizar visualmente toda mensagem de erro, indisponibilidade ou alerta com icone, contraste, cor semantica e hierarquia clara.
- Todo banner de problema deve oferecer um botao visivel para fechar ou dispensar a mensagem.
- Alinhar o titulo de cada aba a esquerda, eliminando centralizacao inconsistente.
- Padronizar composicao, hierarquia, alinhamento, espacamentos, largura de containers e posicao dos elementos.
- Corrigir integralmente Visao Geral e Financeiro para que sigam o mesmo padrao das demais areas.
- Redesenhar o container de filtros com altura, bordas, distribuicao dos campos, espacamentos e acoes consistentes; replicar a solucao nas demais abas.

## Adendo de Usuarios e acesso

- Revisar integralmente o modulo de Usuarios e acesso, sem criar padroes de navegacao isolados.
- Remover o botao contextual redundante de retorno para Configuracoes.
- Exibir uma trilha de navegacao clicavel, com retorno previsivel para a origem e para a area de Configuracoes.
- Encadear acoes relacionadas: usuarios, convites, estrutura, perfis e edicao devem permanecer proximos no fluxo.
- Manter convite governado com nome, email, area, funcao, perfil e validade, usando catalogos e comandos reais.
- Corrigir estados de erro, vazio, carregamento, foco, light/dark e copy; nunca exibir mensagens tecnicas de Edge Function, HTTP, RPC ou infraestrutura ao usuario.
- Revisar acoes de convite, confirmacao, cancelamento e retorno, preservando tenant, permissao, RLS e auditoria.

## Adendo de fila — Design System e superficies compartilhadas

- Reproduzir, com fidelidade auditavel, as referencias de Access, Knowledge,
  editor de artigos, login e sidebar expandida/colapsada em
  `docs/design/blueprint/admin/sidebar.png` e nas capturas fornecidas pelo
  Product Owner.
- Consolidar a solucao no design system canonico, garantindo consistencia de
  tokens de cor, tipografia, espacamento, raios, bordas, estados, grid,
  densidade, sidebar, header, filtros, tabelas, paineis laterais e
  responsividade em todo o sistema.
- Usar as referencias como direcao visual, sem inventar dados, regras,
  permissoes ou copy; preservar a diferenca entre superficies administrativas
  e publicas.
- Revisar o copy da tela de login e das superficies compartilhadas por
  clientes e funcionarios, sem expor arquitetura, desenvolvimento, Octadesk,
  RPCs, tokens ou credenciais.
- Validar o padrao em claro/escuro, sidebar aberta/colapsada, desktop/mobile,
  teclado, foco, contraste e overflow antes de aplicar o padrao as demais
  telas.
