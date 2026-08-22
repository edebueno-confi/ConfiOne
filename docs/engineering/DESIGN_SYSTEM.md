# ConfiOne, design system e revisão visual

## Fontes existentes

Não criar um design system paralelo. As referências existentes são:

- DESIGN.md;
- docs/design/GENIUS_SUPPORT_OS_DESIGN_SYSTEM.md;
- docs/INTERNAL_WORKSPACE_DESIGN_SYSTEM.md;
- docs/specs/CONFI_ONE_BRAND_SYSTEM_V1.md;
- docs/specs/ADMIN_CONFIGURATION_VISUAL_CONTRACT_V1.md;
- contratos e blueprints específicos indicados por docs/PROJECT_STATE.md e
  docs/README.md.

Quando houver conflito, o documento visual de maior precedência indicado pelos
documentos canônicos da área deve ser usado e o conflito deve ser reportado.

## Princípios observáveis

- preservar o shell e a navegação global existentes;
- evitar acessos duplicados e menus duplicados;
- priorizar densidade útil, clareza operacional e baixo peso cognitivo;
- usar estados reais de carregamento, vazio, erro, permissão negada e dado
  indisponível;
- não tratar estética genérica de painel como objetivo suficiente;
- não publicar uma tela parcial como pronta;
- validar viewport, overflow, foco, teclado, contraste e comportamento responsivo
  quando aplicável;
- gerar uma tela por imagem ou PNG, salvo pedido explícito diferente.

## Revisão visual

O reviewer deve comparar a implementação com o contrato visual aplicável e registrar:

- referência usada;
- elementos preservados;
- divergência objetiva;
- impacto no fluxo;
- evidência visual ou reproduzível;
- se o item é finding ou decisão de produto.

Preferência pessoal não constitui finding.

UNRESOLVED — requires project owner decision: precedência visual entre dois
contratos conflitantes, quando o documento da área não resolver o conflito.
