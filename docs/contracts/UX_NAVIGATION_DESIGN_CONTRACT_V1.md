# UX Navigation Design Contract V1

> **Adendo de precedência — 2026-08-09.** Para o shell autenticado, `ADMIN_CONFIGURATION_VISUAL_CONTRACT_V1.md` determina sidebar de 240px expandida, rail de 56px colapsado e submenu em overlay. A visibilidade continua derivada do catálogo/guard real; o flyout não introduz uma segunda matriz de permissões nem altera a validação de deep links.

## Objetivo

Garantir que o Genius Support OS tenha navegação, hierarquia visual e experiência operacional coerentes, sem telas fragmentadas, redundantes ou visualmente incompatíveis.

## MUST

- A navegação deve refletir rotina de trabalho, não estrutura técnica interna.
- A sidebar deve priorizar áreas de atuação e cockpits operacionais.
- Configurações, acessos e administração devem ficar centralizados em agrupamentos claros.
- Toda tela deve ter hierarquia explícita: objetivo, recorte, ação primária e detalhes.
- Componentes equivalentes devem usar o mesmo padrão visual e comportamento.
- Espaçamento, padding, labels, CTAs, estados e densidade devem seguir tokens ou componentes reutilizáveis.
- Telas críticas devem ser responsivas em desktop, tablet e mobile.
- Mobile deve ter navegação própria, sem depender de sidebar longa.
- Estados de loading, vazio, erro, sucesso e permissão negada devem ser padronizados.
- Cores semânticas devem comunicar urgência, risco, sucesso, atenção e neutralidade.

## SHOULD

- Reduzir colunas concorrentes quando o detalhe for mais importante que a lista.
- Usar progressão operacional: visão geral, foco, detalhe e ação.
- Agrupar filtros em áreas recolhíveis quando ocuparem espaço excessivo.
- Evitar repetição de KPIs quando gráfico e card comunicam a mesma leitura.
- Usar o mascote Genius como apoio contextual em estados vazios, loading e sucesso, sem competir com a tarefa.

## MUST NOT

- Não criar menu baseado em nomes vagos como "Trabalho" ou "Engenharia" quando a experiência deveria depender de área, função e permissão.
- Não duplicar padrões de filtro, tabs, cards ou botões para funções equivalentes.
- Não hardcodar cores, espaçamentos ou variações visuais fora do design system.
- Não comprimir informação crítica em colunas laterais estreitas.
- Não usar linguagem de IA ou "inteligente" quando não houver capacidade funcional demonstrável.
- Não expor módulos incompletos como se estivessem prontos para operação.

## Critérios de aceite

- Todas as telas do escopo têm hierarquia visual clara.
- Sidebar não exige rolagem no uso padrão desktop.
- Componentes equivalentes têm aparência e interação equivalentes.
- Não há overflow horizontal nos breakpoints definidos.
- A ação principal de cada tela é identificável em até 5 segundos.
- Dados críticos e alertas usam semântica visual consistente.

## Evidências obrigatórias

- Screenshots desktop e mobile das rotas alteradas.
- Registro de rotas avaliadas.
- Resultado de QA visual com ausência de overflow horizontal.
- Lista de componentes/padrões alterados.

## Condições de reprovação

- Tela exige rolagem lateral.
- Sidebar continua poluída ou com nomenclatura ambígua.
- Duas telas mantêm padrões diferentes para o mesmo tipo de controle.
- Card ou tabela ocupa espaço dominante sem ser a informação mais importante.
- Há CTA primário conflitante ou inexistente.

## Processo de exceção

Exceções devem ser documentadas com:

- tela afetada;
- razão operacional;
- impacto;
- prazo para correção;
- validação manual exigida.

## Automatização futura

- Auditoria Playwright de overflow e screenshots.
- Script de detecção de hex fixo em TSX.
- Checklist de componentes permitidos.
- Validação de rotas e breakpoints.
