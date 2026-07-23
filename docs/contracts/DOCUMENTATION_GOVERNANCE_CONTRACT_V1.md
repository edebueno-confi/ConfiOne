# Documentation Governance Contract V1

## Objetivo

Garantir que a documentação do Genius Support OS seja canônica, rastreável e segura, preservando histórico sem permitir que documentos antigos orientem novas decisões.

## MUST

- Documentos canônicos atuais devem prevalecer sobre histórico.
- Toda mudança estrutural relevante deve atualizar documentação canônica.
- Documentos históricos devem ser classificados como atual, histórico, substituído, descartado, experimental ou obsoleto.
- O Diário de Construção deve ser camada narrativa, não fonte técnica oficial.
- Product Docs deve abrir apenas documentos governados e autorizados.
- Resumos editoriais devem apontar para Markdown original quando disponível.
- Arquivos sensíveis nunca devem ser publicados em superfícies de leitura.
- Handoffs entre agentes devem usar Context Pack ou relatório delta.

## SHOULD

- Revisar o Diário por marcos, não a cada commit.
- Manter índice cronológico de decisões relevantes.
- Registrar decisões, impactos, participação de IA e documentos relacionados.
- Evitar duplicação textual extensa entre resumo editorial e documento canônico.
- Manter `DOCUMENTATION_LEDGER.md` como trilha de macro-lotes.

## MUST NOT

- Não usar `docs/GPT/` como plano corrente contra documento canônico mais recente.
- Não transformar Diário em documentação técnica paralela.
- Não substituir documento existente silenciosamente sem comparar data/conteúdo.
- Não publicar screenshots ou dumps sensíveis como fontes permanentes.
- Não remover documentação histórica sem registrar motivo e classificação.

## Critérios de aceite

- Existe hierarquia documental clara.
- Toda fonte usada tem status ou precedência definida.
- Documentos obsoletos não aparecem como decisão atual.
- O Context Pack reflete o estado real quando usado em handoff.
- Mudança estrutural tem documentação correspondente.

## Evidências obrigatórias

- Lista de documentos alterados.
- Motivo da atualização.
- Classificação de documentos impactados.
- Relatório delta quando houver macro-lote.
- Confirmação de ausência de secrets quando houver publicação externa.

## Condições de reprovação

- Documento antigo usado como verdade atual sem verificação.
- Diário contradiz documentação canônica.
- Duplicidade sem status ou fonte original.
- Arquivo sensível incluído em pacote ou fonte permanente.
- Handoff sem estado Git e limitações.

## Processo de exceção

Exceções exigem:

- aprovação humana;
- justificativa;
- prazo para reconciliação;
- marcação explícita do status do documento.

## Automatização futura

- Auditoria de links e slugs documentais.
- Detecção de documentos sem classificação.
- Validação de Context Pack.
- Scanner de termos sensíveis antes de upload.
- Checagem de precedência documental.
