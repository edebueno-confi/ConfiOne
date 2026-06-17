# PRODUCT_DOCS_INTERNAL_READER_V1.md

## Objetivo
Definir a V1 da área interna `Documentos do Produto`, disponível em `/admin/product-docs`.

A tela expõe uma seleção controlada de documentos estratégicos do Genius Support OS para consulta interna. Ela complementa o `Diário de Construção`: o Diário explica como o produto foi construído; Documentos do Produto apresenta a fonte oficial controlada que orienta visão, arquitetura, segurança, operação, design e governança.

Atualização de 2026-05-16: a fase `Build Journal Experience Upgrade V1` fez ajustes leves na UX de `/admin/product-docs` sem alterar o modelo da superfície. A rota continuou protegida pelo gate administrativo existente e limitada pela mesma whitelist explícita. Foram adicionados `Por onde começar`, trilhas de leitura por tema e copy mais clara para reforçar que a tela é fonte oficial controlada, não explorador de arquivos.

Atualização de 2026-06-17: a fase `Product Docs Governed Reader Polish` recuperou a superfície local após reset de banco e consolidou o consumo por contratos reais de documentos internos. A tela consome `vw_internal_documents_catalog` e `vw_internal_document_detail`, abre o primeiro documento autorizado, exibe cockpit de três zonas, rail de governança e índice interno derivado do markdown sanitizado. A recuperação local usa `npm run documentation:sync:internal-docs:local`, restrito ao Supabase local e sem gravar secrets.

Adendo de direção para a próxima rodada: `Product Docs` deve evoluir de reader estático simples para biblioteca documental curada por trilhas, ainda baseada apenas em markdowns explicitamente aprovados. A direção aprovada inclui aprofundamento por:

- visão e estratégia;
- arquitetura;
- segurança e permissões;
- Support;
- Knowledge;
- Customer Portal;
- Engineering;
- Diário de Construção e governança documental.

Essa expansão deve permitir leitura do conteúdo original dos markdowns aprovados, sem backend novo, sem parser dinâmico, sem busca backend e sem leitura arbitrária do repositório.

## Lista permitida
A V1 usa whitelist explícita e versionada. Apenas estes documentos podem aparecer:

- `PRODUCT.md`
- `DESIGN.md`
- `docs/PRODUCT_VISION.md`
- `docs/ARCHITECTURE_RULES.md`
- `docs/AUTH_CONTEXT_STRATEGY.md`
- `docs/ROADMAP_BUILDOUT_V3.md`
- `docs/PROJECT_STATE.md`
- `docs/DOCUMENTATION_LEDGER.md`
- `docs/SUPPORT_WORKFLOW.md`
- `docs/ENGINEERING_WORKFLOW.md`
- `docs/BUILD_JOURNAL_STRATEGY.md`
- `docs/BUILD_JOURNAL_SCREEN_SPEC.md`

Não há explorador genérico de arquivos, parser dinâmico de filesystem, indexação livre de docs ou leitura arbitrária de markdown. O runtime lê somente documentos sincronizados e autorizados pelos contratos de documentos internos.

## Acesso
A rota fica dentro do bloco `/admin` e usa o `AdminGate` administrativo existente.

Limitação da V1: ainda não existe permissão granular dedicada para `product-docs`. Até existir contrato backend específico, o acesso fica limitado ao gate administrativo consolidado do Admin Console.

## Política de sanitização
O conteúdo exibido é oficial, editorial, sanitizado e versionado. O frontend renderiza apenas o markdown sanitizado retornado pelo contrato de detalhe e pode receber omissões quando a exposição ampla dentro da UI administrativa não for necessária.

Quando houver omissão, usar:

```text
[conteúdo interno restrito omitido]
```

A tela não pode expor:

- secrets, tokens, credenciais, chaves ou senhas;
- e-mails reais;
- nomes reais de clientes;
- tickets reais;
- payloads crus;
- logs crus;
- stack traces;
- headers;
- cookies;
- JWT ou refresh token;
- URL assinada;
- storage path sensível;
- metadata bruta de auditoria;
- `before_state` ou `after_state` bruto;
- instruções de bypass de RLS, policy ou grants.

## Limites da V1
- Sem backend novo nesta fase de polish.
- Sem migration nova nesta fase de polish.
- Sem tabela nova nesta fase de polish.
- Sem RPC nova nesta fase de polish.
- Sem RLS nova nesta fase de polish.
- Sem fixture nova nesta fase de polish.
- Sem contrato novo nesta fase de polish.
- Sem busca backend.
- Sem busca semântica.
- Sem IA.
- Sem upload ou anexo documental.

## Diferença para o Diário de Construção
`Diário de Construção`:

- explica o processo de criação;
- mostra narrativa de fases;
- registra colaboração Humano + ChatGPT + Codex;
- destaca decisões, limites e próximos passos.

`Documentos do Produto`:

- expõe uma biblioteca interna controlada;
- oferece uma porta de entrada `Por onde começar`;
- oferece trilhas de leitura por tema;
- agrupa documentos oficiais por categoria;
- permite busca local simples no catálogo;
- mostra status, sensibilidade, origem e conteúdo sanitizado;
- reforça a whitelist documental.

## Riscos futuros
- Permissão granular pode ser necessária se perfis internos diferentes precisarem de acesso parcial.
- Conteúdo dinâmico exige contrato backend antes de qualquer UI.
- Busca semântica ou IA exige governança, fonte citável e sanitização adicional.
- Exibir markdown completo sem curadoria aumenta risco de vazar detalhes operacionais desnecessários.
- Prints, anexos ou histórico documental em banco exigem modelagem, policy e testes próprios.
- Se a seleção interna do documento precisar persistir na URL durante a navegação da tela, será necessária estratégia própria de roteamento/estado para não reintroduzir repaint visual ou flicker.
- QA manual autenticada em browser real continua recomendada após mudanças visuais relevantes na área.

## Critério de manutenção
Qualquer novo documento precisa ser adicionado explicitamente à whitelist, revisado quanto à sensibilidade e registrado no `DOCUMENTATION_LEDGER.md` quando alterar a superfície interna.
