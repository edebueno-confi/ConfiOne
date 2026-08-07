# Configurações — refatoração para o blueprint V4 — 2026-08-07

Especificação do lote de refatoração das seis telas de Configurações a partir dos
blueprints aprovados pelo operador em 2026-08-07.

## 1. Decisões desta especificação

- **Tema:** o produto tem modo claro e escuro. Os blueprints são a referência do
  modo claro. Cada tela entregue precisa de paridade nos dois modos, com QA visual
  nos dois. `settings-ui.css` já nasce claro e sobrescreve em
  `[data-theme='dark'] .gso-ui`; a refatoração mantém essa arquitetura.
- **Sidebar:** o estilo visual da barra lateral entra no lote (logo, campo do
  Gênio com atalho, ícones, agrupamento, cartão do usuário no rodapé). A
  **estrutura** de navegação não muda aqui: nenhum item novo é criado para tela
  que não existe ou está com `release_enabled = false`.
- **Convite:** o blueprint de Usuários mostra "Convidar usuário" como ação
  primária. **Não é reproduzido.** O convite foi aposentado; a ação primária é
  **Criar usuário** e a aba de convites permanece histórico somente leitura.
- **Dados inexistentes:** todo campo do blueprint sem origem real no backend é
  omitido ou exibido como "Indisponível". Nenhum número, percentual, avatar,
  telefone ou localização é inventado.

## 2. Padrões visuais comuns às seis telas

Extraídos dos blueprints e válidos para todas:

- **Cabeçalho:** trilha (`Configurações / <tela>`), título grande em peso alto,
  subtítulo em uma linha, ação primária alinhada à direita. Ação secundária, quando
  existir, à esquerda da primária, em variante discreta.
- **Faixa de indicadores:** cartão único dividido em colunas, cada uma com bloco de
  ícone colorido à esquerda, número grande, rótulo e legenda de apoio. Sem cartões
  soltos e sem borda por indicador.
- **Abas:** com ícone à esquerda do rótulo, sublinhado apenas na ativa. Já corrigidas
  estruturalmente por `.gso-ui-shell` — a faixa não rola e não encolhe.
- **Tabela:** cabeçalho leve, linha selecionada com destaque sutil, ação de linha em
  menu de três pontos à direita, rodapé com contagem e paginação.
- **Painel de detalhe:** coluna à direita, com identificação no topo, lista de
  atributos rotulados com ícone, e ações no rodapé.
- **Faixa "Dica do Gênio":** rodapé da página, tom de destaque suave, mascote à
  esquerda, texto curto e link. Usar `UiHintBand`.
- **Densidade:** sem rolagem global em 1920×1080. A rolagem vive na região de
  conteúdo, nunca no casco.

Os primitivos já existem em `features/settings/ui/` — `UiPage`, `UiPageHeader`,
`UiMetric`, `UiMetricRow`, `UiCard`, `UiTable`, `UiToolbar`, `UiField`, `UiBadge`,
`UiDetailList`, `UiEmptyState`, `UiHintBand`, `UiIconTile`. O lote **estende** esses
primitivos; não cria um segundo sistema.

## 3. Lacunas de primitivo a resolver antes das telas

| Necessidade do blueprint | Situação |
| --- | --- |
| Interruptor (toggle) rotulado com descrição | não existe primitivo |
| Paginação numerada + seletor de itens por página | não existe primitivo |
| Cabeçalho de coluna ordenável | não existe primitivo |
| Menu de ações de linha (três pontos) | não existe primitivo |
| Avatar com indicador de estado | não existe primitivo |
| Formulário em duas colunas com dica sob o campo | parcial em `UiField` |

## 4. Escopo por tela

### 4.1 Geral
Blueprint: faixa de três blocos de estado no topo, depois grade de dois por dois —
Informações da organização, Identidade e logo, Idioma e região, Preferências da
plataforma, Comunicações. Ações "Descartar alterações" e "Salvar alterações".

A confirmar contra o backend antes de implementar: quais destes campos existem de
fato — nome, domínio, site, descrição, logo, cor primária, cor de destaque, idioma,
fuso, moeda, formato de data, início da semana, dicas do Gênio, modo compacto,
e-mail operacional, resumo semanal. O que não existir sai da tela.

### 4.2 Usuários e acesso
Blueprint: quatro indicadores, abas com ícone, busca, filtros de Área/Perfil/Status,
tabela com avatar, e painel de detalhe à direita.

Já real hoje: usuários ativos, convites pendentes, suspensos, área, função, perfil,
situação, "Contexto atualizado", criação direta e redefinição de senha.
Não existe: telefone, localização, times, "membro desde", "último acesso" verdadeiro,
"cobertura de áreas", "atividade recente". O quarto indicador do blueprint precisa ser
substituído por dado real — candidato: "Sem área atribuída", que já existe.
A foto do usuário existe desde `20260806120000_profile_avatars_self_service_v1`.

### 4.3 Marcas
Blueprint: lista à esquerda com busca e ordenação, painel da marca à direita com
paleta, idioma, domínio, conteúdos vinculados e autoria da última alteração.

A confirmar: paleta de cores, idioma padrão, contagem de conteúdos vinculados e
autor da última atualização. Sem origem real, esses blocos saem ou ficam
"Indisponível".

### 4.4 Central de ajuda
Blueprint: abas Geral/Aparência/Navegação/SEO/Acesso, formulário à esquerda e coluna
de interruptores de comportamento à direita, mais canais de contato.

A confirmar: quais interruptores têm persistência real. Interruptor sem backend não
entra — vira leitura ou sai.

### 4.5 Fontes do Dashboard
Blueprint: bloco explicativo com três indicadores, tabela de fontes conectadas com
responsável, triagem e catálogo por domínio em cartões.

Já real: fontes ativas, estado publicado, última atualização, volume, catálogo de
pipelines por área, agenda automática. Não existe: responsável por fonte, contagem de
entidades por fonte, "de N conectadas".
Registrar na tela a distinção que hoje confunde: **17 pipelines ativos de 35 no
catálogo** — o indicador precisa dizer as duas coisas.

### 4.6 Histórico de sincronizações
Blueprint: quatro filtros, cinco indicadores com percentual, tabela com fonte, tipo,
situação, duração e registros.

Já real: 100 execuções no recorte, filtros com efeito comprovado, cinco indicadores,
paginação cliente. Não existe: exportação e "registros criados/atualizados" — o botão
"Exportar" do blueprint **não** é reproduzido enquanto não houver origem.

## 5. Ordem de execução

1. Lacunas de primitivo (seção 3), com teste de contrato por primitivo novo.
2. Sidebar e casco comum.
3. Geral.
4. Usuários e acesso.
5. Marcas.
6. Central de ajuda.
7. Fontes do Dashboard.
8. Histórico de sincronizações.
9. QA visual real: 1920×1080 e 1366×768, claro e escuro, evidência por rota,
   ausência de rolagem global e de overflow horizontal.

Cada tela é um commit próprio, com auditoria de campo contra o backend antes de
escrever a interface.

## 6. Validação obrigatória por tela

`npm run lint`, `web:typecheck`, `contracts:typecheck`, `web:build`,
`local:qa:secret-scan`, `quality:changed`, testes de contrato afetados e captura
real no navegador nos dois temas.

## 7. Campos ausentes

O mapeamento completo do que o blueprint pede e nao existe, com veredito de
implementar ou descartar, esta em
`docs/design/SETTINGS_BLUEPRINT_V4_FIELD_GAP_BACKLOG.md`. Quatro campos entram
nesta refatoracao porque o dado ja existe no banco: ultimo acesso real,
membro desde, foto do usuario e cobertura de areas.

## 8. Densidade — critério medido, não impressão

O operador apontou em 2026-08-07 que a tela entregue "parece 1366 mesmo em Full
HD" e pediu o efeito de afastamento do blueprint. A comparação foi feita medindo
o blueprint de Usuários e acesso contra a captura real da tela em produção.

### 8.1 O que a medição mostrou

| Aspecto | Blueprint | Tela atual | Efeito |
| --- | --- | --- | --- |
| Espaço vertical usado | 100% da altura, sem sobra | conteúdo termina a ~62%, com 37% de vazio abaixo | é a maior causa da sensação de zoom |
| Ordem dos blocos | cabeçalho → indicadores → abas → tabela | cabeçalho → **abas** → indicadores → tabela | posição divergente do blueprint |
| Faixa de indicadores | **um** cartão com 4 colunas separadas por filete de 1 px | **três** cartões soltos, com borda e vão entre eles | contorno onde não devia haver |
| Barra de filtros | compacta, alinhada à esquerda, **dentro** do cartão da tabela | esticada por toda a largura, fora do cartão | rouba altura e dispersa o olho |
| Tabela | dentro de um cartão, com rodapé de paginação fixo na base | sem cartão, sem rodapé, para onde os dados acabam | não preenche a viewport |
| Altura de linha | ~58 px | ~67 px | 15% a mais por linha |
| Painel de detalhe | linhas de rótulo e valor, sem caixa | campos de formulário com borda visível | contorno onde não devia haver |
| Linhas visíveis | 6 + paginação | 3 e vazio | menos informação na mesma tela |

### 8.2 Regras que passam a valer

1. **A página ocupa a altura da viewport.** O cartão da tabela estica até a base
   e a paginação fica ancorada no rodapé dele. Nunca terminar o conteúdo no meio
   da tela e deixar vazio embaixo.
2. **A ordem do blueprint é obrigatória**: trilha, título, subtítulo, ação
   primária, faixa de indicadores, abas, conteúdo. Abas vêm **depois** dos
   indicadores.
3. **Um indicador não é um cartão.** A faixa é uma superfície única dividida por
   filete; sem borda por indicador e sem vão entre eles.
4. **Filtro é compacto.** Largura pelo conteúdo, alinhado à esquerda, dentro do
   cartão que ele filtra. Nada de `flex: 1` esticando seletor.
5. **Painel de detalhe é leitura.** Rótulo e valor em linha, sem caixa de campo.
   Campo com borda só quando existe edição naquele ponto.
6. **Altura de linha de tabela: 56 px**, com o par nome/e-mail em duas linhas
   dentro dessa altura.

### 8.3 Como isso é verificado

QA visual em 1920×1080 mede, por rota:

- `document.scrollingElement.scrollHeight === clientHeight` (sem rolagem global);
- altura do vazio abaixo do último bloco menor que 5% da viewport;
- ordem dos blocos conferida por seletor;
- `scrollWidth - innerWidth === 0`.

Sem esses quatro números, a tela não é dada por entregue.

## 9. Diff por tela contra o blueprint — 2026-08-07

Mapeamento completo das divergências, feito depois da revisão do operador. A
coluna "estado" diz o que já foi corrigido nesta entrega e o que ficou mapeado.

### 9.1 Divergências estruturais comuns

| Divergência | Onde | Estado |
| --- | --- | --- |
| Abas antes dos indicadores | Usuários e acesso | corrigido |
| Página termina no meio da viewport | todas | corrigido pela camada `gso-ui-page--fill` |
| Filtro esticado por toda a largura | todas | corrigido: campo com largura própria |
| Filtro fora do cartão que ele filtra | Usuários, Marcas, Histórico | corrigido em Usuários; Marcas e Histórico exigem mover o bloco |
| Painel de detalhe estreito e com rolagem para agir | Usuários, Marcas | corrigido: coluna de altura cheia, leitura rolando por dentro, largura de 21 rem para 23,5 rem |
| Campo com borda onde o blueprint mostra leitura | Usuários, Marcas | primitivo `.gso-ui-attr` criado; aplicação por tela pendente |
| Altura de linha 67 px | tabelas | corrigido para 56 px |
| Magenta com peso excessivo na aba | todas | corrigido: magenta só no traço, rótulo em tinta forte |

### 9.2 Pendente por tela

- **Geral:** tela ainda não existe no padrão do blueprint; exige auditoria dos
  campos antes de desenhar.
- **Marcas:** mover a barra de filtros para dentro do cartão e trocar os campos
  do painel por `.gso-ui-attr`.
- **Central de ajuda:** auditar persistência de cada interruptor antes de montar
  a coluna de comportamento.
- **Fontes do Dashboard:** bloco explicativo com indicadores e catálogo por
  domínio em cartões; declarar 17 ativos de 35 no catálogo.
- **Histórico:** mover filtros para dentro do cartão e aplicar `UiPagination`.
- **Integrações:** recomposição completa; hoje só recebeu a camada de densidade.
