# Frontend Visual Governance

## Objetivo

Este documento define a governança mínima obrigatória para a camada visual do Genius Support OS, com foco em cockpit operacional B2B, previsibilidade de layout e redução de drift entre blueprint, tokens e primitives.

Ele complementa:
- `docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md`
- `docs/ARCHITECTURE_RULES.md`
- `docs/SUPPORT_WORKSPACE_ARCHITECTURE_SPEC.md`

## Regra central

Layout, spacing, radius, elevação, scroll e estados visuais recorrentes não devem nascer dentro da tela.

Eles devem nascer em:
- tokens de `apps/web/src/index.css`
- primitives reutilizáveis
- componentes compartilhados explicitamente aprovados

Quando existir blueprint aprovado e screen spec claro para uma superfície operacional, a gramática visual dessa superfície deve nascer em primitive operacional do domínio, não em primitive genérica.

## Proibido

- `style={{ ... }}` para visual recorrente
- cor hex direta em componente
- shadow solta fora dos tokens
- radius solto fora dos tokens
- spacing arbitrário repetido
- height/width arbitrário recorrente sem token ou primitive
- `overflow-hidden` para esconder bug de layout
- `position: absolute` para compor layout principal
- `z-index` alto sem camada definida e justificativa
- criar novo padrão visual diretamente dentro de uma page/feature
- usar primitive genérica para cockpit quando ela conflitar com a linguagem operacional aprovada

## Permitido com justificativa

- valor arbitrário isolado quando não houver alternativa limpa e o caso for realmente excepcional
- `overflow-hidden` apenas para clipping intencional de superfície visual
- `position: absolute` apenas para badge, decoração, overlay controlado ou elemento semanticamente ancorado
- `z-index` apenas em camadas nomeadas e raras

## Obrigatório

- usar tokens para cores, spacing, radius, largura e alturas recorrentes
- usar primitives para shell, queue, conversa, rail, slot contextual, composer e estados operacionais
- colocar `min-h-0` no container correto quando existir coluna com scroll interno
- manter scroll no componente certo:
  - fila
  - thread/conversa
  - rail direito
  - painel contextual
- validar viewport real com:
  - `window.innerWidth`
  - `window.innerHeight`
  - scroll global
  - containers com scroll interno
- preservar o blueprint aprovado como fonte de verdade visual
- evitar UI genérica de dashboard ou CRUD administrativo
- tratar primitives genéricas como fallback, não como idioma visual final de superfícies com blueprint operacional

## Primitive operacional versus primitive genérica

### Primitive operacional

Primitive operacional é a camada visual criada ou aprovada para um domínio de trabalho específico.

Exemplos:
- queue;
- thread conversacional;
- rail de contexto;
- composer;
- header operacional;
- painel contextual do domínio.

Quando existir blueprint + spec para a superfície, a implementação deve usar ou criar primitive operacional do domínio.

### Primitive genérica

Primitive genérica é base de apoio e fallback.

No estado atual do projeto, `apps/web/src/components/ui.tsx` deve ser tratado como fallback visual e estrutural, não como fonte principal de aparência em superfícies operacionais com blueprint próprio.

Isso vale especialmente para:
- `PageHeader`;
- `Panel`;
- `MetricCard`;
- `StatusPill`;
- `GovernedActionDrawer`.

Esses componentes podem continuar existindo como base reutilizável, mas não devem governar a aparência final de:
- queue operacional;
- tickets e conversas;
- rail contextual;
- composer;
- cockpit administrativo com blueprint específico.

## Regra de composição de tela

A página compõe a superfície.

A página não deve inventar a gramática visual principal quando já existirem:
- blueprint aprovado;
- screen spec;
- primitive operacional do domínio.

Quando houver blueprint + spec, a implementação deve:

1. localizar a primitive operacional existente do domínio;
2. estender essa primitive, se a evolução for compatível;
3. criar nova primitive operacional, se a estrutura atual não suportar a fidelidade exigida;
4. recorrer à primitive genérica apenas como fallback local.

## Ordem de decisão visual

1. Blueprint aprovado
2. Screen spec da superfície
3. Primitive operacional existente do domínio
4. Design System V3
5. Token existente
6. Primitive genérica/fallback
7. Novo token ou primitive, se o padrão for recorrente
8. Valor local, apenas se excepcional e documentável

## Aplicação atual

No Support Workspace, o mínimo esperado é:
- shell operacional previsível
- fila compacta como coluna com scroll próprio
- conversa dominante com thread e composer dockado
- toolbar compacta estável
- rail padrão ou painel contextual ocupando o mesmo slot direito
- ausência de scroll global do cockpit

## Sinal de regressão

Considere regressão quando ocorrer qualquer um dos pontos abaixo:
- a página volta a rolar globalmente
- o rail corta conteúdo em vez de rolar internamente
- o painel contextual sobrepõe layout em vez de ocupar o slot direito
- a conversa perde largura por coluna extra improvisada
- componentes passam a depender de `calc(...)`, `absolute`, `z-index` ou inline style para “encaixar”
- uma tela cria seu próprio padrão de card, botão, badge, drawer ou composer
- uma superfície operacional volta a ser montada principalmente com primitive genérica quando já existe blueprint próprio
