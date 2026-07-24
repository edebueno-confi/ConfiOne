# Reescrita editorial em massa da Central — 2026-07-24

## Escopo

Lote local aplicado exclusivamente aos artigos `published + public` do espaço
`genius`. Artigos internos, restritos, arquivados ou ainda não publicados não
foram alterados.

## Resultado

- artigos públicos analisados: `63`;
- artigos com alteração editorial: `60`;
- artigos preservados sem alteração relevante: `3`;
- artigos com callout de orientação: `13`;
- headings gerados ou normalizados: `139`;
- itens de lista estruturados: `293`;
- resumos acima do limite de `320` caracteres: `0`;
- títulos, resumos ou corpos com marcador de substituição UTF-8: `0`;
- headings ainda com numeração redundante: `0`.

## Regras aplicadas

- remoção de título e lead repetidos no corpo;
- sentence case para headings e correção de erros ortográficos detectáveis;
- organização de instruções em passos, listas e seções;
- conversão de `Dica:` para callout editorial;
- preservação de imagens, links, IDs de assets e conteúdo operacional existente;
- normalização manual do artigo de parametrização geral, que concentrava a
  maior quantidade de funcionalidades em texto corrido;
- proteção do parser público para não reformatar Markdown já estruturado nas
  categorias de Configurações.

## Limites

O lote não inventa comportamento, screenshots, credenciais, links técnicos ou
regras de negócio. Artigos cujo conteúdo de origem é incompleto continuam
precisando de revisão funcional no lote `KNOWLEDGE-01`, mesmo que a diagramação
esteja mais clara.

## Evidências

- `output/playwright/knowledge-mass-estorno-desktop.png`;
- `output/playwright/knowledge-mass-parametrizacao-desktop.png`;
- `output/playwright/knowledge-mass-reversa-desktop.png`;
- `output/playwright/knowledge-mass-motivos-desktop.png`;
- `output/playwright/knowledge-mass-integracao-desktop.png`.

## Implementação

- `scripts/knowledge/generate-mass-editorial-rewrite.mjs` gera e aplica a
  migration somente no Supabase local;
- `supabase/migrations/20260724180000_knowledge_mass_editorial_rewrite.sql`
  registra o conteúdo resultante;
- `tests/scripts/knowledge-mass-visual-smoke.mjs` percorre os 63 artigos
  públicos, verificando status, console, rede e overflow desktop/mobile.
