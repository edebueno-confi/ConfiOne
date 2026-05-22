# Knowledge Editor Rich - Handoff de Fase

Data: 2026-05-22
Workspace: `C:\Trabalho`
Frente: editor visual rico da Knowledge Base

## Objetivo entregue nesta fase

Substituir o editor frágil anterior por uma base visual rica para authoring de artigos da Knowledge Base, com:

- editor WYSIWYG baseado em TipTap/ProseMirror;
- toolbar funcional para formatação e inserção de blocos;
- persistência governada por RPC;
- renderer público seguro para blocos relacionados;
- separação clara entre salvar e publicar.

## Entregas concluídas

### Editor visual

- migração da superfície de edição para TipTap/ProseMirror;
- toolbar funcional com bloco base, formatação inline, listas, link, cor controlada, marca-texto, imagem, vídeo, divisor, marcador, código, desfazer e refazer;
- blocos visuais reais para:
  - nota;
  - importante;
  - alerta;
  - cuidado;
  - leia também;
  - imagem governada;
  - vídeo YouTube governado.

### Persistência e contratos

- tags editoriais persistidas via RPC dedicada;
- coluna `knowledge_articles.tags` adicionada ao contrato administrativo;
- normalização de tags com limite operacional e bloqueio de duplicidade;
- views administrativas de artigos atualizadas para expor tags;
- renderer público do bloco `Leia também` protegido para não vazar artigo não elegível.

### Hardening e testes

- auditoria de funções SECURITY DEFINER alinhada à nova RPC;
- migrations e pgTAP local passando após reset do banco local.

## Lacunas conhecidas

### Ainda não consolidado para próxima fase

- busca/seleção de `Leia também` precisa ser validada em QA operacional mais profundo com curadoria real de artigos publicados;
- a superfície visual do editor está mais próxima do blueprint, mas ainda precisa de rodada final de fidelidade visual;
- há sujeira relevante no working tree fora desta frente, então o commit desta fase precisa continuar seletivo;
- há arquivos de Knowledge e Help Center misturados com mudanças paralelas do repositório, exigindo staging por arquivo ou por hunk.

### Fora do escopo desta fase

- limpeza ampla do repositório;
- consolidação funcional de Support, Portal, Admin e Engineering;
- remoção de toda a dívida visual fora da Knowledge Base;
- reorganização completa da navegação global.

## Regras para retomada

- não voltar a usar textarea Markdown como experiência principal;
- manter leitura por views/read models e escrita por RPCs;
- não afrouxar gate de publicação;
- não permitir HTML livre, iframe livre ou `dangerouslySetInnerHTML`;
- tratar o editor de Knowledge como superfície de authoring, com scroll natural e toolbar sticky.

