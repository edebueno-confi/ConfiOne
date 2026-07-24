# PILOT-03 — Design de refatoração visual do piloto

## Objetivo

Concluir a experiência visual do Dashboard Gerencial e da Central Pública de Ajuda sem alterar backend, migrations, RLS ou contratos de autorização.

## Dashboard

O `dashboard_viewer` receberá uma navegação mínima com somente o Dashboard Gerencial. A construção da navegação continuará dependente das permissões reais; a camada visual apenas renderizará as seções devolvidas pelo contrato. Grupos vazios não serão exibidos.

O status de dados será traduzido para linguagem operacional: última atualização e indicação de limitação de atualidade quando aplicável. Termos técnicos como snapshot, incremental, RPC, cache e delta não aparecerão para o usuário.

Os cinco KPIs permanecerão em uma linha em larguras amplas. A partir de 1024px serão organizados em 3 + 2, com os dois cards da segunda linha distribuídos de forma equilibrada. Loading, vazio e erro manterão a hierarquia da tela sem uma parede de skeletons cinza.

## Central de Ajuda

A home será organizada como jornada única: consultar, explorar, ler e acessar o portal quando necessário. O hero terá busca principal, sugestões de consulta, uma ação primária e o Genius integrado com `welcome + happy`. Categorias serão limitadas inicialmente a seis no desktop e três no mobile; artigos úteis, a cinco no desktop e três no mobile. O portal aparecerá uma única vez ao fim da jornada.

A lista preservará busca e categoria, mas limitará o conteúdo visível por paginação simples com URL previsível. Desktop usará linhas/lista; mobile usará cards adaptados. O estado sem resultado ocupará apenas o espaço necessário e usará `shrug + wink` junto da busca e das ações de recuperação.

O artigo terá no máximo uma coluna auxiliar: índice estreito e sticky no desktop, exibido apenas quando houver três ou mais seções. Abaixo de 1024px haverá uma coluna única; no mobile o índice será um bloco recolhível no topo. Relacionados, próximo passo e Genius aparecerão após o conteúdo. O bloco de próximo passo usará `present + happy` sem sobreposição.

Loading usará `magic + happy` integrado à própria superfície. Artigo inexistente usará `shrug + happy` junto da busca, retorno à visão geral e lista de artigos.

## Componentes e dados

Serão extraídos somente componentes reutilizados por mais de um estado ou página. O mascote permanecerá no componente oficial, com `aria-label` quando funcional e oculto para leitores de tela quando decorativo. Estados públicos continuarão renderizando contratos reais e não criarão dados fictícios.

## Validação

Serão executados typechecks, build, testes focados, smoke autenticado do viewer, smoke público da Central, console/rede, ausência de overflow e `git diff --check`. Screenshots completas serão geradas externamente para avaliação visual, sem rótulos de auditoria na aplicação.

## Commits

1. `fix(navigation): simplificar shell do dashboard viewer`
2. `refactor(analytics): aprimorar hierarquia visual do piloto`
3. `refactor(help-center): criar experiência guiada de documentação`
4. `test(pilot): validar navegação e estados finais`
