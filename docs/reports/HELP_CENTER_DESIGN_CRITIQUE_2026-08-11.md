# Crítica de design e mapa funcional — Central de Ajuda

Data: 2026-08-11
Escopo: Central pública de ajuda do Genius Returns
Checkout validado: `codex/help-center-reorganization`

## Diagnóstico executivo

A central já tem uma direção visual coerente: conteúdo editorial, navegação clara,
hero com busca e categorias derivadas do contrato público. Os dois problemas que
mais prejudicavam a confiança eram funcionais, não cosméticos:

1. O aviso do portal era renderizado dentro do header e ficava atrás do contexto
   visual do hero na home.
2. “Categorias” apontava para um fragmento da home. Em artigos, isso fazia o
   usuário perder o contexto e dava a impressão de que a listagem não existia.

O lote atual corrige esses fluxos, troca o avatar antigo pelo logo institucional
versionado do Genius quando o branding público não fornece um asset e cria uma
rota de categorias baseada exclusivamente na navegação pública real.

## Mapa de telas e responsabilidades

| Rota | Tela | Fonte de dados | Ação principal |
| --- | --- | --- | --- |
| `/help` | Diretório de centrais públicas | Resolver de espaços públicos | Abrir uma central |
| `/help/:spaceSlug` | Home da central | Navegação, artigos publicados e busca pública | Buscar, explorar categorias e abrir artigos |
| `/help/:spaceSlug/categories` | Índice de categorias | Navegação pública do espaço | Escolher um tema e ir para artigos filtrados |
| `/help/:spaceSlug/articles` | Lista de artigos | Artigos publicados + categorias | Filtrar por categoria, buscar e paginar |
| `/help/:spaceSlug/articles/:articleSlug` | Leitura de artigo | Detalhe público do artigo | Ler, compartilhar/retornar e acessar suporte |
| `/portal` | Portal autenticado | Sessão e contratos do portal | Entrar no fluxo operacional do cliente |

O header compartilhado mantém a mesma identidade entre as telas. “Categorias”
agora é uma rota SPA real, e não um link para fragmento da home.

## Estados cobertos

| Estado | Home | Categorias | Artigos | Modal do portal |
| --- | --- | --- | --- | --- |
| Carregando | Mascote e mensagem de consulta | Herdado do layout | Estado de carregamento | Fechado |
| Pronto | Hero, busca e categorias | Cards da navegação pública | Lista, filtros e paginação | Fechado |
| Vazio | Estado de conteúdo indisponível | Nenhuma categoria publicada | Nenhum artigo publicado | Fechado |
| Erro/contrato indisponível | Mensagem classificada e nova tentativa | Herdado do carregamento | Mensagem classificada e nova tentativa | Fechado |
| Busca sem resultado | Estado vazio com retorno para categorias | — | Estado vazio com limpeza de filtros | — |
| Portal aberto | Backdrop acima de toda a aplicação | Igual | Igual | Foco inicial, `Esc`, fechar, `Entendi` e body sem rolagem |

## Crítica visual

### Primeira impressão

O hero comunica bem a proposta e orienta a busca. A hierarquia, porém, era
quebrada pelo modal invisível na home: o clique parecia não funcionar porque o
conteúdo do aviso ficava coberto pelo hero. O logo em formato de avatar também
reduzia a percepção de produto oficial.

### Hierarquia e navegação

O caminho para artigos é claro, mas a antiga ação “Categorias” não cumpria o
rótulo. A nova tela dedicada cria um índice escaneável, com descrição, contagem
de artigos publicados e ação explícita “Ver artigos”. A home continua exibindo
um resumo de categorias e passa a levar ao índice completo.

### Consistência

O índice usa o mesmo sistema de bordas, raios, badges, cores e ícones da home.
Links internos do header usam navegação SPA, evitando recarregamento e perda de
estado.

### Acessibilidade e comportamento

O aviso do portal agora usa `dialog`, nome e descrição acessíveis, botão de
fechamento rotulado, foco inicial no fechamento, restauração do foco anterior,
tecla `Escape`, fechamento pelo backdrop e bloqueio de rolagem do documento.
O conteúdo do modal foi renderizado via portal no `document.body`, eliminando a
dependência da ordem de empilhamento do hero.

## Direção de upgrade visual

### Princípios

- Priorizar tarefa: buscar, escolher um tema e ler.
- Usar o Gênio como guia contextual, não como decoração dominante.
- Mostrar sempre o estado real do conteúdo público; não mascarar ausência de
  artigos com dados de exemplo.
- Manter a marca configurável pelo contrato público e preservar fallback local
  somente para a identidade institucional conhecida do Genius.

### Próximas oportunidades

1. Adicionar um resumo contextual no índice de categorias (“X categorias, Y
   artigos publicados”) vindo do mesmo read model.
2. Na lista de artigos, manter a categoria selecionada visível como título e
   permitir limpar o filtro em um único clique.
3. Revisar a densidade do hero em telas menores para que a primeira dobra mostre
   também o início das categorias sem parecer um painel de marketing.
4. Quando `logo_asset_url` estiver preenchido no resolver público, validar no QA
   visual logo claro/escuro, proporção e fallback de carregamento.
5. Acrescentar teste de rota para garantir que `/categories` não regresse à home
   e teste comportamental do modal em home, lista e detalhe de artigo.

## Evidências do QA local

- Home com modal corrigido: `output/playwright/help-home-portal-modal-4176.png`.
- Índice de categorias: `output/playwright/help-categories-4176.png`.
- Snapshot da categoria filtrada: `output/playwright/help-category-filter-4176.md`.
- O resolver público local retornou `logo_asset_url` vazio para `genius`; o
  header aplica o asset institucional versionado como fallback específico desse
  espaço.
