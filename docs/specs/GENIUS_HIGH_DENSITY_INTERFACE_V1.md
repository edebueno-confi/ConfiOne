# Genius Support OS — Interface High-Density V1

Status: especificação canônica para implementação local, aprovada pelo Product
Owner em 03/08/2026.

Esta especificação substitui a direção de implementação do `Dashboard Blueprint
System V2`. O Blueprint V2 permanece apenas como histórico quando ainda existir
no histórico Git; não é referência para novas composições. As referências visuais
vigentes são as imagens selecionadas em `docs/design/blueprint/Dashboard PO/` e
`docs/design/blueprint/Suporte e conversas/`.

## 1. Objetivo

Reconstruir a experiência visual do Dashboard Gerencial e das superfícies
administrativas relacionadas para leitura executiva de alta densidade em
resolução Full HD, mantendo a operação real, a fonte dos dados e os contratos
existentes.

## 2. Decisão de direção

High-Density significa alta densidade funcional e baixa densidade perceptual.
Não significa ampliar títulos, aplicar zoom CSS, empilhar seções longas ou
transformar a interface em mosaico de cards.

## 3. Fontes de referência

- `docs/design/blueprint/Dashboard PO/`: Produto, Comercial, Customer Success,
  Suporte, Financeiro e Desenvolvimento.
- `docs/design/blueprint/Suporte e conversas/`: inbox, tickets, contas B2B e
  formulários operacionais.
- `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md`.
- contratos e read models existentes; nenhuma imagem é fonte de regra ou dado.

## 4. Divergências documentais resolvidas

O Blueprint V2 anterior priorizava blocos isolados, títulos maiores, quatro KPIs
e grandes zonas vazias. As referências atuais priorizam seis KPIs compactos,
filtros em uma linha, tabelas e análises visíveis simultaneamente. Quando houver
conflito, esta especificação prevalece para implementação visual.

## 5. Escopo de superfícies

Implementar, nesta ordem:

1. shell administrativo, sidebar, header, navegação e estados globais;
2. Visão Geral;
3. Comercial;
4. Customer Success;
5. Suporte & Chat;
6. Financeiro;
7. Integrações;
8. Fontes do Dashboard;
9. Histórico de sincronizações;
10. Gênio em ação e seus estados.

## 6. Fora de escopo

Não alterar métricas, fórmulas, denominadores, consultas, views, RPCs, tabelas,
migrations, RLS, Edge Functions, scheduler, sincronismo, credenciais,
permissões, tenants, auditoria ou regras de negócio.

## 7. Princípio de dados

O frontend apenas renderiza read models e chama handlers já existentes. Ausência
de dado é `Indisponível`. Não usar zero, texto genérico, mock, fallback visual
ou dado calculado localmente para preencher lacunas.

## 8. Canvas e breakpoints

- composição principal: 1920×1080;
- QA obrigatório: 1440×900, 1024×768, 768×1024 e 390×844;
- sidebar desktop: 224–248px;
- header interno: 52–60px;
- padding principal desktop: 20–28px;
- gap de grid: 12–18px;
- sem `transform: scale()`.

## 9. Hierarquia de leitura

Cada domínio deve seguir: status e contexto da fonte; filtros; faixa de KPIs;
análise principal; listas/tabelas de decisão; ações contextualizadas. A ação
de exportar ou administrar integrações nunca domina os indicadores.

## 10. KPIs

Hierarquia: primário, secundário, contexto, diagnóstico e qualidade dos dados.

- desktop amplo: 4–6 KPIs primários;
- desktop médio: 3–4;
- tablet: 2;
- mobile: 1–2 por faixa;
- valores com números tabulares, sem números gigantes;
- deltas e denominadores ficam próximos da métrica;
- indisponibilidade tem tratamento semântico, não cor de sucesso.

## 11. Filtros

Filtros ficam acima dos KPIs, preferencialmente em uma única linha no desktop.
Usar apenas filtros que existam no contrato da área. Estado de aba, filtros,
período e paginação devem permanecer reproduzíveis pela URL quando a rota já
suportar esse padrão.

## 12. Visão Geral

É um cockpit executivo compacto: faixa de fontes, título curto, filtro de
período, KPIs de desempenho e posição, mapa de áreas e duas zonas analíticas.
Evitar sequência vertical de seções e cards com preenchimento decorativo.

## 13. Comercial

Seguir o mesmo padrão do Suporte & Chat: header de domínio, filtros densos,
faixa de seis KPIs quando houver dados, funil e tendência lado a lado, depois
insights e tabelas. Pipelines continuam vindo da fonte real, inclusive legados.

## 14. Customer Success

Exibir o critério de carteira/denominador somente se fornecido pelo contrato.
Se a carteira real não estiver consolidada, apresentar `Indisponível` e a
explicação operacional curta. Não inferir clientes de CS a partir do catálogo
geral de empresas.

## 15. Suporte & Chat

Usar KPIs compactos, status e prioridade visíveis, gráficos curtos e ranking de
responsáveis/filas. Conversas e tickets mantêm layout operacional com lista
central dominante e rails contextuais quando a rota os possuir.

## 16. Financeiro

Manter OMIE como fonte financeira. O frame `OMIE · Contas a Receber`, título,
descrição, origem e frescor ficam no mesmo nível visual. KPIs de aging, tabelas
de previsibilidade e inadimplência usam a mesma gramática de Comercial e
Suporte, sem cores de cartão em excesso.

## 17. Integrações, Fontes e Histórico

São superfícies de operação administrativa, não analytics decorativo. Exibir
credencial configurada sem revelar segredo, escopo real, estado de execução,
última atualização válida e erro sanitizado. O histórico deve usar ciclos
recolhíveis ou tabela compacta para evitar rolagem interminável.

## 18. Shell

Sidebar navy consistente, header baixo, navegação por links semânticos e área
de conteúdo que ocupa a largura real. Não criar segunda navegação redundante
dentro do Dashboard ou de Configurações.

## 19. Cards e superfícies

Cards são leves: borda suave, raio pequeno, sombra discreta, padding de
12–16px. Preferir divisores, faixas abertas e grids alinhados. Não aninhar
cards sem necessidade nem usar uma cor forte como fundo de uma faixa inteira.

## 20. Tipografia

- título de página: 22–30px, máximo 32px;
- título de domínio: 20–26px;
- seção: 14–16px;
- KPI: 24–34px;
- tabela e lista: 12–14px;
- metadados: 11–12px;
- `font-variant-numeric: tabular-nums` em números.

## 21. Cores e temas

Light usa superfícies claras, navy, azul e magenta como assinatura. Dark usa
navy profundo e superfícies elevadas, nunca preto puro. Cor semântica é
reservada para sucesso, alerta, erro e indisponibilidade. Layout e hierarquia
devem ser os mesmos nos dois temas.

## 22. Estados e cópia

Loading, vazio, erro, indisponível e atualização parcial devem ser explícitos,
curtos e humanos. Não expor stack trace, schema, RPC, view, RLS ou termos de
infraestrutura na interface comum. Não declarar “atualizado” sem snapshot ou
execução válida correspondente.

## 23. Gênio em ação

O Gênio deve parecer suspenso, voando e fazendo mágica: halo leve, partículas
controladas e movimento de flutuação. A animação não simula progresso. Copy
criativa e operacional, por exemplo: `O Gênio está alinhando os sinais das
fontes` e `Assim que a leitura publicada estiver pronta, o cockpit volta para
você.` Respeitar `prefers-reduced-motion`.

## 24. Acessibilidade e comportamento

Usar landmarks e elementos semânticos, foco visível, `:focus-visible`, labels
associados, botões reais para ações e links reais para navegação. Selects e
inputs mantêm contraste em light/dark. Não usar `transition: all`. Longos
conteúdos devem truncar ou quebrar com intenção; não criar overflow global.

## 25. Densidade cognitiva e semântica de decisão

High-Density combina alta densidade funcional com baixa densidade perceptiva.
Espaço negativo é mantido quando separa grupos ou melhora o escaneamento; só é
removido quando não possui função. A leitura segue orientação, resultado,
explicação e ação/detalhe, com apenas um ponto dominante e poucos elementos
secundários.

KPIs primários respondem à pergunta central e recebem o maior contraste.
Indicadores secundários apoiam a interpretação; contexto, diagnóstico e
qualidade ficam próximos da métrica ou em detalhe. Não usar seis KPIs apenas
porque há espaço, nem transformar todos os indicadores em elementos dominantes.

Cor é semântica: azul informa ou orienta ação, verde indica resultado válido ou
positivo, vermelho indica falha/perda/risco, âmbar indica atenção e magenta
assina a marca ou destaca um ponto. Ganhos, perdas e variações dependem do
significado do KPI, não apenas do sinal matemático. Alertas devem explicar o
que ocorreu, sua gravidade, contexto e ação possível.

Gráficos preservam as regras de granularidade e temporalidade existentes. A
paleta de cada gráfico é limitada e tabelas usam cor apenas para status,
prioridade, risco, resultado ou ação pendente. A interface deve responder em
até 30 segundos onde estou, o que mudou, o que exige atenção e onde agir.

## 26. Performance

O sistema visual não adiciona biblioteca pesada, não usa `transform: scale()`
nem animação como simulador de progresso. CSS compartilhado deve ser carregado
junto das superfícies que o utilizam; transições são específicas e
`prefers-reduced-motion` desativa movimento não essencial. Nenhum dado,
consulta, polling ou chamada de integração é criado pela camada visual.

## 27. Critérios de revisão visual

Para cada superfície, a revisão deve responder: o olho sabe onde começar; o
estado geral é compreendido; os elementos prioritários estão claros; há
competição excessiva; há respiro; a cor aponta para algo relevante; o alerta
tem ação; a primeira dobra responde à pergunta central; a tabela é escaneável;
o usuário sabe onde agir; e a tela parece madura, humana e não genérica.

Problemas P0, P1 e P2 devem ser corrigidos antes do aceite. P3 é registrado no
backlog. A revisão considera simultaneamente densidade, carga cognitiva,
contraste, acessibilidade, overflow, console, requests e estados reais.

## 28. Responsividade

Em tablet, reduzir colunas sem esconder informação crítica. Em mobile, ordenar
conteúdo por prioridade, transformar tabelas em linhas legíveis ou rolagem
interna controlada e preservar ações essenciais. Não duplicar shell nem criar
scroll horizontal da página.

## 29. Validação e evidência

Obrigatórios: contracts typecheck, web typecheck, build, testes focados
existentes, secret scan, `git diff --check`, quality changed/module/staged e
QA browser real nas cinco larguras em light/dark. Registrar screenshots reais,
rotas, console, requests, overflow, teclado, foco e reduced motion. Separar
validado, parcialmente validado, não validado e dependente de credencial.

## 30. Skills e método aplicados

As skills aplicáveis foram lidas antes da implementação e orientaram o lote:

- `C:\Users\edebu\.codex\skills\frontend-design\SKILL.md` — composição
  frontend e implementação direta; aplicado.
- `C:\Users\edebu\.codex\skills\gso-operational-design\SKILL.md` — densidade
  operacional e fonte factual; aplicado.
- `C:\Users\edebu\.codex\skills\ux-friction-analyzer\SKILL.md` — fricções,
  carga cognitiva e estados; aplicado.
- `C:\Users\edebu\.codex\plugins\cache\openai-curated-remote\product-design\0.1.52\skills\index\SKILL.md` —
  routing de design e revisão; aplicado.
- `C:\Projetos\GSO-old\.agents\skills\web-design-guidelines\SKILL.md` —
  semântica, foco, motion e overflow; aplicado.
- `C:\Projetos\GSO-old\.agents\skills\genius-code-quality\SKILL.md` —
  quality gates e separação de findings; aplicado.
- `C:\Projetos\GSO-old\.agents\skills\genius-documentation-governance\SKILL.md` —
  precedência documental e auditoria; aplicado.
- `C:\Users\edebu\.codex\plugins\cache\openai-curated-remote\data-analytics\0.2.8-13ceeea1f599\skills\design-kpis\SKILL.md` —
  hierarquia de KPI e leitura executiva; aplicado.
- `C:\Users\edebu\.codex\skills\screenshot\SKILL.md` e
  `C:\Users\edebu\.codex\skills\playwright\SKILL.md` — evidência real e
  QA browser; aplicados na tentativa oficial, limitada pela autorização local.
- `C:\Users\edebu\.codex\skills\verification-before-completion\SKILL.md` —
  distinção entre validado, parcial e bloqueado; aplicado.

Não foram usadas skills/ferramentas de geração de imagem, prototipação,
blueprint ou mockup: rejeitadas por decisão explícita do Product Owner.

## 31. Sequência de commits

Separar somente por tema real: direção documental; tokens/primitivos; shell;
Dashboard; Configurações; responsividade/temas; acessibilidade/testes; QA e
documentação final. Não criar commits artificiais e não incluir exclusões ou
referências preexistentes sem revisão explícita do diff.

## 32. Critério de conclusão

O lote só termina quando a implementação estiver coerente com as referências,
os dados continuarem contratuais, as validações objetivas forem executadas e
as limitações estiverem documentadas. Push, deploy, sync externo e mudanças de
backend permanecem fora deste lote.
