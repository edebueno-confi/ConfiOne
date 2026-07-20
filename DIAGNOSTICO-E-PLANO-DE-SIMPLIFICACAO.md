# Diagnóstico e Plano de Simplificação — Genius Support OS

_Escrito para leitura de negócio, sem jargão. Data: 2026-07-16._

## 1. A sua realidade (como eu entendi)

A **Genius Returns** automatiza logística reversa (trocas/devoluções) para e-commerce. Foi **comprada pela Confi**, dona da **After Sale** (produto irmão, faz o mesmo). As duas deixaram de ser concorrentes e viraram uma empresa só.

- A **After Sale já tem** time e sistema de atendimento (usa **HubSpot**).
- A **Genius não tem nada disso**: o atendimento acontece em **grupos de WhatsApp**, sem cadastro de cliente, sem histórico confiável, dependente de memória das pessoas.

**O que você quer construir** (substituindo o WhatsApp): um sistema interno profissional, simples e objetivo, com:

1. **Portal do cliente logado** — o cliente aciona o suporte e acompanha demandas.
2. **Atendimento com chat** — conversas online, além de tickets.
3. **Tickets** — demandas, solicitações, bugs, melhorias, projetos.
4. **Acionar áreas internas** — engenharia/produto, desenvolvimento, financeiro etc.
5. **Gestão de CS** — carteira e **clusterização de clientes**.
6. **Shell global contextual** — cada pessoa loga e vê só o seu contexto de trabalho, por permissão, com destaque para **notificações, CTAs e tarefas importantes**.
7. **Central de ajuda pública** com FAQ, administrável por dentro do sistema.
8. **Tudo parametrizável** — classificações de ticket/conversa, categorias etc. **não podem ser fixas no código**: têm que ser parâmetros numa **área de Configurações**. A área de **gestão do sistema precisa de refatoração completa**.

**Referências de mercado:** Intercom e Zendesk.

## 2. O que o sistema É hoje (retrato honesto)

Medi o sistema real. Os números:

| Item | Quantidade | Leitura |
| --- | --- | --- |
| Tabelas no banco | **65** | muito para um MVP interno |
| Views (consultas) | **189** | escala de produto enterprise |
| Funções no banco | **279** (125 "comandos") | camada muito espessa |
| Políticas de segurança | **111** | |
| Migrações de banco | **64** | |
| Linhas de código (frontend) | **~50 mil** (só a tela de suporte tem ~16 mil) | |
| Documentos internos | **271** (+93 relatórios) | documentação concorrente demais |

**Tradução:** isso é tamanho de um produto maduro de mercado, não de um primeiro sistema interno. É por isso que você sente "muitas conexões entre as informações". Exemplo real do que existe hoje e você **ainda não usa**:

- Um **catálogo comercial completo**: produtos → planos → módulos → funcionalidades → assinaturas → direitos de uso (entitlements) → donos comerciais. São ~10 tabelas conectadas.
- Cada **conta de cliente** se espalha em ~8 tabelas satélites (perfil, alertas, integrações, customizações, funcionalidades, assinaturas...).
- **Governança de Inteligência Artificial** (tabelas, políticas e telas de "prontidão de IA").
- **Prontidão de canais** de e-mail/WhatsApp/chat/API (sem nada real conectado).
- **Workspaces profundos** de engenharia, e um "diário de construção", e um leitor de documentos internos.

Tudo isso é **complexidade prematura**: fiação criada para funcionalidades futuras que ainda não entraram em uso. É a principal fonte dos problemas que você não consegue nomear.

## 3. Confronto: realidade × documentação × código

- **A boa notícia:** a sua equipe **já concluiu isso**. O "MVP Reset" (jul/2026) manda **descartar o inchaço** e voltar a poucas superfícies (ajuda pública, portal, suporte, áreas internas + admin mínimo), adiando catálogo comercial, assinaturas, IA, CS, financeiro e produto.
- **O problema:** esse plano **ficou só na documentação**. O código que roda ainda é o inchado. Ninguém executou a simplificação.
- **Onde a sua visão vai ALÉM do reset** (e eu concordo): você quer **chat de verdade**, uma **área de Configurações/parametrização forte**, um **shell global contextual** e **CS com clusterização**. O reset adiava chat e CS. Vou incorporar isso ao alvo — de forma faseada, sem reinflar o sistema.

## 4. Alvo proposto — "MVP profissional" enxuto (estilo Intercom/Zendesk)

Poucas superfícies, muito fluxo, nada hardcoded:

1. **Central de ajuda pública** (FAQ administrável).
2. **Portal do cliente** (abrir/acompanhar demandas, mensagens, evidências).
3. **Atendimento (Inbox do suporte)** — fila + conversa. Começa como ticket/mensagens e evolui para **chat ao vivo**.
4. **Acionamento de áreas internas** (financeiro, dev, produto, integrações, CS, operações).
5. **Configurações / Parametrização** — o "cérebro" que hoje não existe direito: categorias, classificações, tipos de conversa, prioridades, status, áreas, SLA simples. **Toda opção que aparece nas outras telas nasce aqui.**
6. **Admin** (clientes B2B, usuários/permissões, artigos, logs).
7. **CS** (fase seguinte): carteira + **clusterização** de clientes.

Por cima de tudo, um **shell global único** que mostra a cada pessoa apenas o seu contexto (por permissão) e destaca **notificações, tarefas e próximas ações**.

## 5. O que MANTER, CORTAR e ADICIONAR

**Manter (a fundação está certa):** backend como fonte da verdade, multi-cliente (multi-tenant), segurança por linha (RLS), auditoria, separação entre cliente/suporte/áreas internas, central de ajuda governada e o conteúdo já importado da OctaDesk.

**Cortar do MVP (arquivar, não apagar):** catálogo comercial, planos, assinaturas e entitlements; governança de IA em runtime; prontidão de canais; workspace profundo de engenharia; diário de construção; leitor de documentos internos; dashboards administrativos amplos; health score. → Viram **backlog futuro**; voltam um a um quando fizerem sentido.

**Adicionar (novo, que você pediu):** a camada de **Configurações/parametrização**; **chat** no atendimento; o **shell global contextual**; e **CS leve com clusterização**.

## 6. Reduzir "as muitas conexões" (em linguagem simples)

Hoje, um cadastro de cliente aciona ~8 tabelas; um ticket navega por dezenas de consultas. No alvo:

- **Cliente** = 1 tabela enxuta + contatos.
- **Ticket** = ticket + mensagens + eventos + anexos + categoria.
- **Parâmetros** (categorias, prioridades, status, tipos de conversa) = tabelas de configuração simples que **alimentam** as telas.

Só isso já derruba a maior parte das **189 consultas** e **125 comandos** atuais.

## 7. A decisão-chave: como executar

**Opção A — Refatorar no lugar (recomendada):** ir cortando e consolidando o sistema atual em lotes seguros, preservando o que já funciona (login, dados de teste, telas boas). Você acompanha a evolução, e eu valido cada corte direto na sua máquina.

**Opção B — Recomeço limpo:** criar um projeto novo e enxuto usando o "MVP Reset" como base, aproveitando o código atual só como referência. Fica mais limpo no fim, mas recomeça do zero e joga fora o que já está rodando agora.

**Minha recomendação: Opção A.** Você acabou de conseguir rodar e testar o sistema; faz mais sentido evoluí-lo de forma visível e segura do que recomeçar.

## 8. Plano em fases (proposto)

- **F0 — Diagnóstico** (este documento). ✅
- **F1 — Fundação visual + ambiente** (tema claro/escuro, shell, login, correções de banco/seed). ✅ já em andamento.
- **F2 — Configurações/Parametrização** (o cérebro): criar a área e migrar classificações/categorias/status/prioridades/tipos para parâmetros.
- **F3 — Atendimento (Inbox) estilo Zendesk/Intercom**: fila + ticket enxutos, mensagens → **chat**.
- **F4 — Acionamentos internos simples** (com o cliente nunca vendo o interno).
- **F5 — Admin mínimo + Central de ajuda**.
- **F6 — CS leve + clusterização**.
- **F7 — Arquivar com segurança** os módulos inchados (catálogo/assinaturas/IA/dashboards).

A cada fase: eu implemento, valido na sua máquina, e você olha e aprova antes de seguir.

## 9. Decisões que preciso de você

1. **Estratégia:** refatorar no lugar (recomendado) ou recomeço limpo?
2. **Chat:** começar por mensagens no ticket e adicionar chat ao vivo logo em seguida (recomendado), ou chat ao vivo já como prioridade máxima?
3. **CS/clusterização:** entra como fase seguinte (recomendado) ou é prioridade agora?
4. **Arquivamento:** posso **arquivar** (guardar, sem apagar) os módulos que você não usa hoje — catálogo comercial, assinaturas, IA, dashboards — para enxugar o sistema?
