# Reconstrução do Produto — Genius Support OS

_Se eu estivesse no seu lugar, este é o produto que eu construiria. Escrito para leitura de negócio. 2026-07-16._

## 0. Por que construir (a decisão, revisada)

Você trouxe a evidência que faltava: o HubSpot existe na After Sale, mas **só o suporte técnico usa direito**; comercial não usa; **não há processo interno definido e as demandas se perdem entre áreas**. Então o problema não é "falta de ferramenta" — é **falta de um fluxo integrado entre áreas**. Isso justifica construir uma ferramenta **opinativa**, que não só registra, mas **conduz o processo** e garante que a demanda circule (suporte → CS → produto → dev → financeiro) **sem se perder**.

Norte do produto: **tornar o próximo passo certo o caminho mais fácil.** Se a ferramenta não guiar, ela vira mais um lugar onde as coisas se perdem — como o WhatsApp e o HubSpot mal-usado.

Decisão estratégica: nasce **multi-marca** (Genius e After Sale na mesma plataforma), porque o problema é o mesmo nas duas e a fundação atual já suporta isso.

## 1. Em uma frase

> Uma central única onde toda demanda de cliente entra, é tratada e circula com rastreio entre as áreas — para Genius e After Sale — sem se perder.

## 2. Princípios de design (as regras que não se quebram)

1. **A "demanda" é a espinha dorsal.** Uma unidade de trabalho que pode nascer numa conversa e circular entre áreas, sempre com dono, status e trilha. Nada existe solto.
2. **O sistema conduz.** Toda tela responde: "o que é meu, o que está esperando por mim, o que fazer agora".
3. **Nada fixo no código.** Toda opção (tipo, categoria, prioridade, status, fluxo, SLA) vive em **Configurações**.
4. **Contexto por pessoa.** Um shell global mostra a cada um só o que o seu papel permite.
5. **O cliente nunca vê o interno.** Nota, acionamento, trilha entre áreas e dados sensíveis ficam do lado de dentro.
6. **Simples antes de completo. Fluxo antes de dashboard.**

## 3. Quem usa e o que cada um vê

| Pessoa | O que ela vê ao logar |
| --- | --- |
| **Cliente B2B** | Portal: abrir demanda, acompanhar, conversar, anexar evidência, ler ajuda. |
| **Agente de suporte** | Inbox: fila de conversas/demandas, contexto do cliente, responder e acionar áreas. |
| **Líder de suporte** | Inbox + visão da equipe, redistribuição, SLAs em risco. |
| **CS** | Carteira: contas da sua clusterização, saúde, follow-ups, demandas da conta. |
| **Área interna** (produto, dev, financeiro, integrações, operações) | Fila da sua área: acionamentos recebidos, assumir, responder ao suporte. |
| **Admin / Config** | Configurações e cadastros (clientes, usuários, marcas, parâmetros). |
| **Gestor** | Painel gerencial: indicadores das 4 áreas (atendimento, CS, comercial, produto/TI). |

## 4. Navegação (o shell global contextual)

- **Barra lateral** por papel (some o que a pessoa não usa).
- **Topo fixo**: busca global (cliente, demanda, conversa, artigo) + **sino de notificações** + atalho "**Minhas tarefas**".
- **Espaços principais** (aparecem conforme permissão): Início · Atendimento · Demandas · Carteira CS · Áreas internas · Conhecimento · Painel gerencial · Configurações · Admin.

## 5. A espinha dorsal: Conversa × Demanda (em linguagem simples)

Duas coisas diferentes, e é aqui que os concorrentes (e o WhatsApp) confundem:

- **Conversa** = o canal com o cliente (chat, portal, e-mail futuro). É o diálogo.
- **Demanda** = a unidade de trabalho que pode **circular entre áreas**. Uma conversa pode gerar uma ou mais demandas.

Cada demanda tem: **tipo** (dúvida, bug, melhoria, projeto, financeiro…), **área dona atual**, **status**, **prioridade**, **trilha de acionamentos** (quem passou pra quem, quando, com que resposta) e **SLA**. O **acionamento entre áreas é um objeto rastreado** — é exatamente o que hoje "se perde no meio do caminho".

## 6. Módulos e telas

### 6.1 Início / "Meu dia" (por papel)
Painel pessoal: minhas tarefas, o que aguarda minha resposta, menções, demandas com SLA em risco, CTAs do dia. É a tela que **conduz**.

### 6.2 Central de ajuda pública (multi-marca)
- Público: home da marca, categorias, artigo, busca, FAQ.
- Admin: editor de artigo, curadoria, revisão, publicação, origem (base OctaDesk já importada).

### 6.3 Portal do cliente
- Home, **abrir demanda** (formulário guiado por tipo), minhas demandas, detalhe com conversa, anexos, status "traduzido", artigos relacionados. Nada interno.

### 6.4 Atendimento (Inbox — referência Intercom/Zendesk)
- **Fila unificada** com **visões salvas** ("não atribuídas", "aguardando você", "urgentes", "minhas").
- **Conversa** ao centro (mensagens do cliente x equipe x sistema, nota interna destacada), **composer** com resposta pública/nota, **respostas rápidas/macros** (parametrizadas).
- **Rail de contexto**: cliente, marca, plano, demandas relacionadas, acionamentos, SLA.
- Ações: responder, nota interna, **classificar**, **acionar área**, vincular artigo, **criar/derivar demanda**, mudar status, atribuir.

### 6.5 Demandas (gestão)
- Lista/board por área, status e tipo; filtros; **detalhe da demanda com a trilha entre áreas** e SLA; vínculos (conversa, cliente, artigo). Kanban simples opcional por área.

### 6.6 Acionamento entre áreas (o diferencial)
- Suporte aciona CS/produto/dev/financeiro; cada área tem **fila própria**; **devolução estruturada** ao suporte; SLA por acionamento; cliente nunca vê. É o que integra a gestão de carteira de ponta a ponta.

### 6.7 Carteira CS + clusterização
- Contas agrupadas por **cluster/segmento configurável** (porte, produto, saúde, risco, marca); visão da conta (contatos, demandas, histórico, follow-ups); painel do CS. Clusterização = segmentos e tags definidos em Configurações.

### 6.8 Configurações (o cérebro — hoje inexistente)
O que alimenta TODAS as telas, sem nada no código:
- Marcas (Genius, After Sale) · Áreas e equipes · Papéis e permissões
- **Tipos de conversa** · **Categorias/classificações** · **Prioridades/severidades**
- **Status e fluxos (workflow) por tipo de demanda** · **SLAs**
- Respostas rápidas/macros · **Automações simples** ("se tipo=bug então área=produto")
- Segmentos/clusters de cliente · Canais.

### 6.9 Painel gerencial (para o gestor)
- KPIs das 4 áreas (atendimento, CS, comercial, produto/TI), filtros e drill-down.
- Fontes: dados internos + **HubSpot** + **planilha**. Começa como **relatório vivo** (rápido, atende o prazo do gestor) e depois vira módulo nativo.

### 6.10 Admin
- Clientes B2B, usuários/memberships, marcas, logs/auditoria sanitizados.

## 7. O que conduz o usuário
"Minhas tarefas" agregando tudo que espera por mim · badges de fila · **próximo passo sugerido** na demanda · menções · alertas de SLA · notificações de acionamento devolvido.

## 8. Integrações
- **HubSpot**: espelhar contas/negócios e alimentar o painel (não competir; complementar). 
- **Planilhas**: fonte do painel gerencial.
- **Gmail / WhatsApp**: canais futuros de entrada/saída, depois do núcleo estável.

## 9. Plano de releases (enxuto)

**R1 — o núcleo do valor:** Configurações (cérebro) + Atendimento (inbox + conversa) + Portal do cliente + Demanda com acionamento entre áreas + Central de ajuda + Admin mínimo + shell contextual. Multi-marca ligado.

**R2:** Carteira CS + clusterização · chat ao vivo · painel gerencial nativo.

**R3:** automações e SLA avançados · Gmail · IA assistiva (resumo/sugestão, com revisão humana).

**O que sai do que existe hoje (arquivar):** catálogo comercial, planos, assinaturas e entitlements; governança de IA em runtime; prontidão de canais; diário de construção; leitor de documentos internos; dashboards vazios.

## 10. Como eu tocaria a execução
Refatorar no lugar, **começando por Configurações** (porque todo o resto depende dela), depois **Atendimento**, validando com 2–3 pessoas do suporte e alguns clientes reais a cada release. Cada entrega testável na sua máquina.
