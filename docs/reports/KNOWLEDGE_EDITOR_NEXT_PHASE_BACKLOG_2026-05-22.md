# Backlog - Próxima Fase do Editor de Knowledge

Data: 2026-05-22
Workspace: `C:\Trabalho`

## Prioridade alta

1. Fechar staging seletivo e commit limpo da frente de Knowledge.
2. Validar em browser, com roteiro formal:
   - toolbar completa;
   - persistência após salvar e recarregar;
   - tags adicionadas e removidas;
   - bloco `Leia também` com artigo real elegível;
   - comportamento de imagem e vídeo após reload.
3. Revisar fidelidade visual contra blueprint aprovado.
4. Garantir que `Salvar alterações` nunca publique.
5. Validar fluxo governado de publicação com feedback claro ao operador.

## Prioridade média

1. Consolidar o fluxo de `Leia também` com busca operacional mais robusta.
2. Revisar densidade visual da coluna editorial esquerda.
3. Refinar a UX de toolbar para estados ativos, seleção e inserção de blocos.
4. Revisar a serialização dos blocos para reduzir divergência entre editor e artigo público.

## Prioridade estrutural

1. Parar de polir telas isoladas sem contrato real.
2. Voltar ao buildout funcional da plataforma.
3. Conectar CRUDs e ações reais em:
   - Support;
   - Knowledge;
   - Portal;
   - Admin;
   - Engineering.
4. Eliminar botões decorativos e fluxos incompletos.
5. Consolidar rotas e navegação operacional integrada.

## Critério de retomada

Ao reabrir esta frente:

- começar por auditoria do `git status`;
- validar se o commit da fase do editor já foi isolado;
- não assumir que o restante do repositório está limpo;
- tratar suporte, docs e blueprints fora da Knowledge como linhas paralelas até prova em contrário.

