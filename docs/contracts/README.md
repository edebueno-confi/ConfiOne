# Contratos iniciais do Genius Support OS

Esta pasta consolida contratos normativos para orientar os próximos macro-lotes do Genius Support OS. Eles não implementam validadores neste lote; definem regras objetivas para avaliação humana e futura automação.

## Contratos

- `UX_NAVIGATION_DESIGN_CONTRACT_V1.md`
- `AI_CORE_READINESS_CONTRACT_V1.md`
- `CODE_QUALITY_AUDITABILITY_CONTRACT_V1.md`
- `DELIVERY_EVIDENCE_CONTRACT_V1.md`
- `DOCUMENTATION_GOVERNANCE_CONTRACT_V1.md`

## Uso obrigatório

- Antes de alterar UX, navegação ou shell, leia o contrato de UX.
- Antes de expor recurso de IA, leia o contrato de AI Core.
- Antes de concluir macro-lote de código, leia o contrato de qualidade.
- Antes de declarar entrega validada, leia o contrato de evidência.
- Antes de alterar documentação canônica, Product Docs ou Diário de Construção, leia o contrato de governança documental.

## Automação futura

Os contratos podem ser automatizados gradualmente por:

- lint e typecheck;
- testes unitários, integração e pgTAP;
- scripts de auditoria documental;
- Playwright para evidência visual;
- checks de rotas, permissões e responsividade;
- verificação de tokens de design e copy proibida.

Neste lote não foram criados validadores.
