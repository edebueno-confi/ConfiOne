# Central de Ajuda — contatos centralizados e artigo em revisão — 2026-07-20

## Decisão

Os dados operacionais de contato não ficam mais embutidos no corpo dos artigos.
Eles são configurados uma vez em `Configurações → Central de ajuda` e exibidos
no rodapé da Central de Ajuda pública:

- WhatsApp: `(41) 98765-2115`
- E-mail: `ede.oliveira@confi.com.vc`
- Site: `https://www.geniusreturns.com.br/`

O export original do Octadesk permanece preservado como fonte histórica. O
reprocessamento remove os contatos incorporados do conteúdo derivado, sem
alterar o export. Assim, uma mudança futura exige somente a atualização da
configuração do espaço de conhecimento.

## Operação

O painel administrativo usa a RPC auditada
`rpc_admin_update_knowledge_space_support_contacts`. A view administrativa
apresenta a configuração atual apenas para administradores autorizados. A
view pública sanitiza os campos e expõe somente os contatos configurados para
o rodapé.

## Artigo desatualizado

O artigo `Como alterar ou aprovar os produtos de uma solicitação?` foi marcado
como `review/internal` e retirado da superfície pública. Nenhum procedimento
novo foi inventado. A publicação depende de uma versão revisada e confirmada
pela equipe responsável.

## Validação local

- Migrations aplicadas: `20260720234000` e `20260720234100`.
- Suíte pgTAP: 67 arquivos e 1.192 testes aprovados.
- `npm run web:typecheck`: aprovado.
- Espaço `genius`: 42 artigos públicos.
- Assets: 118 catalogados, 97 públicos e 21 privados.
- Resolver público confirmou e-mail, WhatsApp e site no contrato do espaço.
- O artigo em revisão não contém os contatos antigos e permanece interno.

## Pendência

Obter o procedimento oficial atualizado do artigo sinalizado, revisar o texto
e somente então submetê-lo novamente ao fluxo editorial de publicação.
